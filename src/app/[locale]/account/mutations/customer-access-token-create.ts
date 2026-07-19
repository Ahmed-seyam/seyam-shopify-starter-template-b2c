// Classic Storefront API sign-in. `customerUserErrors` is aliased to
// `userErrors` so the payload matches storefrontMutation's contract.
export const CUSTOMER_ACCESS_TOKEN_CREATE_MUTATION = /* GraphQL */ `
  mutation customerAccessTokenCreate(
    $input: CustomerAccessTokenCreateInput!
    $country: CountryCode
    $language: LanguageCode
  ) @inContext(country: $country, language: $language) {
    customerAccessTokenCreate(input: $input) {
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
