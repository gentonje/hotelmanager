
"use client";

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useToast } from "@/hooks/use-toast";
import { PageTitle } from "@/components/shared/page-title";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Building2, PlusCircle, Edit2, Trash2, Loader2 } from "lucide-react";
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

type Currency = 'USD' | 'SSP';

export interface Bank {
  id: string;
  name: string;
  account_number: string;
  currency: Currency;
  created_at?: string;
  updated_at?: string;
}

export default function BanksPage() {
  const [banks, setBanks] = useState<Bank[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBank, setEditingBank] = useState<Bank | null>(null);
  const [currentBank, setCurrentBank] = useState<Partial<Bank>>({ currency: 'USD' });
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const fetchBanks = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('banks')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      toast({ title: "Error fetching banks", description: error.message, variant: "destructive" });
    } else {
      setBanks(data || []);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchBanks();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setCurrentBank(prev => ({ ...prev, [name]: value }));
  };

  const handleCurrencyChange = (value: string) => {
    setCurrentBank(prev => ({ ...prev, currency: value as Currency }));
  };

  const resetForm = () => {
    setEditingBank(null);
    setCurrentBank({ currency: 'USD' });
    setIsModalOpen(false);
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentBank.name || !currentBank.account_number || !currentBank.currency) {
      toast({ title: "Missing fields", description: "Please fill all required bank details.", variant: "destructive" });
      return;
    }
    setIsSubmitting(true);

    const bankToSave = {
      name: currentBank.name!,
      account_number: currentBank.account_number!,
      currency: currentBank.currency!,
    };

    let error = null;
    if (editingBank) {
      const { error: updateError } = await supabase
        .from('banks')
        .update(bankToSave)
        .eq('id', editingBank.id);
      error = updateError;
    } else {
      const bankWithId = {
        ...bankToSave,
        id: `bank_${Date.now()}` // Client-side ID generation
      };
      const { error: insertError } = await supabase
        .from('banks')
        .insert([bankWithId]);
      error = insertError;
    }

    if (error) {
      toast({ title: `Error ${editingBank ? 'updating' : 'adding'} bank`, description: error.message, variant: "destructive" });
    } else {
      toast({ title: `Bank ${editingBank ? 'updated' : 'added'} successfully`, variant: "default" });
      resetForm();
      fetchBanks(); // Refresh the list
    }
    setIsSubmitting(false);
  };

  const openEditModal = (bank: Bank) => {
    setEditingBank(bank);
    setCurrentBank({ name: bank.name, account_number: bank.account_number, currency: bank.currency});
    setIsModalOpen(true);
  };

  const openNewBankModal = () => {
    setEditingBank(null);
    setCurrentBank({ currency: 'USD' });
    setIsModalOpen(true);
  };
  
  const handleDeleteBank = async (bankId: string) => {
    setIsSubmitting(true);
    const { error } = await supabase
      .from('banks')
      .delete()
      .eq('id', bankId);

    if (error) {
      toast({ title: "Error deleting bank", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Bank deleted successfully", variant: "default" });
      fetchBanks(); // Refresh the list
    }
    setIsSubmitting(false);
  };

  return (
    <>
      <PageTitle title="Bank Accounts" subtitle="Manage your list of bank accounts." icon={Building2}>
        <Button onClick={openNewBankModal} disabled={isLoading || isSubmitting}>
          <PlusCircle className="mr-2 h-4 w-4" /> Add New Bank Account
        </Button>
      </PageTitle>

      <Dialog open={isModalOpen} onOpenChange={(isOpen) => { if (!isSubmitting) setIsModalOpen(isOpen); }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-headline">{editingBank ? 'Edit Bank Account' : 'Add New Bank Account'}</DialogTitle>
            <DialogDescription className="font-body">
              {editingBank ? 'Update the details of this bank account.' : 'Enter details for a new bank account.'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name" className="font-body">Bank Name</Label>
              <Input id="name" name="name" value={currentBank.name || ''} onChange={handleInputChange} required disabled={isSubmitting} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="account_number" className="font-body">Account Number</Label>
                <Input id="account_number" name="account_number" value={currentBank.account_number || ''} onChange={handleInputChange} required disabled={isSubmitting} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="currency" className="font-body">Currency</Label>
                <Select value={currentBank.currency} onValueChange={handleCurrencyChange} disabled={isSubmitting}>
                  <SelectTrigger><SelectValue placeholder="Select currency" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="USD">USD</SelectItem>
                    <SelectItem value="SSP">SSP</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <DialogClose asChild><Button type="button" variant="outline" onClick={resetForm} disabled={isSubmitting}>Cancel</Button></DialogClose>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {editingBank ? 'Save Changes' : 'Add Bank Account'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="font-headline">Bank Accounts List</CardTitle>
           <CardDescription className="font-body">All registered bank accounts.</CardDescription>
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
                  <TableHead className="font-body">Bank Name</TableHead>
                  <TableHead className="font-body">Account Number</TableHead>
                  <TableHead className="font-body">Currency</TableHead>
                  <TableHead className="text-right font-body">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {banks.length > 0 ? banks.map((bank) => (
                  <TableRow key={bank.id}>
                    <TableCell className="font-semibold font-body">{bank.name}</TableCell>
                    <TableCell className="font-body">{bank.account_number}</TableCell>
                    <TableCell className="font-body">{bank.currency}</TableCell>
                    <TableCell className="text-right space-x-1">
                      <Button variant="ghost" size="icon" onClick={() => openEditModal(bank)} title="Edit Bank Account" disabled={isSubmitting}>
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                           <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" title="Delete Bank Account" disabled={isSubmitting}>
                             <Trash2 className="h-4 w-4" />
                           </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle className="font-headline">Delete Bank Account?</AlertDialogTitle>
                            <AlertDialogDescription className="font-body">
                              Are you sure you want to delete the bank account "{bank.name} - {bank.account_number}"? This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel disabled={isSubmitting}>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDeleteBank(bank.id)} className="bg-destructive hover:bg-destructive/90" disabled={isSubmitting}>
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
                      <TableCell colSpan={4} className="text-center font-body h-24">No bank accounts registered yet.</TableCell>
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
