import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import SEOHead from '../../components/seo/SEOHead';
import StructuredData from '../../components/seo/StructuredData';
import PublicNav from '../../components/public/PublicNav';
import CTASection from '../../components/public/CTASection';
import './PublicPages.css';
import './PublicDeckPage.css';

const API_URL = import.meta.env.PROD
  ? 'https://api.magicdeckbuilder.app.cloudsw.site'
  : 'http://localhost:8000';

const COLOR_MAP = {
  W: { label: 'White', emoji: '☀️', hex: '#f9fafb' },
  U: { label: 'Blue',  emoji: '💧', hex: '#3b82f6' },
  B: { label: 'Black', emoji: '💀', hex: '#6b7280' },
  R: { label: 'Red',   emoji: '🔥', hex: '#ef4444' },
  G: { label: 'Green', emoji: '🌲', hex: '#22c55e' },
};

const TYPE_ORDER = ['Creature', 'Planeswalker', 'Instant', 'Sorcery', 'Enchantment', 'Artifact', 'Land', 'Other'];

function colorBadges(colors) {
  if (!colors) return null;
  return colors.split(',').map(c => c.trim()).filter(Boolean).map(c => {
    const info = COLOR_MAP[c] || { emoji: c, hex: '#94a3b8' };
    return (
      <span key={c} className="pdp-color-badge" title={info.label}>
        {info.emoji}
      </span>
    );
  });
}

function buildSEODescription(deck) {
  const parts = [];
  if (deck.format) parts.push(deck.format);
  if (deck.archetype) parts.push(deck.archetype);
  const base = parts.length ? `${parts.join(' ')} deck` : 'MTG deck';
  const desc = deck.description
    ? deck.description.slice(0, 120)
    : `${deck.name} — ${base} with ${deck.total_cards} cards. View the full card list, strategy, and build it with Magic Deck Builder.`;
  return desc;
}

function buildKeywords(deck) {
  const kw = ['MTG', 'Magic the Gathering', 'deck', deck.name];
  if (deck.format) kw.push(deck.format, `${deck.format} deck`);
  if (deck.archetype) kw.push(deck.archetype, `${deck.archetype} deck`);
  if (deck.colors) {
    deck.colors.split(',').forEach(c => {
      const info = COLOR_MAP[c.trim()];
      if (info) kw.push(info.label, `${info.label} ${deck.archetype || 'deck'}`);
    });
  }
  return kw.join(', ');
}

export default function PublicDeckPage() {
  const { slug } = useParams();
  const [deck, setDeck] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    fetch(`${API_URL}/api/saved-decks/public/deck/${slug}`)
      .then(r => {
        if (!r.ok) throw new Error('Deck not found');
        return r.json();
      })
      .then(setDeck)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) {
    return (
      <div className="seo-public-page">
        <PublicNav />
        <div className="pdp-loading">Loading deck...</div>
      </div>
    );
  }

  if (error || !deck) {
    return (
      <div className="seo-public-page">
        <PublicNav />
        <div className="pdp-error">
          <h1>Deck not found</h1>
          <p>This deck may have been made private or deleted.</p>
          <Link to="/en/mtg-deck-builder-from-collection" className="pdp-cta-btn">
            ← Back to Magic Deck Builder
          </Link>
        </div>
      </div>
    );
  }

  const seoTitle = `${deck.name} — ${deck.format || 'MTG'} ${deck.archetype || 'Deck'} | Magic Deck Builder`;
  const seoDesc = buildSEODescription(deck);
  const keywords = buildKeywords(deck);
  const canonical = `/decks/${deck.slug}`;

  const structuredData = {
    '@type': 'Article',
    headline: deck.name,
    description: seoDesc,
    url: `https://magicdeckbuilder.app.cloudsw.site/decks/${deck.slug}`,
    datePublished: deck.created_at,
    dateModified: deck.created_at,
    author: { '@type': 'Organization', name: 'Magic Deck Builder' },
    publisher: {
      '@type': 'Organization',
      name: 'Magic Deck Builder',
      url: 'https://magicdeckbuilder.app.cloudsw.site',
    },
    keywords,
  };

  const sortedTypes = TYPE_ORDER.filter(t => deck.cards_by_type?.[t]);
  const otherTypes = Object.keys(deck.cards_by_type || {}).filter(t => !TYPE_ORDER.includes(t));

  return (
    <div className="seo-public-page">
      <SEOHead
        title={seoTitle}
        description={seoDesc}
        canonical={canonical}
        keywords={keywords}
        ogType="article"
        lang="en"
      />
      <StructuredData type="Article" data={structuredData} />

      <PublicNav />

      {/* Hero */}
      <div className="pdp-hero">
        <div className="container">
          <div className="pdp-breadcrumb">
            <Link to="/en/mtg-deck-builder-from-collection">Magic Deck Builder</Link>
            <span> › </span>
            <Link to="/decks">Decks</Link>
            <span> › </span>
            <span>{deck.name}</span>
          </div>

          <h1 className="pdp-title">{deck.name}</h1>

          <div className="pdp-meta">
            {deck.format && <span className="pdp-badge pdp-badge-format">{deck.format}</span>}
            {deck.archetype && <span className="pdp-badge pdp-badge-archetype">{deck.archetype}</span>}
            <span className="pdp-badge pdp-badge-cards">{deck.total_cards} cards</span>
            <span className="pdp-colors">{colorBadges(deck.colors)}</span>
          </div>

          {deck.description && (
            <p className="pdp-description">{deck.description}</p>
          )}
        </div>
      </div>

      {/* Main content */}
      <div className="container pdp-content">
        <div className="pdp-grid">

          {/* Card list */}
          <main className="pdp-main">
            <h2 className="pdp-section-title">Card List</h2>

            {[...sortedTypes, ...otherTypes].map(type => {
              const group = deck.cards_by_type?.[type];
              if (!group || group.length === 0) return null;
              const groupTotal = group.reduce((s, c) => s + c.quantity, 0);
              return (
                <div key={type} className="pdp-card-group">
                  <h3 className="pdp-group-title">
                    {type}
                    <span className="pdp-group-count">{groupTotal}</span>
                  </h3>
                  <ul className="pdp-card-list">
                    {group
                      .sort((a, b) => b.quantity - a.quantity)
                      .map(card => (
                        <li key={card.name} className="pdp-card-row">
                          <span className="pdp-card-qty">{card.quantity}x</span>
                          <a
                            href={`https://scryfall.com/search?q=${encodeURIComponent(card.name)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="pdp-card-name"
                          >
                            {card.name}
                          </a>
                          {card.mana_cost && (
                            <span className="pdp-card-mana">{card.mana_cost}</span>
                          )}
                        </li>
                      ))}
                  </ul>
                </div>
              );
            })}
          </main>

          {/* Sidebar */}
          <aside className="pdp-sidebar">
            <div className="pdp-sidebar-card">
              <h3>Deck Info</h3>
              <dl className="pdp-info-list">
                {deck.format && <><dt>Format</dt><dd>{deck.format}</dd></>}
                {deck.archetype && <><dt>Archetype</dt><dd>{deck.archetype}</dd></>}
                {deck.colors && (
                  <>
                    <dt>Colors</dt>
                    <dd className="pdp-colors-row">{colorBadges(deck.colors)}</dd>
                  </>
                )}
                <dt>Total Cards</dt><dd>{deck.total_cards}</dd>
              </dl>
            </div>

            <div className="pdp-sidebar-card pdp-cta-card">
              <h3>Build this deck</h3>
              <p>Check how many cards you already own and find what's missing.</p>
              <Link to="/en/mtg-deck-builder-from-collection" className="pdp-cta-btn">
                Try Magic Deck Builder →
              </Link>
            </div>

            {/* SEO text block */}
            <div className="pdp-sidebar-card pdp-seo-block">
              <h3>About {deck.name}</h3>
              <p>
                {deck.name} is a {deck.format || 'Magic: The Gathering'}{' '}
                {deck.archetype ? deck.archetype.toLowerCase() : 'deck'} featuring{' '}
                {deck.total_cards} cards.
                {deck.description ? ` ${deck.description}` : ''}
              </p>
              <p>
                Use Magic Deck Builder to import your collection and instantly see
                how close you are to building {deck.name} — and thousands of other
                competitive decks.
              </p>
            </div>
          </aside>
        </div>
      </div>

      <CTASection lang="en" />
    </div>
  );
}
