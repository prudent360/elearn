import { randomBytes, scrypt as scryptCallback, timingSafeEqual, createHash } from 'node:crypto';
import { promisify } from 'node:util';
const scrypt=promisify(scryptCallback);
export const digest=value=>createHash('sha256').update(value).digest('hex');
export async function hashPassword(password) {
  const salt=randomBytes(16).toString('hex');
  const hash=await scrypt(password,salt,64,{N:32768,r:8,p:1,maxmem:64*1024*1024});
  return `scrypt:${salt}:${hash.toString('hex')}`;
}
export async function verifyPassword(password,stored) {
  const [format,salt,hex]=stored.split(':');
  if(format!=='scrypt'||!salt||!hex)return false;
  const hash=await scrypt(password,salt,64,{N:32768,r:8,p:1,maxmem:64*1024*1024});
  const expected=Buffer.from(hex,'hex');return expected.length===hash.length&&timingSafeEqual(expected,hash);
}
export const newToken=()=>randomBytes(32).toString('hex');
export function sessionCookie(token,request,remove=false) {
  const secure=new URL(request.url).protocol==='https:';
  return `${secure?'__Host-lms_session':'lms_session'}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${remove?0:604800}${secure?'; Secure':''}`;
}
export function readSession(request) {
  const name=new URL(request.url).protocol==='https:'?'__Host-lms_session':'lms_session';
  return request.headers.get('cookie')?.split(';').map(v=>v.trim()).find(v=>v.startsWith(name+'='))?.slice(name.length+1);
}
