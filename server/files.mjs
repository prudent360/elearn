import {mkdir,writeFile,readFile,unlink} from 'node:fs/promises';
import {resolve} from 'node:path';
export function localFiles(directory=resolve('.data/uploads')){return {
 async put(id,bytes){await mkdir(directory,{recursive:true});await writeFile(resolve(directory,id),new Uint8Array(bytes),{mode:0o600})},
 async get(id){try{return {body:await readFile(resolve(directory,id))}}catch(error){if(error.code==='ENOENT')return null;throw error}},
 async delete(id){try{await unlink(resolve(directory,id))}catch(error){if(error.code!=='ENOENT')throw error}}
}}
