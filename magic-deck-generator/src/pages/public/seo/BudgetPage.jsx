import { Link } from 'react-router-dom';
import SEOHead from '../../../components/seo/SEOHead';
import HreflangTags from '../../../components/seo/HreflangTags';
import StructuredData from '../../../components/seo/StructuredData';
import PublicNav from '../../../components/public/PublicNav';
import CTASection from '../../../components/public/CTASection';
import Breadcrumbs from '../../../components/seo/Breadcrumbs';
import '../PublicPages.css';

const BUDGET_TIERS = {
  under25: {
    maxBudget: 25,
    icon: '💰',
    en: {
      h1: 'Budget MTG Deck Builder: Build Competitive Decks Under $25',
      subtitle: 'Find competitive MTG decks you can build for under $25 from your collection. Discover which budget-friendly tournament lists match your cards.',
      metaTitle: 'Budget MTG Deck Builder Under $25 | Competitive Decks from Collection',
      metaDescription: 'Build competitive MTG decks for under $25 from your collection. Find budget tournament lists in Pauper, Standard, and Commander. Start winning without breaking the bank.',
      whatIs: 'Can You Play Competitive MTG on a Budget?',
      whatIsDesc: 'Absolutely. Formats like Pauper, Budget Commander, and even Standard offer competitive decks under $25. The key is knowing which cards you already own and which cheap replacements exist for expensive staples.',
      tiers: [
        { label: 'Pauper', desc: 'The most competitive budget format — commons only, deep metagame', price: '$5-15' },
        { label: 'Budget Commander', desc: 'Powerful EDH decks built around cheap commanders', price: '$15-25' },
        { label: 'Standard Budget', desc: 'Rotate-friendly decks using affordable Standard cards', price: '$20-25' },
        { label: 'Precon Upgrades', desc: 'Improve preconstructed decks with cheap additions', price: '$10-20' },
      ],
      tip1: 'Focus on Pauper — the most competitive format for under $15',
      tip2: 'Use your collection to fill in expensive slots with budget alternatives',
      tip3: 'Trade duplicates to acquire key missing pieces',
      tip4: 'Check our deck matcher to see which lists you\'re closest to completing',
      urlSlug: 'budget-mtg-deck-builder-under-25',
      urlSlugIt: 'costruttore-mazzi-mtg-budget-sotto-25',
    },
    it: {
      h1: 'Costruttore Mazzi MTG Budget: Mazzi Competitivi Sotto €25',
      subtitle: 'Trova mazzi MTG competitivi che puoi costruire per meno di €25 dalla tua collezione. Scopri quali liste da torneo economiche corrispondono alle tue carte.',
      metaTitle: 'Costruttore Mazzi MTG Budget Sotto €25 | Mazzi Competitivi dalla Collezione',
      metaDescription: 'Costruisci mazzi MTG competitivi per meno di €25 dalla tua collezione. Trova liste da torneo budget in Pauper, Standard e Commander. Inizia a vincere senza spendere troppo.',
      whatIs: 'Si Può Giocare MTG Competitivo con un Budget?',
      whatIsDesc: 'Assolutamente sì. Formati come Pauper, Budget Commander e persino Standard offrono mazzi competitivi sotto €25. La chiave è sapere quali carte possiedi già e quali sostituti economici esistono per gli staple costosi.',
      tiers: [
        { label: 'Pauper', desc: 'Il formato budget più competitivo — solo comuni, metagame profondo', price: '€5-15' },
        { label: 'Budget Commander', desc: 'Mazzi EDH potenti costruiti attorno a comandanti economici', price: '€15-25' },
        { label: 'Standard Budget', desc: 'Mazzi Standard con carte accessibili', price: '€20-25' },
        { label: 'Upgrade Precon', desc: 'Migliora i mazzi precostruiti con aggiunte economiche', price: '€10-20' },
      ],
      tip1: 'Concentrati sul Pauper — il formato più competitivo per meno di €15',
      tip2: 'Usa la tua collezione per riempire gli slot costosi con alternative budget',
      tip3: 'Scambia i duplicati per acquisire i pezzi mancanti chiave',
      tip4: 'Controlla il nostro matcher di mazzi per vedere a quali liste sei più vicino',
      urlSlug: 'budget-mtg-deck-builder-under-25',
      urlSlugIt: 'costruttore-mazzi-mtg-budget-sotto-25',
    }
  },
  under100: {
    maxBudget: 100,
    icon: '💎',
    en: {
      h1: 'MTG Deck Builder Under $100: Semi-Budget Competitive Decks',
      subtitle: 'Find powerful MTG decks you can build for under $100 from your collection. Discover semi-budget tournament lists that punch above their price tag.',
      metaTitle: 'MTG Deck Builder Under $100 | Semi-Budget Competitive Decks from Collection',
      metaDescription: 'Build competitive MTG decks for under $100 from your collection. Find semi-budget tournament lists in Modern, Pioneer, and Commander. Powerful decks without the full price tag.',
      whatIs: 'What Can You Build for Under $100 in MTG?',
      whatIsDesc: 'A $100 budget opens up a huge range of competitive options. Modern has several tier-2 decks in this range, Pioneer has multiple tier-1 options, and Commander has hundreds of powerful builds. The key is maximizing value from your existing collection.',
      tiers: [
        { label: 'Modern Budget', desc: 'Tier-2 Modern decks that can compete at FNM and local events', price: '$50-100' },
        { label: 'Pioneer', desc: 'Multiple tier-1 Pioneer decks fall under $100', price: '$40-80' },
        { label: 'Commander', desc: 'Powerful 75% Commander decks with strong synergies', price: '$60-100' },
        { label: 'Legacy Budget', desc: 'Burn and Pauper Legacy lists for competitive play', price: '$30-80' },
      ],
      tip1: 'Pioneer offers the best competitive value at this budget',
      tip2: 'Use your collection to reduce costs — even 10 owned cards saves $20-30',
      tip3: 'Focus on formats where your existing cards are legal',
      tip4: 'Proxy expensive lands for casual play while saving up',
      urlSlug: 'budget-mtg-deck-builder-under-100',
      urlSlugIt: 'costruttore-mazzi-mtg-budget-sotto-100',
    },
    it: {
      h1: 'Costruttore Mazzi MTG Sotto €100: Mazzi Semi-Budget Competitivi',
      subtitle: 'Trova mazzi MTG potenti che puoi costruire per meno di €100 dalla tua collezione. Scopri liste da torneo semi-budget che superano il loro prezzo.',
      metaTitle: 'Costruttore Mazzi MTG Sotto €100 | Mazzi Semi-Budget Competitivi dalla Collezione',
      metaDescription: 'Costruisci mazzi MTG competitivi per meno di €100 dalla tua collezione. Trova liste da torneo semi-budget in Modern, Pioneer e Commander.',
      whatIs: 'Cosa Puoi Costruire per Meno di €100 in MTG?',
      whatIsDesc: 'Un budget di €100 apre un\'enorme gamma di opzioni competitive. Modern ha diversi mazzi di livello 2 in questo range, Pioneer ha più opzioni di livello 1, e Commander ha centinaia di build potenti.',
      tiers: [
        { label: 'Modern Budget', desc: 'Mazzi Modern di livello 2 che possono competere al FNM', price: '€50-100' },
        { label: 'Pioneer', desc: 'Diversi mazzi Pioneer di livello 1 sotto €100', price: '€40-80' },
        { label: 'Commander', desc: 'Mazzi Commander potenti al 75% con forti sinergie', price: '€60-100' },
        { label: 'Legacy Budget', desc: 'Liste Burn e Pauper Legacy per il gioco competitivo', price: '€30-80' },
      ],
      tip1: 'Pioneer offre il miglior valore competitivo a questo budget',
      tip2: 'Usa la tua collezione per ridurre i costi — anche 10 carte possedute risparmiano €20-30',
      tip3: 'Concentrati sui formati dove le tue carte esistenti sono legali',
      tip4: 'Usa proxy per le terre costose nel gioco casual mentre risparmi',
      urlSlug: 'budget-mtg-deck-builder-under-100',
      urlSlugIt: 'costruttore-mazzi-mtg-budget-sotto-100',
    }
  }
};

const BudgetPage = ({ tier, lang = 'en' }) => {
  const data = BUDGET_TIERS[tier];
  if (!data) return null;
  const t = data[lang];

  const canonicalPath = lang === 'en' ? `/en/${t.urlSlug}` : `/it/${t.urlSlugIt}`;

  const breadcrumbItems = [
    { label: lang === 'en' ? 'Budget Decks' : 'Mazzi Budget', url: null },
    { label: `Under $${data.maxBudget}`, url: null }
  ];

  const structuredData = {
    name: t.metaTitle,
    description: t.metaDescription,
  };

  const otherTier = tier === 'under25' ? 'under100' : 'under25';

  return (
    <div className="seo-public-page">
      <SEOHead
        title={t.metaTitle}
        description={t.metaDescription}
        canonical={canonicalPath}
        lang={lang}
        keywords={`budget MTG deck, cheap MTG deck, affordable MTG, budget commander, budget modern`}
      />
      <HreflangTags
        enUrl={`/en/${t.urlSlug}`}
        itUrl={`/it/${t.urlSlugIt}`}
      />
      <StructuredData type="WebPage" data={structuredData} />

      <PublicNav lang={lang} currentPath={canonicalPath} />

      <section className="format-hero" style={{ background: 'linear-gradient(135deg, #2d3748 0%, #4a5568 100%)' }}>
        <div className="container">
          <Breadcrumbs items={breadcrumbItems} lang={lang} />
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>{data.icon}</div>
          <h1>{t.h1}</h1>
          <p className="format-subtitle">{t.subtitle}</p>
          <Link to="/app" className="format-cta" style={{ marginTop: '2rem', display: 'inline-block', background: '#48bb78', color: '#fff' }}>
            {lang === 'en' ? 'Find Budget Decks →' : 'Trova Mazzi Budget →'}
          </Link>
        </div>
      </section>

      <section className="format-about">
        <div className="container">
          <h2>{t.whatIs}</h2>
          <p className="format-description">{t.whatIsDesc}</p>
        </div>
      </section>

      <section className="format-benefits" style={{ background: 'rgba(26,26,46,0.5)' }}>
        <div className="container">
          <h2>{lang === 'en' ? 'Best Budget Options' : 'Migliori Opzioni Budget'}</h2>
          <div className="benefits-grid">
            {t.tiers.map((tier, i) => (
              <div className="benefit-card" key={i}>
                <span className="benefit-icon" style={{ fontSize: '1.2rem', color: '#48bb78', fontWeight: 'bold' }}>{tier.price}</span>
                <strong style={{ color: '#fff', display: 'block', margin: '0.5rem 0' }}>{tier.label}</strong>
                <p>{tier.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="format-how-it-works">
        <div className="container">
          <h2>{lang === 'en' ? 'Budget Building Tips' : 'Consigli per la Costruzione Budget'}</h2>
          <div className="steps-grid">
            {[t.tip1, t.tip2, t.tip3, t.tip4].map((tip, i) => (
              <div className="step-card" key={i}>
                <div className="step-number" style={{ background: 'linear-gradient(135deg, #48bb78, #38a169)' }}>{i + 1}</div>
                <p>{tip}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="related-formats">
        <div className="container">
          <h2>{lang === 'en' ? 'Other Budget Ranges' : 'Altri Range di Budget'}</h2>
          <div className="formats-links">
            <Link
              to={lang === 'en'
                ? `/en/${BUDGET_TIERS[otherTier].en.urlSlug}`
                : `/it/${BUDGET_TIERS[otherTier].it.urlSlugIt}`}
            >
              {BUDGET_TIERS[otherTier].icon} Under ${BUDGET_TIERS[otherTier].maxBudget} →
            </Link>
          </div>
        </div>
      </section>

      <CTASection lang={lang} variant="secondary" />

      <footer className="public-footer">
        <div className="container">
          <p>© 2026 MTG Decks Builder. All rights reserved.</p>
          <div className="footer-links">
            <Link to="/app" className="footer-link-guide">{lang === 'en' ? '📖 User Guide' : '📖 Guida'}</Link>
          </div>
        </div>
      </footer>
    </div>
  );
};

export { BUDGET_TIERS };
export default BudgetPage;
