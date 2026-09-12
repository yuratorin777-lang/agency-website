import { GoogleGenerativeAI } from '@google/generative-ai';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'GEMINI_API_KEY is not configured on Vercel' });
  }

  const { prompt, systemInstruction, model } = req.body;

  if (!prompt) {
    return res.status(400).json({ error: 'Prompt is required' });
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    
    // Используем модель из запроса или по дефолту gemini-2.5-flash
    const selectedModel = model || 'gemini-3.5-flash-lite';

    const generativeModel = genAI.getGenerativeModel({
      model: selectedModel,
      systemInstruction: systemInstruction || undefined,
      generationConfig: {
        responseMimeType: 'application/json',
        temperature: 0.3,
      },
    });

    const result = await generativeModel.generateContent(prompt);
    const text = result.response.text();
    
    // Парсим гарантированный JSON от Gemini
    const parsedJson = JSON.parse(text);
    return res.status(200).json(parsedJson);

  } catch (error) {
    console.error('Vercel Gemini Proxy Error:', error);
    return res.status(500).json({ 
      error: 'Failed to generate content via Gemini', 
      details: error.message 
    });
  }
}