export const GET_METAOBJECT_QUERY = /* GraphQL */ `
  query getMetaobject(
    $handle: String!
    $type: String!
    $country: CountryCode
    $language: LanguageCode
  ) @inContext(country: $country, language: $language) {
    metaobject(handle: { handle: $handle, type: $type }) {
      id
      handle
      type
      updatedAt
      fields {
        key
        value
        type
      }
    }
  }
`;
