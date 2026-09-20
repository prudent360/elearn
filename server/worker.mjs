import assets from './assets.mjs';
import schema from './schema.mjs';
import {createService} from './service.mjs';
import {d1Database} from './d1.mjs';
import {initialData} from './seed.mjs';
let service;let ready;
export default {async fetch(request,env){
  const url=new URL(request.url);
  if(url.pathname.startsWith('/api/')){
    if(!env.DB)return Response.json({error:'The database binding is not configured.'},{status:503});
    try {ready??=env.DB.batch(schema.map(sql=>env.DB.prepare(sql))).catch(error=>{ready=undefined;throw error});await ready;
      service??=createService(d1Database(env.DB),initialData.courses,{origin:env.LMS_ORIGIN,setupToken:env.LMS_SETUP_TOKEN,files:env.FILES});return await service.handle(request);
    }catch(error){console.error('Backend initialization failed',error.message);return Response.json({error:'The database is temporarily unavailable.'},{status:503,headers:{'Cache-Control':'no-store'}})}
  }
  if(url.pathname.startsWith('/course/')){const id=url.pathname.split('/')[2];if(id)return Response.redirect(url.origin+'/course/?id='+encodeURIComponent(id),302)}
  let path=url.pathname;
  if(path==='/')path='/index.html';
  let asset=assets[path]||assets[path.replace(/\/$/,'')+'/index.html'];
  let status=200;if(!asset){asset=assets['/404.html']||assets['/404/index.html'];status=404}
  if(!asset)return new Response('Not found',{status:404});
  const content=Uint8Array.from(atob(asset.body),c=>c.charCodeAt(0));
  return new Response(request.method==='HEAD'?null:content,{status,headers:{'Content-Type':asset.type+'; charset=utf-8','Cache-Control':path.startsWith('/_next/static/')?'public, max-age=31536000, immutable':'no-cache','X-Content-Type-Options':'nosniff','Referrer-Policy':'strict-origin-when-cross-origin','X-Frame-Options':'DENY'}});
}};
