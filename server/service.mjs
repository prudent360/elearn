import { randomUUID, randomInt } from 'node:crypto';
import { hashPassword, verifyPassword, newToken, digest, readSession, sessionCookie } from './auth.mjs';
import { createConsoleMailer, verificationEmailHtml } from './mail.mjs';
import { billingConfigured, createCheckout, createPortal, verifyStripeEvent } from './billing.mjs';
const now=()=>new Date().toISOString();
class HttpError extends Error {constructor(status,message){super(message);this.status=status}}
const fail=(status,message)=>{throw new HttpError(status,message)};
function text(value,label,max=200,optional=false){if(typeof value!=='string'||(!optional&&!value.trim())||value.length>max)fail(400,`${label} must be ${optional?'at most':'between 1 and'} ${max} characters.`);return value.trim()}
function webUrl(value,label,optional=true){const v=text(value||'',label,2000,optional);if(!v)return '';try{if(new URL(v).protocol!=='https:')throw Error()}catch{fail(400,`${label} must be an HTTPS URL.`)}return v}
async function readBody(request){if(!request.headers.get('content-type')?.includes('application/json'))fail(415,'Send a JSON request.');const reader=request.body?.getReader();if(!reader)return {};let size=0;const parts=[];for(;;){const {done,value}=await reader.read();if(done)break;size+=value.byteLength;if(size>524288){await reader.cancel();fail(413,'Request too large.')}parts.push(value)}let result;try{result=JSON.parse(Buffer.concat(parts).toString())}catch{fail(400,'Invalid JSON.')}if(!result||typeof result!=='object'||Array.isArray(result))fail(400,'Expected a JSON object.');return result}
const publicUser=u=>({id:u.id,email:u.email,name:u.name,role:u.role,disabled:!!u.disabled,emailVerified:!!u.email_verified_at});
const USER_WITH_VERIFICATION="SELECT u.*, ev.verified_at AS email_verified_at FROM users u LEFT JOIN email_verifications ev ON ev.user_id=u.id";
export function createService(db,seed=[],options={}) {
  const mailer=options.mail||createConsoleMailer();
  const externalRequest=request=>({url:options.origin||request.url,headers:request.headers});
  const all=(sql,...args)=>db.all(sql,args), get=(sql,...args)=>db.get(sql,args), run=(sql,...args)=>db.run(sql,args);
  async function sendMail(message){try{await mailer.send(message)}catch(error){console.error('Email delivery threw an error',error.message)}}
  async function createEmailToken(userId,kind,ttlMs){const raw=newToken();await db.batch([['DELETE FROM email_tokens WHERE user_id=? AND kind=?',[userId,kind]],['INSERT INTO email_tokens(id,user_id,kind,token_hash,expires_at,created_at) VALUES(?,?,?,?,?,?)',[randomUUID(),userId,kind,digest(raw),Date.now()+ttlMs,now()]]]);return raw}
  async function consumeEmailToken(rawToken,kind){if(typeof rawToken!=='string'||!rawToken)fail(400,'This link is invalid or has expired.');const row=await get('SELECT * FROM email_tokens WHERE token_hash=? AND kind=?',digest(rawToken),kind);if(!row||row.expires_at<Date.now())fail(400,'This link is invalid or has expired.');await run('DELETE FROM email_tokens WHERE id=?',row.id);return row.user_id}
  // Email verification uses a short numeric code (shown in boxes in the email) rather than a link,
  // since it's entered back into the app while the user is already signed in.
  async function createVerificationCode(userId){const code=String(randomInt(0,1000000)).padStart(6,'0');await db.batch([['DELETE FROM email_tokens WHERE user_id=? AND kind=?',[userId,'verify']],['INSERT INTO email_tokens(id,user_id,kind,token_hash,expires_at,created_at) VALUES(?,?,?,?,?,?)',[randomUUID(),userId,'verify',digest(code),Date.now()+900000,now()]]]);return code}
  async function consumeVerificationCode(userId,code){if(typeof code!=='string'||!/^[0-9]{6}$/.test(code))fail(400,'Enter the 6-digit code from your email.');const row=await get('SELECT * FROM email_tokens WHERE user_id=? AND kind=? AND token_hash=?',userId,'verify',digest(code));if(!row||row.expires_at<Date.now())fail(400,'That code is incorrect or has expired.');await run('DELETE FROM email_tokens WHERE id=?',row.id)}
  async function sendVerificationCode(user,siteOrigin){const code=await createVerificationCode(user.id);await sendMail({to:user.email,subject:'Verify your email address',text:`Enter this code to verify your email address and finish setting up your Tekskillup Academy account:\n\n${code}\n\nThis code expires in 15 minutes. If you didn't create an account on Tekskillup Academy, you can safely ignore this email.`,html:verificationEmailHtml({code,email:user.email,siteOrigin})})}
  async function seedCourses(){
    if(!(await get('SELECT id FROM courses LIMIT 1'))){
      const statements=[];
      for(let sourceIndex=0;sourceIndex<seed.length;sourceIndex++){const source=seed[sourceIndex];const {modules,...metadata}=source;metadata.progress=0;metadata.saved=false;metadata.status='available';metadata.access=metadata.access||(sourceIndex===0?'free':'pro');
        statements.push(['INSERT OR IGNORE INTO courses(id,publication,metadata,created_at,updated_at) VALUES(?,?,?,?,?)',[source.id,'published',JSON.stringify(metadata),now(),now()]]);
        (modules||[]).forEach((module,mi)=>module.lessons.forEach((lesson,li)=>{const content={...lesson,completed:false};delete content.videoUrl;if(content.type==='video')content.type='reading';
          statements.push(['INSERT OR IGNORE INTO lessons(id,course_id,module_title,module_position,position,content) VALUES(?,?,?,?,?,?)',[lesson.id,source.id,module.title,mi,li,JSON.stringify(content)]]);
          if(lesson.type==='assignment')statements.push(['INSERT OR IGNORE INTO assignments(id,course_id,title,instructions) VALUES(?,?,?,?)',[`assignment-${lesson.id}`,source.id,lesson.title,lesson.exercise||lesson.overview||'Submit your work for instructor review.']]);
        }));
      }if(statements.length)await db.batch(statements);
    }
    const existing=await all('SELECT id,metadata FROM courses ORDER BY created_at');
    const accessUpdates=[];for(let index=0;index<existing.length;index++){const metadata=JSON.parse(existing[index].metadata);if(!metadata.access){metadata.access=index===0?'free':'pro';accessUpdates.push(['UPDATE courses SET metadata=? WHERE id=?',[JSON.stringify(metadata),existing[index].id]])}}
    if(accessUpdates.length)await db.batch(accessUpdates);
    // Only course content is seeded. Learner identities, activity, grades, and certificates are
    // never fabricated, and no account — including an administrator — is pre-created with a known
    // password: the first administrator must always come through the /login setup-token flow.
  }
  let ready;
  async function currentUser(request,required=true){const token=readSession(externalRequest(request));const user=token&&await get('SELECT u.*, ev.verified_at AS email_verified_at FROM users u JOIN sessions s ON u.id=s.user_id LEFT JOIN email_verifications ev ON ev.user_id=u.id WHERE s.token_hash=? AND s.expires_at>? AND u.disabled=0',digest(token),Date.now());if(!user&&required)fail(401,'Please sign in.');return user||null}
  async function limit(key,max){const stamp=Date.now();await run('INSERT INTO rate_limits(key,attempts,expires_at) VALUES(?,1,?) ON CONFLICT(key) DO UPDATE SET attempts=CASE WHEN expires_at<? THEN 1 ELSE attempts+1 END, expires_at=CASE WHEN expires_at<? THEN excluded.expires_at ELSE expires_at END',digest(key),stamp+900000,stamp,stamp);const value=await get('SELECT attempts FROM rate_limits WHERE key=?',digest(key));if(value.attempts>max)fail(429,'Too many attempts. Try again in 15 minutes.')}
  function staff(user){if(!['admin','instructor'].includes(user.role))fail(403,'Instructor access required.')}
  function admin(user){if(user.role!=='admin')fail(403,'Administrator access required.')}
  async function owned(user,id){staff(user);const course=await get('SELECT * FROM courses WHERE id=?',id);if(!course)fail(404,'Course not found.');if(user.role!=='admin'&&course.owner_id!==user.id)fail(403,'This course belongs to another instructor.');return course}
  async function enrolled(user,id){const row=await get('SELECT e.* FROM enrollments e JOIN courses c ON e.course_id=c.id WHERE e.user_id=? AND e.course_id=? AND c.publication=?',user.id,id,'published');if(!row)fail(403,'Enroll in an available course to access its lessons.');return row}
  async function lessonAccess(user,id){const lesson=await get('SELECT * FROM lessons WHERE id=?',id);if(!lesson)fail(404,'Lesson not found.');await enrolled(user,lesson.course_id);return lesson}
  async function audit(user,action,target){await run('INSERT INTO audit_log VALUES(?,?,?,?,?)',randomUUID(),user.id,action,target,now())}
  async function billingState(user){
    const subscription=await get('SELECT * FROM subscriptions WHERE user_id=?',user.id);
    const customer=await get('SELECT stripe_customer_id FROM billing_customers WHERE user_id=?',user.id);
    const active=!!subscription&&['active','trialing'].includes(subscription.status);
    return {configured:billingConfigured(options.stripe),plan:active?'pro':'free',subscription:subscription?{status:subscription.status,planKey:subscription.plan_key,currentPeriodEnd:subscription.current_period_end,cancelAtPeriodEnd:!!subscription.cancel_at_period_end}:null,canManage:!!customer};
  }
  async function courseList(user,manage=false){
    const rows=manage?await all(user.role==='admin'?'SELECT * FROM courses ORDER BY created_at DESC':'SELECT * FROM courses WHERE owner_id=? ORDER BY created_at DESC',...(user.role==='admin'?[]:[user.id])):await all("SELECT * FROM courses WHERE publication='published' ORDER BY created_at");
    const completions=await all('SELECT lesson_id FROM progress WHERE user_id=? AND completed_at IS NOT NULL',user.id);const done=new Set(completions.map(p=>p.lesson_id));
    const enrollmentRows=await all('SELECT course_id FROM enrollments WHERE user_id=?',user.id);const enrollments=new Set(enrollmentRows.map(e=>e.course_id));
    const saved=new Set((await all('SELECT course_id FROM bookmarks WHERE user_id=?',user.id)).map(e=>e.course_id));
    return Promise.all(rows.map(async row=>{
      const lessonRows=await all('SELECT * FROM lessons WHERE course_id=? ORDER BY module_position,position',row.id);const modules=[];
      const authorized=manage||enrollments.has(row.id);
      for(const lesson of lessonRows){if(!modules[lesson.module_position])modules[lesson.module_position]={title:lesson.module_title,lessons:[]};const content=JSON.parse(lesson.content);if(!authorized){delete content.overview;delete content.exercise;delete content.videoUrl;}modules[lesson.module_position].lessons.push({...content,id:lesson.id,completed:done.has(lesson.id)})}
      const total=lessonRows.length;const count=lessonRows.filter(l=>done.has(l.id)).length;const progress=total?Math.round(count/total*100):0;
      return {...JSON.parse(row.metadata),id:row.id,modules:modules.filter(Boolean),progress,status:enrollments.has(row.id)?progress===100?'completed':'in-progress':'available',saved:saved.has(row.id),publication:row.publication,ownerId:row.owner_id,enrollmentCount:manage?(await get('SELECT COUNT(*) AS n FROM enrollments WHERE course_id=?',row.id)).n:undefined};
    }));
  }
  async function snapshot(user){
    const courses=await courseList(user);const profile=JSON.parse(user.profile);const settings=JSON.parse(user.settings);
    const savedCourses=(await all('SELECT course_id FROM bookmarks WHERE user_id=?',user.id)).map(x=>x.course_id);
    const enrolledCourses=(await all('SELECT course_id FROM enrollments WHERE user_id=?',user.id)).map(x=>x.course_id);
    const notes=await all('SELECT lesson_id,body FROM notes WHERE user_id=?',user.id);
    const progress=await all('SELECT p.*,l.course_id,l.content FROM progress p JOIN lessons l ON p.lesson_id=l.id WHERE p.user_id=? ORDER BY last_seen DESC',user.id);
    const certificates=await all('SELECT c.*,co.metadata FROM certificates c JOIN courses co ON co.id=c.course_id WHERE c.user_id=? ORDER BY issued_at DESC',user.id);
    const attachmentRows=await all('SELECT id,assignment_id,filename,byte_size FROM attachments WHERE user_id=?',user.id);
    const assignments=await all("SELECT a.*,c.metadata,s.id AS submission_id,s.status,s.body,s.repo_url,s.score,s.feedback,s.submitted_at FROM assignments a JOIN courses c ON c.id=a.course_id JOIN enrollments e ON e.course_id=a.course_id AND e.user_id=? LEFT JOIN submissions s ON s.assignment_id=a.id AND s.user_id=? WHERE c.publication='published'",user.id,user.id);
    const threads=await all('SELECT t.*,u.name,u.profile,(SELECT COUNT(*) FROM votes v WHERE v.thread_id=t.id) AS upvotes,(SELECT COUNT(*) FROM replies r WHERE r.thread_id=t.id) AS commentsCount FROM threads t JOIN users u ON u.id=t.author_id ORDER BY t.created_at DESC LIMIT 100');
    const live=await all("SELECT l.*,u.name FROM live_classes l JOIN users u ON u.id=l.host_id JOIN enrollments e ON e.course_id=l.course_id AND e.user_id=? WHERE l.starts_at>? ORDER BY starts_at LIMIT 50",user.id,now());
    const completed=progress.filter(p=>p.completed_at);const minutes=completed.reduce((sum,p)=>sum+(parseInt(JSON.parse(p.content).duration)||0),0);
    const days=new Map();for(const item of completed){const day=item.completed_at.slice(0,10);days.set(day,(days.get(day)||0)+(parseInt(JSON.parse(item.content).duration)||0));}
    const dateAt=offset=>new Date(Date.now()+offset*86400000).toISOString().slice(0,10);
    let streak=0;let offset=days.has(dateAt(0))?0:-1;while(days.has(dateAt(offset))){streak++;offset--;}
    const weeklyStats=Array.from({length:7},(_,i)=>{const date=dateAt(i-6);return {day:new Date(date+'T12:00:00Z').toLocaleDateString('en-US',{weekday:'short',timeZone:'UTC'}),minutes:days.get(date)||0,date}});
    const categoryMinutes={};for(const item of completed){const course=courses.find(c=>c.id===item.course_id);if(course)categoryMinutes[course.category]=(categoryMinutes[course.category]||0)+(parseInt(JSON.parse(item.content).duration)||0);}
    const categoryBreakdown=Object.entries(categoryMinutes).map(([category,value])=>({category,hours:Math.round(value/60*10)/10,percentage:minutes?Math.round(value/minutes*100):0,color:'var(--accent-primary)'}));
    const recentSessions=completed.slice(0,10).map(item=>({id:item.lesson_id,date:item.completed_at.slice(0,10),courseTitle:courses.find(c=>c.id===item.course_id)?.title||'Course',lessonTitle:JSON.parse(item.content).title,duration:JSON.parse(item.content).duration,xp:0}));
    return {user:publicUser(user),billing:await billingState(user),courses,savedCourses,enrolledCourses,userNotes:Object.fromEntries(notes.map(n=>[n.lesson_id,n.body])),settings,
      currentUser:{name:user.name,role:profile.headline||user.role,avatar:profile.avatar||'',streakDays:streak,level:'Learner',hoursLearned:Math.round(minutes/60*10)/10,coursesCompleted:courses.filter(c=>c.status==='completed').length,certificatesCount:certificates.length,skills:[],achievements:[],activityMap:Array.from({length:364},(_,i)=>Math.min(4,Math.ceil((days.get(dateAt(i-363))||0)/30))),weeklyGoalHours:settings.weeklyGoalHours??5,weeklyStats,categoryBreakdown,recentSessions},
      continueCourse:progress[0]?.course_id||enrolledCourses[0]||courses[0]?.id||null,
      lastLessons:Object.fromEntries([...progress].reverse().map(p=>[p.course_id,p.lesson_id])),
      assignments:assignments.map(a=>({id:a.id,courseId:a.course_id,title:a.title,instructions:a.instructions,courseTitle:JSON.parse(a.metadata).title,status:a.status||'to-do',dueDate:a.due_date||'No deadline',score:a.score===null?undefined:a.score+'/100',instructorFeedback:a.feedback||'',submissionId:a.submission_id,body:a.body||'',repoUrl:a.repo_url||'',attachments:attachmentRows.filter(file=>file.assignment_id===a.id)})),
      certificates:certificates.map(c=>({id:c.id,title:JSON.parse(c.metadata).title,issuedBy:'Tekskillup Academy',issueDate:c.issued_at.slice(0,10),credentialId:c.id,verifyUrl:'/api/certificates/'+c.id,grade:'Completed',skills:JSON.parse(c.metadata).outcomes||[],thumbnail:JSON.parse(c.metadata).thumbnail||''})),
      communityThreads:threads.map(t=>({id:t.id,channel:t.channel,title:t.title,content:t.body,author:t.name,authorAvatar:JSON.parse(t.profile).avatar||'',timeAgo:t.created_at,upvotes:t.upvotes,commentsCount:t.commentsCount})),
      upcomingLiveClasses:live.map(l=>({id:l.id,title:l.title,host:l.name,hostAvatar:'',date:l.starts_at.slice(0,10),time:l.starts_at.slice(11,16)+' UTC',status:'upcoming',attendees:'',meetingUrl:l.meeting_url})),pastRecordings:[]};
  }
  async function handle(request){
    try {
      ready??=seedCourses().catch(error=>{ready=undefined;throw error});await ready;
      const url=new URL(request.url);const path=url.pathname.replace(/^\/api\/?/,'').split('/').filter(Boolean).map(decodeURIComponent);const method=request.method;
      const siteOrigin=options.origin||url.origin;
      if(path[0]==='billing'&&path[1]==='webhook'&&method==='POST'){
        let event;try{const raw=await request.text();event=await verifyStripeEvent(raw,request.headers.get('stripe-signature'),options.stripe?.webhookSecret)}catch{fail(400,'Invalid Stripe webhook.');}
        if(!event?.id||!event?.type||!event?.data?.object)fail(400,'Invalid Stripe event.');
        if(await get('SELECT event_id FROM stripe_events WHERE event_id=?',event.id))return reply({received:true});
        const object=event.data.object;const statements=[];
        if(event.type==='checkout.session.completed'){
          const userId=object.client_reference_id||object.metadata?.user_id;
          if(userId&&object.customer)statements.push(['INSERT INTO billing_customers(user_id,stripe_customer_id,created_at) VALUES(?,?,?) ON CONFLICT(user_id) DO UPDATE SET stripe_customer_id=excluded.stripe_customer_id',[userId,object.customer,now()]]);
          if(userId&&object.subscription){const plan=object.metadata?.plan_key||'pro-monthly';const price=options.stripe?.prices?.[plan]||'';statements.push(['INSERT INTO subscriptions(user_id,stripe_subscription_id,plan_key,price_id,status,updated_at) VALUES(?,?,?,?,?,?) ON CONFLICT(user_id) DO UPDATE SET stripe_subscription_id=excluded.stripe_subscription_id,plan_key=excluded.plan_key,price_id=excluded.price_id,status=excluded.status,updated_at=excluded.updated_at',[userId,object.subscription,plan,price,'active',now()]])}
        }
        if(event.type.startsWith('customer.subscription.')){
          const customerId=typeof object.customer==='string'?object.customer:object.customer?.id;const customer=customerId&&await get('SELECT user_id FROM billing_customers WHERE stripe_customer_id=?',customerId);const userId=object.metadata?.user_id||customer?.user_id;
          if(userId){const item=object.items?.data?.[0]||{};const priceId=typeof item.price==='string'?item.price:item.price?.id||'';const plan=object.metadata?.plan_key||Object.entries(options.stripe?.prices||{}).find(([,id])=>id===priceId)?.[0]||'pro-monthly';const period=object.current_period_end||item.current_period_end;statements.push(['INSERT INTO subscriptions(user_id,stripe_subscription_id,plan_key,price_id,status,current_period_end,cancel_at_period_end,updated_at) VALUES(?,?,?,?,?,?,?,?) ON CONFLICT(user_id) DO UPDATE SET stripe_subscription_id=excluded.stripe_subscription_id,plan_key=excluded.plan_key,price_id=excluded.price_id,status=excluded.status,current_period_end=excluded.current_period_end,cancel_at_period_end=excluded.cancel_at_period_end,updated_at=excluded.updated_at',[userId,object.id,plan,priceId,object.status||'canceled',period?new Date(period*1000).toISOString():null,object.cancel_at_period_end?1:0,now()]])}
        }
        statements.push(['INSERT OR IGNORE INTO stripe_events VALUES(?,?,?)',[event.id,event.type,now()]]);await db.batch(statements);return reply({received:true});
      }
      if(!['GET','HEAD'].includes(method)){
        const origin=request.headers.get('origin');
        const allowedOrigins=[url.origin, options.origin, 'http://localhost:3000', 'http://localhost:3001', 'http://localhost:3002'].filter(Boolean);
        if(origin && !allowedOrigins.includes(origin)) fail(403,'Request origin is not allowed.');
        if(request.headers.get('sec-fetch-site')==='cross-site')fail(403,'Cross-site requests are not allowed.');
      }
      const isUpload=path[0]==='assignments'&&path[2]==='attachment'&&method==='POST';
      const body=['POST','PUT','PATCH'].includes(method)&&!isUpload?await readBody(request):{};
      if(path[0]==='auth'){
        if(method==='GET'&&path[1]==='session'){const user=await currentUser(request,false);return reply({user:user?publicUser(user):null,setupRequired:!(await get("SELECT id FROM users WHERE role='admin' LIMIT 1"))})}
        if(method==='POST'&&['register','login','setup'].includes(path[1])){
          const email=text(body.email,'Email',254).toLowerCase();if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))fail(400,'Enter a valid email.');
          const password=body.password;const minimum=path[1]==='login'?6:12;if(typeof password!=='string'||password.length<minimum||password.length>128)fail(400,path[1]==='login'?'Email or password is incorrect.':'Use a password between 12 and 128 characters.');
          await limit('auth:'+email,12);await limit('auth-global',500);
          let user,newAccount=false;
          if(path[1]==='login'){
            user=await get(USER_WITH_VERIFICATION+' WHERE u.email=?',email);
            const valid=await verifyPassword(password,user?.password_hash||'scrypt:00000000000000000000000000000000:'+('00'.repeat(64)));
            if(!user||!valid||user.disabled)fail(401,'Email or password is incorrect.');
          }else{
            const name=text(body.name,'Name',100);let role='learner';
            if(path[1]==='setup'){
              if(!options.setupToken||typeof body.setupToken!=='string'||digest(body.setupToken)!==digest(options.setupToken))fail(403,'The administrator setup credential is invalid.');
              if(await get("SELECT id FROM users WHERE role='admin' LIMIT 1"))fail(409,'Administrator setup is already complete.');role='admin';
            }
            if(await get('SELECT id FROM users WHERE email=?',email))fail(409,'Unable to create this account. Try signing in.');
            const id=randomUUID();const hash=await hashPassword(password);
            await run(role==='admin'?"INSERT INTO users(id,email,name,password_hash,role,created_at) SELECT ?,?,?,?,?,? WHERE NOT EXISTS(SELECT 1 FROM users WHERE role='admin')":'INSERT INTO users(id,email,name,password_hash,role,created_at) VALUES(?,?,?,?,?,?)',id,email,name,hash,role,now());
            user=await get('SELECT * FROM users WHERE id=?',id);if(!user)fail(409,'Administrator setup is already complete.');newAccount=true;
          }
          const token=newToken();await db.batch([['DELETE FROM sessions WHERE expires_at<?',[Date.now()]],['INSERT INTO sessions VALUES(?,?,?)',[digest(token),user.id,Date.now()+604800000]]]);
          if(newAccount)await sendVerificationCode(user,siteOrigin);
          return reply({user:publicUser(user)},200,{'Set-Cookie':sessionCookie(token,externalRequest(request))});
        }
        if(method==='POST'&&path[1]==='logout'){const token=readSession(externalRequest(request));if(token)await run('DELETE FROM sessions WHERE token_hash=?',digest(token));return reply({ok:true},200,{'Set-Cookie':sessionCookie('',externalRequest(request),true)})}
        if(method==='POST'&&path[1]==='password'){
          const user=await currentUser(request);await limit('password:'+user.id,10);
          if(typeof body.currentPassword!=='string'||!(await verifyPassword(body.currentPassword,user.password_hash)))fail(401,'Current password is incorrect.');
          if(typeof body.password!=='string'||body.password.length<6||body.password.length>128)fail(400,'Use a password between 6 and 128 characters.');
          await db.batch([['UPDATE users SET password_hash=? WHERE id=?',[await hashPassword(body.password),user.id]],['DELETE FROM sessions WHERE user_id=?',[user.id]]]);return reply({ok:true},200,{'Set-Cookie':sessionCookie('',externalRequest(request),true)});
        }
        if(method==='POST'&&path[1]==='verify-email'){
          const user=await currentUser(request);await limit('verify-attempt:'+user.id,20);
          if(await get('SELECT 1 FROM email_verifications WHERE user_id=?',user.id))return reply({ok:true}); // already verified — idempotent
          await consumeVerificationCode(user.id,body.code);
          await run('INSERT OR IGNORE INTO email_verifications(user_id,verified_at) VALUES(?,?)',user.id,now());
          return reply({ok:true});
        }
        if(method==='POST'&&path[1]==='resend-verification'){
          const user=await currentUser(request);await limit('verify:'+user.id,5);
          if(await get('SELECT 1 FROM email_verifications WHERE user_id=?',user.id))fail(409,'Your email is already verified.');
          await sendVerificationCode(user,siteOrigin);
          return reply({ok:true});
        }
        if(method==='POST'&&path[1]==='reset-request'){
          const resetEmail=text(body.email,'Email',254).toLowerCase();await limit('reset:'+resetEmail,6);await limit('reset-global',300);
          const target=await get('SELECT * FROM users WHERE email=? AND disabled=0',resetEmail);
          if(target){const resetToken=await createEmailToken(target.id,'reset',3600000);
            await sendMail({to:target.email,subject:'Reset your Tekskillup Academy password',text:`Hi ${target.name},\n\nWe received a request to reset your password. Choose a new one:\n\n${siteOrigin}/reset-password?token=${resetToken}\n\nThis link expires in 1 hour. If you didn't request this, you can ignore this email — your password will not change.`});}
          return reply({ok:true}); // Always reply ok so this endpoint never reveals which emails have accounts.
        }
        if(method==='POST'&&path[1]==='reset'){
          if(typeof body.password!=='string'||body.password.length<12||body.password.length>128)fail(400,'Use a password between 12 and 128 characters.');
          const userId=await consumeEmailToken(body.token,'reset');
          await db.batch([['UPDATE users SET password_hash=? WHERE id=?',[await hashPassword(body.password),userId]],['DELETE FROM sessions WHERE user_id=?',[userId]],['DELETE FROM email_tokens WHERE user_id=? AND kind=?',[userId,'reset']]]);
          return reply({ok:true});
        }
        fail(404,'Unknown authentication endpoint.');
      }
      const user=await currentUser(request);
      if(!['GET','HEAD'].includes(method))await limit('write:'+user.id,1000);
      if(path[0]==='workspace'&&method==='GET')return reply(await snapshot(user));
      if(path[0]==='billing'){
        if(method==='GET'&&!path[1])return reply(await billingState(user));
        if(path[1]==='checkout'&&method==='POST'){
          if(!billingConfigured(options.stripe))fail(503,'Payments are not configured yet.');const plan=body.plan;if(!['pro-monthly','pro-yearly'].includes(plan))fail(400,'Choose a valid plan.');const state=await billingState(user);if(state.plan==='pro')fail(409,'You already have an active plan. Manage it from billing settings.');const customer=await get('SELECT stripe_customer_id FROM billing_customers WHERE user_id=?',user.id);let session;try{session=await createCheckout(options.stripe,{user,customerId:customer?.stripe_customer_id,plan,origin:siteOrigin.replace(/\/$/,'')})}catch(error){fail(502,error.message)}return reply({url:session.url});
        }
        if(path[1]==='portal'&&method==='POST'){
          const customer=await get('SELECT stripe_customer_id FROM billing_customers WHERE user_id=?',user.id);if(!customer)fail(409,'No billing account exists yet.');let session;try{session=await createPortal(options.stripe,{customerId:customer.stripe_customer_id,origin:siteOrigin.replace(/\/$/,'')})}catch(error){fail(502,error.message)}return reply({url:session.url});
        }
      }
      if(path[0]==='profile'&&method==='PATCH'){
        const profile=JSON.parse(user.profile);if(body.role!==undefined)profile.headline=text(body.role,'Headline',160,true);if(body.avatar!==undefined)profile.avatar=webUrl(body.avatar,'Avatar');
        await run('UPDATE users SET name=?,profile=? WHERE id=?',body.name===undefined?user.name:text(body.name,'Name',100),JSON.stringify(profile),user.id);return reply({ok:true});
      }
      if(path[0]==='settings'&&method==='PATCH'){
        const settings=JSON.parse(user.settings);
        if(body.weeklyGoalHours!==undefined){if(!Number.isInteger(body.weeklyGoalHours)||body.weeklyGoalHours<1||body.weeklyGoalHours>168)fail(400,'Weekly goal must be 1–168 hours.');settings.weeklyGoalHours=body.weeklyGoalHours}
        if(body.notifications){settings.notifications??={};for(const key of ['emailDigest','assignmentGraded','liveClassReminders','communityReplies'])if(body.notifications[key]!==undefined){if(typeof body.notifications[key]!=='boolean')fail(400,'Invalid notification preference.');settings.notifications[key]=body.notifications[key]}}
        if(body.workspace){settings.workspace??={};for(const key of ['timezone','language','density'])if(body.workspace[key]!==undefined)settings.workspace[key]=text(body.workspace[key],key,100)}
        await run('UPDATE users SET settings=? WHERE id=?',JSON.stringify(settings),user.id);return reply({ok:true});
      }
      if(path[0]==='courses'&&path[1]){
        const course=await get("SELECT * FROM courses WHERE id=? AND publication='published'",path[1]);if(!course)fail(404,'Course not found.');
        if(path[2]==='enrollment'&&method==='POST'){const metadata=JSON.parse(course.metadata);if(metadata.access==='pro'&&user.role==='learner'&&(await billingState(user)).plan!=='pro')fail(402,'This course is included with Pro. Choose a plan to enroll.');if(!(await get('SELECT id FROM lessons WHERE course_id=? LIMIT 1',course.id)))fail(409,'This course has no lessons yet.');await run('INSERT OR IGNORE INTO enrollments VALUES(?,?,?)',user.id,course.id,now());return reply({ok:true})}
        if(path[2]==='bookmark'&&['PUT','DELETE'].includes(method)){await run(method==='PUT'?'INSERT OR IGNORE INTO bookmarks VALUES(?,?)':'DELETE FROM bookmarks WHERE user_id=? AND course_id=?',user.id,course.id);return reply({ok:true})}
      }
      if(path[0]==='lessons'&&path[1]){
        const lesson=await lessonAccess(user,path[1]);
        if(path[2]==='note'&&method==='PUT'){text(body.note,'Note',50000,true);const note=body.note;await run('INSERT INTO notes VALUES(?,?,?,?) ON CONFLICT(user_id,lesson_id) DO UPDATE SET body=excluded.body,updated_at=excluded.updated_at',user.id,lesson.id,note,now());return reply({ok:true})}
        if(path[2]==='progress'&&method==='PUT'){
          if(body.completed!==true&&body.completed!==false)fail(400,'Specify whether the lesson is completed.');
          const stamp=now();await db.batch([
            ['INSERT INTO progress VALUES(?,?,?,?) ON CONFLICT(user_id,lesson_id) DO UPDATE SET completed_at=COALESCE(progress.completed_at,excluded.completed_at),last_seen=excluded.last_seen',[user.id,lesson.id,body.completed?stamp:null,stamp]],
            ["INSERT OR IGNORE INTO certificates(id,user_id,course_id,issued_at) SELECT ?,?,?,? WHERE NOT EXISTS(SELECT 1 FROM lessons l WHERE l.course_id=? AND NOT EXISTS(SELECT 1 FROM progress p WHERE p.user_id=? AND p.lesson_id=l.id AND p.completed_at IS NOT NULL)) AND NOT EXISTS(SELECT 1 FROM assignments a WHERE a.course_id=? AND NOT EXISTS(SELECT 1 FROM submissions s WHERE s.assignment_id=a.id AND s.user_id=? AND s.status='completed' AND s.score>=50))",[randomUUID(),user.id,lesson.course_id,stamp,lesson.course_id,user.id,lesson.course_id,user.id]]
          ]);return reply({ok:true});
        }
        if(path[2]==='resource'&&method==='GET'){const content=JSON.parse(lesson.content);return new Response(`${content.title}\n\n${content.overview||''}\n\nPractice\n${content.exercise||''}`,{headers:{'Content-Type':'text/plain; charset=utf-8','Content-Disposition':'attachment; filename="study-guide.txt"','Cache-Control':'no-store'}})}
      }
      if(path[0]==='files'&&path[1]&&method==='GET'){
        const attachment=await get('SELECT * FROM attachments WHERE id=?',path[1]);if(!attachment)fail(404,'File not found.');
        if(attachment.user_id!==user.id){const assignment=await get('SELECT course_id FROM assignments WHERE id=?',attachment.assignment_id);await owned(user,assignment.course_id);}
        const object=await options.files?.get(attachment.id);if(!object)fail(404,'File not found.');
        return new Response(object.body,{headers:{'Content-Type':attachment.content_type,'Content-Disposition':`attachment; filename*=UTF-8''${encodeURIComponent(attachment.filename)}`,'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});
      }
      if(isUpload){
        const assignment=await get('SELECT * FROM assignments WHERE id=?',path[1]);if(!assignment)fail(404,'Assignment not found.');await enrolled(user,assignment.course_id);
        if(!options.files)fail(503,'File storage is not configured.');
        const submitted=await get('SELECT status FROM submissions WHERE assignment_id=? AND user_id=?',assignment.id,user.id);if(submitted?.status==='completed')fail(409,'This assignment has already been graded.');
        if((await get('SELECT COUNT(*) AS n FROM attachments WHERE assignment_id=? AND user_id=?',assignment.id,user.id)).n>=5)fail(409,'Maximum five attachments per assignment.');
        const contentType=request.headers.get('content-type')?.split(';')[0];if(!['application/pdf','text/plain','application/zip','image/png','image/jpeg'].includes(contentType))fail(415,'Upload a PDF, text, ZIP, PNG, or JPEG file.');
        let filename;try{filename=text(decodeURIComponent(request.headers.get('x-file-name')||'attachment'),'Filename',200)}catch{fail(400,'Invalid filename.');}
        const reader=request.body?.getReader();if(!reader)fail(400,'Choose a file.');const chunks=[];let size=0;
        while(true){const {done,value}=await reader.read();if(done)break;size+=value.length;if(size>10*1024*1024){await reader.cancel();fail(413,'Files must be smaller than 10 MB.');}chunks.push(value)}
        if(!size)fail(400,'The file is empty.');const id=randomUUID();await options.files.put(id,Buffer.concat(chunks));
        try{await run('INSERT INTO attachments VALUES(?,?,?,?,?,?,?)',id,assignment.id,user.id,filename,contentType,size,now())}catch(error){await options.files.delete(id);throw error}
        return reply({id,filename},201);
      }
      if(path[0]==='assignments'&&path[1]&&path[2]==='submission'&&method==='PUT'){
        const assignment=await get('SELECT * FROM assignments WHERE id=?',path[1]);if(!assignment)fail(404,'Assignment not found.');await enrolled(user,assignment.course_id);
        const existing=await get('SELECT * FROM submissions WHERE assignment_id=? AND user_id=?',assignment.id,user.id);if(existing?.status==='completed')fail(409,'This submission has already been graded.');
        await run("INSERT INTO submissions(id,assignment_id,user_id,body,repo_url,submitted_at) VALUES(?,?,?,?,?,?) ON CONFLICT(assignment_id,user_id) DO UPDATE SET body=excluded.body,repo_url=excluded.repo_url,submitted_at=excluded.submitted_at",randomUUID(),assignment.id,user.id,text(body.body,'Submission',30000),webUrl(body.repoUrl,'Repository URL'),now());return reply({ok:true});
      }
      if(path[0]==='threads'){
        if(method==='POST'&&!path[1]){const channel=text(body.channel,'Channel',60);if(!['#ui-ux-design','#fullstack-cohort','#announcements','#career-lounge'].includes(channel))fail(400,'Invalid channel.');if(channel==='#announcements')staff(user);await run('INSERT INTO threads VALUES(?,?,?,?,?,?)',randomUUID(),user.id,channel,text(body.title,'Title',200),text(body.content,'Discussion',10000),now());return reply({ok:true},201)}
        const thread=await get('SELECT * FROM threads WHERE id=?',path[1]||'');if(!thread)fail(404,'Discussion not found.');
        if(path[2]==='vote'&&method==='PUT'){await run('INSERT OR IGNORE INTO votes VALUES(?,?)',thread.id,user.id);return reply({ok:true})}
        if(path[2]==='replies'&&method==='GET')return reply(await all('SELECT r.id,r.body,r.created_at,u.name FROM replies r JOIN users u ON u.id=r.author_id WHERE r.thread_id=? ORDER BY r.created_at',thread.id));
        if(path[2]==='replies'&&method==='POST'){await run('INSERT INTO replies VALUES(?,?,?,?,?)',randomUUID(),thread.id,user.id,text(body.content,'Reply',10000),now());return reply({ok:true},201)}
        if(method==='DELETE'){admin(user);await run('DELETE FROM threads WHERE id=?',thread.id);await audit(user,'thread.delete',thread.id);return reply({ok:true})}
      }
      if(path[0]==='certificates'&&method==='GET'){
        const certificate=await get('SELECT c.*,u.name,co.metadata FROM certificates c JOIN users u ON u.id=c.user_id JOIN courses co ON co.id=c.course_id WHERE c.id=?',path[1]);if(!certificate)fail(404,'Certificate not found.');if(user.role!=='admin'&&certificate.user_id!==user.id)fail(403,'This certificate is private.');return reply({id:certificate.id,learner:certificate.name,course:JSON.parse(certificate.metadata).title,issuedAt:certificate.issued_at});
      }
      if(path[0]==='instructor'){
        staff(user);
        if(path[1]==='overview'&&method==='GET'){
          const courses=await courseList(user,true);const ids=new Set(courses.map(c=>c.id));const submissions=(await all('SELECT s.*,a.title,a.course_id,u.name,u.email FROM submissions s JOIN assignments a ON a.id=s.assignment_id JOIN users u ON u.id=s.user_id ORDER BY s.submitted_at DESC')).filter(s=>ids.has(s.course_id));
          const enrollments=(await all('SELECT e.*,u.name,u.email FROM enrollments e JOIN users u ON u.id=e.user_id')).filter(e=>ids.has(e.course_id));
          const attachments=await all('SELECT f.*,a.course_id FROM attachments f JOIN assignments a ON a.id=f.assignment_id');
          return reply({courses,submissions:submissions.map(s=>({...s,attachments:attachments.filter(f=>f.assignment_id===s.assignment_id&&f.user_id===s.user_id)})),enrollments});
        }
        if(path[1]==='courses'&&((method==='POST'&&!path[2])||(method==='PUT'&&path[2]))){
          const existing=path[2]?await owned(user,path[2]):null;const id=existing?.id||randomUUID();const metadata=existing?JSON.parse(existing.metadata):{thumbnail:'',art:'violet',symbol:'book-open',rating:0,level:'Beginner',duration:'Self-paced',access:'free',outcomes:[],requirements:[]};
          for(const key of ['title','description','category','level','duration'])if(body[key]!==undefined)metadata[key]=text(body[key],key,key==='description'?5000:200);if(body.access!==undefined){if(!['free','pro'].includes(body.access))fail(400,'Invalid course access.');metadata.access=body.access}
          if(!metadata.title||!metadata.description||!metadata.category)fail(400,'Title, description, and category are required.');
          metadata.instructor=user.name;let modules=body.modules;
          if(modules!==undefined&&(!Array.isArray(modules)||modules.length>50))fail(400,'Provide up to 50 modules.');
          const statements=[];const seen=new Set();
          if(modules){for(let mi=0;mi<modules.length;mi++){const module=modules[mi];const title=text(module.title,'Module title',200);if(!Array.isArray(module.lessons)||module.lessons.length>100)fail(400,'Provide up to 100 lessons per module.');for(let li=0;li<module.lessons.length;li++){const source=module.lessons[li];const lessonId=source.id?text(source.id,'Lesson ID',100):randomUUID();if(seen.has(lessonId))fail(400,'Lesson IDs must be unique.');seen.add(lessonId);const other=await get('SELECT course_id FROM lessons WHERE id=?',lessonId);if(other&&other.course_id!==id)fail(409,'Lesson belongs to another course.');const type=source.type||'reading';if(!['reading','video','assignment'].includes(type))fail(400,'Invalid lesson type.');const lesson={id:lessonId,title:text(source.title,'Lesson title',200),duration:text(source.duration||'10m','Duration',30),type,overview:text(source.overview||'','Lesson overview',30000,true),exercise:text(source.exercise||'','Exercise',10000,true),videoUrl:webUrl(source.videoUrl,'Video URL'),completed:false};if(type==='video'&&!lesson.videoUrl)fail(400,'Video lessons require an HTTPS video URL.');statements.push(['INSERT INTO lessons VALUES(?,?,?,?,?,?) ON CONFLICT(id) DO UPDATE SET module_title=excluded.module_title,module_position=excluded.module_position,position=excluded.position,content=excluded.content',[lessonId,id,title,mi,li,JSON.stringify(lesson)]]);}}
            const previous=existing?await all('SELECT id FROM lessons WHERE course_id=?',id):[];for(const lesson of previous)if(!seen.has(lesson.id)){if(await get('SELECT 1 FROM progress WHERE lesson_id=? UNION SELECT 1 FROM notes WHERE lesson_id=? LIMIT 1',lesson.id,lesson.id))fail(409,'Lessons with learner activity cannot be removed.');statements.push(['DELETE FROM lessons WHERE id=?',[lesson.id]])}
          }
          const publication=body.publication||existing?.publication||'draft';if(!['draft','published','archived'].includes(publication))fail(400,'Invalid publication status.');
          if(publication==='published'&&(modules?seen.size===0:!(await get('SELECT id FROM lessons WHERE course_id=? LIMIT 1',id))))fail(400,'Add at least one lesson before publishing.');
          let owner=existing?.owner_id||user.id;
          if(body.ownerId!==undefined){admin(user);const target=await get("SELECT id FROM users WHERE id=? AND role IN ('instructor','admin') AND disabled=0",body.ownerId);if(!target)fail(400,'Choose an active instructor.');owner=target.id;}
          metadata.instructor=(await get('SELECT name FROM users WHERE id=?',owner)).name;
          await db.batch([['INSERT INTO courses VALUES(?,?,?,?,?,?) ON CONFLICT(id) DO UPDATE SET owner_id=excluded.owner_id,publication=excluded.publication,metadata=excluded.metadata,updated_at=excluded.updated_at',[id,owner,publication,JSON.stringify(metadata),existing?.created_at||now(),now()]],...statements]);await audit(user,'course.save',id);return reply({id},existing?200:201);
        }
        if(path[1]==='assignments'&&method==='POST'){await owned(user,body.courseId);const id=randomUUID();await run('INSERT INTO assignments VALUES(?,?,?,?,?)',id,body.courseId,text(body.title,'Title',200),text(body.instructions,'Instructions',15000),body.dueDate?text(body.dueDate,'Due date',50):null);return reply({id},201)}
        if(path[1]==='submissions'&&path[2]&&method==='PATCH'){
          const submission=await get('SELECT s.*,a.course_id FROM submissions s JOIN assignments a ON a.id=s.assignment_id WHERE s.id=?',path[2]);if(!submission)fail(404,'Submission not found.');await owned(user,submission.course_id);
          if(!Number.isInteger(body.score)||body.score<0||body.score>100)fail(400,'Score must be an integer from 0 to 100.');
          if(submission.status==='completed')fail(409,'This submission has already been graded.');
          await run("UPDATE submissions SET status='completed',score=?,feedback=?,graded_by=?,graded_at=? WHERE id=?",body.score,text(body.feedback,'Feedback',10000),user.id,now(),submission.id);await run("INSERT OR IGNORE INTO certificates(id,user_id,course_id,issued_at) SELECT ?,?,?,? WHERE NOT EXISTS(SELECT 1 FROM lessons l WHERE l.course_id=? AND NOT EXISTS(SELECT 1 FROM progress p WHERE p.user_id=? AND p.lesson_id=l.id AND p.completed_at IS NOT NULL)) AND NOT EXISTS(SELECT 1 FROM assignments a WHERE a.course_id=? AND NOT EXISTS(SELECT 1 FROM submissions s WHERE s.assignment_id=a.id AND s.user_id=? AND s.status='completed' AND s.score>=50))",randomUUID(),submission.user_id,submission.course_id,now(),submission.course_id,submission.user_id,submission.course_id,submission.user_id);await audit(user,'submission.grade',submission.id);return reply({ok:true});
        }
        if(path[1]==='live-classes'&&method==='POST'){await owned(user,body.courseId);if(typeof body.startsAt!=='string'||!Number.isFinite(Date.parse(body.startsAt)))fail(400,'Invalid session date.');const id=randomUUID();await run('INSERT INTO live_classes VALUES(?,?,?,?,?,?)',id,body.courseId,user.id,text(body.title,'Title',200),new Date(body.startsAt).toISOString(),webUrl(body.meetingUrl,'Meeting URL',false));return reply({id},201)}
      }
      if(path[0]==='admin'){
        admin(user);
        if(path[1]==='users'&&method==='GET')return reply(await Promise.all((await all(USER_WITH_VERIFICATION+' ORDER BY u.created_at DESC')).map(async person=>({...publicUser(person),billing:await billingState(person)}))));
        if(path[1]==='audit'&&method==='GET')return reply(await all('SELECT a.*,u.name FROM audit_log a JOIN users u ON u.id=a.actor_id ORDER BY a.created_at DESC LIMIT 200'));
        if(path[1]==='users'&&path[2]&&method==='PATCH'){
          const target=await get('SELECT * FROM users WHERE id=?',path[2]);if(!target)fail(404,'User not found.');const role=body.role??target.role;const disabled=body.disabled===undefined?target.disabled:body.disabled===true?1:body.disabled===false?0:fail(400,'Invalid account status.');if(!['learner','instructor','admin'].includes(role))fail(400,'Invalid role.');
          if(target.id===user.id&&(disabled||role!=='admin'))fail(409,'You cannot remove your own administrator access.');
          await db.batch([['UPDATE users SET role=?,disabled=? WHERE id=?',[role,disabled,target.id]],['DELETE FROM sessions WHERE user_id=?',[target.id]]]);await audit(user,'user.update',target.id);return reply({ok:true});
        }
      }
      fail(404,'Endpoint not found.');
    } catch(error){if(error instanceof HttpError)return reply({error:error.message},error.status);if(String(error.message).includes('UNIQUE constraint'))return reply({error:'This record already exists. Refresh and try again.'},409);console.error('LMS request failed',error.message);return reply({error:'The request could not be completed. Please try again.'},500)}
  }
  return {handle,seedCourses};
}
function reply(data,status=200,headers={}){return Response.json(data,{status,headers:{'Cache-Control':'no-store','X-Content-Type-Options':'nosniff',...headers}})}
