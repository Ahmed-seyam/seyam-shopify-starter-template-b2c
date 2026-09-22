// Completes a password reset from the full reset URL Shopify put in the email
// ({{ customer.reset_password_url }}, forwarded to /account/reset?reset_url=…
// by the redirect theme),
// and returns a fresh access token so the customer is signed in immediately.
export const CUSTOMER_RESET_BY_URL_MUTATION = /* GraphQL */ `
  mutation customerResetByUrl(
    $resetUrl: URL!
    $password: String!
    $country: CountryCode
    $language: LanguageCode
  ) @inContext(country: $country, language: $language) {
    customerResetByUrl(resetUrl: $resetUrl, password: $password) {
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
