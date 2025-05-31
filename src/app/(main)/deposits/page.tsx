
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
import { CalendarIcon, Landmark, PlusCircle, Edit2, Trash2, Loader2 } from "lucide-react";
import { format, parseISO } from "date-fns";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type Currency = 'USD' | 'SSP';

export interface Deposit {
  id: string;
  date: string; // Store as ISO string
  amount: number;
  currency: Currency;
  bank: string;
  reference_no: string;
  deposited_by: string;
  description?: string;
  created_at?: string;
  updated_at?: string;
}

interface FormDeposit extends Omit<Deposit, 'date'> {
  date: Date;
}

export default function DepositsPage() {
  const [deposits, setDeposits] = useState<Deposit[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDeposit, setEditingDeposit] = useState<Deposit | null>(null);
  const [currentDeposit, setCurrentDeposit] = useState<Partial<FormDeposit>>({ date: new Date(), currency: 'USD' });
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const fetchDeposits = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('deposits')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) {
      toast({ title: "Error fetching deposits", description: error.message, variant: "destructive" });
    } else {
      setDeposits(data || []);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchDeposits();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setCurrentDeposit(prev => ({ ...prev, [name]: name === 'amount' ? parseFloat(value) || 0 : value }));
  };

  const handleDateChange = (dateVal: Date | undefined) => {
    if (dateVal) {
      setCurrentDeposit(prev => ({ ...prev, date: dateVal }));
    }
  };

  const handleCurrencyChange = (value: string) => {
    setCurrentDeposit(prev => ({ ...prev, currency: value as Currency }));
  };

  const resetForm = () => {
    setCurrentDeposit({ date: new Date(), currency: 'USD', description: '' });
    setEditingDeposit(null);
    setIsModalOpen(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentDeposit.date || !currentDeposit.amount || !currentDeposit.currency || !currentDeposit.bank || !currentDeposit.reference_no || !currentDeposit.deposited_by) {
      toast({ title: "Missing fields", description: "Please fill all required deposit fields.", variant: "destructive" });
      return;
    }
    setIsSubmitting(true);

    const depositToSave: Omit<Deposit, 'id' | 'created_at' | 'updated_at'> = {
      date: currentDeposit.date!.toISOString(),
      amount: currentDeposit.amount!,
      currency: currentDeposit.currency!,
      bank: currentDeposit.bank!,
      reference_no: currentDeposit.reference_no!,
      deposited_by: currentDeposit.deposited_by!,
      description: currentDeposit.description,
    };

    let error = null;
    if (editingDeposit) {
      const { error: updateError } = await supabase
        .from('deposits')
        .update(depositToSave)
        .eq('id', editingDeposit.id);
      error = updateError;
    } else {
      const depositWithId = {
        ...depositToSave,
        id: `dep_${Date.now()}`
      };
      const { error: insertError } = await supabase
        .from('deposits')
        .insert([depositWithId]);
      error = insertError;
    }

    if (error) {
      toast({ title: `Error ${editingDeposit ? "updating" : "adding"} deposit`, description: error.message, variant: "destructive" });
    } else {
      toast({ title: `Deposit ${editingDeposit ? "updated" : "added"} successfully`, variant: "default" });
      resetForm();
      fetchDeposits();
    }
    setIsSubmitting(false);
  };

  const openEditModal = (deposit: Deposit) => {
    setEditingDeposit(deposit);
    setCurrentDeposit({
      ...deposit,
      date: deposit.date ? parseISO(deposit.date) : new Date(),
    });
    setIsModalOpen(true);
  };
  
  const openNewDepositModal = () => {
    resetForm(); 
    setCurrentDeposit({ date: new Date(), currency: 'USD', description: '' }); 
    setIsModalOpen(true);
  };

  const handleDelete = async (depositId: string) => {
    setIsSubmitting(true);
    const { error } = await supabase
      .from('deposits')
      .delete()
      .eq('id', depositId);

    if (error) {
      toast({ title: "Error deleting deposit", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Deposit deleted successfully", variant: "default" });
      fetchDeposits();
    }
    setIsSubmitting(false);
  };

  return (
    <>
      <PageTitle title="Bank Deposits" subtitle="Manage and track all bank deposits." icon={Landmark}>
        <Button onClick={openNewDepositModal} disabled={isLoading || isSubmitting}> 
          <PlusCircle className="mr-2 h-4 w-4" /> Add New Deposit
        </Button>
      </PageTitle>

      <Dialog open={isModalOpen} onOpenChange={(isOpen) => {
        if (!isSubmitting) {
          setIsModalOpen(isOpen);
          if (!isOpen) resetForm();
        }
      }}>
        <DialogContent className="sm:max-w-[525px]">
          <DialogHeader>
            <DialogTitle className="font-headline">{editingDeposit ? "Edit Deposit" : "Add New Deposit"}</DialogTitle>
            <DialogDescription className="font-body">
              {editingDeposit ? "Update the details of the bank deposit." : "Enter the details of the new bank deposit."}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="date" className="font-body">Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !currentDeposit.date && "text-muted-foreground"
                    )}
                    disabled={isSubmitting}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {currentDeposit.date ? format(currentDeposit.date, "PPP") : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar mode="single" selected={currentDeposit.date} onSelect={handleDateChange} initialFocus />
                </PopoverContent>
              </Popover>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="amount" className="font-body">Amount</Label>
                <Input id="amount" name="amount" type="number" value={currentDeposit.amount || ''} onChange={handleInputChange} placeholder="e.g., 1500.00" disabled={isSubmitting} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="currency" className="font-body">Currency</Label>
                <Select value={currentDeposit.currency} onValueChange={handleCurrencyChange} disabled={isSubmitting}>
                  <SelectTrigger><SelectValue placeholder="Select currency" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="USD">USD</SelectItem>
                    <SelectItem value="SSP">SSP</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="bank" className="font-body">Bank</Label>
              <Input id="bank" name="bank" value={currentDeposit.bank || ''} onChange={handleInputChange} placeholder="e.g., Equity Bank" disabled={isSubmitting}/>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="reference_no" className="font-body">Reference No.</Label>
              <Input id="reference_no" name="reference_no" value={currentDeposit.reference_no || ''} onChange={handleInputChange} placeholder="e.g., EQREF001" disabled={isSubmitting}/>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="deposited_by" className="font-body">Deposited By</Label>
              <Input id="deposited_by" name="deposited_by" value={currentDeposit.deposited_by || ''} onChange={handleInputChange} placeholder="e.g., John Doe" disabled={isSubmitting}/>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description" className="font-body">Description (Optional)</Label>
              <Textarea id="description" name="description" value={currentDeposit.description || ''} onChange={handleInputChange} placeholder="e.g., Monthly salary deposit" disabled={isSubmitting}/>
            </div>
            <DialogFooter>
              <DialogClose asChild>
                 <Button type="button" variant="outline" onClick={resetForm} disabled={isSubmitting}>Cancel</Button>
              </DialogClose>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {editingDeposit ? "Save Changes" : "Add Deposit"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="font-headline">Deposit History</CardTitle>
          <CardDescription className="font-body">A log of all recorded bank deposits.</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
             <div className="flex justify-center items-center h-24">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow><TableHead className="font-body">Date</TableHead><TableHead className="font-body">Amount</TableHead><TableHead className="font-body">Currency</TableHead><TableHead className="font-body">Bank</TableHead><TableHead className="font-body">Reference No.</TableHead><TableHead className="font-body">Deposited By</TableHead><TableHead className="font-body">Description</TableHead><TableHead className="text-right font-body">Actions</TableHead></TableRow>
              </TableHeader>
              <TableBody>
                {deposits.length > 0 ? deposits.map((deposit) => (
                  <TableRow key={deposit.id}><TableCell className="font-body">{format(parseISO(deposit.date), "PPP")}</TableCell><TableCell className="font-semibold font-body">{deposit.amount.toFixed(2)}</TableCell><TableCell className="font-body">{deposit.currency}</TableCell><TableCell className="font-body">{deposit.bank}</TableCell><TableCell className="font-body">{deposit.reference_no}</TableCell><TableCell className="font-body">{deposit.deposited_by}</TableCell><TableCell className="font-body">{deposit.description || 'N/A'}</TableCell><TableCell className="text-right space-x-2">
                       <Button variant="ghost" size="icon" onClick={() => openEditModal(deposit)} title="Edit Deposit" disabled={isSubmitting}>
                         <Edit2 className="h-4 w-4" />
                       </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" title="Delete Deposit" disabled={isSubmitting}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle className="font-headline">Are you sure?</AlertDialogTitle>
                            <AlertDialogDescription className="font-body">
                              This action cannot be undone. This will permanently delete the deposit record.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel disabled={isSubmitting}>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDelete(deposit.id)} className="bg-destructive hover:bg-destructive/90" disabled={isSubmitting}>
                              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </TableCell></TableRow>
                )) : (
                   <TableRow><TableCell colSpan={8} className="text-center font-body h-24">No deposits recorded yet.</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </>
  );
}
