
import React from 'react';
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarInset,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { SidebarNav } from "@/components/layout/sidebar-nav";
import { HeaderMain } from "@/components/layout/header-main";
import { Hotel } from "lucide-react";
import { Button } from '@/components/ui/button';

export default function MainAppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider defaultOpen={true}>
      <Sidebar collapsible="icon" variant="sidebar" side="left">
        <SidebarHeader className="p-4 flex items-center justify-between">
           <div className="flex items-center gap-2 group-data-[collapsible=icon]:hidden">
             <Hotel className="h-8 w-8 text-primary" />
             <span className="font-headline text-2xl font-semibold">PYRAMID HOTEL</span>
           </div>
           <SidebarTrigger className="hidden md:flex" />
        </SidebarHeader>
        <SidebarContent>
          <SidebarNav />
        </SidebarContent>
        <SidebarFooter className="p-2 group-data-[collapsible=icon]:hidden">
          <Button variant="outline" size="sm" className="w-full">
            View Documentation
          </Button>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset>
        <HeaderMain />
        <main className="flex-1 p-4 sm:p-6 bg-background">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
