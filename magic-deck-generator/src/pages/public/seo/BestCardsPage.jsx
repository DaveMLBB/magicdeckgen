import { Link } from 'react-router-dom';
import SEOHead from '../../../components/seo/SEOHead';
import HreflangTags from '../../../components/seo/HreflangTags';
import StructuredData from '../../../components/seo/StructuredData';
import PublicNav from '../../../components/public/PublicNav';
import CTASection from '../../../components/public/CTASection';
import Breadcrumbs from '../../../components/seo/Breadcrumbs';
import '../PublicPages.css';

const BEST_CARDS_TOPICS = {
  commander: {
    icon: '👑',
    en: {
      h1: 'Best Cards for Commander (EDH): The Ultimate Staples List',
      subtitle: 'Discover the best cards for Commander EDH across all categories. From ramp to removal to win conditions — the staples every Commander player needs.',
      metaTitle: 'Best Cards for Commander EDH | Ultimate Staples List 2026',
      metaDescription: 'The best cards for Commander EDH in 2026. Complete staples list covering ramp, removal, card draw, and win conditions. Find which staples you already own.',
      intro: 'Commander staples are cards that are powerful enough to include in almost any deck regardless of strategy. Knowing which staples you own helps you build better decks faster.',
      categories: [
        {
          name: 'Ramp',
          icon: '🌿',
          cards: [
            { name: 'Sol Ring', why: 'The best mana rock in Commander — produces 2 colorless for 1 mana' },
            { name: 'Arcane Signet', why: 'Produces mana of your commander\'s colors for just 2 mana' },
            { name: 'Cultivate / Kodama\'s Reach', why: 'Ramp and fix your mana base simultaneously' },
            { name: 'Mana Crypt', why: 'Free 2 mana every turn — the most powerful ramp in the format' },
          ]
        },
        {
          name: 'Card Draw',
          icon: '📚',
          cards: [
            { name: 'Rhystic Study', why: 'Draws a card whenever opponents cast spells unless they pay 1' },
            { name: 'Mystic Remora', why: 'Early game draw engine that taxes opponents\' noncreature spells' },
            { name: 'Sylvan Library', why: 'Powerful card selection for 2 mana in green' },
            { name: 'Necropotence', why: 'Pay life to draw cards — the most powerful draw engine in black' },
          ]
        },
        {
          name: 'Removal',
          icon: '⚔️',
          cards: [
            { name: 'Swords to Plowshares', why: 'The best single-target removal in white — exile for 1 mana' },
            { name: 'Cyclonic Rift', why: 'One-sided board wipe at instant speed — the best blue removal' },
            { name: 'Toxic Deluge', why: 'Flexible sweeper that scales with your life total' },
            { name: 'Chaos Warp', why: 'Red\'s answer to any permanent type' },
          ]
        },
        {
          name: 'Win Conditions',
          icon: '🏆',
          cards: [
            { name: 'Thassa\'s Oracle', why: 'Win with empty library — pairs with Demonic Consultation' },
            { name: 'Craterhoof Behemoth', why: 'Instant win with a board of creatures in green' },
            { name: 'Aetherflux Reservoir', why: 'Storm win condition that gains life and deals 50 damage' },
            { name: 'Exsanguinate / Torment of Hailfire', why: 'X-spell finishers with infinite mana' },
          ]
        }
      ],
      urlSlug: 'best-cards-for-commander',
      urlSlugIt: 'migliori-carte-per-commander',
    },
    it: {
      h1: 'Migliori Carte per Commander (EDH): La Lista Definitiva degli Staple',
      subtitle: 'Scopri le migliori carte per Commander EDH in tutte le categorie. Da rampa a rimozione a condizioni di vittoria — gli staple che ogni giocatore Commander deve avere.',
      metaTitle: 'Migliori Carte per Commander EDH | Lista Staple Definitiva 2026',
      metaDescription: 'Le migliori carte per Commander EDH nel 2026. Lista completa degli staple che coprono rampa, rimozione, pesca carte e condizioni di vittoria. Scopri quali staple possiedi già.',
      intro: 'Gli staple di Commander sono carte abbastanza potenti da includere in quasi qualsiasi mazzo indipendentemente dalla strategia. Sapere quali staple possiedi ti aiuta a costruire mazzi migliori più velocemente.',
      categories: [
        {
          name: 'Rampa',
          icon: '🌿',
          cards: [
            { name: 'Sol Ring', why: 'Il miglior mana rock in Commander — produce 2 mana incolore per 1 mana' },
            { name: 'Arcane Signet', why: 'Produce mana dei colori del tuo comandante per soli 2 mana' },
            { name: 'Cultivate / Kodama\'s Reach', why: 'Rampa e fissa la tua base di mana simultaneamente' },
            { name: 'Mana Crypt', why: '2 mana gratuiti ogni turno — la rampa più potente nel formato' },
          ]
        },
        {
          name: 'Pesca Carte',
          icon: '📚',
          cards: [
            { name: 'Rhystic Study', why: 'Pesca una carta ogni volta che gli avversari lanciano magie a meno che non paghino 1' },
            { name: 'Mystic Remora', why: 'Motore di pesca nel gioco iniziale che tassa le magie non-creatura degli avversari' },
            { name: 'Sylvan Library', why: 'Potente selezione carte per 2 mana nel verde' },
            { name: 'Necropotence', why: 'Paga vita per pescare carte — il motore di pesca più potente nel nero' },
          ]
        },
        {
          name: 'Rimozione',
          icon: '⚔️',
          cards: [
            { name: 'Swords to Plowshares', why: 'La migliore rimozione a bersaglio singolo nel bianco — esilio per 1 mana' },
            { name: 'Cyclonic Rift', why: 'Pulizia del campo unilaterale a velocità istantanea — la migliore rimozione blu' },
            { name: 'Toxic Deluge', why: 'Sweeper flessibile che scala con il tuo totale vita' },
            { name: 'Chaos Warp', why: 'La risposta del rosso a qualsiasi tipo di permanente' },
          ]
        },
        {
          name: 'Condizioni di Vittoria',
          icon: '🏆',
          cards: [
            { name: 'Thassa\'s Oracle', why: 'Vinci con la libreria vuota — si combina con Demonic Consultation' },
            { name: 'Craterhoof Behemoth', why: 'Vittoria istantanea con un campo di creature nel verde' },
            { name: 'Aetherflux Reservoir', why: 'Condizione di vittoria storm che guadagna vita e infligge 50 danni' },
            { name: 'Exsanguinate / Torment of Hailfire', why: 'Finisher con magie X con mana infinito' },
          ]
        }
      ],
      urlSlug: 'best-cards-for-commander',
      urlSlugIt: 'migliori-carte-per-commander',
    }
  },
  modern: {
    icon: '⚡',
    en: {
      h1: 'Best Cards for Modern MTG: Essential Staples by Category',
      subtitle: 'The best cards for Modern MTG in 2026. From fetchlands to Force of Negation — the staples that define the Modern format.',
      metaTitle: 'Best Cards for Modern MTG | Essential Staples 2026',
      metaDescription: 'The best cards for Modern MTG in 2026. Essential staples by category — lands, removal, counterspells, and threats. Find which Modern staples you already own.',
      intro: 'Modern staples are the cards that appear across multiple top-tier decks. Owning these cards gives you flexibility to build multiple competitive decks.',
      categories: [
        {
          name: 'Lands',
          icon: '🏔️',
          cards: [
            { name: 'Fetchlands (Scalding Tarn, etc.)', why: 'Thin your deck and fix mana — essential in any 2+ color deck' },
            { name: 'Shocklands (Steam Vents, etc.)', why: 'Dual lands that enter untapped — the backbone of Modern manabases' },
            { name: 'Urza\'s Saga', why: 'Generates constructs and tutors for artifacts — best land in Modern' },
            { name: 'Cavern of Souls', why: 'Makes tribal spells uncounterable — essential in creature-heavy decks' },
          ]
        },
        {
          name: 'Removal',
          icon: '⚔️',
          cards: [
            { name: 'Lightning Bolt', why: 'The best burn spell in Modern — 3 damage for 1 mana at instant speed' },
            { name: 'Fatal Push', why: 'Kills most Modern threats for 1 black mana' },
            { name: 'Prismatic Ending', why: 'Flexible exile removal for any permanent with CMC ≤ colors spent' },
            { name: 'Solitude', why: 'Free exile removal with pitch mechanic — best white removal' },
          ]
        },
        {
          name: 'Threats',
          icon: '🐉',
          cards: [
            { name: 'Ragavan, Nimble Pilferer', why: 'The best 1-drop in Modern — generates mana and card advantage' },
            { name: 'Dragon\'s Rage Channeler', why: 'Cheap threat that becomes a 3/3 flyer with delirium' },
            { name: 'Murktide Regent', why: 'Massive flying threat that grows with spells in graveyard' },
            { name: 'Orcish Bowmasters', why: 'Punishes card draw and generates tokens — format staple' },
          ]
        },
        {
          name: 'Interaction',
          icon: '🛡️',
          cards: [
            { name: 'Force of Negation', why: 'Free counterspell for noncreature spells — essential in blue decks' },
            { name: 'Counterspell', why: 'Hard counter for 2 mana — now legal and heavily played in Modern' },
            { name: 'Thoughtseize', why: 'Discard any nonland card — the best hand disruption in the format' },
            { name: 'Chalice of the Void', why: 'Shuts down 1-mana spells — devastating against aggro and combo' },
          ]
        }
      ],
      urlSlug: 'best-cards-for-modern',
      urlSlugIt: 'migliori-carte-per-modern',
    },
    it: {
      h1: 'Migliori Carte per Modern MTG: Staple Essenziali per Categoria',
      subtitle: 'Le migliori carte per Modern MTG nel 2026. Dalle fetchland a Force of Negation — gli staple che definiscono il formato Modern.',
      metaTitle: 'Migliori Carte per Modern MTG | Staple Essenziali 2026',
      metaDescription: 'Le migliori carte per Modern MTG nel 2026. Staple essenziali per categoria — terre, rimozioni, contromagie e minacce. Scopri quali staple Modern possiedi già.',
      intro: 'Gli staple di Modern sono le carte che appaiono in più mazzi di alto livello. Possedere queste carte ti dà flessibilità per costruire più mazzi competitivi.',
      categories: [
        {
          name: 'Terre',
          icon: '🏔️',
          cards: [
            { name: 'Fetchland (Scalding Tarn, ecc.)', why: 'Assottiglia il mazzo e fissa il mana — essenziale in qualsiasi mazzo 2+ colori' },
            { name: 'Shockland (Steam Vents, ecc.)', why: 'Terre doppie che entrano non-tappate — la spina dorsale delle manabase Modern' },
            { name: 'Urza\'s Saga', why: 'Genera costrutti e cerca artefatti — la migliore terra in Modern' },
            { name: 'Cavern of Souls', why: 'Rende le magie tribali non contrastabili — essenziale nei mazzi creature-heavy' },
          ]
        },
        {
          name: 'Rimozione',
          icon: '⚔️',
          cards: [
            { name: 'Lightning Bolt', why: 'La migliore magia bruciante in Modern — 3 danni per 1 mana a velocità istantanea' },
            { name: 'Fatal Push', why: 'Uccide la maggior parte delle minacce Modern per 1 mana nero' },
            { name: 'Prismatic Ending', why: 'Rimozione esilio flessibile per qualsiasi permanente con CMC ≤ colori spesi' },
            { name: 'Solitude', why: 'Rimozione esilio gratuita con meccanica pitch — migliore rimozione bianca' },
          ]
        },
        {
          name: 'Minacce',
          icon: '🐉',
          cards: [
            { name: 'Ragavan, Nimble Pilferer', why: 'Il miglior 1-drop in Modern — genera mana e vantaggio carte' },
            { name: 'Dragon\'s Rage Channeler', why: 'Minaccia economica che diventa un 3/3 volante con delirium' },
            { name: 'Murktide Regent', why: 'Enorme minaccia volante che cresce con le magie nel cimitero' },
            { name: 'Orcish Bowmasters', why: 'Punisce la pesca carte e genera token — staple del formato' },
          ]
        },
        {
          name: 'Interazione',
          icon: '🛡️',
          cards: [
            { name: 'Force of Negation', why: 'Contromagia gratuita per magie non-creatura — essenziale nei mazzi blu' },
            { name: 'Counterspell', why: 'Contro duro per 2 mana — ora legale e molto giocato in Modern' },
            { name: 'Thoughtseize', why: 'Scarta qualsiasi carta non-terra — la migliore disruzione della mano nel formato' },
            { name: 'Chalice of the Void', why: 'Blocca le magie da 1 mana — devastante contro aggro e combo' },
          ]
        }
      ],
      urlSlug: 'best-cards-for-modern',
      urlSlugIt: 'migliori-carte-per-modern',
    }
  }
};

const BestCardsPage = ({ topic, lang = 'en' }) => {
  const data = BEST_CARDS_TOPICS[topic];
  if (!data) return null;
  const t = data[lang];

  const canonicalPath = lang === 'en' ? `/en/${t.urlSlug}` : `/it/${t.urlSlugIt}`;

  const breadcrumbItems = [
    { label: lang === 'en' ? 'Best Cards' : 'Migliori Carte', url: null },
    { label: topic.charAt(0).toUpperCase() + topic.slice(1), url: null }
  ];

  const structuredData = {
    name: t.metaTitle,
    description: t.metaDescription,
  };

  const otherTopics = Object.keys(BEST_CARDS_TOPICS).filter(k => k !== topic);

  return (
    <div className="seo-public-page">
      <SEOHead
        title={t.metaTitle}
        description={t.metaDescription}
        canonical={canonicalPath}
        lang={lang}
        keywords={`best cards for ${topic}, MTG staples, ${topic} staples, MTG best cards`}
      />
      <HreflangTags
        enUrl={`/en/${t.urlSlug}`}
        itUrl={`/it/${t.urlSlugIt}`}
      />
      <StructuredData type="WebPage" data={structuredData} />

      <PublicNav lang={lang} currentPath={canonicalPath} />

      <section className="format-hero" style={{ background: 'linear-gradient(135deg, #1a1a2e 0%, #2d1b69 100%)' }}>
        <div className="container">
          <Breadcrumbs items={breadcrumbItems} lang={lang} />
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>{data.icon}</div>
          <h1>{t.h1}</h1>
          <p className="format-subtitle">{t.subtitle}</p>
          <Link to="/app" className="format-cta" style={{ marginTop: '2rem', display: 'inline-block', background: '#9f7aea', color: '#fff' }}>
            {lang === 'en' ? 'Check Your Collection →' : 'Controlla la Tua Collezione →'}
          </Link>
        </div>
      </section>

      <section className="format-about">
        <div className="container">
          <p className="format-description" style={{ textAlign: 'center', maxWidth: '800px', margin: '0 auto' }}>{t.intro}</p>
        </div>
      </section>

      {t.categories.map((cat, ci) => (
        <section key={ci} style={{ padding: '4rem 2rem', background: ci % 2 === 0 ? 'rgba(26,26,46,0.5)' : 'transparent' }}>
          <div className="container">
            <h2>{cat.icon} {cat.name}</h2>
            <div className="benefits-grid">
              {cat.cards.map((card, i) => (
                <div key={i} style={{ background: 'linear-gradient(145deg, rgba(42,42,62,0.9), rgba(26,26,46,0.7))', padding: '1.75rem', borderRadius: '12px', border: '1px solid rgba(159,122,234,0.2)', transition: 'all 0.3s' }}>
                  <strong style={{ color: '#c4b5fd', display: 'block', marginBottom: '0.5rem', fontSize: '1.05rem' }}>
                    🃏 {card.name}
                  </strong>
                  <p style={{ color: '#94a3b8', fontSize: '0.95rem', lineHeight: '1.6', margin: 0 }}>{card.why}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      ))}

      <section className="related-formats">
        <div className="container">
          <h2>{lang === 'en' ? 'Best Cards for Other Formats' : 'Migliori Carte per Altri Formati'}</h2>
          <div className="formats-links">
            {otherTopics.map(key => (
              <Link
                key={key}
                to={lang === 'en'
                  ? `/en/${BEST_CARDS_TOPICS[key].en.urlSlug}`
                  : `/it/${BEST_CARDS_TOPICS[key].it.urlSlugIt}`}
              >
                {BEST_CARDS_TOPICS[key].icon} {lang === 'en' ? `Best Cards for ${key.charAt(0).toUpperCase() + key.slice(1)}` : `Migliori Carte per ${key.charAt(0).toUpperCase() + key.slice(1)}`} →
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

export { BEST_CARDS_TOPICS };
export default BestCardsPage;
