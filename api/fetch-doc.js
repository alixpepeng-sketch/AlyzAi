export default async function handler(req, res) {
  // Atur CORS agar bisa diakses frontend
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

  const { url } = req.body;

  if (!url) {
    return res.status(400).json({ error: 'URL tidak boleh kosong' });
  }

  try {
    let targetUrl = url;

    // Otomatis ubah link Google Docs biasa menjadi link export teks
    if (url.includes('docs.google.com/document/d/')) {
      const docIdMatch = url.match(/\/d\/([a-zA-Z0-9-_]+)/);
      if (docIdMatch && docIdMatch[1]) {
        targetUrl = `https://docs.google.com/document/d/${docIdMatch[1]}/export?format=txt`;
      }
    } else {
      return res.status(400).json({ 
        error: 'Gunakan link Google Docs yang sudah diset Publik ("Siapa saja yang memiliki link").' 
      });
    }

    const response = await fetch(targetUrl);
    if (!response.ok) {
      throw new Error('Gagal mengambil dokumen. Pastikan akses Google Docs diset Publik.');
    }

    const textContent = await response.text();
    return res.status(200).json({ success: true, content: textContent });

  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
