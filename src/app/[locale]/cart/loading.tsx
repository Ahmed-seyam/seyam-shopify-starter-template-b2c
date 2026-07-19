import { Container, Skeleton } from "@/components/ui";

export default function CartLoading() {
  return (
    <Container className="py-10 lg:py-14">
      <Skeleton className="mb-8 h-10 w-40" />
      <div className="grid gap-10 lg:grid-cols-[1fr_24rem] lg:items-start">
        <div className="flex flex-col gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4">
              <Skeleton className="size-24 rounded-lg" />
              <div className="flex flex-1 flex-col gap-2">
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-4 w-24" />
              </div>
              <Skeleton className="h-5 w-16" />
            </div>
          ))}
        </div>
        <Skeleton className="h-64 w-full rounded-lg" />
      </div>
    </Container>
  );
}
