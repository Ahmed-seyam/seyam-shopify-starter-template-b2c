// Triggers Shopify's password-reset email. The reset link points at
// /account/reset/[id]/[token] (configure the notification to this domain).
export const CUSTOMER_RECOVER_MUTATION = /* GraphQL */ `
  mutation customerRecover(
    $email: String!
    $country: CountryCode
    $language: LanguageCode
  ) @inContext(country: $country, language: $language) {
    customerRecover(email: $email) {
      userErrors: customerUserErrors {
        code
        field
        message
      }
    }
  }
`;
