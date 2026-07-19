// customerUserErrors aliased to userErrors to match storefrontMutation's contract.
const USER_ERRORS = /* GraphQL */ `
  userErrors: customerUserErrors {
    field
    message
  }
`;

export const CUSTOMER_ADDRESS_CREATE_MUTATION = /* GraphQL */ `
  mutation customerAddressCreate(
    $customerAccessToken: String!
    $address: MailingAddressInput!
  ) {
    customerAddressCreate(
      customerAccessToken: $customerAccessToken
      address: $address
    ) {
      customerAddress {
        id
      }
      ${USER_ERRORS}
    }
  }
`;

export const CUSTOMER_ADDRESS_UPDATE_MUTATION = /* GraphQL */ `
  mutation customerAddressUpdate(
    $customerAccessToken: String!
    $id: ID!
    $address: MailingAddressInput!
  ) {
    customerAddressUpdate(
      customerAccessToken: $customerAccessToken
      id: $id
      address: $address
    ) {
      customerAddress {
        id
      }
      ${USER_ERRORS}
    }
  }
`;

export const CUSTOMER_ADDRESS_DELETE_MUTATION = /* GraphQL */ `
  mutation customerAddressDelete($customerAccessToken: String!, $id: ID!) {
    customerAddressDelete(customerAccessToken: $customerAccessToken, id: $id) {
      deletedCustomerAddressId
      ${USER_ERRORS}
    }
  }
`;

export const CUSTOMER_DEFAULT_ADDRESS_UPDATE_MUTATION = /* GraphQL */ `
  mutation customerDefaultAddressUpdate(
    $customerAccessToken: String!
    $addressId: ID!
  ) {
    customerDefaultAddressUpdate(
      customerAccessToken: $customerAccessToken
      addressId: $addressId
    ) {
      customer {
        id
      }
      ${USER_ERRORS}
    }
  }
`;
