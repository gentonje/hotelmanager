
"use client";

import React, { useState } from 'react';
import { PageTitle } from "@/components/shared/page-title";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Building2, PlusCircle, Edit2, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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

interface Bank {
  id: string;
  name: string;
  accountNumber: string;
  currency: Currency;
}

const initialBanks: Bank[] = [];

export default function BanksPage() {
  const [banks, setBanks] = useState<Bank[]>(initialBanks);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBank, setEditingBank] = useState<Bank | null>(null);
  const [currentBank, setCurrentBank] = useState<Partial<Bank>>({ currency: 'USD' });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setCurrentBank(prev => ({ ...prev, [name]: value }));
  };

  const handleCurrencyChange = (value: string) => {
    setCurrentBank(prev => ({ ...prev, currency: value as Currency }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentBank.name || !currentBank.accountNumber || !currentBank.currency) {
      alert("Please fill all required fields."); // Replace with toast
      return;
    }

    const bankToSave: Bank = {
      id: editingBank ? editingBank.id : `bank${Date.now()}`,
      name: currentBank.name!,
      accountNumber: currentBank.accountNumber!,
      currency: currentBank.currency!,
    };

    if (editingBank) {
      setBanks(banks.map(b => b.id === editingBank.id ? bankToSave : b));
    } else {
      setBanks([bankToSave, ...banks]);
    }
    
    setIsModalOpen(false);
    setEditingBank(null);
    setCurrentBank({ currency: 'USD' });
  };

  const openEditModal = (bank: Bank) => {
    setEditingBank(bank);
    setCurrentBank(bank);
    setIsModalOpen(true);
  };

  const openNewBankModal = () => {
    setEditingBank(null);
    setCurrentBank({ currency: 'USD' });
    setIsModalOpen(true);
  };
  
  const handleDeleteBank = (bankId: string) => {
    setBanks(banks.filter(b => b.id !== bankId));
  };

  return (
    <>
      <PageTitle title="Bank Accounts" subtitle="Manage your list of bank accounts." icon={Building2}>
        <Button onClick={openNewBankModal}>
          <PlusCircle className="mr-2 h-4 w-4" /> Add New Bank Account
        </Button>
      </PageTitle>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
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
              <Input id="name" name="name" value={currentBank.name || ''} onChange={handleInputChange} required />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="accountNumber" className="font-body">Account Number</Label>
                <Input id="accountNumber" name="accountNumber" value={currentBank.accountNumber || ''} onChange={handleInputChange} required />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="currency" className="font-body">Currency</Label>
                <Select value={currentBank.currency} onValueChange={handleCurrencyChange}>
                  <SelectTrigger><SelectValue placeholder="Select currency" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="USD">USD</SelectItem>
                    <SelectItem value="SSP">SSP</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <DialogClose asChild><Button type="button" variant="outline" onClick={() => {setIsModalOpen(false); setEditingBank(null); setCurrentBank({ currency: 'USD' }); }}>Cancel</Button></DialogClose>
              <Button type="submit">{editingBank ? 'Save Changes' : 'Add Bank Account'}</Button>
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
                  <TableCell className="font-body">{bank.accountNumber}</TableCell>
                  <TableCell className="font-body">{bank.currency}</TableCell>
                  <TableCell className="text-right space-x-1">
                    <Button variant="ghost" size="icon" onClick={() => openEditModal(bank)} title="Edit Bank Account">
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                         <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" title="Delete Bank Account">
                           <Trash2 className="h-4 w-4" />
                         </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle className="font-headline">Delete Bank Account?</AlertDialogTitle>
                          <AlertDialogDescription className="font-body">
                            Are you sure you want to delete the bank account "{bank.name} - {bank.accountNumber}"? This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDeleteBank(bank.id)} className="bg-destructive hover:bg-destructive/90">
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
        </CardContent>
      </Card>
    </>
  );
}
