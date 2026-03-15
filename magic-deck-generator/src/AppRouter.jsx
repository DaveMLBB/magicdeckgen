import { Routes, Route, Navigate } from 'react-router-dom';
import App from './App';
import LandingPage from './pages/public/LandingPage';
import WelcomePage from './pages/WelcomePage';
import TryPage from './pages/public/TryPage';
import { CedhDeckBuilderEN, CedhDeckBuilderIT } from './pages/public/formats/CedhDeckBuilder';
import { PremodernDeckBuilderEN, PremodernDeckBuilderIT } from './pages/public/formats/PremodernDeckBuilder';
import { PauperDeckBuilderEN, PauperDeckBuilderIT } from './pages/public/formats/PauperDeckBuilder';
import { VintageDeckBuilderEN, VintageDeckBuilderIT } from './pages/public/formats/VintageDeckBuilder';
import { HighlanderDeckBuilderEN, HighlanderDeckBuilderIT } from './pages/public/formats/HighlanderDeckBuilder';

function AppRouter() {
  return (
    <Routes>
      {/* English SEO Routes */}
      <Route path="/en/mtg-deck-builder-from-collection" element={<LandingPage lang="en" />} />
      <Route path="/en/cedh-deck-builder-from-collection" element={<CedhDeckBuilderEN />} />
      <Route path="/en/premodern-deck-builder-from-collection" element={<PremodernDeckBuilderEN />} />
      <Route path="/en/pauper-deck-builder-from-collection" element={<PauperDeckBuilderEN />} />
      <Route path="/en/vintage-deck-builder-from-collection" element={<VintageDeckBuilderEN />} />
      <Route path="/en/highlander-deck-builder-from-collection" element={<HighlanderDeckBuilderEN />} />
      
      {/* Italian SEO Routes */}
      <Route path="/it/costruttore-mazzi-mtg-da-collezione" element={<LandingPage lang="it" />} />
      <Route path="/it/costruttore-mazzi-cedh-da-collezione" element={<CedhDeckBuilderIT />} />
      <Route path="/it/costruttore-mazzi-premodern-da-collezione" element={<PremodernDeckBuilderIT />} />
      <Route path="/it/costruttore-mazzi-pauper-da-collezione" element={<PauperDeckBuilderIT />} />
      <Route path="/it/costruttore-mazzi-vintage-da-collezione" element={<VintageDeckBuilderIT />} />
      <Route path="/it/costruttore-mazzi-highlander-da-collezione" element={<HighlanderDeckBuilderIT />} />
      
      {/* Root and all other paths - Protected app */}
      <Route path="/welcome" element={<WelcomePage />} />
      <Route path="/try" element={<TryPage lang="it" />} />
      <Route path="/try/:toolId" element={<TryPage lang="it" />} />
      <Route path="/en/try" element={<TryPage lang="en" />} />
      <Route path="/en/try/:toolId" element={<TryPage lang="en" />} />
      <Route path="/*" element={<App />} />
    </Routes>
  );
}

export default AppRouter;
