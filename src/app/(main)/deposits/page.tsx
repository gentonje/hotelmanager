
"use client";

import React, { useState } from 'react';
import { PageTitle } from "@/components/shared/page-title";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CalendarIcon, Landmark, PlusCircle, Edit2, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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

interface Deposit {
  id: string;
  date: Date;
  amount: number;
  currency: Currency;
  bank: string;
  referenceNo: string;
  depositedBy: string;
}

const initialDeposits: Deposit[] = [];

export default function DepositsPage() {
  const [deposits, setDeposits] = useState<Deposit[]>(initialDeposits);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDeposit, setEditingDeposit] = useState<Deposit | null>(null);
  const [currentDeposit, setCurrentDeposit] = useState<Partial<Deposit>>({ date: new Date(), currency: 'USD' });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setCurrentDeposit(prev => ({ ...prev, [name]: name === 'amount' ? parseFloat(value) || 0 : value }));
  };

  const handleDateChange = (dateVal: Date | undefined) => {
    setCurrentDeposit(prev => ({ ...prev, date: dateVal }));
  };

  const handleCurrencyChange = (value: string) => {
    setCurrentDeposit(prev => ({ ...prev, currency: value as Currency }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentDeposit.date || !currentDeposit.amount || !currentDeposit.currency || !currentDeposit.bank || !currentDeposit.referenceNo || !currentDeposit.depositedBy) {
      alert("Please fill all fields"); // Replace with a proper toast notification
      return;
    }
    const newDeposit: Deposit = {
      id: editingDeposit ? editingDeposit.id : `dep${Date.now()}`,
      date: currentDeposit.date!,
      amount: currentDeposit.amount!,
      currency: currentDeposit.currency!,
      bank: currentDeposit.bank!,
      referenceNo: currentDeposit.referenceNo!,
      depositedBy: currentDeposit.depositedBy!,
    };

    if (editingDeposit) {
      setDeposits(deposits.map(d => d.id === editingDeposit.id ? newDeposit : d));
    } else {
      setDeposits([newDeposit, ...deposits]);
    }
    resetForm();
    setIsModalOpen(false);
  };

  const resetForm = () => {
    setCurrentDeposit({ date: new Date(), currency: 'USD' });
    setEditingDeposit(null);
  };

  const openEditModal = (deposit: Deposit) => {
    setEditingDeposit(deposit);
    setCurrentDeposit(deposit);
    setIsModalOpen(true);
  };
  
  const openNewDepositModal = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const handleDelete = (depositId: string) => {
    setDeposits(deposits.filter(d => d.id !== depositId));
  };

  return (
    <>
      <PageTitle title="Bank Deposits" subtitle="Manage and track all bank deposits." icon={Landmark}>
        <Button onClick={openNewDepositModal}> 
          <PlusCircle className="mr-2 h-4 w-4" /> Add New Deposit
        </Button>
      </PageTitle>

      <Dialog open={isModalOpen} onOpenChange={(isOpen) => {
        setIsModalOpen(isOpen);
        if (!isOpen) resetForm();
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
                <Input id="amount" name="amount" type="number" value={currentDeposit.amount || ''} onChange={handleInputChange} placeholder="e.g., 1500.00" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="currency" className="font-body">Currency</Label>
                <Select value={currentDeposit.currency} onValueChange={handleCurrencyChange}>
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
              <Input id="bank" name="bank" value={currentDeposit.bank || ''} onChange={handleInputChange} placeholder="e.g., Equity Bank" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="referenceNo" className="font-body">Reference No.</Label>
              <Input id="referenceNo" name="referenceNo" value={currentDeposit.referenceNo || ''} onChange={handleInputChange} placeholder="e.g., EQREF001" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="depositedBy" className="font-body">Deposited By</Label>
              <Input id="depositedBy" name="depositedBy" value={currentDeposit.depositedBy || ''} onChange={handleInputChange} placeholder="e.g., John Doe" />
            </div>
            <DialogFooter>
              <DialogClose asChild>
                 <Button type="button" variant="outline" onClick={() => { setIsModalOpen(false); resetForm();}}>Cancel</Button>
              </DialogClose>
              <Button type="submit">{editingDeposit ? "Save Changes" : "Add Deposit"}</Button>
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
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="font-body">Date</TableHead>
                <TableHead className="font-body">Amount</TableHead>
                <TableHead className="font-body">Currency</TableHead>
                <TableHead className="font-body">Bank</TableHead>
                <TableHead className="font-body">Reference No.</TableHead>
                <TableHead className="font-body">Deposited By</TableHead>
                <TableHead className="text-right font-body">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {deposits.length > 0 ? deposits.map((deposit) => (
                <TableRow key={deposit.id}>
                  <TableCell className="font-body">{format(deposit.date, "PPP")}</TableCell>
                  <TableCell className="font-semibold font-body">{deposit.amount.toFixed(2)}</TableCell>
                  <TableCell className="font-body">{deposit.currency}</TableCell>
                  <TableCell className="font-body">{deposit.bank}</TableCell>
                  <TableCell className="font-body">{deposit.referenceNo}</TableCell>
                  <TableCell className="font-body">{deposit.depositedBy}</TableCell>
                  <TableCell className="text-right space-x-2">
                     <Button variant="ghost" size="icon" onClick={() => openEditModal(deposit)} title="Edit Deposit">
                       <Edit2 className="h-4 w-4" />
                     </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" title="Delete Deposit">
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
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDelete(deposit.id)} className="bg-destructive hover:bg-destructive/90">
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </TableCell>
                </TableRow>
              )) : (
                 <TableRow>
                    <TableCell colSpan={7} className="text-center font-body h-24">No deposits recorded yet.</TableCell>
                 </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </>
  );
}
