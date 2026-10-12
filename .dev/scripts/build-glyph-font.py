# Regenerate src/assets/fonts/outline-glyphs.woff (needs fonttools):
#   python3 scripts/build-glyph-font.py src/assets/fonts/outline-glyphs.woff
# One-glyph font: U+2FFB (LuCI's "Clone⿻" icon) drawn as Lucide's "copy".
from fontTools.fontBuilder import FontBuilder
from fontTools.pens.ttGlyphPen import TTGlyphPen
import base64, io, sys

K = 1000 / 24 * 0.8          # svg unit -> font unit (icon ~0.8em)
X0 = 230                     # gap after the label
def P(x, y):                 # svg (y down) -> font (y up), centred on ~cap middle
    return (round(X0 + (x - 1) * K), round(360 + (12 - y) * K))

def rrect(pen, x0, y0, x1, y1, r, reverse=False):
    pts = [("L",(x0+r,y0)),("L",(x1-r,y0)),("Q",(x1,y0),(x1,y0+r)),("L",(x1,y1-r)),
           ("Q",(x1,y1),(x1-r,y1)),("L",(x0+r,y1)),("Q",(x0,y1),(x0,y1-r)),
           ("L",(x0,y0+r)),("Q",(x0,y0),(x0+r,y0))]
    seq = []
    # flatten to list of (oncurve point, ctrl or None) for reversal
    cur = pts[0][1]
    segs = []
    for p in pts[1:]:
        if p[0] == "L": segs.append((None, p[1]))
        else: segs.append((p[1], p[2]))
    if reverse:
        nodes = [cur] + [s[1] for s in segs]
        ctrls = [s[0] for s in segs]
        nodes = nodes[::-1]; ctrls = ctrls[::-1]
        cur = nodes[0]; segs = list(zip(ctrls, nodes[1:]))
    pen.moveTo(P(*cur))
    for c, p in segs:
        if c is None: pen.lineTo(P(*p))
        else: pen.qCurveTo(P(*c), P(*p))
    pen.closePath()

pen = TTGlyphPen(None)
rrect(pen, 7, 7, 23, 23, 3)
rrect(pen, 9, 9, 21, 21, 1, reverse=True)
# back sheet: Lucide's top-left "L"
pen.moveTo(P(4,1)); pen.lineTo(P(16,1)); pen.lineTo(P(16,3)); pen.lineTo(P(4,3))
pen.qCurveTo(P(3,3), P(3,4)); pen.lineTo(P(3,16)); pen.lineTo(P(1,16)); pen.lineTo(P(1,4))
pen.qCurveTo(P(1,1), P(4,1)); pen.closePath()
icon = pen.glyph()

empty = TTGlyphPen(None).glyph()
fb = FontBuilder(1000, isTTF=True)
fb.setupGlyphOrder([".notdef", "copy"])
fb.setupCharacterMap({0x2FFB: "copy"})
fb.setupGlyf({".notdef": empty, "copy": icon})
adv = round(X0 + 22 * K + 40)
fb.setupHorizontalMetrics({".notdef": (500, 0), "copy": (adv, X0)})
fb.setupHorizontalHeader(ascent=900, descent=-200)
fb.setupNameTable({"familyName": "Outline Glyphs", "styleName": "Regular"})
fb.setupOS2(sTypoAscender=900, sTypoDescender=-200, usWinAscent=900, usWinDescent=200)
fb.setupPost()
fb.font.flavor = "woff"
buf = io.BytesIO(); fb.save(buf)
data = buf.getvalue()
open(sys.argv[1] if len(sys.argv) > 1 else "outline-glyphs.woff", "wb").write(data)
print(len(data), "bytes")
