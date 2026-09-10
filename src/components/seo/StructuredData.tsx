import React from 'react';

/**
 * Task 47: Schema.org Structured Data & Google Sitelinks Searchbox
 * Injects valid JSON-LD metadata for:
 * 1. WebSite with SearchAction (Google Sitelinks Searchbox)
 * 2. BookStore / LocalBusiness (Malda Town, West Bengal)
 * 3. OfferCatalog for current deals and student book collections
 */
export const StructuredData: React.FC = () => {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://mmbookhousemalda.com';

  const structuredData = {
    '@context': 'https://schema.org',
    '@graph': [
      // 1. WebSite & Google Sitelinks SearchAction
      {
        '@type': 'WebSite',
        '@id': `${baseUrl}/#website`,
        url: baseUrl,
        name: 'M.M Book House Malda',
        alternateName: [
          'MM Book House',
          'এম.এম বুক হাউস মালদা',
          'M.M Book House Online Store',
          'Malda Online Book Store',
        ],
        description:
          'মালদা ও সমগ্র পশ্চিমবঙ্গের শিক্ষার্থীদের জন্য নির্ভরযোগ্য অনলাইন বইয়ের দোকান। স্কুল, কলেজ, WBCS ও প্রতিযোগিতামূলক পরীক্ষার বই সুলভ মূল্যে।',
        inLanguage: ['bn', 'en'],
        potentialAction: {
          '@type': 'SearchAction',
          target: {
            '@type': 'EntryPoint',
            urlTemplate: `${baseUrl}/search?q={search_term_string}`,
          },
          'query-input': 'required name=search_term_string',
        },
      },
      // 2. BookStore LocalBusiness Metadata
      {
        '@type': 'BookStore',
        '@id': `${baseUrl}/#bookstore`,
        name: 'M.M Book House Malda',
        alternateName: 'এম.এম বুক হাউস',
        url: baseUrl,
        logo: `${baseUrl}/logo.png`,
        image: `${baseUrl}/storefront.jpg`,
        telephone: '+91 98765 43210',
        priceRange: '₹₹',
        currenciesAccepted: 'INR',
        paymentAccepted: 'Cash on Delivery, UPI (GooglePay, PhonePe, Paytm), Credit Card, Debit Card, Net Banking',
        address: {
          '@type': 'PostalAddress',
          streetAddress: 'Netaji Commercial Market, Rabindra Avenue, Malda Town',
          addressLocality: 'Malda',
          addressRegion: 'West Bengal',
          postalCode: '732101',
          addressCountry: 'IN',
        },
        geo: {
          '@type': 'GeoCoordinates',
          latitude: 25.0108,
          longitude: 88.1411,
        },
        openingHoursSpecification: [
          {
            '@type': 'OpeningHoursSpecification',
            dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
            opens: '09:00',
            closes: '21:00',
          },
        ],
        areaServed: [
          {
            '@type': 'AdministrativeArea',
            name: 'Malda District',
          },
          {
            '@type': 'AdministrativeArea',
            name: 'Murshidabad District',
          },
          {
            '@type': 'AdministrativeArea',
            name: 'Uttar Dinajpur District',
          },
          {
            '@type': 'AdministrativeArea',
            name: 'Dakshin Dinajpur District',
          },
          {
            '@type': 'State',
            name: 'West Bengal',
          },
        ],
      },
      // 3. OfferCatalog (Current Hero Deals & Featured Student Collections)
      {
        '@type': 'OfferCatalog',
        '@id': `${baseUrl}/#deals-catalog`,
        name: 'M.M Book House Deals of the Day & Student Specials',
        itemListElement: [
          {
            '@type': 'Offer',
            name: 'WBCS ২০২৬ প্রিলিমস ক্র্যাকার ও প্র্যাকটিস সেট',
            price: '585',
            priceCurrency: 'INR',
            availability: 'https://schema.org/InStock',
            priceValidUntil: '2026-12-31',
            seller: {
              '@id': `${baseUrl}/#bookstore`,
            },
            itemOffered: {
              '@type': 'Book',
              name: 'WBCS ২০২৬ প্রিলিমস ক্র্যাকার ও প্র্যাকটিস সেট',
              inLanguage: 'bn',
              bookFormat: 'https://schema.org/Paperback',
              publisher: {
                '@type': 'Organization',
                name: 'M.M Publications Malda',
              },
            },
          },
          {
            '@type': 'Offer',
            name: 'উচ্চমাধ্যমিক ২০২৬ এবিটিএ টেস্ট পেপারস সমাধান',
            price: '375',
            priceCurrency: 'INR',
            availability: 'https://schema.org/InStock',
            priceValidUntil: '2026-12-31',
            seller: {
              '@id': `${baseUrl}/#bookstore`,
            },
            itemOffered: {
              '@type': 'Book',
              name: 'উচ্চমাধ্যমিক ২০২৬ এবিটিএ টেস্ট পেপারস সমাধান',
              inLanguage: 'bn',
              bookFormat: 'https://schema.org/Paperback',
              publisher: {
                '@type': 'Organization',
                name: 'ABTA West Bengal',
              },
            },
          },
          {
            '@type': 'Offer',
            name: 'গৌড়বঙ্গ বিশ্ববিদ্যালয় ইতিহাস ও রাষ্ট্রবিজ্ঞান অনার্স মাস্টার গাইড',
            price: '460',
            priceCurrency: 'INR',
            availability: 'https://schema.org/InStock',
            priceValidUntil: '2026-12-31',
            seller: {
              '@id': `${baseUrl}/#bookstore`,
            },
            itemOffered: {
              '@type': 'Book',
              name: 'গৌড়বঙ্গ বিশ্ববিদ্যালয় ইতিহাস ও রাষ্ট্রবিজ্ঞান অনার্স মাস্টার গাইড',
              inLanguage: 'bn',
              bookFormat: 'https://schema.org/Paperback',
              publisher: {
                '@type': 'Organization',
                name: 'University of Gour Banga Study Circle',
              },
            },
          },
        ],
      },
    ],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
    />
  );
};
