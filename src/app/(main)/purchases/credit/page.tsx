
"use client";

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useToast } from "@/hooks/use-toast";
import { PageTitle } from "@/components/shared/page-title";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CalendarIcon, ShoppingCart, PlusCircle, Edit2, Trash2, CheckCircle2, Loader2, Receipt } from "lucide-react";
import { format, parseISO } from "date-fns";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import type { Vendor } from '@/app/(main)/vendors/page';
import type { ExpenseCategory } from '@/app/(main)/expenses/page';

const expenseCategoriesList: ExpenseCategory[] = ['Staff Salaries', 'Taxes', 'Utilities', 'Supplies', 'Maintenance', 'Marketing', 'Cost of Goods Sold - Bar', 'Cost of Goods Sold - Restaurant', 'Operating Supplies', 'Other'];

type CreditPurchaseStatus = 'Pending' | 'Partially Paid' | 'Paid' | 'Overdue';
type Currency = 'USD' | 'SSP';
type PaymentMethod = 'cash_payment_voucher'; // For now, only cash payment from expenses

export interface CreditPurchase {
  id: string;
  vendor_id: string; // Foreign key to vendors table
  item_service_purchased: string;
  details?: string;
  original_amount: number;
  paid_amount: number;
  balance_due: number;
  currency: Currency;
  date_of_purchase: string; // ISO string
  due_date?: string; // ISO string
  status: CreditPurchaseStatus;
  expense_category?: ExpenseCategory;
  created_at?: string;
  updated_at?: string;
  vendors?: Pick<Vendor, 'name'>; // For joining vendor name
}

interface FormCreditPurchase extends Omit<CreditPurchase, 'id' | 'date_of_purchase' | 'due_date' | 'paid_amount' | 'balance_due' | 'currency' | 'vendors'> {
  date_of_purchase: Date;
  currency: Currency;
  due_date?: Date;
}

interface PaymentDetails {
  paymentDate: Date;
  paymentMethod: PaymentMethod;
  amountPaid: number;
  expenseDescription?: string;
}

export default function CreditPurchasesPage() {
  const [creditPurchases, setCreditPurchases] = useState<CreditPurchase[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPurchase, setEditingPurchase] = useState<CreditPurchase | null>(null);
  const [currentPurchase, setCurrentPurchase] = useState<Partial<FormCreditPurchase>>({ date_of_purchase: new Date(), status: 'Pending', currency: 'USD', original_amount: 0 });
  
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [purchaseForPayment, setPurchaseForPayment] = useState<CreditPurchase | null>(null);
  const [paymentDetails, setPaymentDetails] = useState<Partial<PaymentDetails>>({ paymentDate: new Date(), paymentMethod: 'cash_payment_voucher'});
  const [vendorsList, setVendorsList] = useState<Pick<Vendor, 'id' | 'name'>[]>([]);

  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmittingPayment, setIsSubmittingPayment] = useState(false);
  const { toast } = useToast();

  const fetchCreditPurchases = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('credit_purchases')
      .select('*, vendors (name)') // Join with vendors table
      .order('created_at', { ascending: false });

    if (error) {
      toast({ title: "Error fetching credit purchases", description: error.message, variant: "destructive" });
    } else {
      setCreditPurchases(data || []);
    }
    setIsLoading(false);
  };

  const fetchVendors = async () => {
    const { data, error } = await supabase.from('vendors').select('id, name');
    if (error) {
      toast({ title: "Error fetching vendors", description: error.message, variant: "destructive" });
    } else {
      setVendorsList(data || []);
    }
  };

  useEffect(() => {
    fetchCreditPurchases();
    fetchVendors();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setCurrentPurchase(prev => ({ ...prev, [name]: name === 'original_amount' ? parseFloat(value) || 0 : value }));
  };
  
  const handleDateChange = (field: 'date_of_purchase' | 'due_date', dateVal: Date | undefined) => {
    setCurrentPurchase(prev => ({ ...prev, [field]: dateVal }));
  };

  const handleStatusChange = (value: string) => {
    setCurrentPurchase(prev => ({ ...prev, status: value as CreditPurchaseStatus }));
  };

  const handleCurrencyChange = (value: string) => {
    setCurrentPurchase(prev => ({ ...prev, currency: value as Currency }));
  };
  
  const handleCategoryChange = (value: string) => {
    setCurrentPurchase(prev => ({ ...prev, expense_category: value as ExpenseCategory }));
  };

  const handleVendorChange = (vendorId: string) => {
     setCurrentPurchase(prev => ({ ...prev, vendor_id: vendorId }));
  }

  const resetForm = () => {
    setEditingPurchase(null);
    setCurrentPurchase({ date_of_purchase: new Date(), status: 'Pending', currency: 'USD', original_amount: 0, expense_category: undefined, vendor_id: undefined });
    setIsModalOpen(false);
  };

  const resetPaymentForm = () => {
    setPurchaseForPayment(null);
    setPaymentDetails({ paymentDate: new Date(), paymentMethod: 'cash_payment_voucher', amountPaid: 0 });
    setIsPaymentModalOpen(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPurchase.vendor_id || !currentPurchase.item_service_purchased || !currentPurchase.original_amount || !currentPurchase.date_of_purchase || !currentPurchase.currency || !currentPurchase.expense_category) {
      toast({ title: "Missing fields", description: "Please fill all required fields including Vendor, Item, Amount, Date, Currency, and Expense Category.", variant: "destructive" });
      return;
    }
    setIsSubmitting(true);

    const purchaseToSave: Omit<CreditPurchase, 'id' | 'created_at' | 'updated_at' | 'paid_amount' | 'balance_due' | 'vendors'> & {balance_due: number, paid_amount: number} = {
      vendor_id: currentPurchase.vendor_id!,
      item_service_purchased: currentPurchase.item_service_purchased!,
      details: currentPurchase.details,
      original_amount: currentPurchase.original_amount!,
      currency: currentPurchase.currency!,
      date_of_purchase: currentPurchase.date_of_purchase!.toISOString(),
      due_date: currentPurchase.due_date ? currentPurchase.due_date.toISOString() : undefined,
      status: currentPurchase.status || 'Pending',
      expense_category: currentPurchase.expense_category!,
      paid_amount: editingPurchase ? editingPurchase.paid_amount : 0, 
      balance_due: editingPurchase ? (currentPurchase.original_amount! - editingPurchase.paid_amount) : currentPurchase.original_amount!, 
    };

    let error = null;

    if (editingPurchase) {
      const { error: updateError } = await supabase
        .from('credit_purchases')
        .update(purchaseToSave)
        .eq('id', editingPurchase.id);
      error = updateError;
    } else {
      const purchaseWithId = {
        ...purchaseToSave,
        id: `cpurch_${Date.now()}`
      };
      const { error: insertError } = await supabase
        .from('credit_purchases')
        .insert([purchaseWithId]);
      error = insertError;
    }

    if (error) {
      toast({ title: `Error ${editingPurchase ? 'updating' : 'adding'} credit purchase`, description: error.message, variant: "destructive" });
    } else {
      toast({ title: `Credit Purchase ${editingPurchase ? 'updated' : 'added'} successfully`, variant: "default" });
      resetForm();
      fetchCreditPurchases();
    }
    setIsSubmitting(false);
  };

  const openEditModal = (purchase: CreditPurchase) => {
    setEditingPurchase(purchase);
    setCurrentPurchase({
      ...purchase,
      date_of_purchase: purchase.date_of_purchase ? parseISO(purchase.date_of_purchase) : new Date(),
      due_date: purchase.due_date ? parseISO(purchase.due_date) : undefined,
      currency: purchase.currency || 'USD',
      expense_category: purchase.expense_category,
    });
    setIsModalOpen(true);
  };

  const openNewPurchaseModal = () => {
    resetForm();
    setIsModalOpen(true);
  };
  
  const handleDeletePurchase = async (purchaseId: string) => {
    setIsSubmitting(true);
    const { error } = await supabase
      .from('credit_purchases')
      .delete()
      .eq('id', purchaseId);

    if (error) {
      toast({ title: "Error deleting credit purchase", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Credit purchase deleted successfully", variant: "default" });
      fetchCreditPurchases();
    }
    setIsSubmitting(false);
  };

  const openPaymentDialog = (purchase: CreditPurchase) => {
    setPurchaseForPayment(purchase);
    setPaymentDetails({ 
        paymentDate: new Date(), 
        paymentMethod: 'cash_payment_voucher', 
        amountPaid: purchase.balance_due,
        expenseDescription: `Payment for Credit Purchase: ${purchase.item_service_purchased} (ID: ${purchase.id}) from Vendor: ${purchase.vendors?.name || purchase.vendor_id}`
    });
    setIsPaymentModalOpen(true);
  };

  const handlePaymentDetailsChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setPaymentDetails(prev => ({ ...prev, [name]: name === 'amountPaid' ? parseFloat(value) || 0 : value }));
  };

  const handlePaymentDateChange = (dateVal: Date | undefined) => {
     if (dateVal) {
      setPaymentDetails(prev => ({ ...prev, paymentDate: dateVal }));
    }
  };

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!purchaseForPayment || !paymentDetails.paymentDate || !paymentDetails.amountPaid || paymentDetails.amountPaid <= 0) {
      toast({ title: "Invalid Payment Details", description: "Please enter a valid payment date and amount.", variant: "destructive" });
      return;
    }
    if (paymentDetails.amountPaid > purchaseForPayment.balance_due + 0.001) { 
      toast({ title: "Overpayment", description: `Amount paid (${paymentDetails.amountPaid}) cannot exceed balance due (${purchaseForPayment.balance_due}).`, variant: "destructive" });
      return;
    }
     if (!paymentDetails.expenseDescription) {
      toast({ title: "Missing Payment Description", description: "Please provide a description for the expense record.", variant: "destructive" });
      return;
    }


    setIsSubmittingPayment(true);

    try {
      const newPaidAmount = purchaseForPayment.paid_amount + paymentDetails.amountPaid;
      const newBalanceDue = purchaseForPayment.original_amount - newPaidAmount;
      const newStatus: CreditPurchaseStatus = newBalanceDue <= 0.001 ? 'Paid' : 'Partially Paid';

      const { error: updateStatusError } = await supabase
        .from('credit_purchases')
        .update({ 
            paid_amount: newPaidAmount,
            balance_due: newBalanceDue,
            status: newStatus, 
            updated_at: new Date().toISOString() 
        })
        .eq('id', purchaseForPayment.id);

      if (updateStatusError) throw updateStatusError;
      
      // Record as an Expense
      const expenseRecord = {
        id: `exp_cpp_${Date.now()}`, // Expense for Credit Purchase Payment
        date: paymentDetails.paymentDate.toISOString(),
        category: purchaseForPayment.expense_category || 'Other', 
        description: paymentDetails.expenseDescription,
        amount: paymentDetails.amountPaid,
        currency: purchaseForPayment.currency,
        paid_to: purchaseForPayment.vendors?.name || purchaseForPayment.vendor_id,
        vendor_id: purchaseForPayment.vendor_id,
        is_cash_purchase: true, // Assuming payment is made via cash/bank reducing cash on hand
        related_credit_purchase_payment_id: purchaseForPayment.id,
      };
      const { error: expenseError } = await supabase.from('expenses').insert([expenseRecord]);
      if (expenseError) throw expenseError;
      

      toast({ title: "Payment Recorded Successfully", description: `Payment of ${purchaseForPayment.currency} ${paymentDetails.amountPaid.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} for Vendor: ${purchaseForPayment.vendors?.name || purchaseForPayment.vendor_id} recorded.`, variant: "default" });
      resetPaymentForm();
      fetchCreditPurchases();

    } catch (error: any) {
      toast({ title: "Error recording payment", description: error.message, variant: "destructive" });
    } finally {
      setIsSubmittingPayment(false);
    }
  };


  const getStatusBadgeVariant = (status: CreditPurchaseStatus) => {
    switch (status) {
      case 'Paid': return 'default'; 
      case 'Pending': return 'secondary';
      case 'Partially Paid': return 'outline';
      case 'Overdue': return 'destructive';
      default: return 'outline';
    }
  };

  const formatCurrencyValue = (value: number | undefined) => {
      if (value === undefined || value === null) return '0.00';
      return value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  return (
    <>
      <PageTitle title="Credit Purchases" subtitle="Track and manage items/services purchased on credit from vendors." icon={ShoppingCart}>
        <Button onClick={openNewPurchaseModal} disabled={isLoading || isSubmitting || isSubmittingPayment}>
          <PlusCircle className="mr-2 h-4 w-4" /> Add New Credit Purchase
        </Button>
      </PageTitle>

      <Dialog open={isModalOpen} onOpenChange={(isOpen) => { if (!isSubmitting) setIsModalOpen(isOpen); }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-headline">{editingPurchase ? 'Edit Credit Purchase' : 'Add New Credit Purchase'}</DialogTitle>
            <DialogDescription className="font-body">
              {editingPurchase ? 'Update the details of this credit purchase.' : 'Enter details for a new item/service purchased on credit.'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-1 py-4">
            <div className="grid gap-2">
              <Label htmlFor="vendor_id_form" className="font-body">Vendor</Label>
              <Select value={currentPurchase.vendor_id || ''} onValueChange={handleVendorChange} disabled={isSubmitting || isLoading}>
                  <SelectTrigger id="vendor_id_form"><SelectValue placeholder={isLoading ? "Loading vendors..." : "Select vendor"} /></SelectTrigger>
                  <SelectContent>
                      {vendorsList.map(vendor => <SelectItem key={vendor.id} value={vendor.id}>{vendor.name}</SelectItem>)}
                      {vendorsList.length === 0 && <SelectItem value="" disabled>No vendors available</SelectItem>}
                  </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="expense_category_credit_purchase" className="font-body">Expense Category</Label>
              <Select value={currentPurchase.expense_category || ''} onValueChange={handleCategoryChange} disabled={isSubmitting}>
                <SelectTrigger id="expense_category_credit_purchase"><SelectValue placeholder="Select expense category" /></SelectTrigger>
                <SelectContent>
                  {expenseCategoriesList.map(cat => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="item_service_purchased_form" className="font-body">Item/Service Purchased</Label>
              <Input id="item_service_purchased_form" name="item_service_purchased" value={currentPurchase.item_service_purchased || ''} onChange={handleInputChange} required disabled={isSubmitting}/>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="details_form" className="font-body">Details (Optional)</Label>
              <Textarea id="details_form" name="details" value={currentPurchase.details || ''} onChange={handleInputChange} disabled={isSubmitting}/>
            </div>
             <div className="grid grid-cols-3 gap-4">
                <div className="grid gap-2">
                    <Label htmlFor="original_amount_form" className="font-body">Original Amount</Label>
                    <Input id="original_amount_form" name="original_amount" type="number" value={currentPurchase.original_amount || ''} onChange={handleInputChange} required disabled={isSubmitting}/>
                </div>
                <div className="grid gap-2">
                    <Label htmlFor="currency_form" className="font-body">Currency</Label>
                    <Select value={currentPurchase.currency || 'USD'} onValueChange={handleCurrencyChange} disabled={isSubmitting}>
                        <SelectTrigger><SelectValue placeholder="Select currency" /></SelectTrigger>
                        <SelectContent>
                        <SelectItem value="USD">USD</SelectItem>
                        <SelectItem value="SSP">SSP</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <div className="grid gap-2">
                    <Label htmlFor="status_form" className="font-body">Status</Label>
                    <Select value={currentPurchase.status || 'Pending'} onValueChange={handleStatusChange} disabled={isSubmitting || (editingPurchase && editingPurchase.status === 'Paid') }>
                        <SelectTrigger><SelectValue placeholder="Select status" /></SelectTrigger>
                        <SelectContent>
                        <SelectItem value="Pending">Pending</SelectItem>
                        <SelectItem value="Partially Paid" disabled={editingPurchase ? editingPurchase.balance_due === editingPurchase.original_amount : true}>Partially Paid (Set via Payment)</SelectItem>
                        <SelectItem value="Paid" disabled={editingPurchase ? editingPurchase.balance_due > 0 : true}>Paid (Set via Payment)</SelectItem>
                        <SelectItem value="Overdue">Overdue</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="date_of_purchase_form" className="font-body">Purchase Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant={"outline"} className={cn("w-full justify-start text-left font-normal font-sans", !currentPurchase.date_of_purchase && "text-muted-foreground")} disabled={isSubmitting}>
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {currentPurchase.date_of_purchase ? format(currentPurchase.date_of_purchase, "PPP") : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={currentPurchase.date_of_purchase} onSelect={(d) => handleDateChange('date_of_purchase',d)} initialFocus /></PopoverContent>
                </Popover>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="due_date_form" className="font-body">Due Date (Optional)</Label>
                 <Popover>
                  <PopoverTrigger asChild>
                    <Button variant={"outline"} className={cn("w-full justify-start text-left font-normal font-sans", !currentPurchase.due_date && "text-muted-foreground")} disabled={isSubmitting}>
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {currentPurchase.due_date ? format(currentPurchase.due_date, "PPP") : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={currentPurchase.due_date} onSelect={(d) => handleDateChange('due_date',d)} /></PopoverContent>
                </Popover>
              </div>
            </div>
            <DialogFooter>
              <DialogClose asChild><Button type="button" variant="outline" onClick={resetForm} disabled={isSubmitting}>Cancel</Button></DialogClose>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {editingPurchase ? 'Save Changes' : 'Add Purchase'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={isPaymentModalOpen} onOpenChange={(isOpen) => { if (!isSubmittingPayment) setIsPaymentModalOpen(isOpen); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-headline">Record Payment to Vendor</DialogTitle>
            {purchaseForPayment && (
              <DialogDescription className="font-body">
                Recording payment to {purchaseForPayment.vendors?.name || purchaseForPayment.vendor_id} (Balance: <span className="font-currency text-sm">{purchaseForPayment.currency} {formatCurrencyValue(purchaseForPayment.balance_due)}</span>).
              </DialogDescription>
            )}
          </DialogHeader>
          {purchaseForPayment && (
            <form onSubmit={handleRecordPayment} className="space-y-1 py-4">
              <div className="grid gap-2">
                <Label htmlFor="paymentDate_vendor_form" className="font-body">Payment Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant={"outline"} className={cn("w-full justify-start text-left font-normal font-sans", !paymentDetails.paymentDate && "text-muted-foreground")} disabled={isSubmittingPayment}>
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {paymentDetails.paymentDate ? format(paymentDetails.paymentDate, "PPP") : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={paymentDetails.paymentDate} onSelect={handlePaymentDateChange} initialFocus /></PopoverContent>
                </Popover>
              </div>
               <div className="grid gap-2">
                <Label htmlFor="amountPaid_vendor_form" className="font-body">Amount Paid (<span className="font-currency text-sm">{purchaseForPayment.currency}</span>)</Label>
                <Input 
                  id="amountPaid_vendor_form" 
                  name="amountPaid" 
                  type="number" 
                  value={paymentDetails.amountPaid || ''} 
                  onChange={handlePaymentDetailsChange} 
                  required 
                  disabled={isSubmittingPayment}
                  max={purchaseForPayment.balance_due}
                  step="0.01"
                />
              </div>
               <div className="grid gap-2">
                  <Label htmlFor="payment_expense_description" className="font-body">Expense Description for Payment</Label>
                  <Textarea 
                    id="payment_expense_description" 
                    name="expenseDescription" 
                    value={paymentDetails.expenseDescription || ''} 
                    onChange={handlePaymentDetailsChange} 
                    required 
                    disabled={isSubmittingPayment}
                    placeholder="e.g., Payment for invoice INV001 - [Vendor Name]"
                  />
              </div>
              
              <DialogFooter>
                <DialogClose asChild><Button type="button" variant="outline" onClick={resetPaymentForm} disabled={isSubmittingPayment}>Cancel</Button></DialogClose>
                <Button type="submit" disabled={isSubmittingPayment}>
                  {isSubmittingPayment && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Record Payment
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>


      <Card className="shadow-lg m-2">
        <CardHeader>
          <CardTitle className="font-headline">Credit Purchases History</CardTitle>
           <CardDescription className="font-body">Log of all credit purchases from vendors and their payment status.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-1">
          {isLoading ? (
            <div className="flex justify-center items-center h-24">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="font-body">Vendor</TableHead>
                  <TableHead className="font-body">Item/Service</TableHead>
                  <TableHead className="font-body">Expense Category</TableHead>
                  <TableHead className="font-body">Orig. Amount</TableHead>
                  <TableHead className="font-body">Paid Amount</TableHead>
                  <TableHead className="font-body">Balance Due</TableHead>
                  <TableHead className="font-body">Currency</TableHead>
                  <TableHead className="font-body">Purchase Date</TableHead>
                  <TableHead className="font-body">Due Date</TableHead>
                  <TableHead className="font-body">Status</TableHead>
                  <TableHead className="text-right font-body">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {creditPurchases.length > 0 ? creditPurchases.map((purchase) => (
                  <TableRow key={purchase.id}>
                    <TableCell className="font-semibold font-body">{purchase.vendors?.name || purchase.vendor_id}</TableCell>
                    <TableCell className="font-body">{purchase.item_service_purchased}</TableCell>
                    <TableCell className="font-body">{purchase.expense_category || 'N/A'}</TableCell>
                    <TableCell className="font-currency text-sm">{formatCurrencyValue(purchase.original_amount)}</TableCell>
                    <TableCell className="font-currency text-sm">{formatCurrencyValue(purchase.paid_amount)}</TableCell>
                    <TableCell className="font-semibold font-currency text-sm">{formatCurrencyValue(purchase.balance_due)}</TableCell>
                    <TableCell className="font-currency text-sm">{purchase.currency}</TableCell>
                    <TableCell className="font-sans">{format(parseISO(purchase.date_of_purchase), "PP")}</TableCell>
                    <TableCell className="font-sans">{purchase.due_date ? format(parseISO(purchase.due_date), "PP") : 'N/A'}</TableCell>
                    <TableCell><Badge variant={getStatusBadgeVariant(purchase.status)} className="font-sans">{purchase.status}</Badge></TableCell>
                    <TableCell className="text-right space-x-1">
                      {purchase.status !== 'Paid' && (
                        <Button variant="ghost" size="icon" onClick={() => openPaymentDialog(purchase)} title="Record Payment" disabled={isSubmitting || isSubmittingPayment}>
                          <Receipt className="h-4 w-4 text-green-600" />
                        </Button>
                      )}
                      <Button variant="ghost" size="icon" onClick={() => openEditModal(purchase)} title="Edit Purchase" disabled={isSubmitting || isSubmittingPayment || purchase.status === 'Paid'}>
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                           <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" title="Delete Purchase" disabled={isSubmitting || isSubmittingPayment}>
                             <Trash2 className="h-4 w-4" />
                           </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle className="font-headline">Delete Credit Purchase?</AlertDialogTitle>
                            <AlertDialogDescription className="font-body">
                              Are you sure you want to delete this credit purchase: "{purchase.item_service_purchased}" from vendor "{purchase.vendors?.name || purchase.vendor_id}"? This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel disabled={isSubmitting || isSubmittingPayment}>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDeletePurchase(purchase.id)} className="bg-destructive hover:bg-destructive/90" disabled={isSubmitting || isSubmittingPayment}>
                              {(isSubmitting || isSubmittingPayment) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </TableCell>
                  </TableRow>
                )) : (
                   <TableRow>
                      <TableCell colSpan={11} className="text-center font-body h-24">No credit purchases recorded yet.</TableCell>
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

