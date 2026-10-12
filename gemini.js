// Vercel 서버리스 함수: /api/gemini
// Vercel 프로젝트 설정 > Environment Variables 에 GEMINI_API_KEY 를 넣고,
// config.js 의 aiProxy 를 '/api/gemini' 로 바꾸세요.
// (선택) GEMINI_MODELS, GEMINI_IMAGE_MODELS 로 허용 모델을 바꿀 수 있어요.
// 참고: 이 함수에는 방문자별 요청 제한이 없어요. 사용량이 걱정되면 Google AI Studio에서 한도를 확인하세요.

const list = (v, d) => (v == null ? d : v).split(',').map(s => s.trim()).filter(Boolean);

module.exports = async (req, res) => {
  const ALLOWED = new Set([
    ...list(process.env.GEMINI_MODELS, 'gemini-3.8-flash,gemini-3.5-flash-lite'),
    ...list(process.env.GEMINI_IMAGE_MODELS, '')
  ]);
  const KEY = process.env.GEMINI_API_KEY;
  if (req.method !== 'POST') return res.status(405).json({ error: { message: 'POST만 돼요.' } });
  if (!KEY) return res.status(500).json({ error: { message: '서버에 GEMINI_API_KEY가 설정되지 않았어요.' } });
  let data = req.body;
  if (typeof data === 'string') { try { data = JSON.parse(data); } catch { data = null; } }
  if (!data || !ALLOWED.has(data.model) || typeof data.body !== 'object') return res.status(400).json({ error: { message: '허용되지 않은 모델이에요.' } });
  if (JSON.stringify(data.body).length > 400000) return res.status(413).json({ error: { message: '요청이 너무 커요.' } });
  try {
    const r = await fetch('https://generativelanguage.googleapis.com/v1beta/models/' + encodeURIComponent(data.model) + ':generateContent', {
      method: 'POST', headers: { 'Content-Type': 'application/json', 'x-goog-api-key': KEY }, body: JSON.stringify(data.body)
    });
    res.status(r.status).setHeader('Content-Type', 'application/json; charset=utf-8');
    res.send(await r.text());
  } catch (e) {
    res.status(502).json({ error: { message: 'Gemini 서버에 연결하지 못했어요.' } });
  }
};
