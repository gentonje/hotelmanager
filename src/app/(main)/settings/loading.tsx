
import { PageTitle } from "@/components/shared/page-title";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Settings, Download, Upload, Trash2, AlertTriangle } from "lucide-react";

export default function SettingsLoading() {
  return (
    <>
      <PageTitle title="Settings & Data Management" subtitle="Manage your application data, export, import, or reset." icon={Settings} />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
        {/* Data Export Card Skeleton */}
        <Card className="shadow-lg m-2">
          <CardHeader>
            <CardTitle className="font-headline flex items-center">
              <Download className="mr-2 h-5 w-5" /> <Skeleton className="h-6 w-32" />
            </CardTitle>
            <CardDescription className="font-body"><Skeleton className="h-4 w-4/5" /></CardDescription>
          </CardHeader>
          <CardContent className="space-y-1">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={`export-skel-${i}`} className="h-10 w-full mb-2" />
            ))}
          </CardContent>
        </Card>

        {/* Data Import Card Skeleton */}
        <Card className="shadow-lg m-2">
          <CardHeader>
            <CardTitle className="font-headline flex items-center">
              <Upload className="mr-2 h-5 w-5" /> <Skeleton className="h-6 w-40" />
            </CardTitle>
            <CardDescription className="font-body"><Skeleton className="h-4 w-full" /></CardDescription>
          </CardHeader>
          <CardContent className="space-y-1">
            <div className="grid gap-2">
              <Skeleton className="h-4 w-1/3 mb-1" /> {/* Label */}
              <Skeleton className="h-10 w-full" /> {/* Input */}
            </div>
            <Skeleton className="h-10 w-full mt-2" /> {/* Button */}
            <Skeleton className="h-8 w-full mt-2" /> {/* Note */}
          </CardContent>
        </Card>

        {/* Data Reset Card Skeleton */}
        <Card className="shadow-lg m-2 border-destructive">
          <CardHeader>
            <CardTitle className="font-headline flex items-center text-destructive">
              <AlertTriangle className="mr-2 h-5 w-5" /> <Skeleton className="h-6 w-32 bg-destructive/30" />
            </CardTitle>
            <CardDescription className="font-body text-destructive">
              <Skeleton className="h-4 w-full bg-destructive/20 mb-1" />
              <Skeleton className="h-4 w-3/4 bg-destructive/20" />
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-1">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={`reset-skel-${i}`} className="h-10 w-full mb-2 bg-destructive/20" />
            ))}
            <Skeleton className="h-8 w-full mt-2 bg-destructive/20" /> {/* Note */}
          </CardContent>
        </Card>
      </div>
      <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50 no-print">
        <div className="quarter-circle-spinner"></div>
      </div>
    </>
  );
}
