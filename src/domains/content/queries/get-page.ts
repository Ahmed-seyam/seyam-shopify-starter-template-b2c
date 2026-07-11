export const GET_PAGE_QUERY = /* GraphQL */ `
  query getPage(
    $handle: String!
    $country: CountryCode
    $language: LanguageCode
  ) @inContext(country: $country, language: $language) {
    page(handle: $handle) {
      id
      handle
      title
      body
      bodySummary
      seo {
        title
        description
      }
      updatedAt
    }
  }
`;
