// 사이트 설정 파일. 보통은 이 파일만 고치면 돼요.
// 주의: 여기에 Gemini API 키를 넣지 마세요. 이 파일은 누구나 볼 수 있어요.
window.PHONE_CONFIG = {
  // ── AI (Gemini) ─────────────────────────────────────────
  // 서버를 거쳐 AI를 부를 때의 주소.
  //  - 비워 두면('') 방문자가 설정 › AI · API 관리에서 각자 Gemini 키를 넣어서 써요.
  //  - server.js 또는 Vercel(api/gemini.js)을 쓰면 '/api/gemini'로 바꾸세요.
  aiProxy: '',
  allowUserKey: true,

  // 무료 등급이 있는 글 모델: gemini-3.8-flash, gemini-3.5-flash-lite
  // 모델 이름은 Google이 종종 바꿔요. 안 되면 https://ai.google.dev/gemini-api/docs/models 에서 확인하세요.
  textModel: 'gemini-3.8-flash',
  textModels: ['gemini-3.8-flash', 'gemini-3.5-flash-lite'],

  // 사진을 실제 이미지로 만들 때 쓰는 모델 (무료 등급 없음, 결제가 연결된 키 필요)
  imageModel: 'gemini-3.1-flash-image',
  allowImages: false, // aiProxy를 쓸 때 방문자에게 이미지 생성을 허용할지

  // ── Google 로그인 · 계정 저장 · 공유 링크 (Firebase) ────────
  // 비워 두면(null) 만든 폰이 각자 기기에만 저장되고, 공유는 파일 내보내기로만 돼요.
  // Firebase 콘솔 › 프로젝트 설정 › 내 앱(웹)에 보이는 firebaseConfig 값을 그대로 붙여 넣으세요.
  // 이 값들은 공개돼도 괜찮아요. 데이터 보호는 firestore.rules가 맡아요.
  firebase: {
    apiKey: 'AIzaSyD2lwhA9swTBUoSoTDYephLli-u0U5W6mY',
    authDomain: 'snoop-97d45.firebaseapp.com',
    projectId: 'snoop-97d45',
    storageBucket: 'snoop-97d45.firebasestorage.app',
    messagingSenderId: '344878971352',
    appId: '1:344878971352:web:1d37ac23c10a53523d1aad'
  },
  // firebase: {
  //   apiKey: 'AIza...',
  //   authDomain: '내프로젝트.firebaseapp.com',
  //   projectId: '내프로젝트',
  //   appId: '1:1234567890:web:abcdef'
  // },
  firebaseVersion: '10.14.1'
};
