from pathlib import Path

lines = Path("index.html").read_text().splitlines()
out = []
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
    line = line.replace("?v=9", "?v=14")
    out.append(line)
Path("index.html").write_text("\n".join(out) + "\n")
Path("data-c.js").write_text("var DATA=window.SPIN_DATA;\n")
print("patched index", sum(len(x) for x in out))
