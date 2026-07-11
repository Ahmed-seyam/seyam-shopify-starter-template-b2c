// Account registration. Returns only the customer id — sign-in is a separate
// customerAccessTokenCreate call (the register action chains them).
export const CUSTOMER_CREATE_MUTATION = /* GraphQL */ `
  mutation customerCreate(
    $input: CustomerCreateInput!
    $country: CountryCode
    $language: LanguageCode
  ) @inContext(country: $country, language: $language) {
    customerCreate(input: $input) {
      customer {
        id
      }
      userErrors: customerUserErrors {
        code
        field
        message
      }
    }
  }
`;
