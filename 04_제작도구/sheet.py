"""검수용: 렌더링된 슬라이드 PNG를 여러 장씩 한 이미지로 묶음. 사용법: python sheet.py <폴더> [한 장당 개수]"""
import sys
from pathlib import Path
from PIL import Image, ImageDraw
d = Path(sys.argv[1]); per = int(sys.argv[2]) if len(sys.argv) > 2 else 6
files = sorted(d.glob("s*.png"))
for k in range(0, len(files), per):
    chunk = files[k:k + per]
    tw, th = 800, 450
    sheet = Image.new("RGB", (tw * 2 + 30, (th + 40) * ((len(chunk) + 1) // 2) + 10), "white")
    dr = ImageDraw.Draw(sheet)
    for i, f in enumerate(chunk):
        im = Image.open(f).convert("RGB").resize((tw, th))
        x, y = 10 + (i % 2) * (tw + 10), 10 + (i // 2) * (th + 40)
        sheet.paste(im, (x, y + 25)); dr.rectangle([x, y + 25, x + tw, y + 25 + th], outline="gray")
        dr.text((x, y + 5), f.stem, fill="black")
    out = d / f"sheet_{k // per + 1:02d}.jpg"
    sheet.save(out, quality=85); print(out)
