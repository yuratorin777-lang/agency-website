export const maxDuration = 60;
import { GoogleGenerativeAI } from '@google/generative-ai';

// SYSTEM INSTRUCTIONS FOR EACH PAGE TYPE
const SYSTEM_INSTRUCTIONS = {
  tool: `You are a Senior AI Systems Architect at BOS.AGENCE. Create a practical, comprehensive, high-value checklist or tool page in JSON.
Language: Russian.
Output ONLY raw valid JSON adhering strictly to this schema:
{
  "template_type": "tool",
  "slug": "kalkulyator-roi-ai-agenta",
  "seo": {
    "title": "Чек-лист: Внедрение AI-ассистента в отдел продаж",
    "description": "Пошаговый гайд по интеграции автоворонок и AI-агентов с расчетом окупаемости."
  },
  "hero": {
    "title": "Чек-лист: Внедрение AI-ассистента в отдел продаж"
  },
  "description": "Подробное руководства для руководителей продаж и IT-директоров по внедрению LLM-ботов.",
  "download_link": "#",
  "checklist": [
    { "title": "Аудит каналов лидогенерации", "desc": "Определите ключевые точки входа клиентов (WhatsApp, Telegram, CRM) и опишите стандартные вопросы." },
    { "title": "Формирование базы знаний", "desc": "Подготовьте FAQ, регламенты и скрипты в формате Plain Text или Markdown для обучения RAG-модели." },
    { "title": "Интеграция с CRM и аналитикой", "desc": "Подключите вебхуки для автоматической передачи квалифицированных лидов прямо в вашу CRM." },
    { "title": "Тестирование и A/B сценарии", "desc": "Запустите контрольную группу диалогов для проверки точности ответов гибридного агента." }
  ]
}`,

  blog: `You are a Lead Tech Writer at BOS.AGENCE. Write an extensive, deeply expert, long-form technical article on AI, Automation, or Web Development in JSON format.
Language: Russian.
IMPORTANT: The 'body' field MUST contain rich, detailed HTML (at least 4-6 long paragraphs, multiple subheadings matching the 'toc', code snippets if relevant, and actionable advice). Do NOT use short placeholder text.

Output ONLY raw valid JSON adhering strictly to this schema:
{
  "template_type": "blog",
  "slug": "kak-vnedrit-rag-v-crm",
  "category": "ИИ И АВТОМАТИЗАЦИЯ",
  "publish_date": "14 Сен 2026",
  "read_time": "7 мин",
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
    { "id": "part-2", "title": "2. Архитектура интеграции и выбор векторной БД" },
    { "id": "part-3", "title": "3. Пошаговый процесс подключения" }
  ],
  "body": "<h2 id='part-1' class='text-2xl font-semibold mb-4 text-neutral-900'>1. Зачем нужен RAG в CRM</h2><p class='mb-6 leading-relaxed text-neutral-700'>Подробный экспертный разбор технологии RAG (Retrieval-Augmented Generation) и ее применения для автоматизации работы отдела продаж...</p><h2 id='part-2' class='text-2xl font-semibold mb-4 text-neutral-900'>2. Архитектура интеграции и выбор векторной БД</h2><p class='mb-6 leading-relaxed text-neutral-700'>Сравнение решений Qdrant, Pinecone и pgvector для хранения эмбеддингов базы знаний вашей компании...</p><h2 id='part-3' class='text-2xl font-semibold mb-4 text-neutral-900'>3. Пошаговый процесс подключения</h2><p class='mb-6 leading-relaxed text-neutral-700'>Практические шаги по настройке вебхуков и обработке ответов моделью Gemini в реальном времени...</p>"
}`,

  case: `You are a Commercial Director at BOS.AGENCE. Write a detailed, metric-driven Case Study in JSON format detailing a real business problem, technical solution, architecture, implementation steps, and business results.
Language: Russian.
IMPORTANT: You MUST include a detailed 'body' field with step-by-step HTML workflow description.

Output ONLY raw valid JSON adhering strictly to this schema:
{
  "template_type": "case",
  "slug": "kejs-avtomatizacii-med-centra",
  "client_name": "СЕТЬ КЛИНИК «MED-LIFE»",
  "seo": {
    "title": "Автоматизация записи пациентов через Telegram AI-бота | Кейс BOS.AGENCE",
    "description": "Как мы сократили нагрузку на колл-центр на 65% с помощью ИИ и интеграции с МИС."
  },
  "hero": {
    "title": "Автоматизация записи пациентов через Telegram AI-бота"
  },
  "metrics": [
    { "value": "-65%", "label": "Нагрузка на колл-центр" },
    { "value": "+3.8x", "label": "Конверсия в ночную запись" },
    { "value": "2 недели", "label": "Срок внедрения" }
  ],
  "problem": "Колл-центр не справлялся с потоком входящих сообщений в мессенджерах, из-за чего терялось до 30% первичных лидов в нерабочее время и создавалась высокая пиковая нагрузка на операторов.",
  "solution": "Разработали и интегрировали гибридного AI-агента на базе Gemini с прямой синхронизацией с МИС. Бот самостоятельно квалифицирует запрос, предлагает свободные слоты и записывает клиента.",
  "stack": ["Gemini API", "Node.js", "Python", "PostgreSQL", "Telegram Bot API"],
  "body": "<div class='space-y-6'><h3 class='text-lg sm:text-xl font-semibold text-neutral-900 mb-3'>Ход работ по проекту:</h3><ul class='list-disc pl-5 space-y-3 text-sm sm:text-base text-neutral-700 leading-relaxed'><li><strong>Аудит процессов:</strong> Провели полный разбор типовых диалогов колл-центра и выделили ключевые сценарии записи.</li><li><strong>Архитектура и интеграция:</strong> Разработали модуль бесшовной интеграции с МИС через REST API для синхронизации расписания в реальном времени.</li><li><strong>Обучение LLM-модели:</strong> Загрузили базу знаний клиники и настроили RAG-систему для точных ответов на вопросы по услугам и прайсу.</li><li><strong>Тестирование и запуск:</strong> Провели A/B тестирование на 20% входящего трафика, после чего полностью перевели ночные обращения на AI-агента.</li></ul></div>"
}`,

  service: `You are a Lead AI Architect at BOS.AGENCE. Generate a detailed, high-converting service landing page in JSON format.
Language: Russian.

CRITICAL TITLE & H1 RULES:
1. NEVER use raw SEO keyword string or slug directly for H1 or Hero title (e.g. NEVER output "интернет магазин маркет купить").
2. "seo.h1" and "hero.title" MUST be written in natural, professional, high-converting Russian (e.g. "Разработка интернет-магазинов и маркетплейсов").
3. "seo.title" must be fully human-readable with standard corporate formatting (e.g. "Разработка интернет-магазинов | BOS.AGENCE").
4. "slug" must remain a valid URL slug (e.g. "internet-magazin-market-kupit").

Output ONLY raw valid JSON adhering strictly to this schema:
{
  "template_type": "service",
  "template_id": "template_1",
  "slug": "vnedrenie-ai-agentov",
  "seo": {
    "title": "Внедрение AI-агентов для бизнеса | BOS.AGENCE",
    "description": "Разработка и интеграция автономных AI-ассистентов в ваши бизнес-процессы.",
    "h1": "Внедрение AI-агентов в бизнес-процессы"
  },
  "hero": {
    "badge": "AI & AUTOMATION",
    "title": "Разработка и внедрение автономных AI-агентов",
    "subtitle": "Автоматизация сложных цепочек задач и коммуникаций с помощью искусственного интеллекта."
  },
  "value_props": [
    { "title": "24/7 Работа", "desc": "Мгновенная обработка запросов без выходных и человеческого фактора." },
    { "title": "Прямая интеграция", "desc": "Бесшовная связка с CRM, ERP и внутренними базами знаний." }
  ],
  "technical_stack": ["Gemini", "Python", "Node.js", "PostgreSQL"],
  "business_problems": [
    { "problem": "Высокие затраты на саппорт", "solution": "Автоматизация до 80% рутинных обращений клиентов." }
  ],
  "faq": [
    { "question": "Сколько занимает интеграция?", "answer": "Базовое внедрение занимает от 10 рабочих дней." }
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

  const selectedInstruction = systemInstruction || SYSTEM_INSTRUCTIONS[type] || SYSTEM_INSTRUCTIONS.service;

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const selectedModel = model || 'gemini-3.5-flash-lite';

    const generativeModel = genAI.getGenerativeModel({
      model: selectedModel,
      systemInstruction: selectedInstruction,
      generationConfig: {
        responseMimeType: 'application/json',
        temperature: 0.2,
      },
    });

    const result = await generativeModel.generateContent(prompt);
    let text = result.response.text();

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