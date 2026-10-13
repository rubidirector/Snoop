(function(){
'use strict';
var $=function(s,r){return (r||document).querySelector(s)};
var esc=function(s){return String(s==null?'':s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]})};
var str=function(x){return x==null?'':String(x)};
var arr=function(x){return Array.isArray(x)?x:[]};
var uid=function(){return Math.random().toString(36).slice(2,9)};

/* ---------- state ---------- */
var S={},PUBLISHED_AT=0;

function isHex(c){return typeof c==='string'&&/^#[0-9a-f]{3,8}$/i.test(c.trim())}
var PALS=[['#8b9bb0','#d8d2c4','#5d6b7d'],['#c9a27e','#6e4f3c','#efe0cc'],['#6f8f8a','#cfd9d2','#3e5552'],['#b58ea0','#f0d9df','#5c4452'],['#2f3546','#e0b25a','#141820'],['#a9b7c6','#eef1f4','#64748b']];
function hash(s){var h=0;s=str(s);for(var i=0;i<s.length;i++)h=(h*31+s.charCodeAt(i))|0;return Math.abs(h)}
function normPh(ph){ph=ph||{};var c=arr(ph.c).filter(isHex).slice(0,3);return {c:c,l:str(ph.l)}}
function normItem(it){
  if(!it||typeof it!=='object')return null;
  if(it.k==='date'){var dd={k:'date',v:str(it.v)};if(it.lv)dd.lv=1;return dd}
  var k=['text','photo','voice'].indexOf(it.k)>=0?it.k:'text';
  var o={w:it.w==='me'?'me':'them',k:k};
  if(k==='text')o.v=str(it.v);
  if(k==='photo'){o.img=it.img||null;o.ph=normPh(it.ph)}
  if(k==='voice')o.dur=str(it.dur)||'0:05';
  if(it.n)o.n=str(it.n);
  if(it.t)o.t=str(it.t);
  if(it.lv)o.lv=1;
  return o;
}
function normalize(s){
  var o=s.owner||{};
  s.owner={name:str(o.name)||'나',status:str(o.status),avatar:o.avatar||null,wall:WALLS[o.wall]?o.wall:'dusk',wallImg:o.wallImg||null,
    time:/^\d{1,2}:\d{2}$/.test(str(o.time))?str(o.time):'00:46',date:/^\d{4}-\d{2}-\d{2}$/.test(str(o.date))?str(o.date):'2026-10-11',
    battery:Math.min(100,Math.max(1,parseInt(o.battery,10)||42)),pass:/^\d{4,6}$/.test(str(o.pass))?str(o.pass):'',hint:str(o.hint)};
  var sc=s.scenario||{};s.scenario={title:str(sc.title),text:str(sc.text),cast:str(sc.cast)};
  s.threads=arr(s.threads).filter(function(t){return t&&typeof t==='object'}).map(function(t){return {id:str(t.id)||uid(),app:t.app==='talk'?'talk':'msg',name:str(t.name)||'이름 없음',avatar:t.avatar||null,pinned:!!t.pinned,
    unread:Math.max(0,parseInt(t.unread,10)||0),when:str(t.when),group:!!t.group,members:arr(t.members).map(str).filter(Boolean),status:str(t.status),
    items:arr(t.items).map(normItem).filter(Boolean),lv:t.lv?1:undefined}});
  s.friends=arr(s.friends).map(function(f){return {name:str(f&&f.name),status:str(f&&f.status)}}).filter(function(f){return f.name});
  s.gallery=arr(s.gallery).filter(Boolean).map(function(g){return {id:str(g.id)||uid(),img:g.img||null,ph:normPh(g.ph),date:str(g.date),fav:!!g.fav}});
  s.search=arr(s.search).map(str).filter(Boolean);
  s.contacts=arr(s.contacts).filter(function(c){return c&&typeof c==='object'}).map(function(c){return {name:str(c.name),phone:str(c.phone),memo:str(c.memo),fav:!!c.fav}}).filter(function(c){return c.name});
  s.memos=arr(s.memos).filter(Boolean).map(function(m){return {title:str(m.title),body:str(m.body),date:str(m.date)}});
  s.calls=arr(s.calls).filter(Boolean).map(function(c){return {name:str(c.name),type:['missed','in','out'].indexOf(c.type)>=0?c.type:'in',time:str(c.time),count:Math.max(1,parseInt(c.count,10)||1)}}).filter(function(c){return c.name});
  s.events=arr(s.events).filter(Boolean).map(function(e){return {d:str(e.d),t:str(e.t)}}).filter(function(e){return /^\d{4}-\d{2}-\d{2}$/.test(e.d)});
  s.images=(s.images&&typeof s.images==='object'&&!Array.isArray(s.images))?s.images:{};
  var y=s.system&&typeof s.system==='object'?s.system:{},pr=y.protagonist||{};
  s.system={protagonist:{personality:str(pr.personality),speech:str(pr.speech),secret:str(pr.secret),want:str(pr.want)},
    characters:arr(y.characters).filter(function(c){return c&&typeof c==='object'}).map(function(c){return {name:str(c.name),role:str(c.role),personality:str(c.personality),speech:str(c.speech),secret:str(c.secret),ping:Math.max(0,Math.min(100,parseInt(c.ping,10)||0))}}).filter(function(c){return c.name}),
    relations:arr(y.relations).filter(function(r){return r&&r.a&&r.b}).map(function(r){return {a:str(r.a),b:str(r.b),desc:str(r.desc)}}),
    world:str(y.world),truth:str(y.truth),rules:str(y.rules),initiate:{on:!!(y.initiate&&y.initiate.on),freq:['low','mid','high'].indexOf(y.initiate&&y.initiate.freq)>=0?y.initiate.freq:'mid'}};
  s.v=1;s.savedAt=s.savedAt||0;s.id=str(s.id);s.concept=str(s.concept);
  return s;
}

/* ---------- look ---------- */
var WALLS={
  dusk:'radial-gradient(80% 55% at 15% 8%,#7a5bb0 0%,transparent 62%),radial-gradient(70% 55% at 95% 85%,#c46f6a 0%,transparent 62%),linear-gradient(180deg,#1c1838,#2a1f3d 50%,#3a2433)',
  sea:'radial-gradient(90% 60% at 80% 10%,#9cc9d6 0%,transparent 60%),linear-gradient(180deg,#0d2b3e,#1f5672 55%,#6aa3a8)',
  rose:'radial-gradient(80% 60% at 20% 15%,#f3c3b4 0%,transparent 60%),linear-gradient(180deg,#3d1e2c,#9b5469 55%,#e9b0a2)',
  night:'radial-gradient(60% 40% at 70% 20%,#2a3350 0%,transparent 70%),linear-gradient(180deg,#05060a,#12151d)',
  forest:'radial-gradient(70% 50% at 30% 20%,#9db08a 0%,transparent 60%),linear-gradient(180deg,#0f2018,#2d4a3a 55%,#6f866a)',
  mono:'linear-gradient(180deg,#2a2a2e,#4c4c52 60%,#77777e)'
};
function wallCss(){var w=S.owner.wallImg&&S.images[S.owner.wallImg];return w?'background:#000 url('+w+') center/cover no-repeat':'background:'+(WALLS[S.owner.wall]||WALLS.dusk)}
function phBg(ph){var c=(ph&&ph.c&&ph.c.length)?ph.c:PALS[hash(ph&&ph.l)%PALS.length];var a=c[0],b=c[1]||c[0],d=c[2]||b;
  return 'background:radial-gradient(110% 85% at 28% 22%,'+a+' 0%,transparent 62%),radial-gradient(95% 80% at 78% 82%,'+b+' 0%,transparent 66%),linear-gradient(165deg,'+d+','+b+')'}
function pic(it){var src=it&&it.img&&S.images[it.img];return src?{style:'background-image:url('+src+')',cls:''}:{style:phBg(it&&it.ph),cls:'ph'}}

var I={
  back:'<svg viewBox="0 0 24 24" width="24" height="24"><path d="M15 4l-8 8 8 8" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  video:'<svg viewBox="0 0 28 20" width="26" height="19"><rect x="1.5" y="3" width="17" height="14" rx="3.5" fill="none" stroke="currentColor" stroke-width="2"/><path d="M19 8.5l6-3.5v10l-6-3.5z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/></svg>',
  plus:'<svg viewBox="0 0 24 24" width="22" height="22"><path d="M12 5v14M5 12h14" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/></svg>',
  mic:'<svg viewBox="0 0 24 24" width="20" height="20"><rect x="9" y="3" width="6" height="11" rx="3" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M5.5 11a6.5 6.5 0 0013 0M12 17.5V21" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>',
  up:'<svg viewBox="0 0 24 24" width="18" height="18"><path d="M12 19V6M6 11l6-6 6 6" fill="none" stroke="#fff" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  search:'<svg viewBox="0 0 24 24" width="18" height="18"><circle cx="10.5" cy="10.5" r="6.5" fill="none" stroke="currentColor" stroke-width="2"/><path d="M15.5 15.5L20 20" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/></svg>',
  compose:'<svg viewBox="0 0 24 24" width="22" height="22"><path d="M11 4H6a2 2 0 00-2 2v12a2 2 0 002 2h12a2 2 0 002-2v-5" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"/><path d="M17.5 3.5l3 3L12 15l-4 1 1-4z" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linejoin="round"/></svg>',
  filter:'<svg viewBox="0 0 24 24"><path d="M4 7h16M7 12h10M10 17h4" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
  clock:'<svg viewBox="0 0 24 24" width="18" height="18"><circle cx="12" cy="12" r="8.5" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M12 7.5V12l3 2" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>',
  x:'<svg viewBox="0 0 24 24" width="15" height="15"><path d="M6 6l12 12M18 6L6 18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
  person:'<svg viewBox="0 0 40 40"><circle cx="20" cy="14" r="7.5" fill="#fff"/><path d="M5 38c1.5-8 7.5-12.5 15-12.5S33.5 30 35 38z" fill="#fff"/></svg>',
  info:'<svg viewBox="0 0 24 24" width="22" height="22"><circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="M12 11v6M12 7.5v.5" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
  play:'<svg viewBox="0 0 24 24"><path d="M7 4.5v15l12.5-7.5z" fill="currentColor"/></svg>',
  pause:'<svg viewBox="0 0 24 24"><path d="M7 4.5h3.5v15H7zM13.5 4.5H17v15h-3.5z" fill="currentColor"/></svg>',
  heart:function(on){return '<svg viewBox="0 0 24 24" width="25" height="25"><path d="M12 20s-7-4.4-7-10a4 4 0 017-2.6A4 4 0 0119 10c0 5.6-7 10-7 10z" fill="'+(on?'currentColor':'none')+'" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/></svg>'},
  share:'<svg viewBox="0 0 24 24" width="24" height="24"><path d="M12 15V3M7.5 7.5L12 3l4.5 4.5M6 11H5v9h14v-9h-1" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  trash:'<svg viewBox="0 0 24 24" width="24" height="24"><path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/></svg>',
  handset:'<path d="M6.6 10.8a15.1 15.1 0 006.6 6.6l2.2-2.2a1 1 0 011-.25 11.4 11.4 0 003.6.57 1 1 0 011 1V20a1 1 0 01-1 1A17 17 0 013 4a1 1 0 011-1h3.5a1 1 0 011 1c0 1.25.2 2.45.57 3.57a1 1 0 01-.25 1z"/>',
  menu:'<svg viewBox="0 0 24 24"><path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"/></svg>',
  smile:'<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="8.5" fill="none" stroke="currentColor" stroke-width="1.7"/><path d="M8.5 14c1 1.5 2.2 2.2 3.5 2.2s2.5-.7 3.5-2.2" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/><circle cx="9" cy="10" r="1.1" fill="currentColor"/><circle cx="15" cy="10" r="1.1" fill="currentColor"/></svg>',
  hash:'<svg viewBox="0 0 24 24"><path d="M9.5 4L8 20M16 4l-1.5 16M4.5 9h15M4 15h15" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>',
  sendk:'<svg viewBox="0 0 24 24"><path d="M12 19V6M6.5 11.5L12 6l5.5 5.5" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  tPerson:'<svg viewBox="0 0 24 24"><circle cx="12" cy="8.5" r="4" fill="currentColor"/><path d="M4 20.5c.8-4.3 4-6.5 8-6.5s7.2 2.2 8 6.5z" fill="currentColor"/></svg>',
  tChat:'<svg viewBox="0 0 24 24"><path d="M12 4C7 4 3 7.1 3 11c0 2.5 1.6 4.6 4.1 5.9L6.3 20.5l4.2-2.7c.5.1 1 .1 1.5.1 5 0 9-3.1 9-7S17 4 12 4z" fill="currentColor"/></svg>',
  tMore:'<svg viewBox="0 0 24 24"><circle cx="5.5" cy="12" r="2" fill="currentColor"/><circle cx="12" cy="12" r="2" fill="currentColor"/><circle cx="18.5" cy="12" r="2" fill="currentColor"/></svg>',
  star:'<svg viewBox="0 0 24 24"><path d="M12 3.5l2.6 5.4 5.9.8-4.3 4.1 1 5.9L12 17l-5.2 2.7 1-5.9-4.3-4.1 5.9-.8z" fill="currentColor"/></svg>',
  people:'<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9.5" fill="currentColor"/><circle cx="12" cy="10" r="3.2" fill="#fff"/><path d="M6.5 18.3c1.2-2.4 3.2-3.6 5.5-3.6s4.3 1.2 5.5 3.6" fill="#fff"/></svg>',
  keypad:'<svg viewBox="0 0 24 24"><g fill="currentColor"><circle cx="6" cy="5" r="1.9"/><circle cx="12" cy="5" r="1.9"/><circle cx="18" cy="5" r="1.9"/><circle cx="6" cy="11" r="1.9"/><circle cx="12" cy="11" r="1.9"/><circle cx="18" cy="11" r="1.9"/><circle cx="6" cy="17" r="1.9"/><circle cx="12" cy="17" r="1.9"/><circle cx="18" cy="17" r="1.9"/><circle cx="12" cy="22" r="1.6"/></g></svg>',
  outcall:'<svg viewBox="0 0 24 24"><path d="M9 15L20 4M13 4h7v7" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  torch:'<svg viewBox="0 0 24 24" width="22" height="22"><path d="M8 3h8v4l-2 3v11h-4V10L8 7z" fill="none" stroke="#fff" stroke-width="1.7" stroke-linejoin="round"/></svg>',
  cam:'<svg viewBox="0 0 24 24" width="22" height="22"><path d="M4 8h3l1.5-2h7L17 8h3v11H4z" fill="none" stroke="#fff" stroke-width="1.7" stroke-linejoin="round"/><circle cx="12" cy="13" r="3.3" fill="none" stroke="#fff" stroke-width="1.7"/></svg>'
};
var APPI={
  phone:'<svg viewBox="0 0 62 62"><defs><linearGradient id="gp" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#6ef283"/><stop offset="1" stop-color="#1fc23b"/></linearGradient></defs><rect width="62" height="62" fill="url(#gp)"/><g transform="translate(15 15) scale(1.35)" fill="#fff">'+I.handset+'</g></svg>',
  msg:'<svg viewBox="0 0 62 62"><defs><linearGradient id="gm" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#6ef283"/><stop offset="1" stop-color="#1fc23b"/></linearGradient></defs><rect width="62" height="62" fill="url(#gm)"/><ellipse cx="31" cy="29" rx="19" ry="15.5" fill="#fff"/><path d="M17 39c-1 4-3 6.5-5 7.5 5 .3 9-1.6 11-4z" fill="#fff"/></svg>',
  talk:'<svg viewBox="0 0 62 62"><rect width="62" height="62" fill="#fee500"/><ellipse cx="31" cy="29" rx="19" ry="15" fill="#3a1d1d"/><path d="M21 39l-2.5 8 8.5-5.5z" fill="#3a1d1d"/></svg>',
  web:'<svg viewBox="0 0 62 62"><defs><linearGradient id="gw" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#4fb4ff"/><stop offset="1" stop-color="#1366e8"/></linearGradient></defs><rect width="62" height="62" fill="url(#gw)"/><circle cx="31" cy="31" r="17" fill="none" stroke="#fff" stroke-width="2.6"/><ellipse cx="31" cy="31" rx="7.5" ry="17" fill="none" stroke="#fff" stroke-width="2.2"/><path d="M14.5 26h33M14.5 36h33" stroke="#fff" stroke-width="2.2"/></svg>',
  photos:'<svg viewBox="0 0 62 62"><rect width="62" height="62" fill="#fff"/><circle cx="40" cy="21" r="7" fill="#ffb33a"/><path d="M6 50l15-19 10 11 8-8 17 16z" fill="#33b073"/><path d="M6 50l15-19 6 7-9 12z" fill="#1f8f59"/><path d="M6 52h50v3H6z" fill="#3b82f6" opacity=".8"/></svg>',
  memo:'<svg viewBox="0 0 62 62"><rect width="62" height="62" fill="#fff"/><rect width="62" height="17" fill="#ffd04a"/><path d="M10 28h42M10 37h42M10 46h30" stroke="#d6d6db" stroke-width="2"/></svg>',
  camera:'<svg viewBox="0 0 62 62"><defs><linearGradient id="gc" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#e3e5ea"/><stop offset="1" stop-color="#9da1a8"/></linearGradient></defs><rect width="62" height="62" fill="url(#gc)"/><rect x="10" y="19" width="42" height="28" rx="6" fill="#2b2b2e"/><circle cx="31" cy="33" r="10" fill="#4a4a50"/><circle cx="31" cy="33" r="6" fill="#16161a"/><circle cx="33" cy="31" r="1.6" fill="#7b8cff"/></svg>',
  clock:'<svg viewBox="0 0 62 62"><rect width="62" height="62" fill="#111"/><circle cx="31" cy="31" r="22" fill="#fff"/><path d="M31 16v15l9 6" stroke="#111" stroke-width="2.6" stroke-linecap="round" fill="none"/><path d="M31 31L22 24" stroke="#ff9500" stroke-width="1.4"/><circle cx="31" cy="31" r="2" fill="#ff9500"/></svg>',
  weather:'<svg viewBox="0 0 62 62"><defs><linearGradient id="gwe" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2f7fe0"/><stop offset="1" stop-color="#7fc3f8"/></linearGradient></defs><rect width="62" height="62" fill="url(#gwe)"/><circle cx="24" cy="24" r="9" fill="#ffd23f"/><path d="M22 44h22a8 8 0 00-1.5-15.8A10 10 0 0024 32a6 6 0 00-2 12z" fill="#fff"/></svg>',
  map:'<svg viewBox="0 0 62 62"><rect width="62" height="62" fill="#eaf2e3"/><path d="M0 40L62 22" stroke="#fff" stroke-width="7"/><path d="M22 0l10 62" stroke="#ffd36b" stroke-width="5"/><rect x="38" y="36" width="24" height="26" fill="#bfe0a6"/><path d="M42 14a7 7 0 0114 0c0 5-7 12-7 12s-7-7-7-12z" fill="#ff3b30"/><circle cx="49" cy="14" r="2.4" fill="#fff"/></svg>',
  music:'<svg viewBox="0 0 62 62"><defs><linearGradient id="gmu" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ff6b8b"/><stop offset="1" stop-color="#f6304f"/></linearGradient></defs><rect width="62" height="62" fill="url(#gmu)"/><path d="M25 42V20l17-4v22" fill="none" stroke="#fff" stroke-width="3.2" stroke-linejoin="round"/><ellipse cx="21" cy="42" rx="5" ry="4" fill="#fff"/><ellipse cx="38" cy="38" rx="5" ry="4" fill="#fff"/></svg>'
};

/* ---------- helpers ---------- */
var DOW=['일','월','화','수','목','금','토'];
function parseD(s){var m=/^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(s||'');return m?new Date(+m[1],+m[2]-1,+m[3]):new Date()}
function fmtD(s){var m=/^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(s||'');return m?m[1]+'년 '+(+m[2])+'월 '+(+m[3])+'일':s}
var clockTimer=null,clkId=null,clkVal=null,tOverride=0;
// The story's clock starts the first time the phone is opened and keeps running by the real clock, even while the page is closed.
function runKey(){return 'phone-run:'+(S&&S.id?S.id:(location.search||'view'))}
function readRun(){try{var v=parseInt(localStorage.getItem(runKey()),10);return v>0?v:null}catch(e){return null}}
function clk(){var id=runKey();if(clkId!==id){clkId=id;clkVal=readRun();if(clkVal&&!clockTimer)clockTimer=setInterval(tickClock,5000)}return clkVal}
function phoneBase(){var d=parseD(S.owner.date),m=/^(\d{1,2}):(\d{2})$/.exec(str(S.owner.time))||[0,0,0];d.setHours(+m[1],+m[2],0,0);return d}
function phoneNow(){var b=phoneBase(),c=clk();return c?new Date(b.getTime()+((tOverride||Date.now())-c)):b}
function hhmm(d){return String(d.getHours()).padStart(2,'0')+':'+String(d.getMinutes()).padStart(2,'0')}
function nowLabel(){return hhmm(phoneNow())}
function phoneTime(){return clk()?hhmm(phoneNow()):to24(S.owner.time)}
function startClock(){if(clk())return;clkVal=Date.now();clkId=runKey();try{localStorage.setItem(clkId,String(clkVal))}catch(e){}clearInterval(clockTimer);clockTimer=setInterval(tickClock,5000)}
function resetClock(){clk();clkVal=null;try{localStorage.removeItem(runKey());localStorage.removeItem('phone-seen:'+(S.id||''))}catch(e){}clearInterval(clockTimer);clockTimer=null}
function tickClock(){var v=phoneTime();var a=document.querySelector('.sb-time');if(a&&a.textContent!==v)a.textContent=v;var l=document.querySelector('.lk-time');if(l&&l.textContent!==v)l.textContent=v}
function to24(x){x=str(x).trim();var m=/^(오전|오후|AM|PM|am|pm)\s*(\d{1,2}):(\d{2})$/.exec(x);if(m){var h=(+m[2])%12;if(/오후|PM|pm/.test(m[1]))h+=12;return String(h).padStart(2,'0')+':'+m[3]}
  var n=/^(\d{1,2}):(\d{2})$/.exec(x);return n?String(+n[1]).padStart(2,'0')+':'+n[2]:x}
function nl(s){return esc(s)}
function isEmo(s){s=str(s).trim();if(!s||s.length>12)return false;try{return /^(\p{Extended_Pictographic}|\p{Emoji_Component}|‍|️|\s)+$/u.test(s)&&!/^[\d#*\s]+$/.test(s)}catch(e){return false}}
function thr(id){for(var i=0;i<S.threads.length;i++)if(S.threads[i].id===id)return S.threads[i];return null}
function tIndex(id){for(var i=0;i<S.threads.length;i++)if(S.threads[i].id===id)return i;return -1}
var seen={},hiddenSearch={},liveQueries=[];
function maxUnread(t){var n=0;for(var i=t.items.length-1;i>=0;i--){var it=t.items[i];if(it.k==='date')continue;if(it.w==='me')break;n++}return n}
function clampUnread(t){return Math.max(0,Math.min(t.unread|0,maxUnread(t)))}
function unreadOf(t){return seen[t.id]?0:clampUnread(t)}
function preview(t){for(var i=t.items.length-1;i>=0;i--){var it=t.items[i];if(it.k==='date')continue;if(it.k==='photo')return '사진';if(it.k==='voice')return '음성 메시지';return it.v}return ''}
function pastel(n){var cs=['#a8bfd6','#c5b3d9','#e2b7a8','#a9cdb8','#d9c78f','#b7c3cf','#d8a9b9'];return cs[hash(n)%cs.length]}
function avatar(t,style,size){
  var src=t&&t.avatar&&S.images[t.avatar];var dim='width:'+size+'px;height:'+size+'px;';
  if(src)return '<span class="av'+(style==='talk'?' sq':'')+'" style="'+dim+'background-image:url('+src+')"></span>';
  if(style==='talk'&&t&&t.group){var ms=(t.members||[]).slice(0,4);if(ms.length<2)ms=ms.concat([S.owner.name]).slice(0,2);
    return '<span class="av grp n'+ms.length+'" style="'+dim+'">'+ms.map(function(m){var x=null;S.threads.forEach(function(y){if(!x&&y.app==='talk'&&!y.group&&y.name===m&&y.avatar&&S.images[y.avatar])x=y});
      return x?'<span style="background-image:url('+S.images[x.avatar]+');background-size:cover;background-position:center"></span>':'<span style="background:'+pastel(m)+'">'+I.person+'</span>'}).join('')+'</span>'}
  if(style==='talk')return '<span class="av sq def" style="'+dim+'background:'+pastel(t&&t.name)+'">'+I.person+'</span>';
  return '<span class="av def" style="'+dim+'">'+I.person+'</span>';
}
function avatarByName(name,t){if(!t.group)return avatar(t,'talk',38);
  for(var i=0;i<S.threads.length;i++){var x=S.threads[i];if(x.app==='talk'&&!x.group&&x.name===name)return avatar(x,'talk',38)}
  return avatar({name:name},'talk',38)}
function ownerAv(size,style){return avatar({name:S.owner.name,avatar:S.owner.avatar},style||'talk',size)}
function bars(seed){var h='';for(var i=0;i<28;i++){var v=Math.abs(Math.sin(seed*7.3+i*1.7)+Math.sin(i*.63+seed*.5))*.5;h+='<i style="height:'+Math.round(4+v*19)+'px"></i>'}return h}
function parseDur(s){var m=/(\d+):(\d{1,2})/.exec(s||'');return m?(+m[1])*60+(+m[2]):5}

/* ---------- screens ---------- */
var SCR={};
var unlocked=false,pin='',fails=0,pendingOpen=null;
SCR.lock=function(){
  var d=parseD(S.owner.date);
  var notes=S.threads.filter(function(t){return unreadOf(t)>0}).sort(function(a,b){return (b._ping||0)-(a._ping||0)}).slice(0,4);
  return {tone:'light',cls:'lock',style:wallCss(),html:
    '<div class="lk-top"><div class="lk-date">'+(d.getMonth()+1)+'월 '+d.getDate()+'일 '+DOW[d.getDay()]+'요일</div><div class="lk-time">'+esc(phoneTime())+'</div></div>'+
    '<div class="lk-notes">'+notes.map(function(t){return '<button class="note" data-a="notif" data-id="'+esc(t.id)+'"><span class="note-ic">'+(t.app==='talk'?APPI.talk:APPI.msg)+'</span><span class="note-b"><span class="note-h"><b>'+esc(t.name)+'</b><em>'+esc(to24(t.when))+'</em></span><span class="note-p">'+esc(preview(t))+'</span></span>'+(unreadOf(t)>1?'<span class="note-c">+'+(unreadOf(t)-1)+'</span>':'')+'</button>'}).join('')+'</div>'+
    '<div class="lk-bottom"><span class="lk-btn">'+I.torch+'</span><button class="lk-open" data-a="unlock">눌러서 열기</button><span class="lk-btn">'+I.cam+'</span></div>'};
};
SCR.pass=function(){
  var n=S.owner.pass.length,dots='';for(var i=0;i<n;i++)dots+='<i class="'+(i<pin.length?'on':'')+'"></i>';
  var hint=fails>=3?'비밀번호는 '+esc(S.owner.pass)+' 이에요':(S.owner.hint?'힌트 · '+esc(S.owner.hint):'');
  var keys='123456789'.split('').map(function(k){return '<button class="pc-k" data-a="key" data-k="'+k+'">'+k+'</button>'}).join('');
  return {tone:'light',cls:'pass',style:wallCss(),html:'<div class="pc"><div class="pc-t">암호 입력</div><div class="pc-dots" id="pcDots">'+dots+'</div><div class="pc-hint">'+hint+'</div><div class="pc-pad">'+keys+'<span></span><button class="pc-k" data-a="key" data-k="0">0</button><button class="pc-del" data-a="pindel">'+(pin.length?'삭제':'취소')+'</button></div></div>'};
};
function badgeFor(k){var n=0;if(k==='msg'||k==='talk')S.threads.forEach(function(t){if(t.app===k)n+=unreadOf(t)});
  if(k==='phone')S.calls.forEach(function(c){if(c.type==='missed')n+=c.count});return n?'<span class="badge">'+n+'</span>':''}
function tile(a){var k=a[0],ic=APPI[k];
  if(k==='cal'){var d=parseD(S.owner.date);ic='<span style="display:flex;flex-direction:column;align-items:center"><small>'+DOW[d.getDay()]+'요일</small><b>'+d.getDate()+'</b></span>'}
  return '<button class="app" data-a="open" data-app="'+k+'"><span class="ico'+(k==='cal'?' i-cal':'')+'">'+ic+'</span><span class="lbl">'+a[1]+'</span>'+badgeFor(k)+'</button>'}
SCR.home=function(){
  var grid=[['cal','캘린더'],['photos','사진'],['camera','카메라'],['clock','시계'],['memo','메모'],['weather','날씨'],['map','지도'],['music','음악']];
  var dock=[['phone','전화'],['web','인터넷'],['msg','메시지'],['talk','톡']];
  return {tone:'light',cls:'home',style:wallCss(),html:'<div class="hgrid">'+grid.map(tile).join('')+'</div><div class="hsp"></div><div class="hsearch">'+I.search+'<span>검색</span></div><div class="dock">'+dock.map(tile).join('')+'</div>'};
};
SCR.msgs=function(){
  var ts=S.threads.filter(function(t){return t.app==='msg'});
  var pins=ts.filter(function(t){return t.pinned}),rest=ts.filter(function(t){return !t.pinned});
  var ph=pins.length?'<div class="pins">'+pins.map(function(t){var u=unreadOf(t);return '<button class="pin" data-a="chat" data-id="'+esc(t.id)+'">'+(u?'<i class="dot"></i><span class="bub">'+esc(preview(t))+'</span>':'')+avatar(t,'msg',76)+'<span>'+esc(t.name)+'</span></button>'}).join('')+'</div>':'';
  var rows=rest.map(function(t){return '<button class="mrow" data-a="chat" data-id="'+esc(t.id)+'"><i class="udot'+(unreadOf(t)?'':' off')+'"></i>'+avatar(t,'msg',46)+'<span class="mrow-b"><span class="mrow-h"><b>'+esc(t.name)+'</b><em>'+esc(to24(t.when))+' ›</em></span><span class="mrow-p">'+esc(preview(t))+'</span></span></button>'}).join('');
  return {tone:'dark',cls:'msgs',html:'<div class="ml-head"><button class="pill ic" data-a="back" aria-label="홈으로">'+I.back+'</button><b>메시지</b><span class="pill ic">'+I.filter+'</span></div><div class="sc">'+ph+rows+(ts.length?'':'<div class="tk-empty">메시지가 없어요</div>')+'<div class="pad-b"></div></div><div class="ml-foot"><div class="sfield">'+I.search+'<span>검색</span>'+I.mic+'</div><span class="round">'+I.compose+'</span></div>'};
};
function msgItems(t,ed){
  var h='',last=-1;t.items.forEach(function(it,i){if(it.k!=='date')last=i});
  t.items.forEach(function(it,i){
    var c='';
    if(it.k==='date')c='<div class="ch-date"><span class="txt">'+(esc(sep24(it.v))||(ed?'날짜 구분':''))+'</span></div>';
    else{var w=it.w;
      var nx=t.items[i+1],runEnd=!nx||nx.k==='date'||nx.w!==w||(nx.t&&nx.t!==it.t);
      if(it.k==='text')c='<div class="b '+w+'"><div class="bb'+(isEmo(it.v)?' emo':'')+'"><span class="txt">'+(nl(it.v)||(ed?'<i class="ph-empty">내용 없음</i>':''))+'</span></div></div>';
      else if(it.k==='photo'){var p=pic(it);c='<div class="b '+w+'"><button class="ph-b '+p.cls+'" style="'+p.style+'" data-a="viewimg" data-tid="'+esc(t.id)+'" data-i="'+i+'" aria-label="사진 보기"></button></div>'}
      else if(it.k==='voice')c='<div class="b '+w+'"><div class="bb voice" data-a="play" data-dur="'+esc(it.dur)+'"><span class="vp">'+I.play+'</span><span class="wave">'+bars(i+1)+'</span><span class="vd">'+esc(it.dur)+'</span></div></div>';
      if(it.t&&runEnd)c+='<div class="mtime '+w+'">'+esc(to24(it.t))+'</div>';
      if(!ed&&i===last&&w==='me')c+='<div class="read">읽음</div>';}
    h+=ed?edWrap(t,i,c):c;
  });
  return h;
}
SCR.chat=function(p){
  var t=thr(p.id);if(!t)return {tone:'dark',cls:'msgs',html:'<div class="tk-empty" style="margin-top:120px">대화가 없어요</div>'};
  return {tone:'dark',cls:'chat',html:'<div class="ch-head"><button class="round glass" data-a="back" aria-label="뒤로">'+I.back+'</button><div class="ch-who">'+avatar(t,'msg',52)+'<span class="ch-name glass">'+esc(t.name)+' <small>›</small></span></div><span class="round glass">'+I.video+'</span></div>'+
    '<div class="sc ch-body" id="cb">'+msgItems(t)+'</div>'+
    '<div class="ch-foot"><span class="round glass">'+I.plus+'</span><label class="ch-in"><input id="chatIn" data-tid="'+esc(t.id)+'" placeholder="메시지" autocomplete="off" enterkeyhint="send"><button class="send" data-a="send" hidden aria-label="보내기">'+I.up+'</button><span class="mic">'+I.mic+'</span></label></div>'};
};
function talkItems(t,ed){
  var h='',its=t.items;
  function sender(it){return it.w==='me'?'@me':(t.group?(it.n||'?'):t.name)}
  its.forEach(function(it,i){
    var out;
    if(it.k==='date')out='<div class="tc-date"><span class="txt">'+(esc(it.v)||(ed?'날짜 구분':''))+'</span></div>';
    else{
    var prev=its[i-1],next=its[i+1],s=sender(it);
    var first=!prev||prev.k==='date'||sender(prev)!==s;
    var lastRun=!next||next.k==='date'||sender(next)!==s||(next.t&&next.t!==it.t);
    var c;
    if(it.k==='photo'){var p=pic(it);c='<button class="tb tph '+p.cls+'" style="'+p.style+'" data-a="viewimg" data-tid="'+esc(t.id)+'" data-i="'+i+'" aria-label="사진 보기"></button>'}
    else if(it.k==='voice')c='<div class="tb voice" data-a="play" data-dur="'+esc(it.dur)+'"><span class="vp">'+I.play+'</span><span class="wave">'+bars(i+3)+'</span><span class="vd">'+esc(it.dur)+'</span></div>';
    else c='<div class="tb'+(isEmo(it.v)?' emo':'')+'"><span class="txt">'+(nl(it.v)||(ed?'<i class="ph-empty">내용 없음</i>':''))+'</span></div>';
    var tm=((lastRun||ed)&&it.t)?'<span class="tt">'+esc(to24(it.t))+'</span>':'';
    if(it.w==='me')out='<div class="tm me'+(first?' first':'')+'"><div class="tm-row">'+tm+c+'</div></div>';
    else out='<div class="tm them'+(first?' first':'')+'"><span class="tm-av">'+(first?avatarByName(s,t):'')+'</span><div class="tm-col">'+(first?'<div class="tm-n">'+esc(s)+'</div>':'')+'<div class="tm-row">'+c+tm+'</div></div></div>';
    }
    h+=ed?edWrap(t,i,out):out;
  });
  return h;
}
function friendsList(){var out=S.friends.slice(),names={};out.forEach(function(f){names[f.name]=1});
  S.threads.forEach(function(t){if(t.app==='talk'&&!t.group&&!names[t.name]){out.push({name:t.name,status:t.status});names[t.name]=1}});return out}
SCR.talk=function(p){
  var tab=p.tab||'chats',body='',title={friends:'친구',chats:'채팅',more:'더보기'}[tab];
  var talkUnread=0;S.threads.forEach(function(t){if(t.app==='talk')talkUnread+=unreadOf(t)});
  if(tab==='friends'){var fl=friendsList();
    body='<button class="tk-me" data-a="tprof" data-me="1">'+ownerAv(58)+'<span><b>'+esc(S.owner.name)+'</b><small>'+esc(S.owner.status||'상태메시지를 입력해 주세요')+'</small></span></button>'+
      '<div class="tk-sec">친구 '+fl.length+'</div>'+fl.map(function(f){var t=null;S.threads.forEach(function(x){if(x.app==='talk'&&!x.group&&x.name===f.name)t=x});
        return '<button class="tk-row" data-a="tprof" data-name="'+esc(f.name)+'">'+avatar(t||{name:f.name},'talk',44)+'<span class="tk-b"><b>'+esc(f.name)+'</b>'+(f.status?'<span>'+esc(f.status)+'</span>':'')+'</span></button>'}).join('');
  }else if(tab==='chats'){var ts=S.threads.filter(function(t){return t.app==='talk'});
    body=ts.map(function(t){var u=unreadOf(t);return '<button class="tk-row tk-chat" data-a="tchat" data-id="'+esc(t.id)+'">'+avatar(t,'talk',50)+'<span class="tk-b"><b>'+esc(t.name)+(t.group?'<em>'+((t.members||[]).length+1)+'</em>':'')+'</b><span>'+esc(preview(t))+'</span></span><span class="tk-r">'+esc(to24(t.when))+(u?'<span class="tk-badge">'+(u>999?'999+':u)+'</span>':'<span style="height:20px"></span>')+'</span></button>'}).join('')||'<div class="tk-empty">채팅이 없어요</div>';
  }else{body='<button class="tk-me" data-a="tprof" data-me="1">'+ownerAv(58)+'<span><b>'+esc(S.owner.name)+'</b><small>내 프로필</small></span></button><div class="tk-sec">설정</div>'+['알림','채팅 배경','개인/보안','친구 관리'].map(function(x){return '<div class="tk-row"><span class="tk-b"><b style="font-weight:500">'+x+'</b></span></div>'}).join('')}
  var tabs=[['friends',I.tPerson],['chats',I.tChat],['more',I.tMore]].map(function(x){return '<button class="tk-tab'+(x[0]===tab?' on':'')+'" data-a="ttab" data-tab="'+x[0]+'" aria-label="'+({friends:'친구',chats:'채팅',more:'더보기'}[x[0]])+'">'+x[1]+(x[0]==='chats'&&talkUnread?'<span class="tk-badge">'+talkUnread+'</span>':'')+'</button>'}).join('');
  return {tone:'dark',cls:'talk',html:'<div class="tk-head"><span class="tk-l">'+'<button class="hback" data-a="back" aria-label="홈으로">'+I.back+'</button>'+'<b>'+title+'</b></span><span class="tk-ic">'+I.search+(tab==='chats'?I.compose:'')+'</span></div><div class="sc">'+body+'</div><nav class="tk-tabs">'+tabs+'</nav>'};
};
SCR.tchat=function(p){
  var t=thr(p.id);if(!t)return SCR.talk({tab:'chats'});
  return {tone:'dark',cls:'tchat',html:'<div class="tc-head"><button data-a="back" aria-label="뒤로">'+I.back+'</button><b>'+esc(t.name)+(t.group?'<em>'+((t.members||[]).length+1)+'</em>':'')+'</b><span class="ics">'+I.search+I.menu+'</span></div>'+
    '<div class="sc tc-body" id="cb">'+talkItems(t)+'</div>'+
    '<div class="tc-foot"><span class="tc-plus">'+I.plus+'</span><label class="tc-in"><input id="chatIn" data-tid="'+esc(t.id)+'" autocomplete="off" enterkeyhint="send" aria-label="메시지 입력">'+I.smile+'</label><button class="tc-send" data-a="send" id="tcSend" aria-label="보내기">'+I.hash+'</button></div>'};
};
SCR.tprof=function(p){
  var me=!!p.me,name=me?S.owner.name:p.name,status='',t=null;
  if(me)status=S.owner.status;else{S.friends.forEach(function(f){if(f.name===name)status=f.status});S.threads.forEach(function(x){if(x.app==='talk'&&!x.group&&x.name===name){t=x;if(!status)status=x.status}})}
  var av=me?ownerAv(96):avatar(t||{name:name},'talk',96);
  return {tone:'light',cls:'tprof',html:'<div class="tp-top"><button data-a="back" aria-label="닫기">'+I.x.replace('width="15" height="15"','width="22" height="22"')+'</button><span></span></div><div class="tp-mid">'+av+'<b>'+esc(name)+'</b>'+(status?'<small>'+esc(status)+'</small>':'')+'</div>'+
    '<div class="tp-acts">'+(me?'<button data-a="back">'+I.tChat+'나와의 채팅</button><button data-a="back">'+I.compose+'프로필 편집</button>':'<button data-a="tprofchat" data-name="'+esc(name)+'">'+I.tChat+'1:1 채팅</button><button data-a="nocall"><svg viewBox="0 0 24 24" fill="currentColor">'+I.handset+'</svg>통화하기</button>')+'</div>'};
};
function galSorted(){return S.gallery.slice().sort(function(a,b){return a.date<b.date?-1:a.date>b.date?1:0})}
SCR.photos=function(){
  var g=galSorted();
  return {tone:'light',cls:'photos',html:'<div class="pg-head"><div class="pg-l"><button class="hback light" data-a="back" aria-label="홈으로">'+I.back+'</button><div><b>사진</b><span>'+g.length+'개의 항목</span></div></div><span class="pg-sel">선택</span></div><div class="sc">'+
    (g.length?'<div class="pg-grid">'+g.map(function(x,i){var p=pic(x);return '<button class="pg-t '+p.cls+'" style="'+p.style+'" data-a="gview" data-i="'+i+'" aria-label="사진 '+(i+1)+'">'+(x.fav?'<i class="fav">♥</i>':'')+'</button>'}).join('')+'</div><div class="pg-count">사진 '+g.length+'장</div>':'<div class="pg-empty">사진이 없어요</div>')+'</div>'};
};
function photoList(p){if(p.src==='c'){var t=thr(p.tid);return t?t.items.filter(function(x){return x.k==='photo'}):[]}return galSorted()}
SCR.photo=function(p){
  var list=photoList(p),i=Math.max(0,Math.min(p.i||0,list.length-1)),cur=list[i]||{};
  var pc=pic(cur),isG=p.src!=='c';
  return {tone:'light',cls:'photo',html:'<div class="pv-head"><button data-a="back" aria-label="뒤로">'+I.back+'</button><div><b>'+esc(isG?fmtD(cur.date):(thr(p.tid)||{}).name||'')+'</b><span>'+(i+1)+' / '+list.length+'</span></div><span></span></div>'+
    '<div class="pv-stage" id="pvStage"><div class="pv-img '+pc.cls+'" style="'+pc.style+'"></div>'+(list.length>1?'<button class="pv-nav l" data-a="pvgo" data-d="-1" aria-label="이전">'+I.back+'</button><button class="pv-nav r" data-a="pvgo" data-d="1" aria-label="다음">'+I.back+'</button>':'')+'</div>'+
    '<div class="pv-cap">'+esc(cur.ph&&cur.ph.l||'')+'</div>'+
    '<div class="pv-foot"><span>'+I.share+'</span>'+(isG?'<button data-a="fav" class="'+(cur.fav?'on':'')+'" aria-label="즐겨찾기">'+I.heart(cur.fav)+'</button>':'<span>'+I.heart(false)+'</span>')+'<span>'+I.info+'</span><span>'+I.trash+'</span></div>'};
};
SCR.web=function(){
  var qs=liveQueries.concat(S.search).map(function(q,i){return {q:q,i:i}}).filter(function(x){return !hiddenSearch[x.q]});
  return {tone:'dark',cls:'web',html:'<div class="wb-head">'+'<button class="hback" data-a="back" aria-label="홈으로">'+I.back+'</button>'+'<label class="wb-field">'+I.search+'<input id="webIn" placeholder="검색어 또는 주소 입력" autocomplete="off" enterkeyhint="search"></label></div>'+
    '<div class="sc"><div class="wb-sec"><b>최근 검색</b>'+(qs.length?'<button data-a="webclear">지우기</button>':'')+'</div>'+
    (qs.length?'<div class="wb-list">'+qs.map(function(x){return '<div class="wb-row">'+I.clock+'<span class="wb-t">'+esc(x.q)+'</span><button class="wb-x" data-a="webdel" data-q="'+esc(x.q)+'" aria-label="삭제">'+I.x+'</button></div>'}).join('')+'</div>':'<div class="wb-empty">최근 검색 기록이 없어요</div>')+'</div>'};
};
SCR.memos=function(){
  return {tone:'dark',cls:'memos',html:'<div class="mm-head">'+'<button class="hback" data-a="back" aria-label="홈으로">'+I.back+'</button>'+'<b>메모</b><span>메모 '+S.memos.length+'개</span></div><div class="sc">'+(S.memos.length?'<div class="mm-list">'+S.memos.map(function(m,i){var first=str(m.body).split('\n').filter(function(l){return l.trim()})[0]||'추가 텍스트 없음';return '<button class="mm-row" data-a="memo" data-i="'+i+'"><b>'+esc(m.title||'새로운 메모')+'</b><small><em>'+esc(m.date)+'</em>'+esc(first)+'</small></button>'}).join('')+'</div>':'<div class="wb-empty">메모가 없어요</div>')+'</div>'};
};
SCR.memo=function(p){var m=S.memos[p.i]||{};
  return {tone:'dark',cls:'memo',html:'<div class="md-head"><button data-a="back">'+I.back+'메모</button><span>완료</span></div><div class="sc md-body"><div class="md-date">'+esc(m.date)+'</div><h2>'+esc(m.title)+'</h2><div class="md-txt">'+esc(m.body)+'</div></div>'};
};
var CHO='ㄱㄲㄴㄷㄸㄹㅁㅂㅃㅅㅆㅇㅈㅉㅊㅋㅌㅍㅎ',CHO_BASE={'ㄲ':'ㄱ','ㄸ':'ㄷ','ㅃ':'ㅂ','ㅆ':'ㅅ','ㅉ':'ㅈ'};
function choOf(n){var c=str(n).charCodeAt(0);if(c>=0xAC00&&c<=0xD7A3){var k=CHO[Math.floor((c-0xAC00)/588)];return CHO_BASE[k]||k}var ch=str(n).charAt(0).toUpperCase();return /[A-Z]/.test(ch)?ch:'#'}
function ctAv(name,size){return '<span class="ct-av" style="width:'+size+'px;height:'+size+'px;font-size:'+Math.round(size*.42)+'px">'+esc(str(name).replace(/[^가-힣A-Za-z0-9]/g,'').charAt(0)||'?')+'</span>'}
function contactIdx(name){for(var i=0;i<S.contacts.length;i++)if(S.contacts[i].name===name)return i;return -1}
SCR.calls=function(p){
  var tab=p.tab||'recent',body='',title={recent:'최근 기록',contacts:'연락처',fav:'즐겨찾기'}[tab],top='';
  if(tab==='recent'){var miss=p.f==='miss';var cs=S.calls.filter(function(c){return !miss||c.type==='missed'});
    top='<div class="seg"><button class="'+(miss?'':'on')+'" data-a="callf" data-f="all">전체</button><button class="'+(miss?'on':'')+'" data-a="callf" data-f="miss">부재중</button></div>';
    body=cs.map(function(c){return '<button class="cl-row'+(c.type==='missed'?' miss':'')+'" data-a="callrow" data-name="'+esc(c.name)+'"><span class="cl-ic">'+(c.type==='out'?I.outcall:'')+'</span><span class="cl-b"><span class="cl-n"><b>'+esc(c.name)+(c.count>1?' ('+c.count+')':'')+'</b><small>'+(c.type==='missed'?'부재중 전화':c.type==='out'?'발신':'휴대전화')+'</small></span><span class="cl-t">'+esc(to24(c.time))+'</span><span class="cl-i">'+I.info+'</span></span></button>'}).join('')+(cs.length?'':'<div class="wb-empty">기록이 없어요</div>');
  }else if(tab==='contacts'){
    var idx=S.contacts.map(function(c,i){return i}).sort(function(a,b){return S.contacts[a].name.localeCompare(S.contacts[b].name,'ko')}),groups={},order=[];
    idx.forEach(function(i){var k=choOf(S.contacts[i].name);if(!groups[k]){groups[k]=[];order.push(k)}groups[k].push(i)});
    body='<div class="ct-search">'+I.search+'<span>검색</span></div><div class="ct-me">'+ctAv(S.owner.name,58)+'<span><b>'+esc(S.owner.name)+'</b><small>내 카드</small></span></div>'+
      order.map(function(k){return '<div class="ct-sec">'+k+'</div>'+groups[k].map(function(i){return '<button class="ct-row" data-a="contact" data-i="'+i+'">'+esc(S.contacts[i].name)+'</button>'}).join('')}).join('')+
      (S.contacts.length?'<div class="ct-count">연락처 '+S.contacts.length+'개</div>':'<div class="wb-empty">연락처가 없어요</div>');
  }else{var fv=S.contacts.map(function(c,i){return i}).filter(function(i){return S.contacts[i].fav});
    body=fv.map(function(i){var c=S.contacts[i];return '<button class="cl-row" data-a="contact" data-i="'+i+'"><span class="cl-ic"></span><span class="cl-b">'+ctAv(c.name,40)+'<span class="cl-n"><b>'+esc(c.name)+'</b><small>휴대전화</small></span><span class="cl-i">'+I.info+'</span></span></button>'}).join('')||'<div class="wb-empty">즐겨찾기가 없어요</div>';}
  var tabs=[['fav',I.star,'즐겨찾기'],['recent',I.clock.replace('width="18" height="18"',''),'최근 기록'],['contacts',I.people,'연락처'],['keypad',I.keypad,'키패드']].map(function(x){return '<button class="'+(x[0]===tab?'on':'')+'" data-a="calltab" data-tab="'+x[0]+'">'+x[1]+x[2]+'</button>'}).join('');
  return {tone:'dark',cls:'calls',html:'<div class="cl-top">'+'<button class="hback" data-a="back" aria-label="홈으로">'+I.back+'</button>'+top+'<span class="cl-sp"></span></div><div class="cl-title">'+title+'</div><div class="sc">'+body+'</div><div class="tabs4">'+tabs+'</div>'};
};
SCR.contact=function(p){
  var c=S.contacts[p.i]||{name:'',phone:'',memo:''},recent=S.calls.filter(function(x){return x.name===c.name});
  return {tone:'dark',cls:'contact',html:'<div class="ctd-head">'+'<button class="hback" data-a="back" aria-label="뒤로">'+I.back+'</button>'+'<span class="pill">편집</span></div><div class="sc"><div class="ctd-top">'+ctAv(c.name,96)+'<b>'+esc(c.name)+'</b></div>'+
    '<div class="ctd-acts"><button data-a="ctmsg" data-name="'+esc(c.name)+'">'+I.tChat+'<span>메시지</span></button><button data-a="nocall"><svg viewBox="0 0 24 24" fill="currentColor">'+I.handset+'</svg><span>전화</span></button><button data-a="nocall">'+I.video+'<span>영상</span></button><button data-a="nocall"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="5" width="18" height="14" rx="2.5"/><path d="M4 7l8 6 8-6"/></svg><span>메일</span></button></div>'+
    '<div class="ctd-card"><small>휴대전화</small><b>'+esc(c.phone||'번호 없음')+'</b></div>'+
    (c.memo?'<div class="ctd-card"><small>메모</small><span>'+esc(c.memo)+'</span></div>':'')+
    (recent.length?'<div class="ctd-card"><small>최근 통화</small>'+recent.map(function(x){return '<span class="'+(x.type==='missed'?'miss':'')+'">'+esc(to24(x.time))+' · '+({missed:'부재중',in:'수신',out:'발신'}[x.type])+(x.count>1?' '+x.count+'회':'')+'</span>'}).join('')+'</div>':'')+
    '</div>'};
};
SCR.cal=function(p){
  var base=parseD(S.owner.date),m=new Date(base.getFullYear(),base.getMonth()+(p.m||0),1);
  var y=m.getFullYear(),mo=m.getMonth(),days=new Date(y,mo+1,0).getDate(),start=m.getDay();
  var key=function(d){return y+'-'+String(mo+1).padStart(2,'0')+'-'+String(d).padStart(2,'0')};
  var evs={};S.events.forEach(function(e){(evs[e.d]=evs[e.d]||[]).push(e)});
  var sel=p.sel||S.owner.date,g='';for(var i=0;i<start;i++)g+='<span class="ca-d"></span>';
  for(var d=1;d<=days;d++){var k=key(d);g+='<button class="ca-d'+(k===S.owner.date?' today':'')+(k===sel?' sel':'')+((start+d-1)%7===0?' sun':'')+'" data-a="calday" data-d="'+k+'"><span class="n">'+d+'</span>'+(evs[k]?'<i></i>':'')+'</button>'}
  var dayEv=S.events.filter(function(e){return e.d===sel}),sd=parseD(sel);
  return {tone:'dark',cls:'cal',html:'<div class="ca-head"><button class="hlink" data-a="back" aria-label="홈으로">'+I.back+'<span>'+y+'년</span></button><span class="nv"><button data-a="calm" data-d="-1" aria-label="이전 달">'+I.back+'</button><button data-a="calm" data-d="1" aria-label="다음 달">'+I.back+'</button></span></div><div class="ca-title">'+(mo+1)+'월</div>'+
    '<div class="ca-dow">'+DOW.map(function(x){return '<span>'+x+'</span>'}).join('')+'</div><div class="sc"><div class="ca-grid">'+g+'</div><div class="ca-list"><div class="ca-day">'+(sd.getMonth()+1)+'월 '+sd.getDate()+'일 '+DOW[sd.getDay()]+'요일'+(sel===S.owner.date?' · 오늘':'')+'</div>'+
    (dayEv.length?dayEv.map(function(e){return '<div class="ca-ev"><span class="bar"></span><span><b>'+esc(e.t||'일정')+'</b><small>하루 종일</small></span></div>'}).join(''):'<div class="ca-none">일정 없음</div>')+'</div></div>'};
};

/* ---------- navigation ---------- */
var nav=[],layerEl,phoneEl;
function top(){return nav[nav.length-1]}
function mount(e,anim){
  var r=SCR[e.s](e.p||{});var el=document.createElement('div');el.className='scr '+(r.cls||'');if(r.style)el.setAttribute('style',r.style);el.innerHTML=r.html;
  e.el=el;e.tone=r.tone;layerEl.appendChild(el);
  if(anim){el.classList.add(anim);el.addEventListener('animationend',function(){el.classList.remove(anim)},{once:true})}
  setTone(r.tone);afterMount(e);
}
function afterMount(e){
  var sc=e.el.querySelector('.sc');
  if((e.s==='chat'||e.s==='tchat'||e.s==='photos')&&sc)sc.scrollTop=sc.scrollHeight;
  if(e.s==='chat'||e.s==='tchat')bindChatInput(e.el);
  if(e.s==='web'){var wi=e.el.querySelector('#webIn');wi.addEventListener('keydown',function(ev){if(ev.key==='Enter'&&!ev.isComposing&&wi.value.trim()){liveQueries.unshift(wi.value.trim());wi.value='';repaintTop();toast('검색 결과를 불러올 수 없어요')}})}
  if(e.s==='photo')bindSwipe(e);
}
function push(s,p,anim,noHist){var prev=top();nav.push({s:s,p:p||{}});mount(top(),anim||'in-r');if(prev&&prev.el)prev.el.classList.add('under');if(!noHist)hpush('nav')}
function pop(){if(nav.length<=1)return;var e=nav.pop();e.el.classList.add('out-r');setTimeout(function(){e.el.remove()},290);var t=top();t.el.classList.remove('under');setTone(t.tone);if(t.s!=='photo')repaintTop(true)}
function reset(s,p,anim){layerEl.innerHTML='';nav=[{s:s,p:p||{}}];mount(nav[0],anim);hdropNav()}
function repaintTop(keepScroll){var e=top();var sc=e.el.querySelector('.sc'),st=sc?sc.scrollTop:0;var old=e.el;mount(e,null);old.remove();var ns=e.el.querySelector('.sc');if(keepScroll&&ns&&e.s!=='chat'&&e.s!=='tchat')ns.scrollTop=st}
function rebuild(){
  var sts=nav.map(function(e){var sc=e.el&&e.el.querySelector('.sc');return sc?sc.scrollTop:null});
  layerEl.innerHTML='';
  nav.forEach(function(e,i){mount(e,null);if(i<nav.length-1)e.el.classList.add('under');var sc=e.el.querySelector('.sc');if(sc&&sts[i]!=null&&e.s!=='chat'&&e.s!=='tchat')sc.scrollTop=sts[i]});
  setTone(top().tone);renderStatus();
}
function goHome(){if(!unlocked)return;if(nav.length===1&&top().s==='home')return;reset('home',{},'fade-in')}
/* restart: the first unlock remembers every chat as it was; "restart" puts them back and drops what happened while playing */
var baseThreads=null;
function stripLive(th){return JSON.parse(JSON.stringify(th)).filter(function(t){return !t.lv}).map(function(t){t.items=t.items.filter(function(i){return !i.lv});
  if(baseThreads){for(var i=0;i<baseThreads.length;i++){var b=baseThreads[i];if(b.id===t.id){t.when=b.when;t.unread=b.unread;break}}}
  return t})}
function captureBase(){if(baseThreads)return;baseThreads=stripLive(S.threads);if(canEdit&&S.id)Store.set('base:'+S.id,{threads:baseThreads})}
function dropBase(){baseThreads=null;if(canEdit&&S.id)Store.del('base:'+S.id)}
function loadBase(){baseThreads=null;if(!canEdit||!S.id)return Promise.resolve();var id=S.id;return Store.get('base:'+id).then(function(b){if(S.id===id&&!baseThreads&&b&&b.threads)baseThreads=b.threads})}
/* edits while the phone is in use go into a draft; they reach the phone only on restart */
var draftMode=false,playS=null,forceClose=false;
function playing(){return !!clk()}
function setDraftUi(){document.body.classList.toggle('drafting',draftMode);var n=$('#edNote');if(n)n.hidden=!draftMode}
var playBase=null;
function beginDraft(){if(draftMode||!canEdit||viewMode||!playing())return;playS=S;playBase=baseThreads;baseThreads=baseThreads?JSON.parse(JSON.stringify(baseThreads)):null;S=JSON.parse(JSON.stringify(S));S.threads=stripLive(S.threads);draftMode=true;edThread=null;setDraftUi()}
function endDraft(apply){if(!draftMode)return;if(!apply){S=playS;baseThreads=playBase;if(baseThreads&&canEdit&&S.id)Store.set('base:'+S.id,{threads:baseThreads})}playS=null;playBase=null;draftMode=false;setDraftUi()}
function applyRestart(){edDirty=false;endDraft(true);restartStory();forceClose=true;closeEditor();forceClose=false;closeSettings();closeSheet();toast('처음부터 다시 시작했어요')}
function askLeave(){askConfirm({title:'고친 내용을 반영할까요?',msg:'하던 대화는 그대로 남아 있어요. 고친 내용은 처음부터 다시 시작해야 폰에 반영돼요.',ok:'처음부터 다시 시작',no:'수정 버리고 닫기'},applyRestart,function(){endDraft(false);saveLocal();forceClose=true;closeEditor();forceClose=false;rebuild();renderSide()})}
function restartStory(){
  S.threads=stripLive(S.threads);baseThreads=null;
  drafts={};typingFor={};replyBusy={};liveQueries=[];hiddenSearch={};pingBusy=false;
  resetClock();relock();
  if(canEdit)markChanged(true);
  if(!$('#ed').hidden)renderEditor();
  renderSide();
}
/* each person registers their own Gemini key; it stays in this browser and is never published */
function keyAskable(){return !aiMode()&&!CFG.aiProxy&&CFG.allowUserKey&&!window.PHONE_AI_OVERRIDE}
function keyAskKey(){return 'phone-keyask:'+(playerMode?'play':'admin')}
function openKeyDlg(why,done){
  closeDlg();var bg=document.createElement('div');bg.className='dlg-bg';bg.id='dlg';
  var who=playerMode?'폰 속 인물들과 대화하려면 내 Gemini API 키를 등록해 주세요. 무료로 만들 수 있어요. 키가 없어도 폰은 둘러볼 수 있어요.':'AI로 폰 채우기·대화 생성·답장을 쓰려면 내 Gemini API 키를 등록해 주세요. 무료로 만들 수 있어요.';
  bg.innerHTML='<div class="dlg keydlg" role="dialog" aria-modal="true" aria-labelledby="kdT"><h3 id="kdT">내 API 키 등록</h3><p>'+esc(why||who)+'</p>'+
    '<ol class="kd-steps"><li><a class="hlink2" href="https://aistudio.google.com/apikey" target="_blank" rel="noopener noreferrer">Google AI Studio 열기 ↗</a></li><li>"API 키 만들기"를 누르고 키를 복사</li><li>아래 칸에 붙여넣기</li></ol>'+
    '<input id="kdIn" type="password" placeholder="키를 붙여넣어 주세요" autocomplete="off" spellcheck="false" value="'+esc(AIS.key)+'">'+
    '<p class="kd-msg" id="kdMsg">키는 이 기기에 저장되고, Google로 로그인했다면 내 계정에도 저장돼서 다른 기기에서도 그대로 쓸 수 있어요. 키는 Google에만 보내져요. 다른 사람(관리자·사용자)에게 공유되지 않아요.</p>'+
    '<div class="btns two"><button class="btn" data-d="later">나중에</button><button class="btn primary" data-d="save">등록</button></div></div>';
  document.body.appendChild(bg);hpush('dlg');
  try{localStorage.setItem(keyAskKey(),'1')}catch(e){}
  var inp=bg.querySelector('#kdIn'),msg=bg.querySelector('#kdMsg'),save=bg.querySelector('[data-d="save"]');
  function finish(){closeDlg();renderSide();renderSettings();if(done)done()}
  bg.addEventListener('click',function(e){var d=e.target.dataset&&e.target.dataset.d;
    if(e.target===bg||d==='later'){closeDlg();return}
    if(d==='save'){var k=inp.value.trim();if(!k){msg.textContent='키를 붙여넣어 주세요.';msg.className='kd-msg err';return}
      AIS.key=k;saveAIS();save.disabled=true;msg.className='kd-msg';msg.textContent='확인 중…';
      AI.text('연결 확인입니다. "확인"이라고만 답하세요.').then(function(){msg.textContent='등록됐어요.';setTimeout(finish,500)},
        function(err){save.disabled=false;
          if(err&&(err.code==='busy'||err.code==='rate_limited')){msg.textContent='키는 저장했어요. 지금 Gemini가 붐벼서 확인만 못 했어요.';setTimeout(finish,1400);return}
          msg.className='kd-msg err';msg.textContent=aiErrMsg(err)})}});
  inp.addEventListener('keydown',function(e){if(e.key==='Enter'&&!e.isComposing){e.preventDefault();save.click()}});
  setTimeout(function(){inp.focus()},60);
}
function maybeAskKey(){if(!keyAskable())return;var asked=false;try{asked=localStorage.getItem(keyAskKey())==='1'}catch(e){}if(asked)return;setTimeout(function(){if(keyAskable()&&!$('#dlg'))openKeyDlg()},1800)}
function closeDlg(fromHist){var d=$('#dlg');if(!d)return;if(!fromHist&&hback('dlg'))return;d.remove()}
function askConfirm(o,cb,cb2){
  closeDlg();var bg=document.createElement('div');bg.className='dlg-bg';bg.id='dlg';
  bg.innerHTML='<div class="dlg" role="alertdialog" aria-modal="true" aria-labelledby="dlgT" aria-describedby="dlgM"><h3 id="dlgT">'+esc(o.title)+'</h3><p id="dlgM">'+esc(o.msg)+'</p><div class="btns two"><button class="btn" data-d="no">'+esc(o.no||'취소')+'</button><button class="btn danger" data-d="yes">'+esc(o.ok)+'</button></div></div>';
  document.body.appendChild(bg);hpush('dlg');
  bg.addEventListener('click',function(e){var d=e.target.dataset&&e.target.dataset.d;if(e.target===bg){closeDlg()}else if(d==='no'){closeDlg();if(cb2)cb2()}else if(d==='yes'){closeDlg();cb()}});
  var n=bg.querySelector('[data-d="no"]');if(n)n.focus();
}
function relock(){unlocked=false;pin='';fails=0;seen={};lastPing=Date.now();liveDated={};reset('lock',{},'fade-in');if($('#sb'))renderStatus()}
function unlockFlow(){if(top().s!=='lock')return;if(S.owner.pass){pin='';reset('pass',{},'fade-in')}else finishUnlock()}
function finishUnlock(){captureBase();startClock();touchSeen();unlocked=true;reset('home',{},'zoom-in');if(pendingOpen){var t=thr(pendingOpen);pendingOpen=null;if(t){push(t.app==='talk'?'talk':'msgs',{tab:'chats'},'zoom-in');openThread(t)}}}
function openThread(t){seen[t.id]=1;push(t.app==='talk'?'tchat':'chat',{id:t.id})}

var toastT;
function toast(msg){var el=$('#ptoast');el.textContent=msg;el.classList.add('show');clearTimeout(toastT);toastT=setTimeout(function(){el.classList.remove('show')},1700)}

var A={
  island:function(){openInfo()},
  unlock:unlockFlow,
  notif:function(d){pendingOpen=d.id;unlockFlow()},
  key:function(d){var P=S.owner.pass;if(pin.length>=P.length)return;pin+=d.k;
    if(pin.length===P.length){if(pin===P){setTimeout(finishUnlock,120);repaintTop()}else{fails++;pin='';repaintTop();var dt=$('#pcDots');if(dt)dt.classList.add('shake')}}else repaintTop()},
  pindel:function(){if(pin.length){pin=pin.slice(0,-1);repaintTop()}else reset('lock',{},'fade-in')},
  open:function(d){var m={msg:['msgs'],talk:['talk',{tab:'chats'}],phone:['calls',{}],web:['web'],photos:['photos'],cal:['cal',{}],memo:['memos']}[d.app];
    if(m)push(m[0],m[1]||{},'zoom-in');else toast(d.app==='camera'?'카메라를 열 수 없어요':'잠겨 있는 앱이에요')},
  back:function(){if(hback('nav'))return;if(nav.length>1)pop();else goHome()},
  chat:function(d){var t=thr(d.id);if(t)openThread(t)},
  tchat:function(d){var t=thr(d.id);if(t)openThread(t)},
  ttab:function(d){top().p.tab=d.tab;repaintTop()},
  tprof:function(d){push('tprof',d.me?{me:1}:{name:d.name})},
  tprofchat:function(d){var t=null;S.threads.forEach(function(x){if(x.app==='talk'&&!x.group&&x.name===d.name)t=x});
    if(!t){t={lv:1,id:uid(),app:'talk',name:d.name,avatar:null,pinned:false,unread:0,when:'',group:false,members:[],status:'',items:[]};S.threads.push(t)}
    nav.pop().el.remove();top().el.classList.remove('under');seen[t.id]=1;push('tchat',{id:t.id},null,true)},
  nocall:function(){toast('지금은 전화를 걸 수 없어요')},
  calltab:function(d){if(d.tab==='keypad'){toast('키패드는 잠겨 있어요');return}top().p.tab=d.tab;repaintTop()},
  contact:function(d){push('contact',{i:+d.i})},
  callrow:function(d){var i=contactIdx(d.name);if(i>=0)push('contact',{i:i});else toast('저장되지 않은 번호예요')},
  ctmsg:function(d){var t=null;S.threads.forEach(function(x){if(!t&&x.app==='msg'&&x.name===d.name)t=x});if(t)openThread(t);else toast('주고받은 메시지가 없어요')},
  send:function(){sendLive()},
  play:function(d,el){playVoice(el)},
  viewimg:function(d){var t=thr(d.tid);if(!t)return;var idx=0;for(var i=0;i<+d.i;i++)if(t.items[i].k==='photo')idx++;push('photo',{src:'c',tid:d.tid,i:idx})},
  gview:function(d){push('photo',{src:'g',i:+d.i})},
  pvgo:function(d){var e=top(),n=photoList(e.p).length;e.p.i=((e.p.i||0)+(+d.d)+n)%n;repaintTop()},
  fav:function(){var e=top(),cur=photoList(e.p)[e.p.i||0];if(cur){cur.fav=!cur.fav;repaintTop();markChanged(true)}},
  memo:function(d){push('memo',{i:+d.i})},
  webdel:function(d){hiddenSearch[d.q]=1;repaintTop(true)},
  webclear:function(){liveQueries.concat(S.search).forEach(function(q){hiddenSearch[q]=1});repaintTop();toast('검색 기록을 지웠어요')},
  callf:function(d){top().p.f=d.f;repaintTop()},
  calm:function(d){var p=top().p;p.m=(p.m||0)+(+d.d);repaintTop()},
  calday:function(d){top().p.sel=d.d;repaintTop(true)}
};

function bindChatInput(root){
  var inp=root.querySelector('#chatIn');if(!inp)return;
  var upd=function(){var has=!!inp.value.trim();var s=root.querySelector('.send');if(s){s.hidden=!has;var mic=root.querySelector('.mic');if(mic)mic.hidden=has}
    var ks=root.querySelector('#tcSend');if(ks){ks.classList.toggle('on',has);ks.innerHTML=has?I.sendk:I.hash}};
  inp.addEventListener('input',upd);
  inp.addEventListener('keydown',function(ev){if(ev.key==='Enter'&&!ev.isComposing){ev.preventDefault();sendLive()}});
  if(drafts[inp.dataset.tid]){inp.value=drafts[inp.dataset.tid];upd()}
  inp.addEventListener('blur',function(){drafts[inp.dataset.tid]=inp.value});
  [].forEach.call(root.querySelectorAll('[data-a="send"]'),function(btn){
    btn.addEventListener('mousedown',function(e){e.preventDefault()});
    btn.addEventListener('touchend',function(e){if(document.activeElement===inp){e.preventDefault();sendLive();inp.focus()}},{passive:false})});
}
var drafts={},typingFor={};
function chatBodyHtml(t){return (t.app==='talk'?talkItems(t):msgItems(t))+(typingFor[t.id]?'<div class="typing"><i></i><i></i><i></i></div>':'')}
function refreshChat(t){var e=top();if(!e||(e.s!=='chat'&&e.s!=='tchat')||e.p.id!==t.id)return;var cb=e.el.querySelector('#cb');cb.innerHTML=chatBodyHtml(t);cb.scrollTop=cb.scrollHeight}
var liveDated={};
function sepDay(v){var m=/(\d{4})년\s*(\d{1,2})월\s*(\d{1,2})일/.exec(str(v));return m?m[1]+'-'+m[2].padStart(2,'0')+'-'+m[3].padStart(2,'0'):(/^오늘/.test(str(v))?dayKey(phoneBase()):null)}
function dayKey(d){return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0')}
function sepTime(v){var m=/(\d{1,2}:\d{2})\s*$/.exec(str(v));if(!m)return null;var x=/(오전|오후)\s*\d{1,2}:\d{2}\s*$/.exec(str(v));return to24(x?x[0]:m[1])}
function addLiveSep(t){
  var d=phoneNow(),k=dayKey(d),lastDay=null,lastT=null;
  for(var i=t.items.length-1;i>=0;i--){var it=t.items[i];if(it.k==='date'){lastDay=sepDay(it.v);if(!lastT)lastT=sepTime(it.v);break}if(!lastT&&it.t)lastT=to24(it.t)}
  var need=lastDay!==k;
  if(!need&&t.app==='msg'&&lastT){var m=/^(\d{2}):(\d{2})$/.exec(lastT);if(m){var gap=d.getHours()*60+d.getMinutes()-(+m[1]*60+(+m[2]));if(gap>60||gap<0)need=true}}
  if(need)t.items.push({k:'date',lv:1,v:t.app==='talk'?d.getFullYear()+'년 '+(d.getMonth()+1)+'월 '+d.getDate()+'일 '+DOW[d.getDay()]+'요일':d.getFullYear()+'년 '+(d.getMonth()+1)+'월 '+d.getDate()+'일 '+hhmm(d)});
}
function sep24(v){return str(v).replace(/(오전|오후)\s*(\d{1,2}):(\d{2})/g,function(x){return to24(x)})}
function sendLive(){
  var inp=$('#chatIn',top().el);if(!inp)return;var v=inp.value.trim();if(!v)return;var t=thr(inp.dataset.tid);if(!t)return;
  var hadFocus=document.activeElement===inp;
  startClock();
  addLiveSep(t);if(false){var d=phoneNow();t.items.push({k:'date',v:t.app==='talk'?d.getFullYear()+'년 '+(d.getMonth()+1)+'월 '+d.getDate()+'일 '+DOW[d.getDay()]+'요일':'오늘 '+nowLabel()});liveDated[t.id]=1}
  t.items.push({w:'me',k:'text',lv:1,v:v,t:nowLabel()});t.when=nowLabel();inp.value='';drafts[t.id]='';inp.dispatchEvent(new Event('input'));
  refreshChat(t);markChanged(true);aiReply(t);
  if(hadFocus&&document.activeElement!==inp){try{inp.focus({preventScroll:true})}catch(e){inp.focus()}}
}
var FREQ={low:{cool:300000,mult:.2,label:'드물게'},mid:{cool:120000,mult:.35,label:'보통'},high:{cool:45000,mult:.7,label:'자주'}};
var pingTimer=null,lastPing=0,pingBusy=false,pingCount=0;
var OPENERS=['자?','뭐 해','갑자기 생각나서','아까 말 못 한 게 있는데','지금 잠깐 통화 돼?','...','괜찮아?'];
function threadFor(c,create){var hit=null;S.threads.forEach(function(t){if(!hit&&!t.group&&t.name===c.name)hit=t});
  if(!hit&&create){hit={lv:1,id:uid(),app:'talk',name:c.name,avatar:null,pinned:false,unread:0,when:'',group:false,members:[],status:'',items:[]};S.threads.push(hit)}return hit}
function startPings(){clearInterval(pingTimer);pingTimer=setInterval(pingTick,15000)}
function pingTick(){
  if(draftMode)return;touchSeen();var cfg=S.system.initiate;if(!cfg.on||pingBusy||viewingEditorOnly())return;
  var f=FREQ[cfg.freq]||FREQ.mid;if(Date.now()-lastPing<f.cool)return;
  var c=S.system.characters.filter(function(c){return c.ping>0}).sort(function(){return Math.random()-.5}).find(function(c){return Math.random()*100<c.ping*f.mult});
  if(c)doPing(c);
}
function viewingEditorOnly(){return !$('#ed').hidden&&(document.body.classList.contains('full')||document.body.classList.contains('narrow'))}
function pingPrompt(t,c){
  var lines=t.items.slice(-30).map(function(it){if(it.k==='date')return '--- '+sep24(it.v)+' ---';var n=it.w==='me'?S.owner.name:c.name;return (it.t?'['+to24(it.t)+'] ':'')+n+': '+(it.k==='photo'?'[사진]':it.k==='voice'?'[음성 메시지]':it.v)}).join('\n');
  var d=phoneNow();
  return '너는 인터랙티브 픽션 속 인물 \''+c.name+'\'을 연기한다. 지금 네가 폰 주인 \''+S.owner.name+'\'에게 먼저 메시지를 보내는 순간이다.\n\n이야기 설정: '+(S.scenario.title?S.scenario.title+' — ':'')+S.scenario.text+sysBlock([c.name])+
    '\n\n지금 폰의 날짜와 시각: '+d.getFullYear()+'년 '+(d.getMonth()+1)+'월 '+d.getDate()+'일 '+DOW[d.getDay()]+'요일 '+hhmm(d)+'. 시간대에 맞게 말해라.\n'+
    '\n지금까지 대화 (위가 오래된 것, [ ]는 보낸 시각):\n'+(lines||'(아직 대화 없음)')+
    '\n\n관계와 감정선, 마지막 대화 흐름, 지금 시각을 생각해서 먼저 연락할 자연스러운 이유를 정하고 말풍선 1~3개를 보내라. 이미 한 말을 반복하지 말고, 이야기의 비밀을 직접 설명하지 마라. 실제 한국어 메신저처럼 짧게.\nJSON 배열만 출력: [{"v":"말풍선 내용"}]';
}
function openThreadFresh(t){if(!unlocked){pendingOpen=t.id;unlockFlow();return}reset('home',{},null);push(t.app==='talk'?'talk':'msgs',{tab:'chats'},'zoom-in');openThread(t)}
/* ---------- mobile keyboard (iPhone · iPad · Android) ----------
   Android: the viewport meta asks the browser to shrink the page itself when the keyboard opens (interactive-widget=resizes-content),
            so the phone simply gets shorter and nothing has to move.
   iOS:     Safari never shrinks the page; it slides the whole page up instead, which made the screen jump.
            So the moment the chat box gets focus (never earlier, or the tap would miss the box) we already make the phone as short as the keyboard will leave room for
            (remembered from the last time, or a good guess the first time). The box is then above the keyboard,
            Safari has no reason to slide the page, and we only fine-tune to the real size once the keyboard is up. */
var APP_VER='20261013p';
var vvPinned=false,prePin=false,prePinT=null;
var IS_IOS=/iP(hone|ad|od)/.test(navigator.userAgent)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1);
function layoutH(){return Math.max(innerHeight,document.documentElement.clientHeight)}
function kbGuess(){var v=0;try{v=+localStorage.getItem('phone-kbh-'+(innerWidth>innerHeight?'l':'p'))||0}catch(e){}
  if(v>120&&v<layoutH()-150)return v;var tablet=Math.min(screen.width,screen.height)>=600;return Math.round(layoutH()*(tablet?(innerWidth>innerHeight?0.5:0.4):(innerWidth>innerHeight?0.62:0.47)))}
function kbRemember(h){try{localStorage.setItem('phone-kbh-'+(innerWidth>innerHeight?'l':'p'),String(Math.round(h)))}catch(e){}}
function pinDevice(t,h){var d=document.getElementById('device');if(!d)return;t=Math.max(0,Math.round(t))+'px';h=Math.round(h)+'px';
  if(d.style.position!=='fixed'){d.style.position='fixed';d.style.left='0';d.style.right='0';d.style.width='auto'}
  if(d.style.top!==t)d.style.top=t;if(d.style.height!==h)d.style.height=h}
function unpinDevice(){var d=document.getElementById('device');if(d&&d.style.position){d.style.position='';d.style.left='';d.style.right='';d.style.width='';d.style.top='';d.style.height=''}}
/* banner always sits at the top of what is visible (on iPhone the keyboard slides the whole page up, so push the banner down by that amount) */
function placeBanner(){var b=document.querySelector('.pbanner');if(!b||!phoneEl)return;
  var vv=window.visualViewport;if(!vv){b.style.top='';return}
  var r=phoneEl.getBoundingClientRect(),off=Math.round(vv.offsetTop-r.top);
  b.style.top=(off>0&&off<r.height-120)?'calc(var(--sb) + 4px + '+off+'px)':''}
/* keep the newest chat bubbles in view when the visible area shrinks (keyboard) or grows back, like a real messenger */
function anchorChat(){var e=top(),c=e&&e.el&&e.el.querySelector('#cb');if(!c)return;var h=c.clientHeight;
  if(!c._b){c._b=1;c.addEventListener('scroll',function(){if(c.clientHeight===c._h)c._end=c.scrollTop+c.clientHeight>=c.scrollHeight-40},{passive:true})}
  if(c._h&&h!==c._h){if(c._end)c.scrollTop=c.scrollHeight;else c.scrollTop+=c._h-h}
  c._h=h;c._end=c.scrollTop+h>=c.scrollHeight-40}
function inputFocused(){var a=document.activeElement;return !!(a&&(a.tagName==='INPUT'||a.tagName==='TEXTAREA')&&phoneEl&&phoneEl.contains(a))}
/* Keyboard: Android shrinks the page itself (viewport meta). iPhone slides the page up with its own smooth animation;
   we leave that alone (moving the phone ourselves made it jump) and only keep the banner and chat in view. */
function fitVV(){if(!window.visualViewport)return;
  if(vvPinned||prePin){prePin=false;vvPinned=false;unpinDevice()}
  if(!inputFocused()&&(window.scrollY||document.documentElement.scrollTop))window.scrollTo(0,0);
  placeBanner();anchorChat()}
function prePinFor(el,atFocus){
  if(!IS_IOS||!document.body.classList.contains('full')||vvPinned||(!atFocus&&inputFocused())||!el||el.id!=='chatIn')return;
  anchorChat();prePin=true;pinDevice(0,layoutH()-kbGuess());anchorChat();
  clearTimeout(prePinT);prePinT=setTimeout(function(){if(!vvPinned){prePin=false;fitVV()}},1300)}
/* while the keyboard slides in or out, follow it every frame */
var vvTrackUntil=0;
function trackVV(ms){var go=!vvTrackUntil||Date.now()>vvTrackUntil;vvTrackUntil=Math.max(vvTrackUntil,Date.now()+(ms||900));
  if(!go)return;(function loop(){fitVV();if(Date.now()<vvTrackUntil)requestAnimationFrame(loop);else vvTrackUntil=0})()}
if(window.visualViewport){visualViewport.addEventListener('scroll',function(){trackVV(400)});visualViewport.addEventListener('resize',function(){trackVV(900)})}
addEventListener('scroll',fitVV,{passive:true});
addEventListener('resize',function(){anchorChat();trackVV(500)});
document.addEventListener('focusin',function(){anchorChat();trackVV(1200)});
document.addEventListener('focusout',function(){setTimeout(function(){if(!inputFocused()){prePin=false;clearTimeout(prePinT)}trackVV(1200)},0)});
addEventListener('orientationchange',function(){setTimeout(function(){trackVV(600)},200)});
function showBanner(t,text){
  var old=document.querySelector('.pbanner');if(old)old.remove();
  var b=document.createElement('button');b.className='pbanner';
  b.innerHTML='<span class="note-ic">'+(t.app==='talk'?APPI.talk:APPI.msg)+'</span><span class="note-b"><span class="note-h"><b>'+esc(t.name)+'</b><em>지금</em></span><span class="note-p">'+esc(text)+'</span></span>';
  phoneEl.appendChild(b);placeBanner();requestAnimationFrame(function(){requestAnimationFrame(function(){b.classList.add('show')})});
  var gone=false,timer=null,y0=null,dy=0,moved=false;
  function dismiss(){if(gone)return;gone=true;clearTimeout(timer);b.style.transform='';b.classList.remove('show');setTimeout(function(){b.remove()},420)}
  function arm(){clearTimeout(timer);timer=setTimeout(dismiss,5200)}
  arm();
  b.addEventListener('pointerdown',function(e){y0=e.clientY;dy=0;moved=false;clearTimeout(timer);try{b.setPointerCapture(e.pointerId)}catch(x){}});
  b.addEventListener('pointermove',function(e){if(y0==null)return;dy=e.clientY-y0;if(Math.abs(dy)>8)moved=true;if(dy<0){b.style.transition='none';b.style.transform='translateY('+dy+'px)';b.style.opacity=String(Math.max(.2,1+dy/140))}});
  function end(){if(y0==null)return;y0=null;b.style.transition='';b.style.opacity='';if(dy<-24){dismiss()}else{b.style.transform='';arm()}}
  b.addEventListener('pointerup',end);b.addEventListener('pointercancel',end);
  b.addEventListener('click',function(){if(moved){moved=false;return}gone=true;clearTimeout(timer);b.remove();openThreadFresh(t)});
}
/* ---------- notifications: in-app banner, sound, system notification ---------- */
var soundOn=true,actx=null,swReg=null;
try{soundOn=localStorage.getItem('phone-sound')!=='0'}catch(e){}
function audioCtx(){if(!actx){try{var C=window.AudioContext||window.webkitAudioContext;if(C)actx=new C()}catch(e){}}return actx}
document.addEventListener('pointerdown',function(){var c=audioCtx();if(c&&c.state==='suspended')c.resume()},{passive:true});
function playDing(force){
  if(!soundOn&&!force)return;var c=audioCtx();if(!c)return;if(c.state==='suspended')c.resume();
  try{var t0=c.currentTime;[[880,0],[1318.5,.13]].forEach(function(n){var o=c.createOscillator(),g=c.createGain();o.type='sine';o.frequency.value=n[0];g.gain.setValueAtTime(0,t0+n[1]);g.gain.linearRampToValueAtTime(.22,t0+n[1]+.015);g.gain.exponentialRampToValueAtTime(.0001,t0+n[1]+.5);o.connect(g);g.connect(c.destination);o.start(t0+n[1]);o.stop(t0+n[1]+.55)});
    if(navigator.vibrate)navigator.vibrate([60,40,60])}catch(e){}
}
function sysNotifyOk(){return 'Notification' in window&&Notification.permission==='granted'}
function systemNotify(t,text){
  if(!sysNotifyOk())return;
  var o={body:text,tag:'phone-'+t.id,renotify:true,icon:'icon-192.png',data:{tid:t.id},silent:!soundOn};
  try{if(swReg&&swReg.showNotification)swReg.showNotification(t.name,o);else new Notification(t.name,o)}catch(e){}
}
// one entry point for "a message arrived while the thread is not on screen"
function notify(t,text){
  var e=top();
  if(document.hidden){systemNotify(t,text);return}
  playDing();
  if(!e||e.s!=='lock')showBanner(t,text);
}
/* show a new bubble wherever the person is: inside that chat, or in the chat list (preview text and time) */
function liveRefresh(t){if(inThread(t)){refreshChat(t);return}var e=top();if(e&&['msgs','talk'].indexOf(e.s)>=0)repaintTop(true)}
function inThread(t){var e=top();return e&&(e.s==='chat'||e.s==='tchat')&&e.p.id===t.id}
function doPing(c,at){
  if(pingBusy)return Promise.resolve();pingBusy=true;lastPing=Date.now();pingCount++;startClock();
  var t=threadFor(c,true);if(!at&&inThread(t)){typingFor[t.id]=1;refreshChat(t)}
  var prompt=null;if(aiMode()){tOverride=at||0;try{prompt=pingPrompt(t,c)}finally{tOverride=0}}
  var gen=prompt?AI.fast(prompt).then(function(r){return arr(Array.isArray(r)?r:r&&(r.messages||r.items)).map(function(x){return str(x&&x.v).trim()}).filter(Boolean).slice(0,3)}).catch(function(){return []}):Promise.resolve([]);
  return gen.then(function(msgs){
    if(!msgs.length)msgs=[OPENERS[Math.floor(Math.random()*OPENERS.length)]];
    typingFor[t.id]=0;tOverride=at||0;
    try{addLiveSep(t);msgs.forEach(function(v){t.items.push({w:'them',k:'text',lv:1,v:v,t:nowLabel()})});t.when=nowLabel()}finally{tOverride=0}
    t._ping=Date.now();
    var watching=inThread(t)&&!document.hidden&&!at;
    if(watching){seen[t.id]=1;t.unread=0;refreshChat(t)}
    else{delete seen[t.id];t.unread=maxUnread(t);var e=top();
      if(e&&['lock','home','msgs','talk'].indexOf(e.s)>=0)repaintTop(true);
      notify(t,msgs[msgs.length-1]);}
    markChanged(true);
  }).then(function(){pingBusy=false},function(){pingBusy=false});
}
// messages that "arrived" while the page was closed: roll the same odds for the time away and add them when the phone is opened again
function seenKey(){return 'phone-seen:'+(S.id||'')}
function touchSeen(){try{localStorage.setItem(seenKey(),String(Date.now()))}catch(e){}}
function catchUp(){
  var cfg=S.system&&S.system.initiate;if(!cfg||!cfg.on||!clk()||pingBusy||viewingEditorOnly())return;
  var last=0;try{last=parseInt(localStorage.getItem(seenKey()),10)||0}catch(e){}
  var now=Date.now(),away=now-last;touchSeen();if(!last||away<90000)return;
  var f=FREQ[cfg.freq]||FREQ.mid,cands=S.system.characters.filter(function(c){return c.ping>0});if(!cands.length)return;
  var slot=f.cool*2,n=Math.min(12,Math.floor(away/slot)),hits=[];
  for(var i=1;i<=n;i++){var c=cands.slice().sort(function(){return Math.random()-.5}).find(function(c){return Math.random()*100<c.ping*f.mult*2.5});if(c)hits.push({c:c,ts:Math.min(now-5000,last+i*slot-Math.random()*slot*.6)})}
  hits=hits.slice(0,3);if(!hits.length)return;
  var chain=Promise.resolve();hits.forEach(function(h){chain=chain.then(function(){return doPing(h.c,h.ts)})});
  chain.then(function(){lastPing=Date.now()});
}
var replyBusy={};
function aiReply(t){
  if(!aiMode()){if(keyAskable())openKeyDlg('답장을 받으려면 내 Gemini API 키를 등록해 주세요. 무료로 만들 수 있어요.');return}
  if(replyBusy[t.id])return;
  replyBusy[t.id]=1;
  setTimeout(function(){if(replyBusy[t.id]){typingFor[t.id]=1;refreshChat(t)}},250);
  var others=t.members.filter(function(m){return m!==S.owner.name});
  var who=t.group?'단톡방 "'+t.name+'"의 멤버들('+others.join(', ')+')':"'"+t.name+"'";
  var lines=t.items.slice(-40).map(function(it){if(it.k==='date')return '--- '+sep24(it.v)+' ---';var n=it.w==='me'?S.owner.name:(t.group?(it.n||'?'):t.name);return (it.t?'['+to24(it.t)+'] ':'')+n+': '+(it.k==='photo'?'[사진'+(it.ph&&it.ph.l?': '+it.ph.l:'')+']':it.k==='voice'?'[음성 메시지]':it.v)}).join('\n');
  var prompt='너는 인터랙티브 픽션 속 인물을 연기한다. 지금 너는 '+who+'이고, 스마트폰 메신저로 폰 주인 \''+S.owner.name+'\'와 대화 중이다.\n\n이야기 설정: '+(S.scenario.title?S.scenario.title+' — ':'')+S.scenario.text+'\n'+(S.scenario.cast?'등장인물: '+S.scenario.cast+'\n':'')+(t.status?t.name+'의 상태메시지: '+t.status+'\n':'')+sysBlock(t.group?t.members.concat([t.name]):[t.name])+'\n'+
    '\n지금 폰의 날짜와 시각: '+(function(){var d=phoneNow();return d.getFullYear()+'년 '+(d.getMonth()+1)+'월 '+d.getDate()+'일 '+DOW[d.getDay()]+'요일 '+hhmm(d)})()+'. 시간대(새벽·아침·밤 등)와 시각을 말할 때는 반드시 이 시각에 맞춰라.\n'+
    '\n최근 대화 (위가 오래된 것, [ ]는 보낸 시각):\n'+lines+'\n\n\''+S.owner.name+'\'가 방금 보낸 메시지에 답장해라. 비공개 설정의 성격·말투·관계·지침을 지키고, 지금까지의 맥락과 감정선을 그대로 이어 간다. 실제 한국어 메신저처럼 짧고 자연스럽게, 말풍선 1~3개. 이야기의 비밀을 직접 설명하지 말고, 너는 AI라는 말도 하지 마라.\n'+
    (t.group?'답장은 위 멤버들('+others.join(', ')+') 중에서만 나온다. 폰 주인 \''+S.owner.name+'\'는 절대 답장하지 마라. 폰 주인의 말·행동을 대신 쓰지 마라.\n':'')+'JSON 배열만 출력: [{"v":"말풍선 내용"'+(t.group?',"n":"보낸 멤버 이름(반드시 멤버 중 한 명)"':'')+'}]';
  AI.fast(prompt).then(function(res){
    var out=arr(Array.isArray(res)?res:res&&(res.messages||res.items)).filter(function(x){return x&&str(x.v).trim()&&!(t.group&&str(x.n).trim()===S.owner.name)}).slice(0,4);
    var i=0;(function next(){if(i>=out.length){typingFor[t.id]=0;replyBusy[t.id]=0;refreshChat(t);markChanged(true);
      if(out.length&&(!inThread(t)||document.hidden)){delete seen[t.id];t.unread=maxUnread(t);var e2=top();if(e2&&['lock','home','msgs','talk'].indexOf(e2.s)>=0)repaintTop(true);notify(t,str(out[out.length-1].v))}return}
      var x=out[i++],it={w:'them',k:'text',v:str(x.v),t:nowLabel()};if(t.group){var nn=str(x.n).trim();it.n=(nn&&others.indexOf(nn)>=0)?nn:(others[0]||t.members[0]||'?')}
      it.lv=1;t.items.push(it);t.when=nowLabel();liveRefresh(t);if(i<out.length)setTimeout(next,350+Math.min(650,it.v.length*18));else next()})();
  }).catch(function(err){typingFor[t.id]=0;replyBusy[t.id]=0;refreshChat(t);toast(err&&err.code==='rate_limited'?'답장이 잠시 늦어지고 있어요':'답장을 받지 못했어요')});
}
function playVoice(el){
  if(el._t){clearInterval(el._t);el._t=null;el.querySelectorAll('.wave i').forEach(function(b){b.classList.remove('p')});el.querySelector('.vp').innerHTML=I.play;return}
  var bs=el.querySelectorAll('.wave i'),dur=parseDur(el.dataset.dur),k=0,vd=el.querySelector('.vd');
  el.querySelector('.vp').innerHTML=I.pause;
  el._t=setInterval(function(){if(k<bs.length){bs[k++].classList.add('p');var s=Math.round(dur*k/bs.length);vd.textContent=Math.floor(s/60)+':'+String(s%60).padStart(2,'0')}
    else{clearInterval(el._t);el._t=null;bs.forEach(function(b){b.classList.remove('p')});el.querySelector('.vp').innerHTML=I.play;vd.textContent=el.dataset.dur}},dur*1000/bs.length);
}
function bindSwipe(e){var st=e.el.querySelector('#pvStage');if(!st)return;var x0=null;
  st.addEventListener('pointerdown',function(ev){x0=ev.clientX});
  st.addEventListener('pointerup',function(ev){if(x0==null)return;var dx=ev.clientX-x0;x0=null;if(Math.abs(dx)>50&&photoList(e.p).length>1)A.pvgo({d:dx<0?1:-1})})}

/* ---------- config & AI (Gemini) ---------- */
var CFG=Object.assign({aiProxy:'',allowUserKey:true,textModel:'gemini-3.8-flash',textModels:['gemini-3.8-flash','gemini-3.5-flash-lite'],imageModel:'gemini-3.1-flash-image',allowImages:false},window.PHONE_CONFIG||{});
var AI_KEY='phone-ai-v1';
var AIS={key:'',textModel:'',imageModel:'',images:false};
try{Object.assign(AIS,JSON.parse(localStorage.getItem(AI_KEY)||'{}'))}catch(e){}AIS.images=false;
function saveAIS(){try{localStorage.setItem(AI_KEY,JSON.stringify(AIS))}catch(e){}try{Store.set('ai',JSON.parse(JSON.stringify(AIS)))}catch(e){}keyToCloud()}
/* logged-in admins keep their key in their own account too, so it comes back on any device after Google login */
var keyCloudT=null,keyCloudLast=null;
function keyToCloud(){if(typeof Cloud==='undefined'||!Cloud.user||keyCloudLast===AIS.key)return;clearTimeout(keyCloudT);
  keyCloudT=setTimeout(function(){var k=AIS.key;Cloud.saveKey(k).then(function(){keyCloudLast=k},function(){})},600)}
function keyFromCloud(){if(!Cloud.user)return;keyCloudLast=null;
  Cloud.loadKey().then(function(k){
    if(k&&!AIS.key){AIS.key=k;keyCloudLast=k;saveAIS();aiTestMsg='';renderSettings();renderSide()}
    else if(AIS.key&&k!==AIS.key)keyToCloud();
    else keyCloudLast=k},function(){})}
try{if(navigator.storage&&navigator.storage.persist)navigator.storage.persist()}catch(e){}
function aiMode(){if(window.PHONE_AI_OVERRIDE)return 'preview';return CFG.aiProxy?'proxy':(CFG.allowUserKey&&AIS.key?'key':null)}
function textModel(){return CFG.textModel}
function imageModel(){return AIS.imageModel||CFG.imageModel}
function imagesOn(){if(window.PHONE_AI_OVERRIDE)return false;return CFG.aiProxy?!!CFG.allowImages:(!!AIS.images&&!!AIS.key)}
function gemini(model,body){
  var mode=aiMode();if(!mode)return Promise.reject({code:'no_ai'});
  if(mode==='preview')return window.PHONE_AI_OVERRIDE(model,body);
  var url,headers={'Content-Type':'application/json'},payload;
  if(mode==='proxy'){url=CFG.aiProxy;payload={model:model,body:body}}
  else{url='https://generativelanguage.googleapis.com/v1beta/models/'+encodeURIComponent(model)+':generateContent';headers['x-goog-api-key']=AIS.key;payload=body}
  return fetch(url,{method:'POST',headers:headers,body:JSON.stringify(payload)}).then(function(r){
    return r.json().catch(function(){return {}}).then(function(j){
      if(!r.ok){var m=String((j&&j.error&&(j.error.message||j.error))||('HTTP '+r.status));
        throw {code:(r.status===503||r.status===500||r.status===504||/high demand|overloaded|UNAVAILABLE/i.test(m))?'busy':r.status===429?'rate_limited':(r.status===401||r.status===403||/api key|api_key/i.test(m))?'bad_key':r.status===404?'no_model':'http',message:m}}
      return j})
  },function(){throw {code:'network'}});
}
function partsOf(j){var c=j&&j.candidates&&j.candidates[0];
  if(!c||!c.content||!c.content.parts){throw {code:((j&&j.promptFeedback&&j.promptFeedback.blockReason)||(c&&/SAFETY|PROHIBITED|BLOCK/.test(c.finishReason||'')))?'blocked':'empty'}}
  return c.content.parts}
function parseJSONLoose(t){
  t=str(t).trim().replace(/^```(?:json)?\s*/i,'').replace(/```\s*$/,'');
  try{return JSON.parse(t)}catch(e){}
  var a=t.indexOf('{'),b=t.lastIndexOf('}'),c=t.indexOf('['),d=t.lastIndexOf(']'),cs=[];
  if(a>=0&&b>a)cs.push(t.slice(a,b+1));if(c>=0&&d>c)cs.push(t.slice(c,d+1));
  for(var i=0;i<cs.length;i++){try{return JSON.parse(cs[i])}catch(e){}}
  throw {code:'parse'};
}
var AI={
  text:function(prompt,json){var gc={temperature:1};if(json)gc.responseMimeType='application/json';
    var body={contents:[{role:'user',parts:[{text:prompt}]}],generationConfig:gc};
    var ms=[CFG.textModel].concat((CFG.textModels||[]).filter(function(m){return m!==CFG.textModel}));
    var slow=function(n){return new Promise(function(r){setTimeout(r,n)})};
    function run(i,tries){return gemini(ms[i],body).catch(function(e){
      var soft=e&&(e.code==='busy'||e.code==='rate_limited'||e.code==='no_model');
      if(!soft)throw e;
      if(e.code!=='no_model'&&tries<1)return slow(1200).then(function(){return run(i,tries+1)});
      if(i+1<ms.length)return run(i+1,0);
      throw e})}
    return run(0,0).then(function(j){
      var t=partsOf(j).filter(function(p){return p.text&&!p.thought}).map(function(p){return p.text}).join('');if(!t.trim())throw {code:'empty'};return t})},
  json:function(prompt){return AI.text(prompt,true).then(parseJSONLoose)},
  /* chat replies: the light model answers in about a second; each try gets a few seconds before we move on to the other model */
  fast:function(prompt){
    var light=CFG.fastModel||(CFG.textModels||[]).filter(function(m){return /lite/.test(m)})[0]||CFG.textModel;
    var ms=[light].concat([CFG.textModel].concat(CFG.textModels||[]).filter(function(m,i,a){return m!==light&&a.indexOf(m)===i}));
    var body={contents:[{role:'user',parts:[{text:prompt}]}],generationConfig:{temperature:1,responseMimeType:'application/json',maxOutputTokens:400}};
    function within(p,ms){return Promise.race([p,new Promise(function(_,rej){setTimeout(function(){rej({code:'timeout'})},ms)})])}
    function run(i){return within(gemini(ms[i],body),i===0?4500:9000).catch(function(e){
      if(e&&(e.code==='bad_key'||e.code==='no_ai'||e.code==='network'))throw e;if(i+1<ms.length)return run(i+1);throw e})}
    return run(0).then(function(j){var t=partsOf(j).filter(function(p){return p.text&&!p.thought}).map(function(p){return p.text}).join('');if(!t.trim())throw {code:'empty'};return parseJSONLoose(t)})},
  image:function(prompt){return gemini(imageModel(),{contents:[{role:'user',parts:[{text:prompt}]}],generationConfig:{responseModalities:['TEXT','IMAGE']}}).then(function(j){
    var ps=partsOf(j);for(var i=0;i<ps.length;i++){var d=ps[i].inlineData||ps[i].inline_data;if(d&&d.data)return compressUrl('data:'+(d.mimeType||d.mime_type||'image/png')+';base64,'+d.data,1000)}
    throw {code:'no_image'}})}
};
function aiErrMsg(err){var c=err&&err.code;
  return {no_ai:'설정 › AI · API 관리에서 Gemini 키를 넣어 주세요.',bad_key:'API 키를 Google이 받아 주지 않았어요'+(err&&err.message?' ('+String(err.message).slice(0,160)+')':'')+'. 키를 다시 복사해 붙여넣어 보세요.',busy:'지금 Gemini에 사용자가 몰려 있어요. 키는 정상이니 잠시 뒤 다시 눌러 주세요.',rate_limited:'무료 사용 한도에 걸렸어요. 1~2분 뒤에 다시 해 주세요.',
    no_model:'사용할 수 있는 Gemini 모델을 찾지 못했어요. config.js의 모델 이름을 확인해 주세요.',network:'인터넷 연결이나 서버 주소를 확인해 주세요.',blocked:'안전 필터에 걸렸어요. 표현을 조금 바꿔 보세요.',
    parse:'결과 형식이 깨졌어요. 한 번 더 눌러 주세요.',empty:'빈 답이 왔어요. 한 번 더 눌러 주세요.',no_image:'이미지가 오지 않았어요. 이미지 모델 이름과 결제 설정을 확인해 주세요.'}[c]
    ||('만들지 못했어요'+(err&&err.message?' ('+String(err.message).slice(0,140)+')':'')+'.')}

/* ---------- prompts ---------- */
var STYLE_RULES='실제 연예인, 실존 인물, 실제 회사나 브랜드 이름은 쓰지 마라. 한국어 실제 메신저 말투로 쓴다(ㅋㅋ, 줄임말, 이모지는 적당히, 인물마다 말투가 다르게). 설명하지 말고 단서로 보여 줘라. 지난 기록의 날짜는 폰의 현재 날짜 이전으로(일정은 이후도 가능). 시각은 24시간제(HH:MM). 날짜 구분과 말풍선 시각은 반드시 시간 순서대로 이어지고, 폰의 현재 날짜·시각보다 늦으면 안 된다. 대화 속 "새벽", "아침", "밤" 같은 말도 그 시각과 맞아야 한다. 안 읽은 개수(unread)는 마지막으로 받은 메시지 수를 넘지 않게.';
var ITEM_SCHEMA='{"k":"date","v":"메시지 앱은 2026년 10월 3일 01:04 형식, 톡은 2026년 10월 3일 토요일 형식"} 또는 {"w":"me 또는 them","k":"text","v":"내용","n":"단톡일 때 보낸 사람","t":"톡일 때 보낸 시각 예) 23:42"} 또는 {"w":"them","k":"photo","ph":{"c":["#hex","#hex","#hex"],"l":"사진 묘사"}} 또는 {"w":"them","k":"voice","dur":"0:07"}';
var THREAD_SCHEMA='"threads":[{"app":"msg 또는 talk","name":"폰 주인이 저장한 이름","pinned":false,"unread":0,"when":"목록 시각 예) 00:28 / 어제 / 금요일","group":false,"members":["단톡일 때만, 나 제외"],"status":"상대 톡 상태메시지","items":[말풍선들]}]';
var SECS={
  threads:{label:'새 대화',spec:'"threads": 지금 없는 상대와의 새 대화 2~3개. 메시지와 톡을 섞고, 각각 10~25개 말풍선. 말풍선 형식: '+ITEM_SCHEMA,schema:THREAD_SCHEMA,count:function(){return S.threads.length}},
  friends:{label:'톡 친구',spec:'"friends": 톡 친구 5~8명. 대화에 나온 인물을 포함하고, 상태메시지에 그 사람 성격이나 지금 상황이 살짝 보이게.',schema:'"friends":[{"name":"","status":""}]',count:function(){return S.friends.length}},
  gallery:{label:'사진첩',spec:'"gallery": 사진 12~16장. 대화와 일정에 나온 순간들과 이어지게. 사진 c는 그 장면의 실제 색감 3가지.',schema:'"gallery":[{"ph":{"c":["#hex","#hex","#hex"],"l":"사진 묘사 한 문장"},"date":"YYYY-MM-DD","fav":false}]',count:function(){return S.gallery.length}},
  search:{label:'검색 기록',spec:'"search": 검색어 8~12개, 최근 것부터. 속마음이나 숨기는 계획이 드러나게.',schema:'"search":["검색어"]',count:function(){return S.search.length}},
  memos:{label:'메모',spec:'"memos": 메모 2~4개. 할 일 목록, 쓰다 만 글, 혼잣말처럼 형식을 섞어서.',schema:'"memos":[{"title":"","body":"줄바꿈은 \\n","date":"10월 9일 또는 00:40"}]',count:function(){return S.memos.length}},
  calls:{label:'통화 기록',spec:'"calls": 5~8개, 최근 것부터. 부재중 전화가 이야기에 의미 있게.',schema:'"calls":[{"name":"","type":"missed 또는 in 또는 out","time":"00:31 / 어제 / 금요일","count":1}]',count:function(){return S.calls.length}},
  contacts:{label:'연락처',spec:'"contacts": 연락처 8~15명. 대화·통화·톡에 나오는 인물을 모두 포함하고 이름은 폰 주인이 저장한 그대로. 번호는 반드시 010-0000-1234처럼 가운데가 0000인 가짜 번호. memo는 짧게(없어도 됨), 가까운 사람 2~3명은 fav true.',schema:'"contacts":[{"name":"","phone":"010-0000-0000","memo":"","fav":false}]',count:function(){return S.contacts.length}},
  events:{label:'일정',spec:'"events": 일정 2~5개, 이번 달과 다음 달.',schema:'"events":[{"d":"YYYY-MM-DD","t":"짧은 일정 이름"}]',count:function(){return S.events.length}}
};
function sysCount(){var y=S.system,p=y.protagonist;return y.characters.length+y.relations.length+[p.personality,p.speech,p.secret,p.want,y.world,y.truth,y.rules].filter(Boolean).length}
function sysBlock(focus){
  var y=S.system,L=[],p=y.protagonist,inF=function(n){return !focus||focus.indexOf(n)>=0};
  var pp=[p.personality&&'성격: '+p.personality,p.speech&&'말투: '+p.speech,p.secret&&'숨기는 것: '+p.secret,p.want&&'원하는 것: '+p.want].filter(Boolean);
  if(pp.length)L.push('주인공 '+S.owner.name+' — '+pp.join(' / '));
  y.characters.forEach(function(c){if(!inF(c.name))return;var a=[c.role&&'주인공과의 관계: '+c.role,c.personality&&'성격: '+c.personality,c.speech&&'말투: '+c.speech,c.secret&&'비밀·메모: '+c.secret].filter(Boolean);if(a.length)L.push(c.name+' — '+a.join(' / '))});
  y.relations.forEach(function(r){if(!focus||inF(r.a)||inF(r.b))L.push(r.a+' ↔ '+r.b+': '+r.desc)});
  if(y.world)L.push('세계관·배경: '+y.world);
  if(y.truth)L.push('숨겨진 진실 (독자에게 직접 밝히지 말 것): '+y.truth);
  if(y.rules)L.push('작가 지침 (반드시 따를 것): '+y.rules);
  return L.length?'\n\n=== 비공개 설정 (작가만 아는 정보. 그대로 말하지 말고 인물의 행동, 말투, 감정선에 녹여라) ===\n'+L.join('\n'):'';
}
function storyContext(rich,skip){
  skip=skip||'';var o=S.owner,sc=S.scenario,L=[];
  L.push('폰 주인: '+o.name+(o.status?' (톡 상태메시지: '+o.status+')':''));
  L.push('폰의 현재 날짜와 시각: '+dayKey(phoneNow())+' '+phoneTime()+' (24시간제)');
  if(skip!=='scenario'){if(sc.title)L.push('제목: '+sc.title);if(sc.text)L.push('상황: '+sc.text);}if(sc.cast)L.push('등장인물 메모: '+sc.cast);
  if(skip!=='threads')S.threads.forEach(function(t){
    var lines=t.items.filter(function(it){return it.k!=='date'}).slice(rich?-20:-8).map(function(it){var n=it.w==='me'?o.name:(t.group?(it.n||'?'):t.name);return '  '+n+': '+(it.k==='photo'?'[사진: '+(it.ph&&it.ph.l||'')+']':it.k==='voice'?'[음성 메시지]':it.v)});
    L.push('['+(t.app==='talk'?'톡':'메시지')+(t.group?' 단톡 · 멤버 '+t.members.join(', '):'')+'] '+t.name+(lines.length?'\n'+lines.join('\n'):' (아직 비어 있음)'))});
  if(skip!=='friends'&&S.friends.length)L.push('톡 친구: '+S.friends.map(function(f){return f.name+(f.status?'('+f.status+')':'')}).join(', '));
  if(skip!=='gallery'&&S.gallery.length)L.push('사진첩: '+S.gallery.slice(0,24).map(function(g){return (g.date||'')+' '+(g.ph.l||'(설명 없음)')}).join(' / '));
  if(skip!=='search'&&S.search.length)L.push('검색 기록: '+S.search.join(' / '));
  if(skip!=='memos'&&S.memos.length)L.push('메모: '+S.memos.map(function(m){return m.title}).join(' / '));
  if(skip!=='calls'&&S.calls.length)L.push('통화: '+S.calls.map(function(c){return c.name+'('+({missed:'부재중',in:'수신',out:'발신'}[c.type])+' '+c.time+')'}).join(', '));
  if(skip!=='contacts'&&S.contacts.length)L.push('연락처: '+S.contacts.map(function(c){return c.name+(c.memo?'('+c.memo+')':'')}).join(', '));
  if(skip!=='events'&&S.events.length)L.push('일정: '+S.events.map(function(e){return e.d+' '+e.t}).join(', '));
  return L.join('\n')+(skip==='system'?'':sysBlock());
}
function fillPrompt(keys){
  return '너는 \'남의 폰 훔쳐보기\' 인터랙티브 픽션 작가다. 아래는 지금까지 만들어진 한 인물의 폰 내용이다. 이 이야기와 앞뒤가 딱 맞도록 요청한 항목만 새로 만들어라. 이미 있는 내용과 겹치지 않게 하고, 인물·날짜·장소·물건이 다른 앱 내용과 서로 맞물리게 해라. 내용이 적으면 상황 소개와 등장인물 메모를 바탕으로 이야기를 넓혀라.\n'+STYLE_RULES+
    '\n\n=== 지금 폰 내용 ===\n'+storyContext(true)+'\n\n=== 만들 항목 ===\n'+keys.map(function(k){return '- '+SECS[k].spec}).join('\n')+
    '\n\nJSON 객체 하나만 출력. 키는 요청한 항목만 쓴다:\n{'+keys.map(function(k){return SECS[k].schema}).join(',\n')+'}';
}
function mergeFill(res){
  if(!res||typeof res!=='object'||Array.isArray(res))throw {code:'parse'};
  var tmp=normalize({owner:S.owner,threads:res.threads,friends:res.friends,gallery:res.gallery,search:res.search,memos:res.memos,calls:res.calls,events:res.events,contacts:res.contacts}),n=0;
  if(res.contacts){var cn={};S.contacts.forEach(function(c){cn[c.name]=1});tmp.contacts.forEach(function(c){if(!cn[c.name]){S.contacts.push(c);cn[c.name]=1;n++}})}
  if(res.threads){var names={};S.threads.forEach(function(t){names[t.app+'|'+t.name]=1});tmp.threads.forEach(function(t){if(!names[t.app+'|'+t.name]){S.threads.push(t);n++}})}
  if(res.friends){var fn={};S.friends.forEach(function(f){fn[f.name]=1});tmp.friends.forEach(function(f){if(!fn[f.name]){S.friends.push(f);fn[f.name]=1;n++}})}
  if(res.search)tmp.search.forEach(function(q){if(S.search.indexOf(q)<0){S.search.push(q);n++}});
  ['gallery','memos','calls','events'].forEach(function(k){if(res[k])tmp[k].forEach(function(x){S[k].push(x);n++})});
  return n;
}
function contPrompt(t,count){
  var empty=!t.items.some(function(it){return it.k!=='date'});
  var lines=t.items.slice(-40).map(function(it){if(it.k==='date')return '--- '+it.v+' ---';var n=it.w==='me'?S.owner.name+'(me)':(t.group?(it.n||'?'):t.name)+'(them)';return n+': '+(it.k==='photo'?'[사진: '+(it.ph&&it.ph.l||'')+']':it.k==='voice'?'[음성 메시지]':it.v)}).join('\n');
  return '너는 \'남의 폰 훔쳐보기\' 인터랙티브 픽션 작가다.\n'+STYLE_RULES+'\n\n=== 이야기 전체 ===\n'+storyContext(false)+
    '\n\n=== '+(empty?'새로 쓸':'이어 쓸')+' 대화 ===\n['+(t.app==='talk'?'톡':'메시지')+'] '+t.name+(t.group?' (단톡 멤버: '+t.members.join(', ')+')':'')+'\n'+(lines||'(비어 있음)')+
    '\n\n이 대화를 '+(empty?'처음부터':'자연스럽게 이어서')+' 말풍선 '+count+'개 안팎으로 써라. me는 폰 주인 '+S.owner.name+', them은 상대다. 양쪽이 주고받게 하고, 시간이 흐르면 날짜 구분을 넣고, 사진이나 음성 메시지도 가끔 섞어라. '+
    (t.app==='talk'?'톡이므로 말풍선마다 t(시각)를 넣어라. ':'')+(t.group?'단톡이므로 them 말풍선마다 n(보낸 사람)을 멤버 중에서 넣어라. ':'')+
    '\nJSON 객체 하나만 출력: {"items":[말풍선들]}\n말풍선 형식: '+ITEM_SCHEMA;
}
function imgPrompt(desc){return '스마트폰 카메라로 찍은 것 같은 자연스러운 사진 한 장. 세로 3:4 구도. 글자, 워터마크, 테두리 없이. 실존 인물이나 유명인을 닮지 않게 하고 사람 얼굴은 가급적 정면으로 드러나지 않게. 장면: '+desc+(S.scenario.title?' (이야기 분위기: '+S.scenario.title+')':'')}

/* ---------- new-phone prompt (only the chosen categories) ---------- */
var MOODS=['달달','애틋','설렘','집착','미스터리','스릴러','코믹','일상','이별','짝사랑'];
var AMOUNT={threads:'메시지 대화 4~6개(가장 중요한 상대와는 25~40개 말풍선, 여러 날짜에 걸쳐, 사진과 음성 메시지 섞기)와 톡 대화 2~4개(단톡 하나 포함). 안 읽은 메시지가 있는 대화 2~3개로 잠금화면 알림 긴장감을 만들어라',
  friends:'톡 친구 4~8명',contacts:'연락처 8~15명',gallery:'사진 12~18장',search:'검색어 8~12개',memos:'메모 2~4개',calls:'통화 5~8개',events:'일정 2~5개(이번 달과 다음 달)'};
function genPrompt(keys){
  return '너는 \'남의 폰 훔쳐보기\' 인터랙티브 픽션 작가다. 아래 컨셉으로 한 인물의 스마트폰 속 내용을 만들어라.\n'+
  '독자는 이 폰을 몰래 열어 여러 앱을 오가며 조각을 맞춰 이야기를 알아낸다. 앱마다 서로 맞물리는 디테일(같은 날짜, 같은 장소, 같은 물건)을 심어라. 가장 중요한 비밀이나 감정은 바로 드러나지 않게.\n'+STYLE_RULES+'\n\n'+
  '컨셉: '+aiDraft.concept.trim()+'\n폰 주인 이름: '+(aiDraft.owner.trim()||'(이야기에 어울리게 지어라)')+'\n분위기: '+(aiDraft.moods.join(', ')||'컨셉에 맞게')+'\n폰의 현재 날짜: '+todayStr()+'\n\n'+
  'JSON 객체 하나만 출력. 아래 키만 쓴다:\n{"owner":{"name":"","status":"톡 상태메시지","time":"HH:MM 24시간제","battery":1~100,"pass":"4자리 숫자","hint":"비밀번호 힌트(이야기 속 단서와 연결)"},\n'+
  '"scenario":{"title":"짧고 여운 있는 제목","text":"독자에게 보여 줄 2~3문장 상황 소개. 결말이나 비밀은 말하지 말 것","cast":"주요 인물과 관계, 한 줄에 한 명"},\n"wall":"dusk|sea|rose|night|forest|mono 중 하나",\n\"system\":{\"protagonist\":{\"personality\":\"주인공 성격\",\"speech\":\"말투\",\"secret\":\"숨기고 있는 것\",\"want\":\"원하는 것\"},\"characters\":[{\"name\":\"대화·연락처에 쓰는 이름 그대로\",\"role\":\"주인공과의 관계\",\"personality\":\"성격\",\"speech\":\"말투 특징\",\"secret\":\"비밀이나 메모\"}],\"relations\":[{\"a\":\"이름\",\"b\":\"이름\",\"desc\":\"두 사람의 관계\"}],\"world\":\"세계관·배경\",\"truth\":\"독자가 끝내 알아낼 숨겨진 진실\",\"rules\":\"이 이야기의 AI 답장 규칙\"}'+
  keys.map(function(k){return ',\n'+SECS[k].schema}).join('')+'}\n'+(keys.indexOf('threads')>=0?'말풍선 형식: '+ITEM_SCHEMA+'\n':'')+
  '\n분량: '+(keys.map(function(k){return AMOUNT[k]}).join(', ')||'owner와 scenario만')+'.';
}

/* ---------- theme ---------- */
var THEME_KEY='phone-theme',themePref='system',phoneScheme='light';
try{themePref=localStorage.getItem(THEME_KEY)||'system'}catch(e){}
var mq=window.matchMedia?matchMedia('(prefers-color-scheme: dark)'):null;
function applyTheme(){
  var dark=themePref==='dark'||(themePref==='system'&&mq&&mq.matches);
  if(themePref==='system')document.documentElement.removeAttribute('data-theme');else document.documentElement.setAttribute('data-theme',themePref);
  phoneScheme=dark?'dark':'light';
  if(phoneEl){phoneEl.dataset.scheme=phoneScheme;if(top())setTone(top().tone)}
  var cp=document.getElementById('cpv');if(cp)cp.classList.toggle('dark',dark);
  var m=document.querySelector('meta[name=theme-color]');if(m)m.setAttribute('content',dark?'#0f0e13':'#e9ebef');
}
if(mq&&mq.addEventListener)mq.addEventListener('change',function(){if(themePref==='system')applyTheme()});
function setTone(t){if(!phoneEl)return;phoneEl.dataset.tone=(phoneScheme==='dark'&&t==='dark')?'light':t}

/* ---------- back button (Android / browser history) ---------- */
var H=[],sentinel=false;
// One history entry stands for "something is open". Android/browser back closes the top layer,
// and re-arms the entry while more layers remain. In-app closes never call history.back(), so nothing can race.
function arm(){if(!sentinel){try{history.pushState({ph:1},'');sentinel=true}catch(e){}}}
function hpush(kind){H.push(kind);arm()}
function hback(kind){var i=H.lastIndexOf(kind);if(i>=0)H.splice(i,1);return false}
function hdropNav(){H=H.filter(function(k){return k!=='nav'})}
addEventListener('popstate',function(){
  sentinel=false;
  var k=H.pop();if(!k)return;
  if(k==='nav'){if(nav.length>1)pop()}
  else if(k==='ed')closeEditor(true);
  else if(k==='set')closeSettings(true);
  else if(k==='sheet')closeSheet(true);
  else if(k==='dlg')closeDlg(true);
  if(H.length)arm();
});

/* ---------- outer page ---------- */
var viewMode=false,canEdit=true,viewInfo=null;
/* player: someone who opened a published link. They only see and use the phone. */
var playerMode=false,playKey=null,pubStory=null,pubVer=0,playSaveT=null;
function savePlay(){if(!playerMode||!playKey)return;clearTimeout(playSaveT);playSaveT=setTimeout(function(){var d=JSON.parse(JSON.stringify(S));delete d.images;Store.set('play:'+playKey,{version:pubVer,story:d,at:Date.now()})},500)}
function playerRestart(){if(!pubStory)return;var d=JSON.parse(JSON.stringify(pubStory));d.id='pl-'+playKey;S=normalize(d);
  drafts={};typingFor={};replyBusy={};liveQueries=[];hiddenSearch={};pingBusy=false;baseThreads=null;
  resetClock();relock();clearTimeout(playSaveT);Store.del('play:'+playKey);closeSheet();renderSide();toast('처음부터 다시 시작했어요')}
function renderStatus(){
  var o=S.owner,low=o.battery<=20;
  $('#sb').innerHTML='<span class="sb-time">'+esc(phoneTime())+'</span><span class="island" data-a="island" title="상황 설명"></span><span class="sb-ic"><svg width="18" height="12" viewBox="0 0 18 12"><rect x="0" y="8" width="3" height="4" rx="1" fill="currentColor"/><rect x="5" y="5.5" width="3" height="6.5" rx="1" fill="currentColor"/><rect x="10" y="3" width="3" height="9" rx="1" fill="currentColor"/><rect x="15" y="0" width="3" height="12" rx="1" fill="currentColor" opacity=".35"/></svg><svg width="16" height="12" viewBox="0 0 16 12"><path d="M8 11.5L5.6 9a3.4 3.4 0 014.8 0zM3.6 7a6.2 6.2 0 018.8 0l-1.4 1.4a4.2 4.2 0 00-6 0zM1.2 4.6a9.6 9.6 0 0113.6 0l-1.4 1.4a7.6 7.6 0 00-10.8 0z" fill="currentColor"/></svg><span class="bat'+(low?' low':'')+'"><i style="width:'+o.battery+'%"></i><b>'+o.battery+'</b></span></span>';
}
function sideHtml(){
  var o=S.owner,sc=S.scenario;
  var by=viewMode&&viewInfo&&viewInfo.ownerName?' · 만든 사람 '+esc(viewInfo.ownerName):'';
  if(playerMode)return '<div class="eyebrow">Snoop</div><h1>'+esc(sc.title||(o.name+'의 폰'))+'</h1><p class="who">'+esc(o.name)+'의 휴대전화'+by+'</p>'+(sc.text?'<p class="story">'+esc(sc.text)+'</p>':'')+
    (keyAskable()?'<div class="keynote"><p class="enote">폰 속 인물들과 대화하려면 내 Gemini API 키가 필요해요.</p><button class="btn sm primary" data-s="keydlg">내 API 키 등록</button></div>':'')+
    '<div class="btns two"><button class="btn primary" data-s="settings">설정</button><button class="btn" data-s="relock">처음부터 다시 보기</button></div>';
  return '<div class="eyebrow">'+(viewMode?'공유받은 폰':'지금 보고 있는 폰')+'</div><h1>'+esc(sc.title||(o.name+'의 폰'))+'</h1><p class="who">'+esc(o.name)+'의 휴대전화 · 배터리 '+o.battery+'%'+by+'</p>'+
    (sc.text?'<p class="story">'+esc(sc.text)+'</p>':'')+
    '<div class="btns two">'+(viewMode?'<button class="btn primary" data-s="copy">이 폰 복사해서 꾸미기</button>':'<button class="btn primary" data-s="edit">폰 꾸미기</button>')+'<button class="btn" data-s="relock">처음부터 다시 시작</button></div>';
}
function renderSide(){if(!S||!S.scenario)return;var s=$('#side');if(s)s.innerHTML=sideHtml();var sh=$('#sheetIn');if(sh)sh.innerHTML='<span class="grab" aria-hidden="true"></span>'+sideHtml()}
function openInfo(){var b=document.body.classList;if(!b.contains('full')&&!b.contains('narrow')&&!b.contains('editing'))return;
  if($('#sheet'))return;var bg=document.createElement('div');bg.className='sheet-bg';bg.id='sheet';bg.innerHTML='<div class="sheet" id="sheetIn" role="dialog" aria-label="상황 설명"></div>';document.body.appendChild(bg);renderSide();hpush('sheet');
  bg.addEventListener('click',function(e){if(e.target===bg)closeSheet()})}
function closeSheet(fromHist){var s=$('#sheet');if(!s)return;if(!fromHist&&hback('sheet'))return;s.remove()}
function layout(){
  var W=innerWidth,Hh=innerHeight,touch=navigator.maxTouchPoints>1&&!!(window.matchMedia&&matchMedia('(any-pointer:coarse)').matches),full=W<=520||touch,editing=!$('#ed').hidden,narrow=!full&&W<940;
  document.body.classList.toggle('full',full);document.body.classList.toggle('narrow',narrow);document.body.classList.toggle('editing',editing);
  var dev=$('#device'),wrap=$('#devwrap');
  if(full){dev.style.transform='';wrap.style.width='';wrap.style.height='';$('#stage').style.paddingRight='';return}
  if(editing&&narrow)return;
  var side=narrow?0:(editing?490:390);
  var s=Math.max(.4,Math.min(1,(Hh-40)/868,(W-side-40)/414));
  dev.style.transform='scale('+s+')';wrap.style.width=(414*s)+'px';wrap.style.height=(868*s)+'px';
  $('#stage').style.paddingRight=(editing&&!narrow)?'480px':'';
}

/* ---------- local storage: IndexedDB (falls back to localStorage) ---------- */
var Store={
  db:null,
  open:function(){var self=this;if(self.db)return Promise.resolve(self.db);return new Promise(function(res,rej){try{var r=indexedDB.open('phone-web',1);r.onupgradeneeded=function(){r.result.createObjectStore('kv')};r.onsuccess=function(){self.db=r.result;res(r.result)};r.onerror=function(){rej(r.error)}}catch(e){rej(e)}})},
  get:function(k){return this.open().then(function(db){return new Promise(function(res,rej){var q=db.transaction('kv').objectStore('kv').get(k);q.onsuccess=function(){res(q.result)};q.onerror=function(){rej(q.error)}})}).catch(function(){try{return JSON.parse(localStorage.getItem('phone-'+k)||'null')}catch(e){return null}})},
  set:function(k,v){return this.open().then(function(db){return new Promise(function(res,rej){var tx=db.transaction('kv','readwrite');tx.objectStore('kv').put(v,k);tx.oncomplete=function(){res()};tx.onerror=function(){rej(tx.error)}})}).catch(function(){localStorage.setItem('phone-'+k,JSON.stringify(v))})},
  del:function(k){return this.open().then(function(db){return new Promise(function(res){var tx=db.transaction('kv','readwrite');tx.objectStore('kv').delete(k);tx.oncomplete=function(){res()};tx.onerror=function(){res()}})}).catch(function(){try{localStorage.removeItem('phone-'+k)}catch(e){}})},
  clear:function(){return this.open().then(function(db){return new Promise(function(res){var tx=db.transaction('kv','readwrite');tx.objectStore('kv').clear();tx.oncomplete=function(){res()};tx.onerror=function(){res()}})}).catch(function(){})}
};
function newId(){return (Date.now().toString(36)+uid()+uid()).slice(0,20)}
function todayStr(){var d=new Date();return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0')}
function usedImagesOf(s){var u={};function add(id){if(id&&s.images[id])u[id]=s.images[id]}
  add(s.owner.avatar);add(s.owner.wallImg);s.threads.forEach(function(t){add(t.avatar);t.items.forEach(function(it){add(it.img)})});s.gallery.forEach(function(g){add(g.img)});return u}
function snapshotOf(s){var d=JSON.parse(JSON.stringify(s));d.images=usedImagesOf(s);return d}
function snapshot(){return snapshotOf(S)}
function metaOf(s){return {id:s.id,title:s.scenario.title||(s.owner.name+'의 폰'),name:s.owner.name,wall:s.owner.wall,concept:s.concept||'',updatedAt:s.savedAt||Date.now(),threads:s.threads.length,photos:s.gallery.length}}
var Lib={metas:[],
  load:function(){return Store.get('lib').then(function(a){Lib.metas=arr(a);return Lib.metas})},
  put:function(s){var m=metaOf(s);Lib.metas=Lib.metas.filter(function(x){return x.id!==s.id});Lib.metas.unshift(m);return Promise.all([Store.set('story:'+s.id,snapshotOf(s)),Store.set('lib',Lib.metas)])},
  get:function(id){return Store.get('story:'+id)},
  has:function(id){return Lib.metas.some(function(x){return x.id===id})},
  del:function(id){Lib.metas=Lib.metas.filter(function(x){return x.id!==id});return Promise.all([Store.del('story:'+id),Store.set('lib',Lib.metas)])}
};
function setCur(id){try{localStorage.setItem('phone-cur',id)}catch(e){}}
function getCur(){try{return localStorage.getItem('phone-cur')}catch(e){return null}}
var phoneT,storeT,savedAt=null,saveFail=false,cloudT,cloudAt=null,cloudErr='';
var edDirty=false;
function updateEdGo(){var b=$('#edGo');if(!b)return;b.textContent=edDirty?'처음부터 시작':'닫기';b.dataset.e=edDirty?'close':'leave';b.classList.toggle('primary',edDirty)}
function markChanged(noPhone){
  if(!canEdit){savePlay();return}if(!$('#ed').hidden&&!edDirty){edDirty=true;updateEdGo()}
  clearTimeout(storeT);storeT=setTimeout(saveLocal,700);
  if(!noPhone&&!draftMode){clearTimeout(phoneT);phoneT=setTimeout(function(){rebuild();renderSide()},220)}
}
function saveLocal(){
  if(!canEdit)return Promise.resolve();
  S.savedAt=Date.now();
  return Lib.put(S).then(function(){savedAt=new Date();saveFail=false;updateFoot();if(Cloud.user)scheduleCloud()},function(){saveFail=true;updateFoot()});
}
var forking=false;
function forkForAccount(){var old=S.id;if(!canEdit||viewMode||!old)return;
  var nid=newId();return Lib.del(old).then(function(){S.id=nid;setCur(nid);if(baseThreads)Store.set('base:'+nid,{threads:baseThreads});cloudErr='';cloudAt=null;return saveLocal()})}
function scheduleCloud(){clearTimeout(cloudT);cloudT=setTimeout(function(){var sid=S.id;Cloud.push(snapshot()).then(function(){cloudAt=new Date();cloudErr='';updateFoot()},function(e){
  if(e&&(e.code==='permission-denied'||e.code==='not_owner')&&sid===S.id&&!forking){forking=true;var p=forkForAccount();if(p){p.then(function(){forking=false},function(){forking=false});return}forking=false}
  cloudErr=fbMsg(e);updateFoot()})},5000)}
function switchTo(data,opts){
  clearTimeout(storeT);
  if(draftMode){draftMode=false;playS=null;playBase=null;setDraftUi()}edDirty=false;
  if(!$('#ed').hidden){forceClose=true;closeEditor();forceClose=false}
  S=normalize(JSON.parse(JSON.stringify(data)));if(!S.id)S.id=newId();baseThreads=null;loadBase();
  setCur(S.id);edThread=null;fillSel=null;
  relock();renderStatus();renderSide();
  if(!(opts&&opts.noSave))return saveLocal();return Promise.resolve();
}
function blankStory(){return {id:newId(),owner:{name:'새 주인공',status:'',wall:'night',time:'23:30',date:todayStr(),battery:64,pass:'',hint:''},scenario:{title:'',text:'',cast:''},threads:[],friends:[],contacts:[],gallery:[],search:[],memos:[],calls:[],events:[],images:{}}}
function exampleStory(){var d=JSON.parse(JSON.stringify(window.PHONE_EXAMPLE||blankStory()));d.id=newId();return d}
/* the example comes from a published phone (config.js examplePlay), so re-publishing that phone updates the example.
   Falls back to the built-in example when offline or not set. */
function exampleStoryAsync(){var pid=CFG.examplePlay;if(!pid||!Cloud.cfg())return Promise.resolve(exampleStory());
  var t=new Promise(function(_,rej){setTimeout(function(){rej({code:'timeout'})},7000)});
  return Promise.race([Cloud.init().then(function(ok){if(!ok)throw {code:'unavailable'};return Cloud.fetchPlay(pid)}),t])
    .then(function(r){var d=JSON.parse(JSON.stringify(r.story));d.id=newId();delete d.savedAt;return d},function(){return exampleStory()})}
function download(name,text){
  if(window.PHONE_SAVE_FILE)return window.PHONE_SAVE_FILE(name,text);
  var a=document.createElement('a');a.href=URL.createObjectURL(new Blob([text],{type:'application/json'}));a.download=name;document.body.appendChild(a);a.click();
  setTimeout(function(){URL.revokeObjectURL(a.href);a.remove()},1500);return Promise.resolve();
}
function exportStory(){var d=new Date(),p=function(x){return String(x).padStart(2,'0')};
  download('phone-story-'+d.getFullYear()+p(d.getMonth()+1)+p(d.getDate())+'-'+p(d.getHours())+p(d.getMinutes())+'.json',JSON.stringify(snapshot())).then(function(){flash('파일로 내보냈어요.')},function(){flash('파일을 저장하지 못했어요.',true)})}
function importStory(file){var fr=new FileReader();fr.onload=function(){try{var d=JSON.parse(fr.result);if(!d||typeof d!=='object'||!d.owner)throw 0;d.id=newId();saveLocal();switchTo(d).then(function(){renderSettings();renderEditor();flash('불러온 폰을 목록에 추가했어요.')})}catch(e){flash('이 파일은 폰 이야기 파일이 아니에요.',true)}};fr.readAsText(file)}

/* ---------- cloud: Firebase (Google login, save, share) ---------- */
function loadScript(src){return new Promise(function(res,rej){var s=document.createElement('script');s.src=src;s.onload=res;s.onerror=rej;document.head.appendChild(s)})}
function fbMsg(e){var c=e&&e.code||'';
  return {login:'먼저 Google로 로그인해 주세요.','auth/popup-closed-by-user':'로그인 창이 닫혔어요.','auth/cancelled-popup-request':'로그인 창이 닫혔어요.','auth/unauthorized-domain':'이 사이트 주소가 Firebase 승인 도메인에 없어요. README의 로그인 설정을 확인해 주세요.',
    'auth/network-request-failed':'인터넷 연결을 확인해 주세요.','permission-denied':'권한이 없어요. Firestore 보안 규칙을 확인해 주세요.',not_owner:'다른 사람이 만든 폰이라 내 계정에 덮어쓸 수 없어요.',not_found:'공유된 폰을 찾을 수 없어요. 링크가 맞는지, 공유가 꺼지지 않았는지 확인해 주세요.',
    too_big:'이 폰은 너무 커서 저장할 수 없어요. 대화나 사진 수를 줄여 주세요.',unavailable:'서버에 연결하지 못했어요. 잠시 뒤에 다시 해 주세요.'}[c]||(e&&e.message?String(e.message).slice(0,160):'문제가 생겼어요.')}
var Cloud={on:false,ready:false,user:null,err:'',
  cfg:function(){return CFG.firebase&&CFG.firebase.apiKey&&CFG.firebase.projectId?CFG.firebase:null},
  init:function(){if(this._initP)return this._initP;return this._initP=this._init()},
  _init:function(){
    var c=this.cfg(),self=this;if(!c){self.ready=true;return Promise.resolve(false)}
    var base='https://www.gstatic.com/firebasejs/'+(CFG.firebaseVersion||'10.14.1')+'/';
    return loadScript(base+'firebase-app-compat.js').then(function(){return loadScript(base+'firebase-auth-compat.js')}).then(function(){return loadScript(base+'firebase-firestore-compat.js')}).then(function(){
      firebase.initializeApp(c);self.auth=firebase.auth();self.db=firebase.firestore();self.on=true;
      self.auth.getRedirectResult().catch(function(e){self.err=fbMsg(e);renderSettings()});
      return new Promise(function(res){var first=true;self.auth.onAuthStateChanged(function(u){self.user=u;self.ready=true;if(first){first=false;res(true)}onAuthChange()})});
    }).catch(function(){self.ready=true;self.err='로그인 기능을 불러오지 못했어요. 인터넷 연결을 확인해 주세요.';return false});
  },
  signIn:function(){var self=this,p=new firebase.auth.GoogleAuthProvider();p.setCustomParameters({prompt:'select_account'});
    return self.auth.signInWithPopup(p).catch(function(e){if(e&&(e.code==='auth/popup-blocked'||e.code==='auth/operation-not-supported-in-this-environment'))return self.auth.signInWithRedirect(p);throw e})},
  signOut:function(){return this.auth.signOut()},
  ref:function(id){return this.db.collection('stories').doc(id)},
  push:function(story){
    var self=this,u=self.user;if(!u)return Promise.reject({code:'login'});
    var data=JSON.parse(JSON.stringify(story)),imgs=data.images||{};delete data.images;
    var json=JSON.stringify(data);if(json.length>900000)return Promise.reject({code:'too_big'});
    var ref=self.ref(story.id),FV=firebase.firestore.FieldValue,ids=Object.keys(imgs);
    return ref.get().then(function(snap){
      if(snap.exists&&snap.data().owner!==u.uid)throw {code:'not_owner'};
      var prev=snap.exists?arr(snap.data().imageIds):[];
      var keep=prev.filter(function(id){return ids.indexOf(id)>=0});
      var doc={owner:u.uid,ownerName:u.displayName||'',title:data.scenario.title||(data.owner.name+'의 폰'),name:data.owner.name,summary:str(data.scenario.text).slice(0,160),wall:data.owner.wall,concept:str(data.concept).slice(0,300),data:json,imageIds:keep,updatedAt:FV.serverTimestamp()};
      if(!snap.exists){doc.public=false;doc.listed=false;doc.createdAt=FV.serverTimestamp()}
      return ref.set(doc,{merge:true}).then(function(){
        var add=ids.filter(function(id){return prev.indexOf(id)<0}),del=prev.filter(function(id){return ids.indexOf(id)<0});
        return add.reduce(function(p,id){return p.then(function(){return ref.collection('images').doc(id).set({d:imgs[id]})})},Promise.resolve())
          .then(function(){return Promise.all(del.map(function(id){return ref.collection('images').doc(id).delete()}))})
          .then(function(){return ref.update({imageIds:ids})});
      });
    });
  },
  fetch:function(id){var ref=this.ref(id);
    return ref.get().then(function(snap){if(!snap.exists)throw {code:'not_found'};var d=snap.data(),story=JSON.parse(d.data);story.id=id;story.images={};
      return ref.collection('images').get().then(function(qs){qs.forEach(function(doc){story.images[doc.id]=doc.data().d});return {story:story,info:{public:!!d.public,listed:!!d.listed,owner:d.owner,ownerName:d.ownerName||''}}})})
    .catch(function(e){if(e&&e.code==='permission-denied')throw {code:'not_found'};throw e})},
  metaFrom:function(doc){var d=doc.data(),t=d.updatedAt&&d.updatedAt.toMillis?d.updatedAt.toMillis():Date.now();return {id:doc.id,title:d.title,name:d.name,wall:d.wall,concept:d.concept||'',summary:d.summary||'',ownerName:d.ownerName||'',public:!!d.public,listed:!!d.listed,updatedAt:t}},
  listMine:function(){var self=this;if(!self.user)return Promise.resolve([]);return self.db.collection('stories').where('owner','==',self.user.uid).get().then(function(qs){var a=[];qs.forEach(function(d){a.push(self.metaFrom(d))});return a})},
  explore:function(){var self=this;return self.db.collection('plays').where('listed','==',true).limit(60).get().then(function(qs){var a=[];qs.forEach(function(d){a.push(self.playMeta(d))});return a.sort(function(x,y){return y.updatedAt-x.updatedAt})})},
  setShare:function(id,patch){return this.ref(id).update(patch)},
  /* published copies that players open with ?play=<id> */
  playRef:function(id){return this.db.collection('plays').doc(id)},
  publish:function(story){
    var self=this,u=self.user;if(!u)return Promise.reject({code:'login'});
    var data=JSON.parse(JSON.stringify(story)),imgs=data.images||{};delete data.images;delete data.savedAt;
    data.threads=stripLive(data.threads).map(function(t){delete t.lv;t.items.forEach(function(i){delete i.lv});return t});
    var json=JSON.stringify(data);if(json.length>900000)return Promise.reject({code:'too_big'});
    var ref=self.playRef(story.id),FV=firebase.firestore.FieldValue,ids=Object.keys(imgs),ver=Date.now();
    return ref.get().then(function(snap){
      if(snap.exists&&snap.data().owner!==u.uid)throw {code:'not_owner'};
      var prev=snap.exists?arr(snap.data().imageIds):[];
      var keep=prev.filter(function(id){return ids.indexOf(id)>=0});
      var doc={owner:u.uid,ownerName:u.displayName||'',ownerEmail:u.email||'',title:data.scenario.title||(data.owner.name+'의 폰'),name:data.owner.name,summary:str(data.scenario.text).slice(0,160),wall:data.owner.wall,data:json,imageIds:keep,version:ver,updatedAt:FV.serverTimestamp()};
      if(!snap.exists){doc.listed=false;doc.createdAt=FV.serverTimestamp()}
      return ref.set(doc,{merge:true}).then(function(){
        var add=ids.filter(function(id){return prev.indexOf(id)<0}),del=prev.filter(function(id){return ids.indexOf(id)<0});
        return add.reduce(function(p,id){return p.then(function(){return ref.collection('images').doc(id).set({d:imgs[id]})})},Promise.resolve())
          .then(function(){return Promise.all(del.map(function(id){return ref.collection('images').doc(id).delete()}))})
          .then(function(){return ref.update({imageIds:ids})});
      }).then(function(){return ver});
    });
  },
  unpublish:function(id){var ref=this.playRef(id);return ref.collection('images').get().then(function(qs){var ps=[];qs.forEach(function(d){ps.push(d.ref.delete())});return Promise.all(ps)}).then(function(){return ref.delete()})},
  fetchPlay:function(id){var ref=this.playRef(id);
    return ref.get().then(function(snap){if(!snap.exists)throw {code:'not_found'};var d=snap.data(),story=JSON.parse(d.data);story.images={};
      return ref.collection('images').get().then(function(qs){qs.forEach(function(doc){story.images[doc.id]=doc.data().d});return {story:story,info:{version:d.version||0,owner:d.owner,ownerName:d.ownerName||'',listed:!!d.listed}}})})
    .catch(function(e){if(e&&e.code==='permission-denied')throw {code:'not_found'};throw e})},
  playMeta:function(doc){var d=doc.data(),t=d.updatedAt&&d.updatedAt.toMillis?d.updatedAt.toMillis():(d.version||Date.now());return {id:doc.id,title:d.title||'제목 없음',name:d.name||'',wall:d.wall,summary:d.summary||'',ownerName:d.ownerName||'',ownerEmail:d.ownerEmail||'',owner:d.owner,listed:!!d.listed,updatedAt:t,version:d.version||0}},
  listMyPlays:function(){var self=this;if(!self.user)return Promise.resolve([]);return self.db.collection('plays').where('owner','==',self.user.uid).get().then(function(qs){var a=[];qs.forEach(function(d){a.push(self.playMeta(d))});return a})},
  listAllPlays:function(){var self=this;return self.db.collection('plays').limit(500).get().then(function(qs){var a=[];qs.forEach(function(d){a.push(self.playMeta(d))});return a.sort(function(x,y){return y.updatedAt-x.updatedAt})})},
  setPlay:function(id,patch){return this.playRef(id).update(patch)},
  remove:function(id){var ref=this.ref(id);return ref.collection('images').get().then(function(qs){var ps=[];qs.forEach(function(d){ps.push(d.ref.delete())});return Promise.all(ps)}).then(function(){return ref.delete()})},
  userRef:function(){return this.user?this.db.collection('users').doc(this.user.uid):null},
  saveKey:function(k){var r=this.userRef();if(!r)return Promise.resolve();return r.set({geminiKey:k||'',keyAt:Date.now()},{merge:true})},
  loadKey:function(){var r=this.userRef();if(!r)return Promise.resolve(null);return r.get().then(function(d){return d.exists?(d.data().geminiKey||''):null})},
  deleteAccount:function(){var self=this,u=self.user;
    return (self.userRef()?self.userRef().delete().catch(function(){}):Promise.resolve()).then(function(){return self.listMine()}).then(function(ms){return ms.reduce(function(p,m){return p.then(function(){return self.remove(m.id)})},Promise.resolve())})
      .then(function(){return self.listMyPlays()}).then(function(ps){return ps.reduce(function(p,m){return p.then(function(){return self.unpublish(m.id)})},Promise.resolve())})
      .then(function(){return u.delete().catch(function(e){if(e&&e.code==='auth/requires-recent-login')return u.reauthenticateWithPopup(new firebase.auth.GoogleAuthProvider()).then(function(){return u.delete()});throw e})})}
};
var publishing=null;
function openShare(id){shareOpen=id;
  if(!(Cloud.cfg()&&Cloud.user)){renderSettings();return}
  function go(){if(shareOpen!==id)return;if(myPlays&&myPlays[id])renderSettings();else A_publish(id)}
  if(myPlays){go();return}
  renderSettings();
  Cloud.listMyPlays().then(function(a){myPlays={};a.forEach(function(m){myPlays[m.id]=m});go()},function(){myPlays={};go()})}
function A_publish(id){if(publishing)return;publishing=id;renderSettings();
  var src=id===S.id?saveLocal().then(function(){return snapshot()}):Lib.get(id);
  src.then(function(data){if(!data)throw {code:'not_found'};return Cloud.publish(normalize(data))}).then(function(ver){
    publishing=null;myPlays=myPlays||{};var old=myPlays[id]||{};
    myPlays[id]=Object.assign({},old,{id:id,listed:!!old.listed,version:ver,updatedAt:Date.now()});
    shareOpen=id;renderSettings();flashSet('배포했어요. 아래 링크를 복사해서 보내 주세요.')},
  function(e){publishing=null;renderSettings();flashSet(fbMsg(e))})}
var cloudList=null,exploreList=null,myPlays=null,allPlays=null,armSup=null;
function onAuthChange(){cloudList=null;renderSettings();renderSide();updateFoot();keyFromCloud();if(Cloud.user&&!viewMode){scheduleCloud();refreshCloudList()}}
function refreshCloudList(){if(!Cloud.user){cloudList=null;myPlays=null;return}Cloud.listMine().then(function(a){cloudList=a;renderSettings()},function(e){cloudErr=fbMsg(e);renderSettings()});
  Cloud.listMyPlays().then(function(a){myPlays={};a.forEach(function(m){myPlays[m.id]=m});renderSettings()},function(){myPlays={}})}
function isSuper(){var u=Cloud.user;return !!(u&&u.email&&arr(CFG.superAdmins).map(function(x){return String(x).toLowerCase()}).indexOf(String(u.email).toLowerCase())>=0)}
function playUrl(id){return (CFG.playBase||(location.origin+location.pathname))+'?play='+encodeURIComponent(id)}
function shareUrl(id){return location.origin+location.pathname+'?p='+encodeURIComponent(id)}

/* ---------- editor ---------- */
var edTab='ai',edThread=null,aiDraft={concept:'',owner:'',moods:[]},delArm=null,upTarget=null,upKind='img';
var armRegen=null,fillSel=null,genSel=null,busy=null,stopFlag=false,aiProg=0,progT=null,noteMsg='',noteErr=false,noteT=null,aiTestMsg='';
var LOCK='<svg viewBox="0 0 24 24" width="13" height="13" style="display:inline-block;vertical-align:-1px;margin-right:4px" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 018 0v3"/></svg>';
var TABS=[['ai','✦ AI'],['basic','기본'],['chats','대화·연락처'],['photos','사진'],['rec','기록'],['sys',LOCK+'시스템']];
function flash(msg,err){noteMsg=msg;noteErr=!!err;updateFoot();clearTimeout(noteT);noteT=setTimeout(function(){noteMsg='';updateFoot()},err?9000:6000)}
function openEditor(tab){if(!canEdit)return;if(tab)edTab=tab;closeSheet();closeSettings();if($('#ed').hidden){$('#ed').hidden=false;hpush('ed');edDirty=false}beginDraft();updateEdGo();setDraftUi();layout();renderEditor()}
function closeEditor(fromHist){if($('#ed').hidden)return;if(draftMode&&!forceClose&&!edDirty){endDraft(false)}
  if(draftMode&&!forceClose){if(fromHist){H.push('ed');arm()}askLeave();return}if(!fromHist&&hback('ed'))return;$('#ed').hidden=true;layout()}
function busyHtml(){return busy?'<div class="banner" role="status"><b>'+esc(busy.label)+'</b><div class="prog"><i id="busyProg" style="width:'+Math.max(5,aiProg)+'%"></i></div>'+(busy.stoppable?'<span class="btns"><button class="btn sm ghost" data-e="stop">멈추기</button></span>':'<span style="font-size:12.5px;color:var(--muted)">보통 20초~1분 걸려요. 다른 탭을 둘러봐도 돼요.</span>')+'</div>':''}
function renderEditor(){
  if($('#ed').hidden)return;
  $('#edTabs').innerHTML=TABS.map(function(t){return '<button class="ed-tab'+(t[0]===edTab?' on':'')+'" data-e="tab" data-tab="'+t[0]+'">'+t[1]+'</button>'}).join('');
  var b=$('#edBody'),st=b.scrollTop;b.innerHTML=busyHtml()+ED[edTab]();b.scrollTop=st;
  b.querySelectorAll('[data-ai]').forEach(function(x){x.disabled=!!busy});
  updateFoot();
}
function startProg(){aiProg=4;clearInterval(progT);progT=setInterval(function(){aiProg=Math.min(93,aiProg+(93-aiProg)*.045);var p=$('#busyProg');if(p)p.style.width=aiProg+'%'},500)}
function stopProg(){clearInterval(progT)}
function needAI(){if(aiMode())return true;if(keyAskable())openKeyDlg();else{flash(aiErrMsg({code:'no_ai'}),true);openSettings('ai')}return false}
function F(label,inner,help){return '<label class="fl"><span>'+label+'</span>'+inner+(help?'<small>'+help+'</small>':'')+'</label>'}
function inp(path,ph,extra){return '<input data-f="'+path+'" value="'+esc(getPath(S,path))+'" placeholder="'+esc(ph||'')+'"'+(extra||'')+'>'}
function ta(path,ph,rows){return '<textarea data-f="'+path+'" rows="'+(rows||3)+'" placeholder="'+esc(ph||'')+'">'+esc(getPath(S,path))+'</textarea>'}
function thumb(id,round){var src=id&&S.images[id];return '<span class="thumb'+(round?' r':'')+'" style="'+(src?'background-image:url('+src+')':'')+'"></span>'}
function aiBtn(e,label,attrs,primary){return '<button class="btn sm'+(primary?' primary':'')+'" data-ai="1" data-e="'+e+'"'+(attrs||'')+'>✦ '+label+'</button>'}
function regenBtn(k,count,label){var armed=armRegen===k;return '<div class="row">'+aiBtn('regen',armed?'한 번 더 누르면 지금 내용이 바뀌어요':(count?'AI로 다시 만들기':'AI로 만들기'),' data-k="'+k+'"'+(armed?' data-armed="1"':''))+(label?'<span class="enote">'+label+'</span>':'')+'</div>'}
function optsHtml(sel,group){
  return '<div class="row between"><h4>만들 항목</h4><span class="row"><button class="link" data-e="selAll" data-g="'+group+'">모두 선택</button><button class="link" data-e="selNone" data-g="'+group+'">모두 해제</button></span></div>'+
    '<div class="opts">'+Object.keys(SECS).map(function(k){var c=SECS[k].count();return '<button class="opt'+(sel[k]?' on':'')+'" data-e="opt" data-g="'+group+'" data-k="'+k+'" aria-pressed="'+(sel[k]?'true':'false')+'"><span class="bx"><svg viewBox="0 0 16 16" width="13" height="13" aria-hidden="true"><path d="M3.5 8.4l2.9 2.9 6.1-6.6" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round"/></svg></span><span>'+SECS[k].label+'<small>'+(group==='fill'?(c?'지금 '+c+'개':'비어 있음'):AMOUNT[k].split('(')[0])+'</small></span></button>'}).join('')+'</div>';
}
var ED={};
ED.ai=function(){
  if(!genSel){genSel={};Object.keys(SECS).forEach(function(k){genSel[k]=true})}
  var st=aiMode()?'<span class="status-dot on">AI 연결됨 · '+esc(aiMode()==='preview'?'미리보기':aiMode()==='proxy'?'사이트 서버':textModel())+'</span>':'<span class="status-dot">AI가 아직 연결되지 않았어요</span>';
  return '<div class="row between">'+st+'<button class="btn sm" data-e="openSet" data-sec="ai">AI · API 설정</button></div>'+
    '<div class="sec"><h3>컨셉으로 새 폰 만들기</h3><p class="enote">새 폰이 하나 더 생기고, 지금 폰은 설정 › 내 폰 목록에 남아요. 이미 만든 내용을 바꾸고 싶으면 각 탭의 항목 아래 ✦ AI로 다시 만들기를 누르세요.</p>'+
      F('컨셉','<textarea id="aiConcept" rows="4" placeholder="예) 같은 팀 신입(나)과 몰래 사귀는 팀장님의 폰">'+esc(aiDraft.concept)+'</textarea>')+
      F('폰 주인 이름','<input id="aiOwner" placeholder="(선택)" value="'+esc(aiDraft.owner)+'">')+
      '<div class="fl"><span>분위기</span><div class="chips">'+MOODS.map(function(m){return '<button class="chip'+(aiDraft.moods.indexOf(m)>=0?' on':'')+'" data-e="mood" data-m="'+m+'" aria-pressed="'+(aiDraft.moods.indexOf(m)>=0)+'">'+m+'</button>'}).join('')+'</div></div>'+
      optsHtml(genSel,'gen')+'<div class="row">'+aiBtn('aiGo','새 폰 만들기','',true)+'</div></div>';
};
ED.basic=function(){
  var o=S.owner,sc=S.scenario;
  return '<div class="sec"><h3>폰 주인</h3><div class="row">'+thumb(o.avatar,true)+'<button class="btn sm" data-e="upload" data-target="owner.avatar" data-size="360">프로필 사진</button>'+(o.avatar?'<button class="btn sm ghost" data-e="clear" data-path="owner.avatar">지우기</button>':'')+'</div>'+
      '<div class="g2">'+F('이름',inp('owner.name','이름'))+F('톡 상태메시지',inp('owner.status','(선택)'))+'</div></div>'+
    '<div class="sec"><h3>이야기</h3>'+F('제목',inp('scenario.title','(선택)'))+F('상황 소개',ta('scenario.text','(선택)',4))+
      regenBtn('scenario',(sc.title||sc.text)?1:0)+'</div>'+
    '<div class="sec"><h3>화면</h3><div class="g3">'+F('날짜','<input type="date" data-f="owner.date" value="'+esc(o.date)+'">')+F('시각',inp('owner.time','00:46',' inputmode="numeric"'))+F('배터리 %',inp('owner.battery','42',' inputmode="numeric" data-num="1"'))+'</div><div class="row" style="margin-top:8px"><button class="btn sm" data-e="syncTimes">대화 시각 맞추기</button><small class="enote">시각은 바꿨는데 대화 시각이 그대로일 때, 대화가 원래 맞춰져 있던 시각을 알려 주면 지금 시각에 맞게 옮겨요.</small></div>'+
      '<div class="g2">'+F('잠금 비밀번호',inp('owner.pass','(선택) 숫자 4~6자리',' inputmode="numeric" data-pass="1"'))+F('비밀번호 힌트',inp('owner.hint','(선택)'))+'</div>'+
      '<div class="fl"><span>배경화면</span><div class="sw">'+Object.keys(WALLS).map(function(k){return '<button data-e="wall" data-w="'+k+'" class="'+(!o.wallImg&&o.wall===k?'on':'')+'" style="background:'+WALLS[k]+'" aria-label="배경 '+k+'"></button>'}).join('')+'</div></div>'+
      '<div class="row">'+(o.wallImg?thumb(o.wallImg):'')+'<button class="btn sm" data-e="upload" data-target="owner.wallImg" data-size="1200">사진으로 바꾸기</button>'+(o.wallImg?'<button class="btn sm ghost" data-e="clear" data-path="owner.wallImg">지우기</button>':'')+'</div></div>';
};
/* list-entry editors: add with Enter, each item has its own X */
var LISTS={
  search:{title:'검색 기록',adder:function(){return '<div class="adder one" data-add="search"><input id="add_search" placeholder="검색어" enterkeyhint="done" autocomplete="off"><button class="btn sm primary" data-e="add" data-k="search">추가</button></div>'},
    rows:function(){return S.search.map(function(q,i){return '<div class="lrow"><div class="main"><input data-f="search.'+i+'" value="'+esc(q)+'" aria-label="검색어"></div><button class="x" data-e="del" data-k="search" data-i="'+i+'" aria-label="삭제">✕</button></div>'}).join('')},
    add:function(){var v=$('#add_search').value.trim();if(!v)return false;S.search.unshift(v);$('#add_search').value='';return true}},
  events:{title:'일정',adder:function(){return '<div class="adder ev" data-add="events"><input type="date" id="add_edate" value="'+esc(S.owner.date)+'"><input id="add_etitle" placeholder="일정 이름" enterkeyhint="done" autocomplete="off"><button class="btn sm primary" data-e="add" data-k="events">추가</button></div>'},
    rows:function(){return S.events.map(function(e,i){return '<div class="lrow"><div class="main"><input type="date" data-f="events.'+i+'.d" value="'+esc(e.d)+'" style="flex:0 1 160px" aria-label="날짜"><input data-f="events.'+i+'.t" value="'+esc(e.t)+'" style="flex:1 1 120px" aria-label="일정 이름"></div><button class="x" data-e="del" data-k="events" data-i="'+i+'" aria-label="삭제">✕</button></div>'}).join('')},
    add:function(){var d=$('#add_edate').value,t=$('#add_etitle').value.trim();if(!t||!/^\d{4}-\d{2}-\d{2}$/.test(d)){flash('날짜와 일정 이름을 넣어 주세요.',true);return false}S.events.push({d:d,t:t});S.events.sort(function(a,b){return a.d<b.d?-1:a.d>b.d?1:0});$('#add_etitle').value='';return true}},
  calls:{title:'통화 기록',adder:function(){return '<div class="adder calls" data-add="calls"><input id="add_cname" placeholder="이름" autocomplete="off"><select id="add_ctype" aria-label="종류"><option value="missed">부재중</option><option value="in">수신</option><option value="out">발신</option></select><label class="cnt-in"><input id="add_ccount" value="1" inputmode="numeric" aria-label="횟수"><span>회</span></label><input id="add_ctime" placeholder="시각 (선택)" enterkeyhint="done"><button class="btn sm primary" data-e="add" data-k="calls">추가</button></div>'},
    rows:function(){return S.calls.map(function(c,i){return '<div class="lrow call"><div class="main"><input data-f="calls.'+i+'.name" value="'+esc(c.name)+'" aria-label="이름"><select data-f="calls.'+i+'.type" aria-label="종류">'+[['missed','부재중'],['in','수신'],['out','발신']].map(function(o){return '<option value="'+o[0]+'"'+(c.type===o[0]?' selected':'')+'>'+o[1]+'</option>'}).join('')+'</select><label class="cnt-in"><input data-f="calls.'+i+'.count" value="'+c.count+'" data-num="1" inputmode="numeric" aria-label="횟수"><span>회</span></label><input class="ctime" data-f="calls.'+i+'.time" value="'+esc(c.time)+'" placeholder="시각" aria-label="시각"></div><button class="x" data-e="del" data-k="calls" data-i="'+i+'" aria-label="삭제">✕</button></div>'}).join('')},
    add:function(){var n=$('#add_cname').value.trim();if(!n){flash('이름을 넣어 주세요.',true);return false}S.calls.unshift({name:n,type:$('#add_ctype').value,time:$('#add_ctime').value.trim()||'방금',count:Math.max(1,parseInt($('#add_ccount').value,10)||1)});$('#add_ccount').value='1';$('#add_cname').value='';$('#add_ctime').value='';return true}},
  memos:{title:'메모',adder:function(){return '<div class="adder one" data-add="memos"><input id="add_mtitle" placeholder="새 메모 제목" enterkeyhint="done" autocomplete="off"><button class="btn sm primary" data-e="add" data-k="memos">추가</button></div>'},
    rows:function(){return S.memos.map(function(m,i){return '<div class="mcard"><div class="top"><input data-f="memos.'+i+'.title" value="'+esc(m.title)+'" placeholder="제목" aria-label="메모 제목"><input data-f="memos.'+i+'.date" value="'+esc(m.date)+'" placeholder="날짜" aria-label="메모 날짜"><button class="x" data-e="del" data-k="memos" data-i="'+i+'" aria-label="삭제">✕</button></div><textarea data-f="memos.'+i+'.body" rows="4" placeholder="내용">'+esc(m.body)+'</textarea></div>'}).join('')},
    add:function(){var v=$('#add_mtitle').value.trim();if(!v)return false;S.memos.unshift({title:v,date:nowLabel(),body:''});$('#add_mtitle').value='';return true}},
  contacts:{title:'전화번호부',adder:function(){return '<div class="adder two" data-add="contacts"><input id="add_pname" placeholder="이름" autocomplete="off"><input id="add_pnum" placeholder="전화번호 (선택)" inputmode="tel" enterkeyhint="done" autocomplete="off"><button class="btn sm primary" data-e="add" data-k="contacts">추가</button></div>'},
    rows:function(){return S.contacts.map(function(c,i){return '<div class="lrow"><div class="main"><input data-f="contacts.'+i+'.name" value="'+esc(c.name)+'" style="flex:1 1 90px;font-weight:600" aria-label="이름"><input data-f="contacts.'+i+'.phone" value="'+esc(c.phone)+'" placeholder="번호" inputmode="tel" style="flex:1 1 130px" aria-label="전화번호"><input data-f="contacts.'+i+'.memo" value="'+esc(c.memo)+'" placeholder="메모 (선택)" style="flex:2 1 140px" aria-label="메모"><label class="ck"><input type="checkbox" data-f="contacts.'+i+'.fav"'+(c.fav?' checked':'')+'> 즐겨찾기</label></div><button class="x" data-e="del" data-k="contacts" data-i="'+i+'" aria-label="삭제">✕</button></div>'}).join('')},
    add:function(){var n=$('#add_pname').value.trim();if(!n){flash('이름을 넣어 주세요.',true);$('#add_pname').focus();return false}var ph=$('#add_pnum').value.trim()||('010-0000-'+String(Math.floor(1000+Math.random()*9000)));S.contacts.push({name:n,phone:ph,memo:'',fav:false});$('#add_pname').value='';$('#add_pnum').value='';$('#add_pname').focus();return true}},
  friends:{title:'톡 친구',adder:function(){return '<div class="adder two" data-add="friends"><input id="add_fname" placeholder="이름" autocomplete="off"><input id="add_fstatus" placeholder="상태메시지 (선택)" enterkeyhint="done" autocomplete="off"><button class="btn sm primary" data-e="add" data-k="friends">추가</button></div>'},
    rows:function(){return S.friends.map(function(f,i){return '<div class="lrow"><div class="main"><input data-f="friends.'+i+'.name" value="'+esc(f.name)+'" style="flex:1 1 100px;font-weight:600" aria-label="이름"><input data-f="friends.'+i+'.status" value="'+esc(f.status)+'" placeholder="(선택)" style="flex:2 1 140px" aria-label="상태메시지"></div><button class="x" data-e="del" data-k="friends" data-i="'+i+'" aria-label="삭제">✕</button></div>'}).join('')},
    add:function(){var n=$('#add_fname').value.trim();if(!n){flash('이름을 넣어 주세요.',true);$('#add_fname').focus();return false}S.friends.push({name:n,status:$('#add_fstatus').value.trim()});$('#add_fname').value='';$('#add_fstatus').value='';$('#add_fname').focus();return true}}
};
function listSec(k){var L=LISTS[k];return '<div class="sec"><h3>'+L.title+'</h3>'+L.adder()+'<div class="list" id="list_'+k+'">'+(L.rows()||'<p class="empty">아직 없어요</p>')+'</div>'+regenBtn(k,SECS[k].count())+'</div>'}
function renderList(k){var el=$('#list_'+k);if(el)el.innerHTML=LISTS[k].rows()||'<p class="empty">아직 없어요</p>'}
ED.chats=function(){
  var t=edThread&&thr(edThread);if(t)return threadForm(t,tIndex(t.id));
  var row=function(t){return '<button class="tli" data-e="editThread" data-id="'+esc(t.id)+'">'+(t.avatar?thumb(t.avatar,true):'')+'<span>'+esc(t.name)+'</span><small>말풍선 '+t.items.filter(function(x){return x.k!=='date'}).length+'개 ›</small></button>'};
  var grp=function(app,title,addLabel){var ts=S.threads.filter(function(x){return x.app===app});
    return '<div class="sec"><h3>'+title+' <small class="cnt">'+ts.length+'</small></h3><div class="list">'+(ts.map(row).join('')||'<p class="empty">아직 없어요</p>')+'</div><div class="row"><button class="btn sm" data-e="addThread" data-app="'+app+'">+ '+addLabel+'</button>'+aiBtn('fillApp','AI로 생성',' data-app="'+app+'"')+'</div></div>'};
  return grp('msg','메시지','메시지 대화 추가')+grp('talk','톡','톡 대화 추가')+listSec('friends')+listSec('contacts');
};
var edSel=null,composeSide='me',composeSender='',cmenu=false,cpTimeVal='';
function edWrap(t,i,c){return '<div class="ci'+(edSel===i?' sel':'')+'" data-e="pick" data-ii="'+i+'" id="ci_'+i+'">'+c+'</div>'+(edSel===i?edCard(t,i):'')}
function edCard(t,i){
  var it=t.items[i],B='threads.'+tIndex(t.id)+'.items.'+i,talk=t.app==='talk',f='';
  if(it.k==='date')f+=F('날짜 구분','<input data-f="'+B+'.v" data-live="'+i+'" value="'+esc(it.v)+'" placeholder="예) 2026년 10월 3일 01:04">');
  else if(it.k==='text')f+='<textarea data-f="'+B+'.v" data-live="'+i+'" rows="2" placeholder="말풍선 내용">'+esc(it.v)+'</textarea>';
  else if(it.k==='photo'){var p=pic(it);f+='<div class="row"><span class="thumb '+p.cls+'" style="'+p.style+'"></span><button class="btn sm" data-e="upload" data-target="'+B+'.img" data-size="1000">'+(it.img?'사진 바꾸기':'사진 올리기')+'</button>'+(imagesOn()?aiBtn('genImg','AI 이미지',' data-path="'+B+'"'):'')+'</div>'+F('사진 설명','<input data-f="'+B+'.ph.l" value="'+esc(it.ph&&it.ph.l)+'" placeholder="(선택) 사진이 없으면 이 설명이 보여요">')}
  else f+=F('음성 길이','<input data-f="'+B+'.dur" value="'+esc(it.dur)+'" placeholder="0:07">');
  if(it.k!=='date'){var g='';
    if(t.group&&it.w==='them')g+=F('보낸 사람','<select data-f="'+B+'.n">'+t.members.concat(it.n&&t.members.indexOf(it.n)<0?[it.n]:[]).map(function(m){return '<option'+(m===it.n?' selected':'')+'>'+esc(m)+'</option>'}).join('')+'</select>');
    g+=F('보낸 시각','<input data-f="'+B+'.t" value="'+esc(it.t)+'" placeholder="(선택) 23:42">');
    if(g)f+='<div class="g2">'+g+'</div>'}
  return '<div class="ccard">'+f+'<div class="ct-tool">'+(it.k!=='date'?'<button class="btn sm" data-e="flip" data-ii="'+i+'">⇄ '+(it.w==='me'?'상대가 보낸 걸로':'내가 보낸 걸로')+'</button>':'')+
    '<button class="btn sm" data-e="mvItem" data-ii="'+i+'" data-d="-1" aria-label="위로">↑</button><button class="btn sm" data-e="mvItem" data-ii="'+i+'" data-d="1" aria-label="아래로">↓</button><button class="btn sm danger" data-e="delItem" data-ii="'+i+'">삭제</button><button class="btn sm primary" data-e="pick" data-ii="'+i+'">완료</button></div></div>';
}
function cpvBodyHtml(t){return t.items.length?(t.app==='talk'?talkItems(t,true):msgItems(t,true)):'<p class="cpv-empty">아래 입력창에 쓰고 상대가 보냄 / 내가 보냄을 눌러<br>첫 말풍선을 넣어 보세요.</p>'}
function composerHtml(t){
  var talk=t.app==='talk';if(t.group&&(!composeSender||t.members.indexOf(composeSender)<0))composeSender=t.members[0]||'';
  return '<div class="cpv-comp" id="cpvComp">'+
    (t.group?'<div class="cp-senders"><span>상대 쪽 보낸 사람</span>'+t.members.map(function(m){return '<button class="chip sm'+(composeSender===m?' on':'')+'" data-e="sender" data-n="'+esc(m)+'">'+esc(m)+'</button>'}).join('')+(t.members.length?'':'<span>대화방 설정에서 멤버를 넣어 주세요</span>')+'</div>':'')+
    '<div class="cp-row"><button class="cp-plus'+(cmenu?' on':'')+'" data-e="cmenu" aria-label="사진·음성·날짜 넣기" aria-expanded="'+cmenu+'">'+I.plus+'</button><input id="cpIn" placeholder="말풍선 내용" autocomplete="off" enterkeyhint="send"><input id="cpTime" placeholder="시각" value="'+esc(cpTimeVal)+'" autocomplete="off" aria-label="보낸 시각"></div>'+
    (cmenu?'<div class="cp-menu"><button class="btn sm" data-e="cpAdd" data-k="date">날짜 구분</button><button class="btn sm" data-e="cpAdd" data-k="photo">사진</button><button class="btn sm" data-e="cpAdd" data-k="voice">음성 메시지</button>'+aiBtn('cont','AI로 10개 이어쓰기',' data-n="10"')+'</div>':'')+
    '<div class="cp-btns"><button class="cp-them'+(composeSide==='them'?' last':'')+'" data-e="say" data-w="them">◀ '+(t.group?esc(composeSender||'상대')+'이(가) 보냄':'상대가 보냄')+'</button><button class="cp-me'+(composeSide==='me'?' last':'')+'" data-e="say" data-w="me">내가 보냄 ▶</button></div>'+
    '<p class="cp-hint">말풍선을 누르면 고치거나 순서를 바꿀 수 있어요. Enter는 테두리가 있는 쪽으로 들어가요.</p></div>';
}
function renderCpv(toEnd){var t=thr(edThread),b=$('#cpvBody');if(!t||!b)return;var st=b.scrollTop;b.innerHTML=cpvBodyHtml(t);b.querySelectorAll('[data-ai]').forEach(function(x){x.disabled=!!busy});
  if(toEnd)b.scrollTop=b.scrollHeight;else{b.scrollTop=st;var sel=b.querySelector('.ccard');if(sel){var r=sel.getBoundingClientRect(),br=b.getBoundingClientRect();if(r.bottom>br.bottom)b.scrollTop+=r.bottom-br.bottom+8}}
  var cnt=$('#cpvCount');if(cnt)cnt.textContent=t.items.length;var um=$('#unreadMax'),ui=$('#unreadIn');if(um)um.textContent='/'+maxUnread(t);if(ui){var cu=clampUnread(t);if(t.unread!==cu){t.unread=cu;markChanged(true)}if(+ui.value!==cu)ui.value=cu}}
function renderComposer(){var t=thr(edThread),c=$('#cpvComp');if(!t||!c)return;var v=($('#cpIn')||{}).value||'';cpTimeVal=(($('#cpTime')||{}).value||cpTimeVal);c.outerHTML=composerHtml(t);var n=$('#cpIn');if(n)n.value=v;$('#cpv').querySelectorAll('#cpvComp [data-ai]').forEach(function(x){x.disabled=!!busy})}
function lastTime(t){for(var i=t.items.length-1;i>=0;i--)if(t.items[i].t)return t.items[i].t;return ''}
function say(w){var t=thr(edThread);if(!t)return;var inp=$('#cpIn'),v=inp?inp.value.trim():'';composeSide=w;
  if(!v){renderComposer();var n=$('#cpIn');if(n)n.focus();return}
  var it={w:w,k:'text',v:v},tm=(($('#cpTime')||{}).value||'').trim();cpTimeVal=tm;if(tm)it.t=tm;else if(t.app==='talk')it.t=lastTime(t)||nowLabel();if(t.group&&w==='them')it.n=composeSender||t.members[0]||'?';
  t.items.push(it);if(it.t)t.when=it.t;inp.value='';edSel=null;markChanged();renderCpv(true);renderComposer();var n2=$('#cpIn');if(n2)n2.focus()}
function cpAdd(k){var t=thr(edThread);if(!t)return;var it;
  if(k==='date'){var d=parseD(S.owner.date);it={k:'date',v:t.app==='talk'?d.getFullYear()+'년 '+(d.getMonth()+1)+'월 '+d.getDate()+'일 '+DOW[d.getDay()]+'요일':d.getFullYear()+'년 '+(d.getMonth()+1)+'월 '+d.getDate()+'일 '+nowLabel()}}
  else{it=k==='photo'?{w:composeSide,k:'photo',img:null,ph:{c:[],l:''}}:{w:composeSide,k:'voice',dur:'0:07'};var tm2=(($('#cpTime')||{}).value||'').trim();if(tm2)it.t=tm2;else if(t.app==='talk')it.t=lastTime(t)||nowLabel();if(t.group&&it.w==='them')it.n=composeSender||t.members[0]||'?'}
  t.items.push(it);edSel=t.items.length-1;cmenu=false;markChanged();renderCpv(true);renderComposer();var b=$('#cpvBody');if(b)b.scrollTop=b.scrollHeight}
function threadForm(t,ti){
  var P='threads.'+ti,talk=t.app==='talk',dark=phoneScheme==='dark';
  if(cpTimeVal===''||cpThread!==t.id){cpTimeVal=lastTime(t);cpThread=t.id}
  var av='<button class="cpv-av" data-e="upload" data-target="'+P+'.avatar" data-size="360" aria-label="프로필 사진 바꾸기">'+(talk?avatar(t,'talk',38):avatar(t,'msg',40))+'<i>'+I.plus+'</i></button>';
  var head='<div class="cpv-head '+(talk?'talk':'msg')+'">'+av+'<input class="cpv-name" data-f="'+P+'.name" value="'+esc(t.name)+'" placeholder="대화방 이름" aria-label="대화방 이름">'+
    '<label class="cpv-un" title="마지막으로 받은 메시지 수까지만 넣을 수 있어요">안 읽음<input data-f="'+P+'.unread" id="unreadIn" value="'+clampUnread(t)+'" inputmode="numeric" data-num="1" data-unread="1" aria-label="안 읽은 개수"><small id="unreadMax">/'+maxUnread(t)+'</small></label>'+
    (talk?'':'<button class="cpv-pin'+(t.pinned?' on':'')+'" data-e="pinT" aria-pressed="'+t.pinned+'">고정</button>')+'</div>';
  var mem=talk?'<div class="cpv-mem"><span>'+(t.members.length?'단톡 멤버':'1:1 대화 · 멤버를 넣으면 단톡방이 돼요')+'</span>'+t.members.map(function(m){return '<span class="mchip">'+esc(m)+'<button data-e="memDel" data-n="'+esc(m)+'" aria-label="'+esc(m)+' 빼기">✕</button></span>'}).join('')+'<input id="memAdd" placeholder="+ 멤버 이름" enterkeyhint="done" autocomplete="off"></div>':'';
  return '<button class="link" data-e="threadBack">‹ 대화 목록</button>'+
    '<div class="cpv '+(talk?'talk':'msg')+(dark?' dark':'')+'" id="cpv">'+head+mem+'<div class="cpv-body" id="cpvBody">'+cpvBodyHtml(t)+'</div>'+composerHtml(t)+'</div>'+
    regenBtn('thread',t.items.length)+'<div class="row"><button class="btn sm danger" data-e="delThread">'+(delArm===t.id?'한 번 더 누르면 삭제돼요':'이 대화 삭제')+'</button></div>';
}
var cpThread=null;
function addMember(){var t=thr(edThread),el=$('#memAdd');if(!t||!el)return;var n=el.value.trim();if(!n)return;if(t.members.indexOf(n)<0)t.members.push(n);t.group=t.members.length>0;composeSender=n;markChanged();renderEditor();var m=$('#memAdd');if(m)m.focus()}
ED.photos=function(){
  var img=imagesOn(),todo=S.gallery.filter(function(g){return !g.img&&g.ph.l}).length;
  return '<div class="sec"><div class="row"><button class="btn sm primary" data-e="upload" data-target="gallery" data-size="1000" data-multi="1">+ 사진 올리기</button><button class="btn sm" data-e="addPh">+ 설명만 있는 사진</button></div>'+
    '<p class="enote">직접 올리지 않은 칸은 색감과 설명만 있는 흐릿한 사진으로 보여요. '+(img?'설명이 있는 사진을 실제 이미지로 만들 수 있어요.':'실제 이미지로 만들려면 설정 › AI · API에서 이미지 만들기를 켜세요(결제가 연결된 키 필요).')+'</p>'+
    (img&&todo?'<div class="row">'+aiBtn('genAll','설명 있는 사진 '+todo+'장 이미지로 만들기')+'</div>':'')+
    '<div class="list">'+(S.gallery.map(function(g,i){var p=pic(g),B='gallery.'+i;return '<div class="gph"><span class="thumb '+p.cls+'" style="'+p.style+'"></span><div class="it-main"><input data-f="'+B+'.ph.l" value="'+esc(g.ph.l)+'" placeholder="사진 설명"><div class="row"><input type="date" data-f="'+B+'.date" value="'+esc(g.date)+'" style="flex:1;width:auto"><label class="ck"><input type="checkbox" data-f="'+B+'.fav"'+(g.fav?' checked':'')+'> 즐겨찾기</label></div><div class="row"><button class="btn sm" data-e="upload" data-target="'+B+'.img" data-size="1000">'+(g.img?'바꾸기':'사진 올리기')+'</button>'+(img?aiBtn('genImg','AI 이미지',' data-path="'+B+'"'):'')+(g.img?'<button class="btn sm ghost" data-e="clear" data-path="'+B+'.img">사진 빼기</button>':'')+'</div></div><button class="x" data-e="delPh" data-i="'+i+'" aria-label="삭제">✕</button></div>'}).join('')||'<p class="empty">아직 없어요</p>')+'</div>'+regenBtn('gallery',S.gallery.length,S.gallery.some(function(g){return g.img})?'직접 올린 사진은 그대로 남아요':'')+'</div>';
};
function sysNames(){var n=[S.owner.name];S.system.characters.forEach(function(c){if(n.indexOf(c.name)<0)n.push(c.name)});return n}
function castCandidates(){var out=[],add=function(n){n=str(n).trim();if(n&&n!==S.owner.name&&out.indexOf(n)<0)out.push(n)};
  S.threads.forEach(function(t){if(!t.group)add(t.name);t.members.forEach(add)});S.contacts.forEach(function(c){add(c.name)});S.friends.forEach(function(f){add(f.name)});return out}
ED.sys=function(){
  var y=S.system,p='system.protagonist.',names=sysNames(),missing=castCandidates().filter(function(n){return !y.characters.some(function(c){return c.name===n})});
  var chars=y.characters.map(function(c,i){var B='system.characters.'+i+'.';return '<div class="mcard sysc"><div class="g2 top2"><input data-f="'+B+'name" value="'+esc(c.name)+'" placeholder="이름" aria-label="이름" class="nm"><input data-f="'+B+'role" value="'+esc(c.role)+'" placeholder="주인공과의 관계" aria-label="주인공과의 관계"></div>'+
    '<div class="g2"><textarea data-f="'+B+'personality" rows="2" placeholder="성격">'+esc(c.personality)+'</textarea><textarea data-f="'+B+'speech" rows="2" placeholder="말투 (예: 반말, 이모지 많이)">'+esc(c.speech)+'</textarea></div>'+
    '<textarea data-f="'+B+'secret" rows="2" placeholder="(선택) 비밀·메모 · 주인공에게 숨기는 것">'+esc(c.secret)+'</textarea>'+
    '<div class="pingrow"><span class="pl">먼저 연락할 확률</span><span class="pingbox"><button class="pst" data-e="pingStep" data-i="'+i+'" data-d="-5" aria-label="5% 낮추기">−</button><input id="ping_'+i+'" data-f="'+B+'ping" data-num="1" data-ping="1" value="'+c.ping+'" inputmode="numeric" pattern="[0-9]*" maxlength="3" aria-label="'+esc(c.name)+' 먼저 연락할 확률 (퍼센트)"><i>%</i><button class="pst" data-e="pingStep" data-i="'+i+'" data-d="5" aria-label="5% 높이기">+</button></span><button class="x" data-e="sysDel" data-i="'+i+'" aria-label="'+esc(c.name||'인물')+' 삭제">✕</button></div></div>'}).join('');
  var rels=y.relations.map(function(r,i){return '<div class="lrow"><div class="main"><span class="tag">'+esc(r.a)+' ↔ '+esc(r.b)+'</span><input data-f="system.relations.'+i+'.desc" value="'+esc(r.desc)+'" placeholder="두 사람의 관계" style="flex:1 1 160px" aria-label="관계 설명"></div><button class="x" data-e="relDel" data-i="'+i+'" aria-label="삭제">✕</button></div>'}).join('');
  var opt=function(id){return '<select id="'+id+'" aria-label="인물">'+names.map(function(n){return '<option>'+esc(n)+'</option>'}).join('')+'</select>'};
  return '<div class="banner">'+LOCK+'<b>이 폰을 만든 사람에게만 보이는 설정이에요.</b><span style="color:var(--muted)">폰을 보는 사람의 화면에는 나오지 않고, AI가 답장하거나 내용을 만들 때만 참고해요. 다른 사람이 복사해 갈 때는 빠져요.</span></div>'+
    '<div class="sec"><h3>먼저 연락하기</h3><p class="enote">켜 두면 폰을 보는 동안 등장인물이 각자의 확률에 따라 무작위로 먼저 메시지를 보내요. 확률은 아래 등장인물 카드에서 정해요.</p>'+
      '<label class="ck"><input type="checkbox" data-f="system.initiate.on"'+(y.initiate.on?' checked':'')+'> 먼저 연락하기 켜기</label>'+
      '<div class="row between"><span>빈도</span><span class="segm" role="group" aria-label="빈도">'+['low','mid','high'].map(function(k){return '<button class="'+(y.initiate.freq===k?'on':'')+'" data-e="pingFreq" data-v="'+k+'">'+FREQ[k].label+'</button>'}).join('')+'</span></div>'+
      '<div class="row"><button class="btn sm primary" data-e="pingTest">지금 한 번 보내 보기</button><span class="enote">확률과 상관없이 바로 한 명이 연락해요</span></div></div>'+
    '<div class="sec"><h3>주인공 · '+esc(S.owner.name)+'</h3><div class="g2">'+F('성격',ta(p+'personality','예) 겉으론 무심, 속은 여림',2))+F('말투',ta(p+'speech','예) 짧은 반말, ㅋㅋ 자주',2))+'</div>'+
      '<div class="g2">'+F('숨기고 있는 것',ta(p+'secret','(선택)',2))+F('원하는 것',ta(p+'want','(선택)',2))+'</div></div>'+
    '<div class="sec"><div class="row between"><h3>등장인물 <small class="cnt">'+y.characters.length+'</small></h3>'+(missing.length?'<button class="btn sm" data-e="sysImport">대화·연락처에서 '+missing.length+'명 불러오기</button>':'')+'</div>'+
      '<div class="adder one" data-add="syschar"><input id="add_sysname" placeholder="인물 이름" autocomplete="off" enterkeyhint="done"><button class="btn sm primary" data-e="sysAdd">추가</button></div>'+
      '<div class="list">'+(chars||'<p class="empty">아직 없어요. 대화·연락처에 있는 사람을 불러오거나 이름을 넣어 추가하세요.</p>')+'</div></div>'+
    '<div class="sec"><h3>인물 사이 관계</h3><div class="adder rel" data-add="sysrel">'+opt('rel_a')+opt('rel_b')+'<input id="rel_desc" placeholder="관계 (예: 전 연인, 서로 모르는 척)" autocomplete="off" enterkeyhint="done"><button class="btn sm primary" data-e="relAdd">추가</button></div>'+
      '<div class="list">'+(rels||'<p class="empty">아직 없어요</p>')+'</div></div>'+
    '<div class="sec"><h3>이야기 설정</h3>'+F('세계관 · 배경',ta('system.world','(선택) 예) 2026년 서울, 인디씬이 막 뜨기 시작한 때',2))+
      F('숨겨진 진실 · 결말',ta('system.truth','(선택) 독자가 끝내 알아낼 진실. AI는 대화에서 직접 말하지 않아요',3))+
      F('AI 지침',ta('system.rules','(선택) 예) 해는 절대 먼저 연락하지 않는다 / 기자 얘기가 나오면 말을 돌린다',3))+
      F('등장인물 한 줄 메모',ta('scenario.cast','(선택)',3))+'</div>'+
    regenBtn('system',sysCount(),'대화·사진·기록을 보고 인물 설정을 만들어요')+'';
};
ED.rec=function(){return listSec('search')+listSec('events')+listSec('calls')+listSec('memos')};
function getPath(o,path){return path.split('.').reduce(function(c,k){return c==null?undefined:c[k]},o)}
function setPath(o,path,v){var ks=path.split('.'),c=o;for(var i=0;i<ks.length-1;i++){if(c[ks[i]]==null||typeof c[ks[i]]!=='object')c[ks[i]]={};c=c[ks[i]]}c[ks[ks.length-1]]=v}
function updateFoot(){var el=$('#edStatus');if(!el||!S)return;
  if(noteMsg){el.className='st'+(noteErr?' err':' dirty');el.textContent=noteMsg;return}
  el.className='st'+(cloudErr?' err':'');
  var t=function(d){return String(d.getHours()).padStart(2,'0')+':'+String(d.getMinutes()).padStart(2,'0')};
  el.textContent=saveFail?'이 기기에 저장하지 못했어요. 파일로 내보내 두세요.':cloudErr?('계정 저장 실패: '+cloudErr):(savedAt?'이 기기에 저장됨 '+t(savedAt):'고친 내용은 자동으로 저장돼요')+(Cloud.user?(cloudAt?' · 계정에 저장됨 '+t(cloudAt):' · 계정에 저장 대기 중'):'');
}
function compressUrl(url,max){return new Promise(function(res,rej){var im=new Image();im.onload=function(){var w=im.naturalWidth,h=im.naturalHeight,s=Math.min(1,max/Math.max(w,h));w=Math.round(w*s);h=Math.round(h*s);var cv=document.createElement('canvas');cv.width=w;cv.height=h;cv.getContext('2d').drawImage(im,0,0,w,h);res(cv.toDataURL('image/jpeg',.82))};im.onerror=function(){rej({code:'no_image'})};im.src=url})}
function compress(file,max){return new Promise(function(res,rej){var fr=new FileReader();fr.onload=function(){compressUrl(fr.result,max).then(res,rej)};fr.onerror=rej;fr.readAsDataURL(file)})}
function onFiles(files){
  var tgt=upTarget;if(!tgt||!files.length)return;
  var jobs=Array.prototype.slice.call(files,0,tgt.multi?40:1).map(function(f){return compress(f,tgt.size).catch(function(){return null})});
  Promise.all(jobs).then(function(urls){var bad=0;urls.forEach(function(u){if(!u){bad++;return}var id='i'+uid();S.images[id]=u;
      if(tgt.target==='gallery')S.gallery.push({id:uid(),img:id,ph:{c:[],l:''},date:S.owner.date,fav:false});else setPath(S,tgt.target,id)});
    if(bad)flash('열 수 없는 사진이 있었어요. JPG나 PNG로 올려 주세요.',true);
    markChanged();renderEditor()});
}

/* ---------- AI jobs ---------- */
function runJob(label,job,opts){
  if(busy)return;if(!needAI())return;
  busy={label:label,stoppable:!!(opts&&opts.stoppable)};stopFlag=false;startProg();renderEditor();
  Promise.resolve().then(job).then(function(msg){if(msg)flash(msg)},function(e){flash(aiErrMsg(e),true)}).then(function(){busy=null;stopProg();renderEditor();renderSide()});
}
function fillSections(keys){
  if(!needAI())return;
  keys=keys.filter(function(k){return SECS[k]});if(!keys.length){flash('만들 항목을 하나 이상 골라 주세요.',true);return}
  runJob('AI가 '+keys.map(function(k){return SECS[k].label}).join(', ')+' 만드는 중',function(){
    return AI.json(fillPrompt(keys)).then(function(res){var n=mergeFill(res);fillSel=null;markChanged();return n?'AI가 '+n+'개를 새로 채웠어요.':'새로 채울 내용이 없었어요.'})});
}
function regenerate(k){
  if(!needAI())return;
  if(k==='system'){
    runJob('AI가 인물 설정을 만드는 중',function(){
      var p='너는 \'남의 폰 훔쳐보기\' 인터랙티브 픽션 작가다. 아래 폰 내용을 읽고, 작가만 보는 비공개 인물 설정을 만들어라. 대화에 나온 말투와 관계를 근거로 하고, 이야기를 더 깊게 만드는 비밀과 긴장을 더해라. 등장인물 이름은 대화·연락처에 쓰인 이름 그대로 쓴다.\n'+STYLE_RULES+'\n\n=== 지금 폰 내용 ===\n'+storyContext(true,'system')+
        '\n\nJSON 객체 하나만 출력: {'+'\"system\":{\"protagonist\":{\"personality\":\"주인공 성격\",\"speech\":\"말투\",\"secret\":\"숨기고 있는 것\",\"want\":\"원하는 것\"},\"characters\":[{\"name\":\"대화·연락처에 쓰는 이름 그대로\",\"role\":\"주인공과의 관계\",\"personality\":\"성격\",\"speech\":\"말투 특징\",\"secret\":\"비밀이나 메모\"}],\"relations\":[{\"a\":\"이름\",\"b\":\"이름\",\"desc\":\"두 사람의 관계\"}],\"world\":\"세계관·배경\",\"truth\":\"독자가 끝내 알아낼 숨겨진 진실\",\"rules\":\"이 이야기의 AI 답장 규칙\"}'+'}';
      return AI.json(p).then(function(r){var sy=r&&(r.system||r);if(!sy||typeof sy!=='object')throw {code:'parse'};var tmp=normalize({owner:S.owner,system:sy});if(!tmp.system.characters.length&&!tmp.system.protagonist.personality)throw {code:'empty'};S.system=tmp.system;markChanged();return '인물 설정을 만들었어요.'})});return}
  if(k==='thread'){var t=thr(edThread);if(!t)return;
    runJob('AI가 "'+t.name+'" 대화를 새로 쓰는 중',function(){var keep=t.items;t.items=[];var p=contPrompt(t,20);t.items=keep;
      return AI.json(p).then(function(res){var its=arr(Array.isArray(res)?res:res&&res.items).map(normItem).filter(Boolean);if(!its.length)throw {code:'empty'};
        its.forEach(function(it){if(t.group&&it.w==='them'&&!it.n)it.n=t.members[0]||'?'});t.items=its;
        for(var i=its.length-1;i>=0;i--){if(its[i].t){t.when=its[i].t;break}}markChanged();return '대화를 새로 썼어요.'})});return}
  if(k==='scenario'){
    runJob('AI가 제목과 상황 소개를 새로 쓰는 중',function(){
      var p='너는 \'남의 폰 훔쳐보기\' 인터랙티브 픽션 작가다. 아래 폰 내용을 보고, 독자가 폰을 열기 전에 읽을 제목과 상황 소개를 새로 써라. 결말이나 비밀은 말하지 말고 궁금하게 만들어라.\n'+STYLE_RULES+'\n\n=== 지금 폰 내용 ===\n'+storyContext(true,'scenario')+
        '\n\nJSON 객체 하나만 출력: {"title":"짧고 여운 있는 제목","text":"2~3문장 상황 소개","cast":"주요 인물과 관계, 한 줄에 한 명"}';
      return AI.json(p).then(function(r){if(!r||!r.title)throw {code:'parse'};S.scenario.title=str(r.title);S.scenario.text=str(r.text);if(r.cast&&!S.scenario.cast)S.scenario.cast=str(r.cast);markChanged();return '제목과 상황 소개를 새로 썼어요.'})});return}
  if(!SECS[k])return;
  runJob('AI가 '+SECS[k].label+' 새로 만드는 중',function(){
    var full=storyContext(true),part=storyContext(true,k),p=fillPrompt([k]).replace(full,function(){return part});
    return AI.json(p).then(function(res){if(!res||typeof res!=='object'||Array.isArray(res))throw {code:'parse'};
      var tmp=normalize({owner:S.owner,threads:res.threads,friends:res.friends,gallery:res.gallery,search:res.search,memos:res.memos,calls:res.calls,events:res.events,contacts:res.contacts});
      if(!tmp[k].length)throw {code:'empty'};
      if(k==='gallery')S.gallery=S.gallery.filter(function(g){return g.img}).concat(tmp.gallery);else S[k]=tmp[k];
      markChanged();return SECS[k].label+'을(를) 새로 만들었어요.'})});
}
function fillApp(app){
  if(!needAI())return;var nm=app==='talk'?'톡':'메시지';
  runJob('AI가 새 '+nm+' 대화를 만드는 중',function(){
    var spec='"threads": 지금 없는 상대와의 새 '+nm+' 대화 2~3개. app은 모두 "'+app+'". 각각 10~25개 말풍선.'+(app==='talk'&&!S.threads.some(function(x){return x.app==='talk'&&x.group})?' 그중 하나는 단톡방.':'')+' 말풍선 형식: '+ITEM_SCHEMA;
    var p=fillPrompt(['threads']).replace(SECS.threads.spec,function(){return spec});
    return AI.json(p).then(function(res){if(res&&Array.isArray(res.threads))res.threads.forEach(function(x){if(x&&typeof x==='object')x.app=app});
      var n=mergeFill(res);markChanged();return n?'새 '+nm+' 대화 '+n+'개를 만들었어요.':'새로 만들 대화가 없었어요.'})});
}
function continueThread(t,n){
  runJob('AI가 "'+t.name+'" 대화를 쓰는 중',function(){
    return AI.json(contPrompt(t,n)).then(function(res){
      var its=arr(Array.isArray(res)?res:res&&res.items).map(normItem).filter(Boolean);if(!its.length)throw {code:'empty'};
      its.forEach(function(it){if(t.group&&it.w==='them'&&!it.n)it.n=t.members[0]||'?';t.items.push(it)});
      for(var i=t.items.length-1;i>=0;i--){if(t.items[i].t){t.when=t.items[i].t;break}}
      markChanged();setTimeout(function(){var b=$('#edBody');if(b)b.scrollTop=b.scrollHeight},50);return '말풍선 '+its.length+'개를 이어 썼어요.'})});
}
function genImage(path){
  var it=getPath(S,path);if(!it)return;var desc=it.ph&&it.ph.l;if(!desc){flash('사진 설명을 먼저 적어 주세요.',true);return}
  runJob('사진을 이미지로 만드는 중',function(){return AI.image(imgPrompt(desc)).then(function(url){var id='i'+uid();S.images[id]=url;it.img=id;markChanged();return '이미지를 만들었어요.'})});
}
function genAllImages(){
  var list=S.gallery.filter(function(g){return !g.img&&g.ph.l});if(!list.length)return;
  runJob('사진 '+list.length+'장을 이미지로 만드는 중',function(){
    var done=0;
    return list.reduce(function(p,g){return p.then(function(){if(stopFlag)return;busy.label='사진을 이미지로 만드는 중 ('+(done+1)+'/'+list.length+')';var b=$('#edBody .banner b');if(b)b.textContent=busy.label;
      return AI.image(imgPrompt(g.ph.l)).then(function(url){var id='i'+uid();S.images[id]=url;g.img=id;done++;markChanged()})})},Promise.resolve())
    .then(function(){return done+'장을 이미지로 만들었어요.'},function(e){if(done)markChanged();throw e});
  },{stoppable:true});
}
function generateNew(){
  if(!aiDraft.concept.trim()){flash('컨셉을 한두 줄이라도 적어 주세요.',true);var c=$('#aiConcept');if(c)c.focus();return}
  var keys=Object.keys(genSel||{}).filter(function(k){return genSel[k]});
  runJob('AI가 새 폰을 만드는 중',function(){
    return AI.json(genPrompt(keys)).then(function(res){
      if(!res||typeof res!=='object'||Array.isArray(res)||!res.owner)throw {code:'parse'};
      res.owner.date=todayStr();res.owner.wall=res.wall;res.owner.avatar=null;res.owner.wallImg=null;res.images={};res.id=newId();res.concept=aiDraft.concept.trim();
      Object.keys(SECS).forEach(function(k){if(keys.indexOf(k)<0)res[k]=[]});
      return saveLocal().then(function(){return switchTo(res)}).then(function(){aiDraft.owner='';renderEditor();return '새 폰을 만들었어요. 잠금화면부터 열어 보세요. 이전 폰은 설정 › 내 폰 목록에 있어요.'});
    })});
}
function edAction(d,el){
  switch(d.e){
    case 'tab':edTab=d.tab;edThread=null;delArm=null;armRegen=null;renderEditor();$('#edBody').scrollTop=0;break;
    case 'close':applyRestart();break;
    case 'leave':closeEditor();break;
    case 'openSet':openSettings(d.sec);break;
    case 'opt':var sel=d.g==='fill'?fillSel:genSel;sel[d.k]=!sel[d.k];el.classList.toggle('on',sel[d.k]);el.setAttribute('aria-pressed',sel[d.k]);break;
    case 'selAll':case 'selNone':var s2=d.g==='fill'?fillSel:genSel;Object.keys(SECS).forEach(function(k){s2[k]=d.e==='selAll'});renderEditor();break;
    case 'fill':fillSections(Object.keys(fillSel||{}).filter(function(k){return fillSel[k]}));break;
    case 'fillOne':fillSections([d.k]);break;
    case 'regen':var cnt=d.k==='system'?sysCount():d.k==='thread'?(thr(edThread)||{items:[]}).items.length:d.k==='scenario'?((S.scenario.title||S.scenario.text)?1:0):SECS[d.k].count();if(cnt&&!d.armed){armRegen=d.k;renderEditor();break}armRegen=null;regenerate(d.k);break;
    case 'goFill':edTab='ai';fillSel=null;renderEditor();$('#edBody').scrollTop=0;break;
    case 'cont':var ct=thr(edThread);if(ct)continueThread(ct,+d.n||10);break;
    case 'genImg':genImage(d.path);break;
    case 'genAll':genAllImages();break;
    case 'stop':stopFlag=true;break;
    case 'mood':var i=aiDraft.moods.indexOf(d.m);if(i>=0)aiDraft.moods.splice(i,1);else aiDraft.moods.push(d.m);el.classList.toggle('on');break;
    case 'aiGo':generateNew();break;
    case 'export':exportStory();break;
    case 'add':if(LISTS[d.k].add()){markChanged();renderList(d.k)}break;
    case 'del':var arr2=S[d.k];arr2.splice(+d.i,1);markChanged();renderList(d.k);break;
    case 'upload':upKind='img';upTarget={target:d.target,size:+d.size||1000,multi:!!d.multi};var fi=$('#edFile');fi.accept='image/*';fi.multiple=!!d.multi;fi.click();break;
    case 'clear':setPath(S,d.path,null);markChanged();renderEditor();break;
    case 'wall':S.owner.wall=d.w;S.owner.wallImg=null;markChanged();renderEditor();break;
    case 'editThread':edThread=d.id;delArm=null;edSel=null;cmenu=false;composeSide='me';renderEditor();$('#edBody').scrollTop=0;break;
    case 'threadBack':edThread=null;delArm=null;edSel=null;renderEditor();break;
    case 'addThread':var nt={id:uid(),app:d.app,name:d.app==='talk'?'새 톡방':'새 대화방',avatar:null,pinned:false,unread:0,when:'',group:false,members:[],status:'',items:[]};S.threads.push(nt);edThread=nt.id;markChanged();renderEditor();$('#edBody').scrollTop=0;break;
    case 'delThread':var t=thr(edThread);if(!t)break;if(delArm!==t.id){delArm=t.id;renderEditor();break}S.threads.splice(tIndex(t.id),1);edThread=null;delArm=null;markChanged();renderEditor();break;
    case 'addItem':var tt=thr(edThread);if(!tt)break;var it=d.k==='date'?{k:'date',v:''}:d.k==='photo'?{w:'them',k:'photo',img:null,ph:{c:[],l:''}}:d.k==='voice'?{w:'them',k:'voice',dur:'0:07'}:{w:d.k,k:'text',v:''};
      if(tt.app==='talk'&&it.k!=='date')it.t=nowLabel();tt.items.push(it);markChanged();renderEditor();var bd=$('#edBody');bd.scrollTop=bd.scrollHeight;break;
    case 'delItem':thr(edThread).items.splice(+d.ii,1);edSel=null;markChanged();renderCpv();break;
    case 'mvItem':var its=thr(edThread).items,a=+d.ii,b=a+(+d.d);if(b<0||b>=its.length)break;var tmp=its[a];its[a]=its[b];its[b]=tmp;edSel=b;markChanged();renderCpv();break;
    case 'flip':var fx=thr(edThread).items[+d.ii];fx.w=fx.w==='me'?'them':'me';if(thr(edThread).group&&fx.w==='them'&&!fx.n)fx.n=composeSender||thr(edThread).members[0]||'?';markChanged();renderCpv();break;
    case 'sysAdd':var sn=$('#add_sysname'),nv=sn?sn.value.trim():'';if(!nv){flash('이름을 넣어 주세요.',true);break}if(!S.system.characters.some(function(c){return c.name===nv}))S.system.characters.push({name:nv,role:'',personality:'',speech:'',secret:''});markChanged();renderEditor();var sn2=$('#add_sysname');if(sn2)sn2.focus();break;
    case 'sysImport':castCandidates().forEach(function(n){if(!S.system.characters.some(function(c){return c.name===n}))S.system.characters.push({name:n,role:'',personality:'',speech:'',secret:''})});markChanged();renderEditor();break;
    case 'sysDel':S.system.characters.splice(+d.i,1);markChanged();renderEditor();break;
    case 'relAdd':var ra=$('#rel_a').value,rb=$('#rel_b').value,rd=$('#rel_desc').value.trim();if(ra===rb){flash('서로 다른 두 사람을 골라 주세요.',true);break}S.system.relations.push({a:ra,b:rb,desc:rd});markChanged();renderEditor();break;
    case 'relDel':S.system.relations.splice(+d.i,1);markChanged();renderEditor();break;
    case 'pingStep':(function(){var c=S.system.characters[+d.i];if(!c)return;var nv=Math.max(0,Math.min(100,Math.round((+c.ping||0)/5)*5+(+d.d)));c.ping=nv;var pi=$('#ping_'+d.i);if(pi)pi.value=nv;markChanged()})();break;
    case 'syncTimes':(function(){var cur=str(S.owner.time),ans=window.prompt('대화 시각이 원래 맞춰져 있던 시각을 입력해 주세요.\n(예: 22:36) 지금 폰 시각 '+cur+'에 맞게 옮겨요.','');if(ans==null)return;
      var dg=String(ans).replace(/\D/g,'');if(dg.length<3||dg.length>4){flash('시각을 22:36처럼 입력해 주세요.',true);return}
      var h=+(dg.length===3?dg[0]:dg.slice(0,2)),m=+dg.slice(-2),c=/^(\d{1,2}):(\d{2})$/.exec(cur);if(h>23||m>59||!c){flash('시각을 22:36처럼 입력해 주세요.',true);return}
      var delta=(+c[1]*60+(+c[2]))-(h*60+m);if(!delta){flash('이미 맞아요.');return}
      shiftAllTimes(delta);markChanged();var ee=$('#ed');if(ee&&!ee.hidden&&edThread)renderCpv();flash('대화 시각을 '+(delta>0?'+':'')+delta+'분 옮겼어요.')})();break;
    case 'pingFreq':S.system.initiate.freq=d.v;markChanged(true);renderEditor();break;
    case 'pingTest':var pool=S.system.characters.filter(function(c){return c.ping>0});if(!pool.length)pool=S.system.characters.filter(function(c){return threadFor(c)});if(!pool.length){flash('먼저 등장인물을 추가해 주세요.',true);break}
      var pc=pool[Math.floor(Math.random()*pool.length)];if(document.body.classList.contains('full')||document.body.classList.contains('narrow'))closeEditor();pingBusy=false;doPing(pc);flash(pc.name+'이(가) 연락하는 중이에요.');break;
    case 'pinT':var pt=thr(edThread);pt.pinned=!pt.pinned;el.classList.toggle('on',pt.pinned);markChanged();break;
    case 'memDel':var mt=thr(edThread);mt.members=mt.members.filter(function(x){return x!==d.n});mt.group=mt.members.length>0;markChanged();renderEditor();break;
    case 'pick':var pi=+d.ii;edSel=edSel===pi?null:pi;renderCpv();break;
    case 'say':say(d.w);break;
    case 'sender':composeSender=d.n;composeSide='them';renderComposer();break;
    case 'cmenu':cmenu=!cmenu;renderComposer();break;
    case 'cpAdd':cpAdd(d.k);break;
    case 'fillApp':fillApp(d.app);break;
    case 'addPh':S.gallery.push({id:uid(),img:null,ph:{c:PALS[S.gallery.length%PALS.length].slice(),l:''},date:S.owner.date,fav:false});markChanged();renderEditor();break;
    case 'delPh':S.gallery.splice(+d.i,1);markChanged();renderEditor();break;
  }
}
/* time field: auto colon, and changing the phone time moves every message/call time with it */
function mins12(ap,h,m){h=(+h)%12;if(/오후|PM|pm/.test(ap))h+=12;return h*60+(+m)}
function shiftClock(str0,delta){
  return String(str0).replace(/(오전|오후)?(\s*)(\d{1,2}):(\d{2})(?![\d:])/g,function(all,ap,sp,h,m,off,whole){
    if(!ap&&off>0&&/[\d:]/.test(whole.charAt(off-1)))return all;
    if(ap){var t=((mins12(ap,h,m)+delta)%1440+1440)%1440,H=Math.floor(t/60);return (H>=12?'오후':'오전')+' '+(H%12||12)+':'+String(t%60).padStart(2,'0')}
    var t2=((+h*60+(+m)+delta)%1440+1440)%1440;return sp+String(Math.floor(t2/60)).padStart(2,'0')+':'+String(t2%60).padStart(2,'0')})}
function shiftAllTimes(delta){if(!delta)return;
  [S.threads,baseThreads||[]].forEach(function(L){L.forEach(function(t){
    if(/^(오전|오후)\s*\d{1,2}:\d{2}$|^\d{1,2}:\d{2}$/.test(str(t.when).trim()))t.when=shiftClock(t.when,delta);
    t.items.forEach(function(it){if(it.t)it.t=shiftClock(it.t,delta);if(it.k==='date'&&t.app==='msg'&&/\d{1,2}:\d{2}/.test(it.v))it.v=shiftClock(it.v,delta)})})});
  if(baseThreads&&canEdit&&S.id)Store.set('base:'+S.id,{threads:baseThreads});
  S.calls.forEach(function(c){if(c.time)c.time=shiftClock(c.time,delta)})}
function fixTimeField(e,el){
  var dg=String(el.value).replace(/\D/g,'').slice(0,4),del=/^delete/.test(e.inputType||'');
  var out=dg.length>=3?(dg.length===3?dg[0]:dg.slice(0,2))+':'+dg.slice(dg.length===3?1:2):(dg.length===2&&!del&&e.type==='input'?dg+':':dg);
  if(e.type!=='change'&&dg.length<4){el.value=out;return}
  var m=/^(\d{1,2}):(\d{2})$/.exec(out);
  if(!m){el.value=S.owner.time;return}
  var H=Math.min(23,+m[1]),M=Math.min(59,+m[2]),nv=String(H).padStart(2,'0')+':'+String(M).padStart(2,'0');el.value=nv;
  var om=/^(\d{1,2}):(\d{2})$/.exec(str(S.owner.time));
  if(nv===S.owner.time)return;
  if(om)shiftAllTimes(H*60+M-(+om[1]*60+(+om[2])));
  S.owner.time=nv;markChanged();
  var ee=$('#ed');if(ee&&!ee.hidden&&edThread)renderCpv()}
function onEdInput(e){
  var el=e.target;
  if(el.id==='aiConcept'){aiDraft.concept=el.value;return}
  if(el.id==='aiOwner'){aiDraft.owner=el.value;return}
  var f=el.dataset.f;if(!f)return;
  var v=el.type==='checkbox'?el.checked:el.value;
  if(el.dataset.num)v=parseInt(v,10)||0;
  if(el.dataset.list)v=String(v).split(',').map(function(s){return s.trim()}).filter(Boolean);
  if(el.dataset.pass){v=String(v).replace(/\D/g,'').slice(0,6);if(v.length&&v.length<4)return}
  if(f==='owner.battery')v=Math.min(100,Math.max(1,v||1));
  if(el.dataset.unread){var ut=thr(edThread);if(ut){var mx=maxUnread(ut);if(v>mx||v<0){v=Math.max(0,Math.min(v,mx));el.value=v;flash('안 읽은 개수는 0~'+mx+'개까지예요. 마지막으로 받은 메시지 수만큼만 넣을 수 있어요.',true)}}}
  if(f==='owner.time'){fixTimeField(e,el);return}
  if(/^calls\.\d+\.count$/.test(f))v=Math.max(1,v||1);
  if(el.dataset.ping){if(e.type==='input'&&el.value!==''&&!/^\d+$/.test(el.value)){el.value=String(el.value).replace(/\D/g,'').slice(0,3)}v=Math.max(0,Math.min(100,parseInt(el.value,10)||0));
    if(e.type==='change'){v=Math.round(v/5)*5;el.value=v}else if(el.value!==''&&+el.value>100)el.value=100}
  setPath(S,f,v);markChanged();
  if(el.dataset.live!=null){var tx=document.querySelector('#ci_'+el.dataset.live+' .txt');if(tx)tx.textContent=v||'';}
  if(e.type==='change'&&/^threads\.\d+\.items\.\d+\.(n|t|dur|ph\.l)$/.test(f)){renderCpv();return}
  if(e.type==='change'&&(el.type==='checkbox'||(el.tagName==='SELECT'&&/^threads\.\d+\.app$/.test(f))))renderEditor();
}

/* ---------- settings ---------- */
var setSec='',armDel=null,armAcct=false,armWipe=false,shareOpen=null,showKey=false;
/* real full screen (iPad/desktop): hides the browser's own clock and battery so only the phone's settings show */
function fsAvail(){var d=document.documentElement;return !!(d.requestFullscreen||d.webkitRequestFullscreen)}
function fsOn(){return !!(document.fullscreenElement||document.webkitFullscreenElement)}
function fsToggle(){var d=document.documentElement;try{if(fsOn()){(document.exitFullscreen||document.webkitExitFullscreen).call(document)}else{var r=(d.requestFullscreen||d.webkitRequestFullscreen).call(d);if(r&&r.catch)r.catch(function(){flashSet('이 브라우저에서는 전체 화면을 켤 수 없어요.')})}}catch(e){flashSet('이 브라우저에서는 전체 화면을 켤 수 없어요.')}}
function openSettings(sec){setSec=sec||'';closeSheet();if($('#set').hidden){$('#set').hidden=false;$('#setBg').hidden=false;hpush('set')}renderSettings();
  if(Cloud.user&&!cloudList)refreshCloudList();
  setTimeout(function(){var t=sec&&$('#set_'+sec);if(t)t.scrollIntoView({block:'start'})},30)}
function closeSettings(fromHist){if($('#set').hidden)return;if(!fromHist&&hback('set'))return;$('#set').hidden=true;$('#setBg').hidden=true;shareOpen=null;armDel=null;armAcct=false;armWipe=false}
function fmtTime(ms){var d=new Date(ms),now=new Date();if(d.toDateString()===now.toDateString())return '오늘 '+String(d.getHours()).padStart(2,'0')+':'+String(d.getMinutes()).padStart(2,'0');return (d.getMonth()+1)+'월 '+d.getDate()+'일'}
function mergedStories(){
  var map={};Lib.metas.forEach(function(m){map[m.id]=Object.assign({local:true},m)});
  arr(cloudList).forEach(function(c){var m=map[c.id]||{};map[c.id]=Object.assign({},c,m,{cloud:true,public:c.public,listed:c.listed,local:!!m.local,updatedAt:Math.max(m.updatedAt||0,c.updatedAt||0)})});
  return Object.keys(map).map(function(k){return map[k]}).sort(function(a,b){return b.updatedAt-a.updatedAt});
}
function aiSecHtml(player){var h='<div class="sec" id="set_ai"><h3>'+(player?'내 API 키 (AI 답장)':'내 API 키 · AI')+'</h3>';
  if(aiMode()==='preview')h+='<p class="enote">'+esc(window.PHONE_AI_OVERRIDE.note||'')+'</p>';
  else if(CFG.aiProxy)h+='<p class="enote">'+(player?'인물들이 자동으로 답장해요. 따로 설정할 건 없어요.':'이 사이트는 서버를 통해 Gemini에 연결돼요. 따로 키를 넣지 않아도 돼요.')+'</p>';
  else if(!CFG.allowUserKey)h+='<p class="enote">이 사이트는 AI 기능을 꺼 두었어요.</p>';
  else{
    h+='<p class="enote">'+(player?'폰 속 인물들과 대화하려면 내 Gemini API 키가 필요해요. 무료로 만들 수 있어요. 키가 없어도 폰은 그대로 둘러볼 수 있어요.':'AI 기능은 각자 자기 Gemini API 키로 써요. 배포한 폰을 보는 사용자도 각자 자기 키를 등록해요. 내 키는 배포 데이터에 들어가지 않아서 사용자에게 공유되지 않아요.')+'</p>';
    h+=F('Gemini API 키','<div class="copyrow"><input type="'+(showKey?'text':'password')+'" id="aiKey" value="'+esc(AIS.key)+'" placeholder="키를 붙여넣어 주세요" autocomplete="off" spellcheck="false"><button class="btn sm" data-t="toggleKey">'+(showKey?'숨기기':'보기')+'</button>'+(AIS.key?'<button class="btn sm danger" data-t="clearKey">지우기</button>':'')+'</div>','<a class="hlink2" href="https://aistudio.google.com/apikey" target="_blank" rel="noopener noreferrer">Google AI Studio에서 무료 API 키 만들기 ↗</a> 키는 이 기기에 저장되고, Google로 로그인했다면 내 계정에도 저장돼서 다른 기기에서도 그대로 쓸 수 있어요. 키는 Google에만 보내져요. 무료 등급에서는 보낸 내용이 Google 서비스 개선에 쓰일 수 있어요.');
  }
  h+='<div class="row"><button class="btn sm" data-t="aiTest">연결 확인</button>'+(aiMode()?'<span class="status-dot on">'+(CFG.aiProxy?'연결됨':'키 입력됨')+'</span>':'<span class="status-dot">연결 안 됨</span>')+(aiTestMsg?'<span class="enote">'+esc(aiTestMsg)+'</span>':'')+'</div></div>';
  return h}
function notifSecHtml(){return '<div class="sec" id="set_notif"><h3>알림</h3><p class="enote">메시지가 오면 폰 위쪽에 알림 배너가 떠요. 앱 안에서 어느 화면에 있어도 보여요.</p>'+
    '<label class="ck"><input type="checkbox" id="optSound"'+(soundOn?' checked':'')+'> 알림 소리 켜기</label>'+
    '<div class="row"><button class="btn sm" data-t="sysNotif"'+(sysNotifyOk()?' disabled':'')+'>'+(sysNotifyOk()?'시스템 알림 켜짐':'시스템 알림 허용하기')+'</button><button class="btn sm" data-t="testNotif">알림 미리 듣기</button></div>'+
    '<p class="enote">시스템 알림은 이 페이지가 열려 있지만 다른 탭이나 앱에 가 있을 때 기기 알림으로 와요. 아이폰·아이패드는 Safari 공유 버튼 › "홈 화면에 추가"로 설치해야 해요. 페이지를 완전히 닫으면 알림은 오지 않고, 다시 열 때 그동안 온 메시지가 한꺼번에 도착해요.</p></div>'}
function themeSecHtml(){return '<div class="sec" id="set_theme"><div class="row between"><h3>테마</h3><span class="segm" role="group" aria-label="테마">'+[['system','시스템'],['light','라이트'],['dark','다크']].map(function(x){return '<button class="'+(themePref===x[0]?'on':'')+'" data-t="theme" data-v="'+x[0]+'">'+x[1]+'</button>'}).join('')+'</span></div><p class="enote">폰 안의 앱 화면도 같은 테마를 따라가요.</p><p class="enote" style="opacity:.6">Snoop 버전 '+APP_VER+'</p></div>'}
function renderSettings(){
  if(!$('#set')||$('#set').hidden)return;
  var b=$('#setBody'),st=b.scrollTop,h='';
  if(playerMode){b.innerHTML=aiSecHtml(true)+notifSecHtml()+themeSecHtml();b.scrollTop=st;return}
  // account
  h+='<div class="sec" id="set_account"><h3>계정</h3>';
  if(!Cloud.cfg())h+='<p class="enote">이 사이트에는 아직 로그인 기능이 설정되지 않았어요. 지금은 만든 폰이 이 기기에만 저장돼요. 사이트 주인이 config.js에 Firebase 정보를 넣으면 Google 로그인과 공유 링크를 쓸 수 있어요.</p>';
  else if(!Cloud.ready)h+='<p class="enote">로그인 기능을 불러오는 중…</p>';
  else if(!Cloud.on)h+='<p class="enote">'+esc(Cloud.err||'로그인 기능을 쓸 수 없어요.')+'</p>';
  else if(!Cloud.user&&/KAKAOTALK|Instagram|FBAN|FBAV|NAVER\(|Line\//i.test(navigator.userAgent))h+='<p class="enote" style="color:var(--danger)">카카오톡·인스타그램 같은 앱 안의 브라우저에서는 Google이 로그인을 막아요. 오른쪽 위 메뉴(⋮ 또는 공유)에서 Safari나 Chrome 같은 다른 브라우저로 열어 주세요.</p>';
  else if(!Cloud.user)h+='<p class="enote">로그인하면 만든 폰이 계정에 저장되고, 다른 기기에서도 이어서 만들고, 링크로 공유할 수 있어요.</p><div class="row"><button class="gbtn" data-t="login"><svg width="18" height="18" viewBox="0 0 48 48"><path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z"/><path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/><path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z"/><path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z"/></svg>Google로 로그인</button></div>'+(Cloud.err?'<p class="enote" style="color:var(--danger)">'+esc(Cloud.err)+'</p>':'');
  else{var u=Cloud.user;h+='<div class="acct">'+(u.photoURL?'<img src="'+esc(u.photoURL)+'" alt="" referrerpolicy="no-referrer">':'<span class="ph-av"></span>')+'<div><b>'+esc(u.displayName||'이름 없음')+' <span class="bdg pub">'+(isSuper()?'총관리자':'관리자')+'</span></b><small>'+esc(u.email||'')+'</small></div><button class="btn sm" data-t="logout">로그아웃</button></div>'}
  h+='</div>';
  if(isSuper()){
    h+='<div class="sec" id="set_super"><div class="row between"><h3>총관리자</h3><button class="btn sm" data-t="loadAll">'+(allPlays?'새로고침':'전체 배포 보기')+'</button></div><p class="enote">모든 관리자가 배포한 폰이에요. 문제가 있는 폰은 둘러보기에서 내리거나 배포를 중단할 수 있어요.</p>';
    if(allPlays){var own={};allPlays.forEach(function(m){own[m.owner]=1});
      h+='<p class="enote">관리자 '+Object.keys(own).length+'명 · 배포 '+allPlays.length+'개 · 둘러보기 '+allPlays.filter(function(m){return m.listed}).length+'개</p><div class="list">'+(allPlays.map(function(m){
        return '<div class="story-row"><span class="sw-mini" style="background:'+(WALLS[m.wall]||WALLS.dusk)+'"></span><div class="info"><b>'+esc(m.title)+'</b><small>'+esc(m.ownerName||'이름 없음')+(m.ownerEmail?' · '+esc(m.ownerEmail):'')+'</small><small>'+fmtTime(m.updatedAt)+'</small><div class="badges">'+(m.listed?'<span class="bdg pub">둘러보기</span>':'<span class="bdg">링크만</span>')+'</div></div><div class="acts"><a class="btn sm" href="'+esc(playUrl(m.id))+'">열기</a><button class="btn sm" data-t="supList" data-id="'+esc(m.id)+'" data-v="'+(m.listed?'0':'1')+'">'+(m.listed?'둘러보기 내리기':'둘러보기 올리기')+'</button><button class="btn sm danger" data-t="supDel" data-id="'+esc(m.id)+'">'+(armSup===m.id?'정말 중단':'배포 중단')+'</button></div></div>'}).join('')||'<p class="empty">아직 배포된 폰이 없어요.</p>')+'</div>'}
    h+='</div>'}
  // my phones
  var list=mergedStories();
  h+='<div class="sec" id="set_mine"><div class="row between"><h3>내가 만든 폰 '+list.length+'</h3><span class="row"><button class="btn sm primary" data-t="newBlank">+ 빈 폰</button><button class="btn sm" data-t="newEx">+ 예시로 시작</button></span></div>';
  if(Cloud.user&&cloudList===null)h+='<p class="enote">계정에 저장된 폰을 불러오는 중…</p>';
  h+='<div class="list">'+list.map(function(m){
    var cur=m.id===S.id,pl=myPlays&&myPlays[m.id],stale=pl&&(m.updatedAt||0)>pl.updatedAt+3000,badges=(m.local?'<span class="bdg">이 기기</span>':'')+(m.cloud?'<span class="bdg">계정</span>':'')+(pl?'<span class="bdg pub">배포 중'+(pl.listed?' · 둘러보기':'')+'</span>':'')+(stale?'<span class="bdg">수정 후 미배포</span>':'')+(m.public?'<span class="bdg">예전 공유 링크</span>':'')+(cur?'<span class="bdg pub">지금 보는 폰</span>':'');
    var acts=(cur?'':'<button class="btn sm" data-t="open" data-id="'+esc(m.id)+'">열기</button>')+'<button class="btn sm" data-t="share" data-id="'+esc(m.id)+'">배포</button><button class="btn sm danger" data-t="del" data-id="'+esc(m.id)+'">'+(armDel===m.id?'정말 삭제':'삭제')+'</button>';
    var share='';
    if(shareOpen===m.id){
      if(publishing===m.id)share='<p class="enote">배포하는 중… 잠시만 기다려 주세요.</p>';
      else if(Cloud.cfg()&&Cloud.user&&!myPlays)share='<p class="enote">배포 정보를 불러오는 중…</p>';
      else if(!Cloud.cfg())share='<p class="enote">링크 공유는 사이트에 로그인 기능이 설정돼야 쓸 수 있어요. 지금은 파일로 내보내서 보낼 수 있어요.</p>';
      else if(!Cloud.user)share='<p class="enote">배포하려면 먼저 위에서 Google로 로그인해 주세요.</p>';
      else if(pl)share='<p class="enote">이 링크로 들어온 사람은 폰 화면만 보고 대화할 수 있어요. 꾸미기·시스템·설정은 보이지 않아요.</p><div class="copyrow"><input readonly value="'+esc(playUrl(m.id))+'" id="shareUrl_'+esc(m.id)+'" aria-label="플레이 링크"><button class="btn sm primary" data-t="copy" data-id="'+esc(m.id)+'">복사</button></div><div class="row"><button class="btn sm'+(stale?' primary':'')+'" data-t="publish" data-id="'+esc(m.id)+'">'+(stale?'고친 내용 다시 배포':'다시 배포')+'</button><a class="btn sm" href="'+esc(playUrl(m.id))+'" target="_blank" rel="noopener">플레이 화면 열기</a><button class="btn sm ghost danger" data-t="unpublish" data-id="'+esc(m.id)+'">배포 중단</button></div><p class="enote">다시 배포하면 이미 보던 사람도 새 버전으로 처음부터 다시 시작해요.</p>';
      else share='<p class="enote">배포하면 플레이 링크가 생겨요. 링크로 들어온 사람은 폰 화면만 즐길 수 있고, 꾸미기·시스템·설정은 볼 수 없어요. 배포한 뒤 고친 내용은 다시 배포해야 반영돼요.</p><div class="row"><button class="btn sm primary" data-t="publish" data-id="'+esc(m.id)+'">배포하기</button></div>';
      if(Cloud.user&&m.public)share+='<p class="enote">예전 방식의 공유 링크가 아직 켜져 있어요.</p><div class="row"><button class="btn sm ghost danger" data-t="unshare" data-id="'+esc(m.id)+'">예전 공유 링크 끄기</button></div>';
      share='<div class="mcard" style="margin-top:-2px">'+share+'</div>';
    }
    return '<div class="story-row'+(cur?' cur':'')+'"><span class="sw-mini" style="background:'+(WALLS[m.wall]||WALLS.dusk)+'"></span><div class="info"><b>'+esc(m.title||'제목 없음')+'</b><small>'+esc(m.name||'')+' · '+fmtTime(m.updatedAt||Date.now())+'</small>'+(m.concept?'<small>컨셉: '+esc(m.concept.slice(0,60))+'</small>':'')+'<div class="badges">'+badges+'</div></div><div class="acts">'+acts+'</div></div>'+share;
  }).join('')+'</div></div>';
  h+=aiSecHtml(false)+notifSecHtml()+themeSecHtml();
  // danger
  h+='<div class="sec" id="set_danger"><h3>데이터 · 계정 삭제</h3><div class="danger-zone">'+
    '<div><b>이 기기의 데이터 지우기</b><p class="enote">이 브라우저에 저장된 폰 목록과 AI 키를 모두 지워요. 계정에 저장된 폰은 남아 있어요.</p></div><div class="row"><button class="btn sm danger" data-t="wipe">'+(armWipe?'한 번 더 누르면 지워져요':'이 기기 데이터 지우기')+'</button></div>'+
    (Cloud.user?'<div><b>계정 탈퇴</b><p class="enote">계정에 저장된 폰과 공유 링크가 모두 삭제되고, 로그인 정보도 지워져요. 되돌릴 수 없어요.</p></div><div class="row"><button class="btn sm danger" data-t="delAcct">'+(armAcct?'정말 탈퇴할게요':'계정 탈퇴')+'</button></div>':'')+
    '</div></div>';
  b.innerHTML=h;b.scrollTop=st;
}
function setAction(d,el){
  switch(d.t){
    case 'close':closeSettings();break;
    case 'fs':fsToggle();break;
    case 'sysNotif':if(!('Notification' in window)){flashSet('이 브라우저는 시스템 알림을 지원하지 않아요.',true);break}Notification.requestPermission().then(function(r){renderSettings();flashSet(r==='granted'?'시스템 알림을 켰어요.':'알림이 허용되지 않았어요. 브라우저 설정에서 허용해 주세요.',r!=='granted')});break;
    case 'testNotif':playDing(true);var tt=S.threads[0];if(tt&&sysNotifyOk()&&document.hidden)systemNotify(tt,'알림 미리 듣기');else if(tt)showBanner(tt,'알림이 이렇게 보여요');break;
    case 'restart':if(document.activeElement&&document.activeElement.blur)document.activeElement.blur();askConfirm({title:'처음부터 다시 시작할까요?',msg:'이전 대화 기록이 모두 사라져요. 폰 꾸미기에서 고친 내용은 그대로 반영되고, 되돌릴 수 없어요.',ok:'모두 지우고 시작'},function(){applyRestart()});break;
    case 'login':Cloud.err='';Cloud.signIn().then(function(){renderSettings()},function(e){Cloud.err=fbMsg(e);renderSettings()});break;
    case 'logout':Cloud.signOut();break;
    case 'newBlank':case 'newEx':saveLocal();(d.t==='newBlank'?Promise.resolve(blankStory()):(flashSet('예시를 불러오는 중…'),exampleStoryAsync())).then(switchTo).then(function(){closeSettings();setTimeout(function(){openEditor(d.t==='newBlank'?'basic':'ai')},80)});break;
    case 'open':openStory(d.id);break;
    case 'share':if(shareOpen===d.id){shareOpen=null;renderSettings();break}openShare(d.id);break;
    case 'publish':A_publish(d.id);break;
    case 'unpublish':askConfirm({title:'배포를 중단할까요?',msg:'플레이 링크가 더 이상 열리지 않고, 둘러보기에서도 사라져요. 이 폰 자체는 그대로 남아요.',ok:'배포 중단'},function(){Cloud.unpublish(d.id).then(function(){refreshCloudList();flashSet('배포를 중단했어요.')},function(e){flashSet(fbMsg(e))})});break;
    case 'loadAll':Cloud.listAllPlays().then(function(a){allPlays=a;renderSettings()},function(e){flashSet(fbMsg(e))});break;
    case 'supList':Cloud.setPlay(d.id,{listed:d.v==='1'}).then(function(){allPlays.forEach(function(m){if(m.id===d.id)m.listed=d.v==='1'});renderSettings()},function(e){flashSet(fbMsg(e))});break;
    case 'supDel':if(armSup!==d.id){armSup=d.id;renderSettings();break}armSup=null;Cloud.unpublish(d.id).then(function(){allPlays=allPlays.filter(function(m){return m.id!==d.id});renderSettings();flashSet('배포를 중단했어요.')},function(e){flashSet(fbMsg(e))});break;
    case 'makeLink':ensureCloud(d.id).then(function(){return Cloud.setShare(d.id,{public:true})}).then(function(){refreshCloudList()},function(e){flashSet(fbMsg(e))});break;
    case 'unshare':Cloud.setShare(d.id,{public:false,listed:false}).then(refreshCloudList,function(e){flashSet(fbMsg(e))});break;
    case 'copy':var inp2=$('#shareUrl_'+d.id);var url=inp2?inp2.value:shareUrl(d.id);
      try{navigator.clipboard.writeText(url).then(function(){el.textContent='복사됨'},function(){inp2.select()})}catch(e){if(inp2)inp2.select()}break;
    case 'del':if(armDel!==d.id){armDel=d.id;renderSettings();break}armDel=null;deleteStory(d.id);break;
    case 'exportOne':Lib.get(d.id).then(function(x){if(x)download('phone-story.json',JSON.stringify(x))});break;
    case 'exportCur':exportStory();break;
    case 'import':upKind='json';var fj=$('#edFile');fj.accept='.json,application/json';fj.multiple=false;fj.click();break;
    case 'loadExplore':Cloud.explore().then(function(a){exploreList=a;renderSettings()},function(e){flashSet(fbMsg(e))});break;
    case 'toggleKey':showKey=!showKey;renderSettings();break;
    case 'clearKey':AIS.key='';saveAIS();aiTestMsg='';renderSettings();renderSide();break;
    case 'aiTest':runKeyTest();break;
    case 'theme':themePref=d.v;try{localStorage.setItem(THEME_KEY,themePref)}catch(e){}applyTheme();renderSettings();break;
    case 'wipe':if(!armWipe){armWipe=true;renderSettings();break}armWipe=false;Store.clear().then(function(){try{['phone-cur','phone-ai-v1'].forEach(function(k){localStorage.removeItem(k)})}catch(e){}Store.del('ai');AIS={key:'',textModel:'',imageModel:'',images:false};Lib.metas=[];return exampleStoryAsync().then(function(d){return switchTo(d)})}).then(function(){renderSettings();flashSet('이 기기의 데이터를 지웠어요.')});break;
    case 'delAcct':if(!armAcct){armAcct=true;renderSettings();break}armAcct=false;flashSet('계정을 삭제하는 중…');Cloud.deleteAccount().then(function(){cloudList=null;flashSet('계정을 삭제했어요. 이 기기에 있는 폰은 남아 있어요.');renderSettings()},function(e){flashSet(fbMsg(e))});break;
  }
}
var keyTestT=null,keyTestN=0;
function runKeyTest(){if(!aiMode()){aiTestMsg='먼저 키를 넣어 주세요.';renderSettings();return}var n=++keyTestN;aiTestMsg='확인 중…';renderSettings();
  AI.text('연결 확인입니다. "확인"이라고만 답하세요.').then(function(){if(n===keyTestN)aiTestMsg='정상이에요'},function(e){if(n===keyTestN)aiTestMsg=aiErrMsg(e)}).then(function(){if(n===keyTestN){renderSettings();renderSide()}})}
function flashSet(msg){var el=$('#setStatus');if(el){el.textContent=msg;clearTimeout(el._t);el._t=setTimeout(function(){el.textContent=''},8000)}}
function onSetInput(e){var el=e.target;
  if(el.id==='aiKey'){var nk=el.value.trim();if(nk===AIS.key)return;AIS.key=nk;saveAIS();aiTestMsg='';renderSide();
    clearTimeout(keyTestT);if(nk.length>=30)keyTestT=setTimeout(function(){if(AIS.key===nk)runKeyTest()},700);return}
  if(el.id==='optSound'){soundOn=el.checked;try{localStorage.setItem('phone-sound',soundOn?'1':'0')}catch(x){}if(soundOn)playDing(true);return}
  if(el.id==='aiImages'){AIS.images=el.checked;saveAIS();renderSettings();return}
  if(el.id==='aiImgModel'){AIS.imageModel=el.value.trim();saveAIS();return}
  if(el.dataset.t==='plListed'&&e.type==='change'){Cloud.setPlay(el.dataset.id,{listed:el.checked}).then(refreshCloudList,function(x){flashSet(fbMsg(x))});return}
  if(el.dataset.t==='listed'&&e.type==='change'){Cloud.setShare(el.dataset.id,{listed:el.checked}).then(refreshCloudList,function(x){flashSet(fbMsg(x))})}
}
function ensureCloud(id){if(!Cloud.user)return Promise.reject({code:'login'});
  var p=id===S.id?saveLocal().then(function(){return snapshot()}):Lib.get(id);
  return p.then(function(data){if(!data)return;return Cloud.push(normalize(data)).then(function(){if(id===S.id){cloudAt=new Date();updateFoot()}})})}
function openStory(id){
  saveLocal();
  var local=Lib.has(id)?Lib.get(id):Promise.resolve(null);
  local.then(function(d){if(d)return d;if(!Cloud.user)throw {code:'not_found'};return Cloud.fetch(id).then(function(r){return r.story})})
    .then(function(d){return switchTo(d)}).then(function(){closeSettings();flash('폰을 열었어요.')},function(e){flashSet(fbMsg(e))});
}
function deleteStory(id){
  var cm=arr(cloudList).some(function(c){return c.id===id});
  Promise.all([Lib.has(id)?Lib.del(id):null,cm&&Cloud.user?Cloud.remove(id).catch(function(e){flashSet(fbMsg(e))}):null]).then(function(){
    if(cloudList)cloudList=cloudList.filter(function(c){return c.id!==id});
    if(id===S.id){var next=Lib.metas[0];(next?Lib.get(next.id):Promise.resolve(null)).then(function(d){return d||exampleStoryAsync()}).then(function(d){return switchTo(d)}).then(renderSettings)}else renderSettings();
    flashSet('삭제했어요.');
  });
}

/* ---------- boot ---------- */
var GEAR='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 00.3 1.8l.1.1a2 2 0 11-2.8 2.8l-.1-.1a1.7 1.7 0 00-1.8-.3 1.7 1.7 0 00-1 1.5V21a2 2 0 11-4 0v-.1a1.7 1.7 0 00-1.1-1.5 1.7 1.7 0 00-1.8.3l-.1.1a2 2 0 11-2.8-2.8l.1-.1a1.7 1.7 0 00.3-1.8 1.7 1.7 0 00-1.5-1H3a2 2 0 110-4h.1a1.7 1.7 0 001.5-1.1 1.7 1.7 0 00-.3-1.8l-.1-.1a2 2 0 112.8-2.8l.1.1a1.7 1.7 0 001.8.3H9a1.7 1.7 0 001-1.5V3a2 2 0 114 0v.1a1.7 1.7 0 001 1.5 1.7 1.7 0 001.8-.3l.1-.1a2 2 0 112.8 2.8l-.1.1a1.7 1.7 0 00-.3 1.8V9a1.7 1.7 0 001.5 1H21a2 2 0 110 4h-.1a1.7 1.7 0 00-1.5 1z"/></svg>';
function build(){
  $('#root').innerHTML='<div class="stage" id="stage"><div class="devwrap" id="devwrap"><div class="device" id="device"><div class="phone" id="phone" data-tone="light" data-scheme="light"><div class="sb" id="sb"></div><div class="layer" id="layer"></div><button class="hb" id="hb" aria-label="홈으로"><i></i></button><div class="ptoast" id="ptoast" role="status"></div></div></div></div><aside class="side" id="side"></aside></div>'+
    '<button class="mbtn" id="mbtn" aria-label="상황 설명과 메뉴">≡</button>'+
    '<div class="ed" id="ed" hidden role="dialog" aria-label="폰 꾸미기"><div class="ed-head"><h2>폰 꾸미기</h2><button class="icon-btn" data-e="openSet" aria-label="설정">'+GEAR+'</button><button class="btn sm" id="edGo" data-e="leave">닫기</button></div><div class="ed-note" id="edNote" hidden>지금은 대화 중이라 폰은 그대로예요. 여기서 고친 내용은 위의 [처음부터 시작]을 눌러야 반영돼요.</div><nav class="ed-tabs" id="edTabs"></nav><div class="ed-body" id="edBody"></div><div class="ed-foot"><span class="st" id="edStatus" role="status"></span><button class="btn sm" data-e="export">내보내기</button></div></div>'+
    '<div class="set-bg" id="setBg" hidden></div><div class="set" id="set" hidden role="dialog" aria-label="설정"><div class="ed-head"><h2>설정</h2><button class="btn sm" data-t="close">닫기</button></div><div class="ed-body" id="setBody"></div><div class="ed-foot"><span class="st" id="setStatus" role="status"></span></div></div>'+
    '<input type="file" id="edFile" hidden>';
  layerEl=$('#layer');phoneEl=$('#phone');
  phoneEl.addEventListener('click',function(e){var a=e.target.closest('[data-a]');if(!a||!phoneEl.contains(a)){if(top()&&top().s==='lock'&&!e.target.closest('.sb'))unlockFlow();return}var f=A[a.dataset.a];if(f)f(a.dataset,a,e)});
  var y0=null;layerEl.addEventListener('pointerdown',function(e){y0=e.clientY});layerEl.addEventListener('pointerup',function(e){if(y0!=null&&e.clientY-y0<-60&&top().s==='lock')unlockFlow();y0=null});
  $('#hb').addEventListener('click',function(){if(!unlocked){if(top().s==='lock')unlockFlow();return}goHome()});
  $('#mbtn').addEventListener('click',openInfo);
  document.addEventListener('click',function(e){var s=e.target.closest('[data-s]');if(!s)return;var k=s.dataset.s;
    if(k==='edit')openEditor('basic');else if(k==='ai')openEditor('ai');else if(k==='settings')openSettings();else if(k==='relock'){closeSheet();if(playerMode)askConfirm({title:'처음부터 다시 볼까요?',msg:'지금까지 나눈 대화가 지워지고 처음 상태로 돌아가요.',ok:'처음부터 보기'},playerRestart);else if(viewMode)relock();else{restartStory();toast('처음부터 다시 시작했어요')}}else if(k==='closeSheet')closeSheet();else if(k==='keydlg'){closeSheet();openKeyDlg()}
    else if(k==='copy'){var d=snapshot(),own=viewInfo&&Cloud.user&&viewInfo.owner===Cloud.user.uid;d.id=own?S.id:newId();if(!own){d.system={};d.scenario.cast=''}Lib.load().then(function(){return Lib.put(normalize(d))}).then(function(){setCur(d.id);location.href=location.pathname})}});
  var ed=$('#ed');ed.addEventListener('click',function(e){var b=e.target.closest('[data-e]');if(b&&ed.contains(b)&&!b.disabled)edAction(b.dataset,b)});
  ed.addEventListener('input',onEdInput);ed.addEventListener('change',function(e){if(e.target.type==='date'||e.target.tagName==='SELECT'||e.target.type==='checkbox'||e.target.dataset.ping||e.target.dataset.f==='owner.time')onEdInput(e)});
  ed.addEventListener('keydown',function(e){if(e.key==='Enter'&&e.target.dataset&&(e.target.dataset.ping||e.target.dataset.f==='owner.time')){e.preventDefault();e.target.blur()}});
  ed.addEventListener('keydown',function(e){if(e.key!=='Enter'||e.isComposing||e.keyCode===229)return;if(e.target.id==='cpIn'){e.preventDefault();say(composeSide);return}if(e.target.id==='memAdd'){e.preventDefault();addMember();return}if(e.target.id==='add_sysname'){e.preventDefault();edAction({e:'sysAdd'});return}if(e.target.id==='rel_desc'){e.preventDefault();edAction({e:'relAdd'});return}if(e.target.id==='cpTime'){e.preventDefault();var ci=$('#cpIn');if(ci)ci.focus();return}var box=e.target.closest('[data-add]');if(!box||e.target.tagName==='TEXTAREA')return;e.preventDefault();var k=box.dataset.add;if(LISTS[k].add()){markChanged();renderList(k)}});
  ['fullscreenchange','webkitfullscreenchange'].forEach(function(n){document.addEventListener(n,function(){layout();if(!$('#set').hidden)renderSettings()})});
  var st=$('#set');st.addEventListener('click',function(e){var b=e.target.closest('[data-t]');if(b&&st.contains(b)&&b.type!=='checkbox')setAction(b.dataset,b)});
  st.addEventListener('input',onSetInput);st.addEventListener('change',onSetInput);
  $('#setBg').addEventListener('click',function(){closeSettings()});
  $('#edFile').addEventListener('change',function(e){var fs=e.target.files;if(upKind==='json'){if(fs[0])importStory(fs[0])}else onFiles(fs);e.target.value=''});
  addEventListener('resize',layout);
  document.addEventListener('visibilitychange',function(){if(document.hidden)touchSeen();else setTimeout(catchUp,300)});
  addEventListener('pagehide',touchSeen);
  try{if('serviceWorker' in navigator){navigator.serviceWorker.addEventListener('message',function(e){var d=e.data||{};var t=d.tid&&thr(d.tid);if(t)openThreadFresh(t)});
    navigator.serviceWorker.register('sw.js').then(function(r){swReg=r},function(){})}}catch(e){}
  document.addEventListener('keydown',function(e){if(e.key!=='Escape')return;if($('#dlg')){closeDlg();return}if($('#sheet')){closeSheet();return}if(!$('#set').hidden){closeSettings();return}var tg=e.target;if(tg&&(tg.tagName==='INPUT'||tg.tagName==='TEXTAREA'||tg.tagName==='SELECT'))return;if(!$('#ed').hidden&&$('#ed').contains(tg))return;if(unlocked)A.back()});
}
function startPhone(){if(!playerMode||S.owner.name)maybeAskKey();loadBase();startPings();setTimeout(catchUp,1200);layout();renderStatus();reset('lock');renderSide();if(document.body.classList.contains('full'))setTimeout(function(){toast(playerMode?'위쪽 검은 섬을 누르면 설명과 설정이 나와요':'위쪽 검은 섬을 누르면 상황 설명이 나와요')},900)}
function boot(){
  build();applyTheme();
  var q=new URLSearchParams(location.search),p=q.get('p'),s=q.get('s');
  var cloudP=Cloud.init();
  Store.get('ai').then(function(a){
    if(a&&a.key&&!AIS.key){Object.assign(AIS,a);AIS.images=false;try{localStorage.setItem(AI_KEY,JSON.stringify(AIS))}catch(e){}}
    else if(AIS.key&&!(a&&a.key))Store.set('ai',JSON.parse(JSON.stringify(AIS)))
  }).catch(function(){}).then(function(){return Lib.load()}).then(function(){
    if(Lib.metas.length)return;
    return Store.get('story').then(function(old){if(old&&old.owner){old.id=old.id||newId();return Lib.put(normalize(old)).then(function(){setCur(old.id);return Store.del('story')})}});
  }).then(function(){
    var pl=q.get('play'),src=null;
    if(pl&&/^[\w-]{1,80}$/.test(pl))src={key:pl,load:function(){return cloudP.then(function(ok){if(!ok)throw {code:'unavailable'};return Cloud.fetchPlay(pl)})}};
    else if(p&&/^[\w-]{1,80}$/.test(p))src={key:'p-'+p,load:function(){return cloudP.then(function(ok){if(!ok)throw {code:'unavailable'};return Cloud.fetch(p)}).then(function(r){r.info.version=1;return r})}};
    else if(s&&/^[\w-]{1,80}$/.test(s))src={key:'s-'+s,load:function(){return fetch('stories/'+s+'.json',{cache:'no-cache'}).then(function(r){if(!r.ok)throw {code:'not_found'};return r.json()}).then(function(j){return {story:j,info:{version:1}}})}};
    if(src){playerMode=true;viewMode=true;canEdit=false;playKey=src.key;document.body.classList.add('player');
      S=normalize(blankStory());S.id='pl-'+playKey;S.owner.name='';S.scenario.title='불러오는 중…';startPhone();
      return src.load().then(function(r){viewInfo=r.info;pubVer=r.info.version||0;pubStory=r.story;
        return Store.get('play:'+playKey).then(function(sv){
          var d=JSON.parse(JSON.stringify(r.story));
          if(sv&&sv.version===pubVer&&sv.story){d=sv.story;d.images=r.story.images||{}}
          else if(sv){try{localStorage.removeItem('phone-run:pl-'+playKey);localStorage.removeItem('phone-seen:pl-'+playKey)}catch(e){}Store.del('play:'+playKey);setTimeout(function(){toast('새 버전이라 처음부터 시작해요')},1600)}
          d.id='pl-'+playKey;return d})},
        function(e){S.scenario.title='폰을 열 수 없어요';S.scenario.text=e&&e.code==='not_found'?'배포가 중단됐거나 링크가 잘못됐어요.':fbMsg(e);renderSide();toast(S.scenario.text);return 'stop'});
    }
    return null;
  }).then(function(d){
    if(d==='stop')return;
    if(d){S=normalize(d);if(!S.id)S.id=newId();startPhone();return}
    var cur=getCur(),id=cur&&Lib.has(cur)?cur:(Lib.metas[0]&&Lib.metas[0].id);
    return (id?Lib.get(id):Promise.resolve(null)).then(function(x){return x?{d:x,saved:true}:exampleStoryAsync().then(function(d){return {d:d}})}).then(function(r){
      S=normalize(r.d);if(!S.id)S.id=newId();setCur(S.id);startPhone();
      if(!r.saved)saveLocal();
    });
  });
}
boot();
})();
