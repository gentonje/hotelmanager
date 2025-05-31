
"use client";

import React, { useState } from 'react';
import { PageTitle } from "@/components/shared/page-title";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Truck, PlusCircle, Edit2, Trash2 } from "lucide-react";
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

interface Vendor {
  id: string;
  name: string;
  contactPerson?: string;
  email?: string;
  phone?: string;
  address?: string;
}

const initialVendors: Vendor[] = [];

export default function VendorsPage() {
  const [vendors, setVendors] = useState<Vendor[]>(initialVendors);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingVendor, setEditingVendor] = useState<Vendor | null>(null);
  const [currentVendor, setCurrentVendor] = useState<Partial<Vendor>>({});

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setCurrentVendor(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentVendor.name) {
      alert("Vendor name is required."); // Replace with toast
      return;
    }

    const vendorToSave: Vendor = {
      id: editingVendor ? editingVendor.id : `vendor${Date.now()}`,
      name: currentVendor.name!,
      contactPerson: currentVendor.contactPerson,
      email: currentVendor.email,
      phone: currentVendor.phone,
      address: currentVendor.address,
    };

    if (editingVendor) {
      setVendors(vendors.map(v => v.id === editingVendor.id ? vendorToSave : v));
    } else {
      setVendors([vendorToSave, ...vendors]);
    }
    
    setIsModalOpen(false);
    setEditingVendor(null);
    setCurrentVendor({});
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
  
  const handleDeleteVendor = (vendorId: string) => {
    setVendors(vendors.filter(v => v.id !== vendorId));
  };

  return (
    <>
      <PageTitle title="Vendor Management" subtitle="Manage your list of suppliers and service providers." icon={Truck}>
        <Button onClick={openNewVendorModal}>
          <PlusCircle className="mr-2 h-4 w-4" /> Add New Vendor
        </Button>
      </PageTitle>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
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
              <Input id="name" name="name" value={currentVendor.name || ''} onChange={handleInputChange} required />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="contactPerson" className="font-body">Contact Person (Optional)</Label>
              <Input id="contactPerson" name="contactPerson" value={currentVendor.contactPerson || ''} onChange={handleInputChange} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="email" className="font-body">Email (Optional)</Label>
                <Input id="email" name="email" type="email" value={currentVendor.email || ''} onChange={handleInputChange} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="phone" className="font-body">Phone (Optional)</Label>
                <Input id="phone" name="phone" type="tel" value={currentVendor.phone || ''} onChange={handleInputChange} />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="address" className="font-body">Address (Optional)</Label>
              <Textarea id="address" name="address" value={currentVendor.address || ''} onChange={handleInputChange} />
            </div>
            <DialogFooter>
              <DialogClose asChild><Button type="button" variant="outline" onClick={() => {setIsModalOpen(false); setEditingVendor(null); setCurrentVendor({}); }}>Cancel</Button></DialogClose>
              <Button type="submit">{editingVendor ? 'Save Changes' : 'Add Vendor'}</Button>
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
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="font-body">Name</TableHead>
                <TableHead className="font-body">Contact Person</TableHead>
                <TableHead className="font-body">Email</TableHead>
                <TableHead className="font-body">Phone</TableHead>
                <TableHead className="text-right font-body">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {vendors.length > 0 ? vendors.map((vendor) => (
                <TableRow key={vendor.id}>
                  <TableCell className="font-semibold font-body">{vendor.name}</TableCell>
                  <TableCell className="font-body">{vendor.contactPerson || 'N/A'}</TableCell>
                  <TableCell className="font-body">{vendor.email || 'N/A'}</TableCell>
                  <TableCell className="font-body">{vendor.phone || 'N/A'}</TableCell>
                  <TableCell className="text-right space-x-1">
                    <Button variant="ghost" size="icon" onClick={() => openEditModal(vendor)} title="Edit Vendor">
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                         <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" title="Delete Vendor">
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
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDeleteVendor(vendor.id)} className="bg-destructive hover:bg-destructive/90">
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </TableCell>
                </TableRow>
              )) : (
                 <TableRow>
                    <TableCell colSpan={5} className="text-center font-body h-24">No vendors registered yet.</TableCell>
                 </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </>
  );
}
