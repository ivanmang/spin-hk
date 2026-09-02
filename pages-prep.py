from pathlib import Path
import base64
import re

ROOT = Path(".")
LT = chr(60)
GT = chr(62)


def script_tag(src):
    return "  " + LT + "script src=" + chr(34) + src + chr(34) + GT + LT + "/script" + GT


def extract_b64(text):
    m = re.search(r"'([^']*)'", text)
    if m:
        return m.group(1)
    return ""


def assemble(prefix, count):
    parts = []
    for i in range(count):
        path = ROOT / (prefix + str(i) + ".js")
        if not path.is_file():
            return None
        piece = extract_b64(path.read_text())
        if not piece:
            return None
        parts.append(piece)
    try:
        return base64.b64decode("".join(parts)).decode("utf-8")
    except Exception:
        return None


data_src = assemble("d", 4)
app_src = assemble("a", 4)
assembled = bool(data_src and app_src and "SPIN_DATA" in data_src and "COPY" in app_src)

if assembled:
    Path("data.js").write_text(data_src if data_src.endswith("\n") else data_src + "\n")
    Path("app.js").write_text(app_src if app_src.endswith("\n") else app_src + "\n")
    print("assembled data.js", len(data_src), "app.js", len(app_src))
else:
    print("chunks incomplete, keeping fallback app")

lines = Path("index.html").read_text().splitlines()
out = []
body_close = LT + "/body" + GT
for line in lines:
    if "fonts.googleapis.com" in line or "fonts.gstatic.com" in line:
        continue
    line = line.replace(
        '"Noto Sans TC","Figtree",system-ui,sans-serif',
        '"PingFang HK","PingFang TC","Noto Sans TC","Microsoft JhengHei",system-ui,sans-serif',
    )
    line = line.replace(
        '"Figtree","Noto Sans TC",system-ui,sans-serif',
        'system-ui,"PingFang HK","Noto Sans TC",sans-serif',
    )
    line = line.replace(
        '"Figtree","Noto Sans TC",sans-serif',
        '"PingFang HK","Noto Sans TC",system-ui,sans-serif',
    )
    if assembled:
        if "script src" in line:
            continue
        if body_close in line:
            out.append(script_tag("data.js?v=15"))
            out.append(script_tag("app.js?v=15"))
        line = line.replace("?v=9", "?v=15")
    else:
        line = line.replace("?v=9", "?v=14")
    out.append(line)

Path("index.html").write_text("\n".join(out) + "\n")
Path("data-c.js").write_text("var DATA=window.SPIN_DATA;\n")
print("patched index", len(out), "assembled", assembled)
