# SPDX-License-Identifier: MIT
"""Validate and build the standalone map using only the Python standard library."""
from collections import Counter, defaultdict
from pathlib import Path
import json
import re
import argparse

HERE = Path(__file__).resolve().parent
FIELDS = ('id', 'stage', 'functionName', 'descriptionMd', 'aiCategoryMd',
          'whyCategoryMd', 'recommendation', 'whyRecommendationMd',
          'officialUrlMd', 'sourcePagesMd')

def validate(data):
    """Reject omissions, ambiguous identities and unsupported visual encodings."""
    assert 'v4' in data['meta']['guidanceVersion'], 'Current build requires RAISE v4 or an explicitly reviewed successor.'
    recs = {r['id'] for r in data['recommendations']}
    assert len(recs) == 5
    for r in data['recommendations']:
        assert r['description'].strip() and re.fullmatch(r'#[0-9A-Fa-f]{6}', r['color'])
    assert len(data['stages']) == len(set(data['stages'])) == 8
    group_order = [g['id'] for g in data['groups']]
    groups = set(group_order)
    assert len(groups) == len(group_order) and all(g['label'].strip() for g in data['groups']), 'Group identities must be unique and named.'
    # Header spans and cell columns must describe the same contiguous groups.
    tool_groups = [group_order.index(t['groupId']) for t in data['tools']]
    assert tool_groups == sorted(tool_groups), 'Tool columns must follow the display-group order.'
    ids, fn_ids, cells = set(), set(), defaultdict(set)
    counts = Counter()
    for outside, tools in ((False, data['tools']), (True, data.get('outsideScopeTools', []))):
        for tool in tools:
            assert tool['id'] not in ids, f"Duplicate tool {tool['id']}"
            ids.add(tool['id'])
            assert tool['name'].strip() and tool['groupId'] in groups and tool['functions']
            for f in tool['functions']:
                assert all(isinstance(f.get(key), str) and f[key].strip() for key in FIELDS), f"Missing function field: {f.get('id')}"
                assert f['id'] not in fn_ids, f"Duplicate function {f['id']}"
                fn_ids.add(f['id'])
                assert f['recommendation'] in recs
                assert 'RAISE 3 v4' in f['sourcePagesMd'], f"Stale source: {f['id']}"
                assert outside or f['stage'] in data['stages']
                for key in FIELDS:
                    for url in re.findall(r'\]\(([^)]+)\)', f[key]):
                        assert url.startswith(('https://', 'http://')), f"Non-public link {url}"
                if not outside:
                    cells[(tool['id'],f['stage'])].add(f['recommendation'])
                    counts['functions'] += 1
    assert max(map(len,cells.values())) <= 2, 'A cell has >2 recommendations: revise its visual encoding before building.'
    counts.update(tools=len(data['tools']), populatedCells=len(cells), mixedCells=sum(len(v)>1 for v in cells.values()), maximumRecommendationsPerCell=max(map(len,cells.values())), separateOutsideScopeTools=len(data.get('outsideScopeTools',[])))
    return dict(counts)

def render(data, template):
    counts = validate(data)
    payload = json.dumps(data, ensure_ascii=False, separators=(',', ':')).replace('<', '\\u003c').replace('\u2028', '\\u2028').replace('\u2029', '\\u2029')
    assert template.count('@@MAP_DATA@@') == 1
    result = template.replace('@@MAP_DATA@@', payload)
    assert not re.search(r'<script[^>]+src=|<link[^>]+href=[\"\']https?://', result), 'HTML must remain self-contained.'
    return result, counts


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--check', action='store_true', help='Validate that index.html matches its sources without changing any files.')
    args = parser.parse_args()
    data = json.loads((HERE/'map-data.json').read_text(encoding='utf-8'))
    template = (HERE/'map-template.html').read_text(encoding='utf-8')
    result, counts = render(data, template)
    output = HERE/'index.html'
    encoded = result.encode('utf-8')
    if args.check:
        if not output.is_file() or output.read_bytes() != encoded:
            parser.exit(1, 'index.html is missing or stale. Run python3 build.py and check the result.\n')
        print('index.html matches its validated sources.')
    else:
        output.write_bytes(encoded)
        print('Built index.html. Open it in a browser; no server required.')
    print(json.dumps(counts, indent=2))


if __name__ == '__main__':
    main()
