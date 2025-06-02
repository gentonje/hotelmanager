
import { PageTitle } from "@/components/shared/page-title";
import { StatCard } from "@/components/shared/stat-card";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Info, CalendarDays } from "lucide-react";

export default function DashboardLoading() {
  return (
    <>
      <PageTitle
        title="Dashboard"
        subtitle="Overview of hotel operations and revenue..."
        icon={Info}
      >
        <div className="flex items-center gap-2">
          <CalendarDays className="h-5 w-5 text-muted-foreground" />
          <Skeleton className="h-10 w-[180px]" />
        </div>
      </PageTitle>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 mb-6">
        {[...Array(7)].map((_, i) => (
          <Card key={i} className="shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <Skeleton className="h-4 w-2/3" />
              <Skeleton className="h-5 w-5 rounded-full" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-1/2 mb-1" />
              <Skeleton className="h-8 w-1/2" />
              <Skeleton className="h-3 w-full mt-2" />
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 grid-cols-1">
        <Card className="shadow-lg">
          <CardHeader>
            <Skeleton className="h-6 w-1/2 mb-2" />
            <Skeleton className="h-4 w-3/4" />
          </CardHeader>
          <CardContent className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i}>
                <div className="mb-1 flex justify-between items-center">
                  <Skeleton className="h-4 w-1/4" />
                  <div className="text-right">
                    <Skeleton className="h-4 w-20 mb-1" />
                    <Skeleton className="h-4 w-20" />
                  </div>
                </div>
                <Skeleton className="h-3 w-full" />
              </div>
            ))}
          </CardContent>
          <CardFooter>
            <Skeleton className="h-4 w-2/3" />
          </CardFooter>
        </Card>

        <Card className="shadow-lg">
          <CardHeader>
            <Skeleton className="h-6 w-1/3 mb-2" />
            <Skeleton className="h-4 w-1/2" />
          </CardHeader>
          <CardContent className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </CardContent>
        </Card>
      </div>
    </>
  );
}
