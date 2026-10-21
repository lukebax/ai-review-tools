#!/usr/bin/env python3
"""Build the static presentation overview from the maintained public map data.

Run from any directory: python3 presentation/sample/build_map.py
The source is ../../map/map-data.json relative to this script. No private files,
third-party packages, network access or browser rendering are required.
"""
import argparse
from collections import Counter
from html import escape
import json
from pathlib import Path

HERE = Path(__file__).resolve().parent
SOURCE = (HERE / '../../map/map-data.json').resolve()
OUTPUT = HERE / 'assets/map-overview.svg'
X, Y, WIDTH, ROW_HEIGHT = 258, 132, 894, 34.5
NAVY, MUTED, GRID = '#173b52', '#526e80', '#c8d6dd'

# Short display labels follow the approved overview plan. Exact source labels
# remain in the accessible row titles, cell titles and data-stage attributes.
STAGE_LABELS = {
    'Writing a protocol': 'Writing a protocol',
    'The Search': 'The search',
    'Screening for relevance': 'Screening for relevance',
    'Quality assessment': 'Quality assessment',
    'Data extraction': 'Data extraction',
    'Data synthesis': 'Data synthesis',
    'Certainty of evidence assessment': 'Certainty of evidence',
    'Writing a manuscript': 'Writing a manuscript',
}


def fmt(number):
    return f'{number:.4f}'.rstrip('0').rstrip('.')


def text(x, y, label, size=23, anchor='start', weight=500, **attrs):
    extra = ''.join(f' {key.replace("_", "-")}="{escape(str(value), quote=True)}"'
                    for key, value in attrs.items())
    return (f'<text x="{fmt(x)}" y="{fmt(y)}" font-size="{size}" '
            f'text-anchor="{anchor}" font-weight="{weight}"{extra}>'
            f'{escape(label)}</text>')


def build(check=False):
    data = json.loads(SOURCE.read_text(encoding='utf-8'))
    tools, stages = data['tools'], data['stages']
    groups, recommendations = data['groups'], data['recommendations']
    assert len(tools) == 56 and len(stages) == 8, 'Revisit overview layout for changed map dimensions.'
    assert set(stages) == set(STAGE_LABELS), 'Review any new or renamed stage before rendering.'
    palette = {r['id']: r['color'] for r in recommendations}
    rec_labels = {r['id']: r['label'] for r in recommendations}
    rec_order = {r['id']: i for i, r in enumerate(recommendations)}
    group_order = [g['id'] for g in groups]
    counts = Counter(t['groupId'] for t in tools)
    assert [t['id'] for t in tools] == [t['id'] for g in group_order for t in tools if t['groupId'] == g], 'Source tool groups must stay contiguous.'
    assert group_order == ['rule-based', 'unsupervised', 'supervised', 'generative']
    cell_width = WIDTH / len(tools)
    cells, populated, mixed = [], 0, 0
    for row, stage in enumerate(stages):
        for column, tool in enumerate(tools):
            functions = [f for f in tool['functions'] if f['stage'] == stage]
            categories = sorted({f['recommendation'] for f in functions}, key=rec_order.__getitem__)
            assert len(categories) <= 2, 'More than two recommendations requires a reviewed visual treatment.'
            populated += bool(categories)
            mixed += len(categories) == 2
            x, y = X + column * cell_width, Y + row * ROW_HEIGHT
            cell_title = f'{tool["name"]}; {stage}; ' + (' and '.join(rec_labels[c] for c in categories) if categories else 'No use mapped')
            cells.append(f'<g class="map-cell" data-tool="{escape(tool["id"], quote=True)}" data-stage="{escape(stage, quote=True)}" data-recommendations="{",".join(categories)}">')
            cells.append(f'<title>{escape(cell_title)}</title>')
            cells.append(f'<rect x="{fmt(x)}" y="{fmt(y)}" width="{fmt(cell_width)}" height="{ROW_HEIGHT}" fill="{palette[categories[0]] if categories else "#ffffff"}"/>')
            if len(categories) == 2:
                # Same halves as map-template.html cellPaint(): first category
                # upper-left, second category lower-right, in source rec order.
                cells.append(f'<path d="M{fmt(x + cell_width)} {fmt(y)}V{fmt(y + ROW_HEIGHT)}H{fmt(x)}Z" fill="{palette[categories[1]]}"/>')
            cells.append('</g>')

    metadata = {
        'source': '../../map/map-data.json',
        'toolOrder': [t['id'] for t in tools],
        'stageOrder': stages,
        'groupOrder': group_order,
        'groupToolCounts': dict(counts),
        'recommendationOrder': list(palette),
        'palette': palette,
        'populatedCells': populated,
        'mixedCells': mixed,
        'blankCells': len(tools) * len(stages) - populated,
        'functionCount': sum(len(t['functions']) for t in tools),
    }
    svg = [
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1152 430" role="img" aria-labelledby="map-title map-description">',
        '<title id="map-title">AI tools across eight review stages</title>',
        '<desc id="map-description">Static overview of the maintained RAISE-based map: 56 tool columns in source order, grouped into rule-based algorithms, unsupervised machine learning, supervised machine learning, and generative large language models. Eight review stages run down the side. Recommendation colours and diagonal split cells match the interactive map. White cells mean no use mapped. Tool names are omitted visually in this overview; each cell retains its tool, stage and recommendation in its accessible title. The neighbouring slide key explains the five colours.</desc>',
        f'<metadata id="map-source-metadata">{escape(json.dumps(metadata, separators=(",", ":")))}</metadata>',
        '<g font-family="system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif" fill="'+NAVY+'">',
        '<rect width="1152" height="430" fill="#f7f9fa"/>',
    ]
    # Light neutral family bands distinguish groups without borrowing the
    # recommendation colours. Headers never change source column widths.
    bounds, cursor = {}, X
    for group in groups:
        width = counts[group['id']] * cell_width
        bounds[group['id']] = (cursor, cursor + width)
        svg.append(f'<rect x="{fmt(cursor)}" y="51" width="{fmt(width)}" height="81" fill="#eaf0f3"/>')
        cursor += width
    labels = {
        'rule-based': ('Rule-based', 'algorithms'),
        'supervised': ('Supervised', 'machine', 'learning'),
        'generative': ('Generative large', 'language models'),
    }
    for gid, lines in labels.items():
        left, right = bounds[gid]
        size = 22 if gid == 'supervised' else 24
        baselines = (74, 99, 124) if gid == 'supervised' else (87, 114)
        for baseline, line in zip(baselines, lines):
            svg.append(text((left + right) / 2, baseline, line, size=size, anchor='middle', weight=650))
    left, right = bounds['unsupervised']
    middle = (left + right) / 2
    svg.append(text(middle, 25, 'Unsupervised machine learning', size=23, anchor='middle', weight=650))
    svg.append(f'<path d="M{fmt(middle)} 36V122" fill="none" stroke="{MUTED}" stroke-width="1.8"/>')
    svg.append(f'<path d="M{fmt(middle - 4)} 117L{fmt(middle)} 123L{fmt(middle + 4)} 117" fill="none" stroke="{MUTED}" stroke-width="1.8"/>')
    svg.append(text(0, 117, 'Review stage', size=22, weight=650, fill=MUTED))

    for row, stage in enumerate(stages):
        svg.append(f'<g class="stage-label" data-stage="{escape(stage, quote=True)}"><title>{escape(stage)}</title>')
        svg.append(text(0, Y + row * ROW_HEIGHT + ROW_HEIGHT / 2 + 8, STAGE_LABELS[stage], size=23))
        svg.append('</g>')
    svg.extend(cells)
    # Grid is drawn above the fills so mixed halves meet the same visible
    # bounds as solid cells; stronger internal rules mark family boundaries.
    for column in range(len(tools) + 1):
        x = X + column * cell_width
        svg.append(f'<path d="M{fmt(x)} {Y}V{Y + len(stages) * ROW_HEIGHT}" stroke="{GRID}" stroke-width="0.8"/>')
    for row in range(len(stages) + 1):
        y = Y + row * ROW_HEIGHT
        svg.append(f'<path d="M{X} {y}H{X + WIDTH}" stroke="{GRID}" stroke-width="0.8"/>')
    for group in groups[:-1]:
        boundary = bounds[group['id']][1]
        svg.append(f'<path d="M{fmt(boundary)} 51V{Y + len(stages) * ROW_HEIGHT}" stroke="{MUTED}" stroke-width="2.1"/>')
    svg.append('</g></svg>')
    content = '\n'.join(svg) + '\n'
    if check:
        if not OUTPUT.exists() or OUTPUT.read_text(encoding='utf-8') != content:
            raise SystemExit(f'Stale visual: {OUTPUT}. Run build_map.py to regenerate.')
    else:
        OUTPUT.parent.mkdir(parents=True, exist_ok=True)
        OUTPUT.write_text(content, encoding='utf-8')
    print(json.dumps({k: v for k, v in metadata.items() if k in ('groupToolCounts', 'populatedCells', 'mixedCells', 'blankCells', 'functionCount')}, indent=2))
    print(f'{"Checked" if check else "Wrote"} {OUTPUT}')


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--check', action='store_true', help='Check the generated visual without writing files')
    build(check=parser.parse_args().check)
