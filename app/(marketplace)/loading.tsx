import { Skeleton } from "@/components/ui/skeleton"

export default function LoadingMarketplace() {
  return (
    <div className="px-5 py-8 lg:px-10">
      <Skeleton className="h-12 w-full rounded-none bg-tinta/10" />
      <div className="mt-8 grid gap-x-5 gap-y-10 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
        {Array.from({ length: 8 }).map((_, index) => (
          <div key={index}>
            <Skeleton className="aspect-[4/5] w-full rounded-none bg-tinta/10" />
            <Skeleton className="mt-4 h-5 w-4/5 rounded-none bg-tinta/10" />
            <Skeleton className="mt-2 h-4 w-2/5 rounded-none bg-tinta/10" />
          </div>
        ))}
      </div>
    </div>
  )
}
