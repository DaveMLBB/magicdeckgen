import { Link } from 'react-router-dom';
import SEOHead from '../../../components/seo/SEOHead';
import HreflangTags from '../../../components/seo/HreflangTags';
import StructuredData from '../../../components/seo/StructuredData';
import PublicNav from '../../../components/public/PublicNav';
import CTASection from '../../../components/public/CTASection';
import Breadcrumbs from '../../../components/seo/Breadcrumbs';
import '../PublicPages.css';

const MATCHUPS = {
  'aggro-vs-control': {
    deck1: 'Aggro',
    deck2: 'Control',
    icon1: '⚡',
    icon2: '🛡️',
    en: {
      h1: 'MTG Aggro vs Control: Matchup Guide & Best Sideboard Cards',
      subtitle: 'Master the aggro vs control matchup in MTG. Learn the key lines, best sideboard cards, and how to build your deck to win this fundamental matchup.',
      metaTitle: 'MTG Aggro vs Control Matchup Guide | Best Sideboard Cards',
      metaDescription: 'Master the MTG aggro vs control matchup. Learn key lines, best sideboard cards for both sides, and how to build your deck to win this fundamental matchup.',
      overview: 'The aggro vs control matchup is one of the most fundamental in Magic. Aggro wants to win before control can stabilize; control wants to survive the early game and take over with card advantage.',
      aggroAdvantages: [
        'Faster clock forces control to have answers every turn',
        'Burn spells bypass blockers and close out games',
        'Cheap threats are hard to answer one-for-one profitably',
        'Sideboard hate (Eidolon of the Great Revel) punishes control\'s high-CMC spells',
      ],
      controlAdvantages: [
        'Sweepers answer multiple threats at once',
        'Counterspells stop key aggro plays',
        'Card draw generates more answers than aggro has threats',
        'Lifegain buys time to stabilize',
      ],
      aggroSideboard: ['Eidolon of the Great Revel', 'Skullcrack', 'Searing Blood', 'Roiling Vortex'],
      controlSideboard: ['Timely Reinforcements', 'Leyline of Sanctity', 'Celestial Purge', 'Anger of the Gods'],
      keyTip: 'Aggro should keep hands with 2-3 lands and multiple 1-drops. Control should mulligan aggressively for sweepers and lifegain.',
      urlSlug: 'mtg-matchup-aggro-vs-control',
      urlSlugIt: 'mtg-matchup-aggro-contro-control',
    },
    it: {
      h1: 'MTG Aggro vs Control: Guida al Matchup e Migliori Carte Sideboard',
      subtitle: 'Padroneggia il matchup aggro vs control in MTG. Impara le linee chiave, le migliori carte sideboard e come costruire il tuo mazzo per vincere questo matchup fondamentale.',
      metaTitle: 'MTG Aggro vs Control Guida Matchup | Migliori Carte Sideboard',
      metaDescription: 'Padroneggia il matchup MTG aggro vs control. Impara le linee chiave, le migliori carte sideboard per entrambi i lati e come costruire il tuo mazzo per vincere.',
      overview: 'Il matchup aggro vs control è uno dei più fondamentali in Magic. L\'aggro vuole vincere prima che il control possa stabilizzarsi; il control vuole sopravvivere al gioco iniziale e prendere il controllo con il vantaggio carte.',
      aggroAdvantages: [
        'Un clock più veloce costringe il control ad avere risposte ogni turno',
        'Le magie brucianti aggirano i bloccanti e chiudono le partite',
        'Le minacce economiche sono difficili da rispondere proficuamente uno-per-uno',
        'L\'hate in sideboard (Eidolon of the Great Revel) punisce le magie ad alto CMC del control',
      ],
      controlAdvantages: [
        'Gli sweeper rispondono a più minacce contemporaneamente',
        'Le contromagie fermano le giocate chiave dell\'aggro',
        'La pesca carte genera più risposte di quante minacce abbia l\'aggro',
        'Il guadagno vita compra tempo per stabilizzarsi',
      ],
      aggroSideboard: ['Eidolon of the Great Revel', 'Skullcrack', 'Searing Blood', 'Roiling Vortex'],
      controlSideboard: ['Timely Reinforcements', 'Leyline of Sanctity', 'Celestial Purge', 'Anger of the Gods'],
      keyTip: 'L\'aggro dovrebbe tenere mani con 2-3 terre e più 1-drop. Il control dovrebbe fare mulligan aggressivamente per sweeper e guadagno vita.',
      urlSlug: 'mtg-matchup-aggro-vs-control',
      urlSlugIt: 'mtg-matchup-aggro-contro-control',
    }
  },
  'combo-vs-control': {
    deck1: 'Combo',
    deck2: 'Control',
    icon1: '🔄',
    icon2: '🛡️',
    en: {
      h1: 'MTG Combo vs Control: Matchup Guide & Best Sideboard Cards',
      subtitle: 'Master the combo vs control matchup in MTG. Learn when to go off, how to protect your combo, and the best sideboard cards for both sides.',
      metaTitle: 'MTG Combo vs Control Matchup Guide | Best Sideboard Cards',
      metaDescription: 'Master the MTG combo vs control matchup. Learn when to go off, how to protect your combo, and the best sideboard cards for both sides of this skill-intensive matchup.',
      overview: 'The combo vs control matchup is a battle of resources and timing. Combo wants to assemble its pieces before control can set up full countermagic; control wants to counter key pieces and grind combo out of resources.',
      aggroAdvantages: [
        'Combo can win through counterspells with protection spells',
        'Multiple combo lines make it hard for control to counter everything',
        'Discard strips control\'s counterspells before going off',
        'Fast mana enables turn 2-3 wins before control is set up',
      ],
      controlAdvantages: [
        'Counterspells stop combo pieces at instant speed',
        'Discard disrupts combo\'s hand before they can execute',
        'Surgical Extraction removes all copies of key combo pieces',
        'Card draw finds answers faster than combo finds pieces',
      ],
      aggroSideboard: ['Veil of Summer', 'Pact of Negation', 'Silence', 'Thoughtseize'],
      controlSideboard: ['Surgical Extraction', 'Grafdigger\'s Cage', 'Rest in Peace', 'Damping Sphere'],
      keyTip: 'Combo should use discard to clear the way before going off. Control should prioritize countering tutors over combo pieces.',
      urlSlug: 'mtg-matchup-combo-vs-control',
      urlSlugIt: 'mtg-matchup-combo-contro-control',
    },
    it: {
      h1: 'MTG Combo vs Control: Guida al Matchup e Migliori Carte Sideboard',
      subtitle: 'Padroneggia il matchup combo vs control in MTG. Impara quando eseguire il combo, come proteggerlo e le migliori carte sideboard per entrambi i lati.',
      metaTitle: 'MTG Combo vs Control Guida Matchup | Migliori Carte Sideboard',
      metaDescription: 'Padroneggia il matchup MTG combo vs control. Impara quando eseguire il combo, come proteggerlo e le migliori carte sideboard per questo matchup intenso.',
      overview: 'Il matchup combo vs control è una battaglia di risorse e tempismo. Il combo vuole assemblare i suoi pezzi prima che il control possa impostare la piena contromagia; il control vuole contrastare i pezzi chiave.',
      aggroAdvantages: [
        'Il combo può vincere attraverso le contromagie con magie di protezione',
        'Più linee combo rendono difficile per il control contrastare tutto',
        'Il discard rimuove le contromagie del control prima di eseguire il combo',
        'Il mana veloce abilita vittorie al turno 2-3 prima che il control sia impostato',
      ],
      controlAdvantages: [
        'Le contromagie fermano i pezzi combo a velocità istantanea',
        'Il discard disturba la mano del combo prima che possa eseguire',
        'Surgical Extraction rimuove tutte le copie dei pezzi combo chiave',
        'La pesca carte trova risposte più velocemente di quanto il combo trovi pezzi',
      ],
      aggroSideboard: ['Veil of Summer', 'Pact of Negation', 'Silence', 'Thoughtseize'],
      controlSideboard: ['Surgical Extraction', 'Grafdigger\'s Cage', 'Rest in Peace', 'Damping Sphere'],
      keyTip: 'Il combo dovrebbe usare il discard per liberare la strada prima di eseguire. Il control dovrebbe dare priorità al contrasto dei tutor rispetto ai pezzi combo.',
      urlSlug: 'mtg-matchup-combo-vs-control',
      urlSlugIt: 'mtg-matchup-combo-contro-control',
    }
  },
  'aggro-vs-midrange': {
    deck1: 'Aggro',
    deck2: 'Midrange',
    icon1: '⚡',
    icon2: '⚖️',
    en: {
      h1: 'MTG Aggro vs Midrange: Matchup Guide & Best Sideboard Cards',
      subtitle: 'Master the aggro vs midrange matchup in MTG. Learn how to stay ahead of midrange\'s value engine and the best sideboard cards for both sides.',
      metaTitle: 'MTG Aggro vs Midrange Matchup Guide | Best Sideboard Cards',
      metaDescription: 'Master the MTG aggro vs midrange matchup. Learn how to stay ahead of midrange\'s value engine and the best sideboard cards for both sides of this common matchup.',
      overview: 'Aggro vs midrange is a race between aggro\'s speed and midrange\'s efficiency. Aggro wants to win before midrange\'s 2-for-1s take over; midrange wants to trade efficiently and stabilize with a planeswalker or value creature.',
      aggroAdvantages: [
        'Faster clock than midrange can answer in the early turns',
        'Burn spells go over the top of midrange\'s blockers',
        'Cheap threats force midrange to spend mana reactively',
        'Sideboard hate disrupts midrange\'s discard and removal',
      ],
      controlAdvantages: [
        'Efficient removal answers aggro\'s threats profitably',
        'Discard strips aggro\'s best threats before they\'re played',
        'Tarmogoyf and similar creatures block efficiently',
        'Planeswalkers generate value that aggro can\'t answer',
      ],
      aggroSideboard: ['Skullcrack', 'Searing Blood', 'Relic of Progenitus', 'Smash to Smithereens'],
      controlSideboard: ['Collective Brutality', 'Timely Reinforcements', 'Engineered Explosives', 'Plague Engineer'],
      keyTip: 'Aggro should prioritize burn spells over creatures post-board. Midrange should bring in lifegain and additional removal.',
      urlSlug: 'mtg-matchup-aggro-vs-midrange',
      urlSlugIt: 'mtg-matchup-aggro-contro-midrange',
    },
    it: {
      h1: 'MTG Aggro vs Midrange: Guida al Matchup e Migliori Carte Sideboard',
      subtitle: 'Padroneggia il matchup aggro vs midrange in MTG. Impara come restare avanti al motore di valore del midrange e le migliori carte sideboard per entrambi i lati.',
      metaTitle: 'MTG Aggro vs Midrange Guida Matchup | Migliori Carte Sideboard',
      metaDescription: 'Padroneggia il matchup MTG aggro vs midrange. Impara come restare avanti al motore di valore del midrange e le migliori carte sideboard per questo matchup comune.',
      overview: 'Aggro vs midrange è una gara tra la velocità dell\'aggro e l\'efficienza del midrange. L\'aggro vuole vincere prima che i 2-per-1 del midrange prendano il sopravvento; il midrange vuole scambiare efficientemente e stabilizzarsi.',
      aggroAdvantages: [
        'Clock più veloce di quanto il midrange possa rispondere nei turni iniziali',
        'Le magie brucianti superano i bloccanti del midrange',
        'Le minacce economiche costringono il midrange a spendere mana reattivamente',
        'L\'hate in sideboard disturba il discard e la rimozione del midrange',
      ],
      controlAdvantages: [
        'La rimozione efficiente risponde alle minacce dell\'aggro proficuamente',
        'Il discard rimuove le migliori minacce dell\'aggro prima che vengano giocate',
        'Tarmogoyf e creature simili bloccano efficientemente',
        'I planeswalker generano valore che l\'aggro non può rispondere',
      ],
      aggroSideboard: ['Skullcrack', 'Searing Blood', 'Relic of Progenitus', 'Smash to Smithereens'],
      controlSideboard: ['Collective Brutality', 'Timely Reinforcements', 'Engineered Explosives', 'Plague Engineer'],
      keyTip: 'L\'aggro dovrebbe dare priorità alle magie brucianti rispetto alle creature dopo il sideboard. Il midrange dovrebbe portare guadagno vita e rimozioni aggiuntive.',
      urlSlug: 'mtg-matchup-aggro-vs-midrange',
      urlSlugIt: 'mtg-matchup-aggro-contro-midrange',
    }
  }
};

const MatchupPage = ({ matchup, lang = 'en' }) => {
  const data = MATCHUPS[matchup];
  if (!data) return null;
  const t = data[lang];

  const canonicalPath = lang === 'en' ? `/en/${t.urlSlug}` : `/it/${t.urlSlugIt}`;

  const breadcrumbItems = [
    { label: lang === 'en' ? 'Matchups' : 'Matchup', url: null },
    { label: `${data.deck1} vs ${data.deck2}`, url: null }
  ];

  const structuredData = {
    name: t.metaTitle,
    description: t.metaDescription,
  };

  const otherMatchups = Object.keys(MATCHUPS).filter(k => k !== matchup);

  return (
    <div className="seo-public-page">
      <SEOHead
        title={t.metaTitle}
        description={t.metaDescription}
        canonical={canonicalPath}
        lang={lang}
        keywords={`MTG ${data.deck1} vs ${data.deck2}, matchup guide, sideboard, MTG strategy`}
      />
      <HreflangTags
        enUrl={`/en/${t.urlSlug}`}
        itUrl={`/it/${t.urlSlugIt}`}
      />
      <StructuredData type="WebPage" data={structuredData} />

      <PublicNav lang={lang} currentPath={canonicalPath} />

      <section className="format-hero" style={{ background: 'linear-gradient(135deg, #1a202c 0%, #2d3748 100%)' }}>
        <div className="container">
          <Breadcrumbs items={breadcrumbItems} lang={lang} />
          <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>
            {data.icon1} <span style={{ opacity: 0.5 }}>vs</span> {data.icon2}
          </div>
          <h1>{t.h1}</h1>
          <p className="format-subtitle">{t.subtitle}</p>
          <Link to="/app" className="format-cta" style={{ marginTop: '2rem', display: 'inline-block', background: '#667eea', color: '#fff' }}>
            {lang === 'en' ? 'Build Your Deck →' : 'Costruisci il Tuo Mazzo →'}
          </Link>
        </div>
      </section>

      <section className="format-about">
        <div className="container">
          <h2>{lang === 'en' ? 'Matchup Overview' : 'Panoramica del Matchup'}</h2>
          <p className="format-description">{t.overview}</p>
        </div>
      </section>

      <section style={{ padding: '4rem 2rem', background: 'rgba(26,26,46,0.5)' }}>
        <div className="container">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '3rem' }}>
            <div>
              <h2 style={{ color: '#fc8181', textAlign: 'left', fontSize: '1.8rem', marginBottom: '1.5rem' }}>
                {data.icon1} {lang === 'en' ? `${data.deck1} Advantages` : `Vantaggi ${data.deck1}`}
              </h2>
              <ul style={{ listStyle: 'none', padding: 0 }}>
                {t.aggroAdvantages.map((adv, i) => (
                  <li key={i} style={{ padding: '0.75rem 1rem', marginBottom: '0.5rem', background: 'rgba(252,129,129,0.1)', borderLeft: '3px solid #fc8181', borderRadius: '4px', color: '#e2e8f0', fontSize: '0.95rem' }}>
                    {adv}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h2 style={{ color: '#63b3ed', textAlign: 'left', fontSize: '1.8rem', marginBottom: '1.5rem' }}>
                {data.icon2} {lang === 'en' ? `${data.deck2} Advantages` : `Vantaggi ${data.deck2}`}
              </h2>
              <ul style={{ listStyle: 'none', padding: 0 }}>
                {t.controlAdvantages.map((adv, i) => (
                  <li key={i} style={{ padding: '0.75rem 1rem', marginBottom: '0.5rem', background: 'rgba(99,179,237,0.1)', borderLeft: '3px solid #63b3ed', borderRadius: '4px', color: '#e2e8f0', fontSize: '0.95rem' }}>
                    {adv}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      <section style={{ padding: '4rem 2rem' }}>
        <div className="container">
          <h2>{lang === 'en' ? 'Key Sideboard Cards' : 'Carte Sideboard Chiave'}</h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '3rem' }}>
            <div>
              <h3 style={{ color: '#fc8181', marginBottom: '1rem' }}>{data.icon1} {data.deck1} Sideboard</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {t.aggroSideboard.map((card, i) => (
                  <div key={i} style={{ padding: '0.6rem 1rem', background: 'rgba(42,42,62,0.8)', borderRadius: '8px', color: '#e2e8f0', fontSize: '0.95rem', border: '1px solid rgba(252,129,129,0.2)' }}>
                    🃏 {card}
                  </div>
                ))}
              </div>
            </div>
            <div>
              <h3 style={{ color: '#63b3ed', marginBottom: '1rem' }}>{data.icon2} {data.deck2} Sideboard</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {t.controlSideboard.map((card, i) => (
                  <div key={i} style={{ padding: '0.6rem 1rem', background: 'rgba(42,42,62,0.8)', borderRadius: '8px', color: '#e2e8f0', fontSize: '0.95rem', border: '1px solid rgba(99,179,237,0.2)' }}>
                    🃏 {card}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section style={{ padding: '3rem 2rem', background: 'rgba(102,126,234,0.1)', borderTop: '1px solid rgba(102,126,234,0.2)' }}>
        <div className="container" style={{ textAlign: 'center' }}>
          <h2>💡 {lang === 'en' ? 'Key Tip' : 'Consiglio Chiave'}</h2>
          <p style={{ fontSize: '1.2rem', color: '#c7d2fe', maxWidth: '700px', margin: '0 auto', lineHeight: '1.7' }}>
            {t.keyTip}
          </p>
        </div>
      </section>

      <section className="related-formats">
        <div className="container">
          <h2>{lang === 'en' ? 'Other Matchup Guides' : 'Altre Guide Matchup'}</h2>
          <div className="formats-links">
            {otherMatchups.map(key => (
              <Link
                key={key}
                to={lang === 'en'
                  ? `/en/${MATCHUPS[key].en.urlSlug}`
                  : `/it/${MATCHUPS[key].it.urlSlugIt}`}
              >
                {MATCHUPS[key].icon1} vs {MATCHUPS[key].icon2} {MATCHUPS[key].deck1} vs {MATCHUPS[key].deck2} →
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

export { MATCHUPS };
export default MatchupPage;
