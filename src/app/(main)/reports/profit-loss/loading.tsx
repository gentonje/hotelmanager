import { PageTitle } from "@/components/shared/page-title";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ClipboardList, Printer } from "lucide-react";

export default function ProfitLossLoading() {
  const renderSkeletonTable = (currency: string) => (
    <Card className="shadow-lg m-2">
      <CardHeader>
        <Skeleton className="h-7 w-3/4 mb-2" /> {/* P&L Statement (Currency) */}
        <Skeleton className="h-4 w-1/2" />    {/* for [Period] */}
      </CardHeader>
      <CardContent className="space-y-1">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead><Skeleton className="h-5 w-3/5" /></TableHead>
              <TableHead className="text-right"><Skeleton className="h-5 w-24" /></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {/* Revenue Section */}
            <TableRow className="font-semibold bg-muted/30">
              <TableCell><Skeleton className="h-5 w-1/4" /></TableCell>
              <TableCell></TableCell>
            </TableRow>
            {[...Array(3)].map((_, i) => (
              <TableRow key={`rev-skel-${i}`}>
                <TableCell className="pl-8"><Skeleton className="h-5 w-1/2" /></TableCell>
                <TableCell className="text-right"><Skeleton className="h-5 w-20" /></TableCell>
              </TableRow>
            ))}
            <TableRow className="font-bold border-t">
              <TableCell><Skeleton className="h-5 w-1/3" /></TableCell>
              <TableCell className="text-right"><Skeleton className="h-5 w-24" /></TableCell>
            </TableRow>

            {/* COGS Section */}
            <TableRow className="font-semibold bg-muted/30">
              <TableCell className="pt-4"><Skeleton className="h-5 w-1/3" /></TableCell>
              <TableCell></TableCell>
            </TableRow>
            {[...Array(2)].map((_, i) => (
              <TableRow key={`cogs-skel-${i}`}>
                <TableCell className="pl-8"><Skeleton className="h-5 w-1/2" /></TableCell>
                <TableCell className="text-right"><Skeleton className="h-5 w-20" /></TableCell>
              </TableRow>
            ))}
            <TableRow className="font-bold border-t">
              <TableCell><Skeleton className="h-5 w-2/5" /></TableCell>
              <TableCell className="text-right"><Skeleton className="h-5 w-24" /></TableCell>
            </TableRow>

            {/* Gross Profit */}
            <TableRow className="font-bold text-lg bg-primary/10 border-y-2 border-primary/50">
              <TableCell><Skeleton className="h-6 w-1/3" /></TableCell>
              <TableCell className="text-right"><Skeleton className="h-6 w-28" /></TableCell>
            </TableRow>

            {/* Operating Expenses Section */}
            <TableRow className="font-semibold bg-muted/30">
              <TableCell className="pt-4"><Skeleton className="h-5 w-2/5" /></TableCell>
              <TableCell></TableCell>
            </TableRow>
            {[...Array(4)].map((_, i) => (
              <TableRow key={`opex-skel-${i}`}>
                <TableCell className="pl-8"><Skeleton className="h-5 w-1/2" /></TableCell>
                <TableCell className="text-right"><Skeleton className="h-5 w-20" /></TableCell>
              </TableRow>
            ))}
            <TableRow className="font-bold border-t">
              <TableCell><Skeleton className="h-5 w-1/2" /></TableCell>
              <TableCell className="text-right"><Skeleton className="h-5 w-24" /></TableCell>
            </TableRow>

            {/* Net Profit */}
            <TableRow className="font-bold text-xl border-t-2">
              <TableCell><Skeleton className="h-7 w-1/3" /></TableCell>
              <TableCell className="text-right"><Skeleton className="h-7 w-32" /></TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );

  return (
    <>
      <PageTitle title="Profit &amp; Loss Statement" subtitle="View your business financial performance over a selected period." icon={ClipboardList}>
        <Skeleton className="h-10 w-36" /> {/* Print Button */}
      </PageTitle>

      <Card className="shadow-lg mb-6 m-2">
        <CardHeader>
          <Skeleton className="h-6 w-1/3 mb-2" /> {/* Filter Title */}
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
            <Skeleton className="h-10 w-24" /> {/* Apply Button */}
            <Skeleton className="h-10 w-24" /> {/* Clear Button */}
          </div>
        </CardContent>
      </Card>

      <div className="printable-area">
        {renderSkeletonTable("USD")}
        {renderSkeletonTable("SSP")}
      </div>
       <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50 no-print">
        <div className="quarter-circle-spinner"></div>
      </div>
    </>
  );
}
