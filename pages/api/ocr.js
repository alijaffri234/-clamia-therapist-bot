export default async function handler(req, res) {
  if (req.method === 'POST') {
    try {
      const { text } = JSON.parse(req.body);
      // Do something with the extracted text (e.g., log, save, process)
      console.log('Extracted OCR text:', text);
      res.status(200).json({ success: true });
    } catch (error) {
      res.status(400).json({ success: false, error: 'Invalid request' });
    }
  } else {
    res.status(405).json({ success: false, error: 'Method not allowed' });
  }
} 