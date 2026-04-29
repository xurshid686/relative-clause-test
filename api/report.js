module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const TOKEN = process.env.TELEGRAM_BOT_TOKEN;
  const CHAT_ID = process.env.TELEGRAM_CHAT_ID;

  if (!TOKEN || !CHAT_ID) {
    return res.status(500).json({ error: 'Telegram env vars not set' });
  }

  const { studentName, score, total, answers } = req.body;
  const pct = Math.round((score / total) * 100);
  const grade = pct >= 90 ? 'A' : pct >= 80 ? 'B' : pct >= 70 ? 'C' : pct >= 60 ? 'D' : 'F';

  const wrong = (answers || []).filter(a => !a.correct);
  const wrongText = wrong.length
    ? '\n\nWrong Answers:\n' + wrong.map(a => `Q${a.qNum}: chose "${a.chosen}" → correct "${a.correctAnswer}"`).join('\n')
    : '\n\nAll answers correct!';

  const date = new Date().toLocaleString('en-GB', { timeZone: 'Asia/Tashkent' });
  const text = `New Quiz Result\n\nStudent: ${studentName}\nScore: ${score}/${total} (${pct}%)\nGrade: ${grade}\nDate: ${date}${wrongText}`;

  const url = `https://api.telegram.org/bot${TOKEN}/sendMessage`;
  const body = JSON.stringify({ chat_id: CHAT_ID, text });

  try {
    const r = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body
    });
    const data = await r.json();
    if (!data.ok) return res.status(500).json({ error: 'Telegram error', detail: data });
    return res.status(200).json({ ok: true });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
};
