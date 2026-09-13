import os
import sys
import json
import random
import time
import requests
from dotenv import load_dotenv

# Загружаем переменные из локального .env (если он существует)
load_dotenv()

# Флаг для локального тестирования без вызова API
MOCK_MODE = False

# Считываем переменные из окружения (GitHub Actions / .env / значения по умолчанию)
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
VERCEL_API_URL = os.getenv("VERCEL_API_URL", "https://agency-website-virid-rho.vercel.app/api/generate")

# Динамический размер батча: берется из кнопки GitHub Actions или по умолчанию 4
BATCH_SIZE = int(os.getenv("BATCH_SIZE", 4))

# ---------------------------------------------------------------------------
# ПРОМПТЫ И СТРУКТУРЫ, 100% СОВМЕСТИМЫЕ С BUILD.JS
# ---------------------------------------------------------------------------

PROMPTS = {
    "service": {
        "templates": ["template_1", "template_2"],
        "system": """
Ты — Lead AI Architect в BOS.AGENCE. Сгенерируй посадочную страницу услуги в формате JSON.
Язык: Русский.
Выдавай ТОЛЬКО валидный JSON без markdown-оберток по следующей схеме:
{
  "template_type": "service",
  "template_id": "template_1",
  "slug": "...",
  "seo": {
    "title": "...",
    "description": "...",
    "h1": "..."
  },
  "hero": {
    "badge": "AI & AUTOMATION",
    "title": "...",
    "subtitle": "..."
  },
  "value_props": [
    { "title": "Заголовок преимущества", "desc": "Описание преимущества" }
  ],
  "technical_stack": ["React", "Next.js", "Python", "Node.js", "PostgreSQL"],
  "business_problems": [
    { "problem": "Проблема клиента", "solution": "Решение от агентства" }
  ],
  "text_content": {
    "intro": "Вводный текст под SEO (2 абзаца)...",
    "sections": [
      { "h2": "Подзаголовок SEO-блока", "body": "Подробный текст секции..." }
    ]
  },
  "faq": [
    { "question": "Вопрос?", "answer": "Ответ..." }
  ]
}
"""
    },
    
    "blog": {
        "templates": ["blog"],
        "system": """
Ты — Lead Tech Writer в BOS.AGENCE. Напиши подробную, глубокую статью/гайд в формате JSON.
Язык: Русский.
Выдавай ТОЛЬКО валидный JSON по следующей схеме:
{
  "template_type": "blog",
  "slug": "...",
  "category": "ИИ И АВТОМАТИЗАЦИЯ",
  "publish_date": "15 Сен 2026",
  "read_time": "7 мин",
  "author": {
    "name": "Юрий Торин",
    "role": "Solution Architect & CTO",
    "avatar": "../assets/images/author-default.png"
  },
  "seo": {
    "title": "...",
    "description": "..."
  },
  "hero": {
    "title": "..."
  },
  "toc": [
    { "id": "part-1", "title": "1. Название первого раздела" },
    { "id": "part-2", "title": "2. Название второго раздела" }
  ],
  "body": "<h2 id='part-1' class='text-2xl font-semibold mb-4 text-neutral-900'>1. Название первого раздела</h2><p class='mb-6 leading-relaxed text-neutral-700'>Текст первого раздела с деталями...</p><h2 id='part-2' class='text-2xl font-semibold mb-4 text-neutral-900'>2. Название второго раздела</h2><p class='mb-6 leading-relaxed text-neutral-700'>Текст второго раздела...</p>"
}
"""
    },

    "case": {
        "templates": ["case"],
        "system": """
Ты — Commercial Director в BOS.AGENCE. Напиши лаконичный, оцифрованный кейс в формате JSON.
Язык: Русский.
Выдавай ТОЛЬКО валидный JSON по следующей схеме:
{
  "template_type": "case",
  "slug": "...",
  "client_name": "НАЗВАНИЕ КЛИЕНТА / ОТРАСЛЬ",
  "seo": {
    "title": "...",
    "description": "..."
  },
  "hero": {
    "title": "..."
  },
  "metrics": [
    { "value": "-65%", "label": "Нагрузка на саппорт" },
    { "value": "+3.8x", "label": "Конверсия" }
  ],
  "problem": "Описание проблемы клиента до обращения к нам...",
  "solution": "Подробное описание разработанного решения и архитектуры...",
  "stack": ["Python", "Gemini API", "PostgreSQL", "Next.js"]
}
"""
    },

    "tool": {
        "templates": ["tool"],
        "system": """
Ты — Senior AI Systems Architect в BOS.AGENCE. Создай практичную страницу чек-листа/инструмента в формате JSON.
Язык: Русский.
Выдавай ТОЛЬКО валидный JSON по следующей схеме:
{
  "template_type": "tool",
  "slug": "...",
  "seo": {
    "title": "...",
    "description": "..."
  },
  "hero": {
    "title": "..."
  },
  "description": "Краткое описание инструмента для кого он и какую пользу несет...",
  "download_link": "#",
  "checklist": [
    { "title": "Шаг 1. Название шага", "desc": "Подробное описание действия..." },
    { "title": "Шаг 2. Название шага", "desc": "Подробное описание действия..." }
  ]
}
"""
    }
}


def detect_page_type(item):
    explicit_type = item.get("type") or item.get("category") or item.get("template_type")
    if explicit_type in PROMPTS:
        return explicit_type

    slug = str(item.get("slug", "")).lower()
    kw = str(item.get("keyword") or item.get("query") or "").lower()

    if any(prefix in slug for prefix in ["blog/", "blog-", "blog_"]) or "статья" in kw or "как " in kw or "зачем " in kw:
        return "blog"
    elif any(prefix in slug for prefix in ["case/", "cases/", "case-", "case_"]) or "кейс" in kw or "портфолио" in kw:
        return "case"
    elif any(prefix in slug for prefix in ["tool/", "tools/", "tool-", "calc"]) or "калькулятор" in kw or "чек-лист" in kw:
        return "tool"
    
    return "service"


def generate_page_data_via_vercel(slug, query, meta_title, meta_description, hero_title, page_type="service", retries=3):
    type_config = PROMPTS.get(page_type, PROMPTS["service"])
    system_instruction = type_config["system"]

    user_prompt = f"""
    Сгенерируй SEO-оптимизированную страницу типа '{page_type.upper()}' для IT-агентства BOS.AGENCE.
    - Тип: {page_type}
    - Slug: {slug}
    - Поисковый запрос/Тема: {query}
    - Мета Title: {meta_title}
    - Мета Description: {meta_description}
    - H1 Заголовок: {hero_title}

    Сгенерируй строго JSON согласно системной инструкции.
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

    headers = {
        "Content-Type": "application/json",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    }

    for attempt in range(1, retries + 1):
        try:
            # Используем сессию с таймаутом
            response = requests.post(VERCEL_API_URL, json=payload, headers=headers, timeout=90)
            if response.status_code == 200:
                return response.json()
            else:
                print(f"⚠️ Попытка {attempt}: Vercel вернул статус {response.status_code}")
        except (requests.exceptions.RequestException, ConnectionResetError) as err:
            print(f"⚠️ Попытка {attempt}/{retries} завершилась ошибкой связи: {err}")
            if attempt < retries:
                time.sleep(3 * attempt) # Пауза перед повтором
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

    STOP_WORDS = [
        "жд", "билет", "поезд", "авиа", "одежд", "расписание",
        "wildberries", "wildberies", "valdberies", "valberries", 
        "валдберис", "вайлдберриз", "вайлдбериз", "валдбериз", "валберес"
    ]

    valid_items = []
    for item in seo_items:
        kw = str(item.get("keyword") or item.get("query") or item.get("slug") or "").lower()
        if not any(sw in kw for sw in STOP_WORDS):
            valid_items.append(item)

    print(f"📊 Всего релевантных ключей после фильтрации: {len(valid_items)}")

    TARGET_NEW_PAGES = 5  # Задайте нужный лимит
    generated_count = 0

    for item in valid_items:
        if generated_count >= TARGET_NEW_PAGES:
            print(f"🎉 План выполнен! Сгенерировано новых страниц: {generated_count}")
            break

        slug = item.get("slug", "").replace(".html", "")
        query = item.get("keyword") or item.get("query") or slug
        meta_title = item.get("title") or item.get("meta_title") or f"{query} | BOS.AGENCE"
        meta_description = item.get("description") or item.get("meta_description") or f"Решения по {query} от BOS.AGENCE."
        hero_title = item.get("h1") or item.get("hero_title") or query

        page_type = detect_page_type(item)
        file_name = f"{slug.replace('/', '_')}.json"
        output_file = os.path.join(output_dir, file_name)

        if os.path.exists(output_file) and os.path.getsize(output_file) > 100:
            print(f"⏭️ Пропуск (уже есть): {slug}")
            continue

        print(f"🚀 Генерация [{page_type.upper()}] [{generated_count + 1}/{TARGET_NEW_PAGES}]: {slug}...")

        try:
            page_json = generate_page_data_via_vercel(
                slug=slug, 
                query=query, 
                meta_title=meta_title, 
                meta_description=meta_description, 
                hero_title=hero_title,
                page_type=page_type
            )
            
            with open(output_file, "w", encoding="utf-8") as out:
                json.dump(page_json, out, ensure_ascii=False, indent=2)

            print(f"✅ Сохранен JSON: {output_file}")
            generated_count += 1

            if not MOCK_MODE:
                time.sleep(4)

        except Exception as e:
            print(f"❌ Ошибка при генерации {slug}: {e}")

if __name__ == "__main__":
    main()