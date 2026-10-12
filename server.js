// 자체 서버용: 사이트 파일을 보여 주고, /api/gemini 로 들어온 요청을 Gemini에 대신 전달해요.
// API 키는 서버에만 있고 방문자에게는 보이지 않아요.
//
// 실행 (Node.js 18 이상, 추가 설치 없음):
//   GEMINI_API_KEY=내키 node server.js
// 그다음 config.js 의 aiProxy 를 '/api/gemini' 로 바꾸세요.
//
// 환경 변수
//   GEMINI_API_KEY   (필수) Google AI Studio에서 만든 키
//   PORT             기본 3000
//   GEMINI_MODELS    허용할 글 모델, 쉼표로 구분 (기본: gemini-3.8-flash,gemini-3.5-flash-lite)
//   GEMINI_IMAGE_MODELS  허용할 이미지 모델 (기본: 비어 있음 = 이미지 생성 막음)
//   RATE_LIMIT       IP 하나가 10분 동안 보낼 수 있는 AI 요청 수 (기본 40)

const http = require('http');
const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const PORT = Number(process.env.PORT) || 3000;
const KEY = process.env.GEMINI_API_KEY || '';
const list = (v, d) => (v == null ? d : v).split(',').map(s => s.trim()).filter(Boolean);
const ALLOWED = new Set([
  ...list(process.env.GEMINI_MODELS, 'gemini-3.8-flash,gemini-3.5-flash-lite'),
  ...list(process.env.GEMINI_IMAGE_MODELS, '')
]);
const LIMIT = Number(process.env.RATE_LIMIT) || 40;
const WINDOW = 10 * 60 * 1000;
const hits = new Map();

const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.svg': 'image/svg+xml', '.ico': 'image/x-icon', '.webp': 'image/webp', '.webmanifest': 'application/manifest+json; charset=utf-8' };
const PUBLIC = /^\/(index\.html|style\.css|app\.js|config\.js|example-data\.js|sw\.js|manifest\.webmanifest|icon-(?:192|512)\.png|stories\/[\w-]+\.json|favicon\.ico)$/;

function send(res, code, body, type) {
  res.writeHead(code, { 'Content-Type': type || 'application/json; charset=utf-8', 'X-Content-Type-Options': 'nosniff' });
  res.end(typeof body === 'string' || Buffer.isBuffer(body) ? body : JSON.stringify(body));
}

function limited(ip) {
  const now = Date.now();
  const arr = (hits.get(ip) || []).filter(t => now - t < WINDOW);
  arr.push(now);
  hits.set(ip, arr);
  return arr.length > LIMIT;
}

async function proxy(req, res) {
  if (!KEY) return send(res, 500, { error: { message: '서버에 GEMINI_API_KEY가 설정되지 않았어요.' } });
  const ip = (req.headers['x-forwarded-for'] || req.socket.remoteAddress || '').split(',')[0].trim();
  if (limited(ip)) return send(res, 429, { error: { message: '요청이 너무 많아요. 잠시 뒤에 다시 해 주세요.' } });
  let size = 0; const chunks = [];
  for await (const c of req) { size += c.length; if (size > 400000) return send(res, 413, { error: { message: '요청이 너무 커요.' } }); chunks.push(c); }
  let data;
  try { data = JSON.parse(Buffer.concat(chunks).toString('utf8')); } catch { return send(res, 400, { error: { message: 'JSON 형식이 아니에요.' } }); }
  if (!data || !ALLOWED.has(data.model) || typeof data.body !== 'object') return send(res, 400, { error: { message: '허용되지 않은 모델이에요.' } });
  try {
    const r = await fetch('https://generativelanguage.googleapis.com/v1beta/models/' + encodeURIComponent(data.model) + ':generateContent', {
      method: 'POST', headers: { 'Content-Type': 'application/json', 'x-goog-api-key': KEY }, body: JSON.stringify(data.body)
    });
    send(res, r.status, await r.text());
  } catch (e) {
    send(res, 502, { error: { message: 'Gemini 서버에 연결하지 못했어요.' } });
  }
}

http.createServer((req, res) => {
  const url = new URL(req.url, 'http://x');
  if (url.pathname === '/api/gemini') {
    if (req.method !== 'POST') return send(res, 405, { error: { message: 'POST만 돼요.' } });
    return proxy(req, res);
  }
  const p = url.pathname === '/' ? '/index.html' : url.pathname;
  if (!PUBLIC.test(p)) return send(res, 404, 'Not found', 'text/plain; charset=utf-8');
  const file = path.join(ROOT, p);
  fs.readFile(file, (err, buf) => {
    if (err) return send(res, 404, 'Not found', 'text/plain; charset=utf-8');
    send(res, 200, buf, TYPES[path.extname(file)] || 'application/octet-stream');
  });
}).listen(PORT, () => console.log('http://localhost:' + PORT + (KEY ? '' : '  (경고: GEMINI_API_KEY 없음)')));
