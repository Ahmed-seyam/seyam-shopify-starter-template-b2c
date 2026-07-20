"use client";

import { SearchIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import {
  IconButton,
  Popover,
  PopoverContent,
  PopoverTrigger,
  Price,
  SearchInput,
  Spinner,
} from "@/components/ui";
import { useSearch } from "@/hooks/use-search";
import { Link, useRouter } from "@/i18n/navigation";
import { track } from "@/plugins/client/tracking";

/** Header search: popover with live product suggestions. */
export function SearchPopup() {
  const t = useTranslations("search");
  const router = useRouter();

  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const { results: visible, isSearching: pending } = useSearch(query);

  const submit = () => {
    const q = query.trim();
    if (!q) return;
    track.search(q);
    setOpen(false);
    router.push(`/search?q=${encodeURIComponent(q)}`);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <IconButton aria-label={t("title")}>
          <SearchIcon />
        </IconButton>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-[min(92vw,26rem)] p-3">
        <form
          onSubmit={(event) => {
            event.preventDefault();
            submit();
          }}
        >
          <SearchInput
            autoFocus
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={t("placeholder")}
            className="h-10"
          />
        </form>

        {pending && (
          <div className="flex justify-center py-4">
            <Spinner className="text-muted-foreground" />
          </div>
        )}

        {!pending && visible.length > 0 && (
          <ul className="mt-2 grid gap-1">
            {visible.map((product) => (
              <li key={product.id}>
                <Link
                  href={`/products/${product.handle}`}
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-3 rounded-md p-2 transition-colors hover:bg-muted/60"
                >
                  {/* Thumb kept as a plain sized frame — ImageFrame is fill-based. */}
                  <span className="relative size-10 shrink-0 overflow-hidden rounded-sm bg-muted">
                    {product.featuredImage && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={product.featuredImage.url}
                        alt=""
                        className="absolute inset-0 size-full object-cover"
                      />
                    )}
                  </span>
                  <span className="min-w-0 flex-1 truncate text-sm text-foreground">
                    {product.title}
                  </span>
                  <Price
                    money={product.minPrice}
                    compareAt={product.compareAtPrice}
                    className="shrink-0 text-sm"
                  />
                </Link>
              </li>
            ))}
          </ul>
        )}

        {query.trim().length >= 2 && (
          <button
            type="button"
            onClick={submit}
            className="mt-2 w-full cursor-pointer rounded-md py-2 text-center text-sm font-medium text-primary transition-colors hover:bg-muted/60"
          >
            {t("viewAll", { query: query.trim() })}
          </button>
        )}
      </PopoverContent>
    </Popover>
  );
}
