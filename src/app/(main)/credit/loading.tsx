
import { PageTitle } from "@/components/shared/page-title";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CreditCard, PlusCircle } from "lucide-react";

export default function CreditLoading() {
  return (
    <>
      <PageTitle title="Credit Management" subtitle="Track and manage items/services sold on credit." icon={CreditCard}>
        <Skeleton className="h-10 w-48" /> {/* Add New Button */}
      </PageTitle>

      <Card className="shadow-lg">
        <CardHeader>
          <Skeleton className="h-6 w-1/3 mb-2" /> {/* CardTitle */}
          <Skeleton className="h-4 w-2/3" /> {/* CardDescription */}
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                {[...Array(11)].map((_, i) => (
                  <TableHead key={i}><Skeleton className="h-5 w-20" /></TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {[...Array(5)].map((_, i) => (
                <TableRow key={i}>
                  {[...Array(11)].map((_, j) => (
                    <TableCell key={j}><Skeleton className="h-5 w-full" /></TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </>
  );
}
