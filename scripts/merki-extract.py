"""Pull the remaining copy/config out of the reference site's bundle: WhatsApp number + per-scene messages, the Process path and the logo mark.
usage: python -I scripts/merki-extract.py <dir containing index.html and site.js> <out.txt>
"""
import re
import sys

d, out = sys.argv[1:3]
js = open(f"{d}/site.js", encoding="utf8").read()
html = open(f"{d}/index.html", encoding="utf8").read()
res = []

m = re.search(r"el=`(\d+)`,tl=\[(.*?)\],nl=", js, re.S)
res.append("WA number: " + (m.group(1) if m else "NOT FOUND"))
res.append("WA messages: " + (m.group(2) if m else "NOT FOUND"))

for mm in re.finditer(r'<svg class="path"[\s\S]*?</svg>', html):
    res.append("PATH SVG: " + mm.group(0)[:1500])
for mm in re.finditer(r'<svg class="mark"[\s\S]*?</svg>', html):
    res.append("MARK SVG: " + mm.group(0)[:700])
for mm in re.finditer(r'<a id="enquiry"[\s\S]*?</a>', html):
    res.append("ENQUIRY: " + mm.group(0)[:1200])
for mm in re.finditer(r'<a class="ig"[\s\S]*?</a>', html):
    res.append("IG: " + mm.group(0)[:900])

open(out, "w", encoding="utf8").write("\n\n".join(res))
print(len(res), "items")
