
"use client";

import React from 'react';
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { LucideIcon, LucideProps } from "lucide-react";
import type { ForwardRefExoticComponent, RefAttributes } from 'react';

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


interface NavSubItem {
  href: string;
  label: string;
  icon: ForwardRefExoticComponent<Omit<LucideProps, "ref"> & RefAttributes<SVGSVGElement>>;
}

interface NavItemGroup {
  label: string;
  isGroup: true;
  items: NavSubItem[];
  // Group itself doesn't have a top-level 'icon', it's derived or a default can be set
}

interface NavItemSingle {
  href: string;
  label: string;
  icon: ForwardRefExoticComponent<Omit<LucideProps, "ref"> & RefAttributes<SVGSVGElement>>;
  isGroup?: false; // Explicitly not a group
}

type NavItemType = NavItemGroup | NavItemSingle;


const navItems: NavItemType[] = [
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
        if (item.isGroup) {
          const groupItem = item as NavItemGroup;
          return (
            <React.Fragment key={`group-${index}`}>
              <SidebarMenuItem className="mt-2">
                 <span className="px-2 py-1 text-xs font-semibold text-muted-foreground group-data-[collapsible=icon]:hidden">{groupItem.label}</span>
                 <span className="group-data-[collapsible=icon]:flex group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:items-center group-data-[collapsible=icon]:h-8 group-data-[collapsible=icon]:w-8 group-data-[collapsible=icon]:my-1">
                    {groupItem.items.length > 0 && (() => {
                        const GroupDisplayIcon = groupItem.items[0].icon;
                        return <GroupDisplayIcon className="w-4 h-4 opacity-75" />;
                    })()}
                 </span>
              </SidebarMenuItem>
              {groupItem.items.map(subItem => {
                const SubItemIcon = subItem.icon;
                return (
                  <SidebarMenuItem key={subItem.href}>
                    <Link href={subItem.href} passHref legacyBehavior>
                      <SidebarMenuButton
                        asChild
                        isActive={pathname === subItem.href || (subItem.href !== "/dashboard" && pathname.startsWith(subItem.href))}
                        onClick={handleLinkClick}
                        tooltip={subItem.label}
                      >
                        <a>
                          <SubItemIcon />
                          <span>{subItem.label}</span>
                        </a>
                      </SidebarMenuButton>
                    </Link>
                  </SidebarMenuItem>
                );
              })}
            </React.Fragment>
          );
        } else {
          const singleItem = item as NavItemSingle;
          const ItemIcon = singleItem.icon;
          return (
            <SidebarMenuItem key={singleItem.href}>
              <Link href={singleItem.href} passHref legacyBehavior>
                <SidebarMenuButton
                  asChild
                  isActive={pathname === singleItem.href || (singleItem.href !== "/dashboard" && pathname.startsWith(singleItem.href))}
                  onClick={handleLinkClick}
                  tooltip={singleItem.label}
                >
                  <a>
                    <ItemIcon />
                    <span>{singleItem.label}</span>
                  </a>
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
          );
        }
      })}
    </SidebarMenu>
  );
}
    