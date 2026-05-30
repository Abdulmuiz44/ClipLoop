import shutil, os, re

src = "/root/projects/cliploop/docs-site"
dist = "/root/projects/cliploop/docs-site/dist"
pages = [
    ("overview", "index.html"),
    ("quickstart", "index.html"),
    ("authentication", "index.html"),
    ("idempotency", "index.html"),
    ("credits", "index.html"),
    ("weekly-promo-api", "index.html"),
    ("examples", "index.html"),
    ("errors", "index.html"),
    ("roadmap", "index.html"),
]

active_map = {
    "overview": "OVERVIEW",
    "quickstart": "QUICKSTART",
    "authentication": "AUTH",
    "idempotency": "IDEMPOTENCY",
    "credits": "CREDITS",
    "weekly-promo-api": "WEEKLY",
    "examples": "EXAMPLES",
    "errors": "ERRORS",
    "roadmap": "ROADMAP",
}

layout = open(os.path.join(src, "layout.html")).read()

for page_dir, page_file in pages:
    body = open(os.path.join(src, page_dir, page_file)).read()
    title = page_dir.replace("-", " ").title()
    current_page = active_map.get(page_dir, page_dir)

    # breadcrumb
    parts = page_dir.split("/")
    breadcrumb = ""
    if len(parts) > 1:
        parent = parts[0]
        breadcrumb = ('<nav class="breadcrumb"><a href="/' + parent + '/">' + parent.replace("-"," ").title() + '</a> / <span>' + current_page + '</span></nav>')

    page_html = layout
    page_html = page_html.replace("[TITLE]", title)
    page_html = page_html.replace("[BREADCRUMB]", breadcrumb)
    page_html = page_html.replace("[BODY]", body)
    for key, flag in active_map.items():
        page_html = page_html.replace("[" + flag + "]", "active" if key == page_dir else "")

    out_dir = os.path.join(dist, page_dir)
    os.makedirs(out_dir, exist_ok=True)
    out_path = os.path.join(out_dir, page_file)
    with open(out_path, "w") as f:
        f.write(page_html)
    print(f"Built: {page_dir}/index.html")

# Copy root assets
for asset in ["index.html", "styles.css"]:
    s = os.path.join(src, asset)
    if os.path.exists(s):
        shutil.copy2(s, os.path.join(dist, asset))
        print(f"Copied: {asset}")

print("Build complete — verifying...")
for page_dir, _ in pages:
    path = os.path.join(dist, page_dir, "index.html")
    with open(path) as f:
        txt = f.read()
    assert "<title>" in txt, f"missing title in {path}"
    assert "app.cliploop.site/api/public/weekly-promo" in txt, f"missing endpoint in {path}"
    assert "localhost" not in txt, f"localhost reference in {path}"
    assert "127.0.0.1" not in txt, f"localhost reference in {path}"
print("Verification passed.")
