import { DatabaseSync } from 'node:sqlite';
import { mkdirSync, readFileSync, readdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
export function openDatabase(path = process.env.LMS_DATABASE_PATH || resolve('.data/lms.sqlite')) {
  if(path !== ':memory:') mkdirSync(dirname(path),{recursive:true});
  const sqlite = new DatabaseSync(path);
  sqlite.exec('PRAGMA foreign_keys=ON; PRAGMA journal_mode=WAL; PRAGMA busy_timeout=5000;');
  // Every migration file is written to be safe to re-run (CREATE TABLE/INDEX IF NOT EXISTS),
  // so applying all of them in order on every startup keeps the schema current without tracking state.
  for(const file of readdirSync(resolve('db/migrations')).filter(name=>name.endsWith('.sql')).sort())
    sqlite.exec(readFileSync(resolve('db/migrations',file),'utf8'));
  return {
    async all(sql,args=[]){return sqlite.prepare(sql).all(...args)},
    async get(sql,args=[]){return sqlite.prepare(sql).get(...args)},
    async run(sql,args=[]){return sqlite.prepare(sql).run(...args)},
    async batch(statements){sqlite.exec('BEGIN IMMEDIATE');try{const results=statements.map(([sql,args=[]])=>sqlite.prepare(sql).run(...args));sqlite.exec('COMMIT');return results}catch(error){sqlite.exec('ROLLBACK');throw error}},
    close(){sqlite.close()}
  };
}
