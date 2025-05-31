
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useToast } from "@/hooks/use-toast";
import { PageTitle } from "@/components/shared/page-title";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Loader2, BookText } from "lucide-react";
import { format, parseISO } from "date-fns";

// Interfaces from other modules (ensure paths are correct if they are moved/changed)
import type { CashSale } from '@/app/(main)/transactions/page'; // Assuming CashSale interface is exported here
import type { CreditSale } from '@/app/(main)/credit/page'; // Assuming CreditSale is exported
import type { Deposit } from '@/app/(main)/deposits/page'; // Assuming Deposit is exported
import type { Expense } from '@/app/(main)/expenses/page'; // Assuming Expense is exported

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
  currency: string; // 'USD', 'SSP', or other relevant currency codes
  transaction_id: string; // Original ID of the transaction from its source table
  source_table: string; // e.g., 'cash_sales', 'credit_sales', 'deposits', 'expenses'
}

export default function LedgerPage() {
  const [ledgerEntries, setLedgerEntries] = useState<LedgerEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const fetchLedgerData = useCallback(async () => {
    setIsLoading(true);
    const allEntries: LedgerEntry[] = [];

    try {
      // 1. Fetch Cash Sales
      const { data: cashSalesData, error: cashSalesError } = await supabase
        .from('cash_sales')
        .select('*');
      if (cashSalesError) throw cashSalesError;
      cashSalesData?.forEach((sale: CashSale) => {
        allEntries.push({
          id: `cash_${sale.id}`,
          date: sale.date,
          description: sale.details ? `${sale.item_service} - ${sale.details}` : sale.item_service,
          type: "Cash Sale",
          amount: sale.amount,
          currency: sale.currency,
          transaction_id: sale.id,
          source_table: 'cash_sales',
        });
      });

      // 2. Fetch Credit Sales (Issued)
      // Payments for credit sales are captured through cash_sales or deposits table when recorded
      const { data: creditSalesData, error: creditSalesError } = await supabase
        .from('credit_sales')
        .select('*');
      if (creditSalesError) throw creditSalesError;
      creditSalesData?.forEach((sale: CreditSale) => {
        // Log the issuance of credit
        allEntries.push({
          id: `credit_issued_${sale.id}`,
          date: sale.date,
          description: `Credit for ${sale.item_service} to ${sale.customer_name}`,
          type: "Credit Issued",
          amount: sale.original_amount, // Show the original amount of credit issued
          currency: sale.currency,
          transaction_id: sale.id,
          source_table: 'credit_sales_issued',
        });
      });
      
      // 3. Fetch Deposits
      // Deposits made as payments for credit sales are already captured above if 'deposits' is a payment method.
      // This part fetches general deposits.
      const { data: depositsData, error: depositsError } = await supabase
        .from('deposits')
        .select('*');
      if (depositsError) throw depositsError;
      depositsData?.forEach((deposit: Deposit) => {
        // Avoid double-counting if a deposit was specifically a credit payment already logged via cash_sales system.
        // However, the current system logs credit payments into cash_sales or deposits tables directly.
        // So, a deposit specifically marked as a credit payment via the Credit Page will appear here.
        let type: LedgerEntryType = "Deposit";
        let description = deposit.description || `Deposit by ${deposit.deposited_by} (Ref: ${deposit.reference_no})`;
        if (deposit.description?.startsWith("Payment for Credit Sale ID:")) {
            type = "Credit Payment (Deposit)";
            description = deposit.description;
        }

        allEntries.push({
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
      const { data: expensesData, error: expensesError } = await supabase
        .from('expenses')
        .select('*');
      if (expensesError) throw expensesError;
      expensesData?.forEach((expense: Expense) => {
        allEntries.push({
          id: `expense_${expense.id}`,
          date: expense.date,
          description: expense.paid_to ? `${expense.description} (Paid to: ${expense.paid_to})` : expense.description,
          type: "Expense",
          amount: expense.amount,
          currency: "USD", // Assuming USD for expenses as per previous discussions
          transaction_id: expense.id,
          source_table: 'expenses',
        });
      });

      // Sort all entries by date, most recent first
      allEntries.sort((a, b) => parseISO(b.date).getTime() - parseISO(a.date).getTime());
      setLedgerEntries(allEntries);

    } catch (error: any) {
      toast({
        title: "Error fetching ledger data",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchLedgerData();
  }, [fetchLedgerData]);

  const formatCurrencyDisplay = (amount: number, currency: string) => {
    return `${currency} ${amount.toFixed(2)}`;
  };

  return (
    <>
      <PageTitle title="General Ledger" subtitle="A chronological record of all financial transactions." icon={BookText} />

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="font-headline">All Transactions</CardTitle>
          <CardDescription className="font-body">Browse through all recorded financial activities of the hotel.</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
              <p className="ml-4 text-lg font-semibold">Loading Ledger Entries...</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="font-body">Date</TableHead>
                  <TableHead className="font-body w-2/5">Description</TableHead>
                  <TableHead className="font-body">Type</TableHead>
                  <TableHead className="font-body text-right">Amount</TableHead>
                  {/* <TableHead className="font-body text-right">Currency</TableHead> */}
                </TableRow>
              </TableHeader>
              <TableBody>
                {ledgerEntries.length > 0 ? ledgerEntries.map((entry) => (
                  <TableRow key={entry.id}>
                    <TableCell className="font-body">{format(parseISO(entry.date), "PP")}</TableCell>
                    <TableCell className="font-body">{entry.description}</TableCell>
                    <TableCell className="font-body">
                        <span className={`px-2 py-1 text-xs rounded-full ${
                            entry.type.includes("Sale") || entry.type.includes("Deposit") || entry.type.includes("Credit Payment") ? 'bg-green-100 text-green-800' :
                            entry.type.includes("Expense") ? 'bg-red-100 text-red-800' :
                            entry.type.includes("Credit Issued") ? 'bg-yellow-100 text-yellow-800' :
                            'bg-gray-100 text-gray-800'
                        }`}>
                           {entry.type}
                        </span>
                    </TableCell>
                    <TableCell className={`font-semibold font-body text-right ${
                        entry.type.includes("Expense") ? 'text-destructive' : 
                        entry.type.includes("Credit Issued") ? 'text-orange-600' : 'text-green-600'
                    }`}>
                        {entry.type.includes("Expense") ? '-' : 
                         entry.type.includes("Credit Issued") ? '' : '+' }
                        {formatCurrencyDisplay(entry.amount, entry.currency)}
                    </TableCell>
                    {/* <TableCell className="font-body text-right">{entry.currency}</TableCell> */}
                  </TableRow>
                )) : (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center font-body h-24">
                      No transactions recorded yet.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </>
  );
}
