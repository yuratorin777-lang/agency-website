import { GoogleGenerativeAI } from '@google/generative-ai';

// ВСТРОЕННЫЕ СИСТЕМНЫЕ ИНСТРУКЦИИ ДЛЯ КАЖДОГО ТИПА СТРАНИЦ
const SYSTEM_INSTRUCTIONS = {
  tool: `You are a senior AI Systems Architect at BOS.AGENCE. Create a practical, high-value checklist/tool page in JSON.
Language: Russian.
Output ONLY raw valid JSON adhering strictly to this schema:
{
  "template_type": "tool",
  "slug": "kalkulyator-roi-ai-agenta",
  "seo": {
    "title": "Чек-лист: Внедрение AI-ассистента в отдел продаж",
    "description": "Пошаговый гайд по интеграции автоворонки и AI-агентов с расчетом окупаемости."
  },
  "hero": {
    "title": "Чек-лист: Внедрение AI-ассистента в отдел продаж"
  },
  "description": "Пошаговое руководство для руководителей продаж и IT-директоров по внедрению LLM-ботов.",
  "download_link": "#",
  "checklist": [
    { "title": "Аудит каналов лидогенерации", "desc": "Определите ключевые точки входа клиентов (WhatsApp, Telegram, CRM) и опишите стандартные вопросы." },
    { "title": "Формирование базы знаний", "desc": "Подготовьте FAQ, регламенты и скрипты в формате Plain Text или Markdown для обучения RAG-модели." }
  ]
}`,

  blog: `You are a Lead Tech Writer at BOS.AGENCE. Write a deep, expert article on AI, Automation, or Web Development in JSON format.
Language: Russian.
Output ONLY raw valid JSON adhering strictly to this schema:
{
  "template_type": "blog",
  "slug": "kak-vnedrit-rag-v-crm",
  "category": "ИИ И АВТОМАТИЗАЦИЯ",
  "publish_date": "14 Сен 2026",
  "read_time": "7",
  "author": {
    "name": "Команда BOS.AGENCE",
    "role": "Digital & AI Architecture",
    "avatar": "../assets/images/author-default.png"
  },
  "seo": {
    "title": "Как соединить RAG и CRM для автоответов на базе вашей базы знаний",
    "description": "Полный разбор архитектуры подсоединения векторных баз данных к amoCRM и Битрикс24."
  },
  "hero": {
    "title": "Как соединить RAG и CRM для автоответов на базе вашей базы знаний"
  },
  "toc": [
    { "id": "part-1", "title": "1. Зачем нужен RAG в CRM" },
    { "id": "part-2", "title": "2. Выбор векторной БД" }
  ],
  "body": "<h2 id='part-1' class='text-2xl font-semibold mb-4 text-neutral-900'>1. Зачем нужен RAG в CRM</h2><p class='mb-6 leading-relaxed text-neutral-700'>Подробный разбор решения...</p>"
}`,

  case: `You are a Commercial Director at BOS.AGENCE. Write a concise, metric-driven Case Study in JSON format.
Language: Russian.
Output ONLY raw valid JSON adhering strictly to this schema:
{
  "template_type": "case",
  "slug": "kejs-avtomatizacii-med-centra",
  "client_name": "СЕТЬ КЛИНИК «MED-LIFE»",
  "seo": {
    "title": "Автоматизация записи пациентов через Telegram AI-бота",
    "description": "Как мы сократили нагрузку на колл-центр на 65% с помощью ИИ."
  },
  "hero": {
    "title": "Автоматизация записи пациентов через Telegram AI-бота"
  },
  "metrics": [
    { "value": "-65%", "label": "Нагрузка на колл-центр" },
    { "value": "+3.8x", "label": "Конверсия в ночную запись" },
    { "value": "2 недели", "label": "Срок внедрения" }
  ],
  "problem": "Колл-центр не справлялся с потоком входящих сообщений в мессенджерах, из-за чего терялось до 30% первичных лидов в нерабочее время.",
  "solution": "Разработали и интегрировали гибридного AI-агента на базе Gemini 2.5 Flash с прямой синхронизацией с МИС (медицинской системой).",
  "stack": ["Gemini API", "Node.js", "Python", "PostgreSQL", "Telegram Bot API"]
}`,

  service: `You are a Lead AI Architect at BOS.AGENCE. Generate a detailed service landing page in JSON format.
Language: Russian.
Output ONLY raw valid JSON adhering strictly to this schema:
{
  "template_type": "service",
  "template_id": "template_1",
  "slug": "vnedrenie-ai-agentov",
  "seo": {
    "title": "Внедрение AI-агентов для бизнеса | BOS.AGENCE",
    "description": "Разработка и интеграция автономных AI-ассистентов.",
    "h1": "Внедрение AI-агентов в бизнес-процессы"
  },
  "hero": {
    "badge": "AI & AUTOMATION",
    "title": "Автономные AI-агенты",
    "subtitle": "Автоматизация сложных цепочек задач с помощью ИИ."
  },
  "value_props": [
    { "title": "24/7 Работа", "desc": "Обработка запросов без выходных." }
  ],
  "technical_stack": ["Gemini", "Python", "Node.js", "PostgreSQL"],
  "business_problems": [
    { "problem": "Высокие затраты на саппорт", "solution": "Автоматизация 80% рутинных обращений" }
  ],
  "faq": [
    { "question": "Сколько занимает интеграция?", "answer": "От 10 дней." }
  ]
}`
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'GEMINI_API_KEY is not configured on Vercel' });
  }

  const { prompt, type, systemInstruction, model } = req.body;

  if (!prompt) {
    return res.status(400).json({ error: 'Prompt is required' });
  }

  // Определяем системную инструкцию по переданному type (tool, blog, case, service)
  // или берем вручную переданный systemInstruction
  const selectedInstruction = systemInstruction || SYSTEM_INSTRUCTIONS[type] || SYSTEM_INSTRUCTIONS.service;

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const selectedModel = model || 'gemini-2.5-flash';

    const generativeModel = genAI.getGenerativeModel({
      model: selectedModel,
      systemInstruction: selectedInstruction,
      generationConfig: {
        responseMimeType: 'application/json',
        temperature: 0.2, // Минимальная температура для строго соблюдения JSON-схемы
      },
    });

    const result = await generativeModel.generateContent(prompt);
    let text = result.response.text();

    // Очищаем от возможных markdown-оберток ```json ... ```
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