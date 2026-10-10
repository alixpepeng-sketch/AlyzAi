import { GoogleGenAI } from '@google/genai';

export default async function handler(req, res) {
  // Atur CORS agar bisa diakses dari frontend web kamu
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,GET');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { questions } = req.body;

  if (!questions || !Array.isArray(questions) || questions.length === 0) {
    return res.status(400).json({ error: 'Daftar soal kosong' });
  }

  // Mengambil GEMINI_API_KEY yang aman di Vercel Environment Variables
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'GEMINI_API_KEY belum dikonfigurasi di Vercel Dashboard.' });
  }

  try {
    const ai = new GoogleGenAI({ apiKey });

    const systemInstruction = `
Kamu adalah mesin penjawab soal otomatis secepat kilat untuk aplikasi ALYZ WEB.
Analisis soal-soal berikut dan tentukan jawaban yang paling akurat.

Format balasan WAJIB berupa JSON murni dengan struktur array object berikut (tanpa markdown code block):
[
  {
    "id": 1,
    "answer": "A" 
  }
]
(Gunakan huruf opsi untuk pilihan ganda, atau teks singkat untuk isian/essay).
`;

    const userPrompt = `Berikut adalah daftar soal:\n${JSON.stringify(questions, null, 2)}`;

    const response = await ai.models.generateContent({
      model: 'gemini-1.5-flash',
      contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
      config: {
        systemInstruction: systemInstruction,
        temperature: 0.1,
        responseMimeType: 'application/json'
      }
    });

    const parsedAnswers = JSON.parse(response.text);
    return res.status(200).json({ success: true, answers: parsedAnswers });

  } catch (error) {
    console.error('AI Error:', error);
    return res.status(500).json({ error: 'Gagal memproses AI: ' + error.message });
  }
}
