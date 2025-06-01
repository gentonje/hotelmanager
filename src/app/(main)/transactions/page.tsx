
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
import { CalendarIcon, ListChecks, Loader2, DollarSign, CreditCard, LandmarkIcon, PlusCircle, ShoppingCart, Receipt } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useRouter, useSearchParams, usePathname } from 'next/navigation';

import type { Bank } from '@/app/(main)/banks/page';
import type { Customer } from '@/app/(main)/customers/page';
import type { Vendor } from '@/app/(main)/vendors/page';
import type { Deposit } from '@/app/(main)/deposits/page';
import type { Expense, ExpenseCategory as ExistingExpenseCategory } from '@/app/(main)/expenses/page';

type TransactionFocus = 'sales' | 'purchases' | '';
type SalesTransactionType = 'cash_sale' | 'credit_sale' | 'deposit' | '';
type PurchaseTransactionType = 'cash_purchase' | 'credit_purchase' | '';
type Currency = 'USD' | 'SSP';
type CreditStatus = 'Pending' | 'Paid' | 'Overdue' | 'Partially Paid';
export type RevenueCategory = 'Rooms' | 'Main Bar' | 'Restaurant' | 'Conference Halls' | 'Internet Services' | 'Swimming Pool' | 'Other';

const revenueCategories: RevenueCategory[] = ['Rooms', 'Main Bar', 'Restaurant', 'Conference Halls', 'Internet Services', 'Swimming Pool', 'Other'];
const expenseCategoriesList: ExistingExpenseCategory[] = ['Staff Salaries', 'Taxes', 'Utilities', 'Supplies', 'Maintenance', 'Marketing', 'Cost of Goods Sold - Bar', 'Cost of Goods Sold - Restaurant', 'Operating Supplies', 'Other'];


interface TransactionCreditSale {
  id: string;
  customer_name: string;
  item_service: string;
  details?: string;
  original_amount: number;
  paid_amount: number;
  balance_due: number;
  currency: Currency;
  date: string; 
  due_date?: string; 
  status: CreditStatus;
  revenue_category?: RevenueCategory;
}

export interface CashSale {
  id: string;
  date: string; 
  item_service: string;
  details?: string;
  amount: number;
  currency: Currency;
  customer_name?: string;
  revenue_category?: RevenueCategory;
  linked_credit_sale_id?: string | null;
}

// Purchase Specific Interfaces
interface CreditPurchase {
  id: string;
  vendor_id?: string;
  item_service_purchased: string;
  details?: string;
  original_amount: number;
  paid_amount: number;
  balance_due: number;
  currency: Currency;
  date_of_purchase: string; // ISO string
  due_date?: string; // ISO string
  status: CreditStatus;
  expense_category?: ExistingExpenseCategory;
}


// Form states
interface FormCashSale extends Omit<CashSale, 'id' | 'date' | 'currency' | 'linked_credit_sale_id'> {
  date: Date;
  currency: Currency;
  amount_tendered?: number;
  due_date_for_balance?: Date; 
}

interface FormCreditSaleState extends Omit<TransactionCreditSale, 'id' | 'date' | 'due_date' | 'paid_amount' | 'balance_due' | 'currency'> {
  date: Date;
  currency: Currency;
  due_date?: Date;
}

interface FormDepositState extends Omit<Deposit, 'id' | 'date'> {
  date: Date;
}

interface FormCashPurchaseState {
    date: Date;
    item_service_purchased: string;
    details?: string;
    amount: number;
    currency: Currency;
    vendor_id?: string;
    expense_category?: ExistingExpenseCategory;
}

interface FormCreditPurchaseState extends Omit<CreditPurchase, 'id' | 'date_of_purchase' | 'due_date' | 'paid_amount' | 'balance_due' | 'currency' | 'vendor_id'> {
    date_of_purchase: Date;
    currency: Currency;
    due_date?: Date;
    vendor_id: string;
}


export default function TransactionsPage() {
  const [selectedFocus, setSelectedFocus] = useState<TransactionFocus>('sales');
  const [selectedSalesType, setSelectedSalesType] = useState<SalesTransactionType>('');
  const [selectedPurchaseType, setSelectedPurchaseType] = useState<PurchaseTransactionType>('');

  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  const [customersList, setCustomersList] = useState<Pick<Customer, 'id' | 'name'>[]>([]);
  const [banksList, setBanksList] = useState<Pick<Bank, 'id' | 'name' | 'currency'>[]>([]);
  const [vendorsList, setVendorsList] = useState<Pick<Vendor, 'id' | 'name'>[]>([]);


  // Sales Form states
  const [cashSaleData, setCashSaleData] = useState<Partial<FormCashSale>>({ date: new Date(), amount: 0, currency: 'USD' });
  const [creditSaleData, setCreditSaleData] = useState<Partial<FormCreditSaleState>>({ date: new Date(), status: 'Pending', original_amount: 0, currency: 'USD' });
  const [depositData, setDepositData] = useState<Partial<FormDepositState>>({ date: new Date(), currency: 'USD', amount: 0 });

  // Purchase Form states
  const [cashPurchaseData, setCashPurchaseData] = useState<Partial<FormCashPurchaseState>>({ date: new Date(), amount: 0, currency: 'USD' });
  const [creditPurchaseData, setCreditPurchaseData] = useState<Partial<FormCreditPurchaseState>>({ date_of_purchase: new Date(), original_amount: 0, currency: 'USD', status: 'Pending' });
  
  const fetchDropdownData = async () => {
    setIsLoading(true);
    try {
      const { data: banksData, error: banksError } = await supabase.from('banks').select('id, name, currency');
      if (banksError) throw banksError;
      setBanksList(banksData || []);

      const { data: customersData, error: customersError } = await supabase.from('customers').select('id, name');
      if (customersError) throw customersError;
      setCustomersList(customersData || []);

      const { data: vendorsData, error: vendorsError } = await supabase.from('vendors').select('id, name');
      if (vendorsError) throw vendorsError;
      setVendorsList(vendorsData || []);

    } catch (error: any) {
       toast({ title: "Error fetching form data", description: error?.message || "Could not load auxiliary lists.", variant: "destructive" });
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchDropdownData();
  }, []);

 useEffect(() => {
    const newName = searchParams.get('newEntityName'); // Generic name
    const entityOrigin = searchParams.get('newEntityOrigin'); 

    if (newName && (customersList.length > 0 || vendorsList.length > 0)) {
      if (entityOrigin === 'transactionShortfall' && customersList.find(c=>c.name === newName)) {
        setCashSaleData(prev => ({ ...prev, customer_name: newName }));
      } else if (entityOrigin === 'transactionCreditSale' && customersList.find(c=>c.name === newName)) {
        setCreditSaleData(prev => ({ ...prev, customer_name: newName }));
      } else if (entityOrigin === 'transactionDeposit' && customersList.find(c=>c.name === newName)) {
        setDepositData(prev => ({ ...prev, deposited_by: newName }));
      } else if (entityOrigin === 'transactionCashPurchaseVendor' && vendorsList.find(v=>v.name === newName)) {
        setCashPurchaseData(prev => ({...prev, vendor_id: vendorsList.find(v=>v.name === newName)?.id}));
      } else if (entityOrigin === 'transactionCreditPurchaseVendor' && vendorsList.find(v=>v.name === newName)) {
        setCreditPurchaseData(prev => ({...prev, vendor_id: vendorsList.find(v=>v.name === newName)?.id}));
      }
      
      const current = new URL(window.location.toString());
      current.searchParams.delete('newEntityName');
      current.searchParams.delete('newEntityOrigin');
      router.replace(current.pathname + current.search, { shallow: true });
    }
  }, [searchParams, customersList, vendorsList, router, pathname]);


  const resetAllForms = () => {
    setCashSaleData({ date: new Date(), amount: 0, currency: 'USD', item_service: '', details: '', customer_name: '', amount_tendered: undefined, due_date_for_balance: undefined, revenue_category: undefined });
    setCreditSaleData({ date: new Date(), status: 'Pending', original_amount: 0, currency: 'USD', customer_name: '', item_service: '', details: '', revenue_category: undefined });
    setDepositData({ date: new Date(), currency: 'USD', amount: 0, bank: '', reference_no: '', deposited_by: '', description: '' });
    setCashPurchaseData({ date: new Date(), amount: 0, currency: 'USD', item_service_purchased: '', details: '', vendor_id: undefined, expense_category: undefined });
    setCreditPurchaseData({ date_of_purchase: new Date(), original_amount: 0, currency: 'USD', status: 'Pending', vendor_id: '', item_service_purchased: '', details: '', expense_category: undefined });
  };
  
  const handleFocusChange = (value: string) => {
    setSelectedFocus(value as TransactionFocus);
    setSelectedSalesType('');
    setSelectedPurchaseType('');
    resetAllForms();
  };

  const handleSalesTypeChange = (value: string) => {
    setSelectedSalesType(value as SalesTransactionType);
    resetAllForms();
  }

  const handlePurchaseTypeChange = (value: string) => {
    setSelectedPurchaseType(value as PurchaseTransactionType);
    resetAllForms();
  }

  const handleInputChange = (form: 'cash_sale' | 'credit_sale' | 'deposit' | 'cash_purchase' | 'credit_purchase', e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    const val = (name === 'amount' || name === 'amount_tendered' || name === 'original_amount') && value !== '' ? parseFloat(value) : value;
    
    if (form === 'cash_sale') setCashSaleData(prev => ({ ...prev, [name]: val }));
    if (form === 'credit_sale') setCreditSaleData(prev => ({ ...prev, [name]: val }));
    if (form === 'deposit') setDepositData(prev => ({ ...prev, [name]: val }));
    if (form === 'cash_purchase') setCashPurchaseData(prev => ({ ...prev, [name]: val }));
    if (form === 'credit_purchase') setCreditPurchaseData(prev => ({ ...prev, [name]: val }));
  };

  const handleDateChange = (form: 'cash_sale' | 'credit_sale' | 'deposit' | 'cash_purchase' | 'credit_purchase', field: string, dateVal?: Date) => {
    if (dateVal !== undefined) { 
      if (form === 'cash_sale') setCashSaleData(prev => ({ ...prev, [field]: dateVal }));
      if (form === 'credit_sale') setCreditSaleData(prev => ({ ...prev, [field]: dateVal }));
      if (form === 'deposit') setDepositData(prev => ({ ...prev, [field]: dateVal }));
      if (form === 'cash_purchase') setCashPurchaseData(prev => ({ ...prev, [field]: dateVal }));
      if (form === 'credit_purchase') setCreditPurchaseData(prev => ({ ...prev, [field]: dateVal }));
    }
  };
  
  const handleSelectChange = (form: 'cash_sale' | 'credit_sale' | 'deposit' | 'cash_purchase' | 'credit_purchase', field: string, value: string) => {
    const actualValue = value === "_NONE_" || value.startsWith("_SELECT_") ? '' : value;

    if (form === 'cash_sale') setCashSaleData(prev => ({ ...prev, [field]: field === 'revenue_category' ? actualValue as RevenueCategory : actualValue }));
    if (form === 'credit_sale') setCreditSaleData(prev => ({ ...prev, [field]: field === 'revenue_category' ? actualValue as RevenueCategory : actualValue }));
    if (form === 'deposit') setDepositData(prev => ({ ...prev, [field]: actualValue }));
    if (form === 'cash_purchase') {
        if (field === 'vendor_id') {
             setCashPurchaseData(prev => ({ ...prev, vendor_id: vendorsList.find(v => v.name === actualValue)?.id || '' }));
        } else {
            setCashPurchaseData(prev => ({ ...prev, [field]: actualValue }));
        }
    }
    if (form === 'credit_purchase') {
        if (field === 'vendor_id') {
            setCreditPurchaseData(prev => ({ ...prev, vendor_id: vendorsList.find(v => v.name === actualValue)?.id || '' }));
        } else {
            setCreditPurchaseData(prev => ({ ...prev, [field]: actualValue }));
        }
    }
  };

  const changeDue = useMemo(() => {
    if (selectedFocus === 'sales' && selectedSalesType === 'cash_sale' && cashSaleData.amount_tendered !== undefined && cashSaleData.amount !== undefined) {
      return cashSaleData.amount_tendered - cashSaleData.amount;
    }
    return null;
  }, [selectedFocus, selectedSalesType, cashSaleData.amount_tendered, cashSaleData.amount]);

  const isShortfall = useMemo(() => {
    return selectedFocus === 'sales' && selectedSalesType === 'cash_sale' && cashSaleData.amount_tendered !== undefined && cashSaleData.amount !== undefined && cashSaleData.amount_tendered < cashSaleData.amount;
  }, [selectedFocus, selectedSalesType, cashSaleData.amount_tendered, cashSaleData.amount]);


  const handleSubmit = async () => {
    setIsSubmitting(true);
    let error = null;
    let successMessage = "Transaction Recorded";

    try {
      if (selectedFocus === 'sales') {
        if (selectedSalesType === 'cash_sale') {
          if (!cashSaleData.date || !cashSaleData.item_service || cashSaleData.amount === undefined || cashSaleData.amount <= 0 || !cashSaleData.currency || !cashSaleData.revenue_category) {
            toast({ title: "Missing fields", description: "Date, Item/Service, Revenue Category, Currency, and a valid Amount are required for cash sale.", variant: "destructive" });
            setIsSubmitting(false); return;
          }
          const actualAmountReceived = cashSaleData.amount_tendered !== undefined && cashSaleData.amount_tendered < cashSaleData.amount! ? cashSaleData.amount_tendered : cashSaleData.amount!;
          const cashRecordBase: Omit<CashSale, 'id' | 'created_at' | 'updated_at' | 'linked_credit_sale_id'> = {
            date: cashSaleData.date.toISOString(), item_service: cashSaleData.item_service!, details: cashSaleData.details, amount: actualAmountReceived, currency: cashSaleData.currency!, customer_name: cashSaleData.customer_name || undefined, revenue_category: cashSaleData.revenue_category,
          };

          let finalCashRecordToSave = { ...cashRecordBase, id: `cash_${Date.now()}`, linked_credit_sale_id: null as string | null };

          if (isShortfall) { 
            if (!cashSaleData.customer_name) { toast({ title: "Customer Name Required", description: "Please select a customer to record the outstanding balance as credit.", variant: "destructive" }); setIsSubmitting(false); return; }
            if (!cashSaleData.due_date_for_balance) { toast({ title: "Due Date Required", description: "Please provide a due date for the balance payment.", variant: "destructive" }); setIsSubmitting(false); return; }
            
            const shortfallAmount = cashSaleData.amount! - (cashSaleData.amount_tendered || 0);
            const creditDetails = `Original Item: ${cashSaleData.item_service}. Full Sale Amount: ${cashSaleData.currency} ${cashSaleData.amount}. Cash Tendered: ${cashSaleData.currency} ${cashSaleData.amount_tendered || 0}. Balance Due: ${cashSaleData.currency} ${shortfallAmount.toFixed(2)}. Notes: ${cashSaleData.details || ''}`;
            const creditSaleId = `cred_sf_${Date.now()}`;
            const creditToSave: Omit<TransactionCreditSale, 'id' | 'created_at' | 'updated_at'> & {id: string} = {
              id: creditSaleId,
              customer_name: cashSaleData.customer_name!, item_service: `Balance from Cash Sale: ${cashSaleData.item_service}`, details: creditDetails, original_amount: shortfallAmount, paid_amount: 0, balance_due: shortfallAmount, currency: cashSaleData.currency!, date: cashSaleData.date.toISOString(), due_date: cashSaleData.due_date_for_balance.toISOString(), status: 'Pending', revenue_category: cashSaleData.revenue_category,
            };

            const { error: insertCreditError } = await supabase.from('credit_sales').insert([creditToSave]);
            if (insertCreditError) { 
              toast({ title: `Error creating credit sale for shortfall`, description: insertCreditError.message, variant: "destructive" }); 
              setIsSubmitting(false); return; 
            }
            
            finalCashRecordToSave.id = `cash_ps_${Date.now()}`; // Use a different prefix for partial cash sales
            finalCashRecordToSave.linked_credit_sale_id = creditSaleId;
            successMessage = `Partial Cash Payment Recorded. Credit Sale Created for Balance of ${creditToSave.currency} ${shortfallAmount.toFixed(2)}.`;

          } else {
            successMessage = "Cash Sale Recorded";
          }
          
          const { error: insertCashError } = await supabase.from('cash_sales').insert([finalCashRecordToSave]);
          error = insertCashError;

        } else if (selectedSalesType === 'credit_sale') {
          if (!creditSaleData.customer_name || !creditSaleData.item_service || !creditSaleData.original_amount || !creditSaleData.date || !creditSaleData.status || !creditSaleData.currency || !creditSaleData.revenue_category) {
             toast({ title: "Missing fields", description: "Please fill all required credit sale fields.", variant: "destructive" }); setIsSubmitting(false); return;
          }
          const saleToSave: Omit<TransactionCreditSale, 'id' | 'created_at' | 'updated_at'> = {
              customer_name: creditSaleData.customer_name!, item_service: creditSaleData.item_service!, details: creditSaleData.details, original_amount: creditSaleData.original_amount!, paid_amount: 0, balance_due: creditSaleData.original_amount!, currency: creditSaleData.currency!, date: creditSaleData.date!.toISOString(), due_date: creditSaleData.due_date ? creditSaleData.due_date.toISOString() : undefined, status: creditSaleData.status! as CreditStatus, revenue_category: creditSaleData.revenue_category,
          };
          const { error: insertError } = await supabase.from('credit_sales').insert([{ ...saleToSave, id: `cred_${Date.now()}` }]);
          error = insertError;
          if (!error) successMessage = "Credit Sale Recorded";
        } else if (selectedSalesType === 'deposit') {
           if (!depositData.date || !depositData.amount || !depositData.currency || !depositData.bank || !depositData.reference_no || !depositData.deposited_by) {
              toast({ title: "Missing fields", description: "Please fill all required deposit fields.", variant: "destructive" }); setIsSubmitting(false); return;
          }
          const depositToSave: Omit<Deposit, 'id' | 'created_at' | 'updated_at'> = {
              date: depositData.date!.toISOString(), amount: depositData.amount!, currency: depositData.currency! as Currency, bank: depositData.bank!, reference_no: depositData.reference_no!, deposited_by: depositData.deposited_by!, description: depositData.description,
          };
          const { error: insertError } = await supabase.from('deposits').insert([{ ...depositToSave, id: `dep_${Date.now()}` }]);
          error = insertError;
          if (!error) successMessage = "Bank Deposit Recorded";
        }
      } else if (selectedFocus === 'purchases') {
        if (selectedPurchaseType === 'cash_purchase') {
            if(!cashPurchaseData.date || !cashPurchaseData.item_service_purchased || !cashPurchaseData.amount || cashPurchaseData.amount <=0 || !cashPurchaseData.currency || !cashPurchaseData.expense_category) {
                toast({title: "Missing Fields", description: "Date, Item/Service, Amount, Currency, and Expense Category are required for cash purchase.", variant: "destructive"});
                setIsSubmitting(false); return;
            }
            const expenseToSave: Omit<Expense, 'id' | 'created_at' | 'updated_at'> = {
                date: cashPurchaseData.date.toISOString(),
                category: cashPurchaseData.expense_category!,
                description: `Cash Purchase: ${cashPurchaseData.item_service_purchased}${cashPurchaseData.details ? ` - ${cashPurchaseData.details}` : ''}`,
                amount: cashPurchaseData.amount!,
                paid_to: cashPurchaseData.vendor_id ? vendorsList.find(v=>v.id === cashPurchaseData.vendor_id)?.name : undefined, 
                currency: cashPurchaseData.currency!,
                vendor_id: cashPurchaseData.vendor_id || undefined,
                is_cash_purchase: true,
            };
            const { error: insertError } = await supabase.from('expenses').insert([{...expenseToSave, id: `exp_cp_${Date.now()}`}]);
            error = insertError;
            if(!error) successMessage = "Cash Purchase Recorded as Expense";

        } else if (selectedPurchaseType === 'credit_purchase') {
            if(!creditPurchaseData.date_of_purchase || !creditPurchaseData.vendor_id || !creditPurchaseData.item_service_purchased || !creditPurchaseData.original_amount || creditPurchaseData.original_amount <=0 || !creditPurchaseData.currency || !creditPurchaseData.status || !creditPurchaseData.expense_category) {
                 toast({title: "Missing Fields", description: "Date, Vendor, Item/Service, Amount, Currency, Status, and Expense Category are required for credit purchase.", variant: "destructive"});
                setIsSubmitting(false); return;
            }
            const purchaseToSave : Omit<CreditPurchase, 'id' | 'created_at' | 'updated_at' | 'paid_amount' | 'balance_due'> & {paid_amount: number, balance_due: number} = {
                date_of_purchase: creditPurchaseData.date_of_purchase.toISOString(),
                vendor_id: creditPurchaseData.vendor_id!,
                item_service_purchased: creditPurchaseData.item_service_purchased!,
                details: creditPurchaseData.details,
                original_amount: creditPurchaseData.original_amount!,
                paid_amount: 0,
                balance_due: creditPurchaseData.original_amount!,
                currency: creditPurchaseData.currency!,
                due_date: creditPurchaseData.due_date ? creditPurchaseData.due_date.toISOString() : undefined,
                status: creditPurchaseData.status! as CreditStatus,
                expense_category: creditPurchaseData.expense_category
            };
            const {error: insertError} = await supabase.from('credit_purchases').insert([{...purchaseToSave, id: `cpurch_${Date.now()}`}]);
            error = insertError;
            if(!error) successMessage = "Credit Purchase Recorded";
        }
      }
    } catch (e: any) {
        error = e;
    }

    if (error) {
      toast({ title: `Error recording transaction`, description: error.message, variant: "destructive" });
    } else {
      toast({ title: successMessage, variant: "default" });
      resetAllForms();
    }
    setIsSubmitting(false);
  };


  const renderSalesForm = () => {
    switch (selectedSalesType) {
      case 'cash_sale':
        return (
          <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }} className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="cash_date">Date</Label>
              <Popover><PopoverTrigger asChild><Button variant={"outline"} className={cn("w-full justify-start text-left font-normal font-sans", !cashSaleData.date && "text-muted-foreground")} disabled={isSubmitting}><CalendarIcon className="mr-2 h-4 w-4" />{cashSaleData.date ? format(cashSaleData.date, "PPP") : <span>Pick a date</span>}</Button></PopoverTrigger><PopoverContent className="w-auto p-0"><Calendar mode="single" selected={cashSaleData.date} onSelect={(d) => handleDateChange('cash_sale', 'date', d)} initialFocus /></PopoverContent></Popover>
            </div>
             <div className="grid gap-2"><Label htmlFor="cash_revenue_category">Revenue Category</Label><Select value={cashSaleData.revenue_category || ''} onValueChange={(value) => handleSelectChange('cash_sale', 'revenue_category', value)} disabled={isSubmitting}><SelectTrigger id="cash_revenue_category"><SelectValue placeholder="Select revenue category" /></SelectTrigger><SelectContent>{revenueCategories.map(cat => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}</SelectContent></Select></div>
            <div className="grid gap-2"><Label htmlFor="cash_item_service">Item/Service Sold</Label><Input id="cash_item_service" name="item_service" value={cashSaleData.item_service || ''} onChange={(e) => handleInputChange('cash_sale', e)} required disabled={isSubmitting}/></div>
            <div className="grid gap-2"><Label htmlFor="cash_details">Details (Optional)</Label><Textarea id="cash_details" name="details" value={cashSaleData.details || ''} onChange={(e) => handleInputChange('cash_sale', e)} disabled={isSubmitting}/></div>
            <div className="grid grid-cols-3 gap-4">
                <div className="grid gap-2"><Label htmlFor="cash_amount">Total Sale Amount</Label><Input id="cash_amount" name="amount" type="number" value={cashSaleData.amount || ''} onChange={(e) => handleInputChange('cash_sale', e)} required disabled={isSubmitting} step="0.01"/></div>
                 <div className="grid gap-2"><Label htmlFor="cash_currency">Currency</Label><Select value={cashSaleData.currency || 'USD'} onValueChange={(value) => handleSelectChange('cash_sale', 'currency', value as Currency)} disabled={isSubmitting}><SelectTrigger><SelectValue placeholder="Select currency" /></SelectTrigger><SelectContent><SelectItem value="USD">USD</SelectItem><SelectItem value="SSP">SSP</SelectItem></SelectContent></Select></div>
                <div className="grid gap-2"><Label htmlFor="cash_amount_tendered">Amount Tendered</Label><Input id="cash_amount_tendered" name="amount_tendered" type="number" value={cashSaleData.amount_tendered === undefined ? '' : cashSaleData.amount_tendered} onChange={(e) => handleInputChange('cash_sale', e)} disabled={isSubmitting} step="0.01"/></div>
            </div>
            {isShortfall && (<><div className="grid gap-2 p-3 border border-destructive rounded-md bg-destructive/10"><div className="flex items-center justify-between"><Label htmlFor="cash_customer_name_shortfall" className="font-body text-destructive">Customer Name (for credit)</Label><Button type="button" variant="ghost" size="icon" className="h-7 w-7 text-primary hover:text-primary/80" onClick={() => router.push(`/customers?redirect=${pathname}&newEntityName&newEntityOrigin=transactionShortfall`)} disabled={isSubmitting || isLoading} title="Add New Customer"><PlusCircle className="h-5 w-5" /></Button></div><Select value={cashSaleData.customer_name || '_SELECT_CUST_SF_'} onValueChange={(value) => handleSelectChange('cash_sale', 'customer_name', value)} disabled={isSubmitting || isLoading}><SelectTrigger id="cash_customer_name_shortfall"><SelectValue placeholder={isLoading ? "Loading customers..." : "Select customer"} /></SelectTrigger><SelectContent>{isLoading && <SelectItem value="_LOADING_CUST_SF_" disabled>Loading customers...</SelectItem>}{!isLoading && customersList.length === 0 && <SelectItem value="_EMPTY_CUST_SF_" disabled>No customers found</SelectItem>}<SelectItem value="_SELECT_CUST_SF_" disabled>Select customer</SelectItem>{customersList.map(customer => <SelectItem key={customer.id} value={customer.name}>{customer.name}</SelectItem>)}</SelectContent></Select></div><div className="grid gap-2"><Label htmlFor="due_date_for_balance" className="font-body">Due Date for Balance</Label><Popover><PopoverTrigger asChild><Button variant={"outline"} className={cn("w-full justify-start text-left font-normal font-sans", !cashSaleData.due_date_for_balance && "text-muted-foreground")} disabled={isSubmitting}><CalendarIcon className="mr-2 h-4 w-4" />{cashSaleData.due_date_for_balance ? format(cashSaleData.due_date_for_balance, "PPP") : <span>Pick due date</span>}</Button></PopoverTrigger><PopoverContent className="w-auto p-0"><Calendar mode="single" selected={cashSaleData.due_date_for_balance} onSelect={(d) => handleDateChange('cash_sale', 'due_date_for_balance', d)} /></PopoverContent></Popover></div></>)}
            {!isShortfall && (<div className="grid gap-2"><div className="flex items-center justify-between"><Label htmlFor="cash_customer_name_optional" className="font-body">Customer Name (Optional)</Label><Button type="button" variant="ghost" size="icon" className="h-7 w-7 text-primary hover:text-primary/80" onClick={() => router.push(`/customers?redirect=${pathname}&newEntityName&newEntityOrigin=transactionShortfall`)} disabled={isSubmitting || isLoading} title="Add New Customer"><PlusCircle className="h-5 w-5" /></Button></div><Select value={cashSaleData.customer_name || '_SELECT_CUST_OPT_'} onValueChange={(value) => handleSelectChange('cash_sale', 'customer_name', value)} disabled={isSubmitting || isLoading}><SelectTrigger id="cash_customer_name_optional"><SelectValue placeholder={isLoading ? "Loading customers..." : "Select customer (Optional)"} /></SelectTrigger><SelectContent>{isLoading && <SelectItem value="_LOADING_CUST_OPT_" disabled>Loading customers...</SelectItem>}{!isLoading && customersList.length === 0 && <SelectItem value="_EMPTY_CUST_OPT_" disabled>No customers found</SelectItem>}<SelectItem value="_SELECT_CUST_OPT_">None (Optional)</SelectItem>{customersList.map(customer => <SelectItem key={customer.id} value={customer.name}>{customer.name}</SelectItem>)}</SelectContent></Select></div>)}
            {changeDue !== null && changeDue >= 0 && !isShortfall && (<p className="text-sm font-medium text-green-600 font-body">Change Due: {cashSaleData.currency} {(changeDue).toFixed(2)}</p>)}
            {changeDue !== null && changeDue < 0 && !isShortfall && (<p className="text-sm font-medium text-destructive font-body">Amount Tendered is less than Sale Amount. Select customer and set due date to record balance.</p>)}
            <Button type="submit" disabled={isSubmitting || isLoading} className="w-full">{isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} {isShortfall ? "Record Partial Payment & Credit Balance" : "Record Cash Sale"}</Button>
          </form>
        );
      case 'credit_sale':
        return (
          <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }} className="grid gap-4">
             <div className="grid gap-2"><div className="flex items-center justify-between"><Label htmlFor="credit_customer_name" className="font-body">Customer Name</Label><Button type="button" variant="ghost" size="icon" className="h-7 w-7 text-primary hover:text-primary/80" onClick={() => router.push(`/customers?redirect=${pathname}&newEntityName&newEntityOrigin=transactionCreditSale`)} disabled={isSubmitting || isLoading} title="Add New Customer"><PlusCircle className="h-5 w-5" /></Button></div><Select value={creditSaleData.customer_name || '_SELECT_CUST_CREDIT_'} onValueChange={(value) => handleSelectChange('credit_sale', 'customer_name', value)} disabled={isSubmitting || isLoading}><SelectTrigger id="credit_customer_name"><SelectValue placeholder={isLoading ? "Loading customers..." : "Select customer"} /></SelectTrigger><SelectContent>{isLoading && <SelectItem value="_LOADING_CUST_CREDIT_" disabled>Loading customers...</SelectItem>}{!isLoading && customersList.length === 0 && <SelectItem value="_EMPTY_CUST_CREDIT_" disabled>No customers found</SelectItem>}<SelectItem value="_SELECT_CUST_CREDIT_" disabled>Select customer</SelectItem>{customersList.map(customer => <SelectItem key={customer.id} value={customer.name}>{customer.name}</SelectItem>)}</SelectContent></Select></div>
            <div className="grid gap-2"><Label htmlFor="credit_revenue_category" className="font-body">Revenue Category</Label><Select value={creditSaleData.revenue_category || ''} onValueChange={(value) => handleSelectChange('credit_sale', 'revenue_category', value)} disabled={isSubmitting}><SelectTrigger id="credit_revenue_category"><SelectValue placeholder="Select revenue category" /></SelectTrigger><SelectContent>{revenueCategories.map(cat => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}</SelectContent></Select></div>
            <div className="grid gap-2"><Label htmlFor="credit_item_service" className="font-body">Item/Service Sold</Label><Input id="credit_item_service" name="item_service" value={creditSaleData.item_service || ''} onChange={(e) => handleInputChange('credit_sale', e)} required disabled={isSubmitting}/></div>
            <div className="grid gap-2"><Label htmlFor="credit_details" className="font-body">Details (Optional)</Label><Textarea id="credit_details" name="details" value={creditSaleData.details || ''} onChange={(e) => handleInputChange('credit_sale', e)} disabled={isSubmitting}/></div>
            <div className="grid grid-cols-3 gap-4"> <div className="grid gap-2"><Label htmlFor="credit_original_amount" className="font-body">Amount</Label><Input id="credit_original_amount" name="original_amount" type="number" value={creditSaleData.original_amount || ''} onChange={(e) => handleInputChange('credit_sale', e)} required disabled={isSubmitting} step="0.01"/></div><div className="grid gap-2"><Label htmlFor="credit_currency" className="font-body">Currency</Label><Select value={creditSaleData.currency || 'USD'} onValueChange={(value) => handleSelectChange('credit_sale', 'currency', value as Currency)} disabled={isSubmitting}><SelectTrigger><SelectValue placeholder="Select currency" /></SelectTrigger><SelectContent><SelectItem value="USD">USD</SelectItem><SelectItem value="SSP">SSP</SelectItem></SelectContent></Select></div><div className="grid gap-2"><Label htmlFor="credit_status" className="font-body">Status</Label><Select value={creditSaleData.status || 'Pending'} onValueChange={(value) => handleSelectChange('credit_sale', 'status', value as CreditStatus)} disabled={isSubmitting}><SelectTrigger><SelectValue placeholder="Select status" /></SelectTrigger><SelectContent><SelectItem value="Pending">Pending</SelectItem><SelectItem value="Paid" disabled>Paid (Set via Payment)</SelectItem><SelectItem value="Overdue">Overdue</SelectItem></SelectContent></Select></div></div>
            <div className="grid grid-cols-2 gap-4"><div className="grid gap-2"><Label htmlFor="credit_date" className="font-body">Transaction Date</Label><Popover><PopoverTrigger asChild><Button variant={"outline"} className={cn("w-full justify-start text-left font-normal font-sans", !creditSaleData.date && "text-muted-foreground")} disabled={isSubmitting}><CalendarIcon className="mr-2 h-4 w-4" />{creditSaleData.date ? format(creditSaleData.date, "PPP") : <span>Pick a date</span>}</Button></PopoverTrigger><PopoverContent className="w-auto p-0"><Calendar mode="single" selected={creditSaleData.date} onSelect={(d) => handleDateChange('credit_sale','date',d)} initialFocus /></PopoverContent></Popover></div><div className="grid gap-2"><Label htmlFor="credit_due_date" className="font-body">Due Date (Optional)</Label><Popover><PopoverTrigger asChild><Button variant={"outline"} className={cn("w-full justify-start text-left font-normal font-sans", !creditSaleData.due_date && "text-muted-foreground")} disabled={isSubmitting}><CalendarIcon className="mr-2 h-4 w-4" />{creditSaleData.due_date ? format(creditSaleData.due_date, "PPP") : <span>Pick a date</span>}</Button></PopoverTrigger><PopoverContent className="w-auto p-0"><Calendar mode="single" selected={creditSaleData.due_date} onSelect={(d) => handleDateChange('credit_sale','due_date',d)} /></PopoverContent></Popover></div></div>
            <Button type="submit" disabled={isSubmitting || isLoading} className="w-full">{isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Record Credit Sale</Button>
          </form>
        );
      case 'deposit':
        return (
          <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }} className="grid gap-4">
            <div className="grid gap-2"><Label htmlFor="deposit_date" className="font-body">Date</Label><Popover><PopoverTrigger asChild><Button variant={"outline"} className={cn("w-full justify-start text-left font-normal font-sans", !depositData.date && "text-muted-foreground")} disabled={isSubmitting}><CalendarIcon className="mr-2 h-4 w-4" />{depositData.date ? format(depositData.date, "PPP") : <span>Pick a date</span>}</Button></PopoverTrigger><PopoverContent className="w-auto p-0"><Calendar mode="single" selected={depositData.date} onSelect={(d) => handleDateChange('deposit','date',d)} initialFocus /></PopoverContent></Popover></div>
            <div className="grid grid-cols-2 gap-4"><div className="grid gap-2"><Label htmlFor="deposit_amount" className="font-body">Amount</Label><Input id="deposit_amount" name="amount" type="number" value={depositData.amount || ''} onChange={(e) => handleInputChange('deposit', e)} required disabled={isSubmitting} step="0.01"/></div><div className="grid gap-2"><Label htmlFor="deposit_currency" className="font-body">Currency</Label><Select value={depositData.currency || 'USD'} onValueChange={(value) => handleSelectChange('deposit', 'currency', value as Currency)} disabled={isSubmitting}><SelectTrigger><SelectValue placeholder="Select currency" /></SelectTrigger><SelectContent><SelectItem value="USD">USD</SelectItem><SelectItem value="SSP">SSP</SelectItem></SelectContent></Select></div></div>
            <div className="grid gap-2"><Label htmlFor="deposit_bank" className="font-body">Bank</Label><Select value={depositData.bank || '_SELECT_BANK_'} onValueChange={(value) => handleSelectChange('deposit', 'bank', value)} disabled={isSubmitting || isLoading}><SelectTrigger><SelectValue placeholder={isLoading ? "Loading banks..." : "Select bank"} /></SelectTrigger><SelectContent>{isLoading && <SelectItem value="_LOADING_BANKS_" disabled>Loading banks...</SelectItem>}{!isLoading && banksList.length === 0 && <SelectItem value="_EMPTY_BANKS_" disabled>No banks available</SelectItem>}<SelectItem value="_SELECT_BANK_" disabled>Select bank</SelectItem>{banksList.map(bank => <SelectItem key={bank.id} value={bank.name}>{bank.name} ({bank.currency})</SelectItem>)}</SelectContent></Select></div>
             <div className="grid gap-2"><Label htmlFor="deposit_reference_no" className="font-body">Reference No.</Label><Input id="deposit_reference_no" name="reference_no" value={depositData.reference_no || ''} onChange={(e) => handleInputChange('deposit', e)} required disabled={isSubmitting}/></div>
            <div className="grid gap-2"><div className="flex items-center justify-between"><Label htmlFor="deposit_deposited_by" className="font-body">Deposited By (Customer)</Label><Button type="button" variant="ghost" size="icon" className="h-7 w-7 text-primary hover:text-primary/80" onClick={() => router.push(`/customers?redirect=${pathname}&newEntityName&newEntityOrigin=transactionDeposit`)} disabled={isSubmitting || isLoading} title="Add New Customer"><PlusCircle className="h-5 w-5" /></Button></div><Select value={depositData.deposited_by || '_SELECT_CUST_DEP_'} onValueChange={(value) => handleSelectChange('deposit', 'deposited_by', value)} disabled={isSubmitting || isLoading}><SelectTrigger><SelectValue placeholder={isLoading ? "Loading customers..." : "Select customer"} /></SelectTrigger><SelectContent>{isLoading && <SelectItem value="_LOADING_CUST_DEP_" disabled>Loading customers...</SelectItem>}{!isLoading && customersList.length === 0 && <SelectItem value="_EMPTY_CUST_DEP_" disabled>No customers found</SelectItem>}<SelectItem value="_SELECT_CUST_DEP_" disabled>Select customer</SelectItem>{customersList.map(customer => <SelectItem key={customer.id} value={customer.name}>{customer.name}</SelectItem>)}</SelectContent></Select></div>
            <div className="grid gap-2"><Label htmlFor="deposit_description" className="font-body">Description (Optional)</Label><Textarea id="deposit_description" name="description" value={depositData.description || ''} onChange={(e) => handleInputChange('deposit', e)} disabled={isSubmitting}/></div>
            <Button type="submit" disabled={isSubmitting || isLoading} className="w-full">{isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Record Deposit</Button>
          </form>
        );
      default:
        return <p className="text-muted-foreground text-center py-8 font-body">Please select a sales transaction type to begin.</p>;
    }
  };

  const renderPurchaseForm = () => {
    switch(selectedPurchaseType) {
        case 'cash_purchase':
            return (
                <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }} className="grid gap-4">
                    <div className="grid gap-2">
                        <Label htmlFor="cp_date" className="font-body">Date</Label>
                        <Popover><PopoverTrigger asChild><Button variant={"outline"} className={cn("w-full justify-start text-left font-normal font-sans", !cashPurchaseData.date && "text-muted-foreground")} disabled={isSubmitting}><CalendarIcon className="mr-2 h-4 w-4" />{cashPurchaseData.date ? format(cashPurchaseData.date, "PPP") : <span>Pick a date</span>}</Button></PopoverTrigger><PopoverContent className="w-auto p-0"><Calendar mode="single" selected={cashPurchaseData.date} onSelect={(d) => handleDateChange('cash_purchase', 'date', d)} initialFocus /></PopoverContent></Popover>
                    </div>
                    <div className="grid gap-2"><Label htmlFor="cp_expense_category" className="font-body">Expense Category</Label><Select value={cashPurchaseData.expense_category || ''} onValueChange={(value) => handleSelectChange('cash_purchase', 'expense_category', value)} disabled={isSubmitting}><SelectTrigger id="cp_expense_category"><SelectValue placeholder="Select expense category" /></SelectTrigger><SelectContent>{expenseCategoriesList.map(cat => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}</SelectContent></Select></div>
                    <div className="grid gap-2"><Label htmlFor="cp_item_service" className="font-body">Item/Service Purchased</Label><Input id="cp_item_service" name="item_service_purchased" value={cashPurchaseData.item_service_purchased || ''} onChange={(e) => handleInputChange('cash_purchase', e)} required disabled={isSubmitting}/></div>
                    <div className="grid gap-2"><Label htmlFor="cp_details" className="font-body">Details (Optional)</Label><Textarea id="cp_details" name="details" value={cashPurchaseData.details || ''} onChange={(e) => handleInputChange('cash_purchase', e)} disabled={isSubmitting}/></div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2"><Label htmlFor="cp_amount" className="font-body">Amount</Label><Input id="cp_amount" name="amount" type="number" value={cashPurchaseData.amount || ''} onChange={(e) => handleInputChange('cash_purchase', e)} required disabled={isSubmitting} step="0.01"/></div>
                        <div className="grid gap-2"><Label htmlFor="cp_currency" className="font-body">Currency</Label><Select value={cashPurchaseData.currency || 'USD'} onValueChange={(value) => handleSelectChange('cash_purchase', 'currency', value as Currency)} disabled={isSubmitting}><SelectTrigger><SelectValue placeholder="Select currency" /></SelectTrigger><SelectContent><SelectItem value="USD">USD</SelectItem><SelectItem value="SSP">SSP</SelectItem></SelectContent></Select></div>
                    </div>
                    <div className="grid gap-2"><div className="flex items-center justify-between"><Label htmlFor="cp_vendor" className="font-body">Vendor (Optional)</Label><Button type="button" variant="ghost" size="icon" className="h-7 w-7 text-primary hover:text-primary/80" onClick={() => router.push(`/vendors?redirect=${pathname}&newEntityName&newEntityOrigin=transactionCashPurchaseVendor`)} disabled={isSubmitting || isLoading} title="Add New Vendor"><PlusCircle className="h-5 w-5" /></Button></div><Select value={vendorsList.find(v=>v.id === cashPurchaseData.vendor_id)?.name || '_SELECT_VENDOR_CP_OPT_'} onValueChange={(value) => handleSelectChange('cash_purchase', 'vendor_id', value)} disabled={isSubmitting || isLoading}><SelectTrigger id="cp_vendor"><SelectValue placeholder={isLoading ? "Loading vendors..." : "Select vendor (Optional)"} /></SelectTrigger><SelectContent>{isLoading && <SelectItem value="_LOADING_VENDOR_CP_OPT_" disabled>Loading vendors...</SelectItem>}{!isLoading && vendorsList.length === 0 && <SelectItem value="_EMPTY_VENDOR_CP_OPT_" disabled>No vendors found</SelectItem>}<SelectItem value="_SELECT_VENDOR_CP_OPT_">None (Optional)</SelectItem>{vendorsList.map(vendor => <SelectItem key={vendor.id} value={vendor.name}>{vendor.name}</SelectItem>)}</SelectContent></Select></div>
                    <Button type="submit" disabled={isSubmitting || isLoading} className="w-full">{isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Record Cash Purchase</Button>
                </form>
            );
        case 'credit_purchase':
            return (
                 <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }} className="grid gap-4">
                    <div className="grid gap-2"><div className="flex items-center justify-between"><Label htmlFor="crp_vendor" className="font-body">Vendor</Label><Button type="button" variant="ghost" size="icon" className="h-7 w-7 text-primary hover:text-primary/80" onClick={() => router.push(`/vendors?redirect=${pathname}&newEntityName&newEntityOrigin=transactionCreditPurchaseVendor`)} disabled={isSubmitting || isLoading} title="Add New Vendor"><PlusCircle className="h-5 w-5" /></Button></div><Select value={vendorsList.find(v=>v.id === creditPurchaseData.vendor_id)?.name || '_SELECT_VENDOR_CRP_'} onValueChange={(value) => handleSelectChange('credit_purchase', 'vendor_id', value)} disabled={isSubmitting || isLoading} required><SelectTrigger id="crp_vendor"><SelectValue placeholder={isLoading ? "Loading vendors..." : "Select vendor"} /></SelectTrigger><SelectContent>{isLoading && <SelectItem value="_LOADING_VENDOR_CRP_" disabled>Loading vendors...</SelectItem>}{!isLoading && vendorsList.length === 0 && <SelectItem value="_EMPTY_VENDOR_CRP_" disabled>No vendors found</SelectItem>}<SelectItem value="_SELECT_VENDOR_CRP_" disabled>Select vendor</SelectItem>{vendorsList.map(vendor => <SelectItem key={vendor.id} value={vendor.name}>{vendor.name}</SelectItem>)}</SelectContent></Select></div>
                    <div className="grid gap-2"><Label htmlFor="crp_expense_category" className="font-body">Expense Category</Label><Select value={creditPurchaseData.expense_category || ''} onValueChange={(value) => handleSelectChange('credit_purchase', 'expense_category', value)} disabled={isSubmitting}><SelectTrigger id="crp_expense_category"><SelectValue placeholder="Select expense category" /></SelectTrigger><SelectContent>{expenseCategoriesList.map(cat => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}</SelectContent></Select></div>
                    <div className="grid gap-2"><Label htmlFor="crp_item_service" className="font-body">Item/Service Purchased</Label><Input id="crp_item_service" name="item_service_purchased" value={creditPurchaseData.item_service_purchased || ''} onChange={(e) => handleInputChange('credit_purchase', e)} required disabled={isSubmitting}/></div>
                    <div className="grid gap-2"><Label htmlFor="crp_details" className="font-body">Details (Optional)</Label><Textarea id="crp_details" name="details" value={creditPurchaseData.details || ''} onChange={(e) => handleInputChange('credit_purchase', e)} disabled={isSubmitting}/></div>
                     <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2"><Label htmlFor="crp_original_amount" className="font-body">Amount</Label><Input id="crp_original_amount" name="original_amount" type="number" value={creditPurchaseData.original_amount || ''} onChange={(e) => handleInputChange('credit_purchase', e)} required disabled={isSubmitting} step="0.01"/></div>
                        <div className="grid gap-2"><Label htmlFor="crp_currency" className="font-body">Currency</Label><Select value={creditPurchaseData.currency || 'USD'} onValueChange={(value) => handleSelectChange('credit_purchase', 'currency', value as Currency)} disabled={isSubmitting}><SelectTrigger><SelectValue placeholder="Select currency" /></SelectTrigger><SelectContent><SelectItem value="USD">USD</SelectItem><SelectItem value="SSP">SSP</SelectItem></SelectContent></Select></div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2"><Label htmlFor="crp_date_of_purchase" className="font-body">Purchase Date</Label><Popover><PopoverTrigger asChild><Button variant={"outline"} className={cn("w-full justify-start text-left font-normal font-sans", !creditPurchaseData.date_of_purchase && "text-muted-foreground")} disabled={isSubmitting}><CalendarIcon className="mr-2 h-4 w-4" />{creditPurchaseData.date_of_purchase ? format(creditPurchaseData.date_of_purchase, "PPP") : <span>Pick a date</span>}</Button></PopoverTrigger><PopoverContent className="w-auto p-0"><Calendar mode="single" selected={creditPurchaseData.date_of_purchase} onSelect={(d) => handleDateChange('credit_purchase','date_of_purchase',d)} initialFocus /></PopoverContent></Popover></div>
                        <div className="grid gap-2"><Label htmlFor="crp_due_date" className="font-body">Due Date (Optional)</Label><Popover><PopoverTrigger asChild><Button variant={"outline"} className={cn("w-full justify-start text-left font-normal font-sans", !creditPurchaseData.due_date && "text-muted-foreground")} disabled={isSubmitting}><CalendarIcon className="mr-2 h-4 w-4" />{creditPurchaseData.due_date ? format(creditPurchaseData.due_date, "PPP") : <span>Pick a date</span>}</Button></PopoverTrigger><PopoverContent className="w-auto p-0"><Calendar mode="single" selected={creditPurchaseData.due_date} onSelect={(d) => handleDateChange('credit_purchase','due_date',d)} /></PopoverContent></Popover></div>
                    </div>
                    <Button type="submit" disabled={isSubmitting || isLoading} className="w-full">{isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Record Credit Purchase</Button>
                </form>
            );
        default:
             return <p className="text-muted-foreground text-center py-8 font-body">Please select a purchase transaction type to begin.</p>;
    }
  }


  return (
    <>
      <PageTitle title="Record Transaction" subtitle="Log sales, deposits, or purchases." icon={ListChecks} />
      <Card className="shadow-xl max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="font-headline text-2xl">New Transaction</CardTitle>
          <CardDescription className="font-body">Select the type of transaction and fill in the details below.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6">
            <div className="grid gap-2">
              <Label htmlFor="transaction_focus" className="font-body text-base">Transaction Focus</Label>
              <Select onValueChange={handleFocusChange} value={selectedFocus}>
                <SelectTrigger id="transaction_focus" className="h-12 text-base">
                  <SelectValue placeholder="Select focus..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sales" className="text-base py-2"><DollarSign className="inline-block mr-2 h-5 w-5 text-green-600"/>Sales &amp; Deposits</SelectItem>
                  <SelectItem value="purchases" className="text-base py-2"><ShoppingCart className="inline-block mr-2 h-5 w-5 text-blue-600"/>Purchases</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {selectedFocus && <Separator className="my-2" />}

            {selectedFocus === 'sales' && (
              <div className="grid gap-2">
                <Label htmlFor="sales_transaction_type" className="font-body text-base">Sales/Deposit Type</Label>
                <Select onValueChange={handleSalesTypeChange} value={selectedSalesType}>
                    <SelectTrigger id="sales_transaction_type" className="h-12 text-base">
                    <SelectValue placeholder="Select sales/deposit type..." />
                    </SelectTrigger>
                    <SelectContent>
                    <SelectItem value="cash_sale" className="text-base py-2"><DollarSign className="inline-block mr-2 h-5 w-5 text-green-600"/>Cash Sale</SelectItem>
                    <SelectItem value="credit_sale" className="text-base py-2"><CreditCard className="inline-block mr-2 h-5 w-5 text-blue-600"/>Credit Sale (Invoice)</SelectItem>
                    <SelectItem value="deposit" className="text-base py-2"><LandmarkIcon className="inline-block mr-2 h-5 w-5 text-purple-600"/>Bank Deposit</SelectItem>
                    </SelectContent>
                </Select>
              </div>
            )}

            {selectedFocus === 'purchases' && (
              <div className="grid gap-2">
                <Label htmlFor="purchase_transaction_type" className="font-body text-base">Purchase Type</Label>
                <Select onValueChange={handlePurchaseTypeChange} value={selectedPurchaseType}>
                    <SelectTrigger id="purchase_transaction_type" className="h-12 text-base">
                    <SelectValue placeholder="Select purchase type..." />
                    </SelectTrigger>
                    <SelectContent>
                    <SelectItem value="cash_purchase" className="text-base py-2"><Receipt className="inline-block mr-2 h-5 w-5 text-orange-600"/>Cash Purchase (Expense)</SelectItem>
                    <SelectItem value="credit_purchase" className="text-base py-2"><CreditCard className="inline-block mr-2 h-5 w-5 text-indigo-600"/>Credit Purchase (Payable)</SelectItem>
                    </SelectContent>
                </Select>
              </div>
            )}
            
            {((selectedFocus === 'sales' && selectedSalesType) || (selectedFocus === 'purchases' && selectedPurchaseType)) && <Separator className="my-2" />}
            
            {isLoading && ((selectedFocus === 'sales' && selectedSalesType) || (selectedFocus === 'purchases' && selectedPurchaseType)) && (
                 <div className="flex justify-center items-center h-24">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <p className="ml-2 font-body">Loading form data...</p>
                </div>
            )}

            {!isLoading && selectedFocus === 'sales' && selectedSalesType && renderSalesForm()}
            {!isLoading && selectedFocus === 'purchases' && selectedPurchaseType && renderPurchaseForm()}

          </div>
        </CardContent>
      </Card>
    </>
  );
}
