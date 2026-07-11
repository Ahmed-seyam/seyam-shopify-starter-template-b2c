export const GET_CUSTOMER_QUERY = /* GraphQL */ `
  query getCustomer {
    customer {
      firstName
      lastName
      displayName
      emailAddress {
        emailAddress
      }
    }
  }
`;
