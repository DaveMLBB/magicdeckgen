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
      h1: 'Build Tournament-Winning MTG Decks from Your Collection',
      subtitle: 'Upload your Magic: The Gathering collection and instantly discover competitive decks you can build. Match against 7,200+ tournament decklists across all formats.',
      metaTitle: 'MTG Deck Builder from Collection | Match Your Cards to Tournament Decks',
      metaDescription: 'Upload your MTG collection and instantly discover tournament decks you can build. Supports cEDH, Premodern, Pauper, Vintage & more. Try free.',
      howItWorks: 'How It Works',
      step1Title: 'Upload Your Collection',
      step1Desc: 'Import your cards via CSV or Excel file in seconds',
      step2Title: 'Instant Analysis',
      step2Desc: 'Our engine matches your collection against tournament decklists',
      step3Title: 'Build & Win',
      step3Desc: 'See exactly which decks you can build and what cards you need',
      formatsTitle: 'Supported Competitive Formats',
      formatsSubtitle: 'Build tournament-ready decks for every major format',
      featuresTitle: 'Powerful Deck Building Tools',
      feature1Title: 'What Decks Can I Build?',
      feature1Desc: 'Instantly see all tournament decks you can build from your collection',
      feature2Title: 'Deck Completion Checker',
      feature2Desc: 'Find exactly which cards you need to complete any deck',
      feature3Title: 'Collection Matcher',
      feature3Desc: 'Match your cards against thousands of competitive decklists',
      feature4Title: 'Multi-Format Support',
      feature4Desc: 'cEDH, Premodern, Pauper, Vintage, Highlander and more',
      whyChooseTitle: 'Why Choose Magic Deck Builder?',
      reason1: 'Largest tournament decklist database (7,200+ decks)',
      reason2: 'Instant collection analysis and matching',
      reason3: 'Support for all competitive MTG formats',
      reason4: 'See completion percentage for every deck',
      reason5: 'Identify missing cards instantly',
      reason6: 'Free to start, no credit card required'
    },
    it: {
      h1: 'Costruisci Mazzi MTG Vincenti dalla Tua Collezione',
      subtitle: 'Carica la tua collezione Magic: The Gathering e scopri istantaneamente mazzi competitivi che puoi costruire. Confronta con 7.200+ decklist da torneo in tutti i formati.',
      metaTitle: 'Costruttore Mazzi MTG da Collezione | Abbina le Tue Carte',
      metaDescription: 'Carica la tua collezione MTG e scopri mazzi da torneo che puoi costruire. Supporta cEDH, Premodern, Pauper, Vintage. Prova gratis.',
      howItWorks: 'Come Funziona',
      step1Title: 'Carica la Collezione',
      step1Desc: 'Importa le tue carte via CSV o Excel in pochi secondi',
      step2Title: 'Analisi Istantanea',
      step2Desc: 'Il nostro motore confronta la collezione con decklist da torneo',
      step3Title: 'Costruisci e Vinci',
      step3Desc: 'Vedi esattamente quali mazzi puoi costruire e quali carte ti servono',
      formatsTitle: 'Formati Competitivi Supportati',
      formatsSubtitle: 'Costruisci mazzi pronti per tornei in ogni formato principale',
      featuresTitle: 'Strumenti Potenti per Costruire Mazzi',
      feature1Title: 'Quali Mazzi Posso Costruire?',
      feature1Desc: 'Vedi istantaneamente tutti i mazzi da torneo che puoi costruire',
      feature2Title: 'Verifica Completamento Mazzo',
      feature2Desc: 'Trova esattamente quali carte ti servono per completare un mazzo',
      feature3Title: 'Confronta Collezione',
      feature3Desc: 'Abbina le tue carte a migliaia di decklist competitive',
      feature4Title: 'Supporto Multi-Formato',
      feature4Desc: 'cEDH, Premodern, Pauper, Vintage, Highlander e altro',
      whyChooseTitle: 'Perché Scegliere Magic Deck Builder?',
      reason1: 'Database più grande di decklist da torneo (7.200+ mazzi)',
      reason2: 'Analisi e confronto istantaneo della collezione',
      reason3: 'Supporto per tutti i formati MTG competitivi',
      reason4: 'Vedi percentuale completamento per ogni mazzo',
      reason5: 'Identifica carte mancanti istantaneamente',
      reason6: 'Gratis per iniziare, nessuna carta di credito richiesta'
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
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'EUR'
    },
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: '4.8',
      ratingCount: '127'
    }
  };

  return (
    <div className="seo-public-page">
      <SEOHead
        title={t.metaTitle}
        description={t.metaDescription}
        canonical={canonicalPath}
        lang={lang}
      />
      <HreflangTags
        enUrl="/en/mtg-deck-builder-from-collection"
        itUrl="/it/costruttore-mazzi-mtg-da-collezione"
      />
      <StructuredData type="SoftwareApplication" data={structuredData} />

      <PublicNav lang={lang} currentPath={canonicalPath} />

      <section className="hero">
        <div className="seo-hero-content">
          <h1>{t.h1}</h1>
          <p className="seo-hero-subtitle">{t.subtitle}</p>
          <Link to="/app" className="seo-hero-cta">
            {lang === 'en' ? 'Start Building Free' : 'Inizia Gratis'}
          </Link>
        </div>
      </section>

      <section className="how-it-works">
        <div className="container seo-container">
          <h2>{t.howItWorks}</h2>
          <div className="steps">
            <div className="step">
              <div className="step-number">1</div>
              <h3>{t.step1Title}</h3>
              <p>{t.step1Desc}</p>
            </div>
            <div className="step">
              <div className="step-number">2</div>
              <h3>{t.step2Title}</h3>
              <p>{t.step2Desc}</p>
            </div>
            <div className="step">
              <div className="step-number">3</div>
              <h3>{t.step3Title}</h3>
              <p>{t.step3Desc}</p>
            </div>
          </div>
        </div>
      </section>

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

      <section className="features-section">
        <div className="container">
          <h2>{t.featuresTitle}</h2>
          <div className="features-grid">
            <div className="feature-card">
              <h3>{t.feature1Title}</h3>
              <p>{t.feature1Desc}</p>
              <Link to={`/${lang}/${lang === 'en' ? 'what-mtg-decks-can-i-build' : 'quali-mazzi-mtg-posso-costruire'}`}>
                {lang === 'en' ? 'Learn more →' : 'Scopri di più →'}
              </Link>
            </div>
            <div className="feature-card">
              <h3>{t.feature2Title}</h3>
              <p>{t.feature2Desc}</p>
              <Link to={`/${lang}/${lang === 'en' ? 'mtg-deck-completion-checker' : 'verifica-completamento-mazzo-mtg'}`}>
                {lang === 'en' ? 'Learn more →' : 'Scopri di più →'}
              </Link>
            </div>
            <div className="feature-card">
              <h3>{t.feature3Title}</h3>
              <p>{t.feature3Desc}</p>
              <Link to={`/${lang}/${lang === 'en' ? 'match-mtg-collection-to-decklist' : 'abbina-collezione-mtg-a-decklist'}`}>
                {lang === 'en' ? 'Learn more →' : 'Scopri di più →'}
              </Link>
            </div>
            <div className="feature-card">
              <h3>{t.feature4Title}</h3>
              <p>{t.feature4Desc}</p>
            </div>
          </div>
        </div>
      </section>

      <section className="why-choose">
        <div className="container">
          <h2>{t.whyChooseTitle}</h2>
          <ul className="benefits-list">
            <li>✓ {t.reason1}</li>
            <li>✓ {t.reason2}</li>
            <li>✓ {t.reason3}</li>
            <li>✓ {t.reason4}</li>
            <li>✓ {t.reason5}</li>
            <li>✓ {t.reason6}</li>
          </ul>
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
