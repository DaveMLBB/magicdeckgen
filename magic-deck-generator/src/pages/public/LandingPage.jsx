import { Link } from 'react-router-dom';
import SEOHead from '../../components/seo/SEOHead';
import HreflangTags from '../../components/seo/HreflangTags';
import StructuredData from '../../components/seo/StructuredData';
import PublicNav from '../../components/public/PublicNav';
import CTASection from '../../components/public/CTASection';
import './PublicPages.css';

const LandingPage = ({ lang = 'en' }) => {
  const content = {
    en: {
      metaTitle: 'MTG Deck Builder AI | Build Decks from Your Collection | Magic Deck Builder',
      metaDescription: 'The most powerful MTG deck builder. Match 7,200+ tournament decks, use AI to build custom decks, find card synergies, discover alternatives. Free to start.',
      h1: 'The Smartest MTG Deck Builder — Powered by AI',
      subtitle: 'Upload your Magic: The Gathering collection, discover competitive decks you can build right now, and let AI create custom decks, find synergies, and suggest card alternatives.',
      ctaPrimary: 'Start Building Free →',
      stat1: '7,200+', stat1Label: 'Tournament Decklists',
      stat2: '392,000+', stat2Label: 'Cards in Database',
      stat3: '8+', stat3Label: 'Competitive Formats',
      stat4: '4', stat4Label: 'AI-Powered Tools',
      howItWorks: 'How It Works',
      step1Title: '📁 Upload Your Collection',
      step1Desc: 'Import your cards via CSV or Excel in seconds. Compatible with Delver Lens, TCGPlayer, Moxfield and most collection apps.',
      step2Title: '🔍 Instant Deck Matching',
      step2Desc: 'Our engine matches your collection against 7,200+ tournament decklists and shows your completion % for each deck.',
      step3Title: '🤖 Build with AI',
      step3Desc: 'Describe the deck you want, analyze synergies, find card alternatives, and optimize existing decks — all with AI.',
      aiTitle: '4 AI-Powered Tools to Elevate Your Game',
      aiSubtitle: 'State-of-the-art AI features that no other MTG tool offers',
      aiTools: [
        { icon: '🏗️', title: 'AI Deck Builder', badge: '5 tokens', desc: 'Describe the deck you want in plain text — "red aggro Modern" or "Atraxa Commander with +1/+1 counters" — and AI builds a complete 60 or 100-card deck with sideboard, strategy notes, key cards, and upgrade path. Can also build using only cards from your collection.' },
        { icon: '✨', title: 'AI Synergy Finder', badge: '3 tokens', desc: 'Enter 1–5 seed cards and AI finds the most synergistic cards to build around them. Results are grouped by role: Enabler, Payoff, Removal, Ramp, Support. Perfect for brewing new archetypes from scratch.' },
        { icon: '🪞', title: 'AI Card Twins', badge: '3 tokens', desc: 'Find functional equivalents for any card. Discover budget replacements, upgrades, or cards that do the same thing with a different name. Each twin is rated: Functional Copy, Superior, Inferior, or Lateral.' },
        { icon: '⚡', title: 'AI Deck Boost', badge: '3 tokens', desc: 'Chat with AI to improve any saved deck. Ask for specific changes — "make it faster", "add more removal", "cut the weakest cards" — and AI applies targeted modifications while explaining every choice. Full session memory.' },
        { icon: '🤖', title: 'AI Deck Analyzer', badge: '10 tokens', desc: 'Select any saved deck and choose an optimization goal (Aggro, Control, Combo, Tribal, Token…). AI analyzes mana curve, identifies synergies and combos, and suggests specific cards to add or remove.' },
      ],
      toolsTitle: 'Everything Else You Need',
      tools: [
        { icon: '🔍', title: 'Collection Matcher', desc: 'See every tournament deck you can build right now, ranked by completion %. Know exactly which cards you\'re missing to complete any deck.' },
        { icon: '📚', title: 'Collection Manager', desc: 'Organize your physical cards into multiple collections. Link collections to saved decks to track what you own vs. what you need.' },
        { icon: '🃏', title: 'Card Database', desc: '392,000+ cards searchable by name, type, color, CMC, format, rarity, and card text. Full Italian and English support.' },
        { icon: '🗂️', title: 'Deck Manager', desc: 'Save, edit, import, and export decks. Share public decks with the community. Import from any text-based deck format.' },
      ],
      formatsTitle: 'All Major Competitive Formats',
      formatsSubtitle: 'Build tournament-ready decks for every format you play',
      faqTitle: 'Frequently Asked Questions',
      faqs: [
        { q: 'Is Magic Deck Builder free?', a: 'Yes! You can start for free. New users receive welcome tokens to try all AI features. Additional tokens are available in packages starting from €5.' },
        { q: 'What file formats are supported for collection import?', a: 'We support Excel (.xlsx) and CSV (.csv). Card names must be in English. Compatible with Delver Lens, TCGPlayer, Moxfield, and most collection management apps.' },
        { q: 'How does the AI Deck Builder work?', a: 'You describe the deck you want in plain text. The AI generates a complete deck list with sideboard, strategy explanation, key cards, and upgrade suggestions. You can also restrict it to only use cards from your collection.' },
        { q: 'Can I build decks using only cards I own?', a: 'Yes! Enable "Analyze full collection" in the AI Deck Builder to have the AI build a deck using only the cards in your collection.' },
        { q: 'What MTG formats are supported?', a: 'Standard, Pioneer, Modern, Legacy, Vintage, Commander/EDH, cEDH, Pauper, Premodern, Highlander, Historic, Explorer, Brawl and more.' },
        { q: 'How many tournament decklists are available?', a: 'Our database contains 7,200+ competitive tournament decklists across all formats, updated regularly.' },
      ],
      whyTitle: 'Why Magic Deck Builder?',
      reasons: [
        { icon: '⚡', text: 'Instant collection analysis — results in seconds' },
        { icon: '🤖', text: '4 AI tools powered by state-of-the-art language models' },
        { icon: '🏆', text: '7,200+ real tournament decklists to match against' },
        { icon: '🌍', text: 'Full Italian and English support' },
        { icon: '🔒', text: 'Your data is private and secure' },
        { icon: '🎁', text: 'Free to start — no credit card required' },
      ],
    },
    it: {
      metaTitle: 'Costruttore Mazzi MTG con AI | Costruisci dalla Tua Collezione | Magic Deck Builder',
      metaDescription: 'Il costruttore di mazzi MTG più potente. Confronta 7.200+ mazzi da torneo, usa l\'AI per creare mazzi personalizzati, trovare sinergie e alternative. Gratis.',
      h1: 'Il Costruttore di Mazzi MTG più Intelligente — Potenziato dall\'AI',
      subtitle: 'Carica la tua collezione Magic: The Gathering, scopri mazzi competitivi che puoi costruire adesso, e lascia che l\'AI crei mazzi personalizzati, trovi sinergie e suggerisca alternative.',
      ctaPrimary: 'Inizia Gratis →',
      stat1: '7.200+', stat1Label: 'Decklist da Torneo',
      stat2: '392.000+', stat2Label: 'Carte nel Database',
      stat3: '8+', stat3Label: 'Formati Competitivi',
      stat4: '4', stat4Label: 'Strumenti AI',
      howItWorks: 'Come Funziona',
      step1Title: '📁 Carica la Collezione',
      step1Desc: 'Importa le tue carte via CSV o Excel in pochi secondi. Compatibile con Delver Lens, TCGPlayer, Moxfield e la maggior parte delle app di gestione.',
      step2Title: '🔍 Confronto Istantaneo',
      step2Desc: 'Il nostro motore confronta la tua collezione con 7.200+ decklist da torneo e mostra la % di completamento per ogni mazzo.',
      step3Title: '🤖 Costruisci con l\'AI',
      step3Desc: 'Descrivi il mazzo che vuoi, analizza le sinergie, trova alternative alle carte e ottimizza i mazzi esistenti — tutto con l\'AI.',
      aiTitle: '4 Strumenti AI per Elevare il Tuo Gioco',
      aiSubtitle: 'Funzionalità AI all\'avanguardia che nessun altro strumento MTG offre',
      aiTools: [
        { icon: '🏗️', title: 'AI Deck Builder', badge: '5 token', desc: 'Descrivi il mazzo che vuoi in testo libero — "aggro rosso Modern" o "Commander Atraxa con counter +1/+1" — e l\'AI costruisce un mazzo completo da 60 o 100 carte con sideboard, note strategiche, carte chiave e percorso di upgrade. Può anche costruire usando solo le carte della tua collezione.' },
        { icon: '✨', title: 'AI Synergy Finder', badge: '3 token', desc: 'Inserisci 1–5 carte di partenza e l\'AI trova le carte più sinergiche per costruire attorno ad esse. Risultati raggruppati per ruolo: Enabler, Payoff, Removal, Ramp, Support. Perfetto per creare nuovi archetipi da zero.' },
        { icon: '🪞', title: 'AI Gemelli', badge: '3 token', desc: 'Trova equivalenti funzionali per qualsiasi carta. Scopri sostituti economici, upgrade, o carte che fanno la stessa cosa con un nome diverso. Ogni gemello classificato: Copia Funzionale, Superiore, Inferiore o Laterale.' },
        { icon: '⚡', title: 'AI Deck Boost', badge: '3 token', desc: 'Chatta con l\'AI per migliorare qualsiasi mazzo salvato. Chiedi modifiche specifiche — "rendilo più veloce", "aggiungi più removal", "taglia le carte più deboli" — e l\'AI applica modifiche mirate spiegando ogni scelta. Memoria completa della sessione.' },
        { icon: '🤖', title: 'AI Deck Analyzer', badge: '10 token', desc: 'Seleziona un mazzo salvato e scegli un obiettivo di ottimizzazione (Aggro, Control, Combo, Tribale, Token…). L\'AI analizza la curva di mana, identifica sinergie e combo, e suggerisce carte specifiche da aggiungere o rimuovere.' },
      ],
      toolsTitle: 'Tutto il Resto di cui Hai Bisogno',
      tools: [
        { icon: '🔍', title: 'Confronto Collezione', desc: 'Vedi ogni mazzo da torneo che puoi costruire adesso, classificato per % di completamento. Sai esattamente quali carte ti mancano per completare qualsiasi mazzo.' },
        { icon: '📚', title: 'Gestione Collezioni', desc: 'Organizza le tue carte fisiche in più collezioni. Collega le collezioni ai mazzi salvati per tracciare cosa possiedi rispetto a cosa ti serve.' },
        { icon: '🃏', title: 'Database Carte', desc: '392.000+ carte ricercabili per nome, tipo, colore, CMC, formato, rarità e testo. Supporto completo italiano e inglese.' },
        { icon: '🗂️', title: 'Gestione Mazzi', desc: 'Salva, modifica, importa ed esporta mazzi. Condividi mazzi pubblici con la community. Importa da qualsiasi formato testo.' },
      ],
      formatsTitle: 'Tutti i Principali Formati Competitivi',
      formatsSubtitle: 'Costruisci mazzi pronti per tornei in ogni formato che giochi',
      faqTitle: 'Domande Frequenti',
      faqs: [
        { q: 'Magic Deck Builder è gratuito?', a: 'Sì! Puoi iniziare gratuitamente. I nuovi utenti ricevono token di benvenuto per provare tutte le funzionalità AI. Token aggiuntivi disponibili in pacchetti a partire da €5.' },
        { q: 'Quali formati di file supporta per l\'importazione?', a: 'Supportiamo Excel (.xlsx) e CSV (.csv). I nomi delle carte devono essere in inglese. Compatibile con Delver Lens, TCGPlayer, Moxfield e la maggior parte delle app di gestione collezioni.' },
        { q: 'Come funziona l\'AI Deck Builder?', a: 'Descrivi il mazzo che vuoi in testo libero. L\'AI genera una lista completa con sideboard, spiegazione della strategia, carte chiave e suggerimenti di upgrade. Puoi anche limitarlo a usare solo le carte della tua collezione.' },
        { q: 'Posso costruire mazzi usando solo le carte che possiedo?', a: 'Sì! Attiva "Analizza collezione completa" nell\'AI Deck Builder per far costruire all\'AI un mazzo usando solo le carte nella tua collezione.' },
        { q: 'Quali formati MTG sono supportati?', a: 'Standard, Pioneer, Modern, Legacy, Vintage, Commander/EDH, cEDH, Pauper, Premodern, Highlander, Historic, Explorer, Brawl e altri.' },
        { q: 'Quante decklist da torneo sono disponibili?', a: 'Il nostro database contiene 7.200+ decklist competitive da torneo in tutti i formati, aggiornate regolarmente.' },
      ],
      whyTitle: 'Perché Magic Deck Builder?',
      reasons: [
        { icon: '⚡', text: 'Analisi collezione istantanea — risultati in secondi' },
        { icon: '🤖', text: '4 strumenti AI alimentati da modelli linguistici all\'avanguardia' },
        { icon: '🏆', text: '7.200+ decklist reali da torneo su cui confrontarsi' },
        { icon: '🌍', text: 'Supporto completo italiano e inglese' },
        { icon: '🔒', text: 'I tuoi dati sono privati e sicuri' },
        { icon: '🎁', text: 'Gratis per iniziare — nessuna carta di credito richiesta' },
      ],
    }
  };

  const t = content[lang];
  const canonicalPath = lang === 'en' ? '/en/mtg-deck-builder-from-collection' : '/it/costruttore-mazzi-mtg-da-collezione';

  const formats = [
    { name: 'cEDH', slug: lang === 'en' ? 'cedh-deck-builder-from-collection' : 'costruttore-mazzi-cedh-da-collezione' },
    { name: 'Premodern', slug: lang === 'en' ? 'premodern-deck-builder-from-collection' : 'costruttore-mazzi-premodern-da-collezione' },
    { name: 'Pauper', slug: lang === 'en' ? 'pauper-deck-builder-from-collection' : 'costruttore-mazzi-pauper-da-collezione' },
    { name: 'Vintage', slug: lang === 'en' ? 'vintage-deck-builder-from-collection' : 'costruttore-mazzi-vintage-da-collezione' },
    { name: 'Highlander', slug: lang === 'en' ? 'highlander-deck-builder-from-collection' : 'costruttore-mazzi-highlander-da-collezione' }
  ];

  const structuredData = {
    name: 'Magic Deck Builder',
    applicationCategory: 'GameApplication',
    operatingSystem: 'Web',
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'EUR' },
    aggregateRating: { '@type': 'AggregateRating', ratingValue: '4.8', ratingCount: '127' }
  };

  return (
    <div className="seo-public-page">
      <SEOHead title={t.metaTitle} description={t.metaDescription} canonical={canonicalPath} lang={lang} />
      <HreflangTags enUrl="/en/mtg-deck-builder-from-collection" itUrl="/it/costruttore-mazzi-mtg-da-collezione" />
      <StructuredData type="SoftwareApplication" data={structuredData} />
      <PublicNav lang={lang} currentPath={canonicalPath} />

      {/* ── HERO ── */}
      <section className="hero">
        <div className="seo-hero-content">
          <div className="lp-hero-badge">✨ {lang === 'en' ? 'AI-Powered MTG Tools' : 'Strumenti MTG con AI'}</div>
          <h1>{t.h1}</h1>
          <p className="seo-hero-subtitle">{t.subtitle}</p>
          <div className="lp-hero-actions">
            <Link to="/app" className="seo-hero-cta">{t.ctaPrimary}</Link>
          </div>
        </div>
      </section>

      {/* ── STATS BAR ── */}
      <div className="lp-stats-bar">
        <div className="lp-stat"><span className="lp-stat-num">{t.stat1}</span><span className="lp-stat-label">{t.stat1Label}</span></div>
        <div className="lp-stat"><span className="lp-stat-num">{t.stat2}</span><span className="lp-stat-label">{t.stat2Label}</span></div>
        <div className="lp-stat"><span className="lp-stat-num">{t.stat3}</span><span className="lp-stat-label">{t.stat3Label}</span></div>
        <div className="lp-stat"><span className="lp-stat-num">{t.stat4}</span><span className="lp-stat-label">{t.stat4Label}</span></div>
      </div>

      {/* ── HOW IT WORKS ── */}
      <section className="how-it-works">
        <div className="container seo-container">
          <h2>{t.howItWorks}</h2>
          <div className="steps">
            {[
              { n: '1', title: t.step1Title, desc: t.step1Desc },
              { n: '2', title: t.step2Title, desc: t.step2Desc },
              { n: '3', title: t.step3Title, desc: t.step3Desc },
            ].map(s => (
              <div key={s.n} className="step">
                <div className="step-number">{s.n}</div>
                <h3>{s.title}</h3>
                <p>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── AI TOOLS ── */}
      <section className="lp-ai-section">
        <div className="container">
          <div className="lp-section-label">🤖 AI</div>
          <h2>{t.aiTitle}</h2>
          <p className="section-subtitle">{t.aiSubtitle}</p>
          <div className="lp-ai-grid">
            {t.aiTools.map((tool, i) => (
              <div key={i} className="lp-ai-card">
                <div className="lp-ai-card-header">
                  <span className="lp-ai-icon">{tool.icon}</span>
                  <div>
                    <h3>{tool.title}</h3>
                    <span className="lp-ai-badge">{tool.badge}</span>
                  </div>
                </div>
                <p>{tool.desc}</p>
              </div>
            ))}
          </div>
          <div className="lp-ai-cta">
            <Link to="/app" className="seo-hero-cta lp-cta-sm">{t.ctaPrimary}</Link>
          </div>
        </div>
      </section>

      {/* ── OTHER TOOLS ── */}
      <section className="features-section">
        <div className="container">
          <h2>{t.toolsTitle}</h2>
          <div className="features-grid lp-tools-grid">
            {t.tools.map((tool, i) => (
              <div key={i} className="feature-card lp-tool-card">
                <div className="lp-tool-icon">{tool.icon}</div>
                <h3>{tool.title}</h3>
                <p>{tool.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FORMATS ── */}
      <section className="formats-section">
        <div className="container">
          <h2>{t.formatsTitle}</h2>
          <p className="section-subtitle">{t.formatsSubtitle}</p>
          <div className="formats-grid">
            {formats.map((format) => (
              <Link key={format.name} to={`/${lang}/${format.slug}`} className="format-card">
                <h3>{format.name}</h3>
                <p>{lang === 'en' ? 'Build decks →' : 'Costruisci mazzi →'}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── WHY ── */}
      <section className="why-choose">
        <div className="container">
          <h2>{t.whyTitle}</h2>
          <div className="lp-reasons-grid">
            {t.reasons.map((r, i) => (
              <div key={i} className="lp-reason">
                <span className="lp-reason-icon">{r.icon}</span>
                <span>{r.text}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="lp-faq-section">
        <div className="container">
          <h2>{t.faqTitle}</h2>
          <div className="lp-faq-list">
            {t.faqs.map((faq, i) => (
              <details key={i} className="lp-faq-item">
                <summary className="lp-faq-q">{faq.q}</summary>
                <p className="lp-faq-a">{faq.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <CTASection lang={lang} />

      <footer className="public-footer">
        <div className="container">
          <p>© 2026 Magic Deck Builder. All rights reserved.</p>
          <div className="footer-links">
            <Link to="/privacy-policy">{lang === 'en' ? 'Privacy Policy' : 'Privacy Policy'}</Link>
            <Link to="/terms-of-service">{lang === 'en' ? 'Terms of Service' : 'Termini di Servizio'}</Link>
            <Link to="/app" className="footer-link-guide">{lang === 'en' ? '📖 User Guide' : '📖 Guida'}</Link>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
