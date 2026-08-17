import json
import sys

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

with open('.agents/challenger_1/adversarial_results.json', encoding='utf-8') as f:
    data = json.load(f)

print(f"Total: {data['summary']['total']}, Passed: {data['summary']['passed']}, Failed: {data['summary']['failed']}")

for suite_name, tests in data['suites'].items():
    fails = [t for t in tests if not t['passed']]
    print(f"\n==========================================")
    print(f"=== {suite_name} (Total: {len(tests)}, Failed: {len(fails)}) ===")
    print(f"==========================================")
    for t in fails:
        print(f"\n[{t['status']}] {t['id']}: {t['description']}")
        print(f"  Details: {t['details']}")
