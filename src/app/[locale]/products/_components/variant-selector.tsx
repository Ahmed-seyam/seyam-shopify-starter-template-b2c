"use client";

import { useSearchParams } from "next/navigation";
import { usePathname, useRouter } from "@/i18n/navigation";
import type { ProductOption, ProductVariant } from "@/types/product";
import { OptionPill } from "./option-pill";

/**
 * Selection state lives in the URL (?Color=Red&Size=M) so PDP links are
 * shareable and the server resolves the variant on each render. Renders the
 * shared option-pill primitives (states per spec #s-variants).
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

  if (
    options.length === 0 ||
    (options.length === 1 && options[0].values.length === 1)
  ) {
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
    <div className="flex flex-col gap-5">
      {options.map((option) => {
        const chosen = searchParams.get(option.name);
        return (
          <fieldset key={option.name}>
            <legend className="mb-2.5 flex items-baseline gap-2 text-sm font-medium text-foreground">
              {option.name}
              {chosen && (
                <span className="font-normal text-muted-foreground">
                  {chosen}
                </span>
              )}
            </legend>
            <div className="flex flex-wrap gap-2">
              {option.values.map((value) => (
                <OptionPill
                  key={value}
                  selected={chosen === value}
                  unavailable={!isAvailable(option.name, value)}
                  onClick={() => select(option.name, value)}
                >
                  {value}
                </OptionPill>
              ))}
            </div>
          </fieldset>
        );
      })}
    </div>
  );
}
