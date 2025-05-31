
"use client";

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useToast } from "@/hooks/use-toast";
import { PageTitle } from "@/components/shared/page-title";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Users, PlusCircle, Edit2, Trash2, Loader2 } from "lucide-react";
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

export interface Customer {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  created_at?: string;
  updated_at?: string;
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [currentCustomer, setCurrentCustomer] = useState<Partial<Customer>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const fetchCustomers = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      toast({ title: "Error fetching customers", description: error.message, variant: "destructive" });
    } else {
      setCustomers(data || []);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setCurrentCustomer(prev => ({ ...prev, [name]: value }));
  };

  const resetForm = () => {
    setEditingCustomer(null);
    setCurrentCustomer({});
    setIsModalOpen(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentCustomer.name) {
      toast({ title: "Missing field", description: "Customer name is required.", variant: "destructive" });
      return;
    }
    setIsSubmitting(true);

    const customerToSave = {
      name: currentCustomer.name!,
      email: currentCustomer.email,
      phone: currentCustomer.phone,
      address: currentCustomer.address,
    };

    let error = null;
    if (editingCustomer) {
      const { error: updateError } = await supabase
        .from('customers')
        .update(customerToSave)
        .eq('id', editingCustomer.id);
      error = updateError;
    } else {
      const customerWithId = {
        ...customerToSave,
        id: `cust_${Date.now()}` // Client-side ID generation
      };
      const { error: insertError } = await supabase
        .from('customers')
        .insert([customerWithId]);
      error = insertError;
    }

    if (error) {
      toast({ title: `Error ${editingCustomer ? 'updating' : 'adding'} customer`, description: error.message, variant: "destructive" });
    } else {
      toast({ title: `Customer ${editingCustomer ? 'updated' : 'added'} successfully`, variant: "default" });
      resetForm();
      fetchCustomers();
    }
    setIsSubmitting(false);
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
  
  const handleDeleteCustomer = async (customerId: string) => {
    setIsSubmitting(true);
    const { error } = await supabase
      .from('customers')
      .delete()
      .eq('id', customerId);

    if (error) {
      toast({ title: "Error deleting customer", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Customer deleted successfully", variant: "default" });
      fetchCustomers();
    }
    setIsSubmitting(false);
  };

  return (
    <>
      <PageTitle title="Customer Management" subtitle="Manage your list of customers and patrons." icon={Users}>
        <Button onClick={openNewCustomerModal} disabled={isLoading || isSubmitting}>
          <PlusCircle className="mr-2 h-4 w-4" /> Add New Customer
        </Button>
      </PageTitle>

      <Dialog open={isModalOpen} onOpenChange={(isOpen) => { if (!isSubmitting) setIsModalOpen(isOpen); }}>
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
              <Input id="name" name="name" value={currentCustomer.name || ''} onChange={handleInputChange} required disabled={isSubmitting} />
            </div>
             <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="email" className="font-body">Email (Optional)</Label>
                <Input id="email" name="email" type="email" value={currentCustomer.email || ''} onChange={handleInputChange} disabled={isSubmitting} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="phone" className="font-body">Phone (Optional)</Label>
                <Input id="phone" name="phone" type="tel" value={currentCustomer.phone || ''} onChange={handleInputChange} disabled={isSubmitting} />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="address" className="font-body">Address (Optional)</Label>
              <Textarea id="address" name="address" value={currentCustomer.address || ''} onChange={handleInputChange} disabled={isSubmitting}/>
            </div>
            <DialogFooter>
              <DialogClose asChild><Button type="button" variant="outline" onClick={resetForm} disabled={isSubmitting}>Cancel</Button></DialogClose>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {editingCustomer ? 'Save Changes' : 'Add Customer'}
              </Button>
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
          {isLoading ? (
            <div className="flex justify-center items-center h-24">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
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
                      <Button variant="ghost" size="icon" onClick={() => openEditModal(customer)} title="Edit Customer" disabled={isSubmitting}>
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                           <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" title="Delete Customer" disabled={isSubmitting}>
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
                            <AlertDialogCancel disabled={isSubmitting}>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDeleteCustomer(customer.id)} className="bg-destructive hover:bg-destructive/90" disabled={isSubmitting}>
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
                      <TableCell colSpan={5} className="text-center font-body h-24">No customers registered yet.</TableCell>
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
