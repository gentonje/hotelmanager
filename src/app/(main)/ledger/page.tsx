
"use client";

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useToast } from "@/hooks/use-toast";
import { PageTitle } from "@/components/shared/page-title";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Loader2, BookText, CalendarIcon, Filter, XCircle } from "lucide-react";
import { format, parseISO, startOfDay, endOfDay } from "date-fns";
import { cn } from "@/lib/utils";

// Interfaces from other modules (ensure paths are correct if they are moved/changed)
import type { CashSale } from '@/app/(main)/transactions/page';
import type { CreditSale } from '@/app/(main)/credit/page';
import type { Deposit } from '@/app/(main)/deposits/page';
import type { Expense } from '@/app/(main)/expenses/page';

type LedgerEntryType =
  | "Cash Sale"
  | "Credit Issued"
  | "Deposit"
  | "Expense"
  | "Credit Payment (Cash)"
  | "Credit Payment (Deposit)";

interface LedgerEntry {
  id: string;
  date: string; // ISO string
  description: string;
  type: LedgerEntryType;
  amount: number;
  currency: string;
  transaction_id: string;
  source_table: string;
}

const ITEMS_PER_PAGE = 15;

export default function LedgerPage() {
  const [allLedgerEntries, setAllLedgerEntries] = useState<LedgerEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const [tempStartDate, setTempStartDate] = useState<Date | undefined>(undefined);
  const [tempEndDate, setTempEndDate] = useState<Date | undefined>(undefined);

  const [currentPage, setCurrentPage] = useState(1);

  const fetchLedgerData = useCallback(async (filterStartDate?: Date, filterEndDate?: Date) => {
    setIsLoading(true);
    setCurrentPage(1); // Reset to first page on new data fetch/filter
    const collectedEntries: LedgerEntry[] = [];

    try {
      const queryStartDate = filterStartDate ? startOfDay(filterStartDate).toISOString() : undefined;
      const queryEndDate = filterEndDate ? endOfDay(filterEndDate).toISOString() : undefined;

      // 1. Fetch Cash Sales
      let cashQuery = supabase.from('cash_sales').select('*');
      if (queryStartDate) cashQuery = cashQuery.gte('date', queryStartDate);
      if (queryEndDate) cashQuery = cashQuery.lte('date', queryEndDate);
      const { data: cashSalesData, error: cashSalesError } = await cashQuery;
      if (cashSalesError) throw cashSalesError;
      cashSalesData?.forEach((sale: CashSale) => {
        collectedEntries.push({
          id: `cash_${sale.id}`,
          date: sale.date,
          description: sale.details ? `${sale.item_service} - ${sale.details}` : sale.item_service,
          type: sale.item_service?.startsWith("Payment for Credit") ? "Credit Payment (Cash)" : "Cash Sale",
          amount: sale.amount,
          currency: sale.currency,
          transaction_id: sale.id,
          source_table: 'cash_sales',
        });
      });

      // 2. Fetch Credit Sales (Issued)
      let creditQuery = supabase.from('credit_sales').select('*');
      if (queryStartDate) creditQuery = creditQuery.gte('date', queryStartDate);
      if (queryEndDate) creditQuery = creditQuery.lte('date', queryEndDate);
      const { data: creditSalesData, error: creditSalesError } = await creditQuery;
      if (creditSalesError) throw creditSalesError;
      creditSalesData?.forEach((sale: CreditSale) => {
        collectedEntries.push({
          id: `credit_issued_${sale.id}`,
          date: sale.date,
          description: `Credit for ${sale.item_service} to ${sale.customer_name}`,
          type: "Credit Issued",
          amount: sale.original_amount,
          currency: sale.currency,
          transaction_id: sale.id,
          source_table: 'credit_sales_issued',
        });
      });

      // 3. Fetch Deposits
      let depositQuery = supabase.from('deposits').select('*');
      if (queryStartDate) depositQuery = depositQuery.gte('date', queryStartDate);
      if (queryEndDate) depositQuery = depositQuery.lte('date', queryEndDate);
      const { data: depositsData, error: depositsError } = await depositQuery;
      if (depositsError) throw depositsError;
      depositsData?.forEach((deposit: Deposit) => {
        let type: LedgerEntryType = "Deposit";
        let description = deposit.description || `Deposit by ${deposit.deposited_by} (Ref: ${deposit.reference_no})`;
        if (deposit.description?.startsWith("Payment for Credit Sale ID:")) {
          type = "Credit Payment (Deposit)";
          description = deposit.description;
        }
        collectedEntries.push({
          id: `deposit_${deposit.id}`,
          date: deposit.date,
          description: description,
          type: type,
          amount: deposit.amount,
          currency: deposit.currency,
          transaction_id: deposit.id,
          source_table: 'deposits',
        });
      });

      // 4. Fetch Expenses
      let expenseQuery = supabase.from('expenses').select('*');
      if (queryStartDate) expenseQuery = expenseQuery.gte('date', queryStartDate);
      if (queryEndDate) expenseQuery = expenseQuery.lte('date', queryEndDate);
      const { data: expensesData, error: expensesError } = await expenseQuery;
      if (expensesError) throw expensesError;
      expensesData?.forEach((expense: Expense) => {
        collectedEntries.push({
          id: `expense_${expense.id}`,
          date: expense.date,
          description: expense.paid_to ? `${expense.description} (Paid to: ${expense.paid_to})` : expense.description,
          type: "Expense",
          amount: expense.amount,
          currency: "USD", // Assuming USD for expenses
          transaction_id: expense.id,
          source_table: 'expenses',
        });
      });

      collectedEntries.sort((a, b) => parseISO(b.date).getTime() - parseISO(a.date).getTime());
      setAllLedgerEntries(collectedEntries);

    } catch (error: any) {
      toast({
        title: "Error fetching ledger data",
        description: error.message,
        variant: "destructive",
      });
      setAllLedgerEntries([]);
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchLedgerData(startDate, endDate);
  }, [fetchLedgerData, startDate, endDate]);

  const handleApplyFilters = () => {
    setStartDate(tempStartDate);
    setEndDate(tempEndDate);
  };

  const handleClearFilters = () => {
    setTempStartDate(undefined);
    setTempEndDate(undefined);
    setStartDate(undefined);
    setEndDate(undefined);
  };

  const totalPages = Math.ceil(allLedgerEntries.length / ITEMS_PER_PAGE);
  const paginatedEntries = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    return allLedgerEntries.slice(startIndex, endIndex);
  }, [allLedgerEntries, currentPage]);

  const formatCurrencyDisplay = (amount: number, currency: string) => {
    return `${currency} ${amount.toFixed(2)}`;
  };

  return (
    <>
      <PageTitle title="General Ledger" subtitle="A chronological record of all financial transactions." icon={BookText} />

      <Card className="shadow-lg mb-6">
        <CardHeader>
          <CardTitle className="font-headline">Filters</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col sm:flex-row gap-4 items-center">
          <div className="grid gap-2 w-full sm:w-auto">
            <Label htmlFor="start-date" className="font-body">Start Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  id="start-date"
                  variant={"outline"}
                  className={cn("w-full sm:w-[240px] justify-start text-left font-normal", !tempStartDate && "text-muted-foreground")}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {tempStartDate ? format(tempStartDate, "PPP") : <span>Pick a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar mode="single" selected={tempStartDate} onSelect={setTempStartDate} initialFocus />
              </PopoverContent>
            </Popover>
          </div>
          <div className="grid gap-2 w-full sm:w-auto">
            <Label htmlFor="end-date" className="font-body">End Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  id="end-date"
                  variant={"outline"}
                  className={cn("w-full sm:w-[240px] justify-start text-left font-normal", !tempEndDate && "text-muted-foreground")}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {tempEndDate ? format(tempEndDate, "PPP") : <span>Pick a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar mode="single" selected={tempEndDate} onSelect={setTempEndDate} initialFocus />
              </PopoverContent>
            </Popover>
          </div>
          <div className="flex gap-2 mt-auto pt-1 sm:pt-0 w-full sm:w-auto">
            <Button onClick={handleApplyFilters} className="w-full sm:w-auto" disabled={isLoading}>
              <Filter className="mr-2 h-4 w-4" /> Apply Filters
            </Button>
            <Button onClick={handleClearFilters} variant="outline" className="w-full sm:w-auto" disabled={isLoading}>
              <XCircle className="mr-2 h-4 w-4" /> Clear Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="font-headline">All Transactions</CardTitle>
          <CardDescription className="font-body">
            {startDate && endDate
              ? `Displaying transactions from ${format(startDate, "PP")} to ${format(endDate, "PP")}.`
              : startDate
              ? `Displaying transactions from ${format(startDate, "PP")}.`
              : endDate
              ? `Displaying transactions up to ${format(endDate, "PP")}.`
              : "Browse through all recorded financial activities."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
              <p className="ml-4 text-lg font-semibold">Loading Ledger Entries...</p>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="font-body">Date</TableHead>
                    <TableHead className="font-body w-2/5">Description</TableHead>
                    <TableHead className="font-body">Type</TableHead>
                    <TableHead className="font-body text-right">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedEntries.length > 0 ? paginatedEntries.map((entry) => (
                    <TableRow key={entry.id}>
                      <TableCell className="font-body">{format(parseISO(entry.date), "PP")}</TableCell>
                      <TableCell className="font-body">{entry.description}</TableCell>
                      <TableCell className="font-body">
                        <span className={cn("px-2 py-1 text-xs rounded-full", {
                          'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200': entry.type.includes("Sale") || entry.type.includes("Deposit") || entry.type.includes("Credit Payment"),
                          'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200': entry.type.includes("Expense"),
                          'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200': entry.type.includes("Credit Issued"),
                          'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200': !(entry.type.includes("Sale") || entry.type.includes("Deposit") || entry.type.includes("Credit Payment") || entry.type.includes("Expense") || entry.type.includes("Credit Issued"))
                        })}>
                          {entry.type}
                        </span>
                      </TableCell>
                      <TableCell className={cn("font-semibold font-body text-right", {
                        'text-destructive': entry.type.includes("Expense"),
                        'text-orange-600 dark:text-orange-400': entry.type.includes("Credit Issued"),
                        'text-green-600 dark:text-green-400': !entry.type.includes("Expense") && !entry.type.includes("Credit Issued"),
                      })}>
                        {entry.type.includes("Expense") ? '-' :
                         entry.type.includes("Credit Issued") ? '' : '+' }
                        {formatCurrencyDisplay(entry.amount, entry.currency)}
                      </TableCell>
                    </TableRow>
                  )) : (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center font-body h-24">
                        No transactions found for the selected criteria.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
              {allLedgerEntries.length > ITEMS_PER_PAGE && (
                <div className="flex items-center justify-between mt-4 pt-4 border-t">
                  <p className="text-sm text-muted-foreground font-body">
                    Showing {Math.min( ((currentPage - 1) * ITEMS_PER_PAGE) + 1, allLedgerEntries.length)}-{Math.min(currentPage * ITEMS_PER_PAGE, allLedgerEntries.length)} of {allLedgerEntries.length} entries.
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      disabled={currentPage === 1 || isLoading}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                      disabled={currentPage === totalPages || isLoading}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </>
  );
}
