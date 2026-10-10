export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST');
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

  const { url } = req.body;
  if (!url) {
    return res.status(400).json({ error: 'URL tidak boleh kosong' });
  }

  try {
    let targetUrl = url;

    // Jika Google Docs, ubah ke format export text
    if (url.includes('docs.google.com/document/d/')) {
      const docIdMatch = url.match(/\/d\/([a-zA-Z0-9-_]+)/);
      if (docIdMatch && docIdMatch[1]) {
        targetUrl = `https://docs.google.com/document/d/${docIdMatch[1]}/export?format=txt`;
      }
    }

    const response = await fetch(targetUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });

    if (!response.ok) {
      throw new Error(`Gagal mengambil halaman (Status: ${response.status}). Pastikan link bersifat Publik.`);
    }

    const htmlOrText = await response.text();

    let cleanedContent = htmlOrText;
    if (url.includes('forms.gle') || url.includes('docs.google.com/forms')) {
      cleanedContent = htmlOrText.replace(/<[^>]*>?/gm, ' ').replace(/\s+/g, ' ');
    }

    return res.status(200).json({ success: true, content: cleanedContent });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
