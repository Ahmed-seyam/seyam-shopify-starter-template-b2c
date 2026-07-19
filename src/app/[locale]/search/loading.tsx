import { Container, ProductGridSkeleton, Skeleton } from "@/app/core/ui";

export default function SearchLoading() {
  return (
    <Container className="py-8 lg:py-12">
      <Skeleton className="mx-auto mb-8 h-11 w-full max-w-xl rounded-md" />
      <ProductGridSkeleton />
    </Container>
  );
}
