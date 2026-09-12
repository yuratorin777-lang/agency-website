import os
import json
import random
import time  # Для предотвращения ошибки 429 (лимиты API)
from dotenv import load_dotenv
from google import genai
from google.genai import types

load_dotenv()

MOCK_MODE = False  # False = Боевой режим через Gemini 2.5 Flash

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
TEMPLATES = [f"template_{i}" for i in range(1, 8)]

SYSTEM_PROMPT = """
Ты — шеф-редактор и главный архитектор IT-агентства BOS.AGENCE.
Твоя задача — создать глубокую, коммерчески убедительную landing page для услуги digital-агентства на основе SEO-запроса.

ВАЖНЕЙШИЕ ПРАВИЛА КОПИРАЙТИНГА:
1. НИКАКОЙ ИИ-ВОДЫ. Запрещены клише: "в современном мире", "динамично развивающийся", "мы предлагаем широкий спектр", "индивидуальный подход к каждому".
2. ПИШИ КАК ЧЕЛОВЕК-ЭКСПЕРТ. Используй конкретику, цифры, стек (React, Node.js, Python, PostgreSQL, Docker), понятную выгоду для бизнеса (ROI, конверсия, автоматизация).
3. ЗАЩИТА ОТ МУСОРНЫХ SEO-КЛЮЧЕЙ:
   - Если входной запрос содержит нерелевантные слова (например, "купить жд билеты", "вайлдберриз каталог", "расписание поездов"):
   - НЕ ПИШИ про продажу билетов или работу маркетплейса!
   - Обыграй этот ключ в контексте БИЗНЕС-РАЗРАБОТКИ.
   - Пример для "купить жд билеты": "Разработка highload-систем бронирования билетов и интеграция с АСУ Экспресс".
   - Пример для "вайлдберриз": "Разработка e-commerce платформ и интеграция с Wildberries API / сервисами аналитики".

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

def generate_page_data(client, slug, query, meta_title, meta_description, hero_title):
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

    if MOCK_MODE or not GEMINI_API_KEY:
        print(f"⚠️ MOCK MODE: Генерируем тестовый JSON для {slug}")
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

    response = client.models.generate_content(
        model='gemini-2.5-flash',
        contents=user_prompt,
        config=types.GenerateContentConfig(
            system_instruction=SYSTEM_PROMPT,
            response_mime_type="application/json",
            temperature=0.3
        )
    )

    return json.loads(response.text)


def main():
    if not MOCK_MODE and not GEMINI_API_KEY:
        raise ValueError("❌ GEMINI_API_KEY не найден в файле .env!")

    client = genai.Client(api_key=GEMINI_API_KEY) if not MOCK_MODE else None

    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    core_json_path = os.path.join(base_dir, "data", "core", "seo_core.json")
    output_dir = os.path.join(base_dir, "data", "pages")

    os.makedirs(output_dir, exist_ok=True)

    with open(core_json_path, "r", encoding="utf-8") as f:
        seo_items = json.load(f)

    print(f"📊 Режим: {'MOCK' if MOCK_MODE else 'БОЕВОЙ (Gemini 2.5 Flash)'}")
    print(f"🔄 Обработка страниц...")

    for item in seo_items[:10]:
        slug = item.get("slug")
        query = item.get("query", "")
        meta_title = item.get("meta_title", "")
        meta_description = item.get("meta_description", "")
        hero_title = item.get("hero_title", "")

        print(f"🚀 Генерация: {slug} (Ключ: {query})...")

        try:
            page_json = generate_page_data(client, slug, query, meta_title, meta_description, hero_title)
            
            output_file = os.path.join(output_dir, f"{slug}.json")
            with open(output_file, "w", encoding="utf-8") as out:
                json.dump(page_json, out, ensure_ascii=False, indent=2)

            print(f"✅ Сохранено: {output_file}")

            # Задержка 13 секунд для соблюдения лимитов Free Tier (5 RPM)
            if not MOCK_MODE:
                print("⏳ Пауза 13 сек для лимита API...")
                time.sleep(13)

        except Exception as e:
            print(f"❌ Ошибка при генерации {slug}: {e}")

if __name__ == "__main__":
    main()