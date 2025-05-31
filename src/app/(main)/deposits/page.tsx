
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

interface Deposit {
  id: string;
  date: Date;
  amount: number;
  bank: string;
  referenceNo: string;
  depositedBy: string;
}

const initialDeposits: Deposit[] = [];

export default function DepositsPage() {
  const [deposits, setDeposits] = useState<Deposit[]>(initialDeposits);
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [amount, setAmount] = useState('');
  const [bank, setBank] = useState('');
  const [referenceNo, setReferenceNo] = useState('');
  const [depositedBy, setDepositedBy] = useState('');
  const [editingDeposit, setEditingDeposit] = useState<Deposit | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!date || !amount || !bank || !referenceNo || !depositedBy) {
      alert("Please fill all fields"); // Replace with a proper toast notification
      return;
    }
    const newDeposit: Deposit = {
      id: editingDeposit ? editingDeposit.id : `dep${Date.now()}`,
      date,
      amount: parseFloat(amount),
      bank,
      referenceNo,
      depositedBy,
    };

    if (editingDeposit) {
      setDeposits(deposits.map(d => d.id === editingDeposit.id ? newDeposit : d));
    } else {
      setDeposits([newDeposit, ...deposits]);
    }
    resetForm();
  };

  const resetForm = () => {
    setDate(new Date());
    setAmount('');
    setBank('');
    setReferenceNo('');
    setDepositedBy('');
    setEditingDeposit(null);
  };

  const handleEdit = (deposit: Deposit) => {
    setEditingDeposit(deposit);
    setDate(deposit.date);
    setAmount(deposit.amount.toString());
    setBank(deposit.bank);
    setReferenceNo(deposit.referenceNo);
    setDepositedBy(deposit.depositedBy);
  };
  
  const handleDelete = (depositId: string) => {
    setDeposits(deposits.filter(d => d.id !== depositId));
  };

  return (
    <>
      <PageTitle title="Bank Deposits" subtitle="Manage and track all bank deposits." icon={Landmark}>
        <Dialog open={editingDeposit !== null} onOpenChange={(isOpen) => !isOpen && resetForm()}>
          <DialogTrigger asChild>
            <Button onClick={() => setEditingDeposit(null)}> 
              <PlusCircle className="mr-2 h-4 w-4" /> Add New Deposit
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[525px]">
            <DialogHeader>
              <DialogTitle className="font-headline">{editingDeposit ? "Edit Deposit" : "Add New Deposit"}</DialogTitle>
              <DialogDescription className="font-body">
                {editingDeposit ? "Update the details of the bank deposit." : "Enter the details of the new bank deposit."}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="date" className="text-right font-body">Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-[280px] justify-start text-left font-normal col-span-3",
                        !date && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {date ? format(date, "PPP") : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar mode="single" selected={date} onSelect={setDate} initialFocus />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="amount" className="text-right font-body">Amount</Label>
                <Input id="amount" type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="e.g., 1500.00" className="col-span-3" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="bank" className="text-right font-body">Bank</Label>
                <Input id="bank" value={bank} onChange={(e) => setBank(e.target.value)} placeholder="e.g., Equity Bank" className="col-span-3" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="referenceNo" className="text-right font-body">Reference No.</Label>
                <Input id="referenceNo" value={referenceNo} onChange={(e) => setReferenceNo(e.target.value)} placeholder="e.g., EQREF001" className="col-span-3" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="depositedBy" className="text-right font-body">Deposited By</Label>
                <Input id="depositedBy" value={depositedBy} onChange={(e) => setDepositedBy(e.target.value)} placeholder="e.g., John Doe" className="col-span-3" />
              </div>
              <DialogFooter>
                <DialogClose asChild>
                   <Button type="button" variant="outline" onClick={resetForm}>Cancel</Button>
                </DialogClose>
                <Button type="submit">{editingDeposit ? "Save Changes" : "Add Deposit"}</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </PageTitle>

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
                  <TableCell className="font-semibold font-body">${deposit.amount.toFixed(2)}</TableCell>
                  <TableCell className="font-body">{deposit.bank}</TableCell>
                  <TableCell className="font-body">{deposit.referenceNo}</TableCell>
                  <TableCell className="font-body">{deposit.depositedBy}</TableCell>
                  <TableCell className="text-right space-x-2">
                    <DialogTrigger asChild>
                       <Button variant="ghost" size="icon" onClick={() => handleEdit(deposit)}>
                         <Edit2 className="h-4 w-4" />
                       </Button>
                    </DialogTrigger>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive">
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
                    <TableCell colSpan={6} className="text-center font-body h-24">No deposits recorded yet.</TableCell>
                 </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </>
  );
}

