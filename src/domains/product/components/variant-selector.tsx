"use client";

import { useSearchParams } from "next/navigation";
import { Button } from "@/core/ui/button";
import { Label } from "@/core/ui/label";
import { usePathname, useRouter } from "@/i18n/navigation";
import type { ProductOption, ProductVariant } from "../types";

/**
 * Selection state lives in the URL (?Color=Red&Size=M) so PDP links are
 * shareable and the server resolves the variant on each render.
 */
export function VariantSelector({
  options,
  variants,
}: {
  options: ProductOption[];
  variants: ProductVariant[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  if (options.length === 1 && options[0]?.values.length === 1) {
    return null;
  }

  function select(optionName: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set(optionName, value);
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  }

  function isAvailable(optionName: string, value: string): boolean {
    // A value is offered if at least one in-stock variant matches it together
    // with the other currently selected options.
    return variants.some(
      (variant) =>
        variant.availableForSale &&
        variant.selectedOptions.every((selected) => {
          if (selected.name === optionName) return selected.value === value;
          const chosen = searchParams.get(selected.name);
          return chosen === null || chosen === selected.value;
        }),
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {options.map((option) => (
        <div key={option.name}>
          <Label className="mb-2 block">{option.name}</Label>
          <div className="flex flex-wrap gap-2">
            {option.values.map((value) => {
              const selected = searchParams.get(option.name) === value;
              return (
                <Button
                  key={value}
                  type="button"
                  size="sm"
                  variant={selected ? "default" : "outline"}
                  disabled={!isAvailable(option.name, value)}
                  onClick={() => select(option.name, value)}
                >
                  {value}
                </Button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
