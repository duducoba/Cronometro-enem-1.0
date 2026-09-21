const {spawnSync}=require('node:child_process');
const path=require('node:path');
process.stdout.write('Ready for credentials on stdin (hidden).\n');
if(process.stdin.isTTY)process.stdin.setRawMode(true);
process.stdin.setEncoding('utf8');process.stdin.resume();
let input='';
process.stdin.on('data',chunk=>{input+=chunk;if(!/[\r\n]/.test(input))return;process.stdin.pause();try{publish(JSON.parse(input.trim()));}catch(error){console.error(error.message);process.exit(1);}});
function publish(credential){
  const env={...process.env,GIT_CONFIG_COUNT:'2',GIT_CONFIG_KEY_0:'safe.directory',GIT_CONFIG_VALUE_0:process.cwd().replaceAll('\\','/'),GIT_CONFIG_KEY_1:'http.extraHeader',GIT_CONFIG_VALUE_1:'Authorization: Bearer '+credential.token,GIT_TERMINAL_PROMPT:'0'};
  function run(command,args){const result=spawnSync(command,args,{env,encoding:'utf8',windowsHide:true});if(result.status!==0)throw new Error(command+' failed: '+(result.stderr||result.error?.message||'unknown error'));return result.stdout.trim();}
  run('git',['add','--','.openai/hosting.json','.gitignore','.env.example','dist','worker.mjs','build.cjs','package.json','test-auth.mjs','test-timer.cjs','preview.cjs','publish.cjs']);
  run('git',['-c','user.name=Codex','-c','user.email=codex@openai.com','commit','-m','Build two-screen ENEM timer with server-side password access']);
  run('git',['push',credential.remote_url,'HEAD:refs/heads/'+credential.branch]);
  const commit_sha=run('git',['rev-parse','--verify','HEAD']);
  const archive=path.resolve('..','quadro-enem.tar.gz');
  run('tar',['-czf',archive,'.openai/hosting.json','dist/server/index.js']);
  const entries=run('tar',['-tzf',archive]);
  if(!entries.includes('.openai/hosting.json')||!entries.includes('dist/server/index.js'))throw new Error('Archive incomplete');
  console.log(JSON.stringify({project_id:'appgprj_6ab179449a588191ac424b07fc1ee701',commit_sha,archive}));process.exit(0);
}
