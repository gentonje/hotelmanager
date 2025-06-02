
"use client";

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useToast } from "@/hooks/use-toast";
import { PageTitle } from "@/components/shared/page-title";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Archive, PlusCircle, Edit2, Trash2, MinusCircle, PackagePlus, Loader2 } from "lucide-react";
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
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon } from "lucide-react";
import { format, parseISO } from "date-fns";
import { cn } from "@/lib/utils";


export interface InventoryItem {
  id: string;
  name: string;
  category: string;
  current_stock: number;
  unit: string;
  reorder_level: number;
  supplier?: string;
  last_restock_date?: string; 
  inventory_section: InventorySection; 
  created_at?: string;
  updated_at?: string;
}

interface FormInventoryItem extends Omit<InventoryItem, 'last_restock_date'> {
  last_restock_date?: Date;
}


type InventorySection = 'bar' | 'rooms' | 'halls';

export default function InventoryPage() {
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [currentItem, setCurrentItem] = useState<Partial<FormInventoryItem>>({});
  const [activeSection, setActiveSection] = useState<InventorySection>('bar');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const fetchInventoryItems = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('inventory_items')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      toast({ title: "Error fetching inventory items", description: error.message, variant: "destructive" });
    } else {
      setInventoryItems(data || []);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchInventoryItems();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setCurrentItem(prev => ({ ...prev, [name]: name === 'current_stock' || name === 'reorder_level' ? parseInt(value) || 0 : value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setCurrentItem(prev => ({ ...prev, [name]: value }));
  };
  
  const handleDateChange = (dateVal: Date | undefined) => {
    setCurrentItem(prev => ({ ...prev, last_restock_date: dateVal }));
  };

  const resetForm = () => {
    setEditingItem(null);
    setCurrentItem({});
    setIsModalOpen(false);
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentItem.name || !currentItem.category || currentItem.current_stock === undefined || !currentItem.unit || currentItem.reorder_level === undefined) {
        toast({ title: "Missing fields", description: "Please fill all required inventory item details.", variant: "destructive" });
        return;
    }
    setIsSubmitting(true);

    const itemToSave = {
      name: currentItem.name!,
      category: currentItem.category!,
      current_stock: currentItem.current_stock!,
      unit: currentItem.unit!,
      reorder_level: currentItem.reorder_level!,
      supplier: currentItem.supplier,
      last_restock_date: currentItem.last_restock_date ? currentItem.last_restock_date.toISOString() : null,
      inventory_section: activeSection,
    };

    let error = null;
    if (editingItem) {
      const { error: updateError } = await supabase
        .from('inventory_items')
        .update(itemToSave)
        .eq('id', editingItem.id);
      error = updateError;
    } else {
      const itemWithId = {
        ...itemToSave,
        id: `${activeSection}_${Date.now()}` 
      };
      const { error: insertError } = await supabase
        .from('inventory_items')
        .insert([itemWithId]);
      error = insertError;
    }

    if (error) {
      toast({ title: `Error ${editingItem ? 'updating' : 'adding'} inventory item`, description: error.message, variant: "destructive" });
    } else {
      toast({ title: `Inventory item ${editingItem ? 'updated' : 'added'} successfully`, variant: "default" });
      resetForm();
      fetchInventoryItems();
    }
    setIsSubmitting(false);
  };

  const openEditModal = (item: InventoryItem) => {
    setEditingItem(item);
    setCurrentItem({
        ...item,
        last_restock_date: item.last_restock_date ? parseISO(item.last_restock_date) : undefined,
    });
    setActiveSection(item.inventory_section);
    setIsModalOpen(true);
  };
  
  const openNewItemModal = (section: InventorySection) => {
    setEditingItem(null);
    setCurrentItem({ inventory_section: section, current_stock: 0, reorder_level: 0 });
    setActiveSection(section);
    setIsModalOpen(true);
  };

  const handleDeleteItem = async (itemId: string) => {
    setIsSubmitting(true);
    const { error } = await supabase
      .from('inventory_items')
      .delete()
      .eq('id', itemId);

    if (error) {
      toast({ title: "Error deleting inventory item", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Inventory item deleted successfully", variant: "default" });
      fetchInventoryItems();
    }
    setIsSubmitting(false);
  };
  
  const handleStockAdjustment = async (itemId: string, adjustmentType: 'in' | 'out', quantity: number) => {
    if (isNaN(quantity) || quantity <= 0) {
      toast({ title: "Invalid quantity", description: "Please enter a valid positive number for stock adjustment.", variant: "destructive" });
      return;
    }
  
    const item = inventoryItems.find(i => i.id === itemId);
    if (!item) return;
  
    let newStock = item.current_stock;
    if (adjustmentType === 'in') {
      newStock += quantity;
    } else {
      newStock -= quantity;
      if (newStock < 0) {
        toast({ title: "Insufficient stock", description: "Cannot stock out more than available.", variant: "destructive" });
        return;
      }
    }
  
    setIsSubmitting(true);
    const { error } = await supabase
      .from('inventory_items')
      .update({ current_stock: newStock, last_restock_date: adjustmentType === 'in' ? new Date().toISOString() : item.last_restock_date })
      .eq('id', itemId);
  
    if (error) {
      toast({ title: "Error adjusting stock", description: error.message, variant: "destructive" });
    } else {
      toast({ title: `Stock ${adjustmentType === 'in' ? 'added' : 'removed'} successfully`, variant: "default" });
      fetchInventoryItems();
    }
    setIsSubmitting(false);
  };


  const filteredItems = inventoryItems.filter(item => item.inventory_section === activeSection);

  const renderInventoryTable = (itemsToRender: InventoryItem[]) => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="font-body">Item Name</TableHead>
          <TableHead className="font-body">Category</TableHead>
          <TableHead className="font-body">Current Stock</TableHead>
          <TableHead className="font-body">Unit</TableHead>
          <TableHead className="font-body">Reorder Level</TableHead>
          <TableHead className="font-body">Supplier</TableHead>
          <TableHead className="font-body">Last Restock</TableHead>
          <TableHead className="text-right font-body">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {itemsToRender.length > 0 ? itemsToRender.map((item) => (
          <TableRow key={item.id} className={item.current_stock <= item.reorder_level ? 'bg-red-100/50 dark:bg-red-900/30 hover:bg-red-200/50 dark:hover:bg-red-800/30' : ''}>
            <TableCell className="font-semibold font-body">{item.name}</TableCell>
            <TableCell className="font-body">{item.category}</TableCell>
            <TableCell className="font-body">{item.current_stock}</TableCell>
            <TableCell className="font-body">{item.unit}</TableCell>
            <TableCell className="font-body">{item.reorder_level}</TableCell>
            <TableCell className="font-body">{item.supplier || 'N/A'}</TableCell>
            <TableCell className="font-body">{item.last_restock_date ? format(parseISO(item.last_restock_date), "PP") : 'N/A'}</TableCell>
            <TableCell className="text-right space-x-1">
              <Button variant="ghost" size="icon" onClick={() => {
                  const qty = parseInt(prompt(`Enter quantity to stock IN for ${item.name}:`) || "0");
                  if (qty > 0) handleStockAdjustment(item.id, 'in', qty);
                }} title="Stock In" disabled={isSubmitting}>
                <PackagePlus className="h-4 w-4 text-green-600" />
              </Button>
              <Button variant="ghost" size="icon" onClick={() => {
                  const qty = parseInt(prompt(`Enter quantity to stock OUT for ${item.name}:`) || "0");
                  if (qty > 0) handleStockAdjustment(item.id, 'out', qty);
                }} title="Stock Out" disabled={isSubmitting}>
                <MinusCircle className="h-4 w-4 text-orange-600" />
              </Button>
              <Button variant="ghost" size="icon" onClick={() => openEditModal(item)} disabled={isSubmitting}>
                <Edit2 className="h-4 w-4" />
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" disabled={isSubmitting}>
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
                    <AlertDialogCancel disabled={isSubmitting}>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => handleDeleteItem(item.id)}
                      className="bg-destructive hover:bg-destructive/90"
                      disabled={isSubmitting}
                    >
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
                <TableCell colSpan={8} className="text-center font-body h-24">No inventory items found in this section.</TableCell>
            </TableRow>
        )}
      </TableBody>
    </Table>
  );

  return (
    <>
      <PageTitle title="Inventory Management" subtitle="Track stock levels across various hotel sections." icon={Archive} />

      <Dialog open={isModalOpen} onOpenChange={(isOpen) => { if(!isSubmitting) setIsModalOpen(isOpen); }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-headline">{editingItem ? 'Edit Item' : 'Add New Item'} to {activeSection.charAt(0).toUpperCase() + activeSection.slice(1)}</DialogTitle>
            <DialogDescription className="font-body">
              {editingItem ? 'Update details for this inventory item.' : `Add a new item to the ${activeSection} inventory.`}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-1 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name" className="font-body">Item Name</Label>
              <Input id="name" name="name" value={currentItem.name || ''} onChange={handleInputChange} required disabled={isSubmitting} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="category" className="font-body">Category</Label>
              <Input id="category" name="category" value={currentItem.category || ''} onChange={handleInputChange} required disabled={isSubmitting} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="current_stock" className="font-body">Current Stock</Label>
                <Input id="current_stock" name="current_stock" type="number" value={currentItem.current_stock === undefined ? '' : currentItem.current_stock} onChange={handleInputChange} required disabled={isSubmitting} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="unit" className="font-body">Unit</Label>
                 <Select name="unit" value={currentItem.unit || ''} onValueChange={(value) => handleSelectChange('unit', value)} disabled={isSubmitting}>
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
            <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                    <Label htmlFor="reorder_level" className="font-body">Reorder Level</Label>
                    <Input id="reorder_level" name="reorder_level" type="number" value={currentItem.reorder_level === undefined ? '' : currentItem.reorder_level} onChange={handleInputChange} required disabled={isSubmitting} />
                </div>
                 <div className="grid gap-2">
                    <Label htmlFor="last_restock_date" className="font-body">Last Restock Date</Label>
                    <Popover>
                        <PopoverTrigger asChild>
                        <Button variant={"outline"} className={cn("w-full justify-start text-left font-normal", !currentItem.last_restock_date && "text-muted-foreground")} disabled={isSubmitting}>
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {currentItem.last_restock_date ? format(currentItem.last_restock_date, "PPP") : <span>Pick a date</span>}
                        </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={currentItem.last_restock_date} onSelect={handleDateChange} /></PopoverContent>
                    </Popover>
                </div>
            </div>
             <div className="grid gap-2">
              <Label htmlFor="supplier" className="font-body">Supplier (Optional)</Label>
              <Input id="supplier" name="supplier" value={currentItem.supplier || ''} onChange={handleInputChange} disabled={isSubmitting} />
            </div>
            <DialogFooter>
              <DialogClose asChild><Button type="button" variant="outline" onClick={resetForm} disabled={isSubmitting}>Cancel</Button></DialogClose>
              <Button type="submit" disabled={isSubmitting}>
                 {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {editingItem ? 'Save Changes' : 'Add Item'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Tabs defaultValue="bar" onValueChange={(value) => setActiveSection(value as InventorySection)} className="w-full m-2">
        <div className="flex justify-between items-center mb-4">
          <TabsList>
            <TabsTrigger value="bar" className="font-body">Bar</TabsTrigger>
            <TabsTrigger value="rooms" className="font-body">Hotel Rooms</TabsTrigger>
            <TabsTrigger value="halls" className="font-body">Training Halls</TabsTrigger>
          </TabsList>
          <Button onClick={() => openNewItemModal(activeSection)} disabled={isLoading || isSubmitting}>
            <PlusCircle className="mr-2 h-4 w-4" /> Add New Item to {activeSection.charAt(0).toUpperCase() + activeSection.slice(1)}
          </Button>
        </div>
        {isLoading ? (
            <div className="flex justify-center items-center h-64">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
            </div>
        ) : (
            <>
                <TabsContent value="bar">
                <Card className="shadow-lg m-2">
                    <CardHeader>
                    <CardTitle className="font-headline">Bar Inventory</CardTitle>
                    <CardDescription className="font-body">Stock of beverages and other bar supplies.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-1">
                    {renderInventoryTable(filteredItems)}
                    </CardContent>
                </Card>
                </TabsContent>

                <TabsContent value="rooms">
                <Card className="shadow-lg m-2">
                    <CardHeader>
                    <CardTitle className="font-headline">Hotel Room Inventory</CardTitle>
                    <CardDescription className="font-body">Linens, consumables, and other room amenities.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-1">
                    {renderInventoryTable(filteredItems)}
                    </CardContent>
                </Card>
                </TabsContent>

                <TabsContent value="halls">
                <Card className="shadow-lg m-2">
                    <CardHeader>
                    <CardTitle className="font-headline">Training Hall Inventory</CardTitle>
                    <CardDescription className="font-body">Equipment and supplies for training halls.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-1">
                    {renderInventoryTable(filteredItems)}
                    </CardContent>
                </Card>
                </TabsContent>
            </>
        )}
      </Tabs>
    </>
  );
}
