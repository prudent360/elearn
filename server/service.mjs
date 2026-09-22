import { randomUUID, randomInt } from 'node:crypto';
import { hashPassword, verifyPassword, newToken, digest, readSession, sessionCookie } from './auth.mjs';
import { createConsoleMailer, verificationEmailHtml } from './mail.mjs';
import { billingConfigured, createCheckout, createPortal, retrievePrice, verifyStripeEvent } from './billing.mjs';
import { PERMISSIONS, ADMIN_PERMISSIONS, validPermission } from './permissions.mjs';
const now=()=>new Date().toISOString();
class HttpError extends Error {constructor(status,message){super(message);this.status=status}}
const fail=(status,message)=>{throw new HttpError(status,message)};
function text(value,label,max=200,optional=false){if(typeof value!=='string'||(!optional&&!value.trim())||value.length>max)fail(400,`${label} must be ${optional?'at most':'between 1 and'} ${max} characters.`);return value.trim()}
function webUrl(value,label,optional=true){const v=text(value||'',label,2000,optional);if(!v)return '';try{if(new URL(v).protocol!=='https:')throw Error()}catch{fail(400,`${label} must be an HTTPS URL.`)}return v}
async function readBody(request){if(!request.headers.get('content-type')?.includes('application/json'))fail(415,'Send a JSON request.');const reader=request.body?.getReader();if(!reader)return {};let size=0;const parts=[];for(;;){const {done,value}=await reader.read();if(done)break;size+=value.byteLength;if(size>524288){await reader.cancel();fail(413,'Request too large.')}parts.push(value)}let result;try{result=JSON.parse(Buffer.concat(parts).toString())}catch{fail(400,'Invalid JSON.')}if(!result||typeof result!=='object'||Array.isArray(result))fail(400,'Expected a JSON object.');return result}
const publicUser=u=>({id:u.id,email:u.email,name:u.name,role:u.role,permissions:u.permissions||[],disabled:!!u.disabled,emailVerified:!!u.email_verified_at,instructorStatus:u.role==='instructor'?(u.instructor_status||'pending'):null,createdAt:u.created_at});
const USER_WITH_VERIFICATION="SELECT u.*, ev.verified_at AS email_verified_at, ia.status AS instructor_status FROM users u LEFT JOIN email_verifications ev ON ev.user_id=u.id LEFT JOIN instructor_approvals ia ON ia.user_id=u.id";
export function createService(db,seed=[],options={}) {
  const mailer=options.mail||createConsoleMailer();
  const mailConfigured=mailer.configured!==false;
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
  // Sends a notification email to `userId` unless they have explicitly turned this preference
  // off in Settings → Notifications (missing/never-saved preferences fall back to `defaultOn`,
  // matching the toggle defaults shown in the UI). Used for the three event-driven alerts
  // (graded assignments, community replies/upvotes); the weekly digest has its own cadence gate
  // in runNotificationSweep and is opt-in, so it is not routed through this helper.
  async function notifyIfEnabled(userId,prefKey,defaultOn,message){
    const person=await get('SELECT email,settings FROM users WHERE id=?',userId);if(!person)return;
    const prefs=JSON.parse(person.settings).notifications||{};
    if((prefs[prefKey]===undefined?defaultOn:prefs[prefKey])!==true)return;
    await sendMail({to:person.email,...message});
  }
  async function sendWeeklyDigest(learner,siteOrigin){
    const since=new Date(Date.now()-604800000).toISOString();
    const completed=await all('SELECT l.content FROM progress p JOIN lessons l ON l.id=p.lesson_id WHERE p.user_id=? AND p.completed_at IS NOT NULL AND p.completed_at>=?',learner.id,since);
    const minutes=completed.reduce((sum,row)=>sum+(parseInt(JSON.parse(row.content).duration)||0),0);
    const activeDays=new Set((await all('SELECT DISTINCT substr(completed_at,1,10) AS day FROM progress WHERE user_id=? AND completed_at IS NOT NULL',learner.id)).map(row=>row.day));
    const dateAt=offset=>new Date(Date.now()+offset*86400000).toISOString().slice(0,10);
    let streak=0;let offset=activeDays.has(dateAt(0))?0:-1;while(activeDays.has(dateAt(offset))){streak++;offset--;}
    const hours=Math.round(minutes/60*10)/10;
    await sendMail({to:learner.email,subject:'Your weekly learning digest',text:`Here's your week on Tekskillup Academy, ${learner.name}:\n\n- ${hours} hour${hours===1?'':'s'} studied\n- ${completed.length} lesson${completed.length===1?'':'s'} completed\n- ${streak}-day streak\n\nKeep it going: ${siteOrigin}/analytics\n\nYou're getting this because Weekly Learning Digest is on in your notification settings: ${siteOrigin}/settings`});
  }
  // Sends the time-based notifications that have no natural request to hang off of: live-class
  // reminders (~30 minutes before a session starts) and the opt-in weekly digest. Idempotent and
  // safe to call repeatedly — call it periodically (e.g. every 5-10 minutes) via the authenticated
  // POST /api/notifications/sweep endpoint below, from an external scheduler. See BACKEND.md.
  async function runNotificationSweep(siteOrigin){
    const windowStart=new Date(Date.now()+1500000).toISOString(),windowEnd=new Date(Date.now()+2100000).toISOString();
    const dueClasses=await all('SELECT l.*,c.metadata AS course_metadata FROM live_classes l JOIN courses c ON c.id=l.course_id WHERE l.starts_at>? AND l.starts_at<=? AND NOT EXISTS(SELECT 1 FROM live_class_reminders r WHERE r.live_class_id=l.id)',windowStart,windowEnd);
    let remindersSent=0;
    for(const session of dueClasses){
      const learners=await all('SELECT u.* FROM users u JOIN enrollments e ON e.user_id=u.id WHERE e.course_id=? AND u.disabled=0',session.course_id);
      const courseMetadata=JSON.parse(session.course_metadata);const courseTitle=courseMetadata.title;
      for(const learner of learners){
        if(courseMetadata.access==='pro'&&(await billingState(learner)).plan!=='pro')continue;
        const prefs=JSON.parse(learner.settings).notifications||{};
        if(prefs.liveClassReminders===false)continue;
        await sendMail({to:learner.email,subject:`Starting soon: ${session.title}`,text:`${session.title} (${courseTitle}) starts at ${new Date(session.starts_at).toUTCString()} — about 30 minutes from now.\n\nJoin: ${session.meeting_url}\n\nManage reminders: ${siteOrigin}/settings`});
        remindersSent++;
      }
      await run('INSERT OR IGNORE INTO live_class_reminders VALUES(?,?)',session.id,now());
    }
    const digestCutoff=new Date(Date.now()-604800000).toISOString();
    const dueLearners=await all('SELECT u.* FROM users u WHERE u.disabled=0 AND NOT EXISTS(SELECT 1 FROM digest_log d WHERE d.user_id=u.id AND d.sent_at>?)',digestCutoff);
    let digestsSent=0;
    for(const learner of dueLearners){
      const prefs=JSON.parse(learner.settings).notifications||{};
      if(prefs.emailDigest!==true)continue;
      await sendWeeklyDigest(learner,siteOrigin);
      await run('INSERT INTO digest_log VALUES(?,?) ON CONFLICT(user_id) DO UPDATE SET sent_at=excluded.sent_at',learner.id,now());
      digestsSent++;
    }
    return {remindersSent,digestsSent};
  }
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
  async function currentUser(request,required=true){const token=readSession(externalRequest(request));const user=token&&await get('SELECT u.*, ev.verified_at AS email_verified_at, ia.status AS instructor_status FROM users u JOIN sessions s ON u.id=s.user_id LEFT JOIN email_verifications ev ON ev.user_id=u.id LEFT JOIN instructor_approvals ia ON ia.user_id=u.id WHERE s.token_hash=? AND s.expires_at>? AND u.disabled=0',digest(token),Date.now());if(!user&&required)fail(401,'Please sign in.');if(user){const assigned=await all('SELECT ura.role_id,rp.permission FROM user_role_assignments ura LEFT JOIN role_permissions rp ON rp.role_id=ura.role_id WHERE ura.user_id=?',user.id);user.permissions=user.role==='admin'?[...PERMISSIONS]:[...new Set([...(user.role==='instructor'&&user.instructor_status==='approved'?['view_dashboard','create_courses','edit_courses','manage_assignments','view_analytics']:[]),...(assigned.some(row=>row.role_id==='admin')?ADMIN_PERMISSIONS:[]),...assigned.map(row=>row.permission).filter(Boolean)])]}return user||null}
  async function limit(key,max){const stamp=Date.now();await run('INSERT INTO rate_limits(key,attempts,expires_at) VALUES(?,1,?) ON CONFLICT(key) DO UPDATE SET attempts=CASE WHEN expires_at<? THEN 1 ELSE attempts+1 END, expires_at=CASE WHEN expires_at<? THEN excluded.expires_at ELSE expires_at END',digest(key),stamp+900000,stamp,stamp);const value=await get('SELECT attempts FROM rate_limits WHERE key=?',digest(key));if(value.attempts>max)fail(429,'Too many attempts. Try again in 15 minutes.')}
  function hasPermission(user,permission){return user.role==='admin'||user.permissions?.includes(permission)}
  function requirePermission(user,permission){if(!hasPermission(user,permission))fail(403,'Permission required: '+permission)}
  function staff(user){if(!hasPermission(user,'create_courses'))fail(403,'Instructor access required.')}
  function admin(user){requirePermission(user,'manage_users')}
  async function owned(user,id){staff(user);const course=await get('SELECT * FROM courses WHERE id=?',id);if(!course)fail(404,'Course not found.');if(user.role!=='admin'&&course.owner_id!==user.id)fail(403,'This course belongs to another instructor.');return course}
  async function enrolled(user,id){const row=await get('SELECT e.*,c.metadata FROM enrollments e JOIN courses c ON e.course_id=c.id WHERE e.user_id=? AND e.course_id=? AND c.publication=?',user.id,id,'published');if(!row)fail(403,'Enroll in an available course to access its lessons.');if(JSON.parse(row.metadata).access==='pro'&&user.role==='learner'&&(await billingState(user)).plan!=='pro')fail(402,'This course requires an active Pro membership.');return row}
  async function lessonAccess(user,id){const lesson=await get('SELECT * FROM lessons WHERE id=?',id);if(!lesson)fail(404,'Lesson not found.');await enrolled(user,lesson.course_id);return lesson}
  async function audit(user,action,target){await run('INSERT INTO audit_log VALUES(?,?,?,?,?)',randomUUID(),user.id,action,target,now())}
  async function billingState(user){
    const subscription=await get('SELECT * FROM subscriptions WHERE user_id=?',user.id);
    const customer=await get('SELECT stripe_customer_id FROM billing_customers WHERE user_id=?',user.id);
    const active=!!subscription&&['active','trialing'].includes(subscription.status)&&Number.isFinite(Date.parse(subscription.current_period_end))&&Date.parse(subscription.current_period_end)>Date.now();
    return {configured:billingConfigured(options.stripe),plan:active?'pro':'free',subscription:subscription?{status:subscription.status,planKey:subscription.plan_key,currentPeriodEnd:subscription.current_period_end,cancelAtPeriodEnd:!!subscription.cancel_at_period_end}:null,canManage:!!customer};
  }
  async function courseList(user,manage=false){
    const rows=manage?await all(user.role==='admin'?'SELECT * FROM courses ORDER BY created_at DESC':'SELECT * FROM courses WHERE owner_id=? ORDER BY created_at DESC',...(user.role==='admin'?[]:[user.id])):await all("SELECT * FROM courses WHERE publication='published' ORDER BY created_at");
    const completions=await all('SELECT lesson_id FROM progress WHERE user_id=? AND completed_at IS NOT NULL',user.id);const done=new Set(completions.map(p=>p.lesson_id));
    const enrollmentRows=await all('SELECT course_id FROM enrollments WHERE user_id=?',user.id);const enrollments=new Set(enrollmentRows.map(e=>e.course_id));
    const saved=new Set((await all('SELECT course_id FROM bookmarks WHERE user_id=?',user.id)).map(e=>e.course_id));
    const proAccess=user.role!=='learner'||(await billingState(user)).plan==='pro';
    return Promise.all(rows.map(async row=>{
      const lessonRows=await all('SELECT * FROM lessons WHERE course_id=? ORDER BY module_position,position',row.id);const modules=[];
      const metadata=JSON.parse(row.metadata);const authorized=manage||(enrollments.has(row.id)&&(metadata.access!=='pro'||proAccess));
      for(const lesson of lessonRows){if(!modules[lesson.module_position])modules[lesson.module_position]={title:lesson.module_title,lessons:[]};const content=JSON.parse(lesson.content);if(!authorized){delete content.overview;delete content.exercise;delete content.videoUrl;}modules[lesson.module_position].lessons.push({...content,id:lesson.id,completed:done.has(lesson.id)})}
      const total=lessonRows.length;const count=lessonRows.filter(l=>done.has(l.id)).length;const progress=total?Math.round(count/total*100):0;
      return {...metadata,id:row.id,modules:modules.filter(Boolean),progress,status:enrollments.has(row.id)?progress===100?'completed':'in-progress':'available',saved:saved.has(row.id),publication:row.publication,ownerId:row.owner_id,enrollmentCount:manage?(await get('SELECT COUNT(*) AS n FROM enrollments WHERE course_id=?',row.id)).n:undefined};
    }));
  }
  async function snapshot(user){
    const courses=await courseList(user);const profile=JSON.parse(user.profile);const settings=JSON.parse(user.settings);const proAccess=user.role!=='learner'||(await billingState(user)).plan==='pro';
    const savedCourses=(await all('SELECT course_id FROM bookmarks WHERE user_id=?',user.id)).map(x=>x.course_id);
    const enrolledCourses=(await all('SELECT course_id FROM enrollments WHERE user_id=?',user.id)).map(x=>x.course_id);
    const notes=await all('SELECT lesson_id,body FROM notes WHERE user_id=?',user.id);
    const progress=await all('SELECT p.*,l.course_id,l.content FROM progress p JOIN lessons l ON p.lesson_id=l.id WHERE p.user_id=? ORDER BY last_seen DESC',user.id);
    const certificates=await all('SELECT c.*,co.metadata FROM certificates c JOIN courses co ON co.id=c.course_id WHERE c.user_id=? ORDER BY issued_at DESC',user.id);
    const attachmentRows=await all('SELECT id,assignment_id,filename,byte_size FROM attachments WHERE user_id=?',user.id);
    const assignments=(await all("SELECT a.*,c.metadata,s.id AS submission_id,s.status,s.body,s.repo_url,s.score,s.feedback,s.submitted_at FROM assignments a JOIN courses c ON c.id=a.course_id JOIN enrollments e ON e.course_id=a.course_id AND e.user_id=? LEFT JOIN submissions s ON s.assignment_id=a.id AND s.user_id=? WHERE c.publication='published'",user.id,user.id)).filter(a=>JSON.parse(a.metadata).access!=='pro'||proAccess);
    const threads=await all('SELECT t.*,u.name,u.profile,(SELECT COUNT(*) FROM votes v WHERE v.thread_id=t.id) AS upvotes,(SELECT COUNT(*) FROM replies r WHERE r.thread_id=t.id) AS commentsCount FROM threads t JOIN users u ON u.id=t.author_id ORDER BY t.created_at DESC LIMIT 100');
    const live=(await all("SELECT l.*,u.name,c.metadata FROM live_classes l JOIN users u ON u.id=l.host_id JOIN courses c ON c.id=l.course_id JOIN enrollments e ON e.course_id=l.course_id AND e.user_id=? WHERE l.starts_at>? ORDER BY starts_at LIMIT 50",user.id,now())).filter(l=>JSON.parse(l.metadata).access!=='pro'||proAccess);
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
        }
        if(event.type.startsWith('customer.subscription.')){
          const customerId=typeof object.customer==='string'?object.customer:object.customer?.id;const customer=customerId&&await get('SELECT user_id FROM billing_customers WHERE stripe_customer_id=?',customerId);const userId=object.metadata?.user_id||customer?.user_id;
          if(userId&&typeof object.id==='string'){
            const item=object.items?.data?.[0]||{};const previous=await get('SELECT plan_key,price_id FROM subscriptions WHERE stripe_subscription_id=?',object.id);const suppliedPriceId=typeof item.price==='string'?item.price:item.price?.id;const priceId=suppliedPriceId||previous?.price_id||'';
            const plan=Object.entries(options.stripe?.prices||{}).find(([,id])=>id===priceId)?.[0]||previous?.plan_key;
            const watermark=await get('SELECT event_created,event_id FROM subscription_event_watermarks WHERE stripe_subscription_id=?',object.id);
            const eventCreated=Number(event.created)||0;
            if(plan&&(!watermark||eventCreated>watermark.event_created||(eventCreated===watermark.event_created&&event.id>watermark.event_id))){
              const period=object.current_period_end||item.current_period_end;
              const recognized=Object.values(options.stripe?.prices||{}).includes(priceId);
              statements.push(['INSERT INTO subscriptions(user_id,stripe_subscription_id,plan_key,price_id,status,current_period_end,cancel_at_period_end,updated_at) VALUES(?,?,?,?,?,?,?,?) ON CONFLICT(user_id) DO UPDATE SET stripe_subscription_id=excluded.stripe_subscription_id,plan_key=excluded.plan_key,price_id=excluded.price_id,status=excluded.status,current_period_end=excluded.current_period_end,cancel_at_period_end=excluded.cancel_at_period_end,updated_at=excluded.updated_at',[userId,object.id,plan,priceId,recognized?object.status||'canceled':'unrecognized_price',period?new Date(period*1000).toISOString():null,object.cancel_at_period_end?1:0,now()]]);
              statements.push(['INSERT INTO subscription_event_watermarks(stripe_subscription_id,event_created,event_id) VALUES(?,?,?) ON CONFLICT(stripe_subscription_id) DO UPDATE SET event_created=excluded.event_created,event_id=excluded.event_id',[object.id,eventCreated,event.id]]);
              if(customerId)statements.push(['INSERT INTO billing_customers(user_id,stripe_customer_id,created_at) VALUES(?,?,?) ON CONFLICT(user_id) DO UPDATE SET stripe_customer_id=excluded.stripe_customer_id',[userId,customerId,now()]]);
            }
          }
        }
        statements.push(['INSERT OR IGNORE INTO stripe_events VALUES(?,?,?)',[event.id,event.type,now()]]);await db.batch(statements);return reply({received:true});
      }
      // Runs the time-based notifications (live-class reminders, weekly digest). Has no user
      // session — it's meant to be called by an external scheduler on a short interval — so it
      // authenticates with a bearer credential instead, the same pattern as the Stripe webhook.
      if(path[0]==='notifications'&&path[1]==='sweep'&&method==='POST'){
        if(!options.notificationsToken)fail(503,'Scheduled notifications are not configured.');
        const header=request.headers.get('authorization')||'';const token=header.startsWith('Bearer ')?header.slice(7):'';
        if(!token||digest(token)!==digest(options.notificationsToken))fail(403,'Invalid notification sweep credential.');
        return reply(await runNotificationSweep(siteOrigin));
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
        if(method==='GET'&&path[1]==='session'){const user=await currentUser(request,false);return reply({user:user?publicUser(user):null,mailConfigured,setupRequired:!(await get("SELECT id FROM users WHERE role='admin' LIMIT 1"))})}
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
          if(newAccount&&mailConfigured)await sendVerificationCode(user,siteOrigin);
          return reply({user:publicUser(user)},200,{'Set-Cookie':sessionCookie(token,externalRequest(request))});
        }
        if(method==='POST'&&path[1]==='logout'){const token=readSession(externalRequest(request));if(token)await run('DELETE FROM sessions WHERE token_hash=?',digest(token));return reply({ok:true},200,{'Set-Cookie':sessionCookie('',externalRequest(request),true)})}
        if(method==='POST'&&path[1]==='password'){
          const user=await currentUser(request);await limit('password:'+user.id,10);
          if(typeof body.currentPassword!=='string'||!(await verifyPassword(body.currentPassword,user.password_hash)))fail(401,'Current password is incorrect.');
          if(typeof body.password!=='string'||body.password.length<12||body.password.length>128)fail(400,'Use a password between 12 and 128 characters.');
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
          if(!mailConfigured)fail(503,'Email delivery is not configured yet.');
          const user=await currentUser(request);await limit('verify:'+user.id,5);
          if(await get('SELECT 1 FROM email_verifications WHERE user_id=?',user.id))fail(409,'Your email is already verified.');
          await sendVerificationCode(user,siteOrigin);
          return reply({ok:true});
        }
        if(method==='POST'&&path[1]==='reset-request'){
          if(!mailConfigured)fail(503,'Password reset by email is not available yet. Contact the academy administrator.');
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
        if(method==='GET'&&path[1]==='plans'){
          if(!billingConfigured(options.stripe))return reply({configured:false,plans:[]});
          try{const plans=await Promise.all(['pro-monthly','pro-yearly'].map(async key=>{const price=await retrievePrice(options.stripe,options.stripe.prices[key]);if(!price.active||!Number.isInteger(price.unit_amount)||!price.currency||price.recurring?.interval!==(key==='pro-monthly'?'month':'year')||price.recurring?.interval_count!==1)throw Error('Configured Stripe Prices must be active monthly and yearly recurring prices.');return {key,unitAmount:price.unit_amount,currency:price.currency,interval:price.recurring.interval}}));return reply({configured:true,plans});}catch(error){fail(502,'Billing prices are unavailable. Check the configured Stripe Prices.');}
        }
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
          const stamp=now();const metadata=JSON.parse((await get('SELECT metadata FROM courses WHERE id=?',lesson.course_id)).metadata);
          const statements=[['INSERT INTO progress VALUES(?,?,?,?) ON CONFLICT(user_id,lesson_id) DO UPDATE SET completed_at=COALESCE(progress.completed_at,excluded.completed_at),last_seen=excluded.last_seen',[user.id,lesson.id,body.completed?stamp:null,stamp]]];
          if(metadata.certificateEnabled!==false)statements.push(["INSERT OR IGNORE INTO certificates(id,user_id,course_id,issued_at) SELECT ?,?,?,? WHERE NOT EXISTS(SELECT 1 FROM lessons l WHERE l.course_id=? AND NOT EXISTS(SELECT 1 FROM progress p WHERE p.user_id=? AND p.lesson_id=l.id AND p.completed_at IS NOT NULL)) AND NOT EXISTS(SELECT 1 FROM assignments a WHERE a.course_id=? AND NOT EXISTS(SELECT 1 FROM submissions s WHERE s.assignment_id=a.id AND s.user_id=? AND s.status='completed' AND s.score>=50))",[randomUUID(),user.id,lesson.course_id,stamp,lesson.course_id,user.id,lesson.course_id,user.id]]);
          await db.batch(statements);return reply({ok:true});
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
        if(path[2]==='vote'&&method==='PUT'){
          const already=await get('SELECT 1 FROM votes WHERE thread_id=? AND user_id=?',thread.id,user.id);
          await run('INSERT OR IGNORE INTO votes VALUES(?,?)',thread.id,user.id);
          if(!already&&thread.author_id!==user.id)await notifyIfEnabled(thread.author_id,'communityReplies',true,{subject:`${user.name} upvoted "${thread.title}"`,text:`${user.name} upvoted your discussion "${thread.title}" in ${thread.channel}.\n\nView it: ${siteOrigin}/community\n\nManage this email: ${siteOrigin}/settings`});
          return reply({ok:true})
        }
        if(path[2]==='replies'&&method==='GET')return reply(await all('SELECT r.id,r.body,r.created_at,u.name FROM replies r JOIN users u ON u.id=r.author_id WHERE r.thread_id=? ORDER BY r.created_at',thread.id));
        if(path[2]==='replies'&&method==='POST'){
          await run('INSERT INTO replies VALUES(?,?,?,?,?)',randomUUID(),thread.id,user.id,text(body.content,'Reply',10000),now());
          if(thread.author_id!==user.id)await notifyIfEnabled(thread.author_id,'communityReplies',true,{subject:`${user.name} replied to "${thread.title}"`,text:`${user.name} replied to your discussion "${thread.title}" in ${thread.channel}.\n\nView it: ${siteOrigin}/community\n\nManage this email: ${siteOrigin}/settings`});
          return reply({ok:true},201)
        }
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
          for(const key of ['subtitle','language','targetAudience'])if(body[key]!==undefined)metadata[key]=text(body[key],key,key==='targetAudience'?1000:200,true);
          if(body.promotionalVideo!==undefined)metadata.promotionalVideo=webUrl(body.promotionalVideo,'Promotional video');
          if(body.certificateEnabled!==undefined){if(typeof body.certificateEnabled!=='boolean')fail(400,'Certificate setting must be on or off.');metadata.certificateEnabled=body.certificateEnabled}
          for(const key of ['outcomes','requirements'])if(body[key]!==undefined){if(!Array.isArray(body[key])||body[key].length>20)fail(400,`Provide up to 20 ${key}.`);metadata[key]=body[key].map(value=>text(value,key,300))}
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
          const submission=await get('SELECT s.*,a.course_id,a.title AS assignment_title,c.metadata AS course_metadata FROM submissions s JOIN assignments a ON a.id=s.assignment_id JOIN courses c ON c.id=a.course_id WHERE s.id=?',path[2]);if(!submission)fail(404,'Submission not found.');await owned(user,submission.course_id);
          if(!Number.isInteger(body.score)||body.score<0||body.score>100)fail(400,'Score must be an integer from 0 to 100.');
          if(submission.status==='completed')fail(409,'This submission has already been graded.');
          const feedback=text(body.feedback,'Feedback',10000);
          await run("UPDATE submissions SET status='completed',score=?,feedback=?,graded_by=?,graded_at=? WHERE id=?",body.score,feedback,user.id,now(),submission.id);if(JSON.parse(submission.course_metadata).certificateEnabled!==false)await run("INSERT OR IGNORE INTO certificates(id,user_id,course_id,issued_at) SELECT ?,?,?,? WHERE NOT EXISTS(SELECT 1 FROM lessons l WHERE l.course_id=? AND NOT EXISTS(SELECT 1 FROM progress p WHERE p.user_id=? AND p.lesson_id=l.id AND p.completed_at IS NOT NULL)) AND NOT EXISTS(SELECT 1 FROM assignments a WHERE a.course_id=? AND NOT EXISTS(SELECT 1 FROM submissions s WHERE s.assignment_id=a.id AND s.user_id=? AND s.status='completed' AND s.score>=50))",randomUUID(),submission.user_id,submission.course_id,now(),submission.course_id,submission.user_id,submission.course_id,submission.user_id);await audit(user,'submission.grade',submission.id);
          const courseTitle=JSON.parse(submission.course_metadata).title;
          await notifyIfEnabled(submission.user_id,'assignmentGraded',true,{subject:`Your submission for "${submission.assignment_title}" was graded`,text:`Your instructor graded your submission for "${submission.assignment_title}" in ${courseTitle}.\n\nScore: ${body.score}/100\n${feedback?`\nFeedback:\n${feedback}\n`:''}\nView it: ${siteOrigin}/assignments\n\nManage this email: ${siteOrigin}/settings`});
          return reply({ok:true});
        }
        if(path[1]==='live-classes'&&method==='POST'){await owned(user,body.courseId);if(typeof body.startsAt!=='string'||!Number.isFinite(Date.parse(body.startsAt)))fail(400,'Invalid session date.');const id=randomUUID();await run('INSERT INTO live_classes VALUES(?,?,?,?,?,?)',id,body.courseId,user.id,text(body.title,'Title',200),new Date(body.startsAt).toISOString(),webUrl(body.meetingUrl,'Meeting URL',false));return reply({id},201)}
      }
      if(path[0]==='admin'){
        admin(user);
        if(path[1]==='overview'&&method==='GET'){
          const people=await get("SELECT SUM(CASE WHEN role='learner' AND disabled=0 THEN 1 ELSE 0 END) AS students,SUM(CASE WHEN role='instructor' AND disabled=0 THEN 1 ELSE 0 END) AS instructors FROM users");
          const courses=await get("SELECT COUNT(*) AS total,SUM(CASE WHEN publication='published' THEN 1 ELSE 0 END) AS active FROM courses");
          const enrollments=await get('SELECT COUNT(*) AS total FROM enrollments');
          const recent=await all('SELECT e.created_at,u.name AS student_name,c.metadata AS course_metadata FROM enrollments e JOIN users u ON u.id=e.user_id JOIN courses c ON c.id=e.course_id ORDER BY e.created_at DESC LIMIT 8');
          return reply({students:people.students||0,instructors:people.instructors||0,courses:courses.total||0,activeCourses:courses.active||0,enrollments:enrollments.total,recentEnrollments:recent.map(row=>({student:row.student_name,course:JSON.parse(row.course_metadata).title,createdAt:row.created_at}))});
        }
        if(path[1]==='roles'&&method==='GET'){
          requirePermission(user,'manage_roles');
          const roles=await all('SELECT * FROM role_definitions ORDER BY is_system DESC,name');
          const granted=await all('SELECT role_id,permission FROM role_permissions');
          return reply({permissions:PERMISSIONS,roles:roles.map(role=>({...role,permissions:role.id==='admin'&&!(granted.some(row=>row.role_id==='admin'))?ADMIN_PERMISSIONS:granted.filter(row=>row.role_id===role.id).map(row=>row.permission)}))});
        }
        if(path[1]==='roles'&&method==='POST'){
          requirePermission(user,'manage_roles');
          const name=text(body.name,'Role name',80);
          if(!Array.isArray(body.permissions)||body.permissions.some(p=>!validPermission(p)||!hasPermission(user,p)))fail(400,'Choose only permissions you hold.');
          const id=randomUUID();await db.batch([['INSERT INTO role_definitions(id,name,is_system,created_at) VALUES(?,?,0,?)',[id,name,now()]],...[...new Set(body.permissions)].map(p=>['INSERT INTO role_permissions(role_id,permission) VALUES(?,?)',[id,p]])]);
          await audit(user,'role.create',id);return reply({id},201);
        }
        if(path[1]==='roles'&&path[2]&&method==='PATCH'){
          requirePermission(user,'manage_roles');const role=await get('SELECT * FROM role_definitions WHERE id=?',path[2]);if(!role)fail(404,'Role not found.');if(role.is_system)fail(403,'System roles cannot be edited.');
          if(!Array.isArray(body.permissions)||body.permissions.some(p=>!validPermission(p)||!hasPermission(user,p)))fail(400,'Choose only permissions you hold.');
          const prior=await all('SELECT permission FROM role_permissions WHERE role_id=?',role.id);if(prior.some(row=>!hasPermission(user,row.permission)))fail(403,'You cannot edit a role with permissions you do not hold.');
          await db.batch([['DELETE FROM role_permissions WHERE role_id=?',[role.id]],...[...new Set(body.permissions)].map(p=>['INSERT INTO role_permissions(role_id,permission) VALUES(?,?)',[role.id,p]])]);
          await run('DELETE FROM sessions WHERE user_id IN (SELECT user_id FROM user_role_assignments WHERE role_id=?)',role.id);await audit(user,'role.update',role.id);return reply({ok:true});
        }
        if(path[1]==='users'&&path[2]&&path[3]==='roles'&&method==='PUT'){
          requirePermission(user,'manage_roles');if(path[2]===user.id)fail(409,'You cannot change your own role assignments.');
          const target=await get('SELECT id FROM users WHERE id=?',path[2]);if(!target)fail(404,'User not found.');
          if(!Array.isArray(body.roleIds)||body.roleIds.some(id=>typeof id!=='string')||body.roleIds.length>20)fail(400,'Choose valid roles.');
          const roleIds=[...new Set(body.roleIds)];for(const roleId of roleIds){const role=await get('SELECT id FROM role_definitions WHERE id=?',roleId);if(!role)fail(400,'Role not found.');const grants=roleId==='admin'?ADMIN_PERMISSIONS:(await all('SELECT permission FROM role_permissions WHERE role_id=?',roleId)).map(row=>row.permission);if(grants.some(p=>!hasPermission(user,p)))fail(403,'You cannot grant a permission you do not hold.');}
          await db.batch([['DELETE FROM user_role_assignments WHERE user_id=?',[target.id]],...roleIds.map(id=>['INSERT INTO user_role_assignments(user_id,role_id) VALUES(?,?)',[target.id,id]]),['DELETE FROM sessions WHERE user_id=?',[target.id]]]);await audit(user,'user.roles',target.id);return reply({ok:true});
        }
        if(path[1]==='users'&&!path[2]&&method==='GET')return reply(await Promise.all((await all(USER_WITH_VERIFICATION+' ORDER BY u.created_at DESC')).map(async person=>({...publicUser(person),roleIds:(await all('SELECT role_id FROM user_role_assignments WHERE user_id=?',person.id)).map(row=>row.role_id),billing:await billingState(person)}))));
        if(path[1]==='audit'&&method==='GET')return reply(await all('SELECT a.*,u.name FROM audit_log a JOIN users u ON u.id=a.actor_id ORDER BY a.created_at DESC LIMIT 200'));
        if(path[1]==='users'&&path[2]&&!path[3]&&method==='PATCH'){
          const target=await get('SELECT * FROM users WHERE id=?',path[2]);if(!target)fail(404,'User not found.');const role=body.role??target.role;const disabled=body.disabled===undefined?target.disabled:body.disabled===true?1:body.disabled===false?0:fail(400,'Invalid account status.');if(!['learner','instructor','admin'].includes(role))fail(400,'Invalid role.');if(user.role!=='admin'&&(body.role!==undefined||target.role==='admin'))fail(403,'Only the Super Admin can change system roles or administrator accounts.');
          const name=body.name===undefined?target.name:text(body.name,'Name',100);const email=body.email===undefined?target.email:text(body.email,'Email',254).toLowerCase();if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))fail(400,'Enter a valid email.');
          if(target.id===user.id&&(disabled||role!=='admin'))fail(409,'You cannot remove your own administrator access.');
          const statements=[['UPDATE users SET name=?,email=?,role=?,disabled=? WHERE id=?',[name,email,role,disabled,target.id]],['DELETE FROM sessions WHERE user_id=?',[target.id]]];
          // A fresh promotion to instructor starts pending until someone with manage_instructors
          // reviews it; INSERT OR IGNORE means re-promoting someone who already has a row (e.g. a
          // demoted-then-restored instructor) leaves their prior status alone instead of resetting it.
          if(role==='instructor'&&target.role!=='instructor')statements.push(['INSERT OR IGNORE INTO instructor_approvals(user_id,status,created_at) VALUES(?,?,?)',[target.id,'pending',now()]]);
          await db.batch(statements);await audit(user,'user.update',target.id);return reply({ok:true});
        }
        if(path[1]==='users'&&path[2]&&!path[3]&&method==='DELETE'){
          const target=await get('SELECT * FROM users WHERE id=?',path[2]);if(!target)fail(404,'User not found.');if(target.id===user.id)fail(409,'You cannot delete your own account.');if(target.role==='admin')fail(409,'Administrator accounts must be reassigned before deletion.');
          const activity=await get("SELECT (SELECT COUNT(*) FROM enrollments WHERE user_id=?)+(SELECT COUNT(*) FROM progress WHERE user_id=?)+(SELECT COUNT(*) FROM notes WHERE user_id=?)+(SELECT COUNT(*) FROM submissions WHERE user_id=?)+(SELECT COUNT(*) FROM certificates WHERE user_id=?)+(SELECT COUNT(*) FROM billing_customers WHERE user_id=?)+(SELECT COUNT(*) FROM subscriptions WHERE user_id=?)+(SELECT COUNT(*) FROM threads WHERE author_id=?)+(SELECT COUNT(*) FROM replies WHERE author_id=?)+(SELECT COUNT(*) FROM live_classes WHERE host_id=?)+(SELECT COUNT(*) FROM courses WHERE owner_id=?) AS n",target.id,target.id,target.id,target.id,target.id,target.id,target.id,target.id,target.id,target.id,target.id);
          if(activity.n)fail(409,'This account has learning, teaching, community, or billing history. Deactivate it to preserve records.');
          await db.batch([['DELETE FROM audit_log WHERE actor_id=?',[target.id]],['DELETE FROM users WHERE id=?',[target.id]]]);await audit(user,'user.delete',target.id);return reply({ok:true});
        }
        if(path[1]==='users'&&path[2]&&path[3]==='instructor-approval'&&method==='PATCH'){
          requirePermission(user,'manage_instructors');
          const target=await get('SELECT * FROM users WHERE id=?',path[2]);if(!target)fail(404,'User not found.');if(target.role!=='instructor')fail(409,'This account is not an instructor.');
          if(!['approved','rejected'].includes(body.status))fail(400,'Status must be approved or rejected.');
          await db.batch([['INSERT INTO instructor_approvals(user_id,status,reviewed_by,reviewed_at,created_at) VALUES(?,?,?,?,?) ON CONFLICT(user_id) DO UPDATE SET status=excluded.status,reviewed_by=excluded.reviewed_by,reviewed_at=excluded.reviewed_at',[target.id,body.status,user.id,now(),now()]],['DELETE FROM sessions WHERE user_id=?',[target.id]]]);
          await audit(user,'instructor.'+body.status,target.id);return reply({ok:true});
        }
        if(path[1]==='enrollments'&&method==='POST'){
          requirePermission(user,'manage_students');
          const target=await get('SELECT id FROM users WHERE id=?',body.userId);if(!target)fail(404,'User not found.');
          const course=await get("SELECT * FROM courses WHERE id=? AND publication='published'",body.courseId);if(!course)fail(404,'Course not found.');
          if(!(await get('SELECT id FROM lessons WHERE course_id=? LIMIT 1',course.id)))fail(409,'This course has no lessons yet.');
          await run('INSERT OR IGNORE INTO enrollments VALUES(?,?,?)',target.id,course.id,now());
          await audit(user,'enrollment.manual',target.id+':'+course.id);return reply({ok:true},201);
        }
        if(path[1]==='users'&&path[2]&&path[3]==='progress'&&method==='GET'){
          requirePermission(user,'manage_students');
          const target=await get('SELECT id,name,email FROM users WHERE id=?',path[2]);if(!target)fail(404,'User not found.');
          const enrollments=await all('SELECT e.course_id,e.created_at AS enrolled_at,c.metadata FROM enrollments e JOIN courses c ON c.id=e.course_id WHERE e.user_id=? ORDER BY e.created_at DESC',target.id);
          const detail=await Promise.all(enrollments.map(async row=>{
            const total=(await get('SELECT COUNT(*) AS n FROM lessons WHERE course_id=?',row.course_id)).n;
            const completed=(await get('SELECT COUNT(*) AS n FROM progress p JOIN lessons l ON l.id=p.lesson_id WHERE l.course_id=? AND p.user_id=? AND p.completed_at IS NOT NULL',row.course_id,target.id)).n;
            const lastSeen=(await get('SELECT MAX(last_seen) AS at FROM progress p JOIN lessons l ON l.id=p.lesson_id WHERE l.course_id=? AND p.user_id=?',row.course_id,target.id)).at;
            return {courseId:row.course_id,courseTitle:JSON.parse(row.metadata).title,enrolledAt:row.enrolled_at,totalLessons:total,completedLessons:completed,progress:total?Math.round(completed/total*100):0,lastActivity:lastSeen};
          }));
          return reply({user:target,enrollments:detail});
        }
      }
      fail(404,'Endpoint not found.');
    } catch(error){if(error instanceof HttpError)return reply({error:error.message},error.status);if(String(error.message).includes('UNIQUE constraint'))return reply({error:'This record already exists. Refresh and try again.'},409);console.error('LMS request failed',error.message);return reply({error:'The request could not be completed. Please try again.'},500)}
  }
  return {handle,seedCourses,runNotificationSweep};
}
function reply(data,status=200,headers={}){return Response.json(data,{status,headers:{'Cache-Control':'no-store','X-Content-Type-Options':'nosniff',...headers}})}
