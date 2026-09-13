import os
import subprocess
import sys
import time
from datetime import datetime

# Определяем корень проекта
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

def run_command(cmd, cwd=BASE_DIR):
    print(f"👉 Выполняем: {cmd}")
    # Принудительно задаем UTF-8 для подпроцессов Python
    env = os.environ.copy()
    env["PYTHONIOENCODING"] = "utf-8"
    
    result = subprocess.run(cmd, shell=True, cwd=cwd, text=True, capture_output=True, env=env, encoding='utf-8', errors='replace')
    if result.returncode != 0:
        print(f"❌ Ошибка при выполнении команды {cmd}:\n{result.stderr}")
        return False
    if result.stdout:
        print(result.stdout)
    return True

def run_autobatch():
    print(f"\n==========================================")
    print(f"🚀 Запуск SEO-автопилота [{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}]")
    print(f"==========================================\n")

    # 1. Запуск генератора страниц Python
    print("⚙️ Шаг 1: Генерация новых JSON-страниц через Python...")
    gen_success = run_command("python seo/generator/generate_pages.py")
    if not gen_success:
        print("❌ Генерация остановлена из-за ошибки.")
        return

    # 2. Сборка статики и обновления index.html / sitemap.xml
    print("⚙️ Шаг 2: Сборка статики (build.js)...")
    build_success = run_command("node seo/generator/build.js")
    if not build_success:
        print("❌ Сборка остановлена из-за ошибки.")
        return

    # 3. Деплой изменений в Git для Vercel
    print("⚙️ Шаг 3: Авто-деплой в Git...")
    timestamp = datetime.now().strftime('%Y-%m-%d %H:%M')
    commit_msg = f"feat(seo): auto-generated batch [{timestamp}]"
    
    run_command("git add .")
    run_command(f'git commit -m "{commit_msg}"')
    push_success = run_command("git push origin main")

    if push_success:
        print(f"\n✅ УСПЕХ: Батч сгенерирован, собран и отправлен на Vercel!")
    else:
        print("\n⚠️ Внимание: Не удалось выполнить git push. Проверьте статус репозитория.")

if __name__ == "__main__":
    run_autobatch()