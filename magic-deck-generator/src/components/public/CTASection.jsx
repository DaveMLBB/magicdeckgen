import { Link } from 'react-router-dom';

const CTASection = ({ lang = 'en', variant = 'primary' }) => {
  const translations = {
    en: {
      title: 'Ready to Build Your Perfect Deck?',
      subtitle: 'Upload your collection and discover tournament-winning decks you can build right now.',
      cta: 'Start Building Free',
      features: [
        '✓ Upload CSV/Excel in seconds',
        '✓ Match against 7,200+ tournament decks',
        '✓ Support for all competitive formats',
        '✓ See exactly what cards you need'
      ]
    },
    it: {
      title: 'Pronto a Costruire il Tuo Mazzo Perfetto?',
      subtitle: 'Carica la tua collezione e scopri mazzi vincenti che puoi costruire subito.',
      cta: 'Inizia Gratis',
      features: [
        '✓ Carica CSV/Excel in secondi',
        '✓ Confronta con 7.200+ mazzi da torneo',
        '✓ Supporto per tutti i formati competitivi',
        '✓ Vedi esattamente quali carte ti servono'
      ]
    }
  };

  const t = translations[lang];

  return (
    <section className={`cta-section cta-${variant}`}>
      <div className="cta-container">
        <h2>{t.title}</h2>
        <p className="cta-subtitle">{t.subtitle}</p>
        
        <ul className="cta-features">
          {t.features.map((feature, index) => (
            <li key={index}>{feature}</li>
          ))}
        </ul>

        <Link to="/app" className="cta-button">
          {t.cta}
        </Link>
      </div>
    </section>
  );
};

export default CTASection;
