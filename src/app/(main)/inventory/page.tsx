
"use client";

import React, { useState } from 'react';
import { PageTitle } from "@/components/shared/page-title";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Archive, PlusCircle, Edit2, Trash2, MinusCircle, PackagePlus } from "lucide-react";
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
import { Textarea } from "@/components/ui/textarea";
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


interface InventoryItem {
  id: string;
  name: string;
  category: string;
  currentStock: number;
  unit: string;
  reorderLevel: number;
  supplier?: string;
  lastRestockDate?: Date;
}

const initialBarInventory: InventoryItem[] = [
  { id: 'bar1', name: 'Whiskey A', category: 'Spirits', currentStock: 20, unit: 'Bottles', reorderLevel: 5, supplier: 'Drinks Inc.' },
  { id: 'bar2', name: 'Vodka B', category: 'Spirits', currentStock: 15, unit: 'Bottles', reorderLevel: 5, supplier: 'Bev Ltd.' },
  { id: 'bar3', name: 'Red Wine C', category: 'Wine', currentStock: 30, unit: 'Bottles', reorderLevel: 10, supplier: 'Vino Co.' },
  { id: 'bar4', name: 'Beer D', category: 'Beer', currentStock: 50, unit: 'Cases', reorderLevel: 10, supplier: 'Hops & Barley' },
];

const initialRoomInventory: InventoryItem[] = [
  { id: 'room1', name: 'Bedsheets (Queen)', category: 'Linen', currentStock: 100, unit: 'Sets', reorderLevel: 20 },
  { id: 'room2', name: 'Towels (Bath)', category: 'Linen', currentStock: 150, unit: 'Pieces', reorderLevel: 30 },
  { id: 'room3', name: 'Toilet Rolls', category: 'Consumables', currentStock: 200, unit: 'Rolls', reorderLevel: 50 },
  { id: 'room4', name: 'Soap Bars', category: 'Consumables', currentStock: 300, unit: 'Pieces', reorderLevel: 50 },
];

type InventorySection = 'bar' | 'rooms' | 'halls';

export default function InventoryPage() {
  const [barInventory, setBarInventory] = useState<InventoryItem[]>(initialBarInventory);
  const [roomInventory, setRoomInventory] = useState<InventoryItem[]>(initialRoomInventory);
  // Add state for training halls inventory if needed
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [currentItem, setCurrentItem] = useState<Partial<InventoryItem>>({});
  const [activeSection, setActiveSection] = useState<InventorySection>('bar');


  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setCurrentItem(prev => ({ ...prev, [name]: name === 'currentStock' || name === 'reorderLevel' ? parseInt(value) || 0 : value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setCurrentItem(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const itemToSave: InventoryItem = {
      id: editingItem ? editingItem.id : `${activeSection}-${Date.now()}`,
      name: currentItem.name || '',
      category: currentItem.category || '',
      currentStock: currentItem.currentStock || 0,
      unit: currentItem.unit || '',
      reorderLevel: currentItem.reorderLevel || 0,
      supplier: currentItem.supplier,
      lastRestockDate: currentItem.lastRestockDate ? new Date(currentItem.lastRestockDate) : undefined,
    };

    const updateInventoryList = (list: InventoryItem[], setList: React.Dispatch<React.SetStateAction<InventoryItem[]>>) => {
      if (editingItem) {
        setList(list.map(item => item.id === editingItem.id ? itemToSave : item));
      } else {
        setList([itemToSave, ...list]);
      }
    };

    if (activeSection === 'bar') updateInventoryList(barInventory, setBarInventory);
    if (activeSection === 'rooms') updateInventoryList(roomInventory, setRoomInventory);
    
    setIsModalOpen(false);
    setEditingItem(null);
    setCurrentItem({});
  };

  const openEditModal = (item: InventoryItem, section: InventorySection) => {
    setEditingItem(item);
    setCurrentItem(item);
    setActiveSection(section);
    setIsModalOpen(true);
  };
  
  const openNewItemModal = (section: InventorySection) => {
    setEditingItem(null);
    setCurrentItem({});
    setActiveSection(section);
    setIsModalOpen(true);
  };

  const handleDeleteItem = (itemId: string, section: InventorySection) => {
    const confirmDelete = () => {
      if (section === 'bar') setBarInventory(barInventory.filter(item => item.id !== itemId));
      if (section === 'rooms') setRoomInventory(roomInventory.filter(item => item.id !== itemId));
    };
    // This should trigger an AlertDialog component
    // For simplicity, directly calling confirmDelete. In real app, use AlertDialog.
    // This is a placeholder for AlertDialog logic.
    return confirmDelete; 
  };


  const renderInventoryTable = (items: InventoryItem[], section: InventorySection) => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="font-body">Item Name</TableHead>
          <TableHead className="font-body">Category</TableHead>
          <TableHead className="font-body">Current Stock</TableHead>
          <TableHead className="font-body">Unit</TableHead>
          <TableHead className="font-body">Reorder Level</TableHead>
          <TableHead className="font-body">Supplier</TableHead>
          <TableHead className="text-right font-body">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {items.length > 0 ? items.map((item) => (
          <TableRow key={item.id} className={item.currentStock <= item.reorderLevel ? 'bg-red-100/50 dark:bg-red-900/30 hover:bg-red-200/50 dark:hover:bg-red-800/30' : ''}>
            <TableCell className="font-semibold font-body">{item.name}</TableCell>
            <TableCell className="font-body">{item.category}</TableCell>
            <TableCell className="font-body">{item.currentStock}</TableCell>
            <TableCell className="font-body">{item.unit}</TableCell>
            <TableCell className="font-body">{item.reorderLevel}</TableCell>
            <TableCell className="font-body">{item.supplier || 'N/A'}</TableCell>
            <TableCell className="text-right space-x-1">
              <Button variant="ghost" size="icon" onClick={() => alert('Stock In: ' + item.name)}>
                <PackagePlus className="h-4 w-4 text-green-600" />
              </Button>
              <Button variant="ghost" size="icon" onClick={() => alert('Stock Out: ' + item.name)}>
                <MinusCircle className="h-4 w-4 text-orange-600" />
              </Button>
              <Button variant="ghost" size="icon" onClick={() => openEditModal(item, section)}>
                <Edit2 className="h-4 w-4" />
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle className="font-headline">Delete Inventory Item?</AlertDialogTitle>
                    <AlertDialogDescription className="font-body">
                      Are you sure you want to delete "{item.name}"? This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleDeleteItem(item.id, section)}
                      className="bg-destructive hover:bg-destructive/90"
                    >
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </TableCell>
          </TableRow>
        )) : (
            <TableRow>
                <TableCell colSpan={7} className="text-center font-body h-24">No inventory items found in this section.</TableCell>
            </TableRow>
        )}
      </TableBody>
    </Table>
  );

  return (
    <>
      <PageTitle title="Inventory Management" subtitle="Track stock levels across various hotel sections." icon={Archive} />

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-headline">{editingItem ? 'Edit Item' : 'Add New Item'} to {activeSection.charAt(0).toUpperCase() + activeSection.slice(1)}</DialogTitle>
            <DialogDescription className="font-body">
              {editingItem ? 'Update details for this inventory item.' : `Add a new item to the ${activeSection} inventory.`}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name" className="font-body">Item Name</Label>
              <Input id="name" name="name" value={currentItem.name || ''} onChange={handleInputChange} required />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="category" className="font-body">Category</Label>
              <Input id="category" name="category" value={currentItem.category || ''} onChange={handleInputChange} required />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="currentStock" className="font-body">Current Stock</Label>
                <Input id="currentStock" name="currentStock" type="number" value={currentItem.currentStock || ''} onChange={handleInputChange} required />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="unit" className="font-body">Unit</Label>
                 <Select name="unit" value={currentItem.unit || ''} onValueChange={(value) => handleSelectChange('unit', value)}>
                    <SelectTrigger><SelectValue placeholder="Select unit" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Bottles">Bottles</SelectItem>
                      <SelectItem value="Cases">Cases</SelectItem>
                      <SelectItem value="Pieces">Pieces</SelectItem>
                      <SelectItem value="Sets">Sets</SelectItem>
                      <SelectItem value="Rolls">Rolls</SelectItem>
                      <SelectItem value="Kg">Kg</SelectItem>
                      <SelectItem value="Liters">Liters</SelectItem>
                    </SelectContent>
                  </Select>
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="reorderLevel" className="font-body">Reorder Level</Label>
              <Input id="reorderLevel" name="reorderLevel" type="number" value={currentItem.reorderLevel || ''} onChange={handleInputChange} required />
            </div>
             <div className="grid gap-2">
              <Label htmlFor="supplier" className="font-body">Supplier (Optional)</Label>
              <Input id="supplier" name="supplier" value={currentItem.supplier || ''} onChange={handleInputChange} />
            </div>
            <DialogFooter>
              <DialogClose asChild><Button type="button" variant="outline">Cancel</Button></DialogClose>
              <Button type="submit">{editingItem ? 'Save Changes' : 'Add Item'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Tabs defaultValue="bar" className="w-full">
        <div className="flex justify-between items-center mb-4">
          <TabsList>
            <TabsTrigger value="bar" onClick={() => setActiveSection('bar')} className="font-body">Bar</TabsTrigger>
            <TabsTrigger value="rooms" onClick={() => setActiveSection('rooms')} className="font-body">Hotel Rooms</TabsTrigger>
            <TabsTrigger value="halls" onClick={() => setActiveSection('halls')} className="font-body">Training Halls</TabsTrigger>
          </TabsList>
          <Button onClick={() => openNewItemModal(activeSection)}>
            <PlusCircle className="mr-2 h-4 w-4" /> Add New Item to {activeSection.charAt(0).toUpperCase() + activeSection.slice(1)}
          </Button>
        </div>

        <TabsContent value="bar">
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="font-headline">Bar Inventory</CardTitle>
              <CardDescription className="font-body">Stock of beverages and other bar supplies.</CardDescription>
            </CardHeader>
            <CardContent>
              {renderInventoryTable(barInventory, 'bar')}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="rooms">
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="font-headline">Hotel Room Inventory</CardTitle>
              <CardDescription className="font-body">Linens, consumables, and other room amenities.</CardDescription>
            </CardHeader>
            <CardContent>
              {renderInventoryTable(roomInventory, 'rooms')}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="halls">
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="font-headline">Training Hall Inventory</CardTitle>
              <CardDescription className="font-body">Equipment and supplies for training halls.</CardDescription>
            </CardHeader>
            <CardContent>
              {/* Placeholder for training halls inventory table */}
              <p className="text-center text-muted-foreground py-10 font-body">Training Hall inventory tracking coming soon.</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </>
  );
}
