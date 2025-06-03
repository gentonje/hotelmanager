
"use client";

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useToast } from "@/hooks/use-toast";
import { PageTitle } from "@/components/shared/page-title";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Label } from "@/components/ui/label";
import { Loader2, ClipboardList, CalendarIcon, Printer, Filter, XCircle } from "lucide-react";
import { format, startOfMonth, endOfMonth, startOfYear, endOfYear, parseISO, startOfDay, endOfDay } from "date-fns";
import { cn } from "@/lib/utils";
import type { RevenueCategory } from '@/app/(main)/transactions/page';
import type { ExpenseCategory as ExistingExpenseCategory } from '@/app/(main)/expenses/page';

interface ReportFigures {
  totalRevenue: number;
  revenueByCategory: Record<RevenueCategory, number>;
  totalCOGS: number;
  cogsByCategory: Record<Extract<ExistingExpenseCategory, 'Cost of Goods Sold - Bar' | 'Cost of Goods Sold - Restaurant'>, number>;
  grossProfit: number;
  totalOperatingExpenses: number;
  operatingExpensesByCategory: Record<Exclude<ExistingExpenseCategory, 'Cost of Goods Sold - Bar' | 'Cost of Goods Sold - Restaurant'>, number>;
  netProfit: number;
}

const initialFigures: ReportFigures = {
  totalRevenue: 0,
  revenueByCategory: {} as Record<RevenueCategory, number>,
  totalCOGS: 0,
  cogsByCategory: {
    'Cost of Goods Sold - Bar': 0,
    'Cost of Goods Sold - Restaurant': 0,
  },
  grossProfit: 0,
  totalOperatingExpenses: 0,
  operatingExpensesByCategory: {} as Record<Exclude<ExistingExpenseCategory, 'Cost of Goods Sold - Bar' | 'Cost of Goods Sold - Restaurant'>, number>,
  netProfit: 0,
};

const revenueCategoriesOrder: RevenueCategory[] = ['Rooms', 'Main Bar', 'Restaurant', 'Conference Halls', 'Internet Services', 'Swimming Pool', 'Other'];
const cogsCategoriesOrder: Extract<ExistingExpenseCategory, 'Cost of Goods Sold - Bar' | 'Cost of Goods Sold - Restaurant'>[] = ['Cost of Goods Sold - Bar', 'Cost of Goods Sold - Restaurant'];
const operatingExpenseCategoriesOrder: Exclude<ExistingExpenseCategory, 'Cost of Goods Sold - Bar' | 'Cost of Goods Sold - Restaurant'>[] = ['Staff Salaries', 'Taxes', 'Utilities', 'Supplies', 'Maintenance', 'Marketing', 'Operating Supplies', 'Other'];


export default function ProfitLossPage() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [reportDataUSD, setReportDataUSD] = useState<ReportFigures>(JSON.parse(JSON.stringify(initialFigures)));
  const [reportDataSSP, setReportDataSSP] = useState<ReportFigures>(JSON.parse(JSON.stringify(initialFigures)));
  
  const [startDate, setStartDate] = useState<Date | undefined>(startOfMonth(new Date()));
  const [endDate, setEndDate] = useState<Date | undefined>(endOfMonth(new Date()));
  const [tempStartDate, setTempStartDate] = useState<Date | undefined>(startOfMonth(new Date()));
  const [tempEndDate, setTempEndDate] = useState<Date | undefined>(endOfMonth(new Date()));
  const [filterDescription, setFilterDescription] = useState(`for ${format(startOfMonth(new Date()), "MMMM yyyy")}`);

  const formatCurrency = (amount: number) => {
    return amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const fetchReportData = useCallback(async (currentStartDate: Date, currentEndDate: Date) => {
    setIsLoading(true);
    
    const sDateISO = startOfDay(currentStartDate).toISOString();
    const eDateISO = endOfDay(currentEndDate).toISOString();

    const newReportDataUSD: ReportFigures = JSON.parse(JSON.stringify(initialFigures));
    const newReportDataSSP: ReportFigures = JSON.parse(JSON.stringify(initialFigures));

    try {
      // Fetch Cash Sales
      const { data: cashSales, error: cashSalesError } = await supabase
        .from('cash_sales')
        .select('amount, currency, revenue_category')
        .gte('date', sDateISO)
        .lte('date', eDateISO);
      if (cashSalesError) throw cashSalesError;

      cashSales?.forEach(sale => {
        const category = sale.revenue_category || 'Other';
        if (sale.currency === 'USD') {
          newReportDataUSD.revenueByCategory[category] = (newReportDataUSD.revenueByCategory[category] || 0) + sale.amount;
          newReportDataUSD.totalRevenue += sale.amount;
        } else if (sale.currency === 'SSP') {
          newReportDataSSP.revenueByCategory[category] = (newReportDataSSP.revenueByCategory[category] || 0) + sale.amount;
          newReportDataSSP.totalRevenue += sale.amount;
        }
      });

      // Fetch Credit Sales (original amount for sales originated in period)
      const { data: creditSales, error: creditSalesError } = await supabase
        .from('credit_sales')
        .select('original_amount, currency, revenue_category')
        .gte('date', sDateISO) 
        .lte('date', eDateISO);
      if (creditSalesError) throw creditSalesError;
      
      creditSales?.forEach(sale => {
        const category = sale.revenue_category || 'Other';
        if (sale.currency === 'USD') {
          newReportDataUSD.revenueByCategory[category] = (newReportDataUSD.revenueByCategory[category] || 0) + sale.original_amount;
          newReportDataUSD.totalRevenue += sale.original_amount;
        } else if (sale.currency === 'SSP') {
          newReportDataSSP.revenueByCategory[category] = (newReportDataSSP.revenueByCategory[category] || 0) + sale.original_amount;
          newReportDataSSP.totalRevenue += sale.original_amount;
        }
      });

      // Fetch Expenses
      const { data: expenses, error: expensesError } = await supabase
        .from('expenses')
        .select('amount, currency, category')
        .gte('date', sDateISO)
        .lte('date', eDateISO);
      if (expensesError) throw expensesError;

      expenses?.forEach(expense => {
        const category = expense.category;
        if (category === 'Cost of Goods Sold - Bar' || category === 'Cost of Goods Sold - Restaurant') {
          if (expense.currency === 'USD') {
            newReportDataUSD.cogsByCategory[category] = (newReportDataUSD.cogsByCategory[category] || 0) + expense.amount;
            newReportDataUSD.totalCOGS += expense.amount;
          } else if (expense.currency === 'SSP') {
            newReportDataSSP.cogsByCategory[category] = (newReportDataSSP.cogsByCategory[category] || 0) + expense.amount;
            newReportDataSSP.totalCOGS += expense.amount;
          }
        } else {
          const opExCategory = category as Exclude<ExistingExpenseCategory, 'Cost of Goods Sold - Bar' | 'Cost of Goods Sold - Restaurant'>;
          if (expense.currency === 'USD') {
            newReportDataUSD.operatingExpensesByCategory[opExCategory] = (newReportDataUSD.operatingExpensesByCategory[opExCategory] || 0) + expense.amount;
            newReportDataUSD.totalOperatingExpenses += expense.amount;
          } else if (expense.currency === 'SSP') {
            newReportDataSSP.operatingExpensesByCategory[opExCategory] = (newReportDataSSP.operatingExpensesByCategory[opExCategory] || 0) + expense.amount;
            newReportDataSSP.totalOperatingExpenses += expense.amount;
          }
        }
      });
      
      newReportDataUSD.grossProfit = newReportDataUSD.totalRevenue - newReportDataUSD.totalCOGS;
      newReportDataUSD.netProfit = newReportDataUSD.grossProfit - newReportDataUSD.totalOperatingExpenses;
      setReportDataUSD(newReportDataUSD);

      newReportDataSSP.grossProfit = newReportDataSSP.totalRevenue - newReportDataSSP.totalCOGS;
      newReportDataSSP.netProfit = newReportDataSSP.grossProfit - newReportDataSSP.totalOperatingExpenses;
      setReportDataSSP(newReportDataSSP);

    } catch (error: any) {
      toast({ title: "Error fetching report data", description: error.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    if (startDate && endDate) {
      fetchReportData(startDate, endDate);
      if (format(startDate, "yyyy-MM-dd") === format(startOfYear(startDate), "yyyy-MM-dd") && format(endDate, "yyyy-MM-dd") === format(endOfYear(endDate), "yyyy-MM-dd") && startDate.getFullYear() === endDate.getFullYear()) {
        setFilterDescription(`for the Year ${format(startDate, "yyyy")}`);
      } else if (format(startDate, "yyyy-MM-dd") === format(startOfMonth(startDate), "yyyy-MM-dd") && format(endDate, "yyyy-MM-dd") === format(endOfMonth(endDate), "yyyy-MM-dd") && startDate.getFullYear() === endDate.getFullYear() && startDate.getMonth() === endDate.getMonth()) {
        setFilterDescription(`for ${format(startDate, "MMMM yyyy")}`);
      } else {
        setFilterDescription(`from ${format(startDate, "PPP")} to ${format(endDate, "PPP")}`);
      }
    }
  }, [startDate, endDate, fetchReportData]);
  
  const handleApplyFilters = () => {
    if (tempStartDate && tempEndDate) {
      setStartDate(tempStartDate);
      setEndDate(tempEndDate);
    } else {
      toast({ title: "Invalid Date Range", description: "Please select both a start and end date.", variant: "destructive"});
    }
  };

  const handleClearFilters = () => {
    const defaultStart = startOfMonth(new Date());
    const defaultEnd = endOfMonth(new Date());
    setTempStartDate(defaultStart);
    setTempEndDate(defaultEnd);
    setStartDate(defaultStart);
    setEndDate(defaultEnd);
  };

  const handlePrint = () => {
    window.print();
  };
  
  const renderPLTable = (data: ReportFigures, currency: string) => (
    <Card className="shadow-lg m-2">
      <CardHeader>
        <CardTitle className="font-headline">Profit &amp; Loss Statement ({currency})</CardTitle>
        <CardDescription className="font-body">{filterDescription}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-1">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="font-body w-3/5">Item</TableHead>
              <TableHead className="text-right font-body">Amount ({currency})</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow className="font-semibold bg-muted/30">
              <TableCell className="font-body">Revenue</TableCell>
              <TableCell></TableCell>
            </TableRow>
            {revenueCategoriesOrder.map(cat => data.revenueByCategory[cat] ? (
              <TableRow key={`rev-${cat}`}>
                <TableCell className="pl-8 font-body">{cat}</TableCell>
                <TableCell className="text-right font-currency text-sm">{formatCurrency(data.revenueByCategory[cat])}</TableCell>
              </TableRow>
            ) : null)}
            <TableRow className="font-bold border-t">
              <TableCell className="font-body">Total Revenue</TableCell>
              <TableCell className="text-right font-currency text-sm">{formatCurrency(data.totalRevenue)}</TableCell>
            </TableRow>

            <TableRow className="font-semibold bg-muted/30">
              <TableCell className="font-body pt-4">Cost of Goods Sold</TableCell>
              <TableCell></TableCell>
            </TableRow>
            {cogsCategoriesOrder.map(cat => data.cogsByCategory[cat] ? (
              <TableRow key={`cogs-${cat}`}>
                <TableCell className="pl-8 font-body">{cat}</TableCell>
                <TableCell className="text-right font-currency text-sm">{formatCurrency(data.cogsByCategory[cat])}</TableCell>
              </TableRow>
            ) : null)}
             <TableRow className="font-bold border-t">
              <TableCell className="font-body">Total Cost of Goods Sold</TableCell>
              <TableCell className="text-right font-currency text-sm">{formatCurrency(data.totalCOGS)}</TableCell>
            </TableRow>

            <TableRow className="font-bold text-lg bg-primary/10 border-y-2 border-primary/50">
              <TableCell className="font-body">Gross Profit</TableCell>
              <TableCell className="text-right font-currency">{formatCurrency(data.grossProfit)}</TableCell>
            </TableRow>

            <TableRow className="font-semibold bg-muted/30">
              <TableCell className="font-body pt-4">Operating Expenses</TableCell>
              <TableCell></TableCell>
            </TableRow>
            {operatingExpenseCategoriesOrder.map(cat => data.operatingExpensesByCategory[cat] ? (
              <TableRow key={`opex-${cat}`}>
                <TableCell className="pl-8 font-body">{cat}</TableCell>
                <TableCell className="text-right font-currency text-sm">{formatCurrency(data.operatingExpensesByCategory[cat])}</TableCell>
              </TableRow>
            ): null)}
            <TableRow className="font-bold border-t">
              <TableCell className="font-body">Total Operating Expenses</TableCell>
              <TableCell className="text-right font-currency text-sm">{formatCurrency(data.totalOperatingExpenses)}</TableCell>
            </TableRow>
            
            <TableRow className={`font-bold text-xl border-t-2 ${data.netProfit >= 0 ? 'bg-green-500/10 border-green-500/50 text-green-700' : 'bg-red-500/10 border-red-500/50 text-red-700'}`}>
              <TableCell className="font-body">Net Profit / (Loss)</TableCell>
              <TableCell className="text-right font-currency">{formatCurrency(data.netProfit)}</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );


  return (
    <>
      <PageTitle title="Profit &amp; Loss Statement" subtitle="View your business financial performance over a selected period." icon={ClipboardList}>
        <Button onClick={handlePrint} variant="outline" className="no-print">
          <Printer className="mr-2 h-4 w-4" /> Print Report
        </Button>
      </PageTitle>

      <Card className="shadow-lg mb-6 m-2 no-print">
        <CardHeader>
          <CardTitle className="font-headline">Filter Report Period</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col sm:flex-row gap-1 items-center space-y-1 sm:space-y-0 sm:space-x-1">
          <div className="grid gap-2 w-full sm:w-auto">
            <Label htmlFor="start-date-pl" className="font-body">Start Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button id="start-date-pl" variant={"outline"} className={cn("w-full sm:w-[240px] justify-start text-left font-normal font-sans", !tempStartDate && "text-muted-foreground")} disabled={isLoading}>
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {tempStartDate ? format(tempStartDate, "PPP") : <span>Pick a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start"><Calendar mode="single" selected={tempStartDate} onSelect={setTempStartDate} initialFocus /></PopoverContent>
            </Popover>
          </div>
          <div className="grid gap-2 w-full sm:w-auto">
            <Label htmlFor="end-date-pl" className="font-body">End Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button id="end-date-pl" variant={"outline"} className={cn("w-full sm:w-[240px] justify-start text-left font-normal font-sans", !tempEndDate && "text-muted-foreground")} disabled={isLoading}>
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {tempEndDate ? format(tempEndDate, "PPP") : <span>Pick a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start"><Calendar mode="single" selected={tempEndDate} onSelect={setTempEndDate} initialFocus /></PopoverContent>
            </Popover>
          </div>
          <div className="flex gap-2 mt-auto pt-1 sm:pt-0 w-full sm:w-auto">
            <Button onClick={handleApplyFilters} className="w-full sm:w-auto" disabled={isLoading}><Filter className="mr-2 h-4 w-4" /> Apply</Button>
            <Button onClick={handleClearFilters} variant="outline" className="w-full sm:w-auto" disabled={isLoading}><XCircle className="mr-2 h-4 w-4" /> Clear</Button>
          </div>
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="flex justify-center items-center h-64 m-2">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <p className="ml-4 text-lg font-semibold">Generating Profit &amp; Loss Statement...</p>
        </div>
      ) : (
        <div className="printable-area">
          {renderPLTable(reportDataUSD, "USD")}
          {renderPLTable(reportDataSSP, "SSP")}
        </div>
      )}
    </>
  );
}

