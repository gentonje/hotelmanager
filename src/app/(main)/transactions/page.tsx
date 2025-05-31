
"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useToast } from "@/hooks/use-toast";
import { PageTitle } from "@/components/shared/page-title";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CalendarIcon, ListChecks, Loader2, DollarSign, CreditCard, LandmarkIcon } from "lucide-react";
import { format, parseISO } from "date-fns";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

// Import existing interfaces
import type { Bank } from '@/app/(main)/banks/page';
import type { Customer } from '@/app/(main)/customers/page';
import type { CreditSale, CreditStatus } from '@/app/(main)/credit/page';
import type { Deposit } from '@/app/(main)/deposits/page';

type TransactionType = 'cash_sale' | 'credit_sale' | 'deposit' | '';
type Currency = 'USD' | 'SSP';

export interface CashSale {
  id: string;
  date: string; // ISO string
  item_service: string;
  details?: string;
  amount: number;
  customer_name?: string; // Optional customer name for cash sales
  created_at?: string;
  updated_at?: string;
}

interface FormCashSale extends Omit<CashSale, 'date' | 'id'> {
  date: Date;
  amount_tendered?: number;
  due_date_for_balance?: Date; // For shortfall scenario
}

interface FormCreditSaleState extends Omit<CreditSale, 'id' | 'date' | 'due_date' | 'created_at' | 'updated_at'> {
  date: Date;
  due_date?: Date;
}

interface FormDepositState extends Omit<Deposit, 'id' | 'date' | 'created_at' | 'updated_at'> {
  date: Date;
}


export default function TransactionsPage() {
  const [selectedType, setSelectedType] = useState<TransactionType>('');
  const [isLoading, setIsLoading] = useState(false); // For fetching dropdown data
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const [customersList, setCustomersList] = useState<Pick<Customer, 'id' | 'name'>[]>([]);
  const [banksList, setBanksList] = useState<Pick<Bank, 'id' | 'name' | 'currency'>[]>([]);

  // Form states
  const [cashSaleData, setCashSaleData] = useState<Partial<FormCashSale>>({ date: new Date(), amount: 0 });
  const [creditSaleData, setCreditSaleData] = useState<Partial<FormCreditSaleState>>({ date: new Date(), status: 'Pending', amount: 0 });
  const [depositData, setDepositData] = useState<Partial<FormDepositState>>({ date: new Date(), currency: 'USD', amount: 0 });
  
  const fetchDropdownData = async () => {
    setIsLoading(true);
    try {
      const { data: banksData, error: banksError } = await supabase.from('banks').select('id, name, currency');
      if (banksError) throw banksError;
      setBanksList(banksData || []);

      const { data: customersData, error: customersError } = await supabase.from('customers').select('id, name');
      if (customersError) throw customersError;
      setCustomersList(customersData || []);
    } catch (error: any) {
       toast({ title: "Error fetching form data", description: error?.message || "Could not load customer or bank lists.", variant: "destructive" });
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchDropdownData();
  }, []);

  const resetAllForms = () => {
    setCashSaleData({ date: new Date(), amount: 0, item_service: '', details: '', customer_name: '', amount_tendered: undefined, due_date_for_balance: undefined });
    setCreditSaleData({ date: new Date(), status: 'Pending', amount: 0, customer_name: '', item_service: '', details: '' });
    setDepositData({ date: new Date(), currency: 'USD', amount: 0, bank: '', reference_no: '', deposited_by: '', description: '' });
  };
  
  const handleTypeChange = (value: string) => {
    setSelectedType(value as TransactionType);
    resetAllForms();
  };

  const handleInputChange = (form: 'cash' | 'credit' | 'deposit', e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    const val = (name === 'amount' || name === 'amount_tendered') && value !== '' ? parseFloat(value) : value;
    
    if (form === 'cash') setCashSaleData(prev => ({ ...prev, [name]: val }));
    if (form === 'credit') setCreditSaleData(prev => ({ ...prev, [name]: val }));
    if (form === 'deposit') setDepositData(prev => ({ ...prev, [name]: val }));
  };

  const handleDateChange = (form: 'cash' | 'credit' | 'deposit', field: string, dateVal?: Date) => {
    if (dateVal !== undefined) { // Allow clearing date by passing undefined
      if (form === 'cash') setCashSaleData(prev => ({ ...prev, [field]: dateVal }));
      if (form === 'credit') setCreditSaleData(prev => ({ ...prev, [field]: dateVal }));
      if (form === 'deposit') setDepositData(prev => ({ ...prev, [field]: dateVal }));
    }
  };
  
  const handleSelectChange = (form: 'cash' | 'credit' | 'deposit', field: string, value: string) => {
    if (form === 'cash') setCashSaleData(prev => ({ ...prev, [field]: value }));
    if (form === 'credit') setCreditSaleData(prev => ({ ...prev, [field]: value }));
    if (form === 'deposit') setDepositData(prev => ({ ...prev, [field]: value }));
  };

  const changeDue = useMemo(() => {
    if (selectedType === 'cash_sale' && cashSaleData.amount_tendered !== undefined && cashSaleData.amount !== undefined) {
      return cashSaleData.amount_tendered - cashSaleData.amount;
    }
    return null;
  }, [selectedType, cashSaleData.amount_tendered, cashSaleData.amount]);

  const isShortfall = useMemo(() => {
    return selectedType === 'cash_sale' && cashSaleData.amount_tendered !== undefined && cashSaleData.amount !== undefined && cashSaleData.amount_tendered < cashSaleData.amount;
  }, [selectedType, cashSaleData.amount_tendered, cashSaleData.amount]);


  const handleSubmit = async () => {
    setIsSubmitting(true);
    let error = null;

    try {
      if (selectedType === 'cash_sale') {
        if (!cashSaleData.date || !cashSaleData.item_service || cashSaleData.amount === undefined || cashSaleData.amount <= 0) {
          toast({ title: "Missing fields", description: "Date, Item/Service, and a valid Amount are required for cash sale.", variant: "destructive" });
          setIsSubmitting(false); return;
        }

        if (isShortfall) { // Amount tendered is less than sale amount
          if (!cashSaleData.customer_name) {
            toast({ title: "Customer Name Required", description: "Please select a customer to record the outstanding balance as credit.", variant: "destructive" });
            setIsSubmitting(false); return;
          }
          if (!cashSaleData.due_date_for_balance) {
            toast({ title: "Due Date Required", description: "Please provide a due date for the balance payment.", variant: "destructive" });
            setIsSubmitting(false); return;
          }

          const creditAmount = cashSaleData.amount! - (cashSaleData.amount_tendered || 0);
          const creditDetails = `Original Item: ${cashSaleData.item_service}. Sale Amount: ${cashSaleData.amount}. Tendered: ${cashSaleData.amount_tendered || 0}. Balance Due: ${creditAmount}. Notes: ${cashSaleData.details || ''}`;
          
          const creditToSave: Omit<CreditSale, 'id' | 'created_at' | 'updated_at'> = {
            customer_name: cashSaleData.customer_name!,
            item_service: "Balance from Cash Sale",
            details: creditDetails,
            amount: creditAmount,
            date: cashSaleData.date.toISOString(),
            due_date: cashSaleData.due_date_for_balance.toISOString(),
            status: 'Pending',
          };
          const { error: insertCreditError } = await supabase.from('credit_sales').insert([{ ...creditToSave, id: `cred_${Date.now()}` }]);
          error = insertCreditError;
          if (!error) {
            toast({ title: `Credit Sale Created`, description: `Outstanding balance of $${creditAmount.toFixed(2)} recorded for ${cashSaleData.customer_name}.`, variant: "default" });
            resetAllForms();
          }

        } else { // Normal cash sale or exact/over payment
          const saleToSave: Omit<CashSale, 'id' | 'created_at' | 'updated_at'> = {
            date: cashSaleData.date.toISOString(),
            item_service: cashSaleData.item_service!,
            details: cashSaleData.details,
            amount: cashSaleData.amount!,
            // customer_name can be optionally stored for cash sales if needed, currently not in CashSale interface for table
          };
          const { error: insertCashError } = await supabase.from('cash_sales').insert([{ ...saleToSave, id: `cash_${Date.now()}` }]);
          error = insertCashError;
          if (!error) {
            toast({ title: "Cash Sale Recorded", variant: "default" });
            resetAllForms();
          }
        }
      } else if (selectedType === 'credit_sale') {
        if (!creditSaleData.customer_name || !creditSaleData.item_service || !creditSaleData.amount || !creditSaleData.date || !creditSaleData.status) {
           toast({ title: "Missing fields", description: "Please fill all required credit sale fields.", variant: "destructive" });
           setIsSubmitting(false); return;
        }
        const saleToSave: Omit<CreditSale, 'id' | 'created_at' | 'updated_at'> = {
            customer_name: creditSaleData.customer_name!,
            item_service: creditSaleData.item_service!,
            details: creditSaleData.details,
            amount: creditSaleData.amount!,
            date: creditSaleData.date!.toISOString(),
            due_date: creditSaleData.due_date ? creditSaleData.due_date.toISOString() : undefined,
            status: creditSaleData.status! as CreditStatus,
        };
        const { error: insertError } = await supabase.from('credit_sales').insert([{ ...saleToSave, id: `cred_${Date.now()}` }]);
        error = insertError;
        if (!error) {
            toast({ title: "Credit Sale Recorded", variant: "default" });
            resetAllForms();
        }
      } else if (selectedType === 'deposit') {
         if (!depositData.date || !depositData.amount || !depositData.currency || !depositData.bank || !depositData.reference_no || !depositData.deposited_by) {
            toast({ title: "Missing fields", description: "Please fill all required deposit fields.", variant: "destructive" });
            setIsSubmitting(false); return;
        }
        const depositToSave: Omit<Deposit, 'id' | 'created_at' | 'updated_at'> = {
            date: depositData.date!.toISOString(),
            amount: depositData.amount!,
            currency: depositData.currency! as Currency,
            bank: depositData.bank!,
            reference_no: depositData.reference_no!,
            deposited_by: depositData.deposited_by!,
            description: depositData.description,
        };
        const { error: insertError } = await supabase.from('deposits').insert([{ ...depositToSave, id: `dep_${Date.now()}` }]);
        error = insertError;
        if (!error) {
            toast({ title: "Bank Deposit Recorded", variant: "default" });
            resetAllForms();
        }
      }
    } catch (e: any) {
        error = e;
    }

    if (error) {
      toast({ title: `Error recording transaction`, description: error.message, variant: "destructive" });
    }
    setIsSubmitting(false);
  };

  const renderForm = () => {
    switch (selectedType) {
      case 'cash_sale':
        return (
          <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }} className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="cash_date">Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant={"outline"} className={cn("w-full justify-start text-left font-normal", !cashSaleData.date && "text-muted-foreground")} disabled={isSubmitting}>
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {cashSaleData.date ? format(cashSaleData.date, "PPP") : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={cashSaleData.date} onSelect={(d) => handleDateChange('cash', 'date', d)} initialFocus /></PopoverContent>
              </Popover>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="cash_item_service">Item/Service Sold</Label>
              <Input id="cash_item_service" name="item_service" value={cashSaleData.item_service || ''} onChange={(e) => handleInputChange('cash', e)} required disabled={isSubmitting}/>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="cash_details">Details (Optional)</Label>
              <Textarea id="cash_details" name="details" value={cashSaleData.details || ''} onChange={(e) => handleInputChange('cash', e)} disabled={isSubmitting}/>
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                    <Label htmlFor="cash_amount">Amount</Label>
                    <Input id="cash_amount" name="amount" type="number" value={cashSaleData.amount || ''} onChange={(e) => handleInputChange('cash', e)} required disabled={isSubmitting} step="0.01"/>
                </div>
                <div className="grid gap-2">
                    <Label htmlFor="cash_amount_tendered">Amount Tendered</Label>
                    <Input id="cash_amount_tendered" name="amount_tendered" type="number" value={cashSaleData.amount_tendered === undefined ? '' : cashSaleData.amount_tendered} onChange={(e) => handleInputChange('cash', e)} disabled={isSubmitting} step="0.01"/>
                </div>
            </div>

            {isShortfall && (
              <>
                <div className="grid gap-2 p-3 border border-destructive rounded-md bg-destructive/10">
                   <p className="text-sm font-medium text-destructive">Shortfall Detected. Please provide customer details and due date for the balance.</p>
                    <Label htmlFor="cash_customer_name_shortfall">Customer Name (for credit)</Label>
                    <Select value={cashSaleData.customer_name || ''} onValueChange={(value) => handleSelectChange('cash', 'customer_name', value)} disabled={isSubmitting || isLoading}>
                        <SelectTrigger id="cash_customer_name_shortfall">
                            <SelectValue placeholder={isLoading ? "Loading customers..." : "Select customer"} />
                        </SelectTrigger>
                        <SelectContent>
                            {customersList.map(customer => <SelectItem key={customer.id} value={customer.name}>{customer.name}</SelectItem>)}
                            {customersList.length === 0 && <SelectItem value="" disabled>No customers found</SelectItem>}
                        </SelectContent>
                    </Select>
                </div>
                <div className="grid gap-2">
                    <Label htmlFor="due_date_for_balance">Due Date for Balance</Label>
                    <Popover>
                        <PopoverTrigger asChild>
                        <Button variant={"outline"} className={cn("w-full justify-start text-left font-normal", !cashSaleData.due_date_for_balance && "text-muted-foreground")} disabled={isSubmitting}>
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {cashSaleData.due_date_for_balance ? format(cashSaleData.due_date_for_balance, "PPP") : <span>Pick due date</span>}
                        </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={cashSaleData.due_date_for_balance} onSelect={(d) => handleDateChange('cash', 'due_date_for_balance', d)} /></PopoverContent>
                    </Popover>
                </div>
              </>
            )}

            {changeDue !== null && changeDue >= 0 && !isShortfall && (
              <p className="text-sm font-medium text-green-600">Change Due: ${(changeDue).toFixed(2)}</p>
            )}
             {changeDue !== null && changeDue < 0 && !isShortfall && (
              <p className="text-sm font-medium text-destructive">Amount Tendered is less than Sale Amount. Consider selecting customer for credit.</p>
            )}

            <Button type="submit" disabled={isSubmitting || isLoading} className="w-full">
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} 
              {isShortfall ? "Record Balance as Credit" : "Record Cash Sale"}
            </Button>
          </form>
        );
      case 'credit_sale':
        return (
          <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }} className="grid gap-4">
             <div className="grid gap-2">
              <Label htmlFor="credit_customer_name">Customer Name</Label>
              <Select value={creditSaleData.customer_name || ''} onValueChange={(value) => handleSelectChange('credit', 'customer_name', value)} disabled={isSubmitting || isLoading}>
                <SelectTrigger id="credit_customer_name">
                    <SelectValue placeholder={isLoading ? "Loading customers..." : "Select customer"} />
                </SelectTrigger>
                <SelectContent>
                    {customersList.map(customer => <SelectItem key={customer.id} value={customer.name}>{customer.name}</SelectItem>)}
                    {customersList.length === 0 && <SelectItem value="" disabled>No customers found</SelectItem>}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="credit_item_service">Item/Service Sold</Label>
              <Input id="credit_item_service" name="item_service" value={creditSaleData.item_service || ''} onChange={(e) => handleInputChange('credit', e)} required disabled={isSubmitting}/>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="credit_details">Details (Optional)</Label>
              <Textarea id="credit_details" name="details" value={creditSaleData.details || ''} onChange={(e) => handleInputChange('credit', e)} disabled={isSubmitting}/>
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                    <Label htmlFor="credit_amount">Amount</Label>
                    <Input id="credit_amount" name="amount" type="number" value={creditSaleData.amount || ''} onChange={(e) => handleInputChange('credit', e)} required disabled={isSubmitting} step="0.01"/>
                </div>
                <div className="grid gap-2">
                    <Label htmlFor="credit_status">Status</Label>
                    <Select value={creditSaleData.status || 'Pending'} onValueChange={(value) => handleSelectChange('credit', 'status', value as CreditStatus)} disabled={isSubmitting}>
                        <SelectTrigger><SelectValue placeholder="Select status" /></SelectTrigger>
                        <SelectContent>
                        <SelectItem value="Pending">Pending</SelectItem>
                        <SelectItem value="Paid">Paid</SelectItem>
                        <SelectItem value="Overdue">Overdue</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="credit_date">Transaction Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant={"outline"} className={cn("w-full justify-start text-left font-normal", !creditSaleData.date && "text-muted-foreground")} disabled={isSubmitting}>
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {creditSaleData.date ? format(creditSaleData.date, "PPP") : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={creditSaleData.date} onSelect={(d) => handleDateChange('credit','date',d)} initialFocus /></PopoverContent>
                </Popover>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="credit_due_date">Due Date (Optional)</Label>
                 <Popover>
                  <PopoverTrigger asChild>
                    <Button variant={"outline"} className={cn("w-full justify-start text-left font-normal", !creditSaleData.due_date && "text-muted-foreground")} disabled={isSubmitting}>
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {creditSaleData.due_date ? format(creditSaleData.due_date, "PPP") : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={creditSaleData.due_date} onSelect={(d) => handleDateChange('credit','due_date',d)} /></PopoverContent>
                </Popover>
              </div>
            </div>
            <Button type="submit" disabled={isSubmitting || isLoading} className="w-full">
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Record Credit Sale
            </Button>
          </form>
        );
      case 'deposit':
        return (
          <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }} className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="deposit_date">Date</Label>
               <Popover>
                <PopoverTrigger asChild>
                  <Button variant={"outline"} className={cn("w-full justify-start text-left font-normal", !depositData.date && "text-muted-foreground")} disabled={isSubmitting}>
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {depositData.date ? format(depositData.date, "PPP") : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={depositData.date} onSelect={(d) => handleDateChange('deposit','date',d)} initialFocus /></PopoverContent>
              </Popover>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="deposit_amount">Amount</Label>
                <Input id="deposit_amount" name="amount" type="number" value={depositData.amount || ''} onChange={(e) => handleInputChange('deposit', e)} required disabled={isSubmitting} step="0.01"/>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="deposit_currency">Currency</Label>
                <Select value={depositData.currency || 'USD'} onValueChange={(value) => handleSelectChange('deposit', 'currency', value as Currency)} disabled={isSubmitting}>
                  <SelectTrigger><SelectValue placeholder="Select currency" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="USD">USD</SelectItem>
                    <SelectItem value="SSP">SSP</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="deposit_bank">Bank</Label>
              <Select value={depositData.bank || ''} onValueChange={(value) => handleSelectChange('deposit', 'bank', value)} disabled={isSubmitting || isLoading}>
                <SelectTrigger>
                  <SelectValue placeholder={isLoading ? "Loading banks..." : "Select bank"} />
                </SelectTrigger>
                <SelectContent>
                  {banksList.map(bank => <SelectItem key={bank.id} value={bank.name}>{bank.name} ({bank.currency})</SelectItem>)}
                  {banksList.length === 0 && <SelectItem value="" disabled>No banks available</SelectItem>}
                </SelectContent>
              </Select>
            </div>
             <div className="grid gap-2">
              <Label htmlFor="deposit_reference_no">Reference No.</Label>
              <Input id="deposit_reference_no" name="reference_no" value={depositData.reference_no || ''} onChange={(e) => handleInputChange('deposit', e)} required disabled={isSubmitting}/>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="deposit_deposited_by">Deposited By (Customer)</Label>
               <Select value={depositData.deposited_by || ''} onValueChange={(value) => handleSelectChange('deposit', 'deposited_by', value)} disabled={isSubmitting || isLoading}>
                <SelectTrigger>
                  <SelectValue placeholder={isLoading ? "Loading customers..." : "Select customer"} />
                </SelectTrigger>
                <SelectContent>
                  {customersList.map(customer => <SelectItem key={customer.id} value={customer.name}>{customer.name}</SelectItem>)}
                  {customersList.length === 0 && <SelectItem value="" disabled>No customers available</SelectItem>}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="deposit_description">Description (Optional)</Label>
              <Textarea id="deposit_description" name="description" value={depositData.description || ''} onChange={(e) => handleInputChange('deposit', e)} disabled={isSubmitting}/>
            </div>
            <Button type="submit" disabled={isSubmitting || isLoading} className="w-full">
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Record Deposit
            </Button>
          </form>
        );
      default:
        return <p className="text-muted-foreground text-center py-8">Please select a transaction type to begin.</p>;
    }
  };

  return (
    <>
      <PageTitle title="Record Transaction" subtitle="Log cash sales, credit sales (invoices), or bank deposits." icon={ListChecks} />
      <Card className="shadow-xl max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="font-headline text-2xl">New Transaction</CardTitle>
          <CardDescription className="font-body">Select the type of transaction and fill in the details below.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6">
            <div className="grid gap-2">
              <Label htmlFor="transaction_type" className="font-body text-base">Transaction Type</Label>
              <Select onValueChange={handleTypeChange} value={selectedType}>
                <SelectTrigger id="transaction_type" className="h-12 text-base">
                  <SelectValue placeholder="Select transaction type..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash_sale" className="text-base py-2"><DollarSign className="inline-block mr-2 h-5 w-5 text-green-600"/>Cash Sale</SelectItem>
                  <SelectItem value="credit_sale" className="text-base py-2"><CreditCard className="inline-block mr-2 h-5 w-5 text-blue-600"/>Credit Sale (Invoice)</SelectItem>
                  <SelectItem value="deposit" className="text-base py-2"><LandmarkIcon className="inline-block mr-2 h-5 w-5 text-purple-600"/>Bank Deposit</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {selectedType && <Separator className="my-2" />}
            
            {isLoading && selectedType && (
                 <div className="flex justify-center items-center h-24">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <p className="ml-2 font-body">Loading form data...</p>
                </div>
            )}

            {!isLoading && renderForm()}
          </div>
        </CardContent>
      </Card>
    </>
  );
}


    