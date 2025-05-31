
import type { LucideIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface StatCardProps {
  title: string;
  value: string;
  icon?: LucideIcon;
  description?: string;
  className?: string;
  footer?: React.ReactNode;
}

export function StatCard({ title, value, icon: Icon, description, className, footer }: StatCardProps) {
  return (
    <Card className={cn("shadow-lg hover:shadow-xl transition-shadow duration-300", className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium font-body">{title}</CardTitle>
        {Icon && <Icon className="h-5 w-5 text-muted-foreground" />}
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold font-headline">{value}</div>
        {description && (
          <p className="text-xs text-muted-foreground pt-1 font-body">{description}</p>
        )}
        {footer && <div className="mt-4 text-sm">{footer}</div>}
      </CardContent>
    </Card>
  );
}
