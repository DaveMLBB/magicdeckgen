import { Link } from 'react-router-dom';
import SEOHead from '../../../components/seo/SEOHead';
import HreflangTags from '../../../components/seo/HreflangTags';
import StructuredData from '../../../components/seo/StructuredData';
import PublicNav from '../../../components/public/PublicNav';
import CTASection from '../../../components/public/CTASection';
import Breadcrumbs from '../../../components/seo/Breadcrumbs';
import '../PublicPages.css';

const ARCHETYPES = {
  aggro: {
    icon: '⚡',
    color: '#e53e3e',
    gradient: 'linear-gradient(135deg, #c53030 0%, #e53e3e 100%)',
    en: {
      h1: 'MTG Aggro Deck Builder: Build Fast Decks from Your Collection',
      subtitle: 'Find the best aggro decks you can build from your collection. Match against tournament-winning aggro lists across all formats — Standard, Modern, Legacy, Pauper.',
      metaTitle: 'MTG Aggro Deck Builder | Build Fast Decks from Your Collection',
      metaDescription: 'Build MTG aggro decks from your collection. Find tournament-winning aggro lists in Standard, Modern, Legacy and Pauper. Upload your cards and start winning fast.',
      whatIs: 'What is an Aggro Deck in MTG?',
      whatIsDesc: 'Aggro decks aim to win as fast as possible by deploying cheap, efficient creatures and burn spells. The goal is to reduce your opponent\'s life total to zero before they can stabilize. Classic aggro strategies include Mono-Red Burn, White Weenie, and Zoo.',
      keyCards: 'Key Aggro Card Types',
      cards: [
        { name: '1-drop creatures', desc: 'Goblin Guide, Monastery Swiftspear, Ragavan — apply pressure from turn 1' },
        { name: 'Burn spells', desc: 'Lightning Bolt, Lava Spike, Rift Bolt — finish off opponents at low life' },
        { name: 'Anthem effects', desc: 'Intangible Virtue, Glorious Anthem — pump your entire board' },
        { name: 'Haste enablers', desc: 'Fires of Yavimaya, Swiftfoot Boots — attack immediately' },
      ],
      formats: ['Standard', 'Modern', 'Legacy', 'Pauper', 'Pioneer'],
      tip1: 'Keep your curve low — most aggro decks top out at 3 mana',
      tip2: 'Run 20-22 lands to avoid flooding while hitting early drops',
      tip3: 'Include 8-12 burn spells to close out games',
      tip4: 'Sideboard hate for control and combo matchups',
      urlSlug: 'mtg-aggro-deck-builder',
      urlSlugIt: 'costruttore-mazzi-aggro-mtg',
    },
    it: {
      h1: 'Costruttore Mazzi Aggro MTG: Mazzi Veloci dalla Tua Collezione',
      subtitle: 'Trova i migliori mazzi aggro che puoi costruire dalla tua collezione. Confronta con liste vincenti da torneo in tutti i formati — Standard, Modern, Legacy, Pauper.',
      metaTitle: 'Costruttore Mazzi Aggro MTG | Mazzi Veloci dalla Collezione',
      metaDescription: 'Costruisci mazzi aggro MTG dalla tua collezione. Trova liste aggro vincenti in Standard, Modern, Legacy e Pauper. Carica le carte e inizia a vincere velocemente.',
      whatIs: 'Cos\'è un Mazzo Aggro in MTG?',
      whatIsDesc: 'I mazzi aggro mirano a vincere il più velocemente possibile schierando creature economiche ed efficienti e magie brucianti. L\'obiettivo è ridurre i punti vita dell\'avversario a zero prima che possa stabilizzarsi.',
      keyCards: 'Tipi di Carte Chiave Aggro',
      cards: [
        { name: 'Creature da 1 mana', desc: 'Goblin Guide, Monastery Swiftspear, Ragavan — pressione dal turno 1' },
        { name: 'Magie brucianti', desc: 'Lightning Bolt, Lava Spike, Rift Bolt — chiudi gli avversari a bassa vita' },
        { name: 'Effetti anthem', desc: 'Intangible Virtue, Glorious Anthem — potenzia l\'intero campo' },
        { name: 'Abilitatori di haste', desc: 'Fires of Yavimaya, Swiftfoot Boots — attacca immediatamente' },
      ],
      formats: ['Standard', 'Modern', 'Legacy', 'Pauper', 'Pioneer'],
      tip1: 'Mantieni la curva bassa — la maggior parte dei mazzi aggro arriva a 3 mana',
      tip2: 'Usa 20-22 terre per evitare flooding mantenendo le giocate iniziali',
      tip3: 'Includi 8-12 magie brucianti per chiudere le partite',
      tip4: 'Sideboard con hate per i matchup contro control e combo',
      urlSlug: 'mtg-aggro-deck-builder',
      urlSlugIt: 'costruttore-mazzi-aggro-mtg',
    }
  },
  control: {
    icon: '🛡️',
    color: '#3182ce',
    gradient: 'linear-gradient(135deg, #2b6cb0 0%, #3182ce 100%)',
    en: {
      h1: 'MTG Control Deck Builder: Build Control Decks from Your Collection',
      subtitle: 'Find the best control decks you can build from your collection. Match against top control lists in Modern, Legacy, Standard and more.',
      metaTitle: 'MTG Control Deck Builder | Build Control Decks from Your Collection',
      metaDescription: 'Build MTG control decks from your collection. Find top control lists in Modern, Legacy, Standard. Upload your cards and discover which control decks you can build.',
      whatIs: 'What is a Control Deck in MTG?',
      whatIsDesc: 'Control decks aim to answer every threat the opponent plays, then win with a single powerful finisher. They use counterspells, removal, and card draw to maintain advantage throughout the game. Classic control strategies include UW Control, Jeskai Control, and Grixis Control.',
      keyCards: 'Key Control Card Types',
      cards: [
        { name: 'Counterspells', desc: 'Force of Will, Counterspell, Mana Leak — stop opponent\'s key plays' },
        { name: 'Removal', desc: 'Swords to Plowshares, Path to Exile, Fatal Push — answer every threat' },
        { name: 'Card draw', desc: 'Brainstorm, Ponder, Preordain — maintain hand advantage' },
        { name: 'Win conditions', desc: 'Teferi, Shark Typhoon, Snapcaster Mage — close out the game' },
      ],
      formats: ['Modern', 'Legacy', 'Standard', 'Vintage', 'Pioneer'],
      tip1: 'Run 26-28 lands to hit every land drop and cast expensive spells',
      tip2: 'Include 8-12 counterspells to protect your game plan',
      tip3: 'Use sweepers like Wrath of God to reset the board',
      tip4: 'Choose a win condition that\'s hard to interact with',
      urlSlug: 'mtg-control-deck-builder',
      urlSlugIt: 'costruttore-mazzi-control-mtg',
    },
    it: {
      h1: 'Costruttore Mazzi Control MTG: Mazzi Control dalla Tua Collezione',
      subtitle: 'Trova i migliori mazzi control che puoi costruire dalla tua collezione. Confronta con le migliori liste control in Modern, Legacy, Standard e altri formati.',
      metaTitle: 'Costruttore Mazzi Control MTG | Mazzi Control dalla Collezione',
      metaDescription: 'Costruisci mazzi control MTG dalla tua collezione. Trova le migliori liste control in Modern, Legacy, Standard. Carica le carte e scopri quali mazzi control puoi costruire.',
      whatIs: 'Cos\'è un Mazzo Control in MTG?',
      whatIsDesc: 'I mazzi control mirano a rispondere a ogni minaccia dell\'avversario, poi vincere con un singolo finisher potente. Usano contromagie, rimozioni e pesca carte per mantenere il vantaggio durante tutta la partita.',
      keyCards: 'Tipi di Carte Chiave Control',
      cards: [
        { name: 'Contromagie', desc: 'Force of Will, Counterspell, Mana Leak — ferma le giocate chiave dell\'avversario' },
        { name: 'Rimozioni', desc: 'Swords to Plowshares, Path to Exile, Fatal Push — rispondi a ogni minaccia' },
        { name: 'Pesca carte', desc: 'Brainstorm, Ponder, Preordain — mantieni il vantaggio in mano' },
        { name: 'Condizioni di vittoria', desc: 'Teferi, Shark Typhoon, Snapcaster Mage — chiudi la partita' },
      ],
      formats: ['Modern', 'Legacy', 'Standard', 'Vintage', 'Pioneer'],
      tip1: 'Usa 26-28 terre per raggiungere ogni drop di terra e giocare magie costose',
      tip2: 'Includi 8-12 contromagie per proteggere il tuo piano di gioco',
      tip3: 'Usa sweeper come Wrath of God per resettare il campo',
      tip4: 'Scegli una condizione di vittoria difficile da contrastare',
      urlSlug: 'mtg-control-deck-builder',
      urlSlugIt: 'costruttore-mazzi-control-mtg',
    }
  },
  combo: {
    icon: '🔄',
    color: '#805ad5',
    gradient: 'linear-gradient(135deg, #6b46c1 0%, #805ad5 100%)',
    en: {
      h1: 'MTG Combo Deck Builder: Build Combo Decks from Your Collection',
      subtitle: 'Find the best combo decks you can build from your collection. Match against top combo lists in Modern, Legacy, cEDH and more.',
      metaTitle: 'MTG Combo Deck Builder | Build Combo Decks from Your Collection',
      metaDescription: 'Build MTG combo decks from your collection. Find top combo lists in Modern, Legacy, cEDH. Upload your cards and discover which infinite combos you can assemble.',
      whatIs: 'What is a Combo Deck in MTG?',
      whatIsDesc: 'Combo decks win by assembling a specific combination of cards that creates an infinite loop or an unstoppable win condition. They use tutors and card selection to find combo pieces consistently. Classic combos include Splinter Twin, Thassa\'s Oracle + Demonic Consultation, and Underworld Breach.',
      keyCards: 'Key Combo Card Types',
      cards: [
        { name: 'Tutors', desc: 'Demonic Tutor, Vampiric Tutor, Imperial Seal — find your combo pieces' },
        { name: 'Cantrips', desc: 'Brainstorm, Ponder, Preordain — dig through your deck efficiently' },
        { name: 'Protection', desc: 'Force of Will, Pact of Negation — protect your combo from interaction' },
        { name: 'Mana acceleration', desc: 'Dark Ritual, Mana Crypt, Sol Ring — go off ahead of schedule' },
      ],
      formats: ['Modern', 'Legacy', 'Vintage', 'cEDH', 'Pioneer'],
      tip1: 'Run redundant combo pieces to increase consistency',
      tip2: 'Include 8-12 tutors to find your win condition reliably',
      tip3: 'Protect your combo with counterspells and discard',
      tip4: 'Practice the combo sequence until it\'s automatic',
      urlSlug: 'mtg-combo-deck-builder',
      urlSlugIt: 'costruttore-mazzi-combo-mtg',
    },
    it: {
      h1: 'Costruttore Mazzi Combo MTG: Mazzi Combo dalla Tua Collezione',
      subtitle: 'Trova i migliori mazzi combo che puoi costruire dalla tua collezione. Confronta con le migliori liste combo in Modern, Legacy, cEDH e altri formati.',
      metaTitle: 'Costruttore Mazzi Combo MTG | Mazzi Combo dalla Collezione',
      metaDescription: 'Costruisci mazzi combo MTG dalla tua collezione. Trova le migliori liste combo in Modern, Legacy, cEDH. Carica le carte e scopri quali combo infinite puoi assemblare.',
      whatIs: 'Cos\'è un Mazzo Combo in MTG?',
      whatIsDesc: 'I mazzi combo vincono assemblando una combinazione specifica di carte che crea un loop infinito o una condizione di vittoria inarrestabile. Usano tutor e selezione carte per trovare i pezzi combo in modo consistente.',
      keyCards: 'Tipi di Carte Chiave Combo',
      cards: [
        { name: 'Tutor', desc: 'Demonic Tutor, Vampiric Tutor, Imperial Seal — trova i tuoi pezzi combo' },
        { name: 'Cantrip', desc: 'Brainstorm, Ponder, Preordain — scava nel mazzo in modo efficiente' },
        { name: 'Protezione', desc: 'Force of Will, Pact of Negation — proteggi il combo dall\'interazione' },
        { name: 'Accelerazione mana', desc: 'Dark Ritual, Mana Crypt, Sol Ring — esegui il combo in anticipo' },
      ],
      formats: ['Modern', 'Legacy', 'Vintage', 'cEDH', 'Pioneer'],
      tip1: 'Usa pezzi combo ridondanti per aumentare la consistenza',
      tip2: 'Includi 8-12 tutor per trovare la condizione di vittoria in modo affidabile',
      tip3: 'Proteggi il combo con contromagie e discard',
      tip4: 'Pratica la sequenza combo finché non diventa automatica',
      urlSlug: 'mtg-combo-deck-builder',
      urlSlugIt: 'costruttore-mazzi-combo-mtg',
    }
  },
  midrange: {
    icon: '⚖️',
    color: '#38a169',
    gradient: 'linear-gradient(135deg, #276749 0%, #38a169 100%)',
    en: {
      h1: 'MTG Midrange Deck Builder: Build Midrange Decks from Your Collection',
      subtitle: 'Find the best midrange decks you can build from your collection. Match against top midrange lists in Modern, Standard, Pioneer and more.',
      metaTitle: 'MTG Midrange Deck Builder | Build Midrange Decks from Your Collection',
      metaDescription: 'Build MTG midrange decks from your collection. Find top midrange lists in Modern, Standard, Pioneer. Upload your cards and discover which powerful midrange decks you can build.',
      whatIs: 'What is a Midrange Deck in MTG?',
      whatIsDesc: 'Midrange decks occupy the space between aggro and control, using efficient threats and answers to outvalue opponents. They play powerful creatures with enters-the-battlefield effects and flexible removal. Classic midrange strategies include Jund, Abzan, and Sultai.',
      keyCards: 'Key Midrange Card Types',
      cards: [
        { name: 'Value creatures', desc: 'Tarmogoyf, Bloodbraid Elf, Seasoned Pyromancer — generate card advantage' },
        { name: 'Discard spells', desc: 'Thoughtseize, Inquisition of Kozilek — strip opponent\'s best cards' },
        { name: 'Flexible removal', desc: 'Fatal Push, Lightning Bolt, Abrupt Decay — answer any threat' },
        { name: 'Planeswalkers', desc: 'Liliana of the Veil, Wrenn and Six — generate ongoing value' },
      ],
      formats: ['Modern', 'Standard', 'Pioneer', 'Legacy', 'Explorer'],
      tip1: 'Prioritize 2-for-1 effects to generate card advantage',
      tip2: 'Run 23-24 lands with fetchlands for consistency',
      tip3: 'Include discard to strip opponent\'s best answers',
      tip4: 'Adapt your sideboard to beat both aggro and control',
      urlSlug: 'mtg-midrange-deck-builder',
      urlSlugIt: 'costruttore-mazzi-midrange-mtg',
    },
    it: {
      h1: 'Costruttore Mazzi Midrange MTG: Mazzi Midrange dalla Tua Collezione',
      subtitle: 'Trova i migliori mazzi midrange che puoi costruire dalla tua collezione. Confronta con le migliori liste midrange in Modern, Standard, Pioneer e altri formati.',
      metaTitle: 'Costruttore Mazzi Midrange MTG | Mazzi Midrange dalla Collezione',
      metaDescription: 'Costruisci mazzi midrange MTG dalla tua collezione. Trova le migliori liste midrange in Modern, Standard, Pioneer. Carica le carte e scopri quali mazzi midrange potenti puoi costruire.',
      whatIs: 'Cos\'è un Mazzo Midrange in MTG?',
      whatIsDesc: 'I mazzi midrange occupano lo spazio tra aggro e control, usando minacce e risposte efficienti per superare in valore gli avversari. Giocano creature potenti con effetti all\'entrata e rimozioni flessibili.',
      keyCards: 'Tipi di Carte Chiave Midrange',
      cards: [
        { name: 'Creature di valore', desc: 'Tarmogoyf, Bloodbraid Elf, Seasoned Pyromancer — genera vantaggio carte' },
        { name: 'Magie discard', desc: 'Thoughtseize, Inquisition of Kozilek — rimuovi le carte migliori dell\'avversario' },
        { name: 'Rimozioni flessibili', desc: 'Fatal Push, Lightning Bolt, Abrupt Decay — rispondi a qualsiasi minaccia' },
        { name: 'Planeswalker', desc: 'Liliana of the Veil, Wrenn and Six — genera valore continuo' },
      ],
      formats: ['Modern', 'Standard', 'Pioneer', 'Legacy', 'Explorer'],
      tip1: 'Dai priorità agli effetti 2-per-1 per generare vantaggio carte',
      tip2: 'Usa 23-24 terre con fetchland per la consistenza',
      tip3: 'Includi discard per rimuovere le migliori risposte dell\'avversario',
      tip4: 'Adatta il sideboard per battere sia aggro che control',
      urlSlug: 'mtg-midrange-deck-builder',
      urlSlugIt: 'costruttore-mazzi-midrange-mtg',
    }
  }
};

const ArchetypePage = ({ archetype, lang = 'en' }) => {
  const data = ARCHETYPES[archetype];
  if (!data) return null;
  const t = data[lang];

  const canonicalPath = lang === 'en' ? `/en/${t.urlSlug}` : `/it/${t.urlSlugIt}`;

  const breadcrumbItems = [
    { label: lang === 'en' ? 'Archetypes' : 'Archetipi', url: null },
    { label: archetype.charAt(0).toUpperCase() + archetype.slice(1), url: null }
  ];

  const structuredData = {
    name: `MTG ${archetype} Deck Builder`,
    description: t.metaDescription,
  };

  const otherArchetypes = Object.keys(ARCHETYPES).filter(k => k !== archetype);

  return (
    <div className="seo-public-page">
      <SEOHead
        title={t.metaTitle}
        description={t.metaDescription}
        canonical={canonicalPath}
        lang={lang}
        keywords={`MTG ${archetype}, ${archetype} deck builder, ${archetype} MTG, ${t.formats.join(', ')}`}
      />
      <HreflangTags
        enUrl={`/en/${t.urlSlug}`}
        itUrl={`/it/${t.urlSlugIt}`}
      />
      <StructuredData type="WebPage" data={structuredData} />

      <PublicNav lang={lang} currentPath={canonicalPath} />

      <section className="format-hero" style={{ background: data.gradient }}>
        <div className="container">
          <Breadcrumbs items={breadcrumbItems} lang={lang} />
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>{data.icon}</div>
          <h1>{t.h1}</h1>
          <p className="format-subtitle">{t.subtitle}</p>
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', margin: '1rem 0' }}>
            {t.formats.map(f => (
              <span key={f} style={{ background: 'rgba(255,255,255,0.2)', padding: '0.3rem 0.8rem', borderRadius: '20px', fontSize: '0.85rem' }}>
                {f}
              </span>
            ))}
          </div>
          <Link to="/app" className="format-cta" style={{ marginTop: '1.5rem', display: 'inline-block', background: '#fff', color: data.color }}>
            {lang === 'en' ? `Find ${archetype.charAt(0).toUpperCase() + archetype.slice(1)} Decks →` : `Trova Mazzi ${archetype.charAt(0).toUpperCase() + archetype.slice(1)} →`}
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
          <h2>{t.keyCards}</h2>
          <div className="benefits-grid">
            {t.cards.map((card, i) => (
              <div className="benefit-card" key={i}>
                <span className="benefit-icon" style={{ fontSize: '1.5rem', color: data.color }}>{data.icon}</span>
                <strong style={{ color: '#fff', display: 'block', marginBottom: '0.5rem' }}>{card.name}</strong>
                <p>{card.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="format-how-it-works">
        <div className="container">
          <h2>{lang === 'en' ? 'Building Tips' : 'Consigli per la Costruzione'}</h2>
          <div className="steps-grid">
            {[t.tip1, t.tip2, t.tip3, t.tip4].map((tip, i) => (
              <div className="step-card" key={i}>
                <div className="step-number" style={{ background: data.gradient }}>{i + 1}</div>
                <p>{tip}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="related-formats">
        <div className="container">
          <h2>{lang === 'en' ? 'Other Archetypes' : 'Altri Archetipi'}</h2>
          <div className="formats-links">
            {otherArchetypes.map(key => (
              <Link
                key={key}
                to={lang === 'en'
                  ? `/en/${ARCHETYPES[key].en.urlSlug}`
                  : `/it/${ARCHETYPES[key].it.urlSlugIt}`}
                style={{ background: ARCHETYPES[key].gradient }}
              >
                {ARCHETYPES[key].icon} {key.charAt(0).toUpperCase() + key.slice(1)} →
              </Link>
            ))}
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

export { ARCHETYPES };
export default ArchetypePage;
