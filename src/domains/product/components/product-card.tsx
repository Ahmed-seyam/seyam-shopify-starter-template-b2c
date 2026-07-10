import Image from "next/image";
import { useTranslations } from "next-intl";
import { Badge } from "@/core/ui/badge";
import { Card, CardContent } from "@/core/ui/card";
import { Link } from "@/i18n/navigation";
import type { ProductCard as ProductCardType } from "../types";
import { Price } from "./price";

export function ProductCard({ product }: { product: ProductCardType }) {
  const t = useTranslations("product");

  return (
    <Link href={`/products/${product.handle}`} className="group">
      <Card className="h-full overflow-hidden py-0 gap-0 transition-shadow group-hover:shadow-md">
        <div className="relative aspect-square bg-muted">
          {product.featuredImage ? (
            <Image
              src={product.featuredImage.url}
              alt={product.featuredImage.altText ?? product.title}
              fill
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              className="object-cover transition-transform duration-300 group-hover:scale-105"
            />
          ) : null}
          {!product.availableForSale && (
            <Badge variant="secondary" className="absolute top-2 start-2">
              {t("outOfStock")}
            </Badge>
          )}
        </div>
        <CardContent className="p-4">
          <h3 className="line-clamp-2 text-sm font-medium">{product.title}</h3>
          <Price
            money={product.minPrice}
            compareAt={product.compareAtPrice}
            className="mt-1 text-sm"
          />
        </CardContent>
      </Card>
    </Link>
  );
}
