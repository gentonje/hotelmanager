
import { PageTitle } from "@/components/shared/page-title";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ArchiveRestore, CalendarIcon, Save } from "lucide-react";

export default function OpeningBalancesLoading() {
  return (
    <>
      <PageTitle title="Opening Balances" subtitle="Set the starting financial figures for your accounting period." icon={ArchiveRestore} />

      <Card className="shadow-lg m-2"> 
        <CardHeader>
          <CardTitle className="font-headline">Accounting Start Date</CardTitle>
          <CardDescription className="font-body">Select the date for which these opening balances apply...</CardDescription>
        </CardHeader>
        <CardContent className="space-y-1">
          <Skeleton className="h-10 w-full sm:w-[280px]" /> {/* Date Picker Button */}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-2">
        {[...Array(2)].map((_, i) => ( 
          <Card key={`major-cat-${i}`} className="shadow-md m-2">
            <CardHeader>
              <Skeleton className="h-6 w-1/2 mb-2" /> {/* CardTitle */}
              { i === 1 && <Skeleton className="h-4 w-3/4 mb-1" /> } {/* Optional CardDescription */}
            </CardHeader>
            <CardContent className="space-y-1">
              <div>
                <Skeleton className="h-4 w-1/3 mb-1" /> {/* Label */}
                <Skeleton className="h-10 w-full" /> {/* Input */}
              </div>
              <div>
                <Skeleton className="h-4 w-1/3 mb-1" /> {/* Label */}
                <Skeleton className="h-10 w-full" /> {/* Input */}
              </div>
              { i === 1 && 
                <div>
                    <Skeleton className="h-4 w-1/3 mb-1" /> {/* Label */}
                    <Skeleton className="h-20 w-full" /> {/* Textarea */}
                </div>
              }
            </CardContent>
          </Card>
        ))}
      </div>

      {[...Array(3)].map((_, outerIndex) => ( 
        <Card key={`list-cat-${outerIndex}`} className="shadow-md m-2 mb-1 sm:mb-2"> 
          <CardHeader>
            <Skeleton className="h-6 w-1/3 mb-2" /> {/* CardTitle */}
            <Skeleton className="h-4 w-2/3 mb-1" /> {/* CardDescription */}
          </CardHeader>
          <CardContent className="space-y-1">
            {[...Array(2)].map((_, itemIndex) => ( 
              <div key={`item-${outerIndex}-${itemIndex}`} className="p-4 border rounded-md bg-card/50 space-y-1">
                <Skeleton className="h-5 w-1/4 mb-2" /> {/* Item Title (Bank/Customer/Vendor Name) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Skeleton className="h-4 w-1/2 mb-1" /> {/* Label */}
                    <Skeleton className="h-10 w-full" /> {/* Input */}
                  </div>
                  <div>
                    <Skeleton className="h-4 w-1/2 mb-1" /> {/* Label */}
                    <Skeleton className="h-10 w-full" /> {/* Input */}
                  </div>
                </div>
              </div>
            ))}
            <Skeleton className="h-5 w-2/3" /> {/* "No items found..." placeholder */}
          </CardContent>
        </Card>
      ))}

      <div className="mt-8 flex justify-end m-2">
        <Skeleton className="h-12 w-64" /> {/* Save Button */}
      </div>
    </>
  );
}
