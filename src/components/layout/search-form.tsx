"use client";

import { SearchIcon } from "lucide-react";
import { Input } from "@/core/ui/input";
import { useRouter } from "@/i18n/navigation";

export function SearchForm({ placeholder }: { placeholder: string }) {
  const router = useRouter();

  return (
    <form
      className="relative w-full max-w-sm"
      onSubmit={(event) => {
        event.preventDefault();
        const query = new FormData(event.currentTarget).get("q");
        if (typeof query === "string" && query.trim()) {
          router.push(`/search?q=${encodeURIComponent(query.trim())}`);
        }
      }}
    >
      <SearchIcon className="absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
      <Input name="q" placeholder={placeholder} className="ps-9" />
    </form>
  );
}
