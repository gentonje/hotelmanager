
import { PageTitle } from "@/components/shared/page-title";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Users } from "lucide-react";

export default function CustomersLoading() {
  return (
    <>
      <PageTitle title="Customer Management" subtitle="Manage your list of customers and patrons." icon={Users}>
        <Skeleton className="h-10 w-48" /> {/* Add New Button */}
      </PageTitle>

      <Card className="shadow-lg m-2">
        <CardHeader>
          <Skeleton className="h-6 w-1/3 mb-2" /> {/* CardTitle */}
          <Skeleton className="h-4 w-2/3" /> {/* CardDescription */}
        </CardHeader>
        <CardContent className="space-y-1">
          <Table>
            <TableHeader>
              <TableRow>
                {[...Array(5)].map((_, i) => (
                  <TableHead key={i}><Skeleton className="h-5 w-24" /></TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {[...Array(5)].map((_, i) => (
                <TableRow key={i}>
                  {[...Array(5)].map((_, j) => (
                    <TableCell key={j}><Skeleton className="h-5 w-full" /></TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50">
        <div className="quarter-circle-spinner"></div>
      </div>
    </>
  );
}
