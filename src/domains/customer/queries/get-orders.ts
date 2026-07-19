// Storefront API order history for the signed-in customer. @inContext keeps
// presentment currency consistent with the rest of the storefront.
export const GET_ORDERS_QUERY = /* GraphQL */ `
  query getOrders(
    $customerAccessToken: String!
    $first: Int!
    $country: CountryCode
    $language: LanguageCode
  ) @inContext(country: $country, language: $language) {
    customer(customerAccessToken: $customerAccessToken) {
      orders(first: $first, sortKey: PROCESSED_AT, reverse: true) {
        edges {
          node {
            id
            name
            orderNumber
            processedAt
            financialStatus
            totalPrice {
              amount
              currencyCode
            }
          }
        }
      }
    }
  }
`;
