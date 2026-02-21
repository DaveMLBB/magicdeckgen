# SEO Implementation Guide - Magic Deck Builder

## 📋 Implementation Status

### ✅ Completed
- [x] Package.json updated with react-router-dom and react-helmet-async
- [x] SEO components created (SEOHead, HreflangTags, StructuredData, Breadcrumbs)
- [x] Public components created (PublicNav, LanguageSwitcher, CTASection)
- [x] Main landing page created (LandingPage.jsx)

### 🚧 Next Steps

#### 1. Install Dependencies
```bash
cd /home/workstation/progetti/magicdeckgen/magic-deck-generator
npm install
```

#### 2. Update main.jsx
Replace the current main.jsx with React Router setup:
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

#### 3. Create Remaining Pages

**Format Pages (10 files - 5 EN + 5 IT):**
- `/src/pages/public/formats/CedhDeckBuilder.jsx` (EN + IT versions)
- `/src/pages/public/formats/PremodernDeckBuilder.jsx` (EN + IT versions)
- `/src/pages/public/formats/PauperDeckBuilder.jsx` (EN + IT versions)
- `/src/pages/public/formats/VintageDeckBuilder.jsx` (EN + IT versions)
- `/src/pages/public/formats/HighlanderDeckBuilder.jsx` (EN + IT versions)

**Feature Pages (8 files - 4 EN + 4 IT):**
- `/src/pages/public/features/WhatDecksCanIBuild.jsx` (EN + IT versions)
- `/src/pages/public/features/DeckCompletionChecker.jsx` (EN + IT versions)
- `/src/pages/public/features/MatchCollectionToDecklist.jsx` (EN + IT versions)
- `/src/pages/public/features/CollectionUploadGuide.jsx` (EN + IT versions)

**Blog Pages (10 files - 5 EN + 5 IT):**
- `/src/pages/public/blog/CompetitiveFormatsGuide.jsx` (EN + IT versions)
- `/src/pages/public/blog/BudgetDeckBuilding.jsx` (EN + IT versions)
- `/src/pages/public/blog/CollectionManagement.jsx` (EN + IT versions)
- `/src/pages/public/blog/TournamentPreparation.jsx` (EN + IT versions)
- `/src/pages/public/blog/DeckOptimization.jsx` (EN + IT versions)

#### 4. Update App.jsx with Routes

Add React Router configuration to App.jsx to handle both public pages and protected app routes.

#### 5. Generate Public Assets

**Sitemap Files:**
- `/public/sitemap-index.xml`
- `/public/sitemap-en-pages.xml`
- `/public/sitemap-it-pages.xml`
- `/public/sitemap-en-blog.xml`
- `/public/sitemap-it-blog.xml`

**Robots.txt:**
- `/public/robots.txt`

**OG Image:**
- `/public/og-image.jpg` (1200x630px)

## 🎯 Page Template Structure

Each page should follow this structure:

```jsx
import SEOHead from '../../components/seo/SEOHead';
import HreflangTags from '../../components/seo/HreflangTags';
import StructuredData from '../../components/seo/StructuredData';
import PublicNav from '../../components/public/PublicNav';
import CTASection from '../../components/public/CTASection';
import Breadcrumbs from '../../components/seo/Breadcrumbs';

const PageName = ({ lang = 'en' }) => {
  // SEO metadata
  // Content translations
  // Structured data
  
  return (
    <div className="page-wrapper">
      <SEOHead {...seoProps} />
      <HreflangTags {...hreflangProps} />
      <StructuredData {...structuredDataProps} />
      <PublicNav lang={lang} currentPath={currentPath} />
      <Breadcrumbs items={breadcrumbItems} lang={lang} />
      
      {/* Page content */}
      
      <CTASection lang={lang} />
      <footer>...</footer>
    </div>
  );
};
```

## 📊 URL Structure Reference

| Page Type | EN URL | IT URL |
|-----------|--------|--------|
| Main Landing | `/en/mtg-deck-builder-from-collection` | `/it/costruttore-mazzi-mtg-da-collezione` |
| cEDH | `/en/cedh-deck-builder-from-collection` | `/it/costruttore-mazzi-cedh-da-collezione` |
| Premodern | `/en/premodern-deck-builder-from-collection` | `/it/costruttore-mazzi-premodern-da-collezione` |
| Pauper | `/en/pauper-deck-builder-from-collection` | `/it/costruttore-mazzi-pauper-da-collezione` |
| Vintage | `/en/vintage-deck-builder-from-collection` | `/it/costruttore-mazzi-vintage-da-collezione` |
| Highlander | `/en/highlander-deck-builder-from-collection` | `/it/costruttore-mazzi-highlander-da-collezione` |
| What Decks | `/en/what-mtg-decks-can-i-build` | `/it/quali-mazzi-mtg-posso-costruire` |
| Completion | `/en/mtg-deck-completion-checker` | `/it/verifica-completamento-mazzo-mtg` |
| Matcher | `/en/match-mtg-collection-to-decklist` | `/it/abbina-collezione-mtg-a-decklist` |
| Upload Guide | `/en/upload-mtg-collection-csv-excel` | `/it/caricare-collezione-mtg-csv-excel` |

## 🔧 Development Workflow

1. **Run npm install** to get dependencies
2. **Test routing** by starting dev server: `npm run dev`
3. **Create remaining pages** using the template structure
4. **Generate sitemaps** after all pages are created
5. **Test hreflang** tags in browser dev tools
6. **Validate structured data** with Google Rich Results Test
7. **Submit sitemaps** to Google Search Console

## 📝 Content Guidelines

- Keep H1 tags unique per page
- Meta descriptions: 150-160 characters
- Include primary keyword in first 100 words
- Add internal links to 3-5 related pages
- Use semantic HTML (h1, h2, h3 hierarchy)
- Optimize images with alt text
- Ensure mobile responsiveness

## 🚀 Deployment Checklist

- [ ] All 30 pages created and tested
- [ ] Sitemaps generated and accessible
- [ ] Robots.txt configured
- [ ] Hreflang tags verified
- [ ] Structured data validated
- [ ] Internal linking complete
- [ ] Mobile responsive tested
- [ ] Page speed optimized
- [ ] Google Search Console setup
- [ ] Google Analytics configured

## 📈 Post-Launch Tasks

1. Submit sitemaps to Google Search Console
2. Monitor indexing status
3. Track keyword rankings
4. Analyze user behavior (GA4)
5. A/B test meta descriptions
6. Update content quarterly
7. Build backlinks to blog posts
8. Monitor Core Web Vitals

## 🎨 Design Notes

- Primary color: #667eea (purple gradient)
- Secondary color: #f093fb (pink gradient)
- Background: #0f0f1e (dark blue)
- Text: #ffffff (white)
- Accent: #4a9eff (blue)

All pages should maintain consistent branding and visual hierarchy.
