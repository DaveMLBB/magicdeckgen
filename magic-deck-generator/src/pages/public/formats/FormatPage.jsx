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
    standard: {
      en: {
        h1: 'Standard Deck Builder: Build Rotating Decks from Your Collection',
        subtitle: 'Build competitive Standard decks from your collection. Match against the current Standard metagame and discover which top decks you can build right now.',
        metaTitle: 'Standard MTG Deck Builder from Collection | Current Meta Decks',
        metaDescription: 'Build Standard MTG decks from your collection. Match against current meta decks, see missing cards, and stay competitive in the rotating format.',
        formatName: 'Standard',
        formatFullName: 'Standard',
        whatIs: 'What is Standard?',
        whatIsDesc: 'Standard is Magic\'s flagship rotating format, featuring cards from the most recent sets. It rotates annually, keeping the metagame fresh and accessible. Standard is the format played at most local game stores and major tournaments.',
        whyBuild: 'Why Build Standard Decks from Your Collection?',
        benefit1: 'Stay competitive with the current meta without buying full sets',
        benefit2: 'Discover which top decks you\'re closest to completing',
        benefit3: 'Maximize value from your recent set purchases',
        benefit4: 'Prepare for FNM and local Standard events',
        howItWorks: 'How It Works',
        step1: 'Upload your collection (CSV/Excel/Arena)',
        step2: 'Filter by Standard format',
        step3: 'See all buildable current meta decks',
        step4: 'Check completion percentage and missing cards',
        popularDecks: 'Popular Standard Archetypes',
        urlSlug: 'standard-deck-builder-from-collection',
        urlSlugIt: 'costruttore-mazzi-standard-da-collezione'
      },
      it: {
        h1: 'Costruttore Mazzi Standard: Costruisci dalla Tua Collezione',
        subtitle: 'Costruisci mazzi Standard competitivi dalla tua collezione. Confronta con il metagame Standard attuale e scopri quali mazzi top puoi costruire subito.',
        metaTitle: 'Costruttore Mazzi Standard MTG da Collezione | Mazzi Meta Attuali',
        metaDescription: 'Costruisci mazzi Standard MTG dalla tua collezione. Confronta con i mazzi meta attuali, vedi le carte mancanti e rimani competitivo nel formato rotante.',
        formatName: 'Standard',
        formatFullName: 'Standard',
        whatIs: 'Cos\'è lo Standard?',
        whatIsDesc: 'Lo Standard è il formato rotante principale di Magic, con carte dai set più recenti. Ruota annualmente, mantenendo il metagame fresco e accessibile. È il formato giocato nella maggior parte dei negozi locali e tornei principali.',
        whyBuild: 'Perché Costruire Mazzi Standard dalla Collezione?',
        benefit1: 'Rimani competitivo con il meta attuale senza comprare set completi',
        benefit2: 'Scopri quali mazzi top sei più vicino a completare',
        benefit3: 'Massimizza il valore dai tuoi acquisti di set recenti',
        benefit4: 'Preparati per FNM ed eventi Standard locali',
        howItWorks: 'Come Funziona',
        step1: 'Carica la tua collezione (CSV/Excel/Arena)',
        step2: 'Filtra per formato Standard',
        step3: 'Vedi tutti i mazzi meta attuali costruibili',
        step4: 'Controlla percentuale completamento e carte mancanti',
        popularDecks: 'Archetipi Standard Popolari',
        urlSlug: 'standard-deck-builder-from-collection',
        urlSlugIt: 'costruttore-mazzi-standard-da-collezione'
      }
    },
    modern: {
      en: {
        h1: 'Modern Deck Builder: Build Competitive Modern Decks from Your Collection',
        subtitle: 'Build competitive Modern decks from your collection. Match against top Modern tournament lists and discover which powerful non-rotating decks you can build.',
        metaTitle: 'Modern MTG Deck Builder from Collection | Competitive Modern Decks',
        metaDescription: 'Build Modern MTG decks from your collection. Match against top tournament lists, see missing cards, and discover which competitive Modern decks you can build.',
        formatName: 'Modern',
        formatFullName: 'Modern',
        whatIs: 'What is Modern?',
        whatIsDesc: 'Modern is a non-rotating format featuring cards from 8th Edition onwards (2003+). It offers a deep, diverse metagame with hundreds of viable decks across all archetypes — aggro, control, combo, and midrange.',
        whyBuild: 'Why Build Modern Decks from Your Collection?',
        benefit1: 'Non-rotating format — your investment never rotates out',
        benefit2: 'Hundreds of viable deck archetypes to explore',
        benefit3: 'Active tournament scene at all levels',
        benefit4: 'Cards hold value better than rotating formats',
        howItWorks: 'How It Works',
        step1: 'Upload your collection (CSV/Excel)',
        step2: 'Filter by Modern format',
        step3: 'See all buildable tournament decks',
        step4: 'Check completion percentage and missing cards',
        popularDecks: 'Popular Modern Archetypes',
        urlSlug: 'modern-deck-builder-from-collection',
        urlSlugIt: 'costruttore-mazzi-modern-da-collezione'
      },
      it: {
        h1: 'Costruttore Mazzi Modern: Mazzi Modern Competitivi dalla Collezione',
        subtitle: 'Costruisci mazzi Modern competitivi dalla tua collezione. Confronta con le migliori liste da torneo Modern e scopri quali mazzi non-rotanti potenti puoi costruire.',
        metaTitle: 'Costruttore Mazzi Modern MTG da Collezione | Mazzi Modern Competitivi',
        metaDescription: 'Costruisci mazzi Modern MTG dalla tua collezione. Confronta con le migliori liste da torneo, vedi le carte mancanti e scopri quali mazzi Modern competitivi puoi costruire.',
        formatName: 'Modern',
        formatFullName: 'Modern',
        whatIs: 'Cos\'è il Modern?',
        whatIsDesc: 'Modern è un formato non rotante con carte dall\'8a Edizione in poi (2003+). Offre un metagame profondo e diversificato con centinaia di mazzi validi in tutti gli archetipi — aggro, control, combo e midrange.',
        whyBuild: 'Perché Costruire Mazzi Modern dalla Collezione?',
        benefit1: 'Formato non rotante — il tuo investimento non ruota mai',
        benefit2: 'Centinaia di archetipi di mazzi validi da esplorare',
        benefit3: 'Scena torneistica attiva a tutti i livelli',
        benefit4: 'Le carte mantengono il valore meglio dei formati rotanti',
        howItWorks: 'Come Funziona',
        step1: 'Carica la tua collezione (CSV/Excel)',
        step2: 'Filtra per formato Modern',
        step3: 'Vedi tutti i mazzi da torneo costruibili',
        step4: 'Controlla percentuale completamento e carte mancanti',
        popularDecks: 'Archetipi Modern Popolari',
        urlSlug: 'modern-deck-builder-from-collection',
        urlSlugIt: 'costruttore-mazzi-modern-da-collezione'
      }
    },
    legacy: {
      en: {
        h1: 'Legacy Deck Builder: Build Powerful Legacy Decks from Your Collection',
        subtitle: 'Build Legacy decks from your collection. Match against top Legacy tournament lists and discover which powerful eternal format decks you can build.',
        metaTitle: 'Legacy MTG Deck Builder from Collection | Powerful Legacy Decks',
        metaDescription: 'Build Legacy MTG decks from your collection. Match against top tournament lists, see missing cards, and discover which Legacy decks you can build from your cards.',
        formatName: 'Legacy',
        formatFullName: 'Legacy',
        whatIs: 'What is Legacy?',
        whatIsDesc: 'Legacy is an eternal format featuring almost every card ever printed (with a banned list). It\'s home to the most powerful spells in Magic history — Force of Will, Brainstorm, Daze — and offers incredibly deep gameplay.',
        whyBuild: 'Why Build Legacy Decks from Your Collection?',
        benefit1: 'Access the most powerful cards in Magic history',
        benefit2: 'Eternal format — cards never rotate out',
        benefit3: 'Deep, skill-intensive gameplay',
        benefit4: 'Many Legacy staples overlap with other eternal formats',
        howItWorks: 'How It Works',
        step1: 'Upload your collection (CSV/Excel)',
        step2: 'Filter by Legacy format',
        step3: 'See all buildable tournament decks',
        step4: 'Check completion percentage and missing cards',
        popularDecks: 'Popular Legacy Archetypes',
        urlSlug: 'legacy-deck-builder-from-collection',
        urlSlugIt: 'costruttore-mazzi-legacy-da-collezione'
      },
      it: {
        h1: 'Costruttore Mazzi Legacy: Mazzi Legacy Potenti dalla Collezione',
        subtitle: 'Costruisci mazzi Legacy dalla tua collezione. Confronta con le migliori liste da torneo Legacy e scopri quali mazzi del formato eterno potenti puoi costruire.',
        metaTitle: 'Costruttore Mazzi Legacy MTG da Collezione | Mazzi Legacy Potenti',
        metaDescription: 'Costruisci mazzi Legacy MTG dalla tua collezione. Confronta con le migliori liste da torneo, vedi le carte mancanti e scopri quali mazzi Legacy puoi costruire.',
        formatName: 'Legacy',
        formatFullName: 'Legacy',
        whatIs: 'Cos\'è il Legacy?',
        whatIsDesc: 'Legacy è un formato eterno con quasi tutte le carte mai stampate (con una lista bannata). È la casa delle magie più potenti nella storia di Magic — Force of Will, Brainstorm, Daze — e offre un gameplay incredibilmente profondo.',
        whyBuild: 'Perché Costruire Mazzi Legacy dalla Collezione?',
        benefit1: 'Accedi alle carte più potenti nella storia di Magic',
        benefit2: 'Formato eterno — le carte non ruotano mai',
        benefit3: 'Gameplay profondo e intenso in termini di abilità',
        benefit4: 'Molti staple Legacy si sovrappongono con altri formati eterni',
        howItWorks: 'Come Funziona',
        step1: 'Carica la tua collezione (CSV/Excel)',
        step2: 'Filtra per formato Legacy',
        step3: 'Vedi tutti i mazzi da torneo costruibili',
        step4: 'Controlla percentuale completamento e carte mancanti',
        popularDecks: 'Archetipi Legacy Popolari',
        urlSlug: 'legacy-deck-builder-from-collection',
        urlSlugIt: 'costruttore-mazzi-legacy-da-collezione'
      }
    },
    pioneer: {
      en: {
        h1: 'Pioneer Deck Builder: Build Competitive Pioneer Decks from Your Collection',
        subtitle: 'Build competitive Pioneer decks from your collection. Match against top Pioneer tournament lists and discover which powerful non-rotating decks you can build.',
        metaTitle: 'Pioneer MTG Deck Builder from Collection | Competitive Pioneer Decks',
        metaDescription: 'Build Pioneer MTG decks from your collection. Match against top tournament lists, see missing cards, and discover which competitive Pioneer decks you can build.',
        formatName: 'Pioneer',
        formatFullName: 'Pioneer',
        whatIs: 'What is Pioneer?',
        whatIsDesc: 'Pioneer is a non-rotating format featuring cards from Return to Ravnica onwards (2012+). It offers a powerful but accessible metagame without the Reserved List cards of Legacy, making it the ideal competitive non-rotating format.',
        whyBuild: 'Why Build Pioneer Decks from Your Collection?',
        benefit1: 'Non-rotating format without Reserved List price barriers',
        benefit2: 'Active tournament scene with major events worldwide',
        benefit3: 'Cards from recent sets are legal and powerful',
        benefit4: 'Great stepping stone between Standard and Modern',
        howItWorks: 'How It Works',
        step1: 'Upload your collection (CSV/Excel/Arena)',
        step2: 'Filter by Pioneer format',
        step3: 'See all buildable tournament decks',
        step4: 'Check completion percentage and missing cards',
        popularDecks: 'Popular Pioneer Archetypes',
        urlSlug: 'pioneer-deck-builder-from-collection',
        urlSlugIt: 'costruttore-mazzi-pioneer-da-collezione'
      },
      it: {
        h1: 'Costruttore Mazzi Pioneer: Mazzi Pioneer Competitivi dalla Collezione',
        subtitle: 'Costruisci mazzi Pioneer competitivi dalla tua collezione. Confronta con le migliori liste da torneo Pioneer e scopri quali mazzi non-rotanti potenti puoi costruire.',
        metaTitle: 'Costruttore Mazzi Pioneer MTG da Collezione | Mazzi Pioneer Competitivi',
        metaDescription: 'Costruisci mazzi Pioneer MTG dalla tua collezione. Confronta con le migliori liste da torneo, vedi le carte mancanti e scopri quali mazzi Pioneer competitivi puoi costruire.',
        formatName: 'Pioneer',
        formatFullName: 'Pioneer',
        whatIs: 'Cos\'è il Pioneer?',
        whatIsDesc: 'Pioneer è un formato non rotante con carte da Return to Ravnica in poi (2012+). Offre un metagame potente ma accessibile senza le carte della Reserved List del Legacy, rendendolo il formato competitivo non rotante ideale.',
        whyBuild: 'Perché Costruire Mazzi Pioneer dalla Collezione?',
        benefit1: 'Formato non rotante senza barriere di prezzo della Reserved List',
        benefit2: 'Scena torneistica attiva con eventi principali in tutto il mondo',
        benefit3: 'Le carte dei set recenti sono legali e potenti',
        benefit4: 'Ottimo trampolino di lancio tra Standard e Modern',
        howItWorks: 'Come Funziona',
        step1: 'Carica la tua collezione (CSV/Excel/Arena)',
        step2: 'Filtra per formato Pioneer',
        step3: 'Vedi tutti i mazzi da torneo costruibili',
        step4: 'Controlla percentuale completamento e carte mancanti',
        popularDecks: 'Archetipi Pioneer Popolari',
        urlSlug: 'pioneer-deck-builder-from-collection',
        urlSlugIt: 'costruttore-mazzi-pioneer-da-collezione'
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
          item: `https://mtgdecksbuilder.com/${lang}/mtg-deck-builder-from-collection`
        },
        {
          '@type': 'ListItem',
          position: 2,
          name: t.formatName,
          item: `https://mtgdecksbuilder.com${canonicalPath}`
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
            {format !== 'standard' && (
              <Link to={`/${lang}/${lang === 'en' ? 'standard-deck-builder-from-collection' : 'costruttore-mazzi-standard-da-collezione'}`}>Standard →</Link>
            )}
            {format !== 'modern' && (
              <Link to={`/${lang}/${lang === 'en' ? 'modern-deck-builder-from-collection' : 'costruttore-mazzi-modern-da-collezione'}`}>Modern →</Link>
            )}
            {format !== 'pioneer' && (
              <Link to={`/${lang}/${lang === 'en' ? 'pioneer-deck-builder-from-collection' : 'costruttore-mazzi-pioneer-da-collezione'}`}>Pioneer →</Link>
            )}
            {format !== 'legacy' && (
              <Link to={`/${lang}/${lang === 'en' ? 'legacy-deck-builder-from-collection' : 'costruttore-mazzi-legacy-da-collezione'}`}>Legacy →</Link>
            )}
            {format !== 'cedh' && (
              <Link to={`/${lang}/${lang === 'en' ? 'cedh-deck-builder-from-collection' : 'costruttore-mazzi-cedh-da-collezione'}`}>cEDH →</Link>
            )}
            {format !== 'pauper' && (
              <Link to={`/${lang}/${lang === 'en' ? 'pauper-deck-builder-from-collection' : 'costruttore-mazzi-pauper-da-collezione'}`}>Pauper →</Link>
            )}
            {format !== 'premodern' && (
              <Link to={`/${lang}/${lang === 'en' ? 'premodern-deck-builder-from-collection' : 'costruttore-mazzi-premodern-da-collezione'}`}>Premodern →</Link>
            )}
          </div>
        </div>
      </section>

      <CTASection lang={lang} variant="secondary" />

      <footer className="public-footer">
        <div className="container">
          <p>© 2026 Magic Deck Builder. All rights reserved.</p>
          <div className="footer-links">
            <Link to="/app" className="footer-link-guide">{lang === 'en' ? '📖 User Guide' : '📖 Guida'}</Link>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default FormatPage;
