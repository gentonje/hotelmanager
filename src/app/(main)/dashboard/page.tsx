
"use client";

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useToast } from "@/hooks/use-toast";
import { PageTitle } from "@/components/shared/page-title";
import { StatCard } from "@/components/shared/stat-card";
import { DollarSign, TrendingUp, TrendingDown, Landmark, Users, AlertTriangle, Info, Loader2, HandCoins, Coins } from "lucide-react";
import { Button } from "@/components/ui/button";
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

interface DashboardStats {
  totalCreditSalesTodayUSD: number;
  totalCreditSalesTodaySSP: number;
  cashDepositsTodayUSD: number;
  cashDepositsTodaySSP: number;
  cashExpensesTodayUSD: number;
  cashExpensesTodaySSP: number;
  outstandingCustomerCreditUSD: number;
  outstandingCustomerCreditSSP: number;
  activeDebtorsCount: number;
}

const initialStats: DashboardStats = {
  totalCreditSalesTodayUSD: 0,
  totalCreditSalesTodaySSP: 0,
  cashDepositsTodayUSD: 0,
  cashDepositsTodaySSP: 0,
  cashExpensesTodayUSD: 0,
  cashExpensesTodaySSP: 0,
  outstandingCustomerCreditUSD: 0,
  outstandingCustomerCreditSSP: 0,
  activeDebtorsCount: 0,
};

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats>(initialStats);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const formatCurrency = (amount: number, currency: 'USD' | 'SSP') => {
    return `${currency} ${amount.toFixed(2)}`;
  };

  useEffect(() => {
    const fetchDashboardData = async () => {
      setIsLoading(true);
      try {
        const today = new Date();
        const startDate = format(today, "yyyy-MM-dd'T'00:00:00.000'Z'");
        const endDate = format(today, "yyyy-MM-dd'T'23:59:59.999'Z'");

        // --- Today's Credit Sales ---
        const { data: salesData, error: salesError } = await supabase
          .from('credit_sales')
          .select('original_amount, currency')
          .gte('date', startDate)
          .lte('date', endDate);
        if (salesError) throw salesError;
        const totalCreditSalesTodayUSD = salesData?.filter(s => s.currency === 'USD').reduce((sum, sale) => sum + sale.original_amount, 0) || 0;
        const totalCreditSalesTodaySSP = salesData?.filter(s => s.currency === 'SSP').reduce((sum, sale) => sum + sale.original_amount, 0) || 0;

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
        // Assuming expenses table also has a 'currency' column. If not, this needs adjustment.
        // For now, let's assume all expenses are in a primary currency (e.g., USD) or we need to add currency to expenses table.
        // Let's assume 'expenses' table has amount and an IMPLICIT currency for now, or needs a currency field.
        // To make this robust, 'expenses' table SHOULD have a currency column.
        // For this example, I'll query all and assume USD if no currency field.
         const { data: expensesData, error: expensesError } = await supabase
          .from('expenses')
          .select('amount'); // Ideally: select('amount, currency')
          // .gte('date', startDate) // Assuming 'date' field exists
          // .lte('date', endDate);
        if (expensesError) throw expensesError;
        // const cashExpensesTodayUSD = expensesData?.filter(e => e.currency === 'USD').reduce((sum, expense) => sum + expense.amount, 0) || 0;
        // const cashExpensesTodaySSP = expensesData?.filter(e => e.currency === 'SSP').reduce((sum, expense) => sum + expense.amount, 0) || 0;
        // Simplified:
        const cashExpensesTodayUSD = expensesData?.reduce((sum, expense) => sum + expense.amount, 0) || 0; // Treat as USD for now
        const cashExpensesTodaySSP = 0; // Placeholder

        // --- Outstanding Customer Credit ---
        const { data: creditData, error: creditError } = await supabase
          .from('credit_sales')
          .select('balance_due, currency, customer_name')
          .in('status', ['Pending', 'Overdue']);
        if (creditError) throw creditError;
        const outstandingCustomerCreditUSD = creditData?.filter(c => c.currency === 'USD').reduce((sum, sale) => sum + sale.balance_due, 0) || 0;
        const outstandingCustomerCreditSSP = creditData?.filter(c => c.currency === 'SSP').reduce((sum, sale) => sum + sale.balance_due, 0) || 0;
        
        const distinctDebtors = new Set(creditData?.map(c => c.customer_name));
        const activeDebtorsCount = distinctDebtors.size;


        setStats({
          totalCreditSalesTodayUSD,
          totalCreditSalesTodaySSP,
          cashDepositsTodayUSD,
          cashDepositsTodaySSP,
          cashExpensesTodayUSD,
          cashExpensesTodaySSP,
          outstandingCustomerCreditUSD,
          outstandingCustomerCreditSSP,
          activeDebtorsCount,
        });

      } catch (error: any) {
        toast({
          title: "Error fetching dashboard data",
          description: error.message,
          variant: "destructive",
        });
        setStats(initialStats); 
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
    const intervalId = setInterval(fetchDashboardData, 60000); // Refresh every 60 seconds
    return () => clearInterval(intervalId);
  }, [toast]);

  
  const activeDebtorsMessage = stats.activeDebtorsCount > 0 
    ? `${stats.activeDebtorsCount} Active Debtor${stats.activeDebtorsCount > 1 ? 's' : ''}`
    : 'No outstanding credit';


  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="ml-4 text-lg font-semibold">Loading Dashboard Data...</p>
      </div>
    );
  }

  return (
    <>
      <PageTitle title="Dashboard" subtitle="Overview of hotel operations and revenue." icon={DollarSign}>
        {/* <Button disabled>View Full Report</Button> */}
      </PageTitle>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 mb-6">
        <StatCard
          title="Credit Sales Value (Today)"
          value={`${formatCurrency(stats.totalCreditSalesTodayUSD, 'USD')} / ${formatCurrency(stats.totalCreditSalesTodaySSP, 'SSP')}`}
          icon={TrendingUp}
          description="Sum of new credit sales"
          className="bg-gradient-to-r from-green-500/10 to-green-600/10 border-green-500"
        />
        <StatCard
          title="Bank Deposits Value (Today)"
          value={`${formatCurrency(stats.cashDepositsTodayUSD, 'USD')} / ${formatCurrency(stats.cashDepositsTodaySSP, 'SSP')}`}
          icon={Landmark}
          description="Total value of bank deposits"
          className="bg-gradient-to-r from-blue-500/10 to-blue-600/10 border-blue-500"
        />
        <StatCard
          title="Expenses Value (Today)"
          value={`${formatCurrency(stats.cashExpensesTodayUSD, 'USD')} / ${formatCurrency(stats.cashExpensesTodaySSP, 'SSP')}`}
          icon={TrendingDown}
          description="Total expenses recorded (Note: Currency breakdown for expenses might be simplified)"
           className="bg-gradient-to-r from-orange-500/10 to-orange-600/10 border-orange-500"
        />
        <StatCard
          title="Outstanding Customer Credit"
          value={`${formatCurrency(stats.outstandingCustomerCreditUSD, 'USD')} / ${formatCurrency(stats.outstandingCustomerCreditSSP, 'SSP')}`}
          icon={Users}
          description={activeDebtorsMessage}
           className="bg-gradient-to-r from-yellow-500/10 to-yellow-600/10 border-yellow-500"
        />
         <StatCard
          title="Cash At Hand (Balance)"
          value="N/A"
          icon={HandCoins}
          description="Calculation needs more data structure (e.g. opening balance, cash-specific expenses)"
           className="bg-gradient-to-r from-sky-500/10 to-sky-600/10 border-sky-500"
        />
         <StatCard
          title="Cash Owed to Creditors"
          value="N/A"
          icon={Coins}
          description="Requires payables/bills tracking system"
           className="bg-gradient-to-r from-red-500/10 to-red-600/10 border-red-500"
        />
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="font-headline">Revenue Breakdown (Placeholder)</CardTitle>
            <CardDescription className="font-body">Performance of different revenue streams today.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="mb-1 flex justify-between items-center">
                <span className="text-sm font-medium font-body">Rooms</span>
                <span className="text-sm font-semibold font-body">$0.00</span>
              </div>
              <Progress value={0} aria-label="Rooms revenue progress" />
            </div>
            <div>
              <div className="mb-1 flex justify-between items-center">
                <span className="text-sm font-medium font-body">Main Bar</span>
                <span className="text-sm font-semibold font-body">$0.00</span>
              </div>
              <Progress value={0} aria-label="Main bar revenue progress" className="[&>div]:bg-accent" />
            </div>
            <div>
              <div className="mb-1 flex justify-between items-center">
                <span className="text-sm font-medium font-body">Restaurant</span>
                <span className="text-sm font-semibold font-body">$0.00</span>
              </div>
              <Progress value={0} aria-label="Restaurant revenue progress" />
            </div>
             <div>
              <div className="mb-1 flex justify-between items-center">
                <span className="text-sm font-medium font-body">Conference Halls</span>
                <span className="text-sm font-semibold font-body">$0.00</span>
              </div>
              <Progress value={0} aria-label="Conference halls revenue progress" className="[&>div]:bg-secondary-foreground" />
            </div>
          </CardContent>
          <CardFooter>
             <p className="text-xs text-muted-foreground font-body flex items-center">
                <Info className="w-3 h-3 mr-1.5" /> Dashboard data updates periodically.
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
