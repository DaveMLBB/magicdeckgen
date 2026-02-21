import { Helmet } from 'react-helmet-async';

const HreflangTags = ({ enUrl, itUrl }) => {
  const siteUrl = 'https://magicdeckbuilder.app.cloudsw.site';
  
  return (
    <Helmet>
      <link rel="alternate" hrefLang="en" href={`${siteUrl}${enUrl}`} />
      <link rel="alternate" hrefLang="it" href={`${siteUrl}${itUrl}`} />
      <link rel="alternate" hrefLang="x-default" href={`${siteUrl}${enUrl}`} />
    </Helmet>
  );
};

export default HreflangTags;
