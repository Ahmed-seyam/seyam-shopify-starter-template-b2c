import { Container, Skeleton } from "@/core/ui";

export default function ProductLoading() {
  return (
    <Container className="py-8 lg:py-12">
      <Skeleton className="mb-6 h-4 w-52" />
      <div className="grid gap-10 lg:grid-cols-2">
        <Skeleton className="aspect-[3/4] w-full rounded-xl" />
        <div className="flex flex-col gap-4">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-10 w-3/4" />
          <Skeleton className="h-6 w-28" />
          <Skeleton className="mt-4 h-10 w-full max-w-xs" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      </div>
    </Container>
  );
}
