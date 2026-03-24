import { Link } from 'react-router-dom';
import SEOHead from '../../../components/seo/SEOHead';
import HreflangTags from '../../../components/seo/HreflangTags';
import StructuredData from '../../../components/seo/StructuredData';
import PublicNav from '../../../components/public/PublicNav';
import CTASection from '../../../components/public/CTASection';
import Breadcrumbs from '../../../components/seo/Breadcrumbs';
import '../PublicPages.css';

// Top commanders with real search volume
const COMMANDERS = {
  atraxa: {
    name: 'Atraxa, Praetors\' Voice',
    colors: 'WUBG',
    colorNames: 'White, Blue, Black, Green',
    archetype: 'Superfriends / Proliferate',
    en: {
      h1: 'Atraxa Commander Deck Builder: Build from Your Collection',
      subtitle: 'Build the best Atraxa, Praetors\' Voice Commander deck from cards you already own. Match your collection against top cEDH and casual Atraxa lists.',
      metaTitle: 'Atraxa Commander Deck Builder | Build from Your Collection',
      metaDescription: 'Build an Atraxa Commander deck from your collection. Find which Atraxa lists you can build, see missing cards, and optimize your superfriends strategy.',
      whatIs: 'Why Play Atraxa Commander?',
      whatIsDesc: 'Atraxa, Praetors\' Voice is one of the most popular commanders in EDH history. Her proliferate ability synergizes with planeswalkers, counters, and infect strategies, making her versatile across power levels from casual to cEDH.',
      tip1: 'Proliferate every turn to accelerate planeswalker ultimates',
      tip2: 'Run 10+ planeswalkers for maximum superfriends value',
      tip3: 'Include counter-synergy cards like Doubling Season',
      tip4: 'Balance removal and ramp for consistent gameplay',
      urlSlug: 'commander/atraxa-deck-builder',
      urlSlugIt: 'comandante/atraxa-costruttore-mazzo',
    },
    it: {
      h1: 'Costruttore Mazzo Atraxa Commander: Costruisci dalla Collezione',
      subtitle: 'Costruisci il miglior mazzo Commander con Atraxa, Praetors\' Voice dalle carte che già possiedi. Confronta la tua collezione con le migliori liste Atraxa.',
      metaTitle: 'Costruttore Mazzo Atraxa Commander | Dalla Tua Collezione',
      metaDescription: 'Costruisci un mazzo Atraxa Commander dalla tua collezione. Scopri quali liste Atraxa puoi costruire, vedi le carte mancanti e ottimizza la strategia superfriends.',
      whatIs: 'Perché Giocare Atraxa Commander?',
      whatIsDesc: 'Atraxa, Praetors\' Voice è uno dei comandanti più popolari nella storia di EDH. La sua abilità proliferate si combina con planeswalker, segnalini e strategie infect, rendendola versatile a tutti i livelli di potenza.',
      tip1: 'Prolifera ogni turno per accelerare le ultime dei planeswalker',
      tip2: 'Includi 10+ planeswalker per massimizzare il valore superfriends',
      tip3: 'Aggiungi carte con sinergia segnalini come Doubling Season',
      tip4: 'Bilancia rimozioni e rampa per un gameplay consistente',
      urlSlug: 'commander/atraxa-deck-builder',
      urlSlugIt: 'comandante/atraxa-costruttore-mazzo',
    }
  },
  kenrith: {
    name: 'Kenrith, the Returned King',
    colors: 'WUBRG',
    colorNames: 'All 5 Colors',
    archetype: 'Goodstuff / Combo',
    en: {
      h1: 'Kenrith Commander Deck Builder: 5-Color from Your Collection',
      subtitle: 'Build a Kenrith, the Returned King Commander deck from your collection. The ultimate 5-color goodstuff commander — find which powerful lists you can build now.',
      metaTitle: 'Kenrith Commander Deck Builder | 5-Color from Your Collection',
      metaDescription: 'Build a Kenrith Commander deck from your collection. Match against top 5-color lists, see missing cards, and discover the best Kenrith strategies.',
      whatIs: 'Why Play Kenrith Commander?',
      whatIsDesc: 'Kenrith, the Returned King enables access to all five colors, making him the go-to commander for goodstuff, combo, and reanimator strategies. His activated abilities provide incredible flexibility in any game state.',
      tip1: 'Use all 5 colors to access the best cards in every category',
      tip2: 'Kenrith\'s haste ability enables surprise wins with combo pieces',
      tip3: 'Reanimation synergizes perfectly with his activated abilities',
      tip4: 'Include mana rocks to activate multiple abilities per turn',
      urlSlug: 'commander/kenrith-deck-builder',
      urlSlugIt: 'comandante/kenrith-costruttore-mazzo',
    },
    it: {
      h1: 'Costruttore Mazzo Kenrith Commander: 5 Colori dalla Collezione',
      subtitle: 'Costruisci un mazzo Commander con Kenrith, the Returned King dalla tua collezione. Il comandante goodstuff 5 colori per eccellenza.',
      metaTitle: 'Costruttore Mazzo Kenrith Commander | 5 Colori dalla Collezione',
      metaDescription: 'Costruisci un mazzo Kenrith Commander dalla tua collezione. Confronta con le migliori liste 5 colori e scopri le strategie Kenrith più efficaci.',
      whatIs: 'Perché Giocare Kenrith Commander?',
      whatIsDesc: 'Kenrith, the Returned King permette l\'accesso a tutti e cinque i colori, rendendolo il comandante ideale per strategie goodstuff, combo e reanimator. Le sue abilità attivate offrono flessibilità incredibile.',
      tip1: 'Usa tutti e 5 i colori per accedere alle migliori carte di ogni categoria',
      tip2: 'L\'abilità haste di Kenrith permette vittorie a sorpresa con pezzi combo',
      tip3: 'La reanimazione si combina perfettamente con le sue abilità attivate',
      tip4: 'Includi mana rock per attivare più abilità per turno',
      urlSlug: 'commander/kenrith-deck-builder',
      urlSlugIt: 'comandante/kenrith-costruttore-mazzo',
    }
  },
  yuriko: {
    name: 'Yuriko, the Tiger\'s Shadow',
    colors: 'UB',
    colorNames: 'Blue, Black',
    archetype: 'Ninja Tribal / Tempo',
    en: {
      h1: 'Yuriko Commander Deck Builder: Ninja Tribal from Your Collection',
      subtitle: 'Build a Yuriko, the Tiger\'s Shadow Commander deck from your collection. The most feared ninja commander — find which Yuriko lists you can build right now.',
      metaTitle: 'Yuriko Commander Deck Builder | Ninja Tribal from Your Collection',
      metaDescription: 'Build a Yuriko Commander deck from your collection. Match against top ninja tribal lists, see missing cards, and master the Tiger\'s Shadow strategy.',
      whatIs: 'Why Play Yuriko Commander?',
      whatIsDesc: 'Yuriko, the Tiger\'s Shadow is a powerhouse commander that bypasses commander tax with ninjutsu. She deals massive damage through her triggered ability while enabling a fast, evasive ninja tribal strategy.',
      tip1: 'Run cheap unblockable creatures to enable ninjutsu consistently',
      tip2: 'Stack your deck with high-CMC spells for maximum Yuriko damage',
      tip3: 'Include extra turn spells for repeated Yuriko triggers',
      tip4: 'Protect your ninjas with counterspells and evasion',
      urlSlug: 'commander/yuriko-deck-builder',
      urlSlugIt: 'comandante/yuriko-costruttore-mazzo',
    },
    it: {
      h1: 'Costruttore Mazzo Yuriko Commander: Ninja Tribal dalla Collezione',
      subtitle: 'Costruisci un mazzo Commander con Yuriko, the Tiger\'s Shadow dalla tua collezione. Il comandante ninja più temuto — scopri quali liste puoi costruire.',
      metaTitle: 'Costruttore Mazzo Yuriko Commander | Ninja Tribal dalla Collezione',
      metaDescription: 'Costruisci un mazzo Yuriko Commander dalla tua collezione. Confronta con le migliori liste ninja tribal e padroneggia la strategia Tiger\'s Shadow.',
      whatIs: 'Perché Giocare Yuriko Commander?',
      whatIsDesc: 'Yuriko, the Tiger\'s Shadow è un comandante potentissimo che aggira la tassa del comandante con ninjutsu. Infligge danni massicci tramite la sua abilità innescata abilitando una strategia ninja tribal veloce.',
      tip1: 'Usa creature economiche e inarrestabili per abilitare ninjutsu costantemente',
      tip2: 'Costruisci il mazzo con magie ad alto CMC per massimizzare i danni di Yuriko',
      tip3: 'Includi magie per turni extra per ripetuti innescamenti di Yuriko',
      tip4: 'Proteggi i tuoi ninja con contromagie e evasione',
      urlSlug: 'commander/yuriko-deck-builder',
      urlSlugIt: 'comandante/yuriko-costruttore-mazzo',
    }
  },
  edgar: {
    name: 'Edgar Markov',
    colors: 'WBR',
    colorNames: 'White, Black, Red',
    archetype: 'Vampire Tribal / Aggro',
    en: {
      h1: 'Edgar Markov Commander Deck Builder: Vampire Tribal from Your Collection',
      subtitle: 'Build an Edgar Markov Commander deck from your collection. The definitive vampire tribal commander — find which Edgar lists you can build today.',
      metaTitle: 'Edgar Markov Commander Deck Builder | Vampire Tribal from Collection',
      metaDescription: 'Build an Edgar Markov Commander deck from your collection. Match against top vampire tribal lists, see missing cards, and dominate with the vampire lord.',
      whatIs: 'Why Play Edgar Markov Commander?',
      whatIsDesc: 'Edgar Markov is the premier vampire tribal commander, generating free vampire tokens from the command zone with his eminence ability. He enables aggressive strategies that can overwhelm opponents before they stabilize.',
      tip1: 'Eminence creates tokens even from the command zone — no need to cast Edgar early',
      tip2: 'Run 30+ vampires to maximize token generation',
      tip3: 'Include anthem effects to pump your vampire army',
      tip4: 'Haste enablers let Edgar attack immediately when cast',
      urlSlug: 'commander/edgar-markov-deck-builder',
      urlSlugIt: 'comandante/edgar-markov-costruttore-mazzo',
    },
    it: {
      h1: 'Costruttore Mazzo Edgar Markov Commander: Vampire Tribal dalla Collezione',
      subtitle: 'Costruisci un mazzo Commander con Edgar Markov dalla tua collezione. Il comandante vampire tribal definitivo — scopri quali liste puoi costruire oggi.',
      metaTitle: 'Costruttore Mazzo Edgar Markov Commander | Vampire Tribal dalla Collezione',
      metaDescription: 'Costruisci un mazzo Edgar Markov Commander dalla tua collezione. Confronta con le migliori liste vampire tribal e domina con il signore dei vampiri.',
      whatIs: 'Perché Giocare Edgar Markov Commander?',
      whatIsDesc: 'Edgar Markov è il comandante vampire tribal per eccellenza, che genera token vampiro gratuiti dalla zona di comando con la sua abilità eminence. Abilita strategie aggressive che possono sopraffare gli avversari.',
      tip1: 'Eminence crea token anche dalla zona di comando — non serve giocare Edgar presto',
      tip2: 'Includi 30+ vampiri per massimizzare la generazione di token',
      tip3: 'Aggiungi effetti anthem per potenziare il tuo esercito di vampiri',
      tip4: 'Gli abilitatori di haste permettono ad Edgar di attaccare immediatamente',
      urlSlug: 'commander/edgar-markov-deck-builder',
      urlSlugIt: 'comandante/edgar-markov-costruttore-mazzo',
    }
  }
};

const CommanderPage = ({ commander, lang = 'en' }) => {
  const data = COMMANDERS[commander];
  if (!data) return null;
  const t = data[lang];

  const canonicalPath = lang === 'en'
    ? `/en/${t.urlSlug}`
    : `/it/${t.urlSlugIt}`;

  const breadcrumbItems = [
    { label: 'Commander', url: null },
    { label: data.name, url: null }
  ];

  const structuredData = {
    name: `${data.name} Deck Builder`,
    description: t.metaDescription,
  };

  const relatedCommanders = Object.keys(COMMANDERS).filter(k => k !== commander);

  return (
    <div className="seo-public-page">
      <SEOHead
        title={t.metaTitle}
        description={t.metaDescription}
        canonical={canonicalPath}
        lang={lang}
        keywords={`${data.name}, commander deck builder, EDH, ${data.archetype}, MTG commander`}
      />
      <HreflangTags
        enUrl={`/en/${t.urlSlug}`}
        itUrl={`/it/${t.urlSlugIt}`}
      />
      <StructuredData type="WebPage" data={structuredData} />

      <PublicNav lang={lang} currentPath={canonicalPath} />

      <section className="format-hero" style={{ background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)' }}>
        <div className="container">
          <Breadcrumbs items={breadcrumbItems} lang={lang} />
          <h1>{t.h1}</h1>
          <p className="format-subtitle">{t.subtitle}</p>
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginTop: '1rem' }}>
            <span style={{ background: 'rgba(255,255,255,0.15)', padding: '0.4rem 1rem', borderRadius: '20px', fontSize: '0.9rem' }}>
              🎨 {data.colorNames}
            </span>
            <span style={{ background: 'rgba(255,255,255,0.15)', padding: '0.4rem 1rem', borderRadius: '20px', fontSize: '0.9rem' }}>
              ⚔️ {data.archetype}
            </span>
          </div>
          <Link to="/app" className="format-cta" style={{ marginTop: '2rem', display: 'inline-block', background: '#4a9eff', color: '#fff' }}>
            {lang === 'en' ? 'Build This Deck Free →' : 'Costruisci Gratis →'}
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
          <h2>{lang === 'en' ? `Tips for Building ${data.name}` : `Consigli per Costruire ${data.name}`}</h2>
          <div className="benefits-grid">
            {[t.tip1, t.tip2, t.tip3, t.tip4].map((tip, i) => (
              <div className="benefit-card" key={i}>
                <span className="benefit-icon">💡</span>
                <p>{tip}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="format-how-it-works">
        <div className="container">
          <h2>{lang === 'en' ? 'How to Build from Your Collection' : 'Come Costruire dalla Tua Collezione'}</h2>
          <div className="steps-grid">
            {[
              lang === 'en' ? 'Upload your collection (CSV/Excel/Arena)' : 'Carica la tua collezione (CSV/Excel/Arena)',
              lang === 'en' ? `Search for "${data.name}" decks` : `Cerca mazzi "${data.name}"`,
              lang === 'en' ? 'See your match % and missing cards' : 'Vedi la % di completamento e le carte mancanti',
              lang === 'en' ? 'Build and export your optimized deck' : 'Costruisci ed esporta il tuo mazzo ottimizzato',
            ].map((step, i) => (
              <div className="step-card" key={i}>
                <div className="step-number">{i + 1}</div>
                <p>{step}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="related-formats">
        <div className="container">
          <h2>{lang === 'en' ? 'Other Popular Commanders' : 'Altri Comandanti Popolari'}</h2>
          <div className="formats-links">
            {relatedCommanders.map(key => (
              <Link
                key={key}
                to={lang === 'en'
                  ? `/en/${COMMANDERS[key].en.urlSlug}`
                  : `/it/${COMMANDERS[key].it.urlSlugIt}`}
              >
                {COMMANDERS[key].name} →
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

export { COMMANDERS };
export default CommanderPage;
