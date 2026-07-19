"use client";

import * as React from "react";
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { IconButton } from "@/components/ui/buttons";

/**
 * Scroll-snap carousel with arrow controls and bar-dot indicators
 * (per the hero spec). Each child becomes one snap slide.
 */
function Carousel({
  className,
  slideClassName,
  showArrows = true,
  showDots = true,
  children,
}: {
  className?: string;
  slideClassName?: string;
  showArrows?: boolean;
  showDots?: boolean;
  children: React.ReactNode;
}) {
  const trackRef = React.useRef<HTMLDivElement>(null);
  const [index, setIndex] = React.useState(0);
  const slides = React.Children.toArray(children);

  const scrollTo = (i: number) => {
    const track = trackRef.current;
    if (!track) return;
    const clamped = Math.max(0, Math.min(slides.length - 1, i));
    const slide = track.children[clamped] as HTMLElement | undefined;
    slide?.scrollIntoView({
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
        ? "auto"
        : "smooth",
      block: "nearest",
      inline: "start",
    });
  };

  const onScroll = () => {
    const track = trackRef.current;
    if (!track) return;
    const slideWidth = (track.children[0] as HTMLElement | undefined)
      ?.offsetWidth;
    if (!slideWidth) return;
    setIndex(Math.round(Math.abs(track.scrollLeft) / slideWidth));
  };

  return (
    <div data-slot="carousel" className={cn("group relative", className)}>
      <div
        ref={trackRef}
        onScroll={onScroll}
        className="flex snap-x snap-mandatory overflow-x-auto scroll-smooth rounded-[inherit] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {slides.map((slide, i) => (
          <div
            key={i}
            className={cn("w-full shrink-0 snap-start", slideClassName)}
            aria-hidden={i !== index}
          >
            {slide}
          </div>
        ))}
      </div>

      {showArrows && slides.length > 1 && (
        <>
          <IconButton
            variant="surface"
            size="sm"
            aria-label="Previous slide"
            disabled={index === 0}
            onClick={() => scrollTo(index - 1)}
            className="absolute start-3 top-1/2 -translate-y-1/2 disabled:opacity-0"
          >
            <ChevronLeftIcon className="rtl:rotate-180" />
          </IconButton>
          <IconButton
            variant="surface"
            size="sm"
            aria-label="Next slide"
            disabled={index === slides.length - 1}
            onClick={() => scrollTo(index + 1)}
            className="absolute end-3 top-1/2 -translate-y-1/2 disabled:opacity-0"
          >
            <ChevronRightIcon className="rtl:rotate-180" />
          </IconButton>
        </>
      )}

      {showDots && slides.length > 1 && (
        <div className="absolute inset-x-0 bottom-3 flex justify-center gap-1.5">
          {slides.map((_, i) => (
            <button
              key={i}
              type="button"
              aria-label={`Go to slide ${i + 1}`}
              aria-current={i === index}
              onClick={() => scrollTo(i)}
              className={cn(
                "h-1 cursor-pointer rounded-full transition-all",
                i === index
                  ? "w-6 bg-surface"
                  : "w-3 bg-surface/50 hover:bg-surface/80"
              )}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export { Carousel };
