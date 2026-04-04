import { useState, useEffect, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import PublicNav from '../../components/public/PublicNav';
import './PublicDeckPage.css';

const API_URL = import.meta.env.PROD
  ? 'https://api.mtgdecksbuilder.com'
  : 'http://localhost:8000';

const RARITY_ORDER = { mythic: 0, rare: 1, uncommon: 2, common: 3 };
const RARITY_COLOR = { mythic: '#fb923c', rare: '#fbbf24', uncommon: '#94a3b8', common: '#64748b' };

const COLOR_META = {
  W: { label: 'White',     emoji: '☀️' },
  U: { label: 'Blue',      emoji: '💧' },
  B: { label: 'Black',     emoji: '💀' },
  R: { label: 'Red',       emoji: '🔥' },
  G: { label: 'Green',     emoji: '🌲' },
  C: { label: 'Colorless', emoji: '💎' },
};

const s = {
  page:    { minHeight: '100vh', background: '#0a0b14', color: '#e2e8f0', fontFamily: "'Inter', -apple-system, sans-serif" },
  hero:    { background: 'linear-gradient(135deg, #1e1b4b 0%, #0f1117 100%)', borderBottom: '1px solid rgba(99,102,241,0.2)', padding: '48px 24px 36px' },
  heroInner: { maxWidth: 960, margin: '0 auto' },
  owner:   { fontSize: '0.82rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8, display: 'block' },
  title:   { fontSize: 'clamp(1.5rem,4vw,2.2rem)', fontWeight: 800, color: '#fff', margin: '0 0 8px' },
  desc:    { color: '#94a3b8', fontSize: '0.95rem', margin: '0 0 16px' },
  statsRow:{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 8, marginTop: 12 },
  statBadge:{ padding: '4px 12px', borderRadius: 999, fontSize: '0.82rem', background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)', color: '#cbd5e1' },
  statValue:{ padding: '4px 12px', borderRadius: 999, fontSize: '0.82rem', background: 'rgba(52,211,153,0.15)', border: '1px solid rgba(52,211,153,0.3)', color: '#34d399', fontWeight: 700 },
  body:    { maxWidth: 960, margin: '0 auto', padding: '24px 24px 60px' },
  controls:{ display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: 20, alignItems: 'center' },
  input:   { flex: '1 1 200px', padding: '9px 13px', background: '#16172d', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: '#e2e8f0', fontSize: '0.9rem', outline: 'none' },
  select:  { padding: '9px 12px', background: '#16172d', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: '#e2e8f0', fontSize: '0.85rem', cursor: 'pointer', outline: 'none' },
  colorBtn:(active) => ({ padding: '5px 10px', borderRadius: 6, fontSize: '0.9rem', cursor: 'pointer', border: active ? '2px solid #818cf8' : '1px solid rgba(255,255,255,0.12)', background: active ? 'rgba(99,102,241,0.3)' : 'rgba(255,255,255,0.05)', transition: 'all 0.15s' }),
  setSelect:{ padding: '9px 12px', background: '#16172d', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: '#e2e8f0', fontSize: '0.85rem', cursor: 'pointer', outline: 'none', maxWidth: 200 },
  table:   { width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem' },
  thead:   { borderBottom: '1px solid rgba(255,255,255,0.08)' },
  th:      { padding: '10px 12px', textAlign: 'left', color: '#64748b', fontWeight: 600, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.04em' },
  tr:      { borderBottom: '1px solid rgba(255,255,255,0.04)', transition: 'background 0.1s' },
  td:      { padding: '9px 12px' },
  empty:   { textAlign: 'center', padding: 48, color: '#475569' },
  footer:  { textAlign: 'center', padding: '40px 20px', borderTop: '1px solid rgba(255,255,255,0.05)', marginTop: 8 },
  ctaBtn:  { display: 'inline-block', padding: '12px 28px', background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', color: '#fff', borderRadius: 8, textDecoration: 'none', fontWeight: 700, fontSize: '0.95rem' },
};

export default function PublicCollectionPage() {
  const { token } = useParams();
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  // Filters
  const [search, setSearch]       = useState('');
  const [sortBy, setSortBy]       = useState('name');
  const [sortDir, setSortDir]     = useState('asc');
  const [filterColors, setFilterColors] = useState([]);  // active color toggles
  const [filterSet, setFilterSet] = useState('');        // set_code

  useEffect(() => {
    if (!token) return;
    setLoading(true);
    fetch(`${API_URL}/api/collections/public/${token}`)
      .then(res => { if (!res.ok) { setNotFound(true); return null; } return res.json(); })
      .then(d => { if (d) setData(d); })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [token]);

  // Derived: unique colors and sets from all cards
  const { allColors, allSets } = useMemo(() => {
    if (!data?.cards) return { allColors: [], allSets: [] };
    const colors = new Set();
    const sets = new Map(); // set_code -> set_name
    data.cards.forEach(c => {
      (c.colors || '').split(',').map(x => x.trim()).filter(Boolean).forEach(col => colors.add(col));
      if (c.set_code && c.set_code !== '—') sets.set(c.set_code.toUpperCase(), c.set_name || c.set_code.toUpperCase());
    });
    return {
      allColors: [...colors].filter(c => COLOR_META[c]).sort(),
      allSets: [...sets.entries()].sort((a, b) => a[0].localeCompare(b[0])),
    };
  }, [data]);

  const toggleColor = (col) => setFilterColors(prev =>
    prev.includes(col) ? prev.filter(c => c !== col) : [...prev, col]
  );

  const displayed = useMemo(() => {
    if (!data?.cards) return [];
    let list = [...data.cards];
    if (search) list = list.filter(c => c.name.toLowerCase().includes(search.toLowerCase()));
    if (filterColors.length > 0)
      list = list.filter(c => filterColors.every(col => (c.colors || '').split(',').map(x => x.trim()).includes(col)));
    if (filterSet)
      list = list.filter(c => (c.set_code || '').toUpperCase() === filterSet);
    list.sort((a, b) => {
      let cmp = 0;
      if (sortBy === 'name')   cmp = a.name.localeCompare(b.name);
      if (sortBy === 'price')  cmp = (b.price_eur ?? b.price_usd ?? 0) - (a.price_eur ?? a.price_usd ?? 0);
      if (sortBy === 'rarity') cmp = (RARITY_ORDER[a.rarity] ?? 9) - (RARITY_ORDER[b.rarity] ?? 9);
      if (sortBy === 'type')   cmp = (a.type || '').localeCompare(b.type || '');
      if (sortBy === 'qty')    cmp = b.quantity - a.quantity;
      return sortDir === 'desc' ? -cmp : cmp;
    });
    return list;
  }, [data, search, sortBy, sortDir, filterColors, filterSet]);

  if (loading) return (
    <div style={s.page}>
      <PublicNav />
      <div className="pdp-loading">Loading collection…</div>
    </div>
  );

  if (notFound || !data) return (
    <div style={s.page}>
      <PublicNav />
      <div className="pdp-error">
        <div style={{ fontSize: '2rem', marginBottom: 12 }}>🔒</div>
        <div style={{ fontWeight: 700, color: '#e2e8f0', marginBottom: 8 }}>Collection not found</div>
        <div style={{ color: '#64748b', marginBottom: 20 }}>This collection is private or the link is invalid.</div>
        <Link to="/" style={{ color: '#818cf8' }}>← Back to home</Link>
      </div>
    </div>
  );

  const { collection } = data;

  return (
    <div style={s.page}>
      <PublicNav />

      {/* Hero */}
      <div style={s.hero}>
        <div style={s.heroInner}>
          <span style={s.owner}>📚 {collection.owner}'s collection</span>
          <h1 style={s.title}>{collection.name}</h1>
          {collection.description && <p style={s.desc}>{collection.description}</p>}
          <div style={s.statsRow}>
            <span style={s.statBadge}><strong>{collection.total_unique}</strong> unique cards</span>
            <span style={s.statBadge}><strong>{collection.total_cards}</strong> total copies</span>
            {collection.total_value_eur > 0 && (
              <span style={s.statValue}>€{collection.total_value_eur.toFixed(2)} value</span>
            )}
          </div>
        </div>
      </div>

      {/* Main content */}
      <div style={s.body}>

        {/* Controls */}
        <div style={s.controls}>
          <input
            style={s.input}
            type="text"
            placeholder="Search cards…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />

          {/* Color toggles */}
          {allColors.map(col => (
            <button key={col} style={s.colorBtn(filterColors.includes(col))} onClick={() => toggleColor(col)} title={COLOR_META[col]?.label}>
              {COLOR_META[col]?.emoji || col}
            </button>
          ))}

          {/* Set filter */}
          {allSets.length > 1 && (
            <select style={s.setSelect} value={filterSet} onChange={e => setFilterSet(e.target.value)}>
              <option value="">All sets</option>
              {allSets.map(([code, name]) => (
                <option key={code} value={code}>{code} — {name}</option>
              ))}
            </select>
          )}

          {/* Sort */}
          <select style={s.select} value={sortBy} onChange={e => setSortBy(e.target.value)}>
            <option value="name">Name</option>
            <option value="qty">Quantity</option>
            <option value="price">Price</option>
            <option value="rarity">Rarity</option>
            <option value="type">Type</option>
          </select>
          <button
            style={{ ...s.select, cursor: 'pointer', minWidth: 36, textAlign: 'center' }}
            onClick={() => setSortDir(d => d === 'asc' ? 'desc' : 'asc')}
            title="Toggle sort direction"
          >
            {sortDir === 'asc' ? '↑' : '↓'}
          </button>
        </div>

        {/* Active filter summary */}
        {(filterColors.length > 0 || filterSet) && (
          <div style={{ marginBottom: 12, fontSize: '0.82rem', color: '#94a3b8', display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
            <span>Filters active:</span>
            {filterColors.map(c => <span key={c} style={{ background: 'rgba(99,102,241,0.2)', borderRadius: 4, padding: '2px 8px' }}>{COLOR_META[c]?.emoji} {COLOR_META[c]?.label}</span>)}
            {filterSet && <span style={{ background: 'rgba(99,102,241,0.2)', borderRadius: 4, padding: '2px 8px' }}>{filterSet}</span>}
            <button onClick={() => { setFilterColors([]); setFilterSet(''); }} style={{ background: 'none', border: 'none', color: '#f87171', cursor: 'pointer', fontSize: '0.82rem', padding: 0 }}>× Clear</button>
            <span style={{ marginLeft: 4 }}>{displayed.length} cards shown</span>
          </div>
        )}

        {/* Table */}
        <div style={{ overflowX: 'auto' }}>
          <table style={s.table}>
            <thead style={s.thead}>
              <tr>
                <th style={s.th}>Qty</th>
                <th style={s.th}>Name</th>
                <th style={{ ...s.th, display: 'none' }} className="pc-hide-mobile">Type</th>
                <th style={s.th}>Rarity</th>
                <th style={s.th}>Set</th>
                <th style={s.th}>Price</th>
              </tr>
            </thead>
            <tbody>
              {displayed.map((card, i) => (
                <tr key={card.id} style={{ ...s.tr, background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.015)' }}>
                  <td style={{ ...s.td, color: '#6366f1', fontWeight: 700, width: 40 }}>{card.quantity}</td>
                  <td style={{ ...s.td, color: RARITY_COLOR[card.rarity] || '#e2e8f0', fontWeight: 500 }}>
                    {card.name}
                    {card.mana_cost && <span style={{ marginLeft: 8, color: '#475569', fontSize: '0.78rem', fontFamily: 'monospace' }}>{card.mana_cost}</span>}
                  </td>
                  <td style={{ ...s.td, color: '#94a3b8', fontSize: '0.82rem' }}>{card.type}</td>
                  <td style={{ ...s.td, color: RARITY_COLOR[card.rarity] || '#64748b', fontSize: '0.78rem', textTransform: 'capitalize' }}>{card.rarity}</td>
                  <td style={{ ...s.td, color: '#64748b', fontSize: '0.78rem', fontWeight: 700 }}>
                    <span title={card.set_name || ''}>{(card.set_code || '—').toUpperCase()}</span>
                  </td>
                  <td style={{ ...s.td, fontWeight: 600, fontSize: '0.85rem' }}>
                    {card.price_eur != null
                      ? <span style={{ color: '#34d399' }}>€{Number(card.price_eur).toFixed(2)}</span>
                      : card.price_usd != null
                        ? <span style={{ color: '#60a5fa' }}>${Number(card.price_usd).toFixed(2)}</span>
                        : <span style={{ color: '#334155' }}>—</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {displayed.length === 0 && (
            <div style={s.empty}>No cards match the current filters.</div>
          )}
        </div>

        {/* Footer CTA */}
        <div style={s.footer}>
          <p style={{ color: '#64748b', marginBottom: 16, fontSize: '0.9rem' }}>
            Want to track your own MTG collection?
          </p>
          <Link to="/" style={s.ctaBtn}>
            Build your collection on MTG Decks Builder →
          </Link>
        </div>
      </div>
    </div>
  );
}
