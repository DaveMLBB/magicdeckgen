import { Routes, Route, Navigate } from 'react-router-dom';
import LandingPage from '../pages/public/LandingPage';

const PublicRoutes = () => {
  return (
    <Routes>
      {/* English Routes */}
      <Route path="/en/mtg-deck-builder-from-collection" element={<LandingPage lang="en" />} />
      
      {/* Italian Routes */}
      <Route path="/it/costruttore-mazzi-mtg-da-collezione" element={<LandingPage lang="it" />} />
      
      {/* Default redirect to English landing page */}
      <Route path="/" element={<Navigate to="/en/mtg-deck-builder-from-collection" replace />} />
      
      {/* Format pages will be added here */}
      {/* Feature pages will be added here */}
      {/* Blog pages will be added here */}
    </Routes>
  );
};

export default PublicRoutes;
