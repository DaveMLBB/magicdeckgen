import { useState, useEffect, useRef } from 'react';
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
  W: { label: 'White', emoji: '☀️' },
  U: { label: 'Blue',  emoji: '💧' },
  B: { label: 'Black', emoji: '💀' },
  R: { label: 'Red',   emoji: '🔥' },
  G: { label: 'Green', emoji: '🌲' },
};

const TYPE_ORDER = ['Creature', 'Planeswalker', 'Instant', 'Sorcery', 'Enchantment', 'Artifact', 'Land', 'Other'];

// ── Card hover preview ──────────────────────────────────────────────────────
function CardPreview({ name, x, y }) {
  const [imgUrl, setImgUrl] = useState(null);
  useEffect(() => {
    if (!name) return;
    setImgUrl(null);
    fetch(`https://api.scryfall.com/cards/named?exact=${encodeURIComponent(name)}&format=image&version=normal`, { redirect: 'follow' })
      .then(r => { if (r.ok) setImgUrl(r.url); })
      .catch(() => {});
    // Use Scryfall image directly
    const url = `https://api.scryfall.com/cards/named?exact=${encodeURIComponent(name)}`;
    fetch(url).then(r => r.json()).then(d => {
      const img = d?.image_uris?.normal || d?.card_faces?.[0]?.image_uris?.normal;
      if (img) setImgUrl(img);
    }).catch(() => {});
  }, [name]);

  if (!imgUrl) return null;
  const style = {
    position: 'fixed',
    left: x + 16,
    top: Math.min(y - 60, window.innerHeight - 340),
    zIndex: 9999,
    pointerEvents: 'none',
    borderRadius: 12,
    boxShadow: '0 8px 32px rgba(0,0,0,0.7)',
    width: 200,
  };
  return <img src={imgUrl} alt={name} style={style} />;
}

// ── Deck stats ──────────────────────────────────────────────────────────────
function DeckStats({ cards }) {
  if (!cards || cards.length === 0) return null;

  const nonLand = cards.filter(c => c.card_type !== 'Land' && c.card_type !== 'Basic Land');
  const totalNonLand = nonLand.reduce((s, c) => s + c.quantity, 0);

  // Mana curve (CMC from mana_cost string)
  const parseCmc = (mc) => {
    if (!mc) return 0;
    const generic = mc.match(/\{(\d+)\}/);
    const colored = (mc.match(/\{[WUBRGC]\}/g) || []).length;
    const x = mc.includes('{X}') ? 0 : 0;
    return (generic ? parseInt(generic[1]) : 0) + colored + x;
  };

  const curve = {};
  nonLand.forEach(c => {
    const cmc = Math.min(parseCmc(c.mana_cost), 7);
    const label = cmc >= 7 ? '7+' : String(cmc);
    curve[label] = (curve[label] || 0) + c.quantity;
  });

  const maxCurve = Math.max(...Object.values(curve), 1);
  const avgCmc = totalNonLand > 0
    ? (nonLand.reduce((s, c) => s + parseCmc(c.mana_cost) * c.quantity, 0) / totalNonLand).toFixed(2)
    : '—';

  // Type breakdown
  const typeCount = {};
  cards.forEach(c => {
    const t = c.card_type || 'Other';
    typeCount[t] = (typeCount[t] || 0) + c.quantity;
  });

  const totalCards = cards.reduce((s, c) => s + c.quantity, 0);

  return (
    <div className="pdp-stats">
      <h3>Deck Statistics</h3>

      <div className="pdp-stats-row">
        <div className="pdp-stat-box">
          <span className="pdp-stat-val">{totalCards}</span>
          <span className="pdp-stat-lbl">Total Cards</span>
        </div>
        <div className="pdp-stat-box">
          <span className="pdp-stat-val">{avgCmc}</span>
          <span className="pdp-stat-lbl">Avg. CMC</span>
        </div>
        <div className="pdp-stat-box">
          <span className="pdp-stat-val">{typeCount['Creature'] || 0}</span>
          <span className="pdp-stat-lbl">Creatures</span>
        </div>
        <div className="pdp-stat-box">
          <span className="pdp-stat-val">{typeCount['Land'] || typeCount['Basic Land'] || 0}</span>
          <span className="pdp-stat-lbl">Lands</span>
        </div>
      </div>

      {/* Mana curve */}
      <div className="pdp-curve">
        <p className="pdp-curve-title">Mana Curve</p>
        <div className="pdp-curve-bars">
          {['0','1','2','3','4','5','6','7+'].map(label => {
            const count = curve[label] || 0;
            const pct = Math.round((count / maxCurve) * 100);
            return (
              <div key={label} className="pdp-curve-col">
                <span className="pdp-curve-count">{count || ''}</span>
                <div className="pdp-curve-bar" style={{ height: `${Math.max(pct, count ? 4 : 0)}%` }} />
                <span className="pdp-curve-label">{label}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Type breakdown */}
      <div className="pdp-type-breakdown">
        {Object.entries(typeCount).sort((a,b) => b[1]-a[1]).map(([type, count]) => (
          <div key={type} className="pdp-type-row">
            <span className="pdp-type-name">{type}</span>
            <div className="pdp-type-bar-wrap">
              <div className="pdp-type-bar" style={{ width: `${Math.round(count/totalCards*100)}%` }} />
            </div>
            <span className="pdp-type-count">{count}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Copy tools ──────────────────────────────────────────────────────────────
function CopyTools({ deck }) {
  const [copied, setCopied] = useState('');

  const buildTextList = () =>
    (deck.cards || []).map(c => `${c.quantity} ${c.name}`).join('\n');

  const buildArenaList = () => {
    const groups = {};
    (deck.cards || []).forEach(c => {
      const t = c.card_type || 'Other';
      groups[t] = groups[t] || [];
      groups[t].push(`${c.quantity} ${c.name}`);
    });
    const creatures  = groups['Creature'] || [];
    const spells     = [...(groups['Instant']||[]), ...(groups['Sorcery']||[]), ...(groups['Enchantment']||[]), ...(groups['Artifact']||[]), ...(groups['Planeswalker']||[])];
    const lands      = [...(groups['Land']||[]), ...(groups['Basic Land']||[])];
    const parts = [];
    if (creatures.length)  parts.push('Creatures\n' + creatures.join('\n'));
    if (spells.length)     parts.push('Spells\n' + spells.join('\n'));
    if (lands.length)      parts.push('Lands\n' + lands.join('\n'));
    return parts.join('\n\n');
  };

  const copy = (text, label) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(label);
      setTimeout(() => setCopied(''), 2000);
    });
  };

  return (
    <div className="pdp-copy-tools">
      <h3>Export / Copy</h3>
      <div className="pdp-copy-btns">
        <button className="pdp-copy-btn" onClick={() => copy(buildTextList(), 'list')}>
          {copied === 'list' ? '✅ Copied!' : '📋 Copy List'}
        </button>
        <button className="pdp-copy-btn" onClick={() => copy(buildArenaList(), 'arena')}>
          {copied === 'arena' ? '✅ Copied!' : '🎮 Copy for MTGA'}
        </button>
        <button className="pdp-copy-btn" onClick={() => copy(buildTextList(), 'mtgo')}>
          {copied === 'mtgo' ? '✅ Copied!' : '🖥️ Copy for MTGO'}
        </button>
      </div>
    </div>
  );
}

// ── Helpers ─────────────────────────────────────────────────────────────────
function colorBadges(colors) {
  if (!colors) return null;
  return colors.split(',').map(c => c.trim()).filter(Boolean).map(c => {
    const info = COLOR_MAP[c] || { emoji: c };
    return <span key={c} className="pdp-color-badge" title={info.label}>{info.emoji}</span>;
  });
}

function buildSEODescription(deck) {
  const parts = [deck.format, deck.archetype].filter(Boolean);
  const base = parts.length ? `${parts.join(' ')} deck` : 'MTG deck';
  return deck.description?.slice(0, 120) ||
    `${deck.name} — ${base} with ${deck.total_cards} cards. View the full card list, mana curve, and build it with Magic Deck Builder.`;
}

function buildKeywords(deck) {
  const kw = ['MTG', 'Magic the Gathering', 'deck', deck.name];
  if (deck.format) kw.push(deck.format, `${deck.format} deck`);
  if (deck.archetype) kw.push(deck.archetype);
  if (deck.colors) deck.colors.split(',').forEach(c => {
    const info = COLOR_MAP[c.trim()];
    if (info) kw.push(info.label);
  });
  return kw.join(', ');
}

// ── Main component ───────────────────────────────────────────────────────────
export default function PublicDeckPage() {
  const { slug } = useParams();
  const [deck, setDeck]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);
  const [hover, setHover]     = useState({ name: null, x: 0, y: 0 });

  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    fetch(`${API_URL}/api/saved-decks/public/deck/${slug}`)
      .then(r => {
        if (r.ok) return r.json();
        return fetch(`${API_URL}/api/decks/public/template/${slug}`).then(r2 => {
          if (!r2.ok) throw new Error('Deck not found');
          return r2.json();
        });
      })
      .then(setDeck)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) return (
    <div className="seo-public-page">
      <PublicNav />
      <div className="pdp-loading">Loading deck...</div>
    </div>
  );

  if (error || !deck) return (
    <div className="seo-public-page">
      <PublicNav />
      <div className="pdp-error">
        <h1>Deck not found</h1>
        <p>This deck may have been removed or made private.</p>
        <Link to="/decks" className="pdp-cta-btn">← Browse all decks</Link>
      </div>
    </div>
  );

  const seoTitle = `${deck.name} — ${deck.format || 'MTG'} ${deck.archetype || 'Deck'} | Magic Deck Builder`;
  const seoDesc  = buildSEODescription(deck);
  const keywords = buildKeywords(deck);

  const sortedTypes = TYPE_ORDER.filter(t => deck.cards_by_type?.[t]);
  const otherTypes  = Object.keys(deck.cards_by_type || {}).filter(t => !TYPE_ORDER.includes(t));
  const allTypes    = [...sortedTypes, ...otherTypes];

  return (
    <div className="seo-public-page">
      <SEOHead title={seoTitle} description={seoDesc} canonical={`/decks/${deck.slug}`}
        keywords={keywords} ogType="article" lang="en" />
      <StructuredData type="Article" data={{
        headline: deck.name, description: seoDesc,
        url: `https://magicdeckbuilder.app.cloudsw.site/decks/${deck.slug}`,
        datePublished: deck.created_at, keywords,
        author: { '@type': 'Organization', name: 'Magic Deck Builder' },
      }} />

      <PublicNav />

      {/* Card hover preview */}
      {hover.name && <CardPreview name={hover.name} x={hover.x} y={hover.y} />}

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
            {deck.format    && <span className="pdp-badge pdp-badge-format">{deck.format}</span>}
            {deck.archetype && <span className="pdp-badge pdp-badge-archetype">{deck.archetype}</span>}
            {deck.source    && <span className="pdp-badge pdp-badge-source">{deck.source}</span>}
            <span className="pdp-badge pdp-badge-cards">{deck.total_cards} cards</span>
            <span className="pdp-colors">{colorBadges(deck.colors)}</span>
          </div>
          {deck.description && <p className="pdp-description">{deck.description}</p>}
        </div>
      </div>

      {/* Content */}
      <div className="container pdp-content">
        <div className="pdp-grid">

          {/* ── Card list ── */}
          <main className="pdp-main">
            <h2 className="pdp-section-title">Card List</h2>
            {allTypes.map(type => {
              const group = deck.cards_by_type?.[type];
              if (!group?.length) return null;
              const groupTotal = group.reduce((s, c) => s + c.quantity, 0);
              return (
                <div key={type} className="pdp-card-group">
                  <h3 className="pdp-group-title">
                    {type} <span className="pdp-group-count">{groupTotal}</span>
                  </h3>
                  <ul className="pdp-card-list">
                    {[...group].sort((a,b) => b.quantity - a.quantity).map(card => (
                      <li
                        key={card.name}
                        className="pdp-card-row"
                        onMouseEnter={e => setHover({ name: card.name, x: e.clientX, y: e.clientY })}
                        onMouseMove={e  => setHover(h => ({ ...h, x: e.clientX, y: e.clientY }))}
                        onMouseLeave={() => setHover({ name: null, x: 0, y: 0 })}
                      >
                        <span className="pdp-card-qty">{card.quantity}x</span>
                        <a
                          href={`https://scryfall.com/search?q=${encodeURIComponent(card.name)}`}
                          target="_blank" rel="noopener noreferrer"
                          className="pdp-card-name"
                        >
                          {card.name}
                        </a>
                        {card.mana_cost && <span className="pdp-card-mana">{card.mana_cost}</span>}
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </main>

          {/* ── Sidebar ── */}
          <aside className="pdp-sidebar">

            {/* Copy tools */}
            <div className="pdp-sidebar-card">
              <CopyTools deck={deck} />
            </div>

            {/* Stats */}
            <div className="pdp-sidebar-card">
              <DeckStats cards={deck.cards} />
            </div>

            {/* Deck info */}
            <div className="pdp-sidebar-card">
              <h3>Deck Info</h3>
              <dl className="pdp-info-list">
                {deck.format    && <><dt>Format</dt><dd>{deck.format}</dd></>}
                {deck.archetype && <><dt>Archetype</dt><dd>{deck.archetype}</dd></>}
                {deck.source    && <><dt>Source</dt><dd>{deck.source}</dd></>}
                {deck.colors    && <><dt>Colors</dt><dd className="pdp-colors-row">{colorBadges(deck.colors)}</dd></>}
                <dt>Total Cards</dt><dd>{deck.total_cards}</dd>
              </dl>
            </div>

            {/* CTA */}
            <div className="pdp-sidebar-card pdp-cta-card">
              <h3>Build this deck</h3>
              <p>Check how many cards you already own and find what's missing.</p>
              <Link to="/en/mtg-deck-builder-from-collection" className="pdp-cta-btn">
                Try Magic Deck Builder →
              </Link>
            </div>

            {/* SEO block */}
            <div className="pdp-sidebar-card pdp-seo-block">
              <h3>About {deck.name}</h3>
              <p>
                {deck.name} is a {deck.format || 'Magic: The Gathering'}{' '}
                {deck.archetype ? deck.archetype.toLowerCase() : 'deck'} with {deck.total_cards} cards.
                {deck.description ? ` ${deck.description}` : ''}
              </p>
              <p>
                Use Magic Deck Builder to import your collection and instantly see how close you are to building {deck.name}.
              </p>
            </div>
          </aside>
        </div>
      </div>

      <CTASection lang="en" />
    </div>
  );
}
