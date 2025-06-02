
import { PageTitle } from "@/components/shared/page-title";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Building2, PlusCircle } from "lucide-react";

export default function BanksLoading() {
  return (
    <>
      <PageTitle title="Bank Accounts" subtitle="Manage your list of bank accounts." icon={Building2}>
        <Skeleton className="h-10 w-56" /> {/* Add New Bank Account Button */}
      </PageTitle>

      <Card className="shadow-lg">
        <CardHeader>
          <Skeleton className="h-6 w-1/2 mb-2" /> {/* CardTitle */}
          <Skeleton className="h-4 w-3/4" /> {/* CardDescription */}
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead><Skeleton className="h-5 w-32" /></TableHead>
                <TableHead><Skeleton className="h-5 w-40" /></TableHead>
                <TableHead><Skeleton className="h-5 w-24" /></TableHead>
                <TableHead className="text-right"><Skeleton className="h-5 w-24" /></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {[...Array(3)].map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-5 w-full" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-full" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-full" /></TableCell>
                  <TableCell className="text-right space-x-1">
                    <Skeleton className="h-8 w-8 inline-block" />
                    <Skeleton className="h-8 w-8 inline-block" />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </>
  );
}
