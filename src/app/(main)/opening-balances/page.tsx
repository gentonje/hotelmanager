
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useToast } from "@/hooks/use-toast";
import { PageTitle } from "@/components/shared/page-title";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { ArchiveRestore, CalendarIcon, DollarSign, Loader2, Save } from "lucide-react";
import { format, startOfYear, parseISO } from "date-fns";
import { cn } from "@/lib/utils";
import type { Bank } from '@/app/(main)/banks/page';
import type { Customer } from '@/app/(main)/customers/page';
import type { Vendor } from '@/app/(main)/vendors/page';

type Currency = 'USD' | 'SSP';

interface OpeningBalanceEntry {
  id?: string; // From DB
  balance_date: string; // ISO string
  account_type: string;
  account_id?: string | null;
  account_name: string;
  amount: number;
  currency: Currency;
  description?: string;
}

interface BankWithBalance extends Bank {
  opening_balance_usd: number;
  opening_balance_ssp: number;
}
interface CustomerWithBalance extends Customer {
  opening_balance_usd: number;
  opening_balance_ssp: number;
}
interface VendorWithBalance extends Vendor {
  opening_balance_usd: number;
  opening_balance_ssp: number;
}


export default function OpeningBalancesPage() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [accountingStartDate, setAccountingStartDate] = useState<Date>(startOfYear(new Date()));
  
  const [cashOnHandUSD, setCashOnHandUSD] = useState(0);
  const [cashOnHandSSP, setCashOnHandSSP] = useState(0);

  const [banks, setBanks] = useState<BankWithBalance[]>([]);
  const [customers, setCustomers] = useState<CustomerWithBalance[]>([]);
  const [vendors, setVendors] = useState<VendorWithBalance[]>([]);
  
  const [otherPayablesUSD, setOtherPayablesUSD] = useState(0);
  const [otherPayablesSSP, setOtherPayablesSSP] = useState(0);
  const [otherPayablesDescription, setOtherPayablesDescription] = useState('');

  const fetchInitialData = useCallback(async (date: Date) => {
    setIsLoading(true);
    const formattedDate = format(date, "yyyy-MM-dd");

    try {
      // Fetch existing opening balances for the selected date
      const { data: existingBalances, error: balancesError } = await supabase
        .from('opening_balances')
        .select('*')
        .eq('balance_date', formattedDate);
      if (balancesError) throw balancesError;

      const getBalance = (type: string, accId: string | undefined, curr: Currency): number => {
        const bal = existingBalances?.find(b => 
          b.account_type === type && 
          (accId ? b.account_id === accId : true) && // account_id can be null for CASH_ON_HAND
          b.currency === curr
        );
        return bal ? bal.amount : 0;
      };
      
      setCashOnHandUSD(getBalance('CASH_ON_HAND', undefined, 'USD'));
      setCashOnHandSSP(getBalance('CASH_ON_HAND', undefined, 'SSP'));
      setOtherPayablesUSD(getBalance('OTHER_PAYABLE', undefined, 'USD'));
      setOtherPayablesSSP(getBalance('OTHER_PAYABLE', undefined, 'SSP'));
      setOtherPayablesDescription(existingBalances?.find(b => b.account_type === 'OTHER_PAYABLE')?.description || '');


      const { data: banksData, error: banksError } = await supabase.from('banks').select('*');
      if (banksError) throw banksError;
      setBanks((banksData || []).map(b => ({
        ...b,
        opening_balance_usd: getBalance('BANK_ACCOUNT', b.id, 'USD'),
        opening_balance_ssp: getBalance('BANK_ACCOUNT', b.id, 'SSP'),
      })));

      const { data: customersData, error: customersError } = await supabase.from('customers').select('*');
      if (customersError) throw customersError;
      setCustomers((customersData || []).map(c => ({
        ...c,
        opening_balance_usd: getBalance('CUSTOMER_DEBT', c.id, 'USD'),
        opening_balance_ssp: getBalance('CUSTOMER_DEBT', c.id, 'SSP'),
      })));

      const { data: vendorsData, error: vendorsError } = await supabase.from('vendors').select('*');
      if (vendorsError) throw vendorsError;
      setVendors((vendorsData || []).map(v => ({
        ...v,
        opening_balance_usd: getBalance('VENDOR_CREDIT', v.id, 'USD'),
        opening_balance_ssp: getBalance('VENDOR_CREDIT', v.id, 'SSP'),
      })));

    } catch (error: any) {
      toast({ title: "Error fetching initial data", description: error.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchInitialData(accountingStartDate);
  }, [accountingStartDate, fetchInitialData]);

  const handleBankBalanceChange = (bankId: string, currency: Currency, value: string) => {
    const amount = parseFloat(value) || 0;
    setBanks(prev => prev.map(b => 
      b.id === bankId 
        ? currency === 'USD' ? { ...b, opening_balance_usd: amount } : { ...b, opening_balance_ssp: amount }
        : b
    ));
  };
  
  const handleCustomerBalanceChange = (customerId: string, currency: Currency, value: string) => {
    const amount = parseFloat(value) || 0;
    setCustomers(prev => prev.map(c => 
      c.id === customerId 
        ? currency === 'USD' ? { ...c, opening_balance_usd: amount } : { ...c, opening_balance_ssp: amount }
        : c
    ));
  };

  const handleVendorBalanceChange = (vendorId: string, currency: Currency, value: string) => {
    const amount = parseFloat(value) || 0;
    setVendors(prev => prev.map(v => 
      v.id === vendorId 
        ? currency === 'USD' ? { ...v, opening_balance_usd: amount } : { ...v, opening_balance_ssp: amount }
        : v
    ));
  };

  const handleSaveOpeningBalances = async () => {
    setIsSubmitting(true);
    const formattedDate = format(accountingStartDate, "yyyy-MM-dd");
    const balancesToUpsert: Omit<OpeningBalanceEntry, 'id'>[] = [];

    // Cash on Hand
    if (cashOnHandUSD >= 0) balancesToUpsert.push({ balance_date: formattedDate, account_type: 'CASH_ON_HAND', account_name: 'Cash on Hand USD', amount: cashOnHandUSD, currency: 'USD' });
    if (cashOnHandSSP >= 0) balancesToUpsert.push({ balance_date: formattedDate, account_type: 'CASH_ON_HAND', account_name: 'Cash on Hand SSP', amount: cashOnHandSSP, currency: 'SSP' });

    // Bank Accounts
    banks.forEach(b => {
      if (b.opening_balance_usd >= 0 && b.currency === 'USD') balancesToUpsert.push({ balance_date: formattedDate, account_type: 'BANK_ACCOUNT', account_id: b.id, account_name: `${b.name} (USD)`, amount: b.opening_balance_usd, currency: 'USD' });
      if (b.opening_balance_ssp >= 0 && b.currency === 'SSP') balancesToUpsert.push({ balance_date: formattedDate, account_type: 'BANK_ACCOUNT', account_id: b.id, account_name: `${b.name} (SSP)`, amount: b.opening_balance_ssp, currency: 'SSP' });
      // Handle banks with dual currencies or if a bank can have opening in a currency not its primary
       if (b.opening_balance_usd >= 0 && b.currency !== 'USD') balancesToUpsert.push({ balance_date: formattedDate, account_type: 'BANK_ACCOUNT', account_id: b.id, account_name: `${b.name} (Opening USD for ${b.currency} Bank)`, amount: b.opening_balance_usd, currency: 'USD' });
       if (b.opening_balance_ssp >= 0 && b.currency !== 'SSP') balancesToUpsert.push({ balance_date: formattedDate, account_type: 'BANK_ACCOUNT', account_id: b.id, account_name: `${b.name} (Opening SSP for ${b.currency} Bank)`, amount: b.opening_balance_ssp, currency: 'SSP' });

    });
    
    // Customer Debts
    customers.forEach(c => {
      if (c.opening_balance_usd > 0) balancesToUpsert.push({ balance_date: formattedDate, account_type: 'CUSTOMER_DEBT', account_id: c.id, account_name: `Customer: ${c.name} (USD)`, amount: c.opening_balance_usd, currency: 'USD' });
      if (c.opening_balance_ssp > 0) balancesToUpsert.push({ balance_date: formattedDate, account_type: 'CUSTOMER_DEBT', account_id: c.id, account_name: `Customer: ${c.name} (SSP)`, amount: c.opening_balance_ssp, currency: 'SSP' });
    });

    // Vendor Credits
    vendors.forEach(v => {
      if (v.opening_balance_usd > 0) balancesToUpsert.push({ balance_date: formattedDate, account_type: 'VENDOR_CREDIT', account_id: v.id, account_name: `Vendor: ${v.name} (USD)`, amount: v.opening_balance_usd, currency: 'USD' });
      if (v.opening_balance_ssp > 0) balancesToUpsert.push({ balance_date: formattedDate, account_type: 'VENDOR_CREDIT', account_id: v.id, account_name: `Vendor: ${v.name} (SSP)`, amount: v.opening_balance_ssp, currency: 'SSP' });
    });
    
    // Other Payables
    if (otherPayablesUSD > 0) balancesToUpsert.push({ balance_date: formattedDate, account_type: 'OTHER_PAYABLE', account_name: 'Other Payables USD', amount: otherPayablesUSD, currency: 'USD', description: otherPayablesDescription });
    if (otherPayablesSSP > 0) balancesToUpsert.push({ balance_date: formattedDate, account_type: 'OTHER_PAYABLE', account_name: 'Other Payables SSP', amount: otherPayablesSSP, currency: 'SSP', description: otherPayablesDescription });

    try {
      const { error } = await supabase
        .from('opening_balances')
        .upsert(balancesToUpsert, { onConflict: 'balance_date,account_type,account_id,currency', ignoreDuplicates: false }); // Ensure account_id is part of conflict for unique entries

      if (error) throw error;
      toast({ title: "Opening Balances Saved", description: "Your opening balances have been successfully saved.", variant: "default" });
    } catch (error: any) {
      toast({ title: "Error Saving Balances", description: error.message, variant: "destructive" });
    } finally {
      setIsSubmitting(false);
      fetchInitialData(accountingStartDate); // Refresh data
    }
  };


  return (
    <>
      <PageTitle title="Opening Balances" subtitle="Set the starting financial figures for your accounting period." icon={ArchiveRestore} />

      <Card className="mb-6 shadow-lg">
        <CardHeader>
          <CardTitle className="font-headline">Accounting Start Date</CardTitle>
          <CardDescription className="font-body">Select the date for which these opening balances apply. Typically, the first day of your financial year.</CardDescription>
        </CardHeader>
        <CardContent>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant={"outline"}
                className={cn("w-full sm:w-[280px] justify-start text-left font-normal", !accountingStartDate && "text-muted-foreground")}
                disabled={isLoading || isSubmitting}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {accountingStartDate ? format(accountingStartDate, "PPP") : <span>Pick a date</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={accountingStartDate}
                onSelect={(date) => date && setAccountingStartDate(date)}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <p className="ml-4 text-lg font-semibold">Loading Opening Balance Data...</p>
        </div>
      ) : (
      <>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <Card className="shadow-md">
            <CardHeader>
              <CardTitle className="font-headline">Cash on Hand</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="cashOnHandUSD" className="font-body">Cash on Hand (USD)</Label>
                <Input id="cashOnHandUSD" type="number" value={cashOnHandUSD} onChange={(e) => setCashOnHandUSD(parseFloat(e.target.value) || 0)} placeholder="0.00" disabled={isSubmitting} />
              </div>
              <div>
                <Label htmlFor="cashOnHandSSP" className="font-body">Cash on Hand (SSP)</Label>
                <Input id="cashOnHandSSP" type="number" value={cashOnHandSSP} onChange={(e) => setCashOnHandSSP(parseFloat(e.target.value) || 0)} placeholder="0.00" disabled={isSubmitting} />
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-md">
            <CardHeader>
              <CardTitle className="font-headline">Other Payables / Accrued Expenses</CardTitle>
              <CardDescription className="font-body">e.g., Unpaid salaries, outstanding utility bills from previous period.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="otherPayablesUSD" className="font-body">Total Other Payables (USD)</Label>
                <Input id="otherPayablesUSD" type="number" value={otherPayablesUSD} onChange={(e) => setOtherPayablesUSD(parseFloat(e.target.value) || 0)} placeholder="0.00" disabled={isSubmitting} />
              </div>
              <div>
                <Label htmlFor="otherPayablesSSP" className="font-body">Total Other Payables (SSP)</Label>
                <Input id="otherPayablesSSP" type="number" value={otherPayablesSSP} onChange={(e) => setOtherPayablesSSP(parseFloat(e.target.value) || 0)} placeholder="0.00" disabled={isSubmitting} />
              </div>
              <div>
                <Label htmlFor="otherPayablesDescription" className="font-body">Description for Other Payables</Label>
                <Textarea id="otherPayablesDescription" value={otherPayablesDescription} onChange={(e) => setOtherPayablesDescription(e.target.value)} placeholder="e.g., Unpaid December Salaries, Pending Electricity Bill" disabled={isSubmitting} />
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="mb-6 shadow-md">
          <CardHeader>
            <CardTitle className="font-headline">Bank Account Balances</CardTitle>
             <CardDescription className="font-body">Enter the balance for each bank account as of the accounting start date. Input 0 if no balance.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {banks.length === 0 && <p className="font-body text-muted-foreground">No bank accounts found. Please add banks first.</p>}
            {banks.map(bank => (
              <div key={bank.id} className="p-4 border rounded-md bg-card/50">
                <h4 className="font-semibold font-body mb-2">{bank.name} (Primary Currency: {bank.currency})</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor={`bank-${bank.id}-usd`} className="font-body">Opening Balance (USD)</Label>
                    <Input id={`bank-${bank.id}-usd`} type="number" value={bank.opening_balance_usd} onChange={(e) => handleBankBalanceChange(bank.id, 'USD', e.target.value)} placeholder="0.00" disabled={isSubmitting}/>
                  </div>
                  <div>
                    <Label htmlFor={`bank-${bank.id}-ssp`} className="font-body">Opening Balance (SSP)</Label>
                    <Input id={`bank-${bank.id}-ssp`} type="number" value={bank.opening_balance_ssp} onChange={(e) => handleBankBalanceChange(bank.id, 'SSP', e.target.value)} placeholder="0.00" disabled={isSubmitting}/>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="mb-6 shadow-md">
          <CardHeader>
            <CardTitle className="font-headline">Customer Credits (Accounts Receivable)</CardTitle>
            <CardDescription className="font-body">Total amount owed by each customer as of the accounting start date. Input 0 if none.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
             {customers.length === 0 && <p className="font-body text-muted-foreground">No customers found. Please add customers first.</p>}
            {customers.map(customer => (
              <div key={customer.id} className="p-4 border rounded-md bg-card/50">
                <h4 className="font-semibold font-body mb-2">{customer.name}</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor={`customer-${customer.id}-usd`} className="font-body">Owed Amount (USD)</Label>
                    <Input id={`customer-${customer.id}-usd`} type="number" value={customer.opening_balance_usd} onChange={(e) => handleCustomerBalanceChange(customer.id, 'USD', e.target.value)} placeholder="0.00" disabled={isSubmitting}/>
                  </div>
                  <div>
                    <Label htmlFor={`customer-${customer.id}-ssp`} className="font-body">Owed Amount (SSP)</Label>
                    <Input id={`customer-${customer.id}-ssp`} type="number" value={customer.opening_balance_ssp} onChange={(e) => handleCustomerBalanceChange(customer.id, 'SSP', e.target.value)} placeholder="0.00" disabled={isSubmitting}/>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
        
        <Card className="mb-6 shadow-md">
          <CardHeader>
            <CardTitle className="font-headline">Vendor Payables (Accounts Payable)</CardTitle>
            <CardDescription className="font-body">Total amount owed to each vendor as of the accounting start date. Input 0 if none.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {vendors.length === 0 && <p className="font-body text-muted-foreground">No vendors found. Please add vendors first.</p>}
            {vendors.map(vendor => (
              <div key={vendor.id} className="p-4 border rounded-md bg-card/50">
                <h4 className="font-semibold font-body mb-2">{vendor.name}</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor={`vendor-${vendor.id}-usd`} className="font-body">Amount Owed (USD)</Label>
                    <Input id={`vendor-${vendor.id}-usd`} type="number" value={vendor.opening_balance_usd} onChange={(e) => handleVendorBalanceChange(vendor.id, 'USD', e.target.value)} placeholder="0.00" disabled={isSubmitting}/>
                  </div>
                  <div>
                    <Label htmlFor={`vendor-${vendor.id}-ssp`} className="font-body">Amount Owed (SSP)</Label>
                    <Input id={`vendor-${vendor.id}-ssp`} type="number" value={vendor.opening_balance_ssp} onChange={(e) => handleVendorBalanceChange(vendor.id, 'SSP', e.target.value)} placeholder="0.00" disabled={isSubmitting}/>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </>
      )}

      <div className="mt-8 flex justify-end">
        <Button onClick={handleSaveOpeningBalances} size="lg" disabled={isLoading || isSubmitting}>
          {isSubmitting ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Save className="mr-2 h-5 w-5" />}
          Save All Opening Balances
        </Button>
      </div>
    </>
  );
}

