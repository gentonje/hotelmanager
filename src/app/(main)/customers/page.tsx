
"use client";

import React, { useState } from 'react';
import { PageTitle } from "@/components/shared/page-title";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Users, PlusCircle, Edit2, Trash2 } from "lucide-react";
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

interface Customer {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
}

const initialCustomers: Customer[] = [
  { id: 'cust1', name: 'Alice Wonderland', email: 'alice.w@example.com', phone: '555-1111', address: '1 Wonder Way, Fantasy Land' },
  { id: 'cust2', name: 'Bob The Builder', email: 'bob.b@example.com', phone: '555-2222', address: '2 Build It Up St, Construction Zone' },
  { id: 'cust3', name: 'Charlie Brown', email: 'charlie.b@example.com', phone: '555-3333', address: '3 Good Grief Pl, Toon Town' },
];

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>(initialCustomers);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [currentCustomer, setCurrentCustomer] = useState<Partial<Customer>>({});

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setCurrentCustomer(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentCustomer.name) {
      alert("Customer name is required."); // Replace with toast
      return;
    }

    const customerToSave: Customer = {
      id: editingCustomer ? editingCustomer.id : `cust${Date.now()}`,
      name: currentCustomer.name!,
      email: currentCustomer.email,
      phone: currentCustomer.phone,
      address: currentCustomer.address,
    };

    if (editingCustomer) {
      setCustomers(customers.map(c => c.id === editingCustomer.id ? customerToSave : c));
    } else {
      setCustomers([customerToSave, ...customers]);
    }
    
    setIsModalOpen(false);
    setEditingCustomer(null);
    setCurrentCustomer({});
  };

  const openEditModal = (customer: Customer) => {
    setEditingCustomer(customer);
    setCurrentCustomer(customer);
    setIsModalOpen(true);
  };

  const openNewCustomerModal = () => {
    setEditingCustomer(null);
    setCurrentCustomer({});
    setIsModalOpen(true);
  };
  
  const handleDeleteCustomer = (customerId: string) => {
    setCustomers(customers.filter(c => c.id !== customerId));
  };

  return (
    <>
      <PageTitle title="Customer Management" subtitle="Manage your list of customers and patrons." icon={Users}>
        <Button onClick={openNewCustomerModal}>
          <PlusCircle className="mr-2 h-4 w-4" /> Add New Customer
        </Button>
      </PageTitle>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-headline">{editingCustomer ? 'Edit Customer' : 'Add New Customer'}</DialogTitle>
            <DialogDescription className="font-body">
              {editingCustomer ? 'Update the details of this customer.' : 'Enter details for a new customer.'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name" className="font-body">Customer Name</Label>
              <Input id="name" name="name" value={currentCustomer.name || ''} onChange={handleInputChange} required />
            </div>
             <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="email" className="font-body">Email (Optional)</Label>
                <Input id="email" name="email" type="email" value={currentCustomer.email || ''} onChange={handleInputChange} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="phone" className="font-body">Phone (Optional)</Label>
                <Input id="phone" name="phone" type="tel" value={currentCustomer.phone || ''} onChange={handleInputChange} />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="address" className="font-body">Address (Optional)</Label>
              <Textarea id="address" name="address" value={currentCustomer.address || ''} onChange={handleInputChange} />
            </div>
            <DialogFooter>
              <DialogClose asChild><Button type="button" variant="outline" onClick={() => {setIsModalOpen(false); setEditingCustomer(null); setCurrentCustomer({}); }}>Cancel</Button></DialogClose>
              <Button type="submit">{editingCustomer ? 'Save Changes' : 'Add Customer'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="font-headline">Customers List</CardTitle>
           <CardDescription className="font-body">All registered customers.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="font-body">Name</TableHead>
                <TableHead className="font-body">Email</TableHead>
                <TableHead className="font-body">Phone</TableHead>
                <TableHead className="font-body">Address</TableHead>
                <TableHead className="text-right font-body">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {customers.length > 0 ? customers.map((customer) => (
                <TableRow key={customer.id}>
                  <TableCell className="font-semibold font-body">{customer.name}</TableCell>
                  <TableCell className="font-body">{customer.email || 'N/A'}</TableCell>
                  <TableCell className="font-body">{customer.phone || 'N/A'}</TableCell>
                  <TableCell className="font-body">{customer.address || 'N/A'}</TableCell>
                  <TableCell className="text-right space-x-1">
                    <Button variant="ghost" size="icon" onClick={() => openEditModal(customer)} title="Edit Customer">
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                         <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" title="Delete Customer">
                           <Trash2 className="h-4 w-4" />
                         </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle className="font-headline">Delete Customer?</AlertDialogTitle>
                          <AlertDialogDescription className="font-body">
                            Are you sure you want to delete the customer "{customer.name}"? This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDeleteCustomer(customer.id)} className="bg-destructive hover:bg-destructive/90">
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </TableCell>
                </TableRow>
              )) : (
                 <TableRow>
                    <TableCell colSpan={5} className="text-center font-body h-24">No customers registered yet.</TableCell>
                 </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </>
  );
}
