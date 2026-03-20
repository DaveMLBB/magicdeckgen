"""
Sitemap XML dinamica per le pagine dei mazzi (deck_templates + saved_decks pubblici).
Esposta su /api/sitemap-decks.xml (singolo file, max 50k URL)
e /api/sitemap-decks-{n}.xml per file paginati se necessario.
"""
from fastapi import APIRouter, Depends, Response, Query
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import SavedDeck

router = APIRouter()

SITE_URL = "https://magicdeckbuilder.app.cloudsw.site"
API_URL  = "https://api.magicdeckbuilder.app.cloudsw.site"
PAGE_SIZE = 5000  # URL per file sitemap


def _url_entry(loc, lastmod=None, changefreq="monthly", priority="0.7"):
    parts = [f"  <url>", f"    <loc>{loc}</loc>"]
    if lastmod:
        parts.append(f"    <lastmod>{lastmod}</lastmod>")
    parts += [f"    <changefreq>{changefreq}</changefreq>", f"    <priority>{priority}</priority>", "  </url>"]
    return "\n".join(parts)


def _wrap_urlset(entries):
    return (
        '<?xml version="1.0" encoding="UTF-8"?>\n'
        '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
        + "\n".join(entries)
        + "\n</urlset>"
    )


@router.get("/api/sitemap-decks-index.xml", response_class=Response)
def sitemap_decks_index(db: Session = Depends(get_db)):
    """
    Sitemap index che punta ai file paginati.
    Da aggiungere al sitemap.xml principale del frontend.
    """
    from app.models import DeckTemplate

    total_templates = db.query(DeckTemplate).filter(
        DeckTemplate.slug != None, DeckTemplate.slug != ''
    ).count()
    total_saved = db.query(SavedDeck).filter(
        SavedDeck.is_public == True,
        SavedDeck.slug != None, SavedDeck.slug != ''
    ).count()
    total = total_templates + total_saved
    num_pages = max(1, (total + PAGE_SIZE - 1) // PAGE_SIZE)

    entries = []
    for i in range(1, num_pages + 1):
        entries.append(
            f"  <sitemap>\n"
            f"    <loc>{API_URL}/api/sitemap-decks-{i}.xml</loc>\n"
            f"    <lastmod>2026-03-20</lastmod>\n"
            f"  </sitemap>"
        )

    xml = (
        '<?xml version="1.0" encoding="UTF-8"?>\n'
        '<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
        + "\n".join(entries)
        + "\n</sitemapindex>"
    )
    return Response(content=xml, media_type="application/xml")


@router.get("/api/sitemap-decks-{page}.xml", response_class=Response)
def sitemap_decks_page(page: int, db: Session = Depends(get_db)):
    """Sitemap paginata per i mazzi. Es: /api/sitemap-decks-1.xml"""
    from app.models import DeckTemplate

    offset = (page - 1) * PAGE_SIZE
    remaining = PAGE_SIZE

    entries = []

    # Prima i template (7000+)
    templates = db.query(DeckTemplate.slug).filter(
        DeckTemplate.slug != None, DeckTemplate.slug != ''
    ).order_by(DeckTemplate.id).offset(offset).limit(remaining).all()

    for t in templates:
        entries.append(_url_entry(f"{SITE_URL}/decks/{t.slug}", priority="0.7"))

    remaining -= len(templates)

    # Poi i saved deck pubblici se c'è ancora spazio
    if remaining > 0:
        template_total = db.query(DeckTemplate).filter(
            DeckTemplate.slug != None, DeckTemplate.slug != ''
        ).count()
        saved_offset = max(0, offset - template_total)
        saved = db.query(SavedDeck.slug, SavedDeck.updated_at).filter(
            SavedDeck.is_public == True,
            SavedDeck.slug != None, SavedDeck.slug != ''
        ).order_by(SavedDeck.id).offset(saved_offset).limit(remaining).all()

        for d in saved:
            lastmod = d.updated_at.strftime("%Y-%m-%d") if d.updated_at else None
            entries.append(_url_entry(f"{SITE_URL}/decks/{d.slug}", lastmod=lastmod, priority="0.6"))

    if not entries:
        return Response(status_code=404)

    return Response(content=_wrap_urlset(entries), media_type="application/xml")


@router.get("/api/sitemap-decks.xml", response_class=Response)
def sitemap_decks_single(db: Session = Depends(get_db)):
    """
    Sitemap singola con tutti i mazzi (fino a 50k URL).
    Comoda per siti con meno di 50k pagine.
    """
    from app.models import DeckTemplate

    templates = db.query(DeckTemplate.slug).filter(
        DeckTemplate.slug != None, DeckTemplate.slug != ''
    ).order_by(DeckTemplate.id).all()

    saved = db.query(SavedDeck.slug, SavedDeck.updated_at).filter(
        SavedDeck.is_public == True,
        SavedDeck.slug != None, SavedDeck.slug != ''
    ).all()

    entries = []
    for t in templates:
        entries.append(_url_entry(f"{SITE_URL}/decks/{t.slug}", priority="0.7"))
    for d in saved:
        lastmod = d.updated_at.strftime("%Y-%m-%d") if d.updated_at else None
        entries.append(_url_entry(f"{SITE_URL}/decks/{d.slug}", lastmod=lastmod, priority="0.6"))

    return Response(content=_wrap_urlset(entries), media_type="application/xml")
