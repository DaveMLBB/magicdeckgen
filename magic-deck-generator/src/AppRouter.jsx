import { Routes, Route, Navigate } from 'react-router-dom';
import App from './App';
import LandingPage from './pages/public/LandingPage';
import WelcomePage from './pages/WelcomePage';
import TryPage from './pages/public/TryPage';
import PublicDeckPage from './pages/public/PublicDeckPage';
import PublicDecksIndex from './pages/public/PublicDecksIndex';
import { CedhDeckBuilderEN, CedhDeckBuilderIT } from './pages/public/formats/CedhDeckBuilder';
import { PremodernDeckBuilderEN, PremodernDeckBuilderIT } from './pages/public/formats/PremodernDeckBuilder';
import { PauperDeckBuilderEN, PauperDeckBuilderIT } from './pages/public/formats/PauperDeckBuilder';
import { VintageDeckBuilderEN, VintageDeckBuilderIT } from './pages/public/formats/VintageDeckBuilder';
import { HighlanderDeckBuilderEN, HighlanderDeckBuilderIT } from './pages/public/formats/HighlanderDeckBuilder';
import { StandardDeckBuilderEN, StandardDeckBuilderIT } from './pages/public/formats/StandardDeckBuilder';
import { ModernDeckBuilderEN, ModernDeckBuilderIT } from './pages/public/formats/ModernDeckBuilder';
import { LegacyDeckBuilderEN, LegacyDeckBuilderIT } from './pages/public/formats/LegacyDeckBuilder';
import { PioneerDeckBuilderEN, PioneerDeckBuilderIT } from './pages/public/formats/PioneerDeckBuilder';
import CommanderPage from './pages/public/seo/CommanderPage';
import ArchetypePage from './pages/public/seo/ArchetypePage';
import BudgetPage from './pages/public/seo/BudgetPage';
import MatchupPage from './pages/public/seo/MatchupPage';
import BestCardsPage from './pages/public/seo/BestCardsPage';

function AppRouter() {
  return (
    <Routes>
      {/* English SEO Routes - Formats */}
      <Route path="/en/mtg-deck-builder-from-collection" element={<LandingPage lang="en" />} />
      <Route path="/en/standard-deck-builder-from-collection" element={<StandardDeckBuilderEN />} />
      <Route path="/en/modern-deck-builder-from-collection" element={<ModernDeckBuilderEN />} />
      <Route path="/en/legacy-deck-builder-from-collection" element={<LegacyDeckBuilderEN />} />
      <Route path="/en/pioneer-deck-builder-from-collection" element={<PioneerDeckBuilderEN />} />
      <Route path="/en/cedh-deck-builder-from-collection" element={<CedhDeckBuilderEN />} />
      <Route path="/en/premodern-deck-builder-from-collection" element={<PremodernDeckBuilderEN />} />
      <Route path="/en/pauper-deck-builder-from-collection" element={<PauperDeckBuilderEN />} />
      <Route path="/en/vintage-deck-builder-from-collection" element={<VintageDeckBuilderEN />} />
      <Route path="/en/highlander-deck-builder-from-collection" element={<HighlanderDeckBuilderEN />} />

      {/* English SEO Routes - Commander */}
      <Route path="/en/commander/atraxa-deck-builder" element={<CommanderPage commander="atraxa" lang="en" />} />
      <Route path="/en/commander/kenrith-deck-builder" element={<CommanderPage commander="kenrith" lang="en" />} />
      <Route path="/en/commander/yuriko-deck-builder" element={<CommanderPage commander="yuriko" lang="en" />} />
      <Route path="/en/commander/edgar-markov-deck-builder" element={<CommanderPage commander="edgar" lang="en" />} />

      {/* English SEO Routes - Archetypes */}
      <Route path="/en/mtg-aggro-deck-builder" element={<ArchetypePage archetype="aggro" lang="en" />} />
      <Route path="/en/mtg-control-deck-builder" element={<ArchetypePage archetype="control" lang="en" />} />
      <Route path="/en/mtg-combo-deck-builder" element={<ArchetypePage archetype="combo" lang="en" />} />
      <Route path="/en/mtg-midrange-deck-builder" element={<ArchetypePage archetype="midrange" lang="en" />} />

      {/* English SEO Routes - Budget */}
      <Route path="/en/budget-mtg-deck-builder-under-25" element={<BudgetPage tier="under25" lang="en" />} />
      <Route path="/en/budget-mtg-deck-builder-under-100" element={<BudgetPage tier="under100" lang="en" />} />

      {/* English SEO Routes - Matchups */}
      <Route path="/en/mtg-matchup-aggro-vs-control" element={<MatchupPage matchup="aggro-vs-control" lang="en" />} />
      <Route path="/en/mtg-matchup-combo-vs-control" element={<MatchupPage matchup="combo-vs-control" lang="en" />} />
      <Route path="/en/mtg-matchup-aggro-vs-midrange" element={<MatchupPage matchup="aggro-vs-midrange" lang="en" />} />

      {/* English SEO Routes - Best Cards */}
      <Route path="/en/best-cards-for-commander" element={<BestCardsPage topic="commander" lang="en" />} />
      <Route path="/en/best-cards-for-modern" element={<BestCardsPage topic="modern" lang="en" />} />

      {/* Italian SEO Routes - Formats */}
      <Route path="/it/costruttore-mazzi-mtg-da-collezione" element={<LandingPage lang="it" />} />
      <Route path="/it/costruttore-mazzi-standard-da-collezione" element={<StandardDeckBuilderIT />} />
      <Route path="/it/costruttore-mazzi-modern-da-collezione" element={<ModernDeckBuilderIT />} />
      <Route path="/it/costruttore-mazzi-legacy-da-collezione" element={<LegacyDeckBuilderIT />} />
      <Route path="/it/costruttore-mazzi-pioneer-da-collezione" element={<PioneerDeckBuilderIT />} />
      <Route path="/it/costruttore-mazzi-cedh-da-collezione" element={<CedhDeckBuilderIT />} />
      <Route path="/it/costruttore-mazzi-premodern-da-collezione" element={<PremodernDeckBuilderIT />} />
      <Route path="/it/costruttore-mazzi-pauper-da-collezione" element={<PauperDeckBuilderIT />} />
      <Route path="/it/costruttore-mazzi-vintage-da-collezione" element={<VintageDeckBuilderIT />} />
      <Route path="/it/costruttore-mazzi-highlander-da-collezione" element={<HighlanderDeckBuilderIT />} />

      {/* Italian SEO Routes - Commander */}
      <Route path="/it/comandante/atraxa-costruttore-mazzo" element={<CommanderPage commander="atraxa" lang="it" />} />
      <Route path="/it/comandante/kenrith-costruttore-mazzo" element={<CommanderPage commander="kenrith" lang="it" />} />
      <Route path="/it/comandante/yuriko-costruttore-mazzo" element={<CommanderPage commander="yuriko" lang="it" />} />
      <Route path="/it/comandante/edgar-markov-costruttore-mazzo" element={<CommanderPage commander="edgar" lang="it" />} />

      {/* Italian SEO Routes - Archetypes */}
      <Route path="/it/costruttore-mazzi-aggro-mtg" element={<ArchetypePage archetype="aggro" lang="it" />} />
      <Route path="/it/costruttore-mazzi-control-mtg" element={<ArchetypePage archetype="control" lang="it" />} />
      <Route path="/it/costruttore-mazzi-combo-mtg" element={<ArchetypePage archetype="combo" lang="it" />} />
      <Route path="/it/costruttore-mazzi-midrange-mtg" element={<ArchetypePage archetype="midrange" lang="it" />} />

      {/* Italian SEO Routes - Budget */}
      <Route path="/it/costruttore-mazzi-mtg-budget-sotto-25" element={<BudgetPage tier="under25" lang="it" />} />
      <Route path="/it/costruttore-mazzi-mtg-budget-sotto-100" element={<BudgetPage tier="under100" lang="it" />} />

      {/* Italian SEO Routes - Matchups */}
      <Route path="/it/mtg-matchup-aggro-contro-control" element={<MatchupPage matchup="aggro-vs-control" lang="it" />} />
      <Route path="/it/mtg-matchup-combo-contro-control" element={<MatchupPage matchup="combo-vs-control" lang="it" />} />
      <Route path="/it/mtg-matchup-aggro-contro-midrange" element={<MatchupPage matchup="aggro-vs-midrange" lang="it" />} />

      {/* Italian SEO Routes - Best Cards */}
      <Route path="/it/migliori-carte-per-commander" element={<BestCardsPage topic="commander" lang="it" />} />
      <Route path="/it/migliori-carte-per-modern" element={<BestCardsPage topic="modern" lang="it" />} />
      
      {/* Public Deck Pages - SEO indexable */}
      <Route path="/decks" element={<PublicDecksIndex />} />
      <Route path="/decks/:slug" element={<PublicDeckPage />} />

      {/* Root and all other paths - Protected app */}
      <Route path="/welcome" element={<WelcomePage />} />
      <Route path="/try" element={<TryPage lang={navigator.language?.toLowerCase().startsWith('it') ? 'it' : 'en'} />} />
      <Route path="/try/:toolId" element={<TryPage lang={navigator.language?.toLowerCase().startsWith('it') ? 'it' : 'en'} />} />
      <Route path="/en/try" element={<TryPage lang="en" />} />
      <Route path="/en/try/:toolId" element={<TryPage lang="en" />} />
      <Route path="/*" element={<App />} />
    </Routes>
  );
}

export default AppRouter;
