import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import PublicNav from '../../components/public/PublicNav';
import './PublicPages.css';
import './PublicCollectionPage.css';

const API_URL = import.meta.env.PROD
  ? 'https://api.mtgdecksbuilder.com'
  : 'http://localhost:8000';

const RARITY_ORDER = { mythic: 0, rare: 1, uncommon: 2, common: 3 };

export default function PublicCollectionPage() {
  const { token } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('name');

  useEffect(() => {
    if (!token) return;
    setLoading(true);
    fetch(`${API_URL}/api/collections/public/${token}`)
      .then(res => {
        if (!res.ok) { setNotFound(true); return null; }
        return res.json();
      })
      .then(d => { if (d) setData(d); })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [token]);

  const filtered = data?.cards?.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase())
  ) ?? [];

  const sorted = [...filtered].sort((a, b) => {
    if (sortBy === 'name') return a.name.localeCompare(b.name);
    if (sortBy === 'price') return (b.price_eur ?? b.price_usd ?? 0) - (a.price_eur ?? a.price_usd ?? 0);
    if (sortBy === 'rarity') return (RARITY_ORDER[a.rarity] ?? 9) - (RARITY_ORDER[b.rarity] ?? 9);
    if (sortBy === 'type') return a.type.localeCompare(b.type);
    return 0;
  });

  if (loading) return (
    <div className="public-collection-page">
      <PublicNav />
      <div className="public-collection-loading">Loading collection…</div>
    </div>
  );

  if (notFound || !data) return (
    <div className="public-collection-page">
      <PublicNav />
      <div className="public-collection-notfound">
        <h2>Collection not found</h2>
        <p>This collection is private or the link is invalid.</p>
        <Link to="/" className="public-collection-back-link">← Back to home</Link>
      </div>
    </div>
  );

  const { collection, cards } = data;

  return (
    <div className="public-collection-page">
      <PublicNav />

      <div className="public-collection-hero">
        <div className="public-collection-hero-inner">
          <div className="public-collection-meta">
            <span className="public-collection-owner">📚 {collection.owner}'s collection</span>
          </div>
          <h1 className="public-collection-title">{collection.name}</h1>
          {collection.description && (
            <p className="public-collection-desc">{collection.description}</p>
          )}
          <div className="public-collection-stats">
            <span className="pc-stat"><strong>{collection.total_unique}</strong> unique cards</span>
            <span className="pc-stat-sep">·</span>
            <span className="pc-stat"><strong>{collection.total_cards}</strong> total</span>
            {collection.total_value_eur > 0 && (
              <>
                <span className="pc-stat-sep">·</span>
                <span className="pc-stat pc-stat-value"><strong>€{collection.total_value_eur.toFixed(2)}</strong> value</span>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="public-collection-controls">
        <input
          className="public-collection-search"
          type="text"
          placeholder="Search cards…"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <select
          className="public-collection-sort"
          value={sortBy}
          onChange={e => setSortBy(e.target.value)}
        >
          <option value="name">Sort: Name</option>
          <option value="price">Sort: Price</option>
          <option value="rarity">Sort: Rarity</option>
          <option value="type">Sort: Type</option>
        </select>
      </div>

      <div className="public-collection-table-wrap">
        <table className="public-collection-table">
          <thead>
            <tr>
              <th>Qty</th>
              <th>Name</th>
              <th>Type</th>
              <th>Rarity</th>
              <th>Set</th>
              <th>Price</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map(card => (
              <tr key={card.id} className={`pc-row pc-rarity-${card.rarity}`}>
                <td className="pc-qty">{card.quantity}</td>
                <td className="pc-name">{card.name}</td>
                <td className="pc-type">{card.type}</td>
                <td className="pc-rarity">{card.rarity}</td>
                <td className="pc-set">{(card.set_code || '—').toUpperCase()}</td>
                <td className="pc-price">
                  {card.price_eur != null
                    ? <span className="pc-price-tag">€{Number(card.price_eur).toFixed(2)}</span>
                    : card.price_usd != null
                      ? <span className="pc-price-tag pc-price-usd">${Number(card.price_usd).toFixed(2)}</span>
                      : <span className="pc-price-none">—</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {sorted.length === 0 && (
          <div className="public-collection-empty">No cards found.</div>
        )}
      </div>

      <div className="public-collection-footer">
        <Link to="/" className="public-collection-cta">
          Build your own collection on MTG Decks Builder →
        </Link>
      </div>
    </div>
  );
}
