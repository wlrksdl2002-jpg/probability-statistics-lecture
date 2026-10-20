"""위키미디어 공용(Commons)에서 자유 이용 가능한 이미지를 검색해 내려받는 도구.

사용법:
    python fetch_image.py "검색어(영문)" 저장이름 [--pick N] [--list]

- --list : 후보만 출력 (다운로드 안 함)
- --pick N : N번째 후보를 내려받음 (기본 0)
- 결과: ../05_이미지/인터넷/<저장이름>.jpg|png, 출처는 ../05_이미지/인터넷/credits/<저장이름>.json 에 기록
"""
import json
import re
import sys
import urllib.parse
import urllib.request
from pathlib import Path

UA = "LectureSlidesBuilder/1.0 (educational use; python urllib)"
OUT = Path(__file__).resolve().parent.parent / "05_이미지" / "인터넷"
OK_LICENSE = re.compile(r"public domain|cc0|cc by|cc-by|pd", re.I)


def get(url):
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    with urllib.request.urlopen(req, timeout=60) as r:
        return r.read()


def strip_html(s):
    return re.sub(r"<[^>]+>", "", s or "").strip()


def search(query, limit=12):
    params = {
        "action": "query", "format": "json", "generator": "search",
        "gsrnamespace": 6, "gsrsearch": f"{query} filetype:bitmap",
        "gsrlimit": limit, "prop": "imageinfo",
        "iiprop": "url|extmetadata|size|mime", "iiurlwidth": 1200,
    }
    data = json.loads(get("https://commons.wikimedia.org/w/api.php?" + urllib.parse.urlencode(params)))
    pages = sorted(data.get("query", {}).get("pages", {}).values(), key=lambda p: p.get("index", 0))
    out = []
    for p in pages:
        ii = p["imageinfo"][0]
        meta = ii.get("extmetadata", {})
        lic = strip_html(meta.get("LicenseShortName", {}).get("value", ""))
        if ii.get("mime") not in ("image/jpeg", "image/png") or not OK_LICENSE.search(lic):
            continue
        if ii.get("width", 0) < 500:
            continue
        out.append({
            "title": p["title"].replace("File:", ""),
            "url": ii.get("thumburl") or ii["url"],
            "page": ii.get("descriptionurl", ""),
            "author": strip_html(meta.get("Artist", {}).get("value", ""))[:80] or "Unknown",
            "license": lic,
            "ext": ".png" if ii["mime"] == "image/png" else ".jpg",
        })
    return out


def main():
    args = sys.argv[1:]
    if len(args) < 2:
        print(__doc__)
        sys.exit(1)
    query, name = args[0], args[1]
    pick = int(args[args.index("--pick") + 1]) if "--pick" in args else 0
    cands = search(query)
    if "--list" in args or not cands:
        for i, c in enumerate(cands):
            print(f"[{i}] {c['title']} | {c['license']} | {c['author']}")
        if not cands:
            print("후보 없음: 검색어를 바꿔 보세요")
        return
    c = cands[pick]
    OUT.mkdir(parents=True, exist_ok=True)
    for old in OUT.glob(name + ".*"):
        old.unlink()
    path = OUT / (name + c["ext"])
    path.write_bytes(get(c["url"]))
    # 여러 작업이 동시에 내려받아도 충돌하지 않도록 이미지마다 출처 파일을 따로 저장
    (OUT / "credits").mkdir(exist_ok=True)
    credit = {k: c[k] for k in ("title", "author", "license", "page")} | {"file": path.name}
    (OUT / "credits" / f"{name}.json").write_text(json.dumps(credit, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"저장: {path} | {c['license']} | {c['author']}")


if __name__ == "__main__":
    main()
