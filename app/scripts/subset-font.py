"""Build a static subset of Pretendard Variable with exactly the glyphs the site copy uses.
Run after copy changes:  python3 scripts/subset-font.py
Characters not in the subset (e.g. user-typed names) fall back to the dynamic-subset Pretendard in base.css."""
import pathlib, re, subprocess, sys
root = pathlib.Path(__file__).resolve().parent.parent
chars = set()
for p in list((root / 'src').rglob('*.ts*')) + [root / 'index.html']:
    chars |= set(p.read_text(encoding='utf-8'))
chars |= set(chr(c) for c in range(0x20, 0x7F))
chars |= set('·…→←“”‘’—–×±')
text = ''.join(sorted(c for c in chars if c.isprintable()))
(root / 'scripts' / '.subset-chars.txt').write_text(text, encoding='utf-8')
out = root / 'src' / 'styles' / 'fonts' / 'dangq-sans.woff2'
out.parent.mkdir(parents=True, exist_ok=True)
src = root / 'node_modules/pretendard/dist/web/variable/woff2/PretendardVariable.woff2'
subprocess.run([sys.executable, '-m', 'fontTools.subset', str(src), f'--text-file={root / "scripts" / ".subset-chars.txt"}',
                '--flavor=woff2', f'--output-file={out}', '--layout-features=*', '--no-hinting'], check=True)
print(out, out.stat().st_size, 'bytes,', len(text), 'chars')
