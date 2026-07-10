# content domain

Reserved for CMS-driven content via **Shopify metaobjects** (self-contained,
no external CMS account needed). Planned shape:

```
content/
  queries/     get-page.ts, get-metaobject.ts   (server-only, tags: page:<handle>)
  components/  rich-text.tsx, hero.tsx
  types/
```

Notes for implementation:

- Tag queries with `pageTag(handle)` from `core/cache/tags` and add the
  `pages/update` + metaobject webhook topics to `core/cache/invalidation.ts`.
- Design the query interface so Sanity (or any CMS) can slot in behind the
  same functions — the rest of the app should not know the content source.
