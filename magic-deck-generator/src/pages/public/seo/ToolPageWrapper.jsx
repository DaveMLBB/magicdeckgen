import { Link } from 'react-router-dom';
import SEOHead from '../../../components/seo/SEOHead';
import HreflangTags from '../../../components/seo/HreflangTags';
import PublicNav from '../../../components/public/PublicNav';
import '../PublicPages.css';
import './ToolPageWrapper.css';

// All tool content — real, useful text for SEO
const TOOL_CONTENT = {
  'deck-builder': {
    en: {
      title: 'AI MTG Deck Builder | Build Any Deck from a Text Description',
      description: 'Build complete Magic: The Gathering decks with AI. Describe your strategy in plain text and get a full 60 or 100-card deck with sideboard, key cards, and upgrade path.',
      h1: 'AI MTG Deck Builder',
      subtitle: 'Describe the deck you want — "red aggro Modern", "Atraxa Commander with +1/+1 counters", "budget Pauper control" — and AI builds a complete, tournament-ready deck list in seconds.',
      howTitle: 'How the AI Deck Builder Works',
      steps: [
        { icon: '✍️', title: 'Describe your deck', desc: 'Type your strategy in plain text. Include format, colors, archetype, budget, or any specific cards you want to build around.' },
        { icon: '🤖', title: 'AI generates the deck', desc: 'Our AI analyzes thousands of tournament lists and card interactions to build a coherent, optimized deck matching your description.' },
        { icon: '📋', title: 'Review and export', desc: 'Get a full card list with quantities, sideboard, strategy notes, key cards, and upgrade suggestions. Export to Arena or MTGO instantly.' },
        { icon: '🔄', title: 'Iterate with chat', desc: 'Ask follow-up questions: "make it faster", "add more removal", "what are the key combos?" — the AI remembers the full conversation.' },
      ],
      useCasesTitle: 'What You Can Build',
      useCases: [
        '60-card decks for Standard, Modern, Pioneer, Legacy, Vintage, Pauper',
        '100-card Commander / EDH decks with any commander',
        'Budget decks under $25, $50, or $100',
        'Tribal decks (Dragons, Elves, Vampires, Merfolk, Goblins...)',
        'Combo decks around specific card interactions',
        'Decks built only from cards in your collection',
      ],
      faqTitle: 'Frequently Asked Questions',
      faqs: [
        { q: 'Can the AI build a deck using only my collection?', a: 'Yes. After signing up, enable "Analyze full collection" to restrict the AI to only cards you own. It will build the best possible deck from your available cards.' },
        { q: 'What formats are supported?', a: 'All major formats: Standard, Pioneer, Modern, Legacy, Vintage, Commander/EDH, cEDH, Pauper, Premodern, Highlander, Historic, Explorer, Brawl.' },
        { q: 'How accurate are the deck lists?', a: 'The AI is trained on thousands of tournament-winning lists and understands card synergies, mana curves, and format legality. Results are competitive-quality starting points.' },
        { q: 'Can I ask for budget alternatives?', a: 'Yes. Just specify your budget: "build a Modern aggro deck under $50" or "replace the fetchlands with budget alternatives".' },
        { q: 'How many free tries do I get?', a: '2 free tries per month without registration. Sign up free to get 100 welcome tokens — each deck build costs 5 tokens.' },
      ],
      canonicalPath: '/en/try/deck-builder',
      itPath: '/try/deck-builder',
    },
    it: {
      title: 'AI Costruttore Mazzi MTG | Costruisci Qualsiasi Mazzo da una Descrizione',
      description: 'Costruisci mazzi Magic: The Gathering completi con l\'AI. Descrivi la tua strategia in testo libero e ottieni un mazzo completo da 60 o 100 carte con sideboard, carte chiave e percorso di upgrade.',
      h1: 'AI Costruttore Mazzi MTG',
      subtitle: 'Descrivi il mazzo che vuoi — "aggro rosso Modern", "Commander Atraxa con counter +1/+1", "control Pauper budget" — e l\'AI costruisce una lista completa e pronta per tornei in pochi secondi.',
      howTitle: 'Come Funziona l\'AI Deck Builder',
      steps: [
        { icon: '✍️', title: 'Descrivi il tuo mazzo', desc: 'Scrivi la tua strategia in testo libero. Includi formato, colori, archetipo, budget o carte specifiche attorno a cui vuoi costruire.' },
        { icon: '🤖', title: 'L\'AI genera il mazzo', desc: 'La nostra AI analizza migliaia di liste da torneo e interazioni tra carte per costruire un mazzo coerente e ottimizzato che corrisponde alla tua descrizione.' },
        { icon: '📋', title: 'Rivedi ed esporta', desc: 'Ottieni una lista completa con quantità, sideboard, note strategiche, carte chiave e suggerimenti di upgrade. Esporta su Arena o MTGO istantaneamente.' },
        { icon: '🔄', title: 'Itera con la chat', desc: 'Fai domande di follow-up: "rendilo più veloce", "aggiungi più removal", "quali sono i combo chiave?" — l\'AI ricorda l\'intera conversazione.' },
      ],
      useCasesTitle: 'Cosa Puoi Costruire',
      useCases: [
        'Mazzi da 60 carte per Standard, Modern, Pioneer, Legacy, Vintage, Pauper',
        'Mazzi Commander / EDH da 100 carte con qualsiasi comandante',
        'Mazzi budget sotto €25, €50 o €100',
        'Mazzi tribali (Draghi, Elfi, Vampiri, Tritoni, Goblin...)',
        'Mazzi combo attorno a interazioni specifiche tra carte',
        'Mazzi costruiti solo dalle carte nella tua collezione',
      ],
      faqTitle: 'Domande Frequenti',
      faqs: [
        { q: 'L\'AI può costruire un mazzo usando solo la mia collezione?', a: 'Sì. Dopo la registrazione, attiva "Analizza collezione completa" per limitare l\'AI solo alle carte che possiedi. Costruirà il miglior mazzo possibile dalle tue carte disponibili.' },
        { q: 'Quali formati sono supportati?', a: 'Tutti i formati principali: Standard, Pioneer, Modern, Legacy, Vintage, Commander/EDH, cEDH, Pauper, Premodern, Highlander, Historic, Explorer, Brawl.' },
        { q: 'Quanto sono accurate le liste di mazzi?', a: 'L\'AI è addestrata su migliaia di liste vincenti da torneo e comprende sinergie tra carte, curve di mana e legalità dei formati. I risultati sono punti di partenza di qualità competitiva.' },
        { q: 'Posso chiedere alternative budget?', a: 'Sì. Specifica il tuo budget: "costruisci un mazzo aggro Modern sotto €50" o "sostituisci le fetchland con alternative economiche".' },
        { q: 'Quante prove gratuite ho?', a: '2 prove gratuite al mese senza registrazione. Registrati gratis per ottenere 100 token di benvenuto — ogni costruzione di mazzo costa 5 token.' },
      ],
      canonicalPath: '/try/deck-builder',
      itPath: '/try/deck-builder',
    },
  },
  'synergy': {
    en: {
      title: 'MTG Synergy Finder | Find the Best Synergistic Cards for Your Deck',
      description: 'Find the most synergistic Magic: The Gathering cards for any combination of seed cards. AI groups results by role: Enabler, Payoff, Removal, Ramp, Support.',
      h1: 'MTG AI Synergy Finder',
      subtitle: 'Enter 1–5 seed cards and AI finds the most synergistic cards to build around them. Results grouped by role — Enabler, Payoff, Removal, Ramp, Support — so you know exactly what each card does in your deck.',
      howTitle: 'How the Synergy Finder Works',
      steps: [
        { icon: '🃏', title: 'Enter seed cards', desc: 'Type 1 to 5 cards you want to build around. These are your core cards — the engine of your deck.' },
        { icon: '🔍', title: 'AI finds synergies', desc: 'The AI analyzes card text, mechanics, and thousands of tournament lists to find cards that interact powerfully with your seeds.' },
        { icon: '📊', title: 'Results by role', desc: 'Cards are grouped by function: Enablers (set up your strategy), Payoffs (win conditions), Removal, Ramp, and Support cards.' },
        { icon: '🏗️', title: 'Build your deck', desc: 'Use the synergy results as a starting point to brew a new archetype or improve an existing deck.' },
      ],
      useCasesTitle: 'Best Uses for the Synergy Finder',
      useCases: [
        'Brewing new archetypes around underplayed cards',
        'Finding the best support cards for a Commander strategy',
        'Discovering combo pieces that work with your key cards',
        'Identifying the best removal for your color combination',
        'Finding budget replacements that maintain synergy',
        'Exploring tribal synergies for any creature type',
      ],
      faqTitle: 'Frequently Asked Questions',
      faqs: [
        { q: 'How many seed cards can I enter?', a: 'You can enter 1 to 5 seed cards. More seeds give more focused results — the AI finds cards that synergize with all of them simultaneously.' },
        { q: 'What does each role mean?', a: 'Enabler: sets up your strategy. Payoff: wins the game when your strategy is active. Removal: answers threats. Ramp: accelerates your mana. Support: utility cards that improve consistency.' },
        { q: 'Can I specify a format?', a: 'Yes. You can specify a format in your request to get format-legal suggestions only.' },
        { q: 'How many free tries do I get?', a: '2 free tries per month without registration. Sign up free to get 100 welcome tokens — each synergy search costs 3 tokens.' },
      ],
      canonicalPath: '/en/try/synergy',
      itPath: '/try/synergy',
    },
    it: {
      title: 'MTG Synergy Finder | Trova le Migliori Carte Sinergiche per il Tuo Mazzo',
      description: 'Trova le carte Magic: The Gathering più sinergiche per qualsiasi combinazione di carte di partenza. L\'AI raggruppa i risultati per ruolo: Enabler, Payoff, Removal, Ramp, Support.',
      h1: 'MTG AI Synergy Finder',
      subtitle: 'Inserisci 1–5 carte di partenza e l\'AI trova le carte più sinergiche per costruire attorno ad esse. Risultati raggruppati per ruolo — Enabler, Payoff, Removal, Ramp, Support — così sai esattamente cosa fa ogni carta nel tuo mazzo.',
      howTitle: 'Come Funziona il Synergy Finder',
      steps: [
        { icon: '🃏', title: 'Inserisci le carte di partenza', desc: 'Scrivi da 1 a 5 carte attorno a cui vuoi costruire. Queste sono le tue carte principali — il motore del tuo mazzo.' },
        { icon: '🔍', title: 'L\'AI trova le sinergie', desc: 'L\'AI analizza il testo delle carte, le meccaniche e migliaia di liste da torneo per trovare carte che interagiscono potentemente con le tue carte di partenza.' },
        { icon: '📊', title: 'Risultati per ruolo', desc: 'Le carte sono raggruppate per funzione: Enabler (impostano la strategia), Payoff (condizioni di vittoria), Removal, Ramp e carte di Support.' },
        { icon: '🏗️', title: 'Costruisci il tuo mazzo', desc: 'Usa i risultati di sinergia come punto di partenza per creare un nuovo archetipo o migliorare un mazzo esistente.' },
      ],
      useCasesTitle: 'Migliori Utilizzi del Synergy Finder',
      useCases: [
        'Creare nuovi archetipi attorno a carte sottoutilizzate',
        'Trovare le migliori carte di supporto per una strategia Commander',
        'Scoprire pezzi combo che funzionano con le tue carte chiave',
        'Identificare la migliore rimozione per la tua combinazione di colori',
        'Trovare sostituti budget che mantengono la sinergia',
        'Esplorare sinergie tribali per qualsiasi tipo di creatura',
      ],
      faqTitle: 'Domande Frequenti',
      faqs: [
        { q: 'Quante carte di partenza posso inserire?', a: 'Puoi inserire da 1 a 5 carte di partenza. Più carte di partenza danno risultati più mirati — l\'AI trova carte che si sinergizzano con tutte simultaneamente.' },
        { q: 'Cosa significa ogni ruolo?', a: 'Enabler: imposta la tua strategia. Payoff: vince la partita quando la tua strategia è attiva. Removal: risponde alle minacce. Ramp: accelera il tuo mana. Support: carte di utilità che migliorano la consistenza.' },
        { q: 'Posso specificare un formato?', a: 'Sì. Puoi specificare un formato nella tua richiesta per ottenere solo suggerimenti legali nel formato.' },
        { q: 'Quante prove gratuite ho?', a: '2 prove gratuite al mese senza registrazione. Registrati gratis per ottenere 100 token di benvenuto — ogni ricerca di sinergia costa 3 token.' },
      ],
      canonicalPath: '/try/synergy',
      itPath: '/try/synergy',
    },
  },
  'twins': {
    en: {
      title: 'MTG Card Twins | Find Functional Alternatives & Budget Replacements',
      description: 'Find functional equivalents for any Magic: The Gathering card. Discover budget replacements, upgrades, or cards that do the same thing. Each result rated: Functional Copy, Superior, Inferior, or Lateral.',
      h1: 'MTG AI Card Twins',
      subtitle: 'Find functional equivalents for any card. Budget replacements, upgrades, or cards that do the same thing with a different name. Each twin rated: Functional Copy, Superior, Inferior, or Lateral.',
      howTitle: 'How Card Twins Works',
      steps: [
        { icon: '🃏', title: 'Enter a card name', desc: 'Type any Magic card you want to find alternatives for — an expensive staple, a banned card, or a card you want to upgrade.' },
        { icon: '🤖', title: 'AI finds functional twins', desc: 'The AI analyzes the card\'s function, not just its text. It finds cards that fill the same role in a deck, even if they work differently.' },
        { icon: '⭐', title: 'Results with ratings', desc: 'Each twin is rated: Functional Copy (does the same thing), Superior (strictly better), Inferior (budget downgrade), or Lateral (different but similar role).' },
        { icon: '💰', title: 'Budget or upgrade path', desc: 'Use Card Twins to find cheap replacements for expensive staples, or discover upgrades when your budget increases.' },
      ],
      useCasesTitle: 'When to Use Card Twins',
      useCases: [
        'Finding budget replacements for expensive staples (Mana Crypt → Sol Ring)',
        'Replacing banned cards in a format with legal alternatives',
        'Discovering upgrades when you want to improve a deck',
        'Finding redundant copies of key effects for consistency',
        'Exploring alternatives when a card is out of stock',
        'Building a deck without specific reserved list cards',
      ],
      faqTitle: 'Frequently Asked Questions',
      faqs: [
        { q: 'What does "Functional Copy" mean?', a: 'A Functional Copy does essentially the same thing as the original card — same effect, similar cost, same role in a deck. The best budget replacements are Functional Copies.' },
        { q: 'Can I find budget replacements for any card?', a: 'Yes. The AI understands card function and can find cheaper alternatives for almost any card, even if no exact functional copy exists.' },
        { q: 'Does it work for Commander staples?', a: 'Yes. Card Twins is especially useful for Commander, where you often need to find budget alternatives for expensive staples like Mana Crypt, Demonic Tutor, or Force of Will.' },
        { q: 'How many free tries do I get?', a: '2 free tries per month without registration. Sign up free to get 100 welcome tokens — each Card Twins search costs 3 tokens.' },
      ],
      canonicalPath: '/en/try/twins',
      itPath: '/try/twins',
    },
    it: {
      title: 'MTG Card Twins | Trova Alternative Funzionali e Sostituti Budget',
      description: 'Trova equivalenti funzionali per qualsiasi carta Magic: The Gathering. Scopri sostituti budget, upgrade o carte che fanno la stessa cosa. Ogni risultato valutato: Copia Funzionale, Superiore, Inferiore o Laterale.',
      h1: 'MTG AI Card Twins',
      subtitle: 'Trova equivalenti funzionali per qualsiasi carta. Sostituti budget, upgrade o carte che fanno la stessa cosa con un nome diverso. Ogni gemello valutato: Copia Funzionale, Superiore, Inferiore o Laterale.',
      howTitle: 'Come Funziona Card Twins',
      steps: [
        { icon: '🃏', title: 'Inserisci il nome di una carta', desc: 'Scrivi qualsiasi carta Magic per cui vuoi trovare alternative — uno staple costoso, una carta bannata o una carta che vuoi aggiornare.' },
        { icon: '🤖', title: 'L\'AI trova i gemelli funzionali', desc: 'L\'AI analizza la funzione della carta, non solo il suo testo. Trova carte che ricoprono lo stesso ruolo in un mazzo, anche se funzionano diversamente.' },
        { icon: '⭐', title: 'Risultati con valutazioni', desc: 'Ogni gemello è valutato: Copia Funzionale (fa la stessa cosa), Superiore (strettamente migliore), Inferiore (downgrade budget) o Laterale (diverso ma ruolo simile).' },
        { icon: '💰', title: 'Percorso budget o upgrade', desc: 'Usa Card Twins per trovare sostituti economici per staple costosi, o scoprire upgrade quando il tuo budget aumenta.' },
      ],
      useCasesTitle: 'Quando Usare Card Twins',
      useCases: [
        'Trovare sostituti budget per staple costosi (Mana Crypt → Sol Ring)',
        'Sostituire carte bannate in un formato con alternative legali',
        'Scoprire upgrade quando vuoi migliorare un mazzo',
        'Trovare copie ridondanti di effetti chiave per la consistenza',
        'Esplorare alternative quando una carta è esaurita',
        'Costruire un mazzo senza carte specifiche della Reserved List',
      ],
      faqTitle: 'Domande Frequenti',
      faqs: [
        { q: 'Cosa significa "Copia Funzionale"?', a: 'Una Copia Funzionale fa essenzialmente la stessa cosa della carta originale — stesso effetto, costo simile, stesso ruolo in un mazzo. I migliori sostituti budget sono Copie Funzionali.' },
        { q: 'Posso trovare sostituti budget per qualsiasi carta?', a: 'Sì. L\'AI comprende la funzione delle carte e può trovare alternative più economiche per quasi qualsiasi carta, anche se non esiste una copia funzionale esatta.' },
        { q: 'Funziona per gli staple Commander?', a: 'Sì. Card Twins è particolarmente utile per Commander, dove spesso hai bisogno di trovare alternative budget per staple costosi come Mana Crypt, Demonic Tutor o Force of Will.' },
        { q: 'Quante prove gratuite ho?', a: '2 prove gratuite al mese senza registrazione. Registrati gratis per ottenere 100 token di benvenuto — ogni ricerca Card Twins costa 3 token.' },
      ],
      canonicalPath: '/try/twins',
      itPath: '/try/twins',
    },
  },
  'tournament': {
    en: {
      title: 'MTG Tournament Deck Builder | Find Decks You Can Build from Your Collection',
      description: 'Upload your Magic: The Gathering collection and instantly see which tournament decks you can build. Match against 7,200+ competitive decklists across all formats.',
      h1: 'MTG Tournament Deck Matcher',
      subtitle: 'Upload your collection and instantly see which of 7,200+ tournament decks you can build right now. See your completion percentage, missing cards, and the cheapest path to completing any deck.',
      howTitle: 'How the Tournament Deck Matcher Works',
      steps: [
        { icon: '📁', title: 'Upload your collection', desc: 'Import your cards via CSV or Excel. Compatible with Delver Lens, TCGPlayer, Moxfield, and most collection management apps.' },
        { icon: '🔍', title: 'Instant matching', desc: 'Our engine compares every card you own against 7,200+ tournament decklists and calculates your completion percentage for each deck.' },
        { icon: '📊', title: 'See your results', desc: 'Decks are ranked by completion %. See exactly which cards you\'re missing, how many you own, and the estimated cost to complete each deck.' },
        { icon: '🏗️', title: 'Build and export', desc: 'Save any deck to your account, export to Arena or MTGO, or use the AI tools to optimize it further.' },
      ],
      useCasesTitle: 'What You Can Discover',
      useCases: [
        'Which competitive decks you\'re 80%+ complete on right now',
        'The cheapest deck you can build from your collection',
        'Which format your collection is best suited for',
        'Exactly which cards to buy to complete a specific deck',
        'How your collection compares to the current metagame',
        'Which decks share the most cards (maximize collection value)',
      ],
      faqTitle: 'Frequently Asked Questions',
      faqs: [
        { q: 'How many tournament decklists are in the database?', a: 'Over 7,200 competitive tournament decklists across all major formats: Standard, Modern, Pioneer, Legacy, Vintage, Commander, cEDH, Pauper, Premodern, and Highlander.' },
        { q: 'What file formats are supported?', a: 'Excel (.xlsx) and CSV (.csv). Card names must be in English. Compatible with Delver Lens, TCGPlayer, Moxfield, and most collection apps.' },
        { q: 'How is the completion percentage calculated?', a: 'We count how many copies of each required card you own vs. how many the deck needs. A deck requiring 4x Lightning Bolt where you own 2x counts as 50% for that card.' },
        { q: 'Can I filter by format or budget?', a: 'Yes. Filter by format (Standard, Modern, etc.), minimum completion %, colors, and whether the deck is fully buildable from your collection.' },
      ],
      canonicalPath: '/en/try/tournament',
      itPath: '/try/tournament',
    },
    it: {
      title: 'MTG Tournament Deck Builder | Trova Mazzi che Puoi Costruire dalla Tua Collezione',
      description: 'Carica la tua collezione Magic: The Gathering e vedi istantaneamente quali mazzi da torneo puoi costruire. Confronta con 7.200+ decklist competitive in tutti i formati.',
      h1: 'MTG Tournament Deck Matcher',
      subtitle: 'Carica la tua collezione e vedi istantaneamente quali dei 7.200+ mazzi da torneo puoi costruire adesso. Vedi la tua percentuale di completamento, le carte mancanti e il percorso più economico per completare qualsiasi mazzo.',
      howTitle: 'Come Funziona il Tournament Deck Matcher',
      steps: [
        { icon: '📁', title: 'Carica la tua collezione', desc: 'Importa le tue carte via CSV o Excel. Compatibile con Delver Lens, TCGPlayer, Moxfield e la maggior parte delle app di gestione collezioni.' },
        { icon: '🔍', title: 'Confronto istantaneo', desc: 'Il nostro motore confronta ogni carta che possiedi con 7.200+ decklist da torneo e calcola la tua percentuale di completamento per ogni mazzo.' },
        { icon: '📊', title: 'Vedi i tuoi risultati', desc: 'I mazzi sono classificati per % di completamento. Vedi esattamente quali carte ti mancano, quante ne possiedi e il costo stimato per completare ogni mazzo.' },
        { icon: '🏗️', title: 'Costruisci ed esporta', desc: 'Salva qualsiasi mazzo nel tuo account, esporta su Arena o MTGO, o usa gli strumenti AI per ottimizzarlo ulteriormente.' },
      ],
      useCasesTitle: 'Cosa Puoi Scoprire',
      useCases: [
        'Quali mazzi competitivi hai completato all\'80%+ adesso',
        'Il mazzo più economico che puoi costruire dalla tua collezione',
        'Per quale formato la tua collezione è più adatta',
        'Esattamente quali carte comprare per completare un mazzo specifico',
        'Come la tua collezione si confronta con il metagame attuale',
        'Quali mazzi condividono più carte (massimizza il valore della collezione)',
      ],
      faqTitle: 'Domande Frequenti',
      faqs: [
        { q: 'Quante decklist da torneo ci sono nel database?', a: 'Oltre 7.200 decklist competitive da torneo in tutti i formati principali: Standard, Modern, Pioneer, Legacy, Vintage, Commander, cEDH, Pauper, Premodern e Highlander.' },
        { q: 'Quali formati di file sono supportati?', a: 'Excel (.xlsx) e CSV (.csv). I nomi delle carte devono essere in inglese. Compatibile con Delver Lens, TCGPlayer, Moxfield e la maggior parte delle app di collezione.' },
        { q: 'Come viene calcolata la percentuale di completamento?', a: 'Contiamo quante copie di ogni carta richiesta possiedi rispetto a quante ne ha bisogno il mazzo. Un mazzo che richiede 4x Lightning Bolt dove ne possiedi 2x conta come 50% per quella carta.' },
        { q: 'Posso filtrare per formato o budget?', a: 'Sì. Filtra per formato (Standard, Modern, ecc.), % minima di completamento, colori e se il mazzo è completamente costruibile dalla tua collezione.' },
      ],
      canonicalPath: '/try/tournament',
      itPath: '/try/tournament',
    },
  },
};

// The wrapper component — renders SEO content above the tool, then the tool itself
const ToolPageWrapper = ({ toolId, lang = 'en', children }) => {
  const content = TOOL_CONTENT[toolId];
  if (!content) return children; // no SEO content defined, just render the tool

  const t = content[lang] || content['en'];
  const canonicalPath = lang === 'en' ? t.canonicalPath : t.itPath;

  return (
    <>
      <SEOHead
        title={t.title}
        description={t.description}
        canonical={canonicalPath}
        lang={lang}
        keywords={`MTG ${toolId}, magic deck builder, ${t.h1}`}
      />
      <HreflangTags
        enUrl={content.en.canonicalPath}
        itUrl={content.it.itPath}
      />

      {/* SEO hero block — above the tool */}
      <div className="tool-seo-header">
        <div className="tool-seo-inner">
          <h1 className="tool-seo-h1">{t.h1}</h1>
          <p className="tool-seo-subtitle">{t.subtitle}</p>
        </div>
      </div>

      {/* The actual interactive tool */}
      <div className="tool-seo-tool-area">
        {children}
      </div>

      {/* How it works */}
      <div className="tool-seo-section tool-seo-how">
        <div className="tool-seo-inner">
          <h2>{t.howTitle}</h2>
          <div className="tool-seo-steps">
            {t.steps.map((step, i) => (
              <div key={i} className="tool-seo-step">
                <div className="tool-seo-step-icon">{step.icon}</div>
                <h3>{step.title}</h3>
                <p>{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Use cases */}
      <div className="tool-seo-section tool-seo-uses">
        <div className="tool-seo-inner">
          <h2>{t.useCasesTitle}</h2>
          <ul className="tool-seo-uses-list">
            {t.useCases.map((uc, i) => (
              <li key={i}>
                <span className="tool-seo-check">✓</span>
                {uc}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* FAQ */}
      <div className="tool-seo-section tool-seo-faq">
        <div className="tool-seo-inner">
          <h2>{t.faqTitle}</h2>
          <div className="tool-seo-faq-list">
            {t.faqs.map((faq, i) => (
              <details key={i} className="tool-seo-faq-item">
                <summary className="tool-seo-faq-q">{faq.q}</summary>
                <p className="tool-seo-faq-a">{faq.a}</p>
              </details>
            ))}
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="tool-seo-cta">
        <div className="tool-seo-inner" style={{ textAlign: 'center' }}>
          <p>{lang === 'en' ? '🎁 Sign up free and get 100 tokens to use all AI tools' : '🎁 Registrati gratis e ottieni 100 token per usare tutti gli strumenti AI'}</p>
          <Link to="/app" className="tool-seo-cta-btn">
            {lang === 'en' ? 'Sign Up Free →' : 'Registrati Gratis →'}
          </Link>
        </div>
      </div>
    </>
  );
};

export { TOOL_CONTENT };
export default ToolPageWrapper;
