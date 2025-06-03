
import { PageTitle } from "@/components/shared/page-title";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { Archive } from "lucide-react";

export default function InventoryLoading() {
  return (
    <>
      <PageTitle title="Inventory Management" subtitle="Track stock levels across various hotel sections." icon={Archive} />

      <Tabs defaultValue="bar" className="w-full m-2">
        <div className="flex justify-between items-center mb-4">
          <Skeleton className="h-10 w-72" /> {/* TabsList */}
          <Skeleton className="h-10 w-52" /> {/* Add New Item Button */}
        </div>
        
        <TabsContent value="bar"> {/* Default to showing one content skeleton */}
          <Card className="shadow-lg m-2">
            <CardHeader>
              <Skeleton className="h-6 w-1/3 mb-2" /> {/* CardTitle */}
              <Skeleton className="h-4 w-2/3" /> {/* CardDescription */}
            </CardHeader>
            <CardContent className="space-y-1">
              <Table>
                <TableHeader>
                  <TableRow>
                    {[...Array(8)].map((_, i) => (
                      <TableHead key={i}><Skeleton className="h-5 w-20" /></TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {[...Array(5)].map((_, i) => (
                    <TableRow key={i}>
                      {[...Array(8)].map((_, j) => (
                        <TableCell key={j}><Skeleton className="h-5 w-full" /></TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50">
        <div className="quarter-circle-spinner"></div>
      </div>
    </>
  );
}
