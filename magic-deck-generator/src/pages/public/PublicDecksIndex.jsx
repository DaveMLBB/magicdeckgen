import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import SEOHead from '../../components/seo/SEOHead';
import StructuredData from '../../components/seo/StructuredData';
import PublicNav from '../../components/public/PublicNav';
import CTASection from '../../components/public/CTASection';
import './PublicPages.css';
import './PublicDecksIndex.css';

const API_URL = import.meta.env.PROD
  ? 'https://api.magicdeckbuilder.app.cloudsw.site'
  : 'http://localhost:8000';

const COLOR_MAP = { W: '☀️', U: '💧', B: '💀', R: '🔥', G: '🌲' };

const FORMATS = ['', 'Standard', 'Modern', 'Pioneer', 'Legacy', 'Vintage', 'Commander', 'Pauper', 'cEDH'];

export default function PublicDecksIndex() {
  const [searchParams, setSearchParams] = useSearchParams();
  const page = parseInt(searchParams.get('page') || '1', 10);
  const format = searchParams.get('format') || '';

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams({ page, page_size: 40 });
    if (format) params.set('format', format);
    fetch(`${API_URL}/api/saved-decks/public/search?${params}`)
      .then(r => r.json())
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [page, format]);

  const decks = data?.decks || [];
  const pagination = data?.pagination || {};

  const setPage = (p) => setSearchParams(prev => { prev.set('page', p); return prev; });
  const setFormat = (f) => setSearchParams({ format: f, page: 1 });

  const seoTitle = `MTG Decks Database — ${pagination.total || '7,000'}+ Public Decklists | Magic Deck Builder`;
  const seoDesc = `Browse ${pagination.total || '7,000'}+ public Magic: The Gathering decklists. Filter by format, archetype, and colors. Find Standard, Modern, Commander, cEDH decks and more.`;

  const structuredData = {
    '@type': 'CollectionPage',
    name: 'MTG Public Decks',
    description: seoDesc,
    url: 'https://magicdeckbuilder.app.cloudsw.site/decks',
    numberOfItems: pagination.total,
  };

  return (
    <div className="seo-public-page">
      <SEOHead
        title={seoTitle}
        description={seoDesc}
        canonical="/decks"
        keywords="MTG decks, Magic the Gathering decklists, Standard decks, Modern decks, Commander decks, cEDH decks, Pauper decks"
        lang="en"
      />
      <StructuredData type="CollectionPage" data={structuredData} />

      <PublicNav />

      <div className="pdi-hero">
        <div className="container">
          <h1 className="pdi-title">MTG Decks Database</h1>
          <p className="pdi-subtitle">
            Browse {pagination.total ? pagination.total.toLocaleString() : '7,000'}+ public Magic: The Gathering decklists.
            Find your next deck, check the card list, and build it from your collection.
          </p>
        </div>
      </div>

      <div className="container pdi-content">
        {/* Format filter */}
        <div className="pdi-filters">
          {FORMATS.map(f => (
            <button
              key={f || 'all'}
              className={`pdi-filter-btn ${format === f ? 'active' : ''}`}
              onClick={() => setFormat(f)}
            >
              {f || 'All Formats'}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="pdi-loading">Loading decks...</div>
        ) : (
          <>
            <div className="pdi-grid">
              {decks.map(deck => (
                <Link
                  key={deck.id}
                  to={`/decks/${deck.slug || deck.id}`}
                  className="pdi-deck-card"
                >
                  <div className="pdi-deck-header">
                    <span className="pdi-deck-name">{deck.name}</span>
                    <span className="pdi-deck-colors">
                      {(deck.colors || '').split(',').map(c => COLOR_MAP[c.trim()] || '').join('')}
                    </span>
                  </div>
                  <div className="pdi-deck-meta">
                    {deck.format && <span className="pdi-tag pdi-tag-format">{deck.format}</span>}
                    {deck.archetype && <span className="pdi-tag pdi-tag-arch">{deck.archetype}</span>}
                    <span className="pdi-tag">{deck.total_cards} cards</span>
                  </div>
                  {deck.description && (
                    <p className="pdi-deck-desc">{deck.description.slice(0, 80)}{deck.description.length > 80 ? '…' : ''}</p>
                  )}
                </Link>
              ))}
            </div>

            {/* Pagination */}
            {pagination.total_pages > 1 && (
              <div className="pdi-pagination">
                <button
                  className="pdi-page-btn"
                  disabled={!pagination.has_prev}
                  onClick={() => setPage(page - 1)}
                >
                  ← Prev
                </button>
                <span className="pdi-page-info">
                  Page {pagination.page} of {pagination.total_pages}
                </span>
                <button
                  className="pdi-page-btn"
                  disabled={!pagination.has_next}
                  onClick={() => setPage(page + 1)}
                >
                  Next →
                </button>
              </div>
            )}
          </>
        )}
      </div>

      <CTASection lang="en" />
    </div>
  );
}
