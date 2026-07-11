export const GET_ORDERS_QUERY = /* GraphQL */ `
  query getOrders($first: Int!) {
    customer {
      orders(first: $first, sortKey: PROCESSED_AT, reverse: true) {
        edges {
          node {
            id
            name
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
