import json, os, re, unicodedata

DIR = 'public/data/lectures/'

def is_chinese(ch):
    """Check if character is Chinese/CJK"""
    cp = ord(ch)
    return (0x4E00 <= cp <= 0x9FFF or 0x3400 <= cp <= 0x4DBF or
            0xF900 <= cp <= 0xFAFF or 0x3000 <= cp <= 0x303F or  # CJK punctuation
            0xFF00 <= cp <= 0xFFEF)  # Fullwidth forms

def is_japanese_kana(ch):
    cp = ord(ch)
    return 0x3040 <= cp <= 0x30FF

# Characters that are OK outside $...$ (structural, punctuation)
ok = ' \t\n\r，。、；：？！…—～｜・「」『』（）【】《》〈〉〔〕〖〗〘〙'
ok += '①②③④⑤⑥⑦⑧⑨⑩★☆●○◆◇■□▲△▼▽'
ok += '→←↑↓↔⇒⇐➔⟹⟸'
ok += '-*#_~`/|@!?.:;,+=\'"'
OK_CHARS = set(ok)

for fname in sorted(os.listdir(DIR)):
    if not fname.endswith('.json'):
        continue
    
    path = os.path.join(DIR, fname)
    with open(path) as f:
        data = json.load(f)
    
    issues = []
    for part in data.get('parts', []):
        for section in part.get('sections', []):
            text = section['content']
            key = section['key']
            
            # Strip $...$ blocks
            stripped = re.sub(r'\$[^$]+\$', ' ', text)
            stripped = re.sub(r'\$\$[^$]+\$\$', ' ', stripped)
            
            for li, line in enumerate(stripped.split('\n')):
                ls = line.strip()
                if not ls or ls.startswith('!['):
                    continue
                
                # Find non-Chinese characters
                non_cn = []
                for ch in ls:
                    if ch in OK_CHARS:
                        continue
                    if is_chinese(ch):
                        continue
                    if is_japanese_kana(ch):
                        continue
                    if ch.isspace():
                        continue
                    non_cn.append(ch)
                
                if non_cn:
                    issues.append(f'  [{key}] L{li}: {non_cn[:15]} | {ls[:80]}')
    
    if issues:
        print(f'\n=== {fname} [{len(issues)}] ===')
        for i in issues[:8]:
            print(i)
    else:
        print(f'{fname}: CLEAN')
