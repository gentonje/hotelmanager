
import { PageTitle } from "@/components/shared/page-title";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Receipt, PlusCircle } from "lucide-react";

export default function ExpensesLoading() {
  return (
    <>
      <PageTitle title="Expense Tracking" subtitle="Record and display all business expenses." icon={Receipt}>
        <Skeleton className="h-10 w-56" /> {/* Add New General Expense Button */}
      </PageTitle>

      <Tabs defaultValue="All" className="w-full m-2">
        <Skeleton className="h-auto min-h-10 w-full mb-4 p-1" /> {/* TabsList Wrapper */}
        
        <Card className="shadow-lg m-2">
          <CardHeader>
            <Skeleton className="h-6 w-1/3 mb-2" /> {/* CardTitle */}
            <Skeleton className="h-4 w-2/3" /> {/* CardDescription */}
          </CardHeader>
          <CardContent className="space-y-1">
            <Table>
              <TableHeader>
                <TableRow>
                  {[...Array(7)].map((_, i) => (
                    <TableHead key={i}><Skeleton className="h-5 w-20" /></TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {[...Array(5)].map((_, i) => (
                  <TableRow key={i}>
                    {[...Array(7)].map((_, j) => (
                      <TableCell key={j}><Skeleton className="h-5 w-full" /></TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </Tabs>
    </>
  );
}
