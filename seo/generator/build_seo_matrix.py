import os
import glob
import pandas as pd
import re

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.abspath(os.path.join(BASE_DIR, '..', '..'))

INPUT_DIR = os.path.join(PROJECT_ROOT, 'seo', 'sources', 'wordstat')
OUTPUT_CORE_CSV = os.path.join(PROJECT_ROOT, 'seo', 'data', 'core', 'seo_matrix.csv')
OUTPUT_CORE_JSON = os.path.join(PROJECT_ROOT, 'seo', 'data', 'core', 'seo_core.json')

files = glob.glob(os.path.join(INPUT_DIR, "*.csv"))

if not files:
    print(f"❌ Ошибка: Не найдено файлов в папке {INPUT_DIR}")
    exit(1)

all_dfs = []
for f in files:
    try:
        df = pd.read_csv(f, sep=';', encoding='utf-8-sig').iloc[:, :2]
        df.columns = ['query', 'volume']
        all_dfs.append(df)
    except Exception as e:
        print(f"⚠️ Ошибка чтения файла {os.path.basename(f)}: {e}")

raw_df = pd.concat(all_dfs, ignore_index=True).dropna()
raw_df['volume'] = pd.to_numeric(raw_df['volume'], errors='coerce')
raw_df = raw_df.sort_values(by='volume', ascending=False)
raw_df.drop_duplicates(subset=['query'], inplace=True)

# ---------------------------------------------------------
# ЖЕСТКАЯ ФИЛЬТРАЦИЯ (По вхождению подстрок)
# ---------------------------------------------------------

STRICT_STOP_SUBSTRINGS = [
    # Бренды и маркетплейсы
    'озон', 'ozon', 'вайлдберриз', 'wildberries', 'wb', 'авито', 'avito', 'ламода', 'lamoda', 
    'роблокс', 'roblox', 'фонбет', 'сбер', 'яндекс', 'майл', 'mail', 'vk', 'вконтакте', 'телеграм', 'telegram', 'ютуб', 'youtube', 'аэрофлот', 'ржд',
    # Государственная и социальная сфера
    'суд', 'школ', 'поликлиник', 'гибдд', 'налоговая', 'мфц', 'администрация', 'пенсион', 'госуслуги', 'почта', 'колледж', 'вуз',
    # Мусор и бытовые запросы
    'вход', 'кабинет', 'скачать', 'бесплатно', 'википедия', 'игры', 'игра', 'погода', 'фильм', 'поезд', 'билет', 'знакомств', 'порно', '1 1', 'уф уф', 'гова', 'работа',
    # Мусорные гео-привязки без контекста покупки
    'области', 'район', 'край'
]

COMMERCIAL_INTENTS = [
    'разработка', 'разработать', 'создание', 'создать', 'заказать', 'заказ', 'купить', 'покупка', 
    'цена', 'стоимость', 'расчет', 'прайс', 'сколько стоит', 'под ключ', 'студия', 'агентство', 
    'бюро', 'продвижение', 'раскрутка', 'seo', 'сео', 'реклама', 'контекст', 'таргет', 'дизайн', 
    'редизайн', 'верстка', 'автоматизация', 'внедрение', 'интеграция', 'лендинг', 'landing', 
    'приложение', 'бот', 'crm', 'bitrix', 'битрикс', 'тильда', 'tilda', 'wordpress'
]

def is_strict_commercial(query_str):
    q = str(query_str).lower().strip()
    
    # 1. Отсекаем стоп-слова по подстрокам
    for stop in STRICT_STOP_SUBSTRINGS:
        if stop in q:
            # Исключение: разрешаем только целевые сравнения (например, "разработка аналога озон")
            if stop in ['озон', 'авито', 'вайлдберриз'] and any(w in q for w in ['аналог', 'типа', 'как']):
                continue
            return False
            
    # 2. Требуем наличие коммерческого интента студии
    if any(intent in q for intent in COMMERCIAL_INTENTS):
        return True
        
    return False

filtered_df = raw_df[raw_df['query'].apply(is_strict_commercial)].copy()

# ---------------------------------------------------------
# ГЕНЕРАЦИЯ META-ТЕГОВ
# ---------------------------------------------------------

def transliterate(text):
    text = str(text).lower().strip()
    translit_dict = {
        'а': 'a', 'б': 'b', 'в': 'v', 'г': 'g', 'д': 'd', 'е': 'e', 'ё': 'e',
        'ж': 'zh', 'з': 'z', 'и': 'i', 'й': 'y', 'к': 'k', 'л': 'l', 'м': 'm',
        'н': 'n', 'о': 'o', 'п': 'p', 'р': 'r', 'с': 's', 'т': 't', 'у': 'u',
        'ф': 'f', 'х': 'kh', 'ц': 'ts', 'ч': 'ch', 'ш': 'sh', 'щ': 'sch',
        'ъ': '', 'ы': 'y', 'ь': '', 'э': 'e', 'ю': 'yu', 'я': 'ya', ' ': '-'
    }
    res = "".join([translit_dict.get(c, c) for c in text])
    res = re.sub(r'[^a-z0-9\-]', '', res)
    return re.sub(r'\-+', '-', res).strip('-')

def build_smart_meta(query):
    q_clean = query.strip()
    q_cap = q_clean.capitalize()
    
    if any(word in q_clean.lower() for word in ['цена', 'стоимость', 'сколько стоит', 'прайс']):
        title = f"{q_cap} — Стоимость и прайс-лист | BOS.AGENCE"
        desc = f"Узнайте стоимость услуг по направлению «{q_clean}» от digital-агентства BOS.AGENCE. Прозрачные сметы, премиальное качество и быстрые сроки."
    else:
        title = f"{q_cap} под ключ — Digital-агентство BOS.AGENCE"
        desc = f"Профессиональные digital-услуги: {q_clean}. Разработка сложных IT-продуктов, сервисов и веб-систем для бизнеса по всей России."

    return title, desc

matrix = []
used_slugs = set()

for _, row in filtered_df.iterrows():
    query_raw = str(row['query']).strip()
    slug = transliterate(query_raw)
    
    if not slug or slug in used_slugs:
        continue
    used_slugs.add(slug)
    
    meta_title, meta_desc = build_smart_meta(query_raw)
    
    matrix.append({
        'slug': slug,
        'query': query_raw,
        'meta_title': meta_title,
        'meta_description': meta_desc,
        'hero_title': query_raw.capitalize(),
        'volume': int(row['volume']) if pd.notnull(row['volume']) else 0
    })

seo_df = pd.DataFrame(matrix)

os.makedirs(os.path.dirname(OUTPUT_CORE_CSV), exist_ok=True)
seo_df.to_csv(OUTPUT_CORE_CSV, index=False, encoding='utf-8-sig', sep=';')
seo_df.to_json(OUTPUT_CORE_JSON, orient='records', force_ascii=False, indent=2)

print(f"\n✅ Чистка завершена! Из {len(raw_df)} ключей отфильтровано {len(matrix)} целевых коммерческих страниц.")