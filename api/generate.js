import { GoogleGenAI } from '@google/genai';

export default async function handler(req, res) {
  // Принимаем только POST-запросы
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'GEMINI_API_KEY is not configured on Vercel' });
  }

  const { prompt, systemInstruction } = req.body;

  if (!prompt) {
    return res.status(400).json({ error: 'Prompt is required' });
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        systemInstruction: systemInstruction || '',
        responseMimeType: 'application/json',
        temperature: 0.3,
      },
    });

    const parsedJson = JSON.parse(response.text);
    return res.status(200).json(parsedJson);
  } catch (error) {
    console.error('Vercel Gemini Proxy Error:', error);
    return res.status(500).json({ 
      error: 'Failed to generate content via Gemini', 
      details: error.message 
    });
  }
}