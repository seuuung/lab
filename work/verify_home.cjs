const fs = require('node:fs'), vm = require('node:vm'), assert = require('node:assert/strict');
const html = fs.readFileSync('index.html','utf8');
const categories = [...html.matchAll(/<article class="project-item" data-category="(.*?)">/g)].map(x=>x[1]);
function element(dataset={}) { return {dataset, hidden:false, handlers:{}, style:{setProperty(){}, removeProperty(){}}, classList:{toggle(){}}, attrs:{}, addEventListener(k,f){this.handlers[k]=f}, setAttribute(k,v){this.attrs[k]=v}, textContent:''}; }
const buttons = ['all','app','game','lab'].map(filter=>element({filter})), items=categories.map(category=>element({category}));
const ids = Object.fromEntries(['sfx-toggle-btn','sfx-label','result-count','empty-state','year'].map(id=>[id,element()]));
const hero=element(), orbital=element(), listeners={};
const context = {document:{querySelectorAll(s){return s==='.tab-btn'?buttons:s==='.project-item'?items:[]}, getElementById(id){return ids[id]}, querySelector(s){return s==='.hero-art'?hero:orbital},addEventListener(){}},matchMedia:()=>({matches:true}),location:{hash:'#game'},history:{replaceState(a,b,h){context.location.hash=h}}, window:{addEventListener(k,f){listeners[k]=f}},Date};
vm.runInNewContext(fs.readFileSync('home.js','utf8'),context);
assert.equal(items.filter(x=>!x.hidden).length,6);
for (let i=0;i<buttons.length;i++){buttons[i].handlers.click();assert.equal(items.filter(x=>!x.hidden).length,[11,2,6,3][i]);assert.equal(buttons[i].attrs['aria-pressed'],'true');assert.equal(context.location.hash,'#'+buttons[i].dataset.filter)}
ids['sfx-toggle-btn'].handlers.click();assert.equal(ids['sfx-toggle-btn'].attrs['aria-pressed'],'true');
ids['sfx-toggle-btn'].handlers.click();assert.equal(ids['sfx-toggle-btn'].attrs['aria-pressed'],'false');
context.location.hash='#app';listeners.hashchange();assert.equal(items.filter(x=>!x.hidden).length,2);
for(const m of html.matchAll(/href="(game\/[^"#]+)"/g))assert.ok(fs.existsSync(decodeURIComponent(m[1])),m[1]);
const before = JSON.parse(fs.readFileSync('work/original-projects.json','utf8'));for (const p of before) assert.ok(html.includes(p.title));
for(const match of html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/g))new vm.Script(match[1]);
console.log('PASS: 11 projects, all local destinations, four filters, initial hash, hash navigation, audio toggle, and script syntax.');
