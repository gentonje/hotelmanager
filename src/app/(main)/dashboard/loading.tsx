
import { PageTitle } from "@/components/shared/page-title";
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

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 mb-6 m-2">
        {[...Array(7)].map((_, i) => (
          <Card key={i} className="shadow-lg m-2">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <Skeleton className="h-4 w-2/3" />
              <Skeleton className="h-5 w-5 rounded-full" />
            </CardHeader>
            <CardContent className="space-y-1">
              <Skeleton className="h-8 w-1/2 mb-1" />
              <Skeleton className="h-4 w-3/4 text-xs" /> {/* For smaller text like USD/SSP */}
              <Skeleton className="h-3 w-full mt-2" />
            </CardContent>
          </Card>
        ))}
      </div>
      
      <div className="grid gap-6 grid-cols-1 lg:grid-cols-3 m-2">
        <Card className="shadow-lg lg:col-span-2 m-2">
          <CardHeader>
            <Skeleton className="h-6 w-1/2 mb-2" />
            <Skeleton className="h-4 w-3/4" />
          </CardHeader>
          <CardContent className="space-y-4"> {/* Increased space for progress bars */}
            {[...Array(5)].map((_, i) => (
              <div key={i} className="space-y-2"> {/* Space between label and progress */}
                <div className="mb-1 flex justify-between items-center">
                  <Skeleton className="h-4 w-1/4" />
                  <div className="text-right space-y-1">
                    <Skeleton className="h-3 w-20" />
                    <Skeleton className="h-3 w-20" />
                  </div>
                </div>
                <Skeleton className="h-3 w-full" /> {/* Progress bar skeleton */}
              </div>
            ))}
          </CardContent>
          <CardFooter>
            <Skeleton className="h-4 w-2/3" />
          </CardFooter>
        </Card>

        <Card className="shadow-lg m-2">
          <CardHeader>
            <Skeleton className="h-6 w-1/3 mb-2" />
            <Skeleton className="h-4 w-1/2" />
          </CardHeader>
          <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-2 space-y-1"> {/* Adjusted for button layout */}
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full sm:col-span-2" /> {/* Example for a wider button */}
          </CardContent>
        </Card>
      </div>
       <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50">
        <div className="quarter-circle-spinner"></div>
      </div>
    </>
  );
}
