import { useNavigate } from 'react-router-dom';

const LanguageSwitcher = ({ currentLang, currentPath }) => {
  const navigate = useNavigate();

  const pathMapping = {
    'mtg-deck-builder-from-collection': 'costruttore-mazzi-mtg-da-collezione',
    'costruttore-mazzi-mtg-da-collezione': 'mtg-deck-builder-from-collection',
    'cedh-deck-builder-from-collection': 'costruttore-mazzi-cedh-da-collezione',
    'costruttore-mazzi-cedh-da-collezione': 'cedh-deck-builder-from-collection',
    'premodern-deck-builder-from-collection': 'costruttore-mazzi-premodern-da-collezione',
    'costruttore-mazzi-premodern-da-collezione': 'premodern-deck-builder-from-collection',
    'pauper-deck-builder-from-collection': 'costruttore-mazzi-pauper-da-collezione',
    'costruttore-mazzi-pauper-da-collezione': 'pauper-deck-builder-from-collection',
    'vintage-deck-builder-from-collection': 'costruttore-mazzi-vintage-da-collezione',
    'costruttore-mazzi-vintage-da-collezione': 'vintage-deck-builder-from-collection',
    'highlander-deck-builder-from-collection': 'costruttore-mazzi-highlander-da-collezione',
    'costruttore-mazzi-highlander-da-collezione': 'highlander-deck-builder-from-collection',
    'what-mtg-decks-can-i-build': 'quali-mazzi-mtg-posso-costruire',
    'quali-mazzi-mtg-posso-costruire': 'what-mtg-decks-can-i-build',
    'mtg-deck-completion-checker': 'verifica-completamento-mazzo-mtg',
    'verifica-completamento-mazzo-mtg': 'mtg-deck-completion-checker',
    'match-mtg-collection-to-decklist': 'abbina-collezione-mtg-a-decklist',
    'abbina-collezione-mtg-a-decklist': 'match-mtg-collection-to-decklist',
    'upload-mtg-collection-csv-excel': 'caricare-collezione-mtg-csv-excel',
    'caricare-collezione-mtg-csv-excel': 'upload-mtg-collection-csv-excel'
  };

  const switchLanguage = () => {
    const newLang = currentLang === 'en' ? 'it' : 'en';
    const pathParts = currentPath.split('/').filter(Boolean);
    const slug = pathParts[pathParts.length - 1];
    const newSlug = pathMapping[slug] || slug;
    
    const newPath = `/${newLang}/${newSlug}`;
    navigate(newPath);
  };

  return (
    <button className="lang-switcher" onClick={switchLanguage}>
      {currentLang === 'en' ? '🇮🇹 IT' : '🇬🇧 EN'}
    </button>
  );
};

export default LanguageSwitcher;
