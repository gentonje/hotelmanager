
"use client";

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
  { href: "/deposits", label: "Deposits", icon: Landmark },
  { href: "/inventory", label: "Inventory", icon: Archive },
  { href: "/credit", label: "Credit Sales", icon: CreditCard },
  { href: "/expenses", label: "Expenses", icon: Receipt },
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
      {navItems.map((item) => (
        <SidebarMenuItem key={item.href}>
          <Link href={item.href} passHref legacyBehavior>
            <SidebarMenuButton
              asChild
              isActive={pathname.startsWith(item.href)}
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
      ))}
    </SidebarMenu>
  );
}
