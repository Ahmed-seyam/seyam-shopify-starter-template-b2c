import { Container, Skeleton } from "@/core/ui";

export default function AccountLoading() {
  return (
    <Container className="py-10 lg:py-14">
      <Skeleton className="mb-8 h-10 w-56" />
      <div className="flex flex-col gap-8 lg:flex-row lg:gap-14">
        <div className="hidden w-48 shrink-0 flex-col gap-4 lg:flex">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-5 w-28" />
          ))}
        </div>
        <div className="flex flex-1 flex-col gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full rounded-lg" />
          ))}
        </div>
      </div>
    </Container>
  );
}
