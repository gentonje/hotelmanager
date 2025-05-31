
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface PageTitleProps {
  title: string;
  subtitle?: string;
  icon?: LucideIcon;
  className?: string;
  children?: React.ReactNode;
}

export function PageTitle({ title, subtitle, icon: Icon, className, children }: PageTitleProps) {
  return (
    <div className={cn("mb-6 md:mb-8", className)}>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            {Icon && <Icon className="h-7 w-7 text-primary" />}
            <h1 className="text-3xl md:text-4xl font-headline font-semibold text-foreground">
              {title}
            </h1>
          </div>
          {subtitle && (
            <p className="mt-1.5 text-sm text-muted-foreground font-body">
              {subtitle}
            </p>
          )}
        </div>
        {children && <div className="shrink-0">{children}</div>}
      </div>
    </div>
  );
}
