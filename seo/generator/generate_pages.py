import os
import sys
import json
import re
import time
import requests
from dotenv import load_dotenv

load_dotenv()

MOCK_MODE = False

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
VERCEL_API_URL = os.getenv("VERCEL_API_URL", "https://agency-website-virid-rho.vercel.app/api/generate/")

BATCH_SIZE = int(os.getenv("BATCH_SIZE", 5))

PROMPTS = {
    "service": {
        "prefix": "services",
        "system": """Ты — Lead AI Architect в BOS.AGENCE. Сгенерируй посадочную страницу услуги в формате JSON.
Язык: Русский.
Выдавай ТОЛЬКО валидный JSON без markdown-оберток по следующей схеме:
{
  "template_type": "service",
  "template_id": "template_1",
  "slug": "...",
  "seo": { "title": "...", "description": "...", "h1": "..." },
  "hero": { "badge": "AI & AUTOMATION", "title": "...", "subtitle": "..." },
  "value_props": [ { "title": "...", "desc": "..." } ],
  "technical_stack": ["React", "Next.js", "Python", "Node.js", "PostgreSQL"],
  "business_problems": [ { "problem": "...", "solution": "..." } ],
  "text_content": {
    "intro": "Вводный текст под SEO...",
    "sections": [ { "h2": "...", "body": "..." } ]
  },
  "faq": [ { "question": "...", "answer": "..." } ]
}"""
    },
    "blog": {
        "prefix": "blog",
        "system": """Ты — Lead Tech Writer в BOS.AGENCE. Напиши подробную экспертную статью/гайд в формате JSON.
Язык: Русский.

СТРОГИЕ ПРАВИЛА ОФОРМЛЕНИЯ BODY:
1. Поле 'toc' должно содержать минимум 3-4 раздела: [{ "id": "part-1", "title": "1. ..." }, ...].
2. Поле 'body' должно быть единой HTML-строкой.
3. Каждый раздел из 'toc' ОБЯЗАН начинаться с тега <h2> с соответствующим id и классами:
   <h2 id='part-1' class='text-2xl font-semibold mb-4 text-neutral-900 mt-8'>1. Название раздела</h2>
4. Текст внутри разделов разбивай на абзацы <p class='mb-6 leading-relaxed text-neutral-700'>...</p>.
5. Для списков ОБЯЗАТЕЛЬНО используй теги <ul> и <li>:
   <ul class='list-disc pl-6 mb-6 text-neutral-700 space-y-2'><li><strong>Пункт:</strong> описание</li></ul>

Схема JSON:
{
  "template_type": "blog",
  "slug": "...",
  "category": "ИИ И АВТОМАТИЗАЦИЯ",
  "publish_date": "15 Сен 2026",
  "read_time": "7 мин",
  "author": { "name": "Юрий Торин", "role": "Solution Architect & CTO", "avatar": "../assets/images/author-default.png" },
  "seo": { "title": "...", "description": "..." },
  "hero": { "title": "..." },
  "toc": [
    { "id": "part-1", "title": "1. Введение и контекст" },
    { "id": "part-2", "title": "2. Ключевые шаги внедрения" }
  ],
  "body": "<h2 id='part-1' class='text-2xl font-semibold mb-4 text-neutral-900 mt-8'>1. Введение и контекст</h2><p class='mb-6 leading-relaxed text-neutral-700'>Подробный вводный текст...</p><h2 id='part-2' class='text-2xl font-semibold mb-4 text-neutral-900 mt-8'>2. Ключевые шаги внедрения</h2><p class='mb-6 leading-relaxed text-neutral-700'>Основной текст...</p><ul class='list-disc pl-6 mb-6 text-neutral-700 space-y-2'><li><strong>Шаг 1:</strong> Подготовка</li></ul>"
}"""
    },
    "case": {
        "prefix": "cases",
        "system": """Ты — Commercial Director в BOS.AGENCE. Напиши детальный оцифрованный кейс в формате JSON.
Язык: Русский.
Выдавай ТОЛЬКО валидный JSON по следующей схеме:
{
  "template_type": "case",
  "slug": "...",
  "client_name": "...",
  "seo": { "title": "...", "description": "..." },
  "hero": { "title": "..." },
  "metrics": [ { "value": "-65%", "label": "..." } ],
  "problem_short": "Краткая суть проблемы в 1-2 предложениях для верхней карточки summary",
  "solution_short": "Краткая суть решения в 1-2 предложениях для верхней карточки summary",
  "body": "<h2 class='text-2xl font-semibold mb-4 text-neutral-900 mt-8'>1. Контекст и проблематика</h2><p class='mb-6 leading-relaxed text-neutral-700'>Развернутый детальный разбор фона проекта...</p><h2 class='text-2xl font-semibold mb-4 text-neutral-900 mt-8'>2. Архитектура решения и процесс</h2><p class='mb-6 leading-relaxed text-neutral-700'>Подробный разбор реализованных шагов...</p>",
  "stack": ["Python", "Gemini API", "PostgreSQL", "Next.js"]
}"""
    },
    "tool": {
        "prefix": "tools",
        "system": """Ты — Senior AI Systems Architect в BOS.AGENCE. Создай страницу инструмента/чек-листа в формате JSON.
Язык: Русский.
Выдавай ТОЛЬКО валидный JSON по следующей схеме:
{
  "template_type": "tool",
  "slug": "...",
  "seo": { "title": "...", "description": "..." },
  "hero": { "title": "..." },
  "description": "...",
  "download_link": "#",
  "checklist": [ { "title": "...", "desc": "..." } ]
}"""
    }
}

def detect_page_type(item):
    explicit_type = item.get("type") or item.get("category") or item.get("template_type")
    if explicit_type in PROMPTS:
        return explicit_type

    slug = str(item.get("slug", "")).lower()
    kw = str(item.get("keyword") or item.get("query") or "").lower()

    if any(p in slug for p in ["blog/", "blog-", "blog_"]) or any(w in kw for w in ["статья", "гайд", "обзор"]):
        return "blog"
    if any(p in slug for p in ["case/", "cases/", "case-", "case_"]) or any(w in kw for w in ["кейс", "пример", "опыт", "внедрение", "результат"]):
        return "case"
    if any(p in slug for p in ["tool/", "tools/", "tool-", "calc"]) or any(w in kw for w in ["чек-лист", "калькулятор", "шаблон", "инструмент"]):
        return "tool"
    
    return "service"

def format_correct_slug(raw_slug, page_type):
    clean = raw_slug.replace(".html", "").strip("/")
    
    for p in ["blog/", "services/", "cases/", "tools/", "blog_", "services_", "cases_", "tools_"]:
        if clean.startswith(p):
            clean = clean[len(p):]

    prefix = PROMPTS.get(page_type, {}).get("prefix", "services")
    
    if page_type == "service":
        return clean
    
    return f"{prefix}/{clean}"

def clean_json_response(raw_text):
    cleaned = re.sub(r'^```json\s*', '', raw_text.strip(), flags=re.MULTILINE)
    cleaned = re.sub(r'^```\s*', '', cleaned, flags=re.MULTILINE)
    cleaned = re.sub(r'```$', '', cleaned, flags=re.MULTILINE)
    return cleaned.strip()

def make_human_title(raw_text):
    if not raw_text:
        return ""
    
    text = raw_text.strip()
    
    # Если это slug/латиница
    if not re.search(r'[а-яА-ЯёЁ]', text):
        text = text.replace('-', ' ').replace('_', ' ').strip()
    
    # Удаляем коммерческий SEO-мусор из ключевиков, который портит H1
    trash_words = [r'\bкупить\b', r'\bцена\b', r'\bстоимость\b', r'\bзаказать\b', r'\bнедорого\b', r'\bмосква\b']
    for pattern in trash_words:
        text = re.sub(pattern, '', text, flags=re.IGNORECASE)
    
    # Убираем лишние пробелы и капитализируем
    text = ' '.join(text.split()).capitalize()
    return text

def generate_page_data_via_vercel(slug, query, raw_query, meta_title, meta_description, hero_title, page_type="service", retries=3):
    type_config = PROMPTS.get(page_type, PROMPTS["service"])
    system_instruction = type_config["system"]

    human_query = make_human_title(query)

    user_prompt = f"""
    Сгенерируй SEO-оптимизированную страницу типа '{page_type.upper()}' для IT-агентства BOS.AGENCE.
    
    СТРОГОЕ ПРАВИЛО ДЛЯ H1 И TITLE:
    - Поисковый запрос/Тема: "{query}"
    - Преобразуй этот поисковый ключ в нормальный, красивый, продающий бизнес-заголовок на русском языке.
    - Категорически ЗАПРЕЩЕНО писать сухие поисковые фразы вроде "{raw_query}".

    Параметры генерации:
    - Тип: {page_type}
    - Slug (для URL): {slug}
    - Контекст темы: {human_query}
    
    Верни строго JSON. В полях seo.h1, seo.title и hero.title ДОЛЖЕН БЫТЬ нормальный красивый заголовок!
    """

    if MOCK_MODE:
        return {
            "template_type": page_type,
            "slug": slug,
            "seo": {"title": meta_title, "description": meta_description, "h1": hero_title},
            "hero": {"title": hero_title}
        }

    payload = {
        "prompt": user_prompt,
        "type": page_type,
        "systemInstruction": system_instruction
    }

    headers = {"Content-Type": "application/json"}

    for attempt in range(1, retries + 1):
            try:
                response = requests.post(VERCEL_API_URL, json=payload, headers=headers, timeout=90)
                
                if response.status_code == 200:
                    res_data = response.json()
                    
                    # Парсим JSON, если Vercel/Gemini вернул его строкой
                    if isinstance(res_data, str):
                        res_data = json.loads(clean_json_response(res_data))
                    elif isinstance(res_data, dict) and "result" in res_data and isinstance(res_data["result"], str):
                        res_data = json.loads(clean_json_response(res_data["result"]))
                    
                    # Гарантируем простановку мета-полей
                    if isinstance(res_data, dict):
                        res_data["template_type"] = page_type
                        res_data["slug"] = slug
                        return res_data
                    else:
                        raise ValueError("API вернул данные в неверном формате")
                else:
                    print(f"⚠️ Попытка {attempt}: Vercel вернул статус {response.status_code}")
                    if attempt < retries:
                        time.sleep(3 * attempt)
                    else:
                        raise requests.HTTPError(f"Vercel API вернул {response.status_code}")
                        
            except Exception as err:
                print(f"⚠️ Попытка {attempt}/{retries} ошибка: {err}")
                if attempt < retries:
                    time.sleep(3 * attempt)
                else:
                    raise err

def main():
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    core_json_path = os.path.join(base_dir, "data", "core", "seo_core.json")
    output_dir = os.path.join(base_dir, "data", "pages")

    os.makedirs(output_dir, exist_ok=True)

    if not os.path.exists(core_json_path):
        print(f"❌ Не найден файл с матрицей: {core_json_path}")
        return

    with open(core_json_path, "r", encoding="utf-8") as f:
        seo_items = json.load(f)

    STOP_PATTERNS = [
        r"жд", r"билет", r"поезд", r"авиа", r"одежд", r"расписание",
        r"wildber", r"valdber", r"valber", r"вайлдб", r"валдб", r"валб"
    ]

    valid_items = [
        item for item in seo_items
        if not any(re.search(pat, str(item.get("keyword") or item.get("query") or "").lower()) for pat in STOP_PATTERNS)
    ]

    buckets = {
        "blog": [],
        "service": [],
        "case": [],
        "tool": []
    }

    for item in valid_items:
        p_type = detect_page_type(item)
        buckets[p_type].append(item)

    print(f"📊 Всего ключей: {len(valid_items)} | В корзинах: Blog={len(buckets['blog'])}, Service={len(buckets['service'])}, Case={len(buckets['case'])}, Tool={len(buckets['tool'])}")

    generated_count = 0
    type_order = ["blog", "service", "case", "tool"]
    order_idx = 0

    max_attempts = len(valid_items) * 2
    attempts = 0

    while generated_count < BATCH_SIZE and attempts < max_attempts:
        attempts += 1

    while generated_count < BATCH_SIZE:
        if not any(buckets.values()):
            print("⚠️ Все корзины с ключами исчерпаны.")
            break

        current_type = type_order[order_idx % len(type_order)]
        order_idx += 1

        if not buckets[current_type]:
            continue

        item = buckets[current_type].pop(0)
        
        clean_slug = format_correct_slug(item.get("slug", ""), current_type)
        file_name = f"{clean_slug.replace('/', '_')}.json"
        output_file = os.path.join(output_dir, file_name)

        if os.path.exists(output_file) and os.path.getsize(output_file) > 100:
            print(f"⏭️ Пропуск [{current_type.upper()}]: {clean_slug} (уже существует)")
            continue

        raw_query = item.get("keyword") or item.get("query") or clean_slug
        query = make_human_title(raw_query)

        meta_title = item.get("title") or item.get("meta_title") or f"{query} — BOS.AGENCE"
        meta_description = item.get("description") or item.get("meta_description") or f"Услуги и решения по направлению {query} от IT-агентства BOS.AGENCE."
        
        # Раньше тут могло браться сырое некрасивое поле h1 из json:
        # hero_title = item.get("h1") or item.get("hero_title") or query
        
        # Меняем на очищенный query:
        hero_title = query

        print(f"🚀 Генерация [{current_type.upper()}] [{generated_count + 1}/{BATCH_SIZE}]: {clean_slug}...")

        try:
            page_json = generate_page_data_via_vercel(
                slug=clean_slug,
                query=query,
                raw_query=raw_query, # <--- ДОБАВЛЕНО ЕЩЕ ОДНО ПОЛЕ
                meta_title=meta_title,
                meta_description=meta_description,
                hero_title=hero_title,
                page_type=current_type
            )

            with open(output_file, "w", encoding="utf-8") as out:
                json.dump(page_json, out, ensure_ascii=False, indent=2)

            print(f"✅ Сохранен JSON: {output_file}")
            generated_count += 1

            if not MOCK_MODE:
                time.sleep(4)

        except Exception as e:
            print(f"❌ Ошибка при генерации {clean_slug}: {e}")

if __name__ == "__main__":
    main()