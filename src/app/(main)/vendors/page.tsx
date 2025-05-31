
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
import { Truck, PlusCircle, Edit2, Trash2, Loader2 } from "lucide-react";
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

export interface Vendor {
  id: string;
  name: string;
  contact_person?: string;
  email?: string;
  phone?: string;
  address?: string;
  created_at?: string;
  updated_at?: string;
}

export default function VendorsPage() {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingVendor, setEditingVendor] = useState<Vendor | null>(null);
  const [currentVendor, setCurrentVendor] = useState<Partial<Vendor>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const fetchVendors = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('vendors')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      toast({ title: "Error fetching vendors", description: error.message, variant: "destructive" });
    } else {
      setVendors(data || []);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchVendors();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setCurrentVendor(prev => ({ ...prev, [name]: value }));
  };

  const resetForm = () => {
    setEditingVendor(null);
    setCurrentVendor({});
    setIsModalOpen(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentVendor.name) {
      toast({ title: "Missing field", description: "Vendor name is required.", variant: "destructive" });
      return;
    }
    setIsSubmitting(true);

    const vendorToSave = {
      name: currentVendor.name!,
      contact_person: currentVendor.contact_person,
      email: currentVendor.email,
      phone: currentVendor.phone,
      address: currentVendor.address,
    };

    let error = null;
    if (editingVendor) {
      const { error: updateError } = await supabase
        .from('vendors')
        .update(vendorToSave)
        .eq('id', editingVendor.id);
      error = updateError;
    } else {
      const vendorWithId = {
        ...vendorToSave,
        id: `vendor_${Date.now()}` // Client-side ID generation
      };
      const { error: insertError } = await supabase
        .from('vendors')
        .insert([vendorWithId]);
      error = insertError;
    }

    if (error) {
      toast({ title: `Error ${editingVendor ? 'updating' : 'adding'} vendor`, description: error.message, variant: "destructive" });
    } else {
      toast({ title: `Vendor ${editingVendor ? 'updated' : 'added'} successfully`, variant: "default" });
      resetForm();
      fetchVendors();
    }
    setIsSubmitting(false);
  };

  const openEditModal = (vendor: Vendor) => {
    setEditingVendor(vendor);
    setCurrentVendor(vendor);
    setIsModalOpen(true);
  };

  const openNewVendorModal = () => {
    setEditingVendor(null);
    setCurrentVendor({});
    setIsModalOpen(true);
  };
  
  const handleDeleteVendor = async (vendorId: string) => {
    setIsSubmitting(true);
    const { error } = await supabase
      .from('vendors')
      .delete()
      .eq('id', vendorId);

    if (error) {
      toast({ title: "Error deleting vendor", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Vendor deleted successfully", variant: "default" });
      fetchVendors();
    }
    setIsSubmitting(false);
  };

  return (
    <>
      <PageTitle title="Vendor Management" subtitle="Manage your list of suppliers and service providers." icon={Truck}>
        <Button onClick={openNewVendorModal} disabled={isLoading || isSubmitting}>
          <PlusCircle className="mr-2 h-4 w-4" /> Add New Vendor
        </Button>
      </PageTitle>

      <Dialog open={isModalOpen} onOpenChange={(isOpen) => { if (!isSubmitting) setIsModalOpen(isOpen); }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-headline">{editingVendor ? 'Edit Vendor' : 'Add New Vendor'}</DialogTitle>
            <DialogDescription className="font-body">
              {editingVendor ? 'Update the details of this vendor.' : 'Enter details for a new vendor.'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name" className="font-body">Vendor Name</Label>
              <Input id="name" name="name" value={currentVendor.name || ''} onChange={handleInputChange} required disabled={isSubmitting} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="contact_person" className="font-body">Contact Person (Optional)</Label>
              <Input id="contact_person" name="contact_person" value={currentVendor.contact_person || ''} onChange={handleInputChange} disabled={isSubmitting} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="email" className="font-body">Email (Optional)</Label>
                <Input id="email" name="email" type="email" value={currentVendor.email || ''} onChange={handleInputChange} disabled={isSubmitting}/>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="phone" className="font-body">Phone (Optional)</Label>
                <Input id="phone" name="phone" type="tel" value={currentVendor.phone || ''} onChange={handleInputChange} disabled={isSubmitting}/>
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="address" className="font-body">Address (Optional)</Label>
              <Textarea id="address" name="address" value={currentVendor.address || ''} onChange={handleInputChange} disabled={isSubmitting}/>
            </div>
            <DialogFooter>
              <DialogClose asChild><Button type="button" variant="outline" onClick={resetForm} disabled={isSubmitting}>Cancel</Button></DialogClose>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {editingVendor ? 'Save Changes' : 'Add Vendor'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="font-headline">Vendors List</CardTitle>
           <CardDescription className="font-body">All registered vendors.</CardDescription>
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
                  <TableHead className="font-body">Contact Person</TableHead>
                  <TableHead className="font-body">Email</TableHead>
                  <TableHead className="font-body">Phone</TableHead>
                  <TableHead className="font-body">Address</TableHead>
                  <TableHead className="text-right font-body">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {vendors.length > 0 ? vendors.map((vendor) => (
                  <TableRow key={vendor.id}>
                    <TableCell className="font-semibold font-body">{vendor.name}</TableCell>
                    <TableCell className="font-body">{vendor.contact_person || 'N/A'}</TableCell>
                    <TableCell className="font-body">{vendor.email || 'N/A'}</TableCell>
                    <TableCell className="font-body">{vendor.phone || 'N/A'}</TableCell>
                    <TableCell className="font-body">{vendor.address || 'N/A'}</TableCell>
                    <TableCell className="text-right space-x-1">
                      <Button variant="ghost" size="icon" onClick={() => openEditModal(vendor)} title="Edit Vendor" disabled={isSubmitting}>
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                           <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" title="Delete Vendor" disabled={isSubmitting}>
                             <Trash2 className="h-4 w-4" />
                           </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle className="font-headline">Delete Vendor?</AlertDialogTitle>
                            <AlertDialogDescription className="font-body">
                              Are you sure you want to delete the vendor "{vendor.name}"? This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel disabled={isSubmitting}>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDeleteVendor(vendor.id)} className="bg-destructive hover:bg-destructive/90" disabled={isSubmitting}>
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
                      <TableCell colSpan={6} className="text-center font-body h-24">No vendors registered yet.</TableCell>
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
