"""ייבוא תוכניות הבינוי מ-PLANS-GH (seed-data.json, visuals-seed.json) לאוגדן.
פלט: src/data/plans.json (טקסטים ושדות) ו-public/plans/<מספר>/<i>.jpg (תמונות לפי דרישה).
הרצה: python3 tools/import_plans.py /path/to/plans-gh
"""
import base64, json, os, re, sys

src = sys.argv[1] if len(sys.argv) > 1 else "../anat1969/plans-gh"
root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
seed = json.load(open(os.path.join(src, "seed-data.json"), encoding="utf-8"))
vis = json.load(open(os.path.join(src, "visuals-seed.json"), encoding="utf-8"))["visuals"]

KEEP = {"tashrit": 0, "landscape": 1, "render": 2, "aerial": 3}

def clean(t: str) -> str:
    t = re.sub(r"[ \t]{2,}", " ", t)
    t = re.sub(r"(\|\s*)+\|", "|", t)
    lines = [l.strip(" |") for l in t.splitlines()]
    out, blank = [], 0
    for l in lines:
        if not l:
            blank += 1
            if blank > 1: continue
        else:
            blank = 0
        out.append(l)
    return "\n".join(out).strip()

plans = []
for num in sorted(set(seed["opinions"]) | set(seed["fields"]), key=int):
    op = seed["opinions"].get(num, {})
    f = seed["fields"].get(num, {})
    images = []
    items = sorted(vis.get(num, []), key=lambda it: KEEP.get(it.get("cat"), 9))
    renders = seed["renders"].get(num, [])
    d = os.path.join(root, "public", "plans", num)
    os.makedirs(d, exist_ok=True)
    for i, it in enumerate(items):
        if it.get("cat") not in KEEP: continue
        b = it["src"].split(",", 1)[1]
        name = f"{i}.jpg"
        open(os.path.join(d, name), "wb").write(base64.b64decode(b))
        images.append({"file": f"plans/{num}/{name}", "cat": it["cat"], "title": it.get("title", ""), "source": it.get("source", ""), "page": it.get("page", "")})
    if not images:
        for i, r in enumerate(renders):
            name = f"r{i}.jpg"
            open(os.path.join(d, name), "wb").write(base64.b64decode(r.split(",", 1)[1]))
            images.append({"file": f"plans/{num}/{name}", "cat": "render", "title": "הדמיה", "source": "seed-data.json", "page": ""})
    plans.append({
        "num": num,
        "name": op.get("projectName") or f.get("projectName", ""),
        "committeeDate": op.get("committeeDate", ""),
        "session": op.get("session", ""),
        "decision": op.get("decision", ""),
        "fields": {k: v for k, v in f.items() if isinstance(v, str)},
        "opinion": clean(op.get("text", "")),
        "images": images,
    })

out = {"source": "PLANS-GH (seed-data.json, visuals-seed.json), עיריית אשדוד", "plans": plans}
json.dump(out, open(os.path.join(root, "src", "data", "plans.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=0)
print(len(plans), "plans;", sum(len(p["images"]) for p in plans), "images")
