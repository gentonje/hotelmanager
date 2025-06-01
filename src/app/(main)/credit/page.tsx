
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
import { CalendarIcon, CreditCard, PlusCircle, Edit2, Trash2, CheckCircle2, Loader2, Landmark, LayoutGrid } from "lucide-react";
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
import type { Bank } from '@/app/(main)/banks/page';
import type { RevenueCategory } from '@/app/(main)/transactions/page'; 

const revenueCategoriesList: RevenueCategory[] = ['Rooms', 'Main Bar', 'Restaurant', 'Conference Halls', 'Internet Services', 'Swimming Pool', 'Other'];


type CreditStatus = 'Pending' | 'Paid' | 'Overdue';
type Currency = 'USD' | 'SSP';
type PaymentMethod = 'cash' | 'bank_deposit';

export interface CreditSale {
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
  created_at?: string;
  updated_at?: string;
}

interface FormCreditSale extends Omit<CreditSale, 'date' | 'due_date' | 'paid_amount' | 'balance_due' | 'currency'> {
  date: Date;
  currency: Currency;
  due_date?: Date;
}

interface PaymentDetails {
  paymentDate: Date;
  paymentMethod: PaymentMethod;
  amountPaid: number;
  bankName?: string;
  depositReference?: string;
}


export default function CreditPage() {
  const [creditSales, setCreditSales] = useState<CreditSale[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSale, setEditingSale] = useState<CreditSale | null>(null);
  const [currentSale, setCurrentSale] = useState<Partial<FormCreditSale>>({ date: new Date(), status: 'Pending', currency: 'USD', original_amount: 0 });
  
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [saleForPayment, setSaleForPayment] = useState<CreditSale | null>(null);
  const [paymentDetails, setPaymentDetails] = useState<Partial<PaymentDetails>>({ paymentDate: new Date(), paymentMethod: 'cash'});
  const [banksList, setBanksList] = useState<Pick<Bank, 'id' | 'name' | 'currency'>[]>([]);

  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmittingPayment, setIsSubmittingPayment] = useState(false);
  const { toast } = useToast();

  const fetchCreditSales = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('credit_sales')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      toast({ title: "Error fetching credit sales", description: error.message, variant: "destructive" });
    } else {
      setCreditSales(data || []);
    }
    setIsLoading(false);
  };

  const fetchBanks = async () => {
    const { data, error } = await supabase.from('banks').select('id, name, currency');
    if (error) {
      toast({ title: "Error fetching banks", description: error.message, variant: "destructive" });
    } else {
      setBanksList(data || []);
    }
  };

  useEffect(() => {
    fetchCreditSales();
    fetchBanks();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setCurrentSale(prev => ({ ...prev, [name]: name === 'original_amount' ? parseFloat(value) || 0 : value }));
  };
  
  const handleDateChange = (field: 'date' | 'due_date', dateVal: Date | undefined) => {
    setCurrentSale(prev => ({ ...prev, [field]: dateVal }));
  };

  const handleStatusChange = (value: string) => {
    setCurrentSale(prev => ({ ...prev, status: value as CreditStatus }));
  };

  const handleCurrencyChange = (value: string) => {
    setCurrentSale(prev => ({ ...prev, currency: value as Currency }));
  };
  
  const handleCategoryChange = (value: string) => {
    setCurrentSale(prev => ({ ...prev, revenue_category: value as RevenueCategory }));
  };

  const resetForm = () => {
    setEditingSale(null);
    setCurrentSale({ date: new Date(), status: 'Pending', currency: 'USD', original_amount: 0, revenue_category: undefined });
    setIsModalOpen(false);
  };

  const resetPaymentForm = () => {
    setSaleForPayment(null);
    setPaymentDetails({ paymentDate: new Date(), paymentMethod: 'cash', amountPaid: 0 });
    setIsPaymentModalOpen(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentSale.customer_name || !currentSale.item_service || !currentSale.original_amount || !currentSale.date || !currentSale.currency || !currentSale.revenue_category) {
      toast({ title: "Missing fields", description: "Please fill all required fields including Revenue Category.", variant: "destructive" });
      return;
    }
    setIsSubmitting(true);

    const saleToSave: Omit<CreditSale, 'id' | 'created_at' | 'updated_at' | 'paid_amount' | 'balance_due'> & {balance_due: number, paid_amount: number} = {
      customer_name: currentSale.customer_name!,
      item_service: currentSale.item_service!,
      details: currentSale.details,
      original_amount: currentSale.original_amount!,
      currency: currentSale.currency!,
      date: currentSale.date!.toISOString(),
      due_date: currentSale.due_date ? currentSale.due_date.toISOString() : undefined,
      status: currentSale.status || 'Pending',
      revenue_category: currentSale.revenue_category!,
      paid_amount: editingSale ? editingSale.paid_amount : 0, 
      balance_due: editingSale ? (currentSale.original_amount! - editingSale.paid_amount) : currentSale.original_amount!, 
    };

    let error = null;

    if (editingSale) {
      const { error: updateError } = await supabase
        .from('credit_sales')
        .update(saleToSave)
        .eq('id', editingSale.id);
      error = updateError;
    } else {
      const saleWithId = {
        ...saleToSave,
        id: `cred_${Date.now()}`
      };
      const { error: insertError } = await supabase
        .from('credit_sales')
        .insert([saleWithId]);
      error = insertError;
    }

    if (error) {
      toast({ title: `Error ${editingSale ? 'updating' : 'adding'} credit sale`, description: error.message, variant: "destructive" });
    } else {
      toast({ title: `Credit Sale ${editingSale ? 'updated' : 'added'} successfully`, variant: "default" });
      resetForm();
      fetchCreditSales();
    }
    setIsSubmitting(false);
  };

  const openEditModal = (sale: CreditSale) => {
    setEditingSale(sale);
    setCurrentSale({
      ...sale,
      date: sale.date ? parseISO(sale.date) : new Date(),
      due_date: sale.due_date ? parseISO(sale.due_date) : undefined,
      currency: sale.currency || 'USD',
      revenue_category: sale.revenue_category,
    });
    setIsModalOpen(true);
  };

  const openNewSaleModal = () => {
    resetForm();
    setIsModalOpen(true);
  };
  
  const handleDeleteSale = async (saleId: string) => {
    setIsSubmitting(true);
    const { error } = await supabase
      .from('credit_sales')
      .delete()
      .eq('id', saleId);

    if (error) {
      toast({ title: "Error deleting credit sale", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Credit sale deleted successfully", variant: "default" });
      fetchCreditSales();
    }
    setIsSubmitting(false);
  };

  const openPaymentDialog = (sale: CreditSale) => {
    setSaleForPayment(sale);
    setPaymentDetails({ 
        paymentDate: new Date(), 
        paymentMethod: 'cash', 
        amountPaid: sale.balance_due 
    });
    setIsPaymentModalOpen(true);
  };

  const handlePaymentDetailsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPaymentDetails(prev => ({ ...prev, [name]: name === 'amountPaid' ? parseFloat(value) || 0 : value }));
  };

  const handlePaymentDateChange = (dateVal: Date | undefined) => {
     if (dateVal) {
      setPaymentDetails(prev => ({ ...prev, paymentDate: dateVal }));
    }
  };

  const handlePaymentMethodChange = (value: string) => {
    setPaymentDetails(prev => ({ ...prev, paymentMethod: value as PaymentMethod, bankName: '', depositReference: '' }));
  };
  
  const handlePaymentBankChange = (value: string) => {
    setPaymentDetails(prev => ({ ...prev, bankName: value }));
  };

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!saleForPayment || !paymentDetails.paymentDate || !paymentDetails.amountPaid || paymentDetails.amountPaid <= 0) {
      toast({ title: "Invalid Payment Details", description: "Please enter a valid payment date and amount.", variant: "destructive" });
      return;
    }
    if (paymentDetails.amountPaid > saleForPayment.balance_due + 0.001) { 
      toast({ title: "Overpayment", description: `Amount paid (${paymentDetails.amountPaid}) cannot exceed balance due (${saleForPayment.balance_due}).`, variant: "destructive" });
      return;
    }

    setIsSubmittingPayment(true);

    try {
      const newPaidAmount = saleForPayment.paid_amount + paymentDetails.amountPaid;
      const newBalanceDue = saleForPayment.original_amount - newPaidAmount;
      const newStatus = newBalanceDue <= 0.001 ? 'Paid' : saleForPayment.status; 

      const { error: updateStatusError } = await supabase
        .from('credit_sales')
        .update({ 
            paid_amount: newPaidAmount,
            balance_due: newBalanceDue,
            status: newStatus, 
            updated_at: new Date().toISOString() 
        })
        .eq('id', saleForPayment.id);

      if (updateStatusError) throw updateStatusError;

      if (paymentDetails.paymentMethod === 'cash') {
        const cashSaleRecord = {
          id: `cash_pay_${Date.now()}`,
          date: paymentDetails.paymentDate.toISOString(),
          item_service: `Payment for Credit: ${saleForPayment.item_service} (ID: ${saleForPayment.id})`,
          details: `Customer: ${saleForPayment.customer_name}. Amount Paid: ${paymentDetails.amountPaid}`,
          amount: paymentDetails.amountPaid,
          currency: saleForPayment.currency,
          customer_name: saleForPayment.customer_name,
          revenue_category: saleForPayment.revenue_category || 'Other', 
        };
        const { error: cashError } = await supabase.from('cash_sales').insert([cashSaleRecord]);
        if (cashError) throw cashError;

      } else if (paymentDetails.paymentMethod === 'bank_deposit') {
        if (!paymentDetails.bankName || !paymentDetails.depositReference) {
          toast({ title: "Missing deposit details", description: "Please select a bank and enter a reference number.", variant: "destructive" });
          setIsSubmittingPayment(false);
          return;
        }
        const depositRecord = {
          id: `dep_pay_${Date.now()}`,
          date: paymentDetails.paymentDate.toISOString(),
          amount: paymentDetails.amountPaid,
          currency: saleForPayment.currency,
          bank: paymentDetails.bankName,
          reference_no: paymentDetails.depositReference,
          deposited_by: saleForPayment.customer_name,
          description: `Payment for Credit Sale ID: ${saleForPayment.id}. Amount Paid: ${paymentDetails.amountPaid}`,
        };
        const { error: depositError } = await supabase.from('deposits').insert([depositRecord]);
        if (depositError) throw depositError;
      }

      toast({ title: "Payment Recorded Successfully", description: `Payment of ${saleForPayment.currency} ${paymentDetails.amountPaid.toFixed(2)} for ${saleForPayment.customer_name} recorded.`, variant: "default" });
      resetPaymentForm();
      fetchCreditSales();

    } catch (error: any) {
      toast({ title: "Error recording payment", description: error.message, variant: "destructive" });
    } finally {
      setIsSubmittingPayment(false);
    }
  };


  const getStatusBadgeVariant = (status: CreditStatus) => {
    switch (status) {
      case 'Paid': return 'default'; 
      case 'Pending': return 'secondary';
      case 'Overdue': return 'destructive';
      default: return 'outline';
    }
  };

  const formatCurrencyValue = (value: number | undefined) => {
      if (value === undefined || value === null) return '0.00';
      return value.toFixed(2);
  }

  return (
    <>
      <PageTitle title="Credit Management" subtitle="Track and manage items/services sold on credit." icon={CreditCard}>
        <Button onClick={openNewSaleModal} disabled={isLoading || isSubmitting || isSubmittingPayment}>
          <PlusCircle className="mr-2 h-4 w-4" /> Add New Credit Sale
        </Button>
      </PageTitle>

      <Dialog open={isModalOpen} onOpenChange={(isOpen) => { if (!isSubmitting) setIsModalOpen(isOpen); }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-headline">{editingSale ? 'Edit Credit Sale' : 'Add New Credit Sale'}</DialogTitle>
            <DialogDescription className="font-body">
              {editingSale ? 'Update the details of this credit transaction.' : 'Enter details for a new item/service sold on credit.'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="customer_name" className="font-body">Customer Name</Label>
              <Input id="customer_name" name="customer_name" value={currentSale.customer_name || ''} onChange={handleInputChange} required disabled={isSubmitting} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="revenue_category_credit" className="font-body">Revenue Category</Label>
              <Select value={currentSale.revenue_category || ''} onValueChange={handleCategoryChange} disabled={isSubmitting}>
                <SelectTrigger id="revenue_category_credit"><SelectValue placeholder="Select revenue category" /></SelectTrigger>
                <SelectContent>
                  {revenueCategoriesList.map(cat => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="item_service" className="font-body">Item/Service Sold</Label>
              <Input id="item_service" name="item_service" value={currentSale.item_service || ''} onChange={handleInputChange} required disabled={isSubmitting}/>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="details" className="font-body">Details (Optional)</Label>
              <Textarea id="details" name="details" value={currentSale.details || ''} onChange={handleInputChange} disabled={isSubmitting}/>
            </div>
             <div className="grid grid-cols-3 gap-4">
                <div className="grid gap-2">
                    <Label htmlFor="original_amount" className="font-body">Original Amount</Label>
                    <Input id="original_amount" name="original_amount" type="number" value={currentSale.original_amount || ''} onChange={handleInputChange} required disabled={isSubmitting}/>
                </div>
                <div className="grid gap-2">
                    <Label htmlFor="currency" className="font-body">Currency</Label>
                    <Select value={currentSale.currency || 'USD'} onValueChange={handleCurrencyChange} disabled={isSubmitting}>
                        <SelectTrigger><SelectValue placeholder="Select currency" /></SelectTrigger>
                        <SelectContent>
                        <SelectItem value="USD">USD</SelectItem>
                        <SelectItem value="SSP">SSP</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <div className="grid gap-2">
                    <Label htmlFor="status" className="font-body">Status</Label>
                    <Select value={currentSale.status || 'Pending'} onValueChange={handleStatusChange} disabled={isSubmitting || (editingSale && editingSale.status === 'Paid') }>
                        <SelectTrigger><SelectValue placeholder="Select status" /></SelectTrigger>
                        <SelectContent>
                        <SelectItem value="Pending">Pending</SelectItem>
                        <SelectItem value="Paid" disabled={editingSale ? editingSale.balance_due > 0 : true}>Paid (Set via Payment)</SelectItem>
                        <SelectItem value="Overdue">Overdue</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="date" className="font-body">Transaction Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant={"outline"} className={cn("w-full justify-start text-left font-normal font-sans", !currentSale.date && "text-muted-foreground")} disabled={isSubmitting}>
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {currentSale.date ? format(currentSale.date, "PPP") : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={currentSale.date} onSelect={(d) => handleDateChange('date',d)} initialFocus /></PopoverContent>
                </Popover>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="due_date" className="font-body">Due Date (Optional)</Label>
                 <Popover>
                  <PopoverTrigger asChild>
                    <Button variant={"outline"} className={cn("w-full justify-start text-left font-normal font-sans", !currentSale.due_date && "text-muted-foreground")} disabled={isSubmitting}>
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {currentSale.due_date ? format(currentSale.due_date, "PPP") : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={currentSale.due_date} onSelect={(d) => handleDateChange('due_date',d)} /></PopoverContent>
                </Popover>
              </div>
            </div>
            <DialogFooter>
              <DialogClose asChild><Button type="button" variant="outline" onClick={resetForm} disabled={isSubmitting}>Cancel</Button></DialogClose>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {editingSale ? 'Save Changes' : 'Add Sale'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={isPaymentModalOpen} onOpenChange={(isOpen) => { if (!isSubmittingPayment) setIsPaymentModalOpen(isOpen); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-headline">Record Payment</DialogTitle>
            {saleForPayment && (
              <DialogDescription className="font-body">
                Recording payment for {saleForPayment.customer_name} (Balance: <span className="font-currency">{saleForPayment.currency} {formatCurrencyValue(saleForPayment.balance_due)}</span>).
              </DialogDescription>
            )}
          </DialogHeader>
          {saleForPayment && (
            <form onSubmit={handleRecordPayment} className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="paymentDate" className="font-body">Payment Date</Label>
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
                <Label htmlFor="amountPaid" className="font-body">Amount Paid (<span className="font-currency">{saleForPayment.currency}</span>)</Label>
                <Input 
                  id="amountPaid" 
                  name="amountPaid" 
                  type="number" 
                  value={paymentDetails.amountPaid || ''} 
                  onChange={handlePaymentDetailsChange} 
                  required 
                  disabled={isSubmittingPayment}
                  max={saleForPayment.balance_due}
                  step="0.01"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="paymentMethod" className="font-body">Payment Method</Label>
                <Select value={paymentDetails.paymentMethod} onValueChange={handlePaymentMethodChange} disabled={isSubmittingPayment}>
                  <SelectTrigger><SelectValue placeholder="Select payment method" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">Cash Payment</SelectItem>
                    <SelectItem value="bank_deposit">Bank Deposit</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {paymentDetails.paymentMethod === 'bank_deposit' && (
                <>
                  <div className="grid gap-2">
                    <Label htmlFor="bankName" className="font-body">Bank Account</Label>
                    <Select value={paymentDetails.bankName || ''} onValueChange={handlePaymentBankChange} disabled={isSubmittingPayment}>
                      <SelectTrigger>
                        <SelectValue placeholder={banksList.length === 0 ? "No banks available" : "Select bank"} />
                      </SelectTrigger>
                      <SelectContent>
                        {banksList.length > 0 ? banksList.map(bank => (
                          <SelectItem key={bank.id} value={bank.name}>{bank.name} ({bank.currency})</SelectItem>
                        )) : <SelectItem value="" disabled>No banks configured</SelectItem>}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="depositReference" className="font-body">Deposit Reference No.</Label>
                    <Input id="depositReference" name="depositReference" value={paymentDetails.depositReference || ''} onChange={handlePaymentDetailsChange} required disabled={isSubmittingPayment}/>
                  </div>
                </>
              )}
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


      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="font-headline">Credit Sales History</CardTitle>
           <CardDescription className="font-body">Log of all credit transactions and their payment status.</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center items-center h-24">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="font-body">Customer</TableHead>
                  <TableHead className="font-body">Item/Service</TableHead>
                  <TableHead className="font-body">Category</TableHead>
                  <TableHead className="font-body">Orig. Amount</TableHead>
                  <TableHead className="font-body">Paid Amount</TableHead>
                  <TableHead className="font-body">Balance Due</TableHead>
                  <TableHead className="font-body">Currency</TableHead>
                  <TableHead className="font-body">Date</TableHead>
                  <TableHead className="font-body">Due Date</TableHead>
                  <TableHead className="font-body">Status</TableHead>
                  <TableHead className="text-right font-body">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {creditSales.length > 0 ? creditSales.map((sale) => (
                  <TableRow key={sale.id}>
                    <TableCell className="font-semibold font-body">{sale.customer_name}</TableCell>
                    <TableCell className="font-body">{sale.item_service}</TableCell>
                    <TableCell className="font-body">{sale.revenue_category || 'N/A'}</TableCell>
                    <TableCell className="font-currency">{formatCurrencyValue(sale.original_amount)}</TableCell>
                    <TableCell className="font-currency">{formatCurrencyValue(sale.paid_amount)}</TableCell>
                    <TableCell className="font-semibold font-currency">{formatCurrencyValue(sale.balance_due)}</TableCell>
                    <TableCell className="font-currency">{sale.currency}</TableCell>
                    <TableCell className="font-sans">{format(parseISO(sale.date), "PP")}</TableCell>
                    <TableCell className="font-sans">{sale.due_date ? format(parseISO(sale.due_date), "PP") : 'N/A'}</TableCell>
                    <TableCell><Badge variant={getStatusBadgeVariant(sale.status)} className="font-sans">{sale.status}</Badge></TableCell>
                    <TableCell className="text-right space-x-1">
                      {sale.status !== 'Paid' && (
                        <Button variant="ghost" size="icon" onClick={() => openPaymentDialog(sale)} title="Record Payment" disabled={isSubmitting || isSubmittingPayment}>
                          <CheckCircle2 className="h-4 w-4 text-green-600" />
                        </Button>
                      )}
                      <Button variant="ghost" size="icon" onClick={() => openEditModal(sale)} title="Edit Sale" disabled={isSubmitting || isSubmittingPayment || sale.status === 'Paid'}>
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                           <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" title="Delete Sale" disabled={isSubmitting || isSubmittingPayment}>
                             <Trash2 className="h-4 w-4" />
                           </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle className="font-headline">Delete Credit Sale?</AlertDialogTitle>
                            <AlertDialogDescription className="font-body">
                              Are you sure you want to delete this credit sale for "{sale.customer_name}"? This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel disabled={isSubmitting || isSubmittingPayment}>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDeleteSale(sale.id)} className="bg-destructive hover:bg-destructive/90" disabled={isSubmitting || isSubmittingPayment}>
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
                      <TableCell colSpan={11} className="text-center font-body h-24">No credit sales recorded yet.</TableCell>
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
