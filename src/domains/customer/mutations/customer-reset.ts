// Completes a password reset with the id + token from the emailed link, and
// returns a fresh access token so the customer is signed in immediately.
export const CUSTOMER_RESET_MUTATION = /* GraphQL */ `
  mutation customerReset(
    $id: ID!
    $input: CustomerResetInput!
    $country: CountryCode
    $language: LanguageCode
  ) @inContext(country: $country, language: $language) {
    customerReset(id: $id, input: $input) {
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
