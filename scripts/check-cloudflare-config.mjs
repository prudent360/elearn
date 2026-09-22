import {readFileSync} from 'node:fs';

let config;
try {config=JSON.parse(readFileSync('wrangler.jsonc','utf8'))}
catch {console.error('Copy wrangler.jsonc.example to wrangler.jsonc and set your Cloudflare resource IDs.');process.exit(1)}
const db=config.d1_databases?.find(binding=>binding.binding==='DB');
const files=config.r2_buckets?.find(binding=>binding.binding==='FILES');
if(!db||!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(db.database_id||'')||!files?.bucket_name||files.bucket_name.includes('REPLACE')){
  console.error('Set your real D1 database ID and R2 bucket name in wrangler.jsonc before deploying.');
  process.exit(1);
}
let secrets;
try {secrets=JSON.parse(readFileSync('cloudflare-secrets.json','utf8'))}
catch {console.error('Copy cloudflare-secrets.example.json to cloudflare-secrets.json and set a fresh setup token.');process.exit(1)}
if(typeof secrets.LMS_SETUP_TOKEN!=='string'||secrets.LMS_SETUP_TOKEN.length<32||secrets.LMS_SETUP_TOKEN.includes('REPLACE')){
  console.error('Set a fresh, random LMS_SETUP_TOKEN of at least 32 characters in cloudflare-secrets.json.');
  process.exit(1);
}
console.log('Cloudflare bindings configured.');
