/**
 * Storefront navigation config. Labels are next-intl keys under `nav.*`;
 * hrefs point at Shopify collection handles (edit per store). An item with
 * `columns` opens the mega menu; `promo` fills its image tile.
 */

export type NavLinkConfig = {
  labelKey: string;
  href: string;
};

export type NavColumnConfig = {
  titleKey: string;
  links: NavLinkConfig[];
};

export type NavItemConfig = NavLinkConfig & {
  columns?: NavColumnConfig[];
  promo?: {
    href: string;
    image?: string;
    labelKey: string;
  };
};

export const navItems: NavItemConfig[] = [
  {
    labelKey: "outerwear",
    href: "/collections/outerwear",
    columns: [
      {
        titleKey: "columns.shop",
        links: [
          { labelKey: "columns.allOuterwear", href: "/collections/outerwear" },
          { labelKey: "columns.coats", href: "/collections/coats" },
          { labelKey: "columns.vests", href: "/collections/vests" },
          { labelKey: "columns.jackets", href: "/collections/jackets" },
        ],
      },
      {
        titleKey: "columns.material",
        links: [
          { labelKey: "columns.wool", href: "/collections/wool" },
          { labelKey: "columns.quilted", href: "/collections/quilted" },
          { labelKey: "columns.shearling", href: "/collections/shearling" },
        ],
      },
      {
        titleKey: "columns.fit",
        links: [
          { labelKey: "columns.regular", href: "/collections/regular-fit" },
          { labelKey: "columns.relaxed", href: "/collections/relaxed-fit" },
        ],
      },
    ],
    promo: {
      href: "/collections/outerwear",
      labelKey: "columns.featuredLink",
    },
  },
  { labelKey: "knitwear", href: "/collections/knitwear" },
  { labelKey: "tops", href: "/collections/tops" },
  { labelKey: "bottoms", href: "/collections/bottoms" },
  { labelKey: "accessories", href: "/collections/accessories" },
  { labelKey: "giftCards", href: "/gift-cards" },
];
