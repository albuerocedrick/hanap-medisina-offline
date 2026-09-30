import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import { fileURLToPath } from 'node:url';

const dir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const root = path.dirname(dir);
const activityPath = path.join(dir, 'activity.json');
const read = name => JSON.parse(fs.readFileSync(path.join(dir, name), 'utf8').replace(/^\uFEFF/, ''));
const save = data => {
  const temp = activityPath + '.tmp';
  fs.writeFileSync(temp, JSON.stringify(data, null, 2));
  fs.renameSync(temp, activityPath);
};
const empty = () => ({task:'Waiting for an AI task', status:'idle', files:[], events:[], updatedAt:null});
const activity = () => fs.existsSync(activityPath) ? read('activity.json') : empty();
const [command = 'build', ...args] = process.argv.slice(2);
if (command === 'build') {
  const template = fs.readFileSync(path.join(dir, 'viewer/index.html'), 'utf8');
  const data = JSON.stringify(read('graph.json')).replace(/</g, '\\u003c');
  fs.writeFileSync(path.join(dir, 'graph.html'), template.replace('/*GRAPH_DATA*/ null', data));
  console.log('Built graphify-out/graph.html');
} else if (command === 'start') {
  if (!args.length) throw Error('Provide a task description');
  save({...empty(), task:args.join(' '), status:'working', updatedAt:new Date().toISOString()});
} else if (command === 'use') {
  if (!args.length) throw Error('Provide repository-relative file paths');
  const state = activity();
  if (state.status !== 'working') throw Error('Start a task before recording files');
  for (const file of args) {
    const relative = path.relative(root, path.resolve(root, file)).replaceAll('\\', '/');
    if (relative.startsWith('../') || path.isAbsolute(relative) || !fs.statSync(path.join(root, relative)).isFile()) throw Error('Not a repository file: ' + file);
    if (!state.files.includes(relative)) state.files.push(relative);
    state.events.push({file:relative, at:new Date().toISOString()});
  }
  state.events = state.events.slice(-100);
  state.updatedAt = new Date().toISOString(); save(state);
} else if (command === 'finish') {
  const state = activity(); state.status='complete'; state.updatedAt=new Date().toISOString(); save(state);
} else if (command === 'serve') {
  const port = Number(args[0] || 8765);
  const server = http.createServer((req,res) => {
    const pathname = new URL(req.url, 'http://127.0.0.1').pathname;
    if(req.method !== 'GET') {res.writeHead(405);res.end();return;}
    res.setHeader('Cache-Control','no-store');
    res.setHeader('X-Content-Type-Options','nosniff');
    if(pathname === '/activity.json') {
      res.setHeader('Content-Type','application/json'); res.end(JSON.stringify(activity()));
    } else if(pathname === '/' || pathname === '/graph.html') {
      res.setHeader('Content-Type','text/html; charset=utf-8');res.end(fs.readFileSync(path.join(dir,'graph.html')));
    } else {res.writeHead(404);res.end('Not found');}
  });
  server.listen(port,'127.0.0.1',()=>console.log(`Graph viewer: http://127.0.0.1:${port}`));
} else throw Error('Commands: build, serve, start, use, finish');
