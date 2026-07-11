import { IMAGE_FRAGMENT, MONEY_FRAGMENT } from "@/core/shopify/fragments";

export const CART_FRAGMENT = /* GraphQL */ `
  fragment CartFragment on Cart {
    id
    checkoutUrl
    totalQuantity
    buyerIdentity {
      countryCode
    }
    cost {
      subtotalAmount {
        ...MoneyFragment
      }
      totalAmount {
        ...MoneyFragment
      }
    }
    lines(first: 100) {
      edges {
        node {
          id
          quantity
          cost {
            totalAmount {
              ...MoneyFragment
            }
          }
          merchandise {
            ... on ProductVariant {
              id
              title
              image {
                ...ImageFragment
              }
              product {
                handle
                title
              }
            }
          }
        }
      }
    }
  }
  ${MONEY_FRAGMENT}
  ${IMAGE_FRAGMENT}
`;

// Raw shape shared by cart queries and mutations — mirrors CartFragment.
export type RawCart = {
  id: string;
  checkoutUrl: string;
  totalQuantity: number;
  buyerIdentity: { countryCode: string | null } | null;
  cost: {
    subtotalAmount: { amount: string; currencyCode: string };
    totalAmount: { amount: string; currencyCode: string };
  };
  lines: {
    edges: Array<{
      node: {
        id: string;
        quantity: number;
        cost: {
          totalAmount: { amount: string; currencyCode: string };
        };
        merchandise: {
          id: string;
          title: string;
          image: {
            url: string;
            altText: string | null;
            width: number;
            height: number;
          } | null;
          product: { handle: string; title: string };
        };
      };
    }>;
  };
};
