"use client";

import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import { useState } from "react";
import { IconButton, ImageFrame } from "@/components/ui";
import type { ShopifyImage } from "@/types/shopify";
import { cn } from "@/utils";

/**
 * PDP gallery — vertical thumbnail rail beside the main frame on desktop,
 * arrows over the main image on mobile.
 */
export function ProductGallery({
  images,
  title,
}: {
  images: ShopifyImage[];
  title: string;
}) {
  const [activeIndex, setActiveIndex] = useState(0);
  const active = images[activeIndex];

  if (!active) {
    return <ImageFrame src={null} alt={title} ratio="portrait" radius="xl" />;
  }

  const step = (delta: number) =>
    setActiveIndex((index) => (index + delta + images.length) % images.length);

  return (
    <div className="flex flex-col gap-3 md:flex-row">
      {images.length > 1 && (
        <div className="order-2 flex gap-2.5 overflow-x-auto md:order-1 md:max-h-[37.5rem] md:flex-col md:overflow-y-auto">
          {images.map((image, index) => (
            <button
              key={image.url}
              type="button"
              aria-label={`${title} ${index + 1}`}
              aria-current={index === activeIndex}
              onClick={() => setActiveIndex(index)}
              className={cn(
                "relative w-16 shrink-0 cursor-pointer overflow-hidden rounded-md border-2 outline-none focus-visible:ring-2 focus-visible:ring-ring/40",
                index === activeIndex
                  ? "border-foreground"
                  : "border-transparent opacity-70 hover:opacity-100"
              )}
            >
              <ImageFrame
                src={image.url}
                alt=""
                ratio="portrait"
                radius="none"
                sizes="64px"
              />
            </button>
          ))}
        </div>
      )}

      <div className="relative order-1 flex-1 md:order-2">
        <ImageFrame
          src={active.url}
          alt={active.altText ?? title}
          ratio="portrait"
          radius="xl"
          priority
          sizes="(max-width: 1024px) 100vw, 50vw"
        />
        {images.length > 1 && (
          <div className="md:hidden">
            <IconButton
              variant="surface"
              size="sm"
              aria-label="Previous image"
              onClick={() => step(-1)}
              className="absolute start-3 top-1/2 -translate-y-1/2"
            >
              <ChevronLeftIcon className="rtl:rotate-180" />
            </IconButton>
            <IconButton
              variant="surface"
              size="sm"
              aria-label="Next image"
              onClick={() => step(1)}
              className="absolute end-3 top-1/2 -translate-y-1/2"
            >
              <ChevronRightIcon className="rtl:rotate-180" />
            </IconButton>
          </div>
        )}
      </div>
    </div>
  );
}
