import { useTranslations } from "next-intl";
import { Container, Heading, ImageFrame } from "@/components/ui";
import type { Collection } from "@/app/[locale]/collections";
import { Link } from "@/i18n/navigation";

export function CategoryGrid({ collections }: { collections: Collection[] }) {
  const t = useTranslations("home");

  return (
    <Container className="pb-12">
      <Heading level={3} className="mb-4">
        {t("shopByCategory")}
      </Heading>
      <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-3 lg:grid-cols-6">
        {collections.slice(0, 5).map((collection) => (
          <Link
            key={collection.id}
            href={`/collections/${collection.handle}`}
            className="group flex flex-col gap-2.5"
          >
            <ImageFrame
              src={collection.image?.url}
              alt={collection.image?.altText ?? collection.title}
              ratio="square"
              radius="lg"
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 220px"
              imgClassName="transition-transform duration-300 group-hover:scale-105"
            />
            <span className="text-sm font-semibold text-foreground">
              {collection.title}
            </span>
          </Link>
        ))}
        <Link href="/gift-cards" className="group flex flex-col gap-2.5">
          <span className="flex aspect-square items-center justify-center rounded-lg bg-foreground transition-opacity group-hover:opacity-90">
            <span className="font-serif text-[0.9375rem] text-background">
              {t("giftCardsTile")}
            </span>
          </span>
          <span className="text-sm font-semibold text-foreground">
            {t("giftCardsTile")}
          </span>
        </Link>
      </div>
    </Container>
  );
}
