/**
 * Chatbot Service — FAQ matching + session status
 */
const db = require('../config/database');

const FAQ_TOPICS = [
  { id: 1, keywords: ['hoc phi', 'phi', 'gia', 'bao nhieu'], answer: 'Hoc phi khoa B2 la 12,000,000 VND, bao gom le phi dang ky (500,000), hoc phi (10,000,000), va le phi thi (1,500,000).' },
  { id: 2, keywords: ['thoi gian', 'bao lau', 'may thang'], answer: 'Khoa hoc B2 keo dai khoang 3-4 thang, bao gom 90 gio ly thuyet va 84 gio thuc hanh.' },
  { id: 3, keywords: ['giay to', 'ho so', 'dang ky', 'can gi'], answer: 'Can: CCCD (ban goc), giay kham suc khoe, 3 anh 3x4, va don dang ky.' },
  { id: 4, keywords: ['lich hoc', 'lich tap', 'thoi khoa bieu'], answer: 'Lich hoc duoc sap xep linh hoat. Ban co the dat lich qua he thong booking tren website.' },
  { id: 5, keywords: ['thi', 'sat hach', 'khi nao thi'], answer: 'Sau khi hoan thanh du so gio ly thuyet va thuc hanh, ban se duoc dang ky thi sat hach tai So GTVT.' },
  { id: 6, keywords: ['huy', 'doi lich', 'cancel'], answer: 'Ban co the huy buoi hoc truoc 24 gio ma khong mat phi. Huy trong vong 24 gio se khong duoc hoan phi.' },
  { id: 7, keywords: ['thanh toan', 'tra gop', 'chuyen khoan'], answer: 'SDS ho tro thanh toan bang tien mat tai van phong hoac chuyen khoan ngan hang.' },
  { id: 8, keywords: ['xe', 'tap lai', 'loai xe'], answer: 'SDS su dung xe tap lai hang B2 (so tu dong va so san) duoc trang bi day du thiet bi DAT.' },
  { id: 9, keywords: ['giao vien', 'thay', 'huong dan'], answer: 'Doi ngu giao vien co chung chi giang day va nhieu nam kinh nghiem. Ban co the chon giao vien khi dat lich.' },
  { id: 10, keywords: ['dia chi', 'o dau', 'van phong'], answer: 'Dia chi SDS: [San tap lai xe, TP.HCM]. Lien he: 0901-000-001.' },
  { id: 11, keywords: ['cabin', 'mo phong'], answer: 'Gio cabin la bat buoc cho khoa B2/C. Ban se thuc hanh tren cabin mo phong truoc khi ra duong.' },
  { id: 12, keywords: ['dat', 'thiet bi dat'], answer: 'Thiet bi DAT ghi lai quang duong va thoi gian thuc hanh. Du lieu DAT la bat buoc de du dieu kien thi.' },
  { id: 13, keywords: ['chung chi', 'bang lai', 'cap bang'], answer: 'Sau khi do sat hach, bang lai se duoc So GTVT cap trong vong 7-10 ngay lam viec.' },
  { id: 14, keywords: ['khieu nai', 'phan anh'], answer: 'Moi khieu nai vui long gui email den support@sds.vn hoac goi 0901-000-001 (gio hanh chinh).' },
  { id: 15, keywords: ['tuoi', 'do tuoi', 'may tuoi'], answer: 'Do tuoi toi thieu: B1 tu 18 tuoi, B2 tu 21 tuoi, C tu 24 tuoi.' },
];

function matchFAQ(message) {
  const lower = message.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  let bestMatch = null;
  let bestScore = 0;

  for (const faq of FAQ_TOPICS) {
    const score = faq.keywords.reduce((s, kw) => s + (lower.includes(kw) ? 1 : 0), 0) / faq.keywords.length;
    if (score > bestScore) { bestScore = score; bestMatch = faq; }
  }

  return { match: bestMatch, confidence: bestScore };
}

async function processMessage(sessionId, message) {
  const { match, confidence } = matchFAQ(message);

  if (confidence >= 0.5 && match) {
    return { reply: match.answer, confidence, faqTopicId: match.id, escalated: false };
  }

  if (confidence >= 0.3 && match) {
    return { reply: match.answer + ' Ban co muon hoi them gi khong?', confidence, faqTopicId: match.id, escalated: false };
  }

  return {
    reply: 'Xin loi, toi chua hieu cau hoi cua ban. Ban co muon duoc chuyen den nhan vien ho tro khong?',
    confidence, faqTopicId: null, escalated: false
  };
}

module.exports = { processMessage, matchFAQ };
