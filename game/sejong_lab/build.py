"""세종 개발실 소스 코드를 외부 의존성 없는 단일 HTML로 묶습니다."""
from pathlib import Path

root = Path(__file__).resolve().parent
content = (root / 'index.template.html').read_text(encoding='utf-8')
for placeholder, filename in [
    ('/*INLINE_STYLE*/', 'styles.css'),
    ('/*INLINE_DOCS*/', 'docs.reference.html'),
    ('/*INLINE_RUNTIME*/', 'engine.js'),
    ('/*INLINE_APP*/', 'app.js'),
]:
    assert placeholder in content, f'플레이스홀더 없음: {placeholder}'
    content = content.replace(placeholder, (root / filename).read_text(encoding='utf-8'))
for filename in ('index.html', 'sejong-lab.html'):
    (root / filename).write_text(content, encoding='utf-8')
print('완료: index.html, sejong-lab.html')
