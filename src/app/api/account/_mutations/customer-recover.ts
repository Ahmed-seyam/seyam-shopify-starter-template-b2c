// Triggers Shopify's password-reset email. The notification template must link
// to /account/reset?reset_url={{ customer.reset_password_url | url_encode }}.
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
