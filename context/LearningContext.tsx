'use client';
import React,{createContext,useContext,useEffect,useRef,useState} from 'react';
import {initialData,CurrentUser,CommunityThread} from '@/lib/data';
import {AuthScreen} from '@/components/auth/AuthScreen';
export interface NotificationSettings {emailDigest:boolean;assignmentGraded:boolean;liveClassReminders:boolean;communityReplies:boolean}
export interface WorkspaceSettings {timezone:string;language:string;density:'comfortable'|'compact'}
interface Account {id:string;name:string;email:string;role:'learner'|'instructor'|'admin';emailVerified:boolean}
export interface BillingState {configured:boolean;plan:'free'|'pro';subscription:null|{status:string;planKey:'pro-monthly'|'pro-yearly';currentPeriodEnd:string|null;cancelAtPeriodEnd:boolean};canManage:boolean}
interface LearningContextType {
 data:typeof initialData; theme:'dark'|'light';toggleTheme:()=>void;savedCourses:string[];enrolledCourses:string[];
 toggleSaveCourse:(id:string)=>Promise<boolean>;enrollCourse:(id:string)=>Promise<boolean>;completeLesson:(courseId:string,lessonId:string)=>Promise<boolean>;
 userNotes:Record<string,string>;saveNote:(id:string,note:string)=>void;weeklyGoalHours:number;setWeeklyGoalHours:(hours:number)=>Promise<boolean>;
 upvoteThread:(id:string)=>Promise<boolean>;communityThreads:CommunityThread[];updateUserProfile:(updates:Partial<CurrentUser>)=>Promise<boolean>;
 notificationSettings:NotificationSettings;updateNotificationSettings:(settings:Partial<NotificationSettings>)=>Promise<boolean>;
 workspaceSettings:WorkspaceSettings;updateWorkspaceSettings:(settings:Partial<WorkspaceSettings>)=>Promise<boolean>;
 account:Account;logout:()=>Promise<void>;api:(path:string,method?:string,body?:unknown)=>Promise<any>;refresh:()=>Promise<void>;noteStatus:string;lastLessons:Record<string,string>;
 resendVerification:()=>Promise<boolean>;billing:BillingState;startCheckout:(plan:'pro-monthly'|'pro-yearly')=>Promise<void>;openBillingPortal:()=>Promise<void>;
}
const Context=createContext<LearningContextType|undefined>(undefined);
export function LearningProvider({children}:{children:React.ReactNode}) {
 const [data,setData]=useState(initialData);const [account,setAccount]=useState<Account|null>(null);const [loading,setLoading]=useState(true);const [error,setError]=useState('');const [setupRequired,setSetupRequired]=useState(false);
 const [theme,setTheme]=useState<'dark'|'light'>('light');const [savedCourses,setSaved]=useState<string[]>([]);const [enrolledCourses,setEnrolled]=useState<string[]>([]);const [userNotes,setNotes]=useState<Record<string,string>>({});const [lastLessons,setLast]=useState<Record<string,string>>({});
 const [weeklyGoalHours,setGoal]=useState(5);const [communityThreads,setThreads]=useState<CommunityThread[]>([]);const [noteStatus,setNoteStatus]=useState('Saved to your account');
 const [notificationSettings,setNotifications]=useState<NotificationSettings>({emailDigest:false,assignmentGraded:true,liveClassReminders:true,communityReplies:true});
 const [workspaceSettings,setWorkspace]=useState<WorkspaceSettings>({timezone:'UTC+0 (Greenwich Mean Time)',language:'English (US)',density:'comfortable'});
 const [billing,setBilling]=useState<BillingState>({configured:false,plan:'free',subscription:null,canManage:false});
 const pendingNotes=useRef<Record<string,string>>({});const timers=useRef<Record<string,ReturnType<typeof setTimeout>>>({});const queue=useRef(Promise.resolve());
 async function api(path:string,method='GET',body?:unknown){const response=await fetch('/api/'+path,{method,headers:body===undefined?{}:{'Content-Type':'application/json'},body:body===undefined?undefined:JSON.stringify(body),cache:'no-store'});const result=await response.json();if(!response.ok){if(response.status===401)setAccount(null);throw Error(result.error||'Unable to complete the request.')}return result;}
 async function refresh(){const state=await api('workspace');setAccount(state.user);setBilling(state.billing);setData({...initialData,...state,continueCourse:{...initialData.continueCourse,id:state.continueCourse},currentUser:state.currentUser});setSaved(state.savedCourses);setEnrolled(state.enrolledCourses);setNotes({...state.userNotes,...pendingNotes.current});setThreads(state.communityThreads);setGoal(state.settings.weeklyGoalHours??5);setLast(state.lastLessons);if(state.settings.notifications)setNotifications(prev=>({...prev,...state.settings.notifications}));if(state.settings.workspace)setWorkspace(prev=>({...prev,...state.settings.workspace}));}
 async function initialize(){setLoading(true);setError('');try{const session=await api('auth/session');setSetupRequired(session.setupRequired);if(session.user)await refresh();else setAccount(null)}catch(error){setError(error instanceof Error?error.message:'Unable to connect to the server.')}finally{setLoading(false)}}
 useEffect(()=>{void initialize();try{const value=localStorage.getItem('apex-learning-theme-v1');if(value==='light'||value==='dark'){setTheme(value);document.body.classList.toggle('light-theme',value==='light')}}catch{}},[]);
 useEffect(()=>{const protect=(event:BeforeUnloadEvent)=>{if(Object.keys(pendingNotes.current).length){event.preventDefault();event.returnValue=''}};window.addEventListener('beforeunload',protect);return()=>window.removeEventListener('beforeunload',protect)},[]);
 function toggleTheme(){setTheme(prev=>{const next=prev==='dark'?'light':'dark';document.body.classList.toggle('light-theme',next==='light');try{localStorage.setItem('apex-learning-theme-v1',next)}catch{}return next})}
 async function mutation(path:string,method:string,body?:unknown){let ok=false;const work=async()=>{try{setError('');await api(path,method,body);await refresh();ok=true}catch(error){setError(error instanceof Error?error.message:'Unable to save.')}};queue.current=queue.current.then(work,work);await queue.current;return ok;}
 function saveNote(id:string,note:string){setNotes(prev=>({...prev,[id]:note}));pendingNotes.current[id]=note;setNoteStatus('Saving…');clearTimeout(timers.current[id]);timers.current[id]=setTimeout(()=>{const work=async()=>{try{await api('lessons/'+id+'/note','PUT',{note});if(pendingNotes.current[id]===note)delete pendingNotes.current[id];setNoteStatus(Object.keys(pendingNotes.current).length?'Saving…':'Saved to your account')}catch(error){setNoteStatus('Not saved — please retry');setError(error instanceof Error?error.message:'Note could not be saved.')}};queue.current=queue.current.then(work,work)},500);}
 async function logout(){if(Object.keys(pendingNotes.current).length){setError('Wait for your notes to save before signing out.');return;}try{await api('auth/logout','POST',{});setAccount(null);setNotes({})}catch(error){setError(String(error))}}
 async function redirectToBilling(path:string,body?:unknown){try{setError('');const result=await api(path,'POST',body);if(result.url)window.location.assign(result.url)}catch(error){setError(error instanceof Error?error.message:'Unable to open billing.')}}
 if(loading)return <main className="auth-shell"><p role="status">Loading your academy…</p></main>;
 if(!account)return <>{error&&<div role="alert" className="backend-error">{error}<button onClick={()=>void initialize()}>Retry connection</button></div>}<AuthScreen setupRequired={setupRequired} onSignedIn={initialize}/></>;
 return <Context.Provider value={{data,account,billing,theme,toggleTheme,savedCourses,enrolledCourses,userNotes,lastLessons,weeklyGoalHours,communityThreads,notificationSettings,workspaceSettings,api,refresh,logout,noteStatus,
 resendVerification:()=>mutation('auth/resend-verification','POST',{}),
 startCheckout:plan=>redirectToBilling('billing/checkout',{plan}),openBillingPortal:()=>redirectToBilling('billing/portal'),
 toggleSaveCourse:id=>mutation('courses/'+id+'/bookmark',savedCourses.includes(id)?'DELETE':'PUT',savedCourses.includes(id)?undefined:{}),
 enrollCourse:id=>mutation('courses/'+id+'/enrollment','POST',{}),completeLesson:(_course,id)=>mutation('lessons/'+id+'/progress','PUT',{completed:true}),saveNote,
 setWeeklyGoalHours:hours=>mutation('settings','PATCH',{weeklyGoalHours:hours}),upvoteThread:id=>mutation('threads/'+id+'/vote','PUT',{}),
 updateUserProfile:updates=>mutation('profile','PATCH',updates),updateNotificationSettings:notifications=>mutation('settings','PATCH',{notifications}),updateWorkspaceSettings:workspace=>mutation('settings','PATCH',{workspace})
 }}>{error&&<div role="alert" className="backend-toast backend-error">{error}<button onClick={()=>{for(const [id,note]of Object.entries(pendingNotes.current))saveNote(id,note);setError('')}}>Dismiss / retry notes</button></div>}{children}</Context.Provider>;
}
export function useLearning(){const context=useContext(Context);if(!context)throw Error('LearningProvider is required');return context}
