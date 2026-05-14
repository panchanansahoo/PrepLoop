import os, re
with open('frontend/src/App.jsx', 'r', encoding='utf-8') as f:
    content = f.read()
matches = re.findall(r"import\(['\"](.*?)['\"]\)|import .*? from ['\"](.*?)['\"]", content)
paths = [m[0] or m[1] for m in matches]
missing = []
for p in paths:
    if p.startswith('./'):
        full_path = os.path.join('frontend/src', p[2:])
        if not (os.path.exists(full_path) or os.path.exists(full_path + '.jsx') or os.path.exists(full_path + '.js') or os.path.exists(full_path + '.css')):
            missing.append(p)
print('Missing imports:', missing)
