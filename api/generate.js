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
    const selectedModel = model || 'gemini-2.5-flash';

    const generativeModel = genAI.getGenerativeModel({
      model: selectedModel,
      systemInstruction: systemInstruction || undefined,
      generationConfig: {
        responseMimeType: 'application/json',
        temperature: 0.2, // Снижаем температуру для максимальной строгости JSON
      },
    });

    const result = await generativeModel.generateContent(prompt);
    let text = result.response.text();

    // Очищаем от возможных markdown оберток ```json ... ```
    text = text.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```$/i, '').trim();
    
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