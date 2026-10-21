#!/usr/bin/env python3
"""Generate static map views for the presentation from ../map/map-data.json.

Run from any directory with Python 3; uses only the standard library and public
repository files. The source remains authoritative for tools, stages, colours,
function assignments, and the recommendation order within diagonal split cells.
"""
import argparse
from collections import Counter
from hashlib import sha256
from html import escape
import json
from pathlib import Path
import xml.etree.ElementTree as ET

HERE = Path(__file__).resolve().parent
SOURCE = (HERE / '../map/map-data.json').resolve()
OUT = HERE / 'assets/maps'
CHECK = False
DATA = json.loads(SOURCE.read_text(encoding='utf-8'))
TOOLS, STAGES, GROUPS, RECS = (DATA[k] for k in ('tools', 'stages', 'groups', 'recommendations'))
TOOL = {t['id']: t for t in TOOLS}
PALETTE = {r['id']: r['color'] for r in RECS}
REC_LABELS = {r['id']: r['label'] for r in RECS}
REC_ORDER = list(PALETTE)
GROUP_ORDER = [g['id'] for g in GROUPS]
INK, MUTED, PAPER, GRID, BAND = '#203746', '#526b7c', '#f7f9fa', '#c8d6dd', '#eaf0f3'
X, Y, WIDTH, ROW = 258, 132, 894, 34.5
FONT = 'system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif'
DISPLAY_STAGES = {
    'Writing a protocol': 'Writing a protocol',
    'The Search': 'The search',
    'Screening for relevance': 'Screening for relevance',
    'Quality assessment': 'Quality assessment',
    'Data extraction': 'Data extraction',
    'Data synthesis': 'Data synthesis',
    'Certainty of evidence assessment': 'Certainty of evidence',
    'Writing a manuscript': 'Writing a manuscript',
}


def f(value):
    return f'{value:.4f}'.rstrip('0').rstrip('.')


def text(x, y, value, size=23, anchor='start', weight=500, colour=INK):
    return (f'<text x="{f(x)}" y="{f(y)}" font-size="{size}" text-anchor="{anchor}" '
            f'font-weight="{weight}" fill="{colour}">{escape(value)}</text>')


def categories(tool, stage):
    return sorted({v['recommendation'] for v in tool['functions'] if v['stage'] == stage}, key=REC_ORDER.index)


def panel_metadata(name, tools, stages):
    return {
        'id': name,
        'toolOrder': [t['id'] for t in tools],
        'stageOrder': stages,
        'tools': [{
            'id': t['id'], 'name': t['name'], 'groupId': t['groupId'],
            'functions': [{k: v[k] for k in ('id', 'stage', 'functionName', 'recommendation')}
                          for v in t['functions'] if v['stage'] in stages],
            'cells': [{'stage': s, 'recommendations': categories(t, s)} for s in stages],
        } for t in tools],
    }


class Svg:
    def __init__(self, title, desc, height=430):
        self.title, self.desc, self.height = title, desc, height
        self.parts = [f'<rect width="1152" height="{height}" fill="{PAPER}"/>']
        self.panels = []
        self.expected_cells = []
        self.highlights = []

    def add(self, element):
        self.parts.append(element)

    def panel(self, name, tools, stages):
        assert not any(p['id'] == name for p in self.panels)
        self.panels.append(panel_metadata(name, tools, stages))

    def cell(self, panel, tool, stage, x, y, width, height):
        cats = categories(tool, stage)
        label = f'{tool["name"]}; {stage}; ' + (' and '.join(REC_LABELS[c] for c in cats) if cats else 'No use mapped')
        self.add(f'<g class="map-cell" data-panel="{panel}" data-tool="{escape(tool["id"], quote=True)}" data-stage="{escape(stage, quote=True)}" data-recommendations="{",".join(cats)}"><title>{escape(label)}</title>')
        self.add(f'<rect x="{f(x)}" y="{f(y)}" width="{f(width)}" height="{f(height)}" fill="{PALETTE[cats[0]] if cats else "#ffffff"}"/>')
        if len(cats) == 2:
            # map-template.html cellPaint(): first recommendation upper-left;
            # second lower-right, with a lower-left to upper-right diagonal.
            self.add(f'<path d="M{f(x + width)} {f(y)}V{f(y + height)}H{f(x)}Z" fill="{PALETTE[cats[1]]}"/>')
        self.add('</g>')
        self.expected_cells.append((panel, tool['id'], stage, x, y, width, height))

    def matrix(self, panel, tools, stages=STAGES, x=X, y=Y, width=WIDTH, row=ROW):
        self.panel(panel, tools, stages)
        cw = width / len(tools)
        for ri, stage in enumerate(stages):
            for ci, tool in enumerate(tools):
                self.cell(panel, tool, stage, x + ci * cw, y + ri * row, cw, row)
        for ci in range(len(tools) + 1):
            at = x + ci * cw
            self.add(f'<path d="M{f(at)} {f(y)}V{f(y + len(stages) * row)}" stroke="{GRID}" stroke-width="0.8" fill="none"/>')
        for ri in range(len(stages) + 1):
            at = y + ri * row
            self.add(f'<path d="M{f(x)} {f(at)}H{f(x + width)}" stroke="{GRID}" stroke-width="0.8" fill="none"/>')
        return cw

    def stages(self):
        self.add(text(0, 117, 'Review stage', size=22, weight=650, colour=MUTED))
        for ri, stage in enumerate(STAGES):
            self.add(f'<g class="stage-label" data-stage="{escape(stage, quote=True)}"><title>{escape(stage)}</title>')
            self.add(text(0, Y + ri * ROW + ROW / 2 + 8, DISPLAY_STAGES[stage]))
            self.add('</g>')

    def outline(self, x, y, width, height, description):
        # Inset neutral outlines leave the original recommendation fills intact.
        self.add(f'<rect class="highlight" x="{f(x + 1.4)}" y="{f(y + 1.4)}" width="{f(width - 2.8)}" height="{f(height - 2.8)}" fill="none" stroke="{INK}" stroke-width="2.8"><title>{escape(description)}</title></rect>')
        self.highlights.append(description)

    def save(self, filename):
        metadata = {
            'source': '../map/map-data.json', 'sourceSHA256': sha256(SOURCE.read_bytes()).hexdigest(),
            'sourceGroupOrder': GROUP_ORDER, 'sourceToolOrder': [t['id'] for t in TOOLS],
            'sourceStageOrder': STAGES, 'recommendationOrder': REC_ORDER, 'palette': PALETTE,
            'panels': self.panels, 'neutralHighlights': self.highlights,
        }
        root = [f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1152 {self.height}" role="img" aria-labelledby="map-title map-description">',
                f'<title id="map-title">{escape(self.title)}</title>',
                f'<desc id="map-description">{escape(self.desc)}</desc>',
                f'<metadata id="map-source-metadata">{escape(json.dumps(metadata, separators=(",", ":")))}</metadata>',
                f'<g font-family="{FONT}" fill="{INK}">', *self.parts, '</g></svg>']
        content = '\n'.join(root) + '\n'
        self.verify(content)
        target = OUT / filename
        if CHECK:
            if not target.exists() or target.read_text(encoding='utf-8') != content:
                raise SystemExit(f'Stale visual: {target}. Run build_visuals.py to regenerate.')
        else:
            OUT.mkdir(parents=True, exist_ok=True)
            target.write_text(content, encoding='utf-8')
        populated = sum(bool(categories(TOOL[t], s)) for _, t, s, *_ in self.expected_cells)
        mixed = sum(len(categories(TOOL[t], s)) == 2 for _, t, s, *_ in self.expected_cells)
        print(f'{filename}: {len(self.expected_cells)} displayed cells; {populated} populated; {mixed} mixed; source order/assignments/fills verified')

    def verify(self, content):
        ns = {'s': 'http://www.w3.org/2000/svg'}
        parsed = ET.fromstring(content)
        cells = [n for n in parsed.findall('.//s:g', ns) if n.get('class') == 'map-cell']
        assert len(cells) == len(self.expected_cells)
        for node, (panel, tid, stage, x, y, w, h) in zip(cells, self.expected_cells):
            cats = categories(TOOL[tid], stage)
            assert node.get('data-panel') == panel and node.get('data-tool') == tid and node.get('data-stage') == stage
            assert node.get('data-recommendations') == ','.join(cats)
            rect, paths = node.find('s:rect', ns), node.findall('s:path', ns)
            assert rect.get('fill') == (PALETTE[cats[0]] if cats else '#ffffff')
            assert all(abs(float(rect.get(k)) - value) < .0001 for k, value in [('x', x), ('y', y), ('width', w), ('height', h)])
            assert len(paths) == int(len(cats) == 2)
            if paths:
                assert paths[0].get('fill') == PALETTE[cats[1]]
                assert paths[0].get('d') == f'M{f(x + w)} {f(y)}V{f(y + h)}H{f(x)}Z'
            assert x >= 0 and y >= 0 and x + w <= 1152.0001 and y + h <= self.height
        assert '/Users/' not in content


def group_bands(svg, tools, x=X, width=WIDTH):
    cw, cursor, bounds = width / len(tools), x, {}
    present = [g for g in GROUP_ORDER if any(t['groupId'] == g for t in tools)]
    for gid in present:
        gw = sum(t['groupId'] == gid for t in tools) * cw
        bounds[gid] = (cursor, cursor + gw)
        svg.add(f'<rect x="{f(cursor)}" y="51" width="{f(gw)}" height="81" fill="{BAND}"/>')
        cursor += gw
    return bounds


def boundaries(svg, bounds):
    for left, right in list(bounds.values())[:-1]:
        svg.add(f'<path d="M{f(right)} 51V408" stroke="{MUTED}" stroke-width="2.1" fill="none"/>')


def external_label(svg, target_x, label, label_x=None, anchor='middle'):
    label_x = target_x if label_x is None else label_x
    svg.add(text(label_x, 25, label, size=23, anchor=anchor, weight=650))
    svg.add(f'<path d="M{f(target_x)} 36V122M{f(target_x - 4)} 117L{f(target_x)} 123L{f(target_x + 4)} 117" stroke="{MUTED}" stroke-width="1.8" fill="none"/>')



def screening():
    ids = ['abstrackr', 'covidence', 'eppi-reviewer-prioritised-screening']
    tools = [t for t in TOOLS if t['id'] in ids]
    assert [t['id'] for t in tools] == ids
    stage = 'Screening for relevance'
    assert all(categories(t, stage) == ['acceptable', 'validation'] for t in tools)
    svg = Svg('Selected mixed screening cells', 'Three selected source-ordered screening cells: Abstrackr, Covidence, and EPPI-Reviewer Prioritised Screening. Each has Acceptable for use and Requires validation within the review recommendations for different workflows. These cells do not establish that a product supplies a validated stopping procedure.', height=100)
    svg.panel('selected-screening-cells', tools, [stage])
    for i, tool in enumerate(tools):
        centre = 192 + i * 384
        if tool['id'] == ids[-1]:
            svg.add(text(centre, 23, 'EPPI-Reviewer', size=23, anchor='middle', weight=650))
            svg.add(text(centre, 48, 'Prioritised Screening', size=23, anchor='middle', weight=650))
        else:
            svg.add(text(centre, 47, tool['name'], size=25, anchor='middle', weight=650))
        svg.cell('selected-screening-cells', tool, stage, centre - 126, 64, 252, 30)
        svg.add(f'<rect x="{centre - 126}" y="64" width="252" height="30" fill="none" stroke="{GRID}" stroke-width="1"/>')
    svg.save('map-supervised-screening.svg')



def patterns():
    svg = Svg('Stage clusters and the breadth of ChatGPT uses', 'Left: the full 56-tool matrix, with neutral outlines highlighting the search and synthesis rows in the rule-based group and screening, quality assessment and extraction in the supervised group. A neutral outline identifies the ChatGPT column in the full map. A shallow curved arrow below the matrix links its bottom centre to the bottom centre of the enlarged column on the right. Both columns align to the same eight stage labels. ChatGPT has mapped uses in seven stages; its certainty-assessment cell stays blank. The different panel scales must not be read as a comparison of prevalence or performance.')
    width = 650
    b = group_bands(svg, TOOLS, width=width)
    header_lines = {
        'rule-based': ((87, 114), ('Rule-based', 'algorithms'), 23),
        'supervised': ((74, 99, 124), ('Supervised', 'machine', 'learning'), 21),
        'generative': ((87, 114), ('Generative', 'LLMs'), 23),
    }
    for gid, (ys, labels, size) in header_lines.items():
        for y, label in zip(ys, labels):
            svg.add(text(sum(b[gid]) / 2, y, label, size=size, anchor='middle', weight=650))
    external_label(svg, sum(b['unsupervised']) / 2, 'Unsupervised machine learning')
    svg.stages()
    column_width = svg.matrix('overview', TOOLS, width=width)
    boundaries(svg, b)
    a, z = b['rule-based']
    for stage in ('The Search', 'Data synthesis'):
        svg.outline(a, Y + STAGES.index(stage) * ROW, z - a, ROW, 'Rule-based group: ' + stage)
    a, z = b['supervised']
    svg.outline(a, Y + 2 * ROW, z - a, 3 * ROW, 'Supervised group: screening, quality assessment and data extraction')
    svg.add(text(1033, 81, 'ChatGPT', size=25, anchor='middle', weight=650))
    svg.add(text(1033, 112, '7 of 8 stages', size=22, anchor='middle', colour=MUTED))
    assert sum(bool(categories(TOOL['chatgpt'], s)) for s in STAGES) == 7
    enlarged_x, enlarged_width = 1008, 50
    svg.matrix('chatgpt-enlarged-excerpt', [TOOL['chatgpt']], x=enlarged_x, width=enlarged_width)
    source_x = X + next(i for i, tool in enumerate(TOOLS) if tool['id'] == 'chatgpt') * column_width
    column_height = len(STAGES) * ROW
    # Keep the zoom cue below the cells and within the figure's bottom margin.
    source_centre = source_x + column_width / 2
    enlarged_centre = enlarged_x + enlarged_width / 2
    bottom = Y + column_height
    assert X < source_x < source_x + column_width < X + width < enlarged_x
    svg.outline(source_x, Y, column_width, column_height, 'ChatGPT column in the full map')
    svg.add(f'<defs><marker id="zoom-arrowhead" viewBox="0 0 8 8" refX="8" refY="4" markerWidth="8" markerHeight="8" markerUnits="userSpaceOnUse" orient="auto"><path d="M0 0L8 4L0 8Z" fill="{INK}"/></marker></defs>')
    svg.add(f'<path class="zoom-arrow" d="M{f(source_centre)} {f(bottom - 1.4)}C{f(source_centre + 70)} {f(bottom + 20)} {f(enlarged_centre - 70)} {f(bottom + 20)} {f(enlarged_centre)} {f(bottom)}" stroke="{INK}" stroke-width="1.8" fill="none" marker-end="url(#zoom-arrowhead)"/>')
    svg.save('map-patterns.svg')


def validate_source():
    assert len(TOOLS) == 56 and len(STAGES) == 8
    assert set(STAGES) == set(DISPLAY_STAGES)
    assert Counter(t['groupId'] for t in TOOLS) == {'rule-based': 27, 'unsupervised': 2, 'supervised': 10, 'generative': 17}
    assert GROUP_ORDER == ['rule-based', 'unsupervised', 'supervised', 'generative']
    assert TOOLS == [t for g in GROUP_ORDER for t in TOOLS if t['groupId'] == g], 'Unexpected interleaved source groups'
    functions = [v for t in TOOLS for v in t['functions']]
    assert len(functions) == len({v['id'] for v in functions}) == 131
    assert all(v['stage'] in STAGES and v['recommendation'] in PALETTE for v in functions)
    counts = [categories(t, s) for s in STAGES for t in TOOLS]
    assert all(len(c) <= 2 for c in counts)
    assert sum(bool(c) for c in counts) == 96 and sum(len(c) == 2 for c in counts) == 12
    assert sum(not c for c in counts) == 352
    print('Source verified: 56 columns; 8 stages; 131 functions; 96 populated/12 mixed/352 blank cells.')


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--check', action='store_true', help='Check generated visuals without writing files')
    CHECK = parser.parse_args().check
    validate_source()
    screening()
    patterns()
