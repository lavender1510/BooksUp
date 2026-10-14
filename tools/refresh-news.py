#!/usr/bin/env python3
"""Public RSS fetcher, safe no-auth headline cache. Keeps previous articles if feeds are offline."""
import email.utils, html, json, pathlib, re, urllib.request, xml.etree.ElementTree as ET
from datetime import datetime, timezone
from urllib.parse import urlparse

ROOT = pathlib.Path(__file__).resolve().parents[1]
DEST = ROOT / "www" / "news.json"
FEEDS = [
 ("The Guardian · Books", "https://www.theguardian.com/books/rss", "https://www.theguardian.com/books"),
 ("Publishers Weekly", "https://www.publishersweekly.com/pw/feeds/recent/index.xml", "https://www.publishersweekly.com"),
 ("Book Riot", "https://bookriot.com/feed/", "https://bookriot.com"),
]
headers={"User-Agent":"BooksUp/4.2 (GitHub Actions news aggregation)", "Accept":"application/rss+xml, application/atom+xml, application/xml, text/xml"}
articles=[]
for source,url,newsletter in FEEDS:
 try:
  req=urllib.request.Request(url, headers=headers)
  with urllib.request.urlopen(req,timeout=18) as res:
   raw=res.read(2_000_000)
  root=ET.fromstring(raw)
  entries=root.findall(".//item")
  if not entries:
   entries=root.findall(".//{http://www.w3.org/2005/Atom}entry")
  for item in entries[:24]:
   def text(path):
    v=item.find(path)
    return (v.text or "").strip() if v is not None else ""
   title=html.unescape(text("title") or text("{http://www.w3.org/2005/Atom}title"))
   link=text("link")
   if not link:
    el=item.find("{http://www.w3.org/2005/Atom}link")
    if el is not None: link=el.attrib.get("href","")
   if not title or not link.startswith("https://"):continue
   description=re.sub(r"<[^>]+>"," ",text("description") or text("{http://www.w3.org/2005/Atom}summary"))
   description=html.unescape(re.sub(r"\s+"," ",description)).strip()[:360]
   date=text("pubDate") or text("{http://www.w3.org/2005/Atom}updated")
   try:
    stamp=email.utils.parsedate_to_datetime(date).isoformat()
   except Exception:
    try:stamp=datetime.fromisoformat(date.replace("Z","+00:00")).isoformat()
    except Exception:stamp=None
   image=None
   for child in item:
    if child.tag.endswith("}thumbnail") or child.tag.endswith("}content"):
     v=child.attrib.get("url","")
     if v.startswith("https://") and (child.tag.endswith("}thumbnail") or child.attrib.get("medium")=="image" or child.attrib.get("type","").startswith("image/")):image=v;break
   if not image:
    enc=item.find("enclosure")
    if enc is not None and enc.attrib.get("type","").startswith("image/"):image=enc.attrib.get("url")
   if image and not image.startswith("https://"):image=None
   articles.append(dict(title=title[:220],url=link,source=source,newsletter=newsletter,date=stamp,summary=description,image=image))
 except Exception as exc:
  print("Feed skipped:",source,str(exc))
seen=set();unique=[]
for a in sorted(articles,key=lambda a:a["date"] or "",reverse=True):
 key=a["url"].split("?")[0]
 if key not in seen:seen.add(key);unique.append(a)
if not unique and DEST.exists():
 print("No fresh entries; preserved last verified feed")
else:
 DEST.write_text(json.dumps({"updatedAt":datetime.now(timezone.utc).isoformat(),"articles":unique[:40]},ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
 print("Published",len(unique[:40]),"articles")
