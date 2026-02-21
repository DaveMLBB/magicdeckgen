# SEO Pages Implementation Checklist

## ✅ COMPLETED (Foundation)

### Infrastructure
- [x] `package.json` - Added react-router-dom and react-helmet-async
- [x] SEO Components
  - [x] `SEOHead.jsx` - Meta tags and Open Graph
  - [x] `HreflangTags.jsx` - Bilingual SEO tags
  - [x] `StructuredData.jsx` - Schema.org JSON-LD
  - [x] `Breadcrumbs.jsx` - Navigation breadcrumbs
- [x] Public Components
  - [x] `PublicNav.jsx` - Public navigation with dropdowns
  - [x] `LanguageSwitcher.jsx` - EN/IT language toggle
  - [x] `CTASection.jsx` - Conversion sections
- [x] Routing
  - [x] `PublicRoutes.jsx` - React Router configuration
- [x] Main Landing Page
  - [x] `LandingPage.jsx` - Main hub page (EN + IT)
  - [x] `LandingPage.css` - Styling
- [x] Format Page Template
  - [x] `FormatPage.jsx` - Reusable format page component
  - [x] `FormatPage.css` - Format page styling
- [x] Sitemaps
  - [x] `sitemap-index.xml`
  - [x] `sitemap-en-pages.xml`
  - [x] `sitemap-it-pages.xml`

## 🚧 REMAINING WORK

### 1. Install Dependencies
```bash
cd /home/workstation/progetti/magicdeckgen/magic-deck-generator
npm install
```

### 2. Update main.jsx
File: `/src/main.jsx`

Replace content with:
```jsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { HelmetProvider } from 'react-helmet-async'
import App from './App.jsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <HelmetProvider>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </HelmetProvider>
  </React.StrictMode>,
)
```

### 3. Create Format Page Wrappers

Create these 10 files (5 formats × 2 languages):

**File: `/src/pages/public/formats/CedhDeckBuilder.jsx`**
```jsx
import FormatPage from './FormatPage';

const CedhDeckBuilderEN = () => <FormatPage format="cedh" lang="en" />;
const CedhDeckBuilderIT = () => <FormatPage format="cedh" lang="it" />;

export { CedhDeckBuilderEN, CedhDeckBuilderIT };
```

**File: `/src/pages/public/formats/PremodernDeckBuilder.jsx`**
```jsx
import FormatPage from './FormatPage';

const PremodernDeckBuilderEN = () => <FormatPage format="premodern" lang="en" />;
const PremodernDeckBuilderIT = () => <FormatPage format="premodern" lang="it" />;

export { PremodernDeckBuilderEN, PremodernDeckBuilderIT };
```

**File: `/src/pages/public/formats/PauperDeckBuilder.jsx`**
```jsx
import FormatPage from './FormatPage';

const PauperDeckBuilderEN = () => <FormatPage format="pauper" lang="en" />;
const PauperDeckBuilderIT = () => <FormatPage format="pauper" lang="it" />;

export { PauperDeckBuilderEN, PauperDeckBuilderIT };
```

**Repeat for Vintage and Highlander**

### 4. Update FormatPage.jsx

Add content for Vintage and Highlander formats to the `formatContent` object in `FormatPage.jsx`.

### 5. Create Feature Pages (8 files needed)

Create these feature pages following the same pattern as LandingPage:

- `/src/pages/public/features/WhatDecksCanIBuild.jsx`
- `/src/pages/public/features/DeckCompletionChecker.jsx`
- `/src/pages/public/features/MatchCollectionToDecklist.jsx`
- `/src/pages/public/features/CollectionUploadGuide.jsx`

Each should have EN and IT versions.

### 6. Create Blog Pages (10 files needed)

Create these blog posts:

- `/src/pages/public/blog/CompetitiveFormatsGuide.jsx`
- `/src/pages/public/blog/BudgetDeckBuilding.jsx`
- `/src/pages/public/blog/CollectionManagement.jsx`
- `/src/pages/public/blog/TournamentPreparation.jsx`
- `/src/pages/public/blog/DeckOptimization.jsx`

Each should have EN and IT versions.

### 7. Update PublicRoutes.jsx

Add all routes:

```jsx
import { Routes, Route, Navigate } from 'react-router-dom';
import LandingPage from '../pages/public/LandingPage';
import { CedhDeckBuilderEN, CedhDeckBuilderIT } from '../pages/public/formats/CedhDeckBuilder';
import { PremodernDeckBuilderEN, PremodernDeckBuilderIT } from '../pages/public/formats/PremodernDeckBuilder';
// ... import all other pages

const PublicRoutes = () => {
  return (
    <Routes>
      {/* Main Landing */}
      <Route path="/en/mtg-deck-builder-from-collection" element={<LandingPage lang="en" />} />
      <Route path="/it/costruttore-mazzi-mtg-da-collezione" element={<LandingPage lang="it" />} />
      
      {/* Format Pages */}
      <Route path="/en/cedh-deck-builder-from-collection" element={<CedhDeckBuilderEN />} />
      <Route path="/it/costruttore-mazzi-cedh-da-collezione" element={<CedhDeckBuilderIT />} />
      
      {/* Add all other routes */}
      
      {/* Default redirect */}
      <Route path="/" element={<Navigate to="/en/mtg-deck-builder-from-collection" replace />} />
    </Routes>
  );
};
```

### 8. Update App.jsx

Modify App.jsx to integrate public routes with protected app routes:

```jsx
import { Routes, Route } from 'react-router-dom';
import PublicRoutes from './routes/PublicRoutes';
// ... existing imports

function App() {
  // ... existing state and logic
  
  return (
    <Routes>
      {/* Public SEO pages */}
      <Route path="/en/*" element={<PublicRoutes />} />
      <Route path="/it/*" element={<PublicRoutes />} />
      
      {/* Protected app */}
      <Route path="/app" element={/* existing app logic */} />
    </Routes>
  );
}
```

### 9. Create Blog Sitemaps

**File: `/public/sitemap-en-blog.xml`**
**File: `/public/sitemap-it-blog.xml`**

Add all 5 blog posts to each sitemap.

### 10. Update robots.txt

Ensure robots.txt points to sitemap-index.xml:

```
User-agent: *
Allow: /

Sitemap: https://magicdeckbuilder.app.cloudsw.site/sitemap-index.xml
```

### 11. Create OG Image

Create `/public/og-image.jpg` (1200x630px) with:
- Magic Deck Builder branding
- Tagline: "Build Tournament Decks from Your Collection"
- Visual: MTG cards or deck imagery

## 📊 Page Count Summary

| Category | EN Pages | IT Pages | Total |
|----------|----------|----------|-------|
| Main Landing | 1 | 1 | 2 |
| Format Pages | 5 | 5 | 10 |
| Feature Pages | 4 | 4 | 8 |
| Blog Posts | 5 | 5 | 10 |
| **TOTAL** | **15** | **15** | **30** |

## 🎯 Priority Order

1. **HIGH PRIORITY** - Install dependencies and update main.jsx
2. **HIGH PRIORITY** - Create format page wrappers and update routes
3. **MEDIUM PRIORITY** - Create feature pages
4. **MEDIUM PRIORITY** - Create blog posts
5. **LOW PRIORITY** - Create OG image and finalize sitemaps

## 🧪 Testing Checklist

After implementation:

- [ ] All routes load without errors
- [ ] Language switcher works correctly
- [ ] Hreflang tags present on all pages
- [ ] Structured data validates (Google Rich Results Test)
- [ ] Internal links work correctly
- [ ] Mobile responsive on all pages
- [ ] Meta tags unique per page
- [ ] Breadcrumbs display correctly
- [ ] Sitemaps accessible at /sitemap-index.xml
- [ ] No console errors

## 📈 SEO Validation

Use these tools:

1. **Google Search Console** - Submit sitemaps
2. **Google Rich Results Test** - Validate structured data
3. **Screaming Frog** - Crawl site for issues
4. **PageSpeed Insights** - Check performance
5. **Mobile-Friendly Test** - Verify mobile UX

## 🚀 Deployment

After all pages are created:

1. Build production: `npm run build`
2. Test production build: `npm run preview`
3. Deploy to CloudSW
4. Submit sitemaps to Google Search Console
5. Monitor indexing status (7-14 days)
6. Track rankings in Google Analytics

## 📝 Content Writing Guidelines

When creating remaining pages:

- **H1**: Include primary keyword, make it compelling
- **Meta Description**: 150-160 chars, include CTA
- **First Paragraph**: Include primary keyword in first 100 words
- **Internal Links**: 3-5 links to related pages
- **Content Length**: 800-1200 words for feature pages, 1500-2000 for blog posts
- **Images**: Add relevant images with descriptive alt text
- **CTAs**: Include 2-3 CTAs per page (hero, mid-content, footer)

## 🎨 Design Consistency

All pages should use:

- Same color scheme (purple/pink gradients)
- Consistent typography (font sizes, weights)
- Same navigation structure
- Same footer
- Same CTA button styles
- Mobile-first responsive design
