import os
import json
import re
import subprocess

# Путь к папке с готовыми JSON-файлами страниц
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PAGES_DIR = os.path.join(BASE_DIR, "data", "pages")

def clean_and_humanize(text):
    if not text or not isinstance(text, str):
        return text

    cleaned = text.strip()

    # Если это slug/транслит (напр. "vnedrenie-ai-agentov"), преобразуем в нормальный текст
    if not re.search(r'[а-яА-ЯёЁ]', cleaned):
        cleaned = cleaned.replace('-', ' ').replace('_', ' ').strip()

    # Список поисковых "хвостов", которые портят H1
    trash_patterns = [
        r'\bкупить\b', r'\bцена\b', r'\bстоимость\b', 
        r'\bзаказать\b', r'\bнедорого\b', r'\bмосква\b',
        r'\bмаркет\b', r'\bпод ключ\b'
    ]

    for pattern in trash_patterns:
        cleaned = re.sub(pattern, '', cleaned, flags=re.IGNORECASE)

    # Убираем двойные пробелы, висячие знаки препинания и делаем заглавную букву
    cleaned = re.sub(r'\s+', ' ', cleaned).strip(" ,.-")
    
    if not cleaned:
        return text

    return cleaned[0].upper() + cleaned[1:]

def fix_all_page_json_files():
    if not os.path.exists(PAGES_DIR):
        print(f"❌ Папка с файлами страниц не найдена: {PAGES_DIR}")
        return

    fixed_count = 0
    json_files = [f for f in os.listdir(PAGES_DIR) if f.endswith('.json')]

    print(f"🔍 Найдено {len(json_files)} JSON-файлов для проверки...")

    for filename in json_files:
        filepath = os.path.join(PAGES_DIR, filename)

        try:
            with open(filepath, 'r', encoding='utf-8') as f:
                data = json.load(f)

            is_modified = False

            # 1. Исправляем seo.h1
            if 'seo' in data and isinstance(data['seo'], dict):
                old_h1 = data['seo'].get('h1', '')
                new_h1 = clean_and_humanize(old_h1)
                if old_h1 != new_h1:
                    data['seo']['h1'] = new_h1
                    is_modified = True

                # 2. Исправляем seo.title
                old_seo_title = data['seo'].get('title', '')
                new_seo_title = clean_and_humanize(old_seo_title)
                if old_seo_title != new_seo_title:
                    data['seo']['title'] = new_seo_title
                    is_modified = True

            # 3. Исправляем hero.title
            if 'hero' in data and isinstance(data['hero'], dict):
                old_hero_title = data['hero'].get('title', '')
                new_hero_title = clean_and_humanize(old_hero_title)
                if old_hero_title != new_hero_title:
                    data['hero']['title'] = new_hero_title
                    is_modified = True

            # Пересохраняем JSON, если были изменения
            if is_modified:
                with open(filepath, 'w', encoding='utf-8') as f:
                    json.dump(data, f, ensure_ascii=False, indent=2)
                fixed_count += 1

        except Exception as e:
            print(f"⚠️ Ошибка при обработке {filename}: {e}")

    print(f"✅ Успешно обновлено JSON-файлов: {fixed_count} из {len(json_files)}")

if __name__ == "__main__":
    fix_all_page_json_files()