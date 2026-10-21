#!/usr/bin/env python3
"""Derive presenter notes from the approved script; the public site needs no private file."""
import argparse
import hashlib
import html
from pathlib import Path
import re

# Accepted visual-plan boundaries. Counts make changed source structure fail clearly.
GROUPS = [
    ('Opening', [1]),
    ('Review stages', [1]),
    ('RAISE', [1]),
    ('Four AI families', [3, 2]),
    ('Training and evaluation independence', [1]),
    ('Five use recommendations', [6]),
    ('Verification and validation', [6]),
    ('Map patterns', [1, 2, 1, 1, 3]),
    ('Screening examples', [3, 4]),
    ('Unacceptable uses and why', [4, 2]),
    ('Applying RAISE’s five suitability questions', [3, 1, 3]),
    ('Closing', [3]),
]


def normalize(text):
    return ' '.join(text.split())


def fingerprint(text):
    return hashlib.sha256(normalize(text).encode()).hexdigest()


def read_script(path):
    source = path.read_text()
    body = source[source.index('## Opening\n'):].split('\n---\n', 1)[0]
    sections = re.split(r'^## (.+)\n', body, flags=re.M)[1:]
    assert len(sections) == len(GROUPS) * 2, 'Script sections changed; review slide boundaries.'
    slides = []
    for (prefix, counts), title, text in zip(GROUPS, sections[::2], sections[1::2]):
        assert title == prefix or title.startswith(prefix + ' · '), f'Unexpected section: {title}'
        blocks = []
        for paragraph in re.split(r'\n\s*\n', text.strip()):
            cue = paragraph.startswith('*[') and paragraph.endswith(']*')
            plain = paragraph[1:-1] if cue else paragraph.replace('**', '')
            blocks.append(('cue' if cue else 'speech', plain))
        assert len(blocks) == sum(counts), f'Paragraphs changed in {title}; review slide boundaries.'
        start = 0
        for count in counts:
            slides.append(blocks[start:start + count])
            start += count
    assert len(slides) == sum(len(counts) for _, counts in GROUPS)
    return slides


def notes_html(number, blocks):
    speech = ' '.join(text for kind, text in blocks if kind == 'speech')
    lines = [f'<aside class="notes" data-spoken-sha256="{fingerprint(speech)}">',
             '<div style="font-family:system-ui,sans-serif;font-size:20px;line-height:1.5;color:#203746">',
             f'<p style="font-size:14px;color:#526b7c;margin:0 0 16px">Slide {number} · Approved script</p>']
    for kind, text in blocks:
        if kind == 'cue':
            lines.extend([
                '<div style="border-left:3px solid #829daf;background:#eef3f6;padding:10px 14px;margin:18px 0">',
                '<div style="font-size:13px;font-weight:600;color:#526b7c">Pointing cue — not spoken</div>',
                f'<p data-note="cue" style="margin:4px 0 0;font-style:italic">{html.escape(text)}</p></div>',
            ])
        else:
            lines.append(f'<p data-note="speech" style="margin:0 0 18px">{html.escape(text)}</p>')
    return '\n'.join(lines + ['</div>', '</aside>'])


def update(source, slides):
    # Replace derived notes only. All audience slide markup remains byte-for-byte intact.
    pattern = re.compile(r'(<section\b[^>]*data-plan-slide="(\d+)"[^>]*>)(.*?)(</section>)', re.S)
    seen = []

    def insert(match):
        number = int(match[2])
        seen.append(number)
        content = re.sub(r'<aside class="notes"[^>]*>.*?</aside>', '', match[3], flags=re.S)
        return match[1] + content + notes_html(number, slides[number - 1]) + match[4]

    result = pattern.sub(insert, source)
    assert seen == list(range(1, len(slides) + 1)), 'Expected all plan slides in order.'
    spoken = ' '.join(text for blocks in slides for kind, text in blocks if kind == 'speech')
    tag = f'<meta name="approved-script-sha256" content="{fingerprint(spoken)}">'
    if re.search(r'<meta name="approved-script-sha256"[^>]*>', result):
        result = re.sub(r'<meta name="approved-script-sha256"[^>]*>', tag, result)
    else:
        result = result.replace('</head>', tag + '</head>', 1)
    return result, len(normalize(spoken).split())


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('script', type=Path, help='Approved Delivery Script Markdown')
    parser.add_argument('--check', action='store_true', help='Verify without writing')
    args = parser.parse_args()
    deck = Path(__file__).resolve().with_name('index.html')
    current = deck.read_text()
    slides = read_script(args.script)
    updated, words = update(current, slides)
    if args.check:
        assert current == updated, 'Presenter notes differ from the approved script; run sync_notes.py.'
    else:
        deck.write_text(updated)
    print(f'Presenter notes {"verified" if args.check else "derived"}: {len(slides)} slides, {words} spoken words.')


if __name__ == '__main__':
    main()
