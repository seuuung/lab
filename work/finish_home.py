from pathlib import Path
p=Path('tests/tier1_feature_test.js');s=p.read_text(encoding='utf-8').replace('/About\\s*Me|소개|Profile/i.test(indexHtml)', '/<section\\b[^>]*id="about"[^>]*aria-labelledby="about-title"/.test(indexHtml)');p.write_text(s,encoding='utf-8')
p=Path('tests/tier2_boundary_test.js');s=p.read_text(encoding='utf-8').replace('/safe-area-inset-bottom/i.test(indexHtml)', '/safe-area-inset-bottom/i.test(homeCss)');p.write_text(s,encoding='utf-8')
p=Path('sculpture.js');s=p.read_text(encoding='utf-8');s=s.replace("  let gl;", "  function showFallback() {\n    canvas.removeAttribute('tabindex');\n    canvas.setAttribute('aria-label', '금속 매듭 조형');\n    stage.querySelector('.sculpture-note').hidden = true;\n  }\n  let gl;")
s=s.replace("  catch (_) { return; }", "  catch (_) { showFallback(); return; }")
s=s.replace("    canvas.removeAttribute('tabindex');\n    canvas.setAttribute('aria-label', '금속 매듭 조형');\n    stage.querySelector('.sculpture-note').hidden = true;\n    return;", "    showFallback();\n    return;")
p.write_text(s,encoding='utf-8')
