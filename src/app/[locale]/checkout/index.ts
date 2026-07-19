// Client components only — this barrel is safe to import from client code.
// (No server-only fetchers live in the checkout domain: the checkoutUrl comes
// from the cart domain, and payment/session state lives in Shopify's checkout.)
export { CheckoutButton } from "./components/checkout-button";
