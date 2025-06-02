
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CalendarIcon, Receipt, PlusCircle, Edit2, Trash2, Loader2 } from "lucide-react";
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


export type ExpenseCategory = 'Staff Salaries' | 'Taxes' | 'Utilities' | 'Supplies' | 'Maintenance' | 'Marketing' | 'Cost of Goods Sold - Bar' | 'Cost of Goods Sold - Restaurant' | 'Operating Supplies' | 'Other';
type Currency = 'USD' | 'SSP';

export interface Expense {
  id: string;
  date: string; 
  category: ExpenseCategory;
  description: string;
  amount: number;
  currency: Currency; 
  paid_to?: string;
  vendor_id?: string; 
  is_cash_purchase?: boolean; 
  related_credit_purchase_payment_id?: string; 
  created_at?: string;
  updated_at?: string;
  vendors?: Pick<Vendor, 'name'>; // For join
}

interface FormExpense extends Omit<Expense, 'date' | 'currency' | 'vendors'> {
  date: Date;
  currency: Currency;
}

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [vendorsList, setVendorsList] = useState<Pick<Vendor, 'id' | 'name'>[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [currentExpense, setCurrentExpense] = useState<Partial<FormExpense>>({ date: new Date(), category: 'Other', currency: 'USD' });
  const [activeTab, setActiveTab] = useState<ExpenseCategory | 'All'>('All');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const fetchExpensesAndVendors = async () => {
    setIsLoading(true);
    try {
        const { data: expensesData, error: expensesError } = await supabase
        .from('expenses')
        .select('*, vendors (name)') 
        .order('created_at', { ascending: false });

        if (expensesError) throw expensesError;
        setExpenses(expensesData || []);
        
        const { data: vendorsData, error: vendorsError } = await supabase.from('vendors').select('id, name');
        if (vendorsError) throw vendorsError;
        setVendorsList(vendorsData || []);

    } catch (error: any) {
         toast({ title: "Error fetching data", description: error.message, variant: "destructive" });
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchExpensesAndVendors();
  }, []);


  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setCurrentExpense(prev => ({ ...prev, [name]: name === 'amount' ? parseFloat(value) || 0 : value }));
  };
  
  const handleDateChange = (dateVal: Date | undefined) => {
     if (dateVal) {
      setCurrentExpense(prev => ({ ...prev, date: dateVal }));
    }
  };

  const handleCategoryChange = (value: string) => {
    setCurrentExpense(prev => ({ ...prev, category: value as ExpenseCategory }));
  };

  const handleCurrencyChange = (value: string) => {
    setCurrentExpense(prev => ({...prev, currency: value as Currency}));
  };

  const handleVendorChange = (vendorName: string) => {
    const selectedVendor = vendorsList.find(v => v.name === vendorName);
    setCurrentExpense(prev => ({ ...prev, vendor_id: selectedVendor?.id, paid_to: selectedVendor?.name }));
  };

  const resetForm = () => {
    setEditingExpense(null);
    setCurrentExpense({ date: new Date(), category: 'Other', currency: 'USD' });
    setIsModalOpen(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentExpense.date || !currentExpense.category || !currentExpense.description || !currentExpense.amount || !currentExpense.currency) {
      toast({ title: "Missing fields", description: "Please fill Date, Category, Description, Amount and Currency.", variant: "destructive" });
      return;
    }
    setIsSubmitting(true);

    const expenseToSave: Partial<Omit<Expense, 'vendors'>> = {
      date: currentExpense.date!.toISOString(),
      category: currentExpense.category!,
      description: currentExpense.description!,
      amount: currentExpense.amount!,
      currency: currentExpense.currency!,
      paid_to: currentExpense.paid_to, 
      vendor_id: currentExpense.vendor_id || null, 
      is_cash_purchase: currentExpense.is_cash_purchase || false, 
    };
    
    let error = null;
    if (editingExpense) {
      const { error: updateError } = await supabase
        .from('expenses')
        .update(expenseToSave)
        .eq('id', editingExpense.id);
      error = updateError;
    } else {
      const expenseWithId = {
        ...expenseToSave,
        id: `exp_${Date.now()}` 
      };
      const { error: insertError } = await supabase
        .from('expenses')
        .insert([expenseWithId]);
      error = insertError;
    }

    if (error) {
      toast({ title: `Error ${editingExpense ? 'updating' : 'adding'} expense`, description: error.message, variant: "destructive" });
    } else {
      toast({ title: `Expense ${editingExpense ? 'updated' : 'added'} successfully`, variant: "default" });
      resetForm();
      fetchExpensesAndVendors();
    }
    setIsSubmitting(false);
  };

  const openEditModal = (expense: Expense) => {
    setEditingExpense(expense);
    setCurrentExpense({
        ...expense,
        date: expense.date ? parseISO(expense.date) : new Date(),
        currency: expense.currency || 'USD', 
    });
    setIsModalOpen(true);
  };

  const openNewExpenseModal = () => {
    resetForm();
    setIsModalOpen(true);
  };
  
  const handleDeleteExpense = async (expenseId: string) => {
    setIsSubmitting(true); 
    const { error } = await supabase
      .from('expenses')
      .delete()
      .eq('id', expenseId);

    if (error) {
      toast({ title: "Error deleting expense", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Expense deleted successfully", variant: "default" });
      fetchExpensesAndVendors();
    }
    setIsSubmitting(false); 
  };

  const filteredExpenses = activeTab === 'All' ? expenses : expenses.filter(exp => exp.category === activeTab);
  const expenseCategoriesSelect: ExpenseCategory[] = ['Staff Salaries', 'Taxes', 'Utilities', 'Supplies', 'Maintenance', 'Marketing', 'Cost of Goods Sold - Bar', 'Cost of Goods Sold - Restaurant', 'Operating Supplies', 'Other'];


  return (
    <>
      <PageTitle title="Expense Tracking" subtitle="Record and display all business expenses." icon={Receipt}>
        <Button onClick={openNewExpenseModal} disabled={isLoading || isSubmitting}>
          <PlusCircle className="mr-2 h-4 w-4" /> Add New General Expense
        </Button>
      </PageTitle>

      <Dialog open={isModalOpen} onOpenChange={(isOpen) => { if(!isSubmitting) setIsModalOpen(isOpen); }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-headline">{editingExpense ? 'Edit Expense' : 'Add New General Expense'}</DialogTitle>
            <DialogDescription className="font-body">
              {editingExpense ? 'Update the details of this expense.' : 'Enter details for a new business expense. For Cash Purchases, use the Transactions page.'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-1 py-4">
            <div className="grid gap-2">
              <Label htmlFor="date" className="font-body">Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant={"outline"} className={cn("w-full justify-start text-left font-normal font-sans", !currentExpense.date && "text-muted-foreground")} disabled={isSubmitting}>
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {currentExpense.date ? format(currentExpense.date, "PPP") : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={currentExpense.date} onSelect={handleDateChange} initialFocus /></PopoverContent>
              </Popover>
            </div>
            <div className="grid grid-cols-3 gap-4">
                <div className="grid gap-2 col-span-2">
                    <Label htmlFor="category" className="font-body">Category</Label>
                    <Select value={currentExpense.category} onValueChange={handleCategoryChange} disabled={isSubmitting}>
                        <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                        <SelectContent>
                            {expenseCategoriesSelect.map(cat => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}
                        </SelectContent>
                    </Select>
                </div>
                <div className="grid gap-2">
                    <Label htmlFor="amount" className="font-body">Amount</Label>
                    <Input id="amount" name="amount" type="number" value={currentExpense.amount || ''} onChange={handleInputChange} required disabled={isSubmitting} step="0.01"/>
                </div>
            </div>
             <div className="grid gap-2">
                <Label htmlFor="currency_expense_form" className="font-body">Currency</Label>
                <Select value={currentExpense.currency || 'USD'} onValueChange={handleCurrencyChange} disabled={isSubmitting}>
                    <SelectTrigger id="currency_expense_form"><SelectValue placeholder="Select currency" /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="USD">USD</SelectItem>
                        <SelectItem value="SSP">SSP</SelectItem>
                    </SelectContent>
                </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description" className="font-body">Description</Label>
              <Textarea id="description" name="description" value={currentExpense.description || ''} onChange={handleInputChange} required disabled={isSubmitting}/>
            </div>
            <div className="grid gap-2">
                <Label htmlFor="vendor_id_expenses" className="font-body">Paid To / Vendor (Optional)</Label>
                 <Select
                    value={currentExpense.paid_to || vendorsList.find(v => v.id === currentExpense.vendor_id)?.name || ""}
                    onValueChange={handleVendorChange}
                    disabled={isSubmitting || isLoading}
                  >
                    <SelectTrigger id="vendor_id_expenses">
                      <SelectValue placeholder={isLoading ? "Loading vendors..." : "Select vendor or type name"} />
                    </SelectTrigger>
                    <SelectContent>
                      {isLoading && <SelectItem value="" disabled>Loading...</SelectItem>}
                      <SelectItem value="">None / Direct Name</SelectItem>
                      {vendorsList.map(vendor => (
                        <SelectItem key={vendor.id} value={vendor.name}>
                          {vendor.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {!vendorsList.find(v => v.name === currentExpense.paid_to) && !currentExpense.vendor_id && (
                     <Input 
                        name="paid_to" 
                        value={currentExpense.paid_to || ''} 
                        onChange={handleInputChange} 
                        placeholder="Or type direct recipient name" 
                        className="mt-2"
                        disabled={isSubmitting}
                    />
                  )}
            </div>
            <DialogFooter>
              <DialogClose asChild><Button type="button" variant="outline" onClick={resetForm} disabled={isSubmitting}>Cancel</Button></DialogClose>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {editingExpense ? 'Save Changes' : 'Add Expense'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Tabs defaultValue="All" onValueChange={(value) => setActiveTab(value as ExpenseCategory | 'All')} className="w-full m-2">
        <TabsList className="mb-4 flex-wrap h-auto">
          <TabsTrigger value="All" className="font-body">All Expenses</TabsTrigger>
          {expenseCategoriesSelect.map(cat => (
            <TabsTrigger key={cat} value={cat} className="font-body">{cat}</TabsTrigger>
          ))}
        </TabsList>

        <Card className="shadow-lg m-2">
          <CardHeader>
            <CardTitle className="font-headline">{activeTab === 'All' ? 'All Expenses' : `${activeTab} Expenses`}</CardTitle>
            <CardDescription className="font-body">A log of recorded expenses.</CardDescription>
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
                    <TableHead className="font-body">Category</TableHead>
                    <TableHead className="font-body">Description</TableHead>
                    <TableHead className="font-body">Amount</TableHead>
                    <TableHead className="font-body">Currency</TableHead>
                    <TableHead className="font-body">Paid To/Vendor</TableHead>
                    <TableHead className="text-right font-body">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredExpenses.length > 0 ? filteredExpenses.map((expense) => (
                    <TableRow key={expense.id} className={expense.is_cash_purchase ? 'bg-blue-50 dark:bg-blue-900/30' : ''}>
                      <TableCell className="font-sans">{format(parseISO(expense.date), "PP")}</TableCell>
                      <TableCell className="font-body">{expense.category}</TableCell>
                      <TableCell className="font-body">{expense.description}</TableCell>
                      <TableCell className="font-semibold font-currency text-sm">
                        {expense.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </TableCell>
                      <TableCell className="font-currency text-sm">{expense.currency}</TableCell>
                      <TableCell className="font-body">
                        {expense.vendors?.name || expense.paid_to || 'N/A'}
                      </TableCell>
                      <TableCell className="text-right space-x-1">
                        <Button variant="ghost" size="icon" onClick={() => openEditModal(expense)} title="Edit Expense" disabled={isSubmitting || expense.is_cash_purchase || !!expense.related_credit_purchase_payment_id}>
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                             <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" title="Delete Expense" disabled={isSubmitting || expense.is_cash_purchase || !!expense.related_credit_purchase_payment_id}>
                               <Trash2 className="h-4 w-4" />
                             </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle className="font-headline">Delete Expense Record?</AlertDialogTitle>
                              <AlertDialogDescription className="font-body">
                                Are you sure you want to delete this expense: "{expense.description}"? This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel disabled={isSubmitting}>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDeleteExpense(expense.id)} className="bg-destructive hover:bg-destructive/90" disabled={isSubmitting}>
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
                        <TableCell colSpan={7} className="text-center font-body h-24">No expenses recorded for this category.</TableCell>
                     </TableRow>
                  )}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </Tabs>
    </>
  );
}
