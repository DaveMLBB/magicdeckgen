import { Link } from 'react-router-dom';
import LanguageSwitcher from './LanguageSwitcher';

const PublicNav = ({ lang = 'en', currentPath }) => {
  const translations = {
    en: {
      home: 'Home',
      formats: 'Formats',
      login: 'Login',
      signup: 'Sign Up'
    },
    it: {
      home: 'Home',
      formats: 'Formati',
      login: 'Accedi',
      signup: 'Registrati'
    }
  };

  const t = translations[lang];

  return (
    <nav className="public-nav">
      <div className="nav-container">
        <Link to={`/${lang}/mtg-deck-builder-from-collection`} className="nav-logo">
          Magic Deck Builder
        </Link>
        
        <div className="nav-links">
          <Link to={`/${lang}/mtg-deck-builder-from-collection`}>{t.home}</Link>
          <div className="nav-dropdown">
            <span>{t.formats}</span>
            <div className="dropdown-content">
              <Link to={`/${lang}/${lang === 'en' ? 'cedh-deck-builder-from-collection' : 'costruttore-mazzi-cedh-da-collezione'}`}>cEDH</Link>
              <Link to={`/${lang}/${lang === 'en' ? 'premodern-deck-builder-from-collection' : 'costruttore-mazzi-premodern-da-collezione'}`}>Premodern</Link>
              <Link to={`/${lang}/${lang === 'en' ? 'pauper-deck-builder-from-collection' : 'costruttore-mazzi-pauper-da-collezione'}`}>Pauper</Link>
              <Link to={`/${lang}/${lang === 'en' ? 'vintage-deck-builder-from-collection' : 'costruttore-mazzi-vintage-da-collezione'}`}>Vintage</Link>
              <Link to={`/${lang}/${lang === 'en' ? 'highlander-deck-builder-from-collection' : 'costruttore-mazzi-highlander-da-collezione'}`}>Highlander</Link>
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
