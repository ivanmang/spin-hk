from pathlib import Path
import base64

ROOT = Path(".")
LT = chr(60)
GT = chr(62)
DQ = chr(34)
SQ = chr(39)


def script_tag(src):
    return "  " + LT + "script src=" + DQ + src + DQ + GT + LT + "/script" + GT


def extract_b64(text):
    best = ""
    for q in (DQ, SQ):
        start = text.find(q)
        end = text.rfind(q)
        if start >= 0 and end > start:
            piece = text[start + 1 : end]
            if len(piece) > len(best):
                best = piece
    return best


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
assembled = bool(
    data_src
    and app_src
    and "SPIN_DATA" in data_src
    and "COPY" in app_src
    and "moveTo" in app_src
)

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
            out.append(script_tag("data.js?v=16"))
            out.append(script_tag("app.js?v=16"))
        line = line.replace("?v=9", "?v=16")
        line = line.replace("?v=14", "?v=16")
        line = line.replace("?v=15", "?v=16")
    else:
        line = line.replace("?v=9", "?v=16")
        line = line.replace("?v=14", "?v=16")
        line = line.replace("?v=15", "?v=16")
    out.append(line)

Path("index.html").write_text("\n".join(out) + "\n")
Path("data-c.js").write_text(
    "var DATA=window.SPIN_DATA||{};\n"
    "if(!DATA.presets){\n"
    "DATA.presets={eat:["
    '{l:"\\u8336\\u9910\\u5ef3",e:"\\u2615"},'
    '{l:"\\u5169\\u991e\\u98ef",e:"\\ud83c\\udf71"},'
    '{l:"\\u8b5a\\u4ed4",e:"\\ud83c\\udf5c"},'
    '{l:"\\u706b\\u934b",e:"\\ud83c\\udf72"},'
    '{l:"\\u97d3\\u71d2",e:"\\ud83e\\udd69"},'
    '{l:"\\u6cf0\\u83dc",e:"\\ud83c\\udf36"},'
    '{l:"\\u58fd\\u53f8",e:"\\ud83c\\udf63"},'
    '{l:"\\u9ea5\\u7576\\u52de",e:"\\ud83c\\udf54"}'
    "]};\n"
    "}\n"
)
print("patched index", len(out), "assembled", assembled)
