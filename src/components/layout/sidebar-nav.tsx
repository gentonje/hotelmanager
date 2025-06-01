
"use client";

import React from 'react';
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Landmark,
  Archive,
  CreditCard,
  Receipt,
  Settings,
  BarChart3,
  Hotel,
  Users,
  Truck,
  Building2,
  ListChecks,
  BookText,
  ArchiveRestore,
  ShoppingCart, 
  DollarSign, 
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  useSidebar,
} from "@/components/ui/sidebar";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/transactions", label: "Transactions", icon: ListChecks },
  { href: "/ledger", label: "Ledger", icon: BookText },
  { href: "/opening-balances", label: "Opening Balances", icon: ArchiveRestore }, 
  {
    label: "Sales Management",
    isGroup: true,
    items: [
      { href: "/sales/cash", label: "Cash Sales ", icon: DollarSign },
      { href: "/credit", label: "Credit Sales", icon: CreditCard },
    ]
  },
  { href: "/deposits", label: "Deposits", icon: Landmark },
  { href: "/banks", label: "Bank Accounts", icon: Building2 },
  { href: "/inventory", label: "Inventory", icon: Archive },
  {
    label: "Purchases & Expenses",
    isGroup: true,
    items: [
      { href: "/purchases/credit", label: "Credit Purchases", icon: ShoppingCart },
      { href: "/expenses", label: "General Expenses", icon: Receipt },
    ]
  },
  { href: "/vendors", label: "Vendors", icon: Truck },
  { href: "/customers", label: "Customers", icon: Users },
  // Future sections
  // { href: "/reports", label: "Reports", icon: BarChart3 },
  // { href: "/settings", label: "Settings", icon: Settings },
];

export function SidebarNav() {
  const pathname = usePathname();
  const { openMobile, setOpenMobile } = useSidebar();

  const handleLinkClick = () => {
    if (openMobile) {
      setOpenMobile(false);
    }
  };

  return (
    <SidebarMenu>
      {navItems.map((item, index) => {
        if (item.isGroup && item.items) {
          return (
            <React.Fragment key={`group-${index}`}>
              <SidebarMenuItem className="mt-2">
                 <span className="px-2 py-1 text-xs font-semibold text-muted-foreground group-data-[collapsible=icon]:hidden">{item.label}</span>
                 <span className="group-data-[collapsible=icon]:flex group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:items-center group-data-[collapsible=icon]:h-2">
                    <item.items[0].icon className="w-4 h-4 group-data-[collapsible=icon]:mx-auto group-data-[collapsible=icon]:my-1 opacity-50" />
                 </span>
              </SidebarMenuItem>
              {item.items.map(subItem => (
                <SidebarMenuItem key={subItem.href}>
                  <Link href={subItem.href} passHref legacyBehavior>
                    <SidebarMenuButton
                      asChild
                      isActive={pathname === subItem.href || (subItem.href !== "/dashboard" && pathname.startsWith(subItem.href))}
                      onClick={handleLinkClick}
                      tooltip={subItem.label}
                    >
                      <a>
                        <subItem.icon />
                        <span>{subItem.label}</span>
                      </a>
                    </SidebarMenuButton>
                  </Link>
                </SidebarMenuItem>
              ))}
            </React.Fragment>
          );
        } else if (!item.isGroup) {
          return (
            <SidebarMenuItem key={item.href}>
              <Link href={item.href!} passHref legacyBehavior>
                <SidebarMenuButton
                  asChild
                  isActive={pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href!))}
                  onClick={handleLinkClick}
                  tooltip={item.label}
                >
                  <a>
                    <item.icon />
                    <span>{item.label}</span>
                  </a>
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
          );
        }
        return null;
      })}
    </SidebarMenu>
  );
}
