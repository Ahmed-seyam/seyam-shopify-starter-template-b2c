// Profile updates. customerUserErrors aliased to userErrors to match
// storefrontMutation's contract. Changing email/password invalidates the
// current access token — Shopify returns a fresh one when it does.
export const CUSTOMER_UPDATE_MUTATION = /* GraphQL */ `
  mutation customerUpdate(
    $customerAccessToken: String!
    $customer: CustomerUpdateInput!
  ) {
    customerUpdate(
      customerAccessToken: $customerAccessToken
      customer: $customer
    ) {
      customer {
        id
      }
      customerAccessToken {
        accessToken
        expiresAt
      }
      userErrors: customerUserErrors {
        code
        field
        message
      }
    }
  }
`;
