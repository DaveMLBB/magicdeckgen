import { Helmet } from 'react-helmet-async';

const StructuredData = ({ type = 'WebPage', data }) => {
  const baseData = {
    '@context': 'https://schema.org',
    '@type': type,
    ...data
  };

  return (
    <Helmet>
      <script type="application/ld+json">
        {JSON.stringify(baseData)}
      </script>
    </Helmet>
  );
};

export default StructuredData;
