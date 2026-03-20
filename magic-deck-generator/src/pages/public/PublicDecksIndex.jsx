import { useState, useEffect, useCallback, useRef } from 'react';
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

const COLOR_OPTIONS = [
  { code: 'W', emoji: '☀️', label: 'White' },
  { code: 'U', emoji: '💧', label: 'Blue' },
  { code: 'B', emoji: '💀', label: 'Black' },
  { code: 'R', emoji: '🔥', label: 'Red' },
  { code: 'G', emoji: '🌲', label: 'Green' },
];

const FORMATS = ['Standard', 'Modern', 'Pioneer', 'Legacy', 'Vintage', 'Commander', 'Pauper', 'cEDH', 'Premodern', 'Highlander'];

export default function PublicDecksIndex() {
  const [searchParams, setSearchParams] = useSearchParams();
  const page    = parseInt(searchParams.get('page') || '1', 10);
  const format  = searchParams.get('format') || '';
  const colors  = searchParams.get('colors') || '';
  const name    = searchParams.get('name') || '';

  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [nameInput, setNameInput] = useState(name);
  const debounceRef = useRef(null);

  const updateParam = (key, val) => {
    setSearchParams(prev => {
      const next = new URLSearchParams(prev);
      if (val) next.set(key, val); else next.delete(key);
      next.set('page', '1');
      return next;
    });
  };

  const toggleColor = (code) => {
    const current = colors ? colors.split(',') : [];
    const next = current.includes(code)
      ? current.filter(c => c !== code)
      : [...current, code];
    updateParam('colors', next.join(','));
  };

  const handleNameChange = (val) => {
    setNameInput(val);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => updateParam('name', val), 400);
  };

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams({ page, page_size: 40 });
    if (format) params.set('format', format);
    if (colors) params.set('colors', colors);
    if (name)   params.set('name', name);

    fetch(`${API_URL}/api/decks/public/templates/search?${params}`)
      .then(r => r.json())
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [page, format, colors, name]);

  const templates  = data?.templates || [];
  const total      = data?.total || 0;
  const totalPages = data?.total_pages || 1;
  const hasNext    = data?.has_next;
  const hasPrev    = data?.has_prev;

  const setPage = (p) => setSearchParams(prev => { const n = new URLSearchParams(prev); n.set('page', p); return n; });

  const seoTitle = `MTG Decks Database — 7,000+ Tournament Decklists | Magic Deck Builder`;
  const seoDesc  = `Browse 7,000+ Magic: The Gathering tournament decklists. Filter by format, color, and name. Standard, Modern, Commander, cEDH and more.`;

  return (
    <div className="seo-public-page">
      <SEOHead title={seoTitle} description={seoDesc} canonical="/decks"
        keywords="MTG decks, Magic the Gathering decklists, Standard, Modern, Commander, cEDH, Pauper" lang="en" />
      <StructuredData type="CollectionPage" data={{ name: 'MTG Decks', description: seoDesc, numberOfItems: total }} />

      <PublicNav />

      <div className="pdi-hero">
        <div className="container">
          <h1 className="pdi-title">MTG Decks Database</h1>
          <p className="pdi-subtitle">
            {total ? total.toLocaleString() : '7,000'}+ tournament decklists — filter, browse, and build from your collection.
          </p>
        </div>
      </div>

      <div className="container pdi-content">

        {/* ── Filters ── */}
        <div className="pdi-filter-panel">

          {/* Name search */}
          <div className="pdi-filter-row">
            <input
              className="pdi-search-input"
              type="text"
              placeholder="🔍 Search deck name..."
              value={nameInput}
              onChange={e => handleNameChange(e.target.value)}
            />
          </div>

          {/* Format pills */}
          <div className="pdi-filter-row">
            <button className={`pdi-filter-btn ${!format ? 'active' : ''}`} onClick={() => updateParam('format', '')}>All</button>
            {FORMATS.map(f => (
              <button key={f} className={`pdi-filter-btn ${format === f ? 'active' : ''}`} onClick={() => updateParam('format', f)}>{f}</button>
            ))}
          </div>

          {/* Color toggles */}
          <div className="pdi-filter-row">
            <span className="pdi-filter-label">Colors:</span>
            {COLOR_OPTIONS.map(c => (
              <button
                key={c.code}
                className={`pdi-color-btn ${colors.includes(c.code) ? 'active' : ''}`}
                onClick={() => toggleColor(c.code)}
                title={c.label}
              >
                {c.emoji} {c.label}
              </button>
            ))}
            {colors && (
              <button className="pdi-clear-btn" onClick={() => updateParam('colors', '')}>✕ Clear colors</button>
            )}
          </div>
        </div>

        {/* Results count */}
        {!loading && (
          <p className="pdi-results-count">
            {total.toLocaleString()} deck{total !== 1 ? 's' : ''} found
            {format ? ` in ${format}` : ''}
            {name ? ` matching "${name}"` : ''}
          </p>
        )}

        {loading ? (
          <div className="pdi-loading">Loading decks...</div>
        ) : templates.length === 0 ? (
          <div className="pdi-empty">No decks found. Try different filters.</div>
        ) : (
          <>
            <div className="pdi-grid">
              {templates.map(deck => (
                <Link key={deck.slug} to={`/decks/${deck.slug}`} className="pdi-deck-card">
                  <div className="pdi-deck-header">
                    <span className="pdi-deck-name">{deck.name}</span>
                    <span className="pdi-deck-colors">
                      {(deck.colors || '').split(',').map(c => {
                        const info = COLOR_OPTIONS.find(o => o.code === c.trim());
                        return info ? info.emoji : '';
                      }).join('')}
                    </span>
                  </div>
                  <div className="pdi-deck-meta">
                    {deck.format && <span className="pdi-tag pdi-tag-format">{deck.format}</span>}
                    {deck.source && <span className="pdi-tag">{deck.source}</span>}
                  </div>
                </Link>
              ))}
            </div>

            {totalPages > 1 && (
              <div className="pdi-pagination">
                <button className="pdi-page-btn" disabled={!hasPrev} onClick={() => setPage(page - 1)}>← Prev</button>
                <span className="pdi-page-info">Page {page} of {totalPages}</span>
                <button className="pdi-page-btn" disabled={!hasNext} onClick={() => setPage(page + 1)}>Next →</button>
              </div>
            )}
          </>
        )}
      </div>

      <CTASection lang="en" />
    </div>
  );
}
