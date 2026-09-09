from pathlib import Path
import subprocess,re
p=Path('index.html'); s=p.read_text(encoding='utf-8'); old=subprocess.check_output(['git','show','HEAD:index.html']).decode('utf-8')
inapp=re.search(r'    <script>\s*\(function \(\) \{.*?</script>',old,re.S)
if inapp: s=s.replace('</head>',inapp.group(0)+'\n</head>')
s=s.replace('><','>\n<');p.write_text(s,encoding='utf-8')
p=Path('home.css');s=p.read_text(encoding='utf-8-sig');p.write_text(s.replace('}', '}\n'),encoding='utf-8')
