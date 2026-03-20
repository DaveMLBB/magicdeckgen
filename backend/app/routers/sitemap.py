"""
Sitemap XML dinamica che include tutte le pagine pubbliche dei mazzi.
"""
from fastapi import APIRouter, Depends, Response
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import SavedDeck

router = APIRouter()

SITE_URL = "https://magicdeckbuilder.app.cloudsw.site"

STATIC_URLS = [
    {"loc": "/", "priority": "1.0", "changefreq": "weekly"},
    {"loc": "/en/mtg-deck-builder-from-collection", "priority": "0.9", "changefreq": "weekly"},
    {"loc": "/it/costruttore-mazzi-mtg-da-collezione", "priority": "0.9", "changefreq": "weekly"},
    {"loc": "/decks", "priority": "0.8", "changefreq": "daily"},
    {"loc": "/en/cedh-deck-builder-from-collection", "priority": "0.7", "changefreq": "monthly"},
    {"loc": "/en/pauper-deck-builder-from-collection", "priority": "0.7", "changefreq": "monthly"},
    {"loc": "/en/vintage-deck-builder-from-collection", "priority": "0.7", "changefreq": "monthly"},
    {"loc": "/en/premodern-deck-builder-from-collection", "priority": "0.7", "changefreq": "monthly"},
    {"loc": "/en/highlander-deck-builder-from-collection", "priority": "0.7", "changefreq": "monthly"},
]


@router.get("/sitemap.xml", response_class=Response)
def sitemap_xml(db: Session = Depends(get_db)):
    """Genera sitemap XML con tutte le pagine pubbliche dei mazzi."""
    from app.models import DeckTemplate

    saved = db.query(SavedDeck.slug, SavedDeck.updated_at).filter(
        SavedDeck.is_public == True,
        SavedDeck.slug != None,
        SavedDeck.slug != ''
    ).all()

    templates = db.query(DeckTemplate.slug).filter(
        DeckTemplate.slug != None,
        DeckTemplate.slug != ''
    ).all()

    urls = []

    # Static pages
    for u in STATIC_URLS:
        urls.append(
            f"  <url>\n"
            f"    <loc>{SITE_URL}{u['loc']}</loc>\n"
            f"    <changefreq>{u['changefreq']}</changefreq>\n"
            f"    <priority>{u['priority']}</priority>\n"
            f"  </url>"
        )

    # Dynamic saved deck pages (user public decks)
    for deck in saved:
        lastmod = deck.updated_at.strftime("%Y-%m-%d") if deck.updated_at else "2024-01-01"
        urls.append(
            f"  <url>\n"
            f"    <loc>{SITE_URL}/decks/{deck.slug}</loc>\n"
            f"    <lastmod>{lastmod}</lastmod>\n"
            f"    <changefreq>monthly</changefreq>\n"
            f"    <priority>0.6</priority>\n"
            f"  </url>"
        )

    # Dynamic template pages (7000+ tournament decks)
    for t in templates:
        urls.append(
            f"  <url>\n"
            f"    <loc>{SITE_URL}/decks/{t.slug}</loc>\n"
            f"    <changefreq>monthly</changefreq>\n"
            f"    <priority>0.7</priority>\n"
            f"  </url>"
        )

    xml = (
        '<?xml version="1.0" encoding="UTF-8"?>\n'
        '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
        + "\n".join(urls)
        + "\n</urlset>"
    )

    return Response(content=xml, media_type="application/xml")
