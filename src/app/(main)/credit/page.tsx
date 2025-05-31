
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
import { CalendarIcon, CreditCard, PlusCircle, Edit2, Trash2, CheckCircle2, Loader2 } from "lucide-react";
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

type CreditStatus = 'Pending' | 'Paid' | 'Overdue';
type Currency = 'USD' | 'SSP';

export interface CreditSale {
  id: string;
  customer_name: string;
  item_service: string;
  details?: string;
  amount: number;
  currency: Currency; // Added currency
  date: string; // Store as ISO string
  due_date?: string; // Store as ISO string
  status: CreditStatus;
  created_at?: string;
  updated_at?: string;
}

interface FormCreditSale extends Omit<CreditSale, 'date' | 'due_date'> {
  date: Date;
  due_date?: Date;
}


export default function CreditPage() {
  const [creditSales, setCreditSales] = useState<CreditSale[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSale, setEditingSale] = useState<CreditSale | null>(null);
  const [currentSale, setCurrentSale] = useState<Partial<FormCreditSale>>({ date: new Date(), status: 'Pending', currency: 'USD' });
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
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

  useEffect(() => {
    fetchCreditSales();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setCurrentSale(prev => ({ ...prev, [name]: name === 'amount' ? parseFloat(value) || 0 : value }));
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

  const resetForm = () => {
    setEditingSale(null);
    setCurrentSale({ date: new Date(), status: 'Pending', currency: 'USD' });
    setIsModalOpen(false);
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentSale.customer_name || !currentSale.item_service || !currentSale.amount || !currentSale.date || !currentSale.currency) {
      toast({ title: "Missing fields", description: "Please fill all required fields for the credit sale, including currency.", variant: "destructive" });
      return;
    }
    setIsSubmitting(true);

    const saleToSave = {
      customer_name: currentSale.customer_name!,
      item_service: currentSale.item_service!,
      details: currentSale.details,
      amount: currentSale.amount!,
      currency: currentSale.currency!,
      date: currentSale.date!.toISOString(),
      due_date: currentSale.due_date ? currentSale.due_date.toISOString() : undefined,
      status: currentSale.status || 'Pending',
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
        id: `cred_${Date.now()}` // Client-side ID generation
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
      currency: sale.currency || 'USD', // Ensure currency is set
    });
    setIsModalOpen(true);
  };

  const openNewSaleModal = () => {
    setEditingSale(null);
    setCurrentSale({ date: new Date(), status: 'Pending', currency: 'USD' });
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

  const markAsPaid = async (saleId: string) => {
    // This function will be enhanced later for the "Record Full Payment" dialog.
    // For now, it just updates the status.
    setIsSubmitting(true);
    const { error } = await supabase
      .from('credit_sales')
      .update({ status: 'Paid' })
      .eq('id', saleId);

    if (error) {
      toast({ title: "Error marking sale as paid", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Sale marked as paid", variant: "default" });
      fetchCreditSales();
    }
    setIsSubmitting(false);
  };

  const getStatusBadgeVariant = (status: CreditStatus) => {
    switch (status) {
      case 'Paid': return 'default'; 
      case 'Pending': return 'secondary';
      case 'Overdue': return 'destructive';
      default: return 'outline';
    }
  };

  return (
    <>
      <PageTitle title="Credit Management" subtitle="Track and manage items/services sold on credit." icon={CreditCard}>
        <Button onClick={openNewSaleModal} disabled={isLoading || isSubmitting}>
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
              <Label htmlFor="item_service" className="font-body">Item/Service Sold</Label>
              <Input id="item_service" name="item_service" value={currentSale.item_service || ''} onChange={handleInputChange} required disabled={isSubmitting}/>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="details" className="font-body">Details (Optional)</Label>
              <Textarea id="details" name="details" value={currentSale.details || ''} onChange={handleInputChange} disabled={isSubmitting}/>
            </div>
             <div className="grid grid-cols-3 gap-4">
                <div className="grid gap-2">
                    <Label htmlFor="amount" className="font-body">Amount</Label>
                    <Input id="amount" name="amount" type="number" value={currentSale.amount || ''} onChange={handleInputChange} required disabled={isSubmitting}/>
                </div>
                <div className="grid gap-2">
                    <Label htmlFor="currency" className="font-body">Currency</Label>
                    <Select value={currentSale.currency} onValueChange={handleCurrencyChange} disabled={isSubmitting}>
                        <SelectTrigger><SelectValue placeholder="Select currency" /></SelectTrigger>
                        <SelectContent>
                        <SelectItem value="USD">USD</SelectItem>
                        <SelectItem value="SSP">SSP</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <div className="grid gap-2">
                    <Label htmlFor="status" className="font-body">Status</Label>
                    <Select value={currentSale.status} onValueChange={handleStatusChange} disabled={isSubmitting}>
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
                <Label htmlFor="date" className="font-body">Transaction Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant={"outline"} className={cn("w-full justify-start text-left font-normal", !currentSale.date && "text-muted-foreground")} disabled={isSubmitting}>
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
                    <Button variant={"outline"} className={cn("w-full justify-start text-left font-normal", !currentSale.due_date && "text-muted-foreground")} disabled={isSubmitting}>
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
                  <TableHead className="font-body">Amount</TableHead>
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
                    <TableCell className="font-body">{sale.amount.toFixed(2)}</TableCell>
                    <TableCell className="font-body">{sale.currency}</TableCell>
                    <TableCell className="font-body">{format(parseISO(sale.date), "PP")}</TableCell>
                    <TableCell className="font-body">{sale.due_date ? format(parseISO(sale.due_date), "PP") : 'N/A'}</TableCell>
                    <TableCell><Badge variant={getStatusBadgeVariant(sale.status)} className="font-body">{sale.status}</Badge></TableCell>
                    <TableCell className="text-right space-x-1">
                      {sale.status !== 'Paid' && (
                        <Button variant="ghost" size="icon" onClick={() => markAsPaid(sale.id)} title="Mark as Paid" disabled={isSubmitting}>
                          <CheckCircle2 className="h-4 w-4 text-green-600" />
                        </Button>
                      )}
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
                            <AlertDialogTitle className="font-headline">Delete Credit Sale?</AlertDialogTitle>
                            <AlertDialogDescription className="font-body">
                              Are you sure you want to delete this credit sale for "{sale.customer_name}"? This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel disabled={isSubmitting}>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDeleteSale(sale.id)} className="bg-destructive hover:bg-destructive/90" disabled={isSubmitting}>
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
                      <TableCell colSpan={8} className="text-center font-body h-24">No credit sales recorded yet.</TableCell>
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
