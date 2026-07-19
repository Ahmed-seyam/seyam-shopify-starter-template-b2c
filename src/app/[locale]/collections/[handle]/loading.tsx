import { Container, ProductGridSkeleton, Skeleton } from "@/components/ui";

export default function CollectionLoading() {
  return (
    <Container className="py-8 lg:py-12">
      <Skeleton className="mb-3 h-4 w-40" />
      <Skeleton className="mb-8 h-10 w-64" />
      <div className="flex flex-col gap-8 lg:flex-row">
        <div className="hidden w-56 shrink-0 flex-col gap-3 lg:flex">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-5 w-full" />
          ))}
        </div>
        <div className="flex-1">
          <ProductGridSkeleton />
        </div>
      </div>
    </Container>
  );
}
