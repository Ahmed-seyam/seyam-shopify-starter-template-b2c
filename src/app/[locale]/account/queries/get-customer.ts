// Storefront API customer profile. The access token is a query argument (not
// a header) — Shopify returns `customer: null` for an expired/invalid token
// rather than erroring, which the action maps to "signed out".
export const GET_CUSTOMER_QUERY = /* GraphQL */ `
  query getCustomer(
    $customerAccessToken: String!
    $country: CountryCode
    $language: LanguageCode
  ) @inContext(country: $country, language: $language) {
    customer(customerAccessToken: $customerAccessToken) {
      firstName
      lastName
      displayName
      email
      acceptsMarketing
    }
  }
`;
