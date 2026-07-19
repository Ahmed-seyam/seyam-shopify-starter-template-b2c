# content domain

CMS-driven content via **Shopify pages + metaobjects** (self-contained, no
external CMS account needed). Implemented:

```
content/
  queries/     GraphQL query documents (get-page.ts, get-metaobject.ts)
  actions/     get-page.ts, get-metaobject.ts (server-only, tag-cached)
  types/       Page, Metaobject (fields keyed by field key)
```

- Route: `/[locale]/pages/[handle]` renders Shopify pages (ISR on first
  hit; `pages/*` webhook topics invalidate `pages` + `page:<handle>` tags).
- Metaobjects: `getMetaobject(type, handle, locale)` for structured blocks
  (hero sections, banners, FAQ …); `metaobjects/*` webhook topics
  invalidate `metaobjects` + `metaobject:<handle>`.
- Both queries run through `@inContext` so Markets translations apply.
- Swapping in Sanity (or any CMS) means re-implementing the two action
  functions behind the same signatures — callers only see domain types.
