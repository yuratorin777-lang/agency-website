import os
import subprocess
import sys
import time
from datetime import datetime

# РћРїСЂРµРґРµР»СЏРµРј РєРѕСЂРµРЅСЊ РїСЂРѕРµРєС‚Р°
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

def run_command(cmd, cwd=BASE_DIR):
    print(f"рџ‘‰ Р’С‹РїРѕР»РЅСЏРµРј: {cmd}")
    # РџСЂРёРЅСѓРґРёС‚РµР»СЊРЅРѕ Р·Р°РґР°РµРј UTF-8 РґР»СЏ РїРѕРґРїСЂРѕС†РµСЃСЃРѕРІ Python
    env = os.environ.copy()
    env["PYTHONIOENCODING"] = "utf-8"
    
    result = subprocess.run(cmd, shell=True, cwd=cwd, text=True, capture_output=True, env=env, encoding='utf-8', errors='replace')
    if result.returncode != 0:
        print(f"вќЊ РћС€РёР±РєР° РїСЂРё РІС‹РїРѕР»РЅРµРЅРёРё РєРѕРјР°РЅРґС‹ {cmd}:\n{result.stderr}")
        return False
    if result.stdout:
        print(result.stdout)
    return True

def run_autobatch():
    print(f"\n==========================================")
    print(f"рџљЂ Р—Р°РїСѓСЃРє SEO-Р°РІС‚РѕРїРёР»РѕС‚Р° [{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}]")
    print(f"==========================================\n")

    # 1. Р—Р°РїСѓСЃРє РіРµРЅРµСЂР°С‚РѕСЂР° СЃС‚СЂР°РЅРёС† Python
    print("вљ™пёЏ РЁР°Рі 1: Р“РµРЅРµСЂР°С†РёСЏ РЅРѕРІС‹С… JSON-СЃС‚СЂР°РЅРёС† С‡РµСЂРµР· Python...")
    gen_success = run_command("python seo/generator/generate_pages.py")
    if not gen_success:
        print("вќЊ Р“РµРЅРµСЂР°С†РёСЏ РѕСЃС‚Р°РЅРѕРІР»РµРЅР° РёР·-Р·Р° РѕС€РёР±РєРё.")
        return

    # 2. РЎР±РѕСЂРєР° СЃС‚Р°С‚РёРєРё Рё РѕР±РЅРѕРІР»РµРЅРёСЏ index.html / sitemap.xml
    print("вљ™пёЏ РЁР°Рі 2: РЎР±РѕСЂРєР° СЃС‚Р°С‚РёРєРё (build.js)...")
    build_success = run_command("node build.js", cwd="seo/generator")
    if not build_success:
        print("вќЊ РЎР±РѕСЂРєР° РѕСЃС‚Р°РЅРѕРІР»РµРЅР° РёР·-Р·Р° РѕС€РёР±РєРё.")
        return

    # 3. Р”РµРїР»РѕР№ РёР·РјРµРЅРµРЅРёР№ РІ Git РґР»СЏ Vercel
    print("вљ™пёЏ РЁР°Рі 3: РђРІС‚Рѕ-РґРµРїР»РѕР№ РІ Git...")
    timestamp = datetime.now().strftime('%Y-%m-%d %H:%M')
    commit_msg = f"feat(seo): auto-generated batch [{timestamp}]"
    
    run_command("git add .")
    run_command(f'git commit -m "{commit_msg}"')
    push_success = run_command("git push origin main")

    if push_success:
        print(f"\nвњ… РЈРЎРџР•РҐ: Р‘Р°С‚С‡ СЃРіРµРЅРµСЂРёСЂРѕРІР°РЅ, СЃРѕР±СЂР°РЅ Рё РѕС‚РїСЂР°РІР»РµРЅ РЅР° Vercel!")
    else:
        print("\nвљ пёЏ Р’РЅРёРјР°РЅРёРµ: РќРµ СѓРґР°Р»РѕСЃСЊ РІС‹РїРѕР»РЅРёС‚СЊ git push. РџСЂРѕРІРµСЂСЊС‚Рµ СЃС‚Р°С‚СѓСЃ СЂРµРїРѕР·РёС‚РѕСЂРёСЏ.")

if __name__ == "__main__":
    run_autobatch()
