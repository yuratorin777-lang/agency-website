import os
import json
import random
import time
import requests
from dotenv import load_dotenv

load_dotenv()

MOCK_MODE = False
VERCEL_API_URL = os.getenv("VERCEL_API_URL", "https://agency-website-virid-rho.vercel.app/api/generate")

TEMPLATES = [f"template_{i}" for i in range(1, 8)]

# Стоп-слова для отсечения мусорных SEO-запросов (ЖД, маркетплейсы, билеты)
STOP_WORDS = [
    "жд", "билет", "поезд", "авиа", "одежд", "расписание",
    "wildberries", "wildberies", "valdberies", "valberries", 
    "валдберис", "вайлдберриз", "вайлдбериз", "валдбериз"
]

SYSTEM_PROMPT = """
Ты — шеф-редактор и главный архитектор IT-агентства BOS.AGENCE.
Твоя задача — создать глубокую, коммерчески убедительную landing page для услуги digital-агентства на основе SEO-запроса.

ВАЖНЕЙШИЕ ПРАВИЛА КОПИРАЙТИНГА:
1. НИКАКОЙ ИИ-ВОДЫ. Запрещены клише: "в современном мире", "динамично развивающийся", "мы предлагаем широкий спектр", "индивидуальный подход к каждому".
2. ПИШИ КАК ЧЕЛОВЕК-ЭКСПЕРТ. Используй конкретику, цифры, стек (React, Node.js, Python, PostgreSQL, Docker), понятную выгоду для бизнеса (ROI, конверсия, автоматизация).

СТРУКТУРА JSON (Верни строго валидный JSON):
- slug: латинский url страницы
- template_id: выбери подходящий шаблон (template_1 ... template_7)
- seo: { title, description, h1 }
- hero: { badge, title, subtitle, cta }
- problem_solution: [ { problem: "...", solution: "..." } ] (3-4 пары)
- features: [ { title: "...", desc: "..." } ] (4-6 преимуществ)
- text_content: { 
    intro: "глубокий вводный абзац", 
    sections: [ { h2: "...", body: "..." } ] 
  }
- faq: [ { q: "...", a: "..." } ] (4-5 вопросов и ответов)
"""

def generate_page_data_via_vercel(slug, query, meta_title, meta_description, hero_title):
    assigned_template = random.choice(TEMPLATES)
    
    user_prompt = f"""
    Сгенерируй SEO-оптимизированный landing page для IT-агентства BOS.AGENCE.
    Входные данные SEO-матрицы:
    - Slug: {slug}
    - SEO Query: {query}
    - Title: {meta_title}
    - Description: {meta_description}
    - H1: {hero_title}
    - Назначенный шаблон: {assigned_template}

    Верни экспертный JSON без ИИ-воды.
    """

    if MOCK_MODE:
        return {
            "slug": slug,
            "template_id": assigned_template,
            "seo": {"title": meta_title, "description": meta_description, "h1": hero_title},
            "hero": {
                "badge": "Digital Automation & Enterprise Dev",
                "title": hero_title,
                "subtitle": "Разработка сложных веб-систем и интеграций для масштабирования бизнеса.",
                "cta": "Рассчитать стоимость"
            },
            "problem_solution": [
                {"problem": "Долгое время загрузки", "solution": "Перевод на реактивный стек Next.js / React"}
            ],
            "features": [
                {"title": "Высокая производительность", "desc": "Оптимизированный код и реактивный стек."},
                {"title": "Интеграции по API", "desc": "Связка с CRM, 1С, ERP и маркетплейсами."}
            ],
            "text_content": {
                "intro": "Разрабатываем высоконагруженные веб-сервисы...",
                "sections": [{"h2": "Архитектура решения", "body": "Используем микросервисный подход..."}]
            },
            "faq": [
                {"q": "Сколько стоит разработка?", "a": "Расчет стоимости производится после изучения ТЗ."}
            ]
        }

    payload = {
        "prompt": user_prompt,
        "systemInstruction": SYSTEM_PROMPT
    }

    headers = {"Content-Type": "application/json"}
    response = requests.post(VERCEL_API_URL, json=payload, headers=headers, timeout=60)
    
    if response.status_code != 200:
        raise RuntimeError(f"Vercel API returned error {response.status_code}: {response.text}")
        
    return response.json()


def main():
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    core_json_path = os.path.join(base_dir, "data", "core", "seo_core.json")
    output_dir = os.path.join(base_dir, "data", "pages")

    os.makedirs(output_dir, exist_ok=True)

    with open(core_json_path, "r", encoding="utf-8") as f:
        seo_items = json.load(f)

    # Жесткие стоп-слова
    STOP_WORDS = [
        "жд", "билет", "поезд", "авиа", "одежд", "расписание",
        "wildberries", "wildberies", "valdberies", "valberries", 
        "валдберис", "вайлдберриз", "вайлдбериз", "валдбериз", "валберес"
    ]

    # 1. Точная фильтрация по всем полям ключа
    valid_items = []
    for item in seo_items:
        kw = str(item.get("keyword") or item.get("query") or item.get("slug") or "").lower()
        if not any(sw in kw for sw in STOP_WORDS):
            valid_items.append(item)

    print(f"📊 Всего релевантных ключей после фильтрации: {len(valid_items)}")
    print(f"🔄 Обработка страниц...")

    TARGET_NEW_PAGES = 10  # Ровно 10 новых страниц за запуск
    generated_count = 0

    for item in valid_items:
        if generated_count >= TARGET_NEW_PAGES:
            print(f"🎉 План выполнен! Сгенерировано новых страниц: {generated_count}")
            break

        slug = item.get("slug", "").replace(".html", "")
        query = item.get("keyword") or item.get("query") or slug
        meta_title = item.get("title") or item.get("meta_title") or f"{query} | BOS.AGENCE"
        meta_description = item.get("description") or item.get("meta_description") or f"Услуги {query} от BOS.AGENCE."
        hero_title = item.get("h1") or item.get("hero_title") or query

        output_file = os.path.join(output_dir, f"{slug}.json")

        if os.path.exists(output_file) and os.path.getsize(output_file) > 100:
            print(f"⏭️ Пропуск (уже сгенерировано): {slug}")
            continue

        print(f"🚀 Генерация через Vercel -> Gemini [{generated_count + 1}/{TARGET_NEW_PAGES}]: {slug} (Ключ: {query})...")

        try:
            page_json = generate_page_data_via_vercel(slug, query, meta_title, meta_description, hero_title)
            
            with open(output_file, "w", encoding="utf-8") as out:
                json.dump(page_json, out, ensure_ascii=False, indent=2)

            print(f"✅ Успешно сгенерировано: {output_file}")
            generated_count += 1

            if not MOCK_MODE:
                print("⏳ Пауза 5 сек...")
                time.sleep(5)

        except Exception as e:
            print(f"❌ Ошибка при генерации {slug}: {e}")

if __name__ == "__main__":
    main()