
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useToast } from "@/hooks/use-toast";
import { PageTitle } from "@/components/shared/page-title";
import { StatCard } from "@/components/shared/stat-card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DollarSign, TrendingDown, Landmark, Users, Info, Loader2, HandCoins, Coins, FileText, BedDouble, GlassWater, Utensils, Presentation, CalendarDays } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { format, startOfDay, endOfDay, startOfMonth, endOfMonth, startOfYear, endOfYear } from 'date-fns';

interface RevenueCategoryStats {
  rooms: number;
  mainBar: number;
  restaurant: number;
  conferenceHalls: number;
}

interface DashboardStats {
  totalCreditSalesOriginatedUSD: number;
  totalCreditSalesOriginatedSSP: number;
  cashDepositsUSD: number;
  cashDepositsSSP: number;
  cashExpensesUSD: number;
  cashExpensesSSP: number;
  outstandingCustomerCreditUSD: number;
  outstandingCustomerCreditSSP: number;
  activeDebtorsCount: number;
  cashSalesReceivedUSD: number;
  cashSalesReceivedSSP: number;
  revenueByCategoryUSD: RevenueCategoryStats;
}

const initialStats: DashboardStats = {
  totalCreditSalesOriginatedUSD: 0,
  totalCreditSalesOriginatedSSP: 0,
  cashDepositsUSD: 0,
  cashDepositsSSP: 0,
  cashExpensesUSD: 0,
  cashExpensesSSP: 0,
  outstandingCustomerCreditUSD: 0,
  outstandingCustomerCreditSSP: 0,
  activeDebtorsCount: 0,
  cashSalesReceivedUSD: 0,
  cashSalesReceivedSSP: 0,
  revenueByCategoryUSD: {
    rooms: 0,
    mainBar: 0,
    restaurant: 0,
    conferenceHalls: 0,
  },
};

const revenueCategoryKeywords = {
  rooms: /\b(room|stay|accommodation|suite|lodge|guest)\b/i,
  mainBar: /\b(bar|drink|beverage|soda|juice|water|beer|wine|spirit)\b/i,
  restaurant: /\b(food|meal|restaurant|dining|breakfast|lunch|dinner|dish|plate|cuisine)\b/i,
  conferenceHalls: /\b(conference|hall|meeting|event space|seminar|workshop)\b/i,
};

const categorizeItem = (itemService: string): keyof RevenueCategoryStats | null => {
  if (!itemService) return null;
  for (const category in revenueCategoryKeywords) {
    if (revenueCategoryKeywords[category as keyof RevenueCategoryStats].test(itemService)) {
      return category as keyof RevenueCategoryStats;
    }
  }
  return null;
};

type PeriodOption = 'today' | 'thisMonth' | 'thisYear';

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats>(initialStats);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState<PeriodOption>('today');
  const { toast } = useToast();

  const formatCurrency = (amount: number, currency: 'USD' | 'SSP') => {
    return `${currency} ${amount.toFixed(2)}`;
  };

  const getPeriodDates = (period: PeriodOption): { startDate: Date, endDate: Date, description: string } => {
    const now = new Date();
    switch (period) {
      case 'thisMonth':
        return { 
          startDate: startOfMonth(now), 
          endDate: endOfMonth(now),
          description: `for ${format(now, 'MMMM yyyy')}` 
        };
      case 'thisYear':
        return { 
          startDate: startOfYear(now), 
          endDate: endOfYear(now),
          description: `for ${format(now, 'yyyy')}`
        };
      case 'today':
      default:
        return { 
          startDate: startOfDay(now), 
          endDate: endOfDay(now),
          description: `for Today, ${format(now, 'PPP')}`
        };
    }
  };

  const fetchDashboardData = useCallback(async (isInitialLoad: boolean = false) => {
    if (isInitialLoad) {
      setIsLoading(true);
    }

    const { startDate, endDate } = getPeriodDates(selectedPeriod);
    const startDateISO = startDate.toISOString();
    const endDateISO = endDate.toISOString();

    try {
      const revenueByCategoryUSD: RevenueCategoryStats = { rooms: 0, mainBar: 0, restaurant: 0, conferenceHalls: 0 };

      const { data: cashSalesData, error: cashSalesError } = await supabase
        .from('cash_sales')
        .select('amount, currency, item_service')
        .gte('date', startDateISO)
        .lte('date', endDateISO);
      if (cashSalesError) throw cashSalesError;

      let cashSalesReceivedUSD = 0;
      let cashSalesReceivedSSP = 0;
      cashSalesData?.forEach(sale => {
        if (sale.currency === 'USD') {
          cashSalesReceivedUSD += sale.amount;
          const category = categorizeItem(sale.item_service);
          if (category) revenueByCategoryUSD[category] += sale.amount;
        } else if (sale.currency === 'SSP') {
          cashSalesReceivedSSP += sale.amount;
        }
      });
      
      const { data: creditSalesData, error: creditSalesError } = await supabase
        .from('credit_sales')
        .select('original_amount, currency, item_service')
        .gte('date', startDateISO) // Filter by origination date
        .lte('date', endDateISO);
      if (creditSalesError) throw creditSalesError;

      let totalCreditSalesOriginatedUSD = 0;
      let totalCreditSalesOriginatedSSP = 0;
      creditSalesData?.forEach(sale => {
        if (sale.currency === 'USD') {
          totalCreditSalesOriginatedUSD += sale.original_amount;
           // Only categorize credit sales originated in the period for USD revenue breakdown
          const category = categorizeItem(sale.item_service);
          if (category) revenueByCategoryUSD[category] += sale.original_amount;
        } else if (sale.currency === 'SSP') {
          totalCreditSalesOriginatedSSP += sale.original_amount;
        }
      });
      
      const { data: depositsData, error: depositsError } = await supabase
        .from('deposits')
        .select('amount, currency')
        .gte('date', startDateISO)
        .lte('date', endDateISO);
      if (depositsError) throw depositsError;
      const cashDepositsUSD = depositsData?.filter(d => d.currency === 'USD').reduce((sum, deposit) => sum + deposit.amount, 0) || 0;
      const cashDepositsSSP = depositsData?.filter(d => d.currency === 'SSP').reduce((sum, deposit) => sum + deposit.amount, 0) || 0;
      
      const { data: expensesData, error: expensesError } = await supabase
        .from('expenses')
        .select('amount') 
        .gte('date', startDateISO) 
        .lte('date', endDateISO);   
      if (expensesError) throw expensesError;
      const cashExpensesUSD = expensesData?.reduce((sum, expense) => sum + expense.amount, 0) || 0;
      const cashExpensesSSP = 0; 

      // Outstanding credit and debtors count are cumulative, not period-specific for flows
      const { data: overallCreditData, error: overallCreditError } = await supabase
        .from('credit_sales')
        .select('balance_due, currency, customer_name')
        .in('status', ['Pending', 'Overdue']);
      if (overallCreditError) throw overallCreditError;
      const outstandingCustomerCreditUSD = overallCreditData?.filter(c => c.currency === 'USD' && c.balance_due > 0).reduce((sum, sale) => sum + sale.balance_due, 0) || 0;
      const outstandingCustomerCreditSSP = overallCreditData?.filter(c => c.currency === 'SSP' && c.balance_due > 0).reduce((sum, sale) => sum + sale.balance_due, 0) || 0;
      
      const distinctDebtors = new Set(overallCreditData?.filter(c => c.balance_due > 0).map(c => c.customer_name));
      const activeDebtorsCount = distinctDebtors.size;

      setStats({
        totalCreditSalesOriginatedUSD,
        totalCreditSalesOriginatedSSP,
        cashSalesReceivedUSD,
        cashSalesReceivedSSP,
        cashDepositsUSD,
        cashDepositsSSP,
        cashExpensesUSD,
        cashExpensesSSP,
        outstandingCustomerCreditUSD,
        outstandingCustomerCreditSSP,
        activeDebtorsCount,
        revenueByCategoryUSD,
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
  }, [toast, isLoading, selectedPeriod]); // Added selectedPeriod

  useEffect(() => {
    fetchDashboardData(true); 
    const intervalId = setInterval(() => fetchDashboardData(false), 60000); 
    return () => clearInterval(intervalId);
  }, [fetchDashboardData, selectedPeriod]); // Added selectedPeriod

  
  const activeDebtorsMessage = stats.activeDebtorsCount > 0 
    ? `${stats.activeDebtorsCount} Active Debtor${stats.activeDebtorsCount > 1 ? 's' : ''} (Overall)`
    : 'No outstanding credit (Overall)';

  const totalCategorizedRevenueUSD = Object.values(stats.revenueByCategoryUSD).reduce((sum, val) => sum + val, 0);

  if (isLoading && stats === initialStats) { 
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="ml-4 text-lg font-semibold">Loading Dashboard Data...</p>
      </div>
    );
  }

  const revenueCategoriesDisplay = [
    { name: "Rooms", value: stats.revenueByCategoryUSD.rooms, icon: BedDouble, colorClass: "[&>div]:bg-blue-500" },
    { name: "Main Bar", value: stats.revenueByCategoryUSD.mainBar, icon: GlassWater, colorClass: "[&>div]:bg-green-500" },
    { name: "Restaurant", value: stats.revenueByCategoryUSD.restaurant, icon: Utensils, colorClass: "[&>div]:bg-orange-500" },
    { name: "Conference Halls", value: stats.revenueByCategoryUSD.conferenceHalls, icon: Presentation, colorClass: "[&>div]:bg-purple-500" },
  ];

  const periodDescription = getPeriodDates(selectedPeriod).description;

  return (
    <>
      <PageTitle 
        title="Dashboard" 
        subtitle={`Overview of hotel operations and revenue ${periodDescription}.`} 
        icon={Info}
      >
        <div className="flex items-center gap-2">
          <CalendarDays className="h-5 w-5 text-muted-foreground" />
          <Select value={selectedPeriod} onValueChange={(value) => setSelectedPeriod(value as PeriodOption)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select period" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="thisMonth">This Month</SelectItem>
              <SelectItem value="thisYear">This Year</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </PageTitle>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 mb-6">
        <StatCard
          title="Cash Sales Received"
          value={
            <>
              <div>{formatCurrency(stats.cashSalesReceivedUSD, 'USD')}</div>
              <div>{formatCurrency(stats.cashSalesReceivedSSP, 'SSP')}</div>
            </>
          }
          icon={DollarSign}
          description={`Direct cash income ${periodDescription}`}
          className="bg-gradient-to-r from-teal-500/10 to-teal-600/10 border-teal-500"
        />
        <StatCard
          title="Credit Sales Originated"
          value={
            <>
              <div>{formatCurrency(stats.totalCreditSalesOriginatedUSD, 'USD')}</div>
              <div>{formatCurrency(stats.totalCreditSalesOriginatedSSP, 'SSP')}</div>
            </>
          }
          icon={FileText} 
          description={`Value of new credit issued ${periodDescription}`}
          className="bg-gradient-to-r from-green-500/10 to-green-600/10 border-green-500"
        />
        <StatCard
          title="Bank Deposits Value"
          value={
            <>
              <div>{formatCurrency(stats.cashDepositsUSD, 'USD')}</div>
              <div>{formatCurrency(stats.cashDepositsSSP, 'SSP')}</div>
            </>
          }
          icon={Landmark}
          description={`Total bank deposits ${periodDescription}`}
          className="bg-gradient-to-r from-blue-500/10 to-blue-600/10 border-blue-500"
        />
        <StatCard
          title="Expenses Value"
          value={
            <>
              <div>{formatCurrency(stats.cashExpensesUSD, 'USD')}</div>
              <div>{formatCurrency(stats.cashExpensesSSP, 'SSP')}</div>
            </>
          }
          icon={TrendingDown}
          description={`Total expenses ${periodDescription} (SSP not tracked)`}
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
          description={activeDebtorsMessage} // This remains overall
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
            <CardTitle className="font-headline">Revenue Breakdown (USD - {selectedPeriod.replace('this', 'This ')})</CardTitle>
            <CardDescription className="font-body">Performance of revenue streams (USD) {periodDescription}.</CardDescription>
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
                  value={totalCategorizedRevenueUSD > 0 ? (category.value / totalCategorizedRevenueUSD) * 100 : 0} 
                  aria-label={`${category.name} revenue progress`} 
                  className={category.colorClass}
                />
              </div>
            ))}
             {totalCategorizedRevenueUSD === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">No categorized USD revenue recorded for this period.</p>
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
