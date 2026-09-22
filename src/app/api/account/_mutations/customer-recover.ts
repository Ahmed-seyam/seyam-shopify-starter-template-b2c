// Triggers Shopify's password-reset email. Its Online Store link is forwarded
// to /account/reset?reset_url=… by the redirect theme (redirect-theme/).
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
