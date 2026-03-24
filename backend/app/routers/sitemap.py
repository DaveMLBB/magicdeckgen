"""
Sitemap XML dinamica per le pagine dei mazzi (deck_templates + saved_decks pubblici).
Esposta su /sitemap-decks-{n}.xml (paginata, max 50k URL/file).
Tutto sotto il dominio principale, proxato da Caddy.
"""
from fastapi import APIRouter, Depends, Response, Query
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import SavedDeck

router = APIRouter()

SITE_URL  = "https://mtgdecksbuilder.com"
PAGE_SIZE = 5000  # URL per file sitemap (limite Google: 50k)


def _url_entry(loc, lastmod=None):
    parts = ["  <url>", f"    <loc>{loc}</loc>"]
    if lastmod:
        parts.append(f"    <lastmod>{lastmod}</lastmod>")
    parts.append("  </url>")
    return "\n".join(parts)


def _wrap_urlset(entries):
    return (
        '<?xml version="1.0" encoding="UTF-8"?>\n'
        '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
        + "\n".join(entries)
        + "\n</urlset>"
    )


@router.get("/sitemap-decks-{page}.xml", response_class=Response)
@router.head("/sitemap-decks-{page}.xml", response_class=Response)
def sitemap_decks_page(page: int, db: Session = Depends(get_db)):
    """Sitemap paginata per i mazzi. Es: /sitemap-decks-1.xml"""
    from app.models import DeckTemplate

    offset    = (page - 1) * PAGE_SIZE
    remaining = PAGE_SIZE
    entries   = []

    # Prima i template (7000+) — nessun lastmod perché non hanno updated_at
    templates = db.query(DeckTemplate.slug).filter(
        DeckTemplate.slug != None, DeckTemplate.slug != ''
    ).order_by(DeckTemplate.id).offset(offset).limit(remaining).all()

    for t in templates:
        entries.append(_url_entry(f"{SITE_URL}/decks/{t.slug}"))

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
            entries.append(_url_entry(f"{SITE_URL}/decks/{d.slug}", lastmod=lastmod))

    if not entries:
        return Response(status_code=404)

    return Response(
        content=_wrap_urlset(entries),
        media_type="application/xml",
        headers={"Cache-Control": "public, max-age=86400"}
    )


@router.get("/sitemap-decks.xml", response_class=Response)
def sitemap_decks_single(db: Session = Depends(get_db)):
    """Sitemap singola con tutti i mazzi (fino a 50k URL)."""
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
        entries.append(_url_entry(f"{SITE_URL}/decks/{t.slug}"))
    for d in saved:
        lastmod = d.updated_at.strftime("%Y-%m-%d") if d.updated_at else None
        entries.append(_url_entry(f"{SITE_URL}/decks/{d.slug}", lastmod=lastmod))

    return Response(content=_wrap_urlset(entries), media_type="application/xml")
