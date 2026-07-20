import * as React from "react";
import Image from "next/image";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/utils";

const imageFrameVariants = cva(
  "relative isolate block w-full overflow-hidden bg-muted",
  {
    variants: {
      ratio: {
        portrait: "aspect-[3/4]",
        square: "aspect-square",
        landscape: "aspect-[4/3]",
        wide: "aspect-[16/9]",
        auto: "",
      },
      radius: {
        md: "rounded-md",
        lg: "rounded-lg",
        xl: "rounded-xl",
        none: "rounded-none",
      },
    },
    defaultVariants: {
      ratio: "portrait",
      radius: "lg",
    },
  }
);

/**
 * Rounded, aspect-ratio'd next/image wrapper. Renders a token-toned
 * placeholder when `src` is missing. Extra children (badges, actions)
 * overlay the image.
 */
function ImageFrame({
  src,
  alt,
  ratio,
  radius,
  sizes = "100vw",
  priority,
  imgClassName,
  className,
  children,
  ...props
}: React.ComponentProps<"div"> &
  VariantProps<typeof imageFrameVariants> & {
    src?: string | null;
    alt: string;
    sizes?: string;
    priority?: boolean;
    imgClassName?: string;
  }) {
  return (
    <div
      data-slot="image-frame"
      className={cn(imageFrameVariants({ ratio, radius }), className)}
      {...props}
    >
      {src ? (
        <Image
          src={src}
          alt={alt}
          fill
          sizes={sizes}
          priority={priority}
          className={cn("object-cover", imgClassName)}
        />
      ) : (
        <span
          aria-hidden
          className="absolute inset-0 bg-gradient-to-br from-muted to-secondary"
        />
      )}
      {children}
    </div>
  );
}

export { ImageFrame, imageFrameVariants };
