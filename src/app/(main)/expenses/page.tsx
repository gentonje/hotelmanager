
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


type ExpenseCategory = 'Staff Salaries' | 'Taxes' | 'Utilities' | 'Supplies' | 'Maintenance' | 'Marketing' | 'Other';

export interface Expense {
  id: string;
  date: string; // Store as ISO string
  category: ExpenseCategory;
  description: string;
  amount: number;
  paid_to?: string;
  created_at?: string;
  updated_at?: string;
}

interface FormExpense extends Omit<Expense, 'date'> {
  date: Date;
}

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [currentExpense, setCurrentExpense] = useState<Partial<FormExpense>>({ date: new Date(), category: 'Other' });
  const [activeTab, setActiveTab] = useState<ExpenseCategory | 'All'>('All');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const fetchExpenses = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('expenses')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      toast({ title: "Error fetching expenses", description: error.message, variant: "destructive" });
    } else {
      setExpenses(data || []);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchExpenses();
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

  const resetForm = () => {
    setEditingExpense(null);
    setCurrentExpense({ date: new Date(), category: 'Other' });
    setIsModalOpen(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentExpense.date || !currentExpense.category || !currentExpense.description || !currentExpense.amount) {
      toast({ title: "Missing fields", description: "Please fill all required expense fields.", variant: "destructive" });
      return;
    }
    setIsSubmitting(true);

    const expenseToSave = {
      date: currentExpense.date!.toISOString(),
      category: currentExpense.category!,
      description: currentExpense.description!,
      amount: currentExpense.amount!,
      paid_to: currentExpense.paid_to,
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
        id: `exp_${Date.now()}` // Client-side ID generation
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
      fetchExpenses();
    }
    setIsSubmitting(false);
  };

  const openEditModal = (expense: Expense) => {
    setEditingExpense(expense);
    setCurrentExpense({
        ...expense,
        date: expense.date ? parseISO(expense.date) : new Date(),
    });
    setIsModalOpen(true);
  };

  const openNewExpenseModal = () => {
    setEditingExpense(null);
    setCurrentExpense({ date: new Date(), category: 'Other' });
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
      fetchExpenses();
    }
    setIsSubmitting(false);
  };

  const filteredExpenses = activeTab === 'All' ? expenses : expenses.filter(exp => exp.category === activeTab);

  return (
    <>
      <PageTitle title="Expense Tracking" subtitle="Record and display all business expenses." icon={Receipt}>
        <Button onClick={openNewExpenseModal} disabled={isLoading || isSubmitting}>
          <PlusCircle className="mr-2 h-4 w-4" /> Add New Expense
        </Button>
      </PageTitle>

      <Dialog open={isModalOpen} onOpenChange={(isOpen) => { if(!isSubmitting) setIsModalOpen(isOpen); }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-headline">{editingExpense ? 'Edit Expense' : 'Add New Expense'}</DialogTitle>
            <DialogDescription className="font-body">
              {editingExpense ? 'Update the details of this expense.' : 'Enter details for a new business expense.'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="date" className="font-body">Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant={"outline"} className={cn("w-full justify-start text-left font-normal", !currentExpense.date && "text-muted-foreground")} disabled={isSubmitting}>
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {currentExpense.date ? format(currentExpense.date, "PPP") : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={currentExpense.date} onSelect={handleDateChange} initialFocus /></PopoverContent>
              </Popover>
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                    <Label htmlFor="category" className="font-body">Category</Label>
                    <Select value={currentExpense.category} onValueChange={handleCategoryChange} disabled={isSubmitting}>
                        <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                        <SelectContent>
                        <SelectItem value="Staff Salaries">Staff Salaries</SelectItem>
                        <SelectItem value="Taxes">Taxes</SelectItem>
                        <SelectItem value="Utilities">Utilities</SelectItem>
                        <SelectItem value="Supplies">Supplies</SelectItem>
                        <SelectItem value="Maintenance">Maintenance</SelectItem>
                        <SelectItem value="Marketing">Marketing</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <div className="grid gap-2">
                    <Label htmlFor="amount" className="font-body">Amount</Label>
                    <Input id="amount" name="amount" type="number" value={currentExpense.amount || ''} onChange={handleInputChange} required disabled={isSubmitting}/>
                </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description" className="font-body">Description</Label>
              <Textarea id="description" name="description" value={currentExpense.description || ''} onChange={handleInputChange} required disabled={isSubmitting}/>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="paid_to" className="font-body">Paid To (Optional)</Label>
              <Input id="paid_to" name="paid_to" value={currentExpense.paid_to || ''} onChange={handleInputChange} disabled={isSubmitting}/>
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

      <Tabs defaultValue="All" onValueChange={(value) => setActiveTab(value as ExpenseCategory | 'All')} className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="All" className="font-body">All Expenses</TabsTrigger>
          <TabsTrigger value="Staff Salaries" className="font-body">Staff Salaries</TabsTrigger>
          <TabsTrigger value="Taxes" className="font-body">Taxes</TabsTrigger>
          <TabsTrigger value="Utilities" className="font-body">Utilities</TabsTrigger>
          <TabsTrigger value="Supplies" className="font-body">Supplies</TabsTrigger>
          <TabsTrigger value="Other" className="font-body">Other</TabsTrigger>
        </TabsList>

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="font-headline">{activeTab === 'All' ? 'All Expenses' : `${activeTab} Expenses`}</CardTitle>
            <CardDescription className="font-body">A log of recorded expenses.</CardDescription>
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
                    <TableHead className="font-body">Date</TableHead>
                    <TableHead className="font-body">Category</TableHead>
                    <TableHead className="font-body">Description</TableHead>
                    <TableHead className="font-body">Amount</TableHead>
                    <TableHead className="font-body">Paid To</TableHead>
                    <TableHead className="text-right font-body">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredExpenses.length > 0 ? filteredExpenses.map((expense) => (
                    <TableRow key={expense.id}>
                      <TableCell className="font-body">{format(parseISO(expense.date), "PP")}</TableCell>
                      <TableCell className="font-body">{expense.category}</TableCell>
                      <TableCell className="font-body">{expense.description}</TableCell>
                      <TableCell className="font-semibold font-body">${expense.amount.toFixed(2)}</TableCell>
                      <TableCell className="font-body">{expense.paid_to || 'N/A'}</TableCell>
                      <TableCell className="text-right space-x-1">
                        <Button variant="ghost" size="icon" onClick={() => openEditModal(expense)} title="Edit Expense" disabled={isSubmitting}>
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                             <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" title="Delete Expense" disabled={isSubmitting}>
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
                        <TableCell colSpan={6} className="text-center font-body h-24">No expenses recorded for this category.</TableCell>
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
