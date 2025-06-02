
import { PageTitle } from "@/components/shared/page-title";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ListChecks } from "lucide-react";

export default function TransactionsLoading() {
  return (
    <>
      <PageTitle title="Record Transaction" subtitle="Log sales, deposits, or purchases." icon={ListChecks} />
      <Card className="shadow-xl max-w-2xl mx-auto m-2">
        <CardHeader>
          <CardTitle className="font-headline text-2xl">New Transaction</CardTitle>
          <CardDescription className="font-body">Select the type of transaction and fill in the details below.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-1">
          <div className="space-y-1">
            <div className="grid gap-2">
              <Skeleton className="h-5 w-1/4 mb-1" /> {/* Label */}
              <Skeleton className="h-12 w-full" /> {/* Select Trigger */}
            </div>
            <Skeleton className="h-px w-full my-2" /> {/* Separator */}
            <div className="flex justify-center items-center h-48">
                <Skeleton className="h-10 w-1/2" /> 
            </div>
          </div>
        </CardContent>
      </Card>
    </>
  );
}
