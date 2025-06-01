
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useToast } from "@/hooks/use-toast";
import { PageTitle } from "@/components/shared/page-title";
import { StatCard } from "@/components/shared/stat-card";
import { Button } from "@/components/ui/button";
import { DollarSign, TrendingUp, TrendingDown, Landmark, Users, Info, Loader2, HandCoins, Coins, FileText, BedDouble, GlassWater, Utensils, Presentation } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { format } from 'date-fns';

interface RevenueCategoryStats {
  rooms: number;
  mainBar: number;
  restaurant: number;
  conferenceHalls: number;
}

interface DashboardStats {
  totalCreditSalesOriginatedTodayUSD: number;
  totalCreditSalesOriginatedTodaySSP: number;
  cashDepositsTodayUSD: number;
  cashDepositsTodaySSP: number;
  cashExpensesTodayUSD: number;
  cashExpensesTodaySSP: number;
  outstandingCustomerCreditUSD: number;
  outstandingCustomerCreditSSP: number;
  activeDebtorsCount: number;
  cashSalesReceivedTodayUSD: number;
  cashSalesReceivedTodaySSP: number;
  revenueByCategoryTodayUSD: RevenueCategoryStats;
}

const initialStats: DashboardStats = {
  totalCreditSalesOriginatedTodayUSD: 0,
  totalCreditSalesOriginatedTodaySSP: 0,
  cashDepositsTodayUSD: 0,
  cashDepositsTodaySSP: 0,
  cashExpensesTodayUSD: 0,
  cashExpensesTodaySSP: 0,
  outstandingCustomerCreditUSD: 0,
  outstandingCustomerCreditSSP: 0,
  activeDebtorsCount: 0,
  cashSalesReceivedTodayUSD: 0,
  cashSalesReceivedTodaySSP: 0,
  revenueByCategoryTodayUSD: {
    rooms: 0,
    mainBar: 0,
    restaurant: 0,
    conferenceHalls: 0,
  },
};

// Define keywords for revenue categorization (case-insensitive)
const revenueCategoryKeywords = {
  rooms: /\b(room|stay|accommodation|suite|lodge|guest)\b/i,
  mainBar: /\b(bar|drink|beverage|soda|juice|water|beer|wine|spirit)\b/i, // More specific to bar items
  restaurant: /\b(food|meal|restaurant|dining|breakfast|lunch|dinner|dish|plate|cuisine)\b/i,
  conferenceHalls: /\b(conference|hall|meeting|event space|seminar|workshop)\b/i,
};

const categorizeItem = (itemService: string): keyof RevenueCategoryStats | null => {
  if (!itemService) return null;
  for (const category in revenueCategoryKeywords) {
    if (revenueCategoryKeywords[category as keyof RevenueCategoryStats].test(itemService)) {
      // Special handling to avoid bar items being categorized as restaurant if also general
      if (category === 'restaurant' && revenueCategoryKeywords.mainBar.test(itemService)) {
        // If it matches bar terms more strongly, prioritize bar or let it be ambiguous if not clearly bar
        // This simple keyword approach can be tricky. More robust would be predefined categories for items.
      }
      return category as keyof RevenueCategoryStats;
    }
  }
  return null; // Or 'other' if you want to track uncategorized revenue
};


export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats>(initialStats);
  const [isLoading, setIsLoading] = useState(true); 
  const { toast } = useToast();

  const formatCurrency = (amount: number, currency: 'USD' | 'SSP') => {
    return `${currency} ${amount.toFixed(2)}`;
  };

  const fetchDashboardData = useCallback(async (isInitialLoad: boolean) => {
    if (isInitialLoad) {
      setIsLoading(true);
    }
    try {
      const today = new Date();
      const startDate = format(today, "yyyy-MM-dd'T'00:00:00.000'Z'");
      const endDate = format(today, "yyyy-MM-dd'T'23:59:59.999'Z'");

      const revenueByCategoryTodayUSD: RevenueCategoryStats = { rooms: 0, mainBar: 0, restaurant: 0, conferenceHalls: 0 };

      // --- Today's Cash Sales (for categories and total) ---
      const { data: cashSalesData, error: cashSalesError } = await supabase
        .from('cash_sales')
        .select('amount, currency, item_service')
        .gte('date', startDate)
        .lte('date', endDate);
      if (cashSalesError) throw cashSalesError;

      let cashSalesReceivedTodayUSD = 0;
      let cashSalesReceivedTodaySSP = 0;
      cashSalesData?.forEach(sale => {
        if (sale.currency === 'USD') {
          cashSalesReceivedTodayUSD += sale.amount;
          const category = categorizeItem(sale.item_service);
          if (category) {
            revenueByCategoryTodayUSD[category] += sale.amount;
          }
        } else if (sale.currency === 'SSP') {
          cashSalesReceivedTodaySSP += sale.amount;
          // SSP categorization can be added here if needed for revenue breakdown
        }
      });
      
      // --- Today's Credit Sales Originated (for categories and total) ---
      const { data: creditSalesData, error: creditSalesError } = await supabase
        .from('credit_sales')
        .select('original_amount, currency, item_service')
        .gte('date', startDate)
        .lte('date', endDate);
      if (creditSalesError) throw creditSalesError;

      let totalCreditSalesOriginatedTodayUSD = 0;
      let totalCreditSalesOriginatedTodaySSP = 0;
      creditSalesData?.forEach(sale => {
        if (sale.currency === 'USD') {
          totalCreditSalesOriginatedTodayUSD += sale.original_amount;
          const category = categorizeItem(sale.item_service);
          if (category) {
            revenueByCategoryTodayUSD[category] += sale.original_amount;
          }
        } else if (sale.currency === 'SSP') {
          totalCreditSalesOriginatedTodaySSP += sale.original_amount;
          // SSP categorization can be added here if needed for revenue breakdown
        }
      });
      
      // --- Today's Deposits ---
      const { data: depositsData, error: depositsError } = await supabase
        .from('deposits')
        .select('amount, currency')
        .gte('date', startDate)
        .lte('date', endDate);
      if (depositsError) throw depositsError;
      const cashDepositsTodayUSD = depositsData?.filter(d => d.currency === 'USD').reduce((sum, deposit) => sum + deposit.amount, 0) || 0;
      const cashDepositsTodaySSP = depositsData?.filter(d => d.currency === 'SSP').reduce((sum, deposit) => sum + deposit.amount, 0) || 0;
      
      // --- Today's Expenses ---
      const { data: expensesData, error: expensesError } = await supabase
        .from('expenses')
        .select('amount') // Assuming expenses table has 'date' and 'amount'. No currency yet.
        .gte('date', startDate) 
        .lte('date', endDate);   
      if (expensesError) throw expensesError;
      const cashExpensesTodayUSD = expensesData?.reduce((sum, expense) => sum + expense.amount, 0) || 0;
      const cashExpensesTodaySSP = 0; // No SSP expenses tracking yet

      // --- Outstanding Customer Credit ---
      const { data: creditData, error: creditError } = await supabase
        .from('credit_sales')
        .select('balance_due, currency, customer_name')
        .in('status', ['Pending', 'Overdue']);
      if (creditError) throw creditError;
      const outstandingCustomerCreditUSD = creditData?.filter(c => c.currency === 'USD' && c.balance_due > 0).reduce((sum, sale) => sum + sale.balance_due, 0) || 0;
      const outstandingCustomerCreditSSP = creditData?.filter(c => c.currency === 'SSP' && c.balance_due > 0).reduce((sum, sale) => sum + sale.balance_due, 0) || 0;
      
      const distinctDebtors = new Set(creditData?.filter(c => c.balance_due > 0).map(c => c.customer_name));
      const activeDebtorsCount = distinctDebtors.size;

      setStats({
        totalCreditSalesOriginatedTodayUSD,
        totalCreditSalesOriginatedTodaySSP,
        cashSalesReceivedTodayUSD,
        cashSalesReceivedTodaySSP,
        cashDepositsTodayUSD,
        cashDepositsTodaySSP,
        cashExpensesTodayUSD,
        cashExpensesTodaySSP,
        outstandingCustomerCreditUSD,
        outstandingCustomerCreditSSP,
        activeDebtorsCount,
        revenueByCategoryTodayUSD,
      });

    } catch (error: any) {
      toast({
        title: "Error fetching dashboard data",
        description: error.message,
        variant: "destructive",
      });
      if (isInitialLoad) setStats(initialStats); 
    } finally {
      if (isLoading && isInitialLoad) { 
        setIsLoading(false);
      }
    }
  }, [toast, isLoading]);

  useEffect(() => {
    fetchDashboardData(true); 
    const intervalId = setInterval(() => fetchDashboardData(false), 60000); 
    return () => clearInterval(intervalId);
  }, [fetchDashboardData]);

  
  const activeDebtorsMessage = stats.activeDebtorsCount > 0 
    ? `${stats.activeDebtorsCount} Active Debtor${stats.activeDebtorsCount > 1 ? 's' : ''}`
    : 'No outstanding credit';

  const totalCategorizedRevenueTodayUSD = Object.values(stats.revenueByCategoryTodayUSD).reduce((sum, val) => sum + val, 0);


  if (isLoading && stats === initialStats) { 
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="ml-4 text-lg font-semibold">Loading Dashboard Data...</p>
      </div>
    );
  }

  const revenueCategoriesDisplay = [
    { name: "Rooms", value: stats.revenueByCategoryTodayUSD.rooms, icon: BedDouble, colorClass: "[&>div]:bg-blue-500" },
    { name: "Main Bar", value: stats.revenueByCategoryTodayUSD.mainBar, icon: GlassWater, colorClass: "[&>div]:bg-green-500" },
    { name: "Restaurant", value: stats.revenueByCategoryTodayUSD.restaurant, icon: Utensils, colorClass: "[&>div]:bg-orange-500" },
    { name: "Conference Halls", value: stats.revenueByCategoryTodayUSD.conferenceHalls, icon: Presentation, colorClass: "[&>div]:bg-purple-500" },
  ];


  return (
    <>
      <PageTitle title="Dashboard" subtitle="Overview of hotel operations and revenue." icon={Info}>
        {/* <Button disabled>View Full Report</Button> */}
      </PageTitle>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 mb-6">
        <StatCard
          title="Cash Sales Received (Today)"
          value={
            <>
              <div>{formatCurrency(stats.cashSalesReceivedTodayUSD, 'USD')}</div>
              <div>{formatCurrency(stats.cashSalesReceivedTodaySSP, 'SSP')}</div>
            </>
          }
          icon={DollarSign}
          description="Direct cash income from sales"
          className="bg-gradient-to-r from-teal-500/10 to-teal-600/10 border-teal-500"
        />
        <StatCard
          title="Credit Sales Originated (Today)"
          value={
            <>
              <div>{formatCurrency(stats.totalCreditSalesOriginatedTodayUSD, 'USD')}</div>
              <div>{formatCurrency(stats.totalCreditSalesOriginatedTodaySSP, 'SSP')}</div>
            </>
          }
          icon={FileText} 
          description="Value of new credit issued"
          className="bg-gradient-to-r from-green-500/10 to-green-600/10 border-green-500"
        />
        <StatCard
          title="Bank Deposits Value (Today)"
          value={
            <>
              <div>{formatCurrency(stats.cashDepositsTodayUSD, 'USD')}</div>
              <div>{formatCurrency(stats.cashDepositsTodaySSP, 'SSP')}</div>
            </>
          }
          icon={Landmark}
          description="Total value of bank deposits"
          className="bg-gradient-to-r from-blue-500/10 to-blue-600/10 border-blue-500"
        />
        <StatCard
          title="Expenses Value (Today)"
          value={
            <>
              <div>{formatCurrency(stats.cashExpensesTodayUSD, 'USD')}</div>
              <div>{formatCurrency(stats.cashExpensesTodaySSP, 'SSP')}</div>
            </>
          }
          icon={TrendingDown}
          description="Total expenses (Note: SSP expenses need currency field in expenses table)"
           className="bg-gradient-to-r from-orange-500/10 to-orange-600/10 border-orange-500"
        />
        <StatCard
          title="Outstanding Customer Credit"
          value={
            <>
              <div>{formatCurrency(stats.outstandingCustomerCreditUSD, 'USD')}</div>
              <div>{formatCurrency(stats.outstandingCustomerCreditSSP, 'SSP')}</div>
            </>
          }
          icon={Users}
          description={activeDebtorsMessage}
           className="bg-gradient-to-r from-yellow-500/10 to-yellow-600/10 border-yellow-500"
        />
         <StatCard
          title="Cash At Hand (Balance)"
          value="N/A"
          icon={HandCoins}
          description="Calculation requires opening balance & detailed cash transaction tracking."
           className="bg-gradient-to-r from-sky-500/10 to-sky-600/10 border-sky-500"
        />
         <StatCard
          title="Cash Owed to Creditors"
          value="N/A"
          icon={Coins}
          description="Requires payables/bills tracking system for vendor credit."
           className="bg-gradient-to-r from-red-500/10 to-red-600/10 border-red-500"
        />
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="font-headline">Revenue Breakdown (Today - USD)</CardTitle>
            <CardDescription className="font-body">Performance of different revenue streams today (USD only for this breakdown).</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {revenueCategoriesDisplay.map(category => (
              <div key={category.name}>
                <div className="mb-1 flex justify-between items-center">
                  <span className="text-sm font-medium font-body flex items-center">
                    <category.icon className="w-4 h-4 mr-2 text-muted-foreground" />
                    {category.name}
                  </span>
                  <span className="text-sm font-semibold font-body">
                    {formatCurrency(category.value, 'USD')}
                  </span>
                </div>
                <Progress 
                  value={totalCategorizedRevenueTodayUSD > 0 ? (category.value / totalCategorizedRevenueTodayUSD) * 100 : 0} 
                  aria-label={`${category.name} revenue progress`} 
                  className={category.colorClass}
                />
              </div>
            ))}
             {totalCategorizedRevenueTodayUSD === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">No categorized revenue recorded in USD for today.</p>
            )}
          </CardContent>
          <CardFooter>
             <p className="text-xs text-muted-foreground font-body flex items-center">
                <Info className="w-3 h-3 mr-1.5" /> Dashboard data updates periodically. Categorization is based on 'item_service' keywords.
             </p>
          </CardFooter>
        </Card>

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="font-headline">Quick Actions (Placeholder)</CardTitle>
             <CardDescription className="font-body">Common tasks at your fingertips.</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Button variant="default" size="lg" disabled>Add New Reservation</Button>
            <Button variant="outline" size="lg" disabled>Record Expense</Button>
            <Button variant="outline" size="lg" disabled>Update Inventory</Button>
            <Button variant="secondary" size="lg" disabled>Generate Daily Summary</Button>
          </CardContent>
        </Card>
      </div>
    </>
  );
}

    