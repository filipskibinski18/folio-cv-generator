"""Rebuild the bundled, static PDF fonts from Google Fonts' OFL sources."""
from pathlib import Path
from urllib.request import urlopen
from fontTools.ttLib import TTFont
from fontTools.varLib.instancer import instantiateVariableFont
from io import BytesIO

OUTPUT = Path(__file__).resolve().parents[1] / 'public' / 'fonts'
OUTPUT.mkdir(parents=True, exist_ok=True)
SOURCES = {'Inter': 'Inter[opsz,wght].ttf', 'Lora': 'Lora[wght].ttf', 'Roboto': 'Roboto[wdth,wght].ttf'}
for family, filename in SOURCES.items():
    base = f'https://raw.githubusercontent.com/google/fonts/main/ofl/{family.lower()}/'
    from urllib.parse import quote
    raw = urlopen(base + quote(filename), timeout=60).read()
    (OUTPUT / f'{family}-OFL.txt').write_bytes(urlopen(base + 'OFL.txt', timeout=60).read())
    for weight in [400, 700]:
        font = TTFont(BytesIO(raw))
        axes = {axis.axisTag: axis.defaultValue for axis in font['fvar'].axes}
        axes['wght'] = weight
        static = instantiateVariableFont(font, axes, inplace=False)
        static.save(OUTPUT / f'{family}-{weight}.ttf')
        cmap = static.getBestCmap()
        missing = [char for char in 'Aleksandra Nowak 123 • ĄąĆćĘęŁłŃńÓóŚśŹźŻż —' if ord(char) not in cmap]
        assert not missing, f'{family} missing glyphs: {missing}'
        print(f'{family}-{weight}: {len(cmap)} glyphs, full Polish coverage')
