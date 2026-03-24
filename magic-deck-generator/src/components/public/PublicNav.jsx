import { Link } from 'react-router-dom';
import LanguageSwitcher from './LanguageSwitcher';

const PublicNav = ({ lang = 'en', currentPath }) => {
  const t = {
    en: {
      home: 'Home', formats: 'Formats', archetypes: 'Archetypes',
      guides: 'Guides', login: 'Login', signup: 'Sign Up'
    },
    it: {
      home: 'Home', formats: 'Formati', archetypes: 'Archetipi',
      guides: 'Guide', login: 'Accedi', signup: 'Registrati'
    }
  }[lang];

  const p = (en, it) => `/${lang}/${lang === 'en' ? en : it}`;

  return (
    <nav className="public-nav">
      <div className="nav-container">
        <Link to={p('mtg-deck-builder-from-collection', 'costruttore-mazzi-mtg-da-collezione')} className="nav-logo">
          Magic Deck Builder
        </Link>

        <div className="nav-links">
          <Link to={p('mtg-deck-builder-from-collection', 'costruttore-mazzi-mtg-da-collezione')}>{t.home}</Link>

          <div className="nav-dropdown">
            <span>{t.formats} ▾</span>
            <div className="dropdown-content">
              <Link to={p('standard-deck-builder-from-collection', 'costruttore-mazzi-standard-da-collezione')}>Standard</Link>
              <Link to={p('modern-deck-builder-from-collection', 'costruttore-mazzi-modern-da-collezione')}>Modern</Link>
              <Link to={p('pioneer-deck-builder-from-collection', 'costruttore-mazzi-pioneer-da-collezione')}>Pioneer</Link>
              <Link to={p('legacy-deck-builder-from-collection', 'costruttore-mazzi-legacy-da-collezione')}>Legacy</Link>
              <Link to={p('cedh-deck-builder-from-collection', 'costruttore-mazzi-cedh-da-collezione')}>cEDH</Link>
              <Link to={p('pauper-deck-builder-from-collection', 'costruttore-mazzi-pauper-da-collezione')}>Pauper</Link>
              <Link to={p('vintage-deck-builder-from-collection', 'costruttore-mazzi-vintage-da-collezione')}>Vintage</Link>
              <Link to={p('premodern-deck-builder-from-collection', 'costruttore-mazzi-premodern-da-collezione')}>Premodern</Link>
              <Link to={p('highlander-deck-builder-from-collection', 'costruttore-mazzi-highlander-da-collezione')}>Highlander</Link>
            </div>
          </div>

          <div className="nav-dropdown">
            <span>{t.archetypes} ▾</span>
            <div className="dropdown-content">
              <Link to={p('mtg-aggro-deck-builder', 'costruttore-mazzi-aggro-mtg')}>⚡ Aggro</Link>
              <Link to={p('mtg-control-deck-builder', 'costruttore-mazzi-control-mtg')}>🛡️ Control</Link>
              <Link to={p('mtg-combo-deck-builder', 'costruttore-mazzi-combo-mtg')}>🔄 Combo</Link>
              <Link to={p('mtg-midrange-deck-builder', 'costruttore-mazzi-midrange-mtg')}>⚖️ Midrange</Link>
            </div>
          </div>

          <div className="nav-dropdown">
            <span>{t.guides} ▾</span>
            <div className="dropdown-content">
              <Link to={p('best-cards-for-commander', 'migliori-carte-per-commander')}>
                {lang === 'en' ? '👑 Best Cards: Commander' : '👑 Migliori Carte: Commander'}
              </Link>
              <Link to={p('best-cards-for-modern', 'migliori-carte-per-modern')}>
                {lang === 'en' ? '⚡ Best Cards: Modern' : '⚡ Migliori Carte: Modern'}
              </Link>
              <Link to={p('mtg-matchup-aggro-vs-control', 'mtg-matchup-aggro-contro-control')}>
                {lang === 'en' ? '⚔️ Aggro vs Control' : '⚔️ Aggro vs Control'}
              </Link>
              <Link to={p('mtg-matchup-combo-vs-control', 'mtg-matchup-combo-contro-control')}>
                {lang === 'en' ? '⚔️ Combo vs Control' : '⚔️ Combo vs Control'}
              </Link>
              <Link to={p('budget-mtg-deck-builder-under-25', 'costruttore-mazzi-mtg-budget-sotto-25')}>
                {lang === 'en' ? '💰 Budget Under $25' : '💰 Budget Sotto €25'}
              </Link>
              <Link to={p('budget-mtg-deck-builder-under-100', 'costruttore-mazzi-mtg-budget-sotto-100')}>
                {lang === 'en' ? '💎 Budget Under $100' : '💎 Budget Sotto €100'}
              </Link>
            </div>
          </div>
        </div>

        <div className="nav-actions">
          <LanguageSwitcher currentLang={lang} currentPath={currentPath} />
          <Link to="/app" className="btn-login">{t.login}</Link>
          <Link to="/app" className="btn-signup">{t.signup}</Link>
        </div>
      </div>
    </nav>
  );
};

export default PublicNav;
