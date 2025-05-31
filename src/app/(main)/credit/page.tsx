
"use client";

import React, { useState } from 'react';
import { PageTitle } from "@/components/shared/page-title";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CalendarIcon, CreditCard, PlusCircle, Edit2, Trash2, CheckCircle2 } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
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

interface CreditSale {
  id: string;
  customerName: string;
  itemService: string;
  details?: string;
  amount: number;
  date: Date;
  dueDate?: Date;
  status: CreditStatus;
}

const initialCreditSales: CreditSale[] = [
  { id: 'cred1', customerName: 'Alice Wonderland', itemService: 'Room 201 - 3 Nights', amount: 450, date: new Date(2024, 6, 15), dueDate: new Date(2024, 6, 22), status: 'Pending' },
  { id: 'cred2', customerName: 'Bob The Builder', itemService: 'Conference Hall A - Full Day', amount: 300, date: new Date(2024, 6, 10), dueDate: new Date(2024, 6, 17), status: 'Paid' },
  { id: 'cred3', customerName: 'Charlie Brown', itemService: 'Restaurant - Group Dinner', amount: 180, date: new Date(2024, 5, 20), dueDate: new Date(2024, 5, 27), status: 'Overdue' },
];

export default function CreditPage() {
  const [creditSales, setCreditSales] = useState<CreditSale[]>(initialCreditSales);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSale, setEditingSale] = useState<CreditSale | null>(null);
  const [currentSale, setCurrentSale] = useState<Partial<CreditSale>>({ date: new Date(), status: 'Pending' });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setCurrentSale(prev => ({ ...prev, [name]: name === 'amount' ? parseFloat(value) || 0 : value }));
  };
  
  const handleDateChange = (field: 'date' | 'dueDate', dateVal: Date | undefined) => {
    setCurrentSale(prev => ({ ...prev, [field]: dateVal }));
  };

  const handleStatusChange = (value: string) => {
    setCurrentSale(prev => ({ ...prev, status: value as CreditStatus }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentSale.customerName || !currentSale.itemService || !currentSale.amount || !currentSale.date) {
      alert("Please fill all required fields"); // Replace with toast
      return;
    }

    const saleToSave: CreditSale = {
      id: editingSale ? editingSale.id : `cred${Date.now()}`,
      customerName: currentSale.customerName!,
      itemService: currentSale.itemService!,
      details: currentSale.details,
      amount: currentSale.amount!,
      date: currentSale.date!,
      dueDate: currentSale.dueDate,
      status: currentSale.status || 'Pending',
    };

    if (editingSale) {
      setCreditSales(creditSales.map(s => s.id === editingSale.id ? saleToSave : s));
    } else {
      setCreditSales([saleToSave, ...creditSales]);
    }
    
    setIsModalOpen(false);
    setEditingSale(null);
    setCurrentSale({ date: new Date(), status: 'Pending' });
  };

  const openEditModal = (sale: CreditSale) => {
    setEditingSale(sale);
    setCurrentSale(sale);
    setIsModalOpen(true);
  };

  const openNewSaleModal = () => {
    setEditingSale(null);
    setCurrentSale({ date: new Date(), status: 'Pending' });
    setIsModalOpen(true);
  };
  
  const handleDeleteSale = (saleId: string) => {
    setCreditSales(creditSales.filter(s => s.id !== saleId));
  };

  const markAsPaid = (saleId: string) => {
    setCreditSales(creditSales.map(s => s.id === saleId ? {...s, status: 'Paid'} : s));
  };

  const getStatusBadgeVariant = (status: CreditStatus) => {
    switch (status) {
      case 'Paid': return 'default'; // default is usually primary
      case 'Pending': return 'secondary';
      case 'Overdue': return 'destructive';
      default: return 'outline';
    }
  };


  return (
    <>
      <PageTitle title="Credit Management" subtitle="Track and manage items/services sold on credit." icon={CreditCard}>
        <Button onClick={openNewSaleModal}>
          <PlusCircle className="mr-2 h-4 w-4" /> Add New Credit Sale
        </Button>
      </PageTitle>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-headline">{editingSale ? 'Edit Credit Sale' : 'Add New Credit Sale'}</DialogTitle>
            <DialogDescription className="font-body">
              {editingSale ? 'Update the details of this credit transaction.' : 'Enter details for a new item/service sold on credit.'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="customerName" className="font-body">Customer Name</Label>
              <Input id="customerName" name="customerName" value={currentSale.customerName || ''} onChange={handleInputChange} required />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="itemService" className="font-body">Item/Service Sold</Label>
              <Input id="itemService" name="itemService" value={currentSale.itemService || ''} onChange={handleInputChange} required />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="details" className="font-body">Details (Optional)</Label>
              <Textarea id="details" name="details" value={currentSale.details || ''} onChange={handleInputChange} />
            </div>
             <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                    <Label htmlFor="amount" className="font-body">Amount</Label>
                    <Input id="amount" name="amount" type="number" value={currentSale.amount || ''} onChange={handleInputChange} required />
                </div>
                <div className="grid gap-2">
                    <Label htmlFor="status" className="font-body">Status</Label>
                    <Select value={currentSale.status} onValueChange={handleStatusChange}>
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
                    <Button variant={"outline"} className={cn("w-full justify-start text-left font-normal", !currentSale.date && "text-muted-foreground")}>
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {currentSale.date ? format(currentSale.date, "PPP") : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={currentSale.date} onSelect={(d) => handleDateChange('date',d)} initialFocus /></PopoverContent>
                </Popover>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="dueDate" className="font-body">Due Date (Optional)</Label>
                 <Popover>
                  <PopoverTrigger asChild>
                    <Button variant={"outline"} className={cn("w-full justify-start text-left font-normal", !currentSale.dueDate && "text-muted-foreground")}>
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {currentSale.dueDate ? format(currentSale.dueDate, "PPP") : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={currentSale.dueDate} onSelect={(d) => handleDateChange('dueDate',d)} /></PopoverContent>
                </Popover>
              </div>
            </div>
            <DialogFooter>
              <DialogClose asChild><Button type="button" variant="outline" onClick={() => {setIsModalOpen(false); setEditingSale(null); setCurrentSale({date: new Date(), status:'Pending'}); }}>Cancel</Button></DialogClose>
              <Button type="submit">{editingSale ? 'Save Changes' : 'Add Sale'}</Button>
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
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="font-body">Customer</TableHead>
                <TableHead className="font-body">Item/Service</TableHead>
                <TableHead className="font-body">Amount</TableHead>
                <TableHead className="font-body">Date</TableHead>
                <TableHead className="font-body">Due Date</TableHead>
                <TableHead className="font-body">Status</TableHead>
                <TableHead className="text-right font-body">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {creditSales.length > 0 ? creditSales.map((sale) => (
                <TableRow key={sale.id}>
                  <TableCell className="font-semibold font-body">{sale.customerName}</TableCell>
                  <TableCell className="font-body">{sale.itemService}</TableCell>
                  <TableCell className="font-body">${sale.amount.toFixed(2)}</TableCell>
                  <TableCell className="font-body">{format(sale.date, "PP")}</TableCell>
                  <TableCell className="font-body">{sale.dueDate ? format(sale.dueDate, "PP") : 'N/A'}</TableCell>
                  <TableCell><Badge variant={getStatusBadgeVariant(sale.status)} className="font-body">{sale.status}</Badge></TableCell>
                  <TableCell className="text-right space-x-1">
                    {sale.status !== 'Paid' && (
                      <Button variant="ghost" size="icon" onClick={() => markAsPaid(sale.id)} title="Mark as Paid">
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                      </Button>
                    )}
                    <Button variant="ghost" size="icon" onClick={() => openEditModal(sale)} title="Edit Sale">
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                         <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" title="Delete Sale">
                           <Trash2 className="h-4 w-4" />
                         </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle className="font-headline">Delete Credit Sale?</AlertDialogTitle>
                          <AlertDialogDescription className="font-body">
                            Are you sure you want to delete this credit sale for "{sale.customerName}"? This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDeleteSale(sale.id)} className="bg-destructive hover:bg-destructive/90">
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </TableCell>
                </TableRow>
              )) : (
                 <TableRow>
                    <TableCell colSpan={7} className="text-center font-body h-24">No credit sales recorded yet.</TableCell>
                 </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </>
  );
}
