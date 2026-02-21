import { Link } from 'react-router-dom';

const Breadcrumbs = ({ items, lang = 'en' }) => {
  const homeText = lang === 'it' ? 'Home' : 'Home';
  const homeUrl = `/${lang}/mtg-deck-builder-from-collection`;
  
  return (
    <nav className="breadcrumbs" aria-label="Breadcrumb">
      <ol>
        <li>
          <Link to={homeUrl}>{homeText}</Link>
        </li>
        {items.map((item, index) => (
          <li key={index}>
            {item.url ? (
              <Link to={item.url}>{item.label}</Link>
            ) : (
              <span>{item.label}</span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
};

export default Breadcrumbs;
