
import { PageTitle } from "@/components/shared/page-title";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { BookText, CalendarIcon, Filter, XCircle } from "lucide-react";

export default function LedgerLoading() {
  return (
    <>
      <PageTitle title="General Ledger" subtitle="A chronological record of all financial transactions." icon={BookText} />

      <Card className="shadow-lg mb-6 m-2">
        <CardHeader>
          <CardTitle className="font-headline">Filters</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col sm:flex-row gap-1 items-center space-y-1 sm:space-y-0 sm:space-x-1">
          <div className="grid gap-2 w-full sm:w-auto">
            <Skeleton className="h-4 w-20 mb-1" /> {/* Label */}
            <Skeleton className="h-10 w-full sm:w-[240px]" /> {/* Popover Trigger */}
          </div>
          <div className="grid gap-2 w-full sm:w-auto">
            <Skeleton className="h-4 w-20 mb-1" /> {/* Label */}
            <Skeleton className="h-10 w-full sm:w-[240px]" /> {/* Popover Trigger */}
          </div>
          <div className="flex gap-2 mt-auto pt-1 sm:pt-0 w-full sm:w-auto">
            <Skeleton className="h-10 w-32" /> {/* Apply Button */}
            <Skeleton className="h-10 w-32" /> {/* Clear Button */}
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-lg m-2">
        <CardHeader>
          <Skeleton className="h-6 w-1/2 mb-2" /> {/* CardTitle */}
          <Skeleton className="h-4 w-3/4" /> {/* CardDescription */}
        </CardHeader>
        <CardContent className="space-y-1">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead><Skeleton className="h-5 w-20" /></TableHead>
                <TableHead><Skeleton className="h-5 w-40" /></TableHead>
                <TableHead><Skeleton className="h-5 w-24" /></TableHead>
                <TableHead className="text-right"><Skeleton className="h-5 w-24" /></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {[...Array(5)].map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-5 w-full" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-full" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-full" /></TableCell>
                  <TableCell className="text-right"><Skeleton className="h-5 w-full" /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <div className="flex items-center justify-between mt-4 pt-4 border-t">
            <Skeleton className="h-5 w-48" /> {/* Showing X-Y of Z entries */}
            <div className="flex gap-2">
              <Skeleton className="h-9 w-24" /> {/* Previous Button */}
              <Skeleton className="h-9 w-24" /> {/* Next Button */}
            </div>
          </div>
        </CardContent>
      </Card>
    </>
  );
}
