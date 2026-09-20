export function d1Database(binding) {
  return {
    async all(sql,args=[]){return (await binding.prepare(sql).bind(...args).all()).results},
    async get(sql,args=[]){return binding.prepare(sql).bind(...args).first()},
    async run(sql,args=[]){return binding.prepare(sql).bind(...args).run()},
    async batch(statements){return binding.batch(statements.map(([sql,args=[]])=>binding.prepare(sql).bind(...args)))}
  };
}
