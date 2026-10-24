# Reads the newsletter's newest post and writes it to data/newsletter.json for the home page.
# Substack's bot screen turns away GitHub's servers, and visitors' browsers can't read the feed across sites, so
# .github/workflows/newsletter.yml runs this every hour and reads the feed through feed2json (two mirrors of the same
# converter), then directly as a last try. If nothing answers, the saved post is left as it is.
# Usage: python3 scripts/newsletter.py <feed url> [out file]
import html, json, re, subprocess, sys, urllib.parse
import xml.etree.ElementTree as ET
from email.utils import parsedate_to_datetime

feed, out = sys.argv[1], sys.argv[2] if len(sys.argv) > 2 else "data/newsletter.json"
UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36"
plain = lambda s: html.unescape(re.sub(r"<[^>]+>", "", s or "")).strip()

def get(url):
    r = subprocess.run(["curl", "-sSfL", "--max-time", "30", "-A", UA, url], capture_output=True)
    if r.returncode:
        raise RuntimeError(r.stderr.decode().strip())
    return r.stdout

def from_feed2json(base):
    def read():
        d = json.loads(get(base + urllib.parse.quote(feed, safe="")))
        it = (d.get("items") or [None])[0]
        if not it:
            raise ValueError("no posts")
        att = next((a.get("url") for a in it.get("attachments") or [] if str(a.get("mime_type", "")).startswith("image/")), None)
        return {
            "publication": plain(d.get("title")),
            "title": plain(it.get("title")),
            "subtitle": plain(it.get("summary")),
            "link": (it.get("url") or it.get("id") or it.get("guid") or "").strip(),
            "date": (it.get("date_published") or "")[:10] or None,
            "image": it.get("image") or it.get("banner_image") or att,
        }
    read.__name__ = base.split("/")[2]
    return read

def direct():
    ch = ET.fromstring(get(feed)).find("channel")
    item = ch.find("item") if ch is not None else None
    if item is None:
        raise ValueError("no posts")
    enc = item.find("enclosure")
    try:
        date = parsedate_to_datetime(item.findtext("pubDate")).date().isoformat()
    except (TypeError, ValueError):
        date = None
    return {
        "publication": plain(ch.findtext("title")),
        "title": plain(item.findtext("title")),
        "subtitle": plain(item.findtext("description")),
        "link": (item.findtext("link") or "").strip(),
        "date": date,
        "image": enc.get("url") if enc is not None and (enc.get("type") or "").startswith("image/") else None,
    }

post = None
for source in (from_feed2json("https://feed2json.org/convert?url="), from_feed2json("https://www.toptal.com/developers/feed2json/convert?url="), direct):
    try:
        p = source()
        if p["title"] and p["link"].startswith("https://"):
            post = p
            break
        print(f"{source.__name__}: newest post is missing a title or link")
    except Exception as e:
        print(f"{source.__name__}: {e}")
if post is None:
    # a warning, not a failure, so a hiccup doesn't send a failed-run email every hour
    print("::warning::Couldn't read the newsletter feed; keeping the saved post")
    sys.exit(0)
if len(post["subtitle"]) > 300:
    post["subtitle"] = ""
with open(out, "w") as f:
    json.dump(post, f, indent=1, ensure_ascii=False)
    f.write("\n")
print(json.dumps(post, indent=1, ensure_ascii=False))
