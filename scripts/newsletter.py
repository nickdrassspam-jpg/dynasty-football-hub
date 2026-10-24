# Reads the newsletter's RSS feed and writes its newest post to data/newsletter.json for the home page.
# Substack doesn't allow the page to read the feed from the browser, so .github/workflows/newsletter.yml runs this on a schedule.
# Usage: python3 scripts/newsletter.py <feed url> [out file]
import html, json, re, sys, urllib.request
import xml.etree.ElementTree as ET
from email.utils import parsedate_to_datetime

feed, out = sys.argv[1], sys.argv[2] if len(sys.argv) > 2 else "data/newsletter.json"
req = urllib.request.Request(feed, headers={"User-Agent": "dynasty-football-hub newsletter check"})
root = ET.fromstring(urllib.request.urlopen(req, timeout=30).read())
ch = root.find("channel")
item = ch.find("item") if ch is not None else None
if item is None:
    sys.exit("No posts in " + feed)

text = lambda el, tag: html.unescape(re.sub(r"<[^>]+>", "", el.findtext(tag) or "")).strip()
enc = item.find("enclosure")
image = enc.get("url") if enc is not None and (enc.get("type") or "").startswith("image/") else None
try:
    date = parsedate_to_datetime(item.findtext("pubDate")).date().isoformat()
except (TypeError, ValueError):
    date = None
post = {
    "publication": text(ch, "title"),
    "home": (ch.findtext("link") or "").strip(),
    "title": text(item, "title"),
    "subtitle": text(item, "description"),
    "link": (item.findtext("link") or "").strip(),
    "date": date,
    "image": image,
}
if not post["title"] or not post["link"].startswith("https://"):
    sys.exit("Newest post is missing a title or link")
with open(out, "w") as f:
    json.dump(post, f, indent=1, ensure_ascii=False)
    f.write("\n")
print(post["date"], post["title"])
