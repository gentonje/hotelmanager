
"use client";

import React, { useState, useEffect, useCallback } from 'react';
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
import { CalendarIcon, DollarSign, Edit2, Trash2, Loader2, Link as LinkIcon } from "lucide-react";
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

import type { CashSale as CashSaleType, RevenueCategory } from '@/app/(main)/transactions/page';
import type { Customer } from '@/app/(main)/customers/page';

const revenueCategoriesList: RevenueCategory[] = ['Rooms', 'Main Bar', 'Restaurant', 'Conference Halls', 'Internet Services', 'Swimming Pool', 'Other'];
type Currency = 'USD' | 'SSP';

interface FormCashSale extends Omit<CashSaleType, 'date' | 'currency' | 'id' | 'linked_credit_sale_id'> {
  date: Date;
  currency: Currency;
}

export default function CashSalesHistoryPage() {
  const [cashSales, setCashSales] = useState<CashSaleType[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSale, setEditingSale] = useState<CashSaleType | null>(null);
  const [currentSale, setCurrentSale] = useState<Partial<FormCashSale>>({ date: new Date(), currency: 'USD' });
  const [customersList, setCustomersList] = useState<Pick<Customer, 'id' | 'name'>[]>([]);
  
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const fetchCashSales = useCallback(async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('cash_sales')
      .select('*')
      .order('date', { ascending: false });

    if (error) {
      toast({ title: "Error fetching cash sales", description: error.message, variant: "destructive" });
    } else {
      setCashSales(data || []);
    }
    setIsLoading(false);
  }, [toast]);

  const fetchCustomers = async () => {
    const { data, error } = await supabase.from('customers').select('id, name');
    if (error) {
      toast({ title: "Error fetching customers", description: error.message, variant: "destructive" });
    } else {
      setCustomersList(data || []);
    }
  };

  useEffect(() => {
    fetchCashSales();
    fetchCustomers();
  }, [fetchCashSales]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setCurrentSale(prev => ({ ...prev, [name]: name === 'amount' ? parseFloat(value) || 0 : value }));
  };
  
  const handleDateChange = (dateVal: Date | undefined) => {
    if (dateVal) {
      setCurrentSale(prev => ({ ...prev, date: dateVal }));
    }
  };

  const handleSelectChange = (field: 'currency' | 'revenue_category' | 'customer_name', value: string) => {
    setCurrentSale(prev => ({ ...prev, [field]: value as any }));
  };

  const resetForm = () => {
    setEditingSale(null);
    setCurrentSale({ date: new Date(), currency: 'USD', amount: 0 });
    setIsModalOpen(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSale || !currentSale.date || !currentSale.item_service || !currentSale.amount || !currentSale.currency || !currentSale.revenue_category) {
      toast({ title: "Missing fields", description: "Please fill all required fields.", variant: "destructive" });
      return;
    }
    
    if (editingSale.linked_credit_sale_id && currentSale.amount !== editingSale.amount) {
        toast({ title: "Cannot Edit Amount", description: "This cash sale is linked to a credit sale due to a shortfall. To change amounts, adjust the linked credit sale or handle reconciliation manually.", variant: "destructive" });
        return;
    }

    setIsSubmitting(true);

    const saleToUpdate = {
      date: currentSale.date!.toISOString(),
      item_service: currentSale.item_service!,
      details: currentSale.details,
      amount: currentSale.amount!,
      currency: currentSale.currency!,
      customer_name: currentSale.customer_name || null,
      revenue_category: currentSale.revenue_category!,
    };

    const { error } = await supabase
      .from('cash_sales')
      .update(saleToUpdate)
      .eq('id', editingSale.id);

    if (error) {
      toast({ title: "Error updating cash sale", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Cash Sale Updated", variant: "default" });
      resetForm();
      fetchCashSales();
    }
    setIsSubmitting(false);
  };

  const openEditModal = (sale: CashSaleType) => {
    setEditingSale(sale);
    setCurrentSale({
      date: sale.date ? parseISO(sale.date) : new Date(),
      item_service: sale.item_service,
      details: sale.details,
      amount: sale.amount,
      currency: sale.currency as Currency,
      customer_name: sale.customer_name,
      revenue_category: sale.revenue_category,
    });
    setIsModalOpen(true);
  };
  
  const handleDeleteSale = async (saleId: string, linkedCreditId?: string | null) => {
    setIsSubmitting(true);
    
    const { error } = await supabase
      .from('cash_sales')
      .delete()
      .eq('id', saleId);

    if (error) {
      toast({ title: "Error deleting cash sale", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Cash sale deleted successfully", variant: "default" });
      fetchCashSales();
    }
    setIsSubmitting(false);
  };

  const formatCurrencyValue = (value: number | undefined) => {
      if (value === undefined || value === null) return '0.00';
      return value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  return (
    <>
      <PageTitle title="Cash Sales History" subtitle="View, edit, or delete recorded cash sales." icon={DollarSign} />

      <Dialog open={isModalOpen} onOpenChange={(isOpen) => { if (!isSubmitting) setIsModalOpen(isOpen); }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-headline">Edit Cash Sale</DialogTitle>
            <DialogDescription className="font-body">
              Update the details of this cash sale.
              {editingSale?.linked_credit_sale_id && (
                <p className="text-destructive text-xs mt-1">
                  Note: This sale is linked to a credit sale (ID: {editingSale.linked_credit_sale_id}). Amount cannot be changed here.
                </p>
              )}
            </DialogDescription>
          </DialogHeader>
          {editingSale && (
            <form onSubmit={handleSubmit} className="space-y-1 py-4">
              <div className="grid gap-2">
                <Label htmlFor="edit_cash_date" className="font-body">Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant={"outline"} className={cn("w-full justify-start text-left font-normal font-sans", !currentSale.date && "text-muted-foreground")} disabled={isSubmitting}>
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {currentSale.date ? format(currentSale.date, "PPP") : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={currentSale.date} onSelect={handleDateChange} initialFocus /></PopoverContent>
                </Popover>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit_cash_revenue_category" className="font-body">Revenue Category</Label>
                <Select value={currentSale.revenue_category || ''} onValueChange={(value) => handleSelectChange('revenue_category', value)} disabled={isSubmitting}>
                  <SelectTrigger id="edit_cash_revenue_category"><SelectValue placeholder="Select revenue category" /></SelectTrigger>
                  <SelectContent>{revenueCategoriesList.map(cat => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit_cash_item_service" className="font-body">Item/Service Sold</Label>
                <Input id="edit_cash_item_service" name="item_service" value={currentSale.item_service || ''} onChange={handleInputChange} required disabled={isSubmitting}/>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit_cash_details" className="font-body">Details (Optional)</Label>
                <Textarea id="edit_cash_details" name="details" value={currentSale.details || ''} onChange={handleInputChange} disabled={isSubmitting}/>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="edit_cash_amount" className="font-body">Amount</Label>
                  <Input 
                    id="edit_cash_amount" 
                    name="amount" 
                    type="number" 
                    value={currentSale.amount || ''} 
                    onChange={handleInputChange} 
                    required 
                    disabled={isSubmitting || !!editingSale.linked_credit_sale_id} 
                    step="0.01"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit_cash_currency" className="font-body">Currency</Label>
                  <Select value={currentSale.currency || 'USD'} onValueChange={(value) => handleSelectChange('currency', value)} disabled={isSubmitting}>
                    <SelectTrigger><SelectValue placeholder="Select currency" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="USD">USD</SelectItem>
                      <SelectItem value="SSP">SSP</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit_cash_customer_name" className="font-body">Customer Name (Optional)</Label>
                <Select value={currentSale.customer_name || ''} onValueChange={(value) => handleSelectChange('customer_name', value)} disabled={isSubmitting || isLoading}>
                  <SelectTrigger id="edit_cash_customer_name">
                    <SelectValue placeholder={isLoading ? "Loading customers..." : "Select customer (Optional)"} />
                  </SelectTrigger>
                  <SelectContent>
                    {isLoading && <SelectItem value="" disabled>Loading...</SelectItem>}
                    <SelectItem value="">None (Optional)</SelectItem>
                    {customersList.map(customer => <SelectItem key={customer.id} value={customer.name}>{customer.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <DialogFooter>
                <DialogClose asChild><Button type="button" variant="outline" onClick={resetForm} disabled={isSubmitting}>Cancel</Button></DialogClose>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Save Changes
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      <Card className="shadow-lg m-2">
        <CardHeader>
          <CardTitle className="font-headline">Cash Sales Log</CardTitle>
           <CardDescription className="font-body">History of all direct cash sales transactions.</CardDescription>
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
                  <TableHead className="font-body">Date</TableHead>
                  <TableHead className="font-body">Item/Service</TableHead>
                  <TableHead className="font-body">Category</TableHead>
                  <TableHead className="font-body">Amount</TableHead>
                  <TableHead className="font-body">Currency</TableHead>
                  <TableHead className="font-body">Customer</TableHead>
                  <TableHead className="font-body">Linked Credit</TableHead>
                  <TableHead className="text-right font-body">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {cashSales.length > 0 ? cashSales.map((sale) => (
                  <TableRow key={sale.id}>
                    <TableCell className="font-sans">{format(parseISO(sale.date), "PP")}</TableCell>
                    <TableCell className="font-semibold font-body">{sale.item_service}</TableCell>
                    <TableCell className="font-body">{sale.revenue_category || 'N/A'}</TableCell>
                    <TableCell className="font-currency text-sm">{formatCurrencyValue(sale.amount)}</TableCell>
                    <TableCell className="font-currency text-sm">{sale.currency}</TableCell>
                    <TableCell className="font-body">{sale.customer_name || 'N/A'}</TableCell>
                    <TableCell className="font-body">
                      {sale.linked_credit_sale_id ? (
                        <Badge variant="secondary" className="font-sans">
                          <LinkIcon className="mr-1 h-3 w-3" /> Yes
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="font-sans">No</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right space-x-1">
                      <Button variant="ghost" size="icon" onClick={() => openEditModal(sale)} title="Edit Sale" disabled={isSubmitting}>
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                           <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" title="Delete Sale" disabled={isSubmitting}>
                             <Trash2 className="h-4 w-4" />
                           </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle className="font-headline">Delete Cash Sale?</AlertDialogTitle>
                            <AlertDialogDescription className="font-body">
                              Are you sure you want to delete this cash sale: "{sale.item_service}"? 
                              {sale.linked_credit_sale_id && (
                                <span className="block text-destructive text-xs mt-2">
                                  Warning: This cash sale is linked to Credit Sale ID: {sale.linked_credit_sale_id}. 
                                  Deleting this will NOT automatically update the linked credit sale. Manual adjustments may be required.
                                </span>
                              )}
                               This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel disabled={isSubmitting}>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDeleteSale(sale.id, sale.linked_credit_sale_id)} className="bg-destructive hover:bg-destructive/90" disabled={isSubmitting}>
                              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </TableCell>
                  </TableRow>
                )) : (
                   <TableRow>
                      <TableCell colSpan={8} className="text-center font-body h-24">No cash sales recorded yet.</TableCell>
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
