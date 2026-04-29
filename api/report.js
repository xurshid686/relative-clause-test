export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
  const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;

  if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
    return res.status(500).json({ error: 'Telegram credentials not configured in environment variables.' });
  }

  const { studentName, score, total, answers } = req.body;

  const percentage = Math.round((score / total) * 100);
  const grade = percentage >= 90 ? 'A' : percentage >= 80 ? 'B' : percentage >= 70 ? 'C' : percentage >= 60 ? 'D' : 'F';

  let wrongAnswers = '';
  if (answers) {
    const wrong = answers.filter(a => !a.correct);
    if (wrong.length > 0) {
      wrongAnswers = '\n\n❌ *Wrong Answers:*\n' + wrong.map(a =>
        `Q${a.qNum}: Student chose "${a.chosen}" → Correct: "${a.correctAnswer}"`
      ).join('\n');
    }
  }

  const message = `📝 *New Quiz Submission*\n\n👤 *Student:* ${studentName}\n🎯 *Score:* ${score}/${total} (${percentage}%)\n🏅 *Grade:* ${grade}\n📅 *Date:* ${new Date().toLocaleString('en-GB', { timeZone: 'Asia/Tashkent' })}${wrongAnswers}`;

  try {
    const telegramRes = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: TELEGRAM_CHAT_ID,
        text: message,
        parse_mode: 'Markdown'
      })
    });

    const telegramData = await telegramRes.json();
    if (!telegramData.ok) {
      return res.status(500).json({ error: 'Telegram API error', details: telegramData });
    }

    return res.status(200).json({ success: true, message: 'Report sent to Telegram!' });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to send Telegram message', details: err.message });
  }
}
