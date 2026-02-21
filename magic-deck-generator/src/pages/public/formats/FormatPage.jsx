import { Link } from 'react-router-dom';
import SEOHead from '../../../components/seo/SEOHead';
import HreflangTags from '../../../components/seo/HreflangTags';
import StructuredData from '../../../components/seo/StructuredData';
import PublicNav from '../../../components/public/PublicNav';
import CTASection from '../../../components/public/CTASection';
import Breadcrumbs from '../../../components/seo/Breadcrumbs';
import '../PublicPages.css';

const FormatPage = ({ format, lang = 'en' }) => {
  const formatContent = {
    cedh: {
      en: {
        h1: 'cEDH Deck Builder: Match Your Collection to Competitive EDH Decklists',
        subtitle: 'Build competitive Commander decks from your collection. Match against top cEDH tournament lists and discover which powerful decks you can build right now.',
        metaTitle: 'cEDH Deck Builder from Collection | Build Competitive EDH Decks',
        metaDescription: 'Build competitive EDH decks from your collection. Match your cards against top cEDH tournament lists. Upload CSV/Excel and start building now.',
        formatName: 'cEDH',
        formatFullName: 'Competitive Commander (cEDH)',
        whatIs: 'What is cEDH?',
        whatIsDesc: 'Competitive EDH (cEDH) is the highest power level of Commander format, where players use optimized 100-card singleton decks to win as quickly and efficiently as possible.',
        whyBuild: 'Why Build cEDH Decks from Your Collection?',
        benefit1: 'Discover which competitive commanders you can already build',
        benefit2: 'See exactly which expensive cards you\'re missing',
        benefit3: 'Find budget-friendly cEDH alternatives',
        benefit4: 'Match against the latest tournament-winning lists',
        howItWorks: 'How It Works',
        step1: 'Upload your collection (CSV/Excel)',
        step2: 'Filter by cEDH format',
        step3: 'See all buildable competitive decks',
        step4: 'Check completion percentage and missing cards',
        popularDecks: 'Popular cEDH Archetypes',
        urlSlug: 'cedh-deck-builder-from-collection',
        urlSlugIt: 'costruttore-mazzi-cedh-da-collezione'
      },
      it: {
        h1: 'Costruttore Mazzi cEDH: Abbina la Collezione a Decklist Competitive',
        subtitle: 'Costruisci mazzi Commander competitivi dalla tua collezione. Confronta con le migliori liste cEDH da torneo e scopri quali mazzi potenti puoi costruire subito.',
        metaTitle: 'Costruttore Mazzi cEDH da Collezione | Deck Competitive EDH',
        metaDescription: 'Costruisci mazzi cEDH dalla tua collezione. Abbina le carte alle migliori liste competitive. Carica CSV/Excel e inizia subito.',
        formatName: 'cEDH',
        formatFullName: 'Commander Competitivo (cEDH)',
        whatIs: 'Cos\'è il cEDH?',
        whatIsDesc: 'Il cEDH (Competitive EDH) è il livello di potenza più alto del formato Commander, dove i giocatori usano mazzi singleton da 100 carte ottimizzati per vincere nel modo più rapido ed efficiente possibile.',
        whyBuild: 'Perché Costruire Mazzi cEDH dalla Collezione?',
        benefit1: 'Scopri quali comandanti competitivi puoi già costruire',
        benefit2: 'Vedi esattamente quali carte costose ti mancano',
        benefit3: 'Trova alternative cEDH economiche',
        benefit4: 'Confronta con le ultime liste vincenti da torneo',
        howItWorks: 'Come Funziona',
        step1: 'Carica la tua collezione (CSV/Excel)',
        step2: 'Filtra per formato cEDH',
        step3: 'Vedi tutti i mazzi competitivi costruibili',
        step4: 'Controlla percentuale completamento e carte mancanti',
        popularDecks: 'Archetipi cEDH Popolari',
        urlSlug: 'cedh-deck-builder-from-collection',
        urlSlugIt: 'costruttore-mazzi-cedh-da-collezione'
      }
    },
    premodern: {
      en: {
        h1: 'Premodern Deck Builder: Build Decks from Your Collection',
        subtitle: 'Build Premodern decks from your old-school collection. Match against tournament-winning Premodern lists and rediscover your vintage cards.',
        metaTitle: 'Premodern Deck Builder | Match Your Collection to Tournament Lists',
        metaDescription: 'Discover Premodern decks you can build from your collection. Match against tournament-winning lists. Upload your cards and find your next deck.',
        formatName: 'Premodern',
        formatFullName: 'Premodern',
        whatIs: 'What is Premodern?',
        whatIsDesc: 'Premodern is a non-rotating format featuring cards from 4th Edition through Scourge (1995-2003), capturing the nostalgia of early Magic without the Reserved List price barrier.',
        whyBuild: 'Why Build Premodern Decks from Your Collection?',
        benefit1: 'Rediscover value in your old card collection',
        benefit2: 'Build competitive decks without breaking the bank',
        benefit3: 'Access a growing tournament scene',
        benefit4: 'Play with iconic cards from Magic\'s golden age',
        howItWorks: 'How It Works',
        step1: 'Upload your collection (CSV/Excel)',
        step2: 'Filter by Premodern format',
        step3: 'See all buildable tournament decks',
        step4: 'Check completion percentage and missing cards',
        popularDecks: 'Popular Premodern Archetypes',
        urlSlug: 'premodern-deck-builder-from-collection',
        urlSlugIt: 'costruttore-mazzi-premodern-da-collezione'
      },
      it: {
        h1: 'Costruttore Mazzi Premodern: Costruisci dalla Tua Collezione',
        subtitle: 'Costruisci mazzi Premodern dalla tua collezione old-school. Confronta con liste vincenti da torneo e riscopri le tue carte vintage.',
        metaTitle: 'Costruttore Mazzi Premodern | Abbina Collezione a Liste Torneo',
        metaDescription: 'Scopri mazzi Premodern dalla tua collezione. Confronta con liste vincenti. Carica le tue carte e trova il tuo prossimo mazzo.',
        formatName: 'Premodern',
        formatFullName: 'Premodern',
        whatIs: 'Cos\'è il Premodern?',
        whatIsDesc: 'Premodern è un formato non rotante con carte dalla 4a Edizione fino a Flagello (1995-2003), che cattura la nostalgia dei primi anni di Magic senza la barriera di prezzo della Reserved List.',
        whyBuild: 'Perché Costruire Mazzi Premodern dalla Collezione?',
        benefit1: 'Riscopri il valore nella tua vecchia collezione',
        benefit2: 'Costruisci mazzi competitivi senza spendere troppo',
        benefit3: 'Accedi a una scena torneistica in crescita',
        benefit4: 'Gioca con carte iconiche dell\'età d\'oro di Magic',
        howItWorks: 'Come Funziona',
        step1: 'Carica la tua collezione (CSV/Excel)',
        step2: 'Filtra per formato Premodern',
        step3: 'Vedi tutti i mazzi da torneo costruibili',
        step4: 'Controlla percentuale completamento e carte mancanti',
        popularDecks: 'Archetipi Premodern Popolari',
        urlSlug: 'premodern-deck-builder-from-collection',
        urlSlugIt: 'costruttore-mazzi-premodern-da-collezione'
      }
    },
    pauper: {
      en: {
        h1: 'Pauper Deck Builder: Find Tournament Decks from Your Commons',
        subtitle: 'Build competitive Pauper decks from your commons collection. Match against tournament lists and discover powerful budget decks.',
        metaTitle: 'Pauper Deck Builder from Collection | Build Competitive Pauper Decks',
        metaDescription: 'Build competitive Pauper decks from your commons collection. Match against tournament lists. Upload your cards and discover winning decks today.',
        formatName: 'Pauper',
        formatFullName: 'Pauper',
        whatIs: 'What is Pauper?',
        whatIsDesc: 'Pauper is a competitive format where only common-rarity cards are legal, offering deep strategic gameplay at an incredibly affordable price point.',
        whyBuild: 'Why Build Pauper Decks from Your Collection?',
        benefit1: 'Turn your commons into competitive decks',
        benefit2: 'Most affordable competitive format',
        benefit3: 'Deep metagame with diverse archetypes',
        benefit4: 'Active tournament scene worldwide',
        howItWorks: 'How It Works',
        step1: 'Upload your collection (CSV/Excel)',
        step2: 'Filter by Pauper format',
        step3: 'See all buildable tournament decks',
        step4: 'Check completion percentage and missing cards',
        popularDecks: 'Popular Pauper Archetypes',
        urlSlug: 'pauper-deck-builder-from-collection',
        urlSlugIt: 'costruttore-mazzi-pauper-da-collezione'
      },
      it: {
        h1: 'Costruttore Mazzi Pauper: Trova Mazzi da Torneo dalle Tue Comuni',
        subtitle: 'Costruisci mazzi Pauper competitivi dalla tua collezione di comuni. Confronta con liste da torneo e scopri mazzi potenti ed economici.',
        metaTitle: 'Costruttore Mazzi Pauper da Collezione | Deck Competitivi',
        metaDescription: 'Costruisci mazzi Pauper competitivi dalle tue comuni. Confronta con liste da torneo. Carica le carte e scopri mazzi vincenti.',
        formatName: 'Pauper',
        formatFullName: 'Pauper',
        whatIs: 'Cos\'è il Pauper?',
        whatIsDesc: 'Pauper è un formato competitivo dove sono legali solo carte di rarità comune, offrendo gameplay strategico profondo a un prezzo incredibilmente accessibile.',
        whyBuild: 'Perché Costruire Mazzi Pauper dalla Collezione?',
        benefit1: 'Trasforma le tue comuni in mazzi competitivi',
        benefit2: 'Formato competitivo più economico',
        benefit3: 'Metagame profondo con archetipi diversi',
        benefit4: 'Scena torneistica attiva in tutto il mondo',
        howItWorks: 'Come Funziona',
        step1: 'Carica la tua collezione (CSV/Excel)',
        step2: 'Filtra per formato Pauper',
        step3: 'Vedi tutti i mazzi da torneo costruibili',
        step4: 'Controlla percentuale completamento e carte mancanti',
        popularDecks: 'Archetipi Pauper Popolari',
        urlSlug: 'pauper-deck-builder-from-collection',
        urlSlugIt: 'costruttore-mazzi-pauper-da-collezione'
      }
    }
  };

  const t = formatContent[format][lang];
  const canonicalPath = `/${lang}/${t.urlSlug}`;
  const breadcrumbItems = [
    { label: lang === 'en' ? 'Formats' : 'Formati', url: null },
    { label: t.formatName, url: null }
  ];

  const structuredData = {
    name: `${t.formatName} Deck Builder`,
    description: t.metaDescription,
    breadcrumb: {
      '@type': 'BreadcrumbList',
      itemListElement: [
        {
          '@type': 'ListItem',
          position: 1,
          name: 'Home',
          item: `https://magicdeckbuilder.app.cloudsw.site/${lang}/mtg-deck-builder-from-collection`
        },
        {
          '@type': 'ListItem',
          position: 2,
          name: t.formatName,
          item: `https://magicdeckbuilder.app.cloudsw.site${canonicalPath}`
        }
      ]
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
        enUrl={`/en/${t.urlSlug}`}
        itUrl={`/it/${t.urlSlugIt}`}
      />
      <StructuredData type="WebPage" data={structuredData} />

      <PublicNav lang={lang} currentPath={canonicalPath} />

      <section className="format-hero">
        <div className="container">
          <Breadcrumbs items={breadcrumbItems} lang={lang} />
          <h1>{t.h1}</h1>
          <p className="format-subtitle">{t.subtitle}</p>
          <Link to="/app" className="format-cta">
            {lang === 'en' ? 'Start Building Free' : 'Inizia Gratis'}
          </Link>
        </div>
      </section>

      <section className="format-about">
        <div className="container">
          <h2>{t.whatIs}</h2>
          <p className="format-description">{t.whatIsDesc}</p>
        </div>
      </section>

      <section className="format-benefits">
        <div className="container">
          <h2>{t.whyBuild}</h2>
          <div className="benefits-grid">
            <div className="benefit-card">
              <span className="benefit-icon">✓</span>
              <p>{t.benefit1}</p>
            </div>
            <div className="benefit-card">
              <span className="benefit-icon">✓</span>
              <p>{t.benefit2}</p>
            </div>
            <div className="benefit-card">
              <span className="benefit-icon">✓</span>
              <p>{t.benefit3}</p>
            </div>
            <div className="benefit-card">
              <span className="benefit-icon">✓</span>
              <p>{t.benefit4}</p>
            </div>
          </div>
        </div>
      </section>

      <section className="format-how-it-works">
        <div className="container">
          <h2>{t.howItWorks}</h2>
          <div className="steps-grid">
            <div className="step-card">
              <div className="step-number">1</div>
              <p>{t.step1}</p>
            </div>
            <div className="step-card">
              <div className="step-number">2</div>
              <p>{t.step2}</p>
            </div>
            <div className="step-card">
              <div className="step-number">3</div>
              <p>{t.step3}</p>
            </div>
            <div className="step-card">
              <div className="step-number">4</div>
              <p>{t.step4}</p>
            </div>
          </div>
        </div>
      </section>

      <section className="related-formats">
        <div className="container">
          <h2>{lang === 'en' ? 'Explore Other Formats' : 'Esplora Altri Formati'}</h2>
          <div className="formats-links">
            {format !== 'cedh' && (
              <Link to={`/${lang}/${lang === 'en' ? 'cedh-deck-builder-from-collection' : 'costruttore-mazzi-cedh-da-collezione'}`}>
                cEDH →
              </Link>
            )}
            {format !== 'premodern' && (
              <Link to={`/${lang}/${lang === 'en' ? 'premodern-deck-builder-from-collection' : 'costruttore-mazzi-premodern-da-collezione'}`}>
                Premodern →
              </Link>
            )}
            {format !== 'pauper' && (
              <Link to={`/${lang}/${lang === 'en' ? 'pauper-deck-builder-from-collection' : 'costruttore-mazzi-pauper-da-collezione'}`}>
                Pauper →
              </Link>
            )}
          </div>
        </div>
      </section>

      <CTASection lang={lang} variant="secondary" />

      <footer className="public-footer">
        <div className="container">
          <p>© 2026 Magic Deck Builder. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default FormatPage;
