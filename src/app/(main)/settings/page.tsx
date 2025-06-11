
"use client";

import React, { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useToast } from "@/hooks/use-toast";
import { PageTitle } from "@/components/shared/page-title";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Settings, Download, Upload, Trash2, Loader2, AlertTriangle } from "lucide-react";
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

type TableName = 
  | 'banks' | 'customers' | 'vendors' | 'inventory_items' 
  | 'cash_sales' | 'credit_sales' | 'deposits' | 'expenses' | 'credit_purchases' 
  | 'opening_balances';

const exportableTables: { name: TableName, label: string }[] = [
  { name: 'banks', label: 'Banks' },
  { name: 'customers', label: 'Customers' },
  { name: 'vendors', label: 'Vendors' },
  { name: 'inventory_items', label: 'Inventory Items' },
  { name: 'cash_sales', label: 'Cash Sales' },
  { name: 'credit_sales', label: 'Credit Sales' },
  { name: 'deposits', label: 'Deposits' },
  { name: 'expenses', label: 'Expenses' },
  { name: 'credit_purchases', label: 'Credit Purchases' },
  { name: 'opening_balances', label: 'Opening Balances' },
];

const dataGroupsToClear = [
    { 
        label: "Transactional Data", 
        tables: ['cash_sales', 'credit_sales', 'deposits', 'expenses', 'credit_purchases'],
        description: "This will delete all sales, purchases, deposits, and expense records. This action is irreversible."
    },
    { 
        label: "Master Data", 
        tables: ['customers', 'vendors', 'banks', 'inventory_items'],
        description: "This will delete all customers, vendors, bank accounts, and inventory items. This action is irreversible."
    },
    {
        label: "Opening Balances",
        tables: ['opening_balances'],
        description: "This will delete all recorded opening balances. This action is irreversible."
    }
];


export default function SettingsPage() {
  const { toast } = useToast();
  const [isDownloading, setIsDownloading] = useState<TableName | null>(null);
  const [isClearing, setIsClearing] = useState<string | null>(null);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [confirmationText, setConfirmationText] = useState('');

  const convertToCSV = (data: any[]) => {
    if (!data || data.length === 0) return '';
    const headers = Object.keys(data[0]);
    const csvRows = [
      headers.join(','),
      ...data.map(row =>
        headers.map(header => JSON.stringify(row[header] || '')).join(',')
      ),
    ];
    return csvRows.join('\n');
  };

  const downloadCSV = (csvString: string, filename: string) => {
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleDownloadData = async (tableName: TableName) => {
    setIsDownloading(tableName);
    try {
      const { data, error } = await supabase.from(tableName).select('*');
      if (error) throw error;
      if (data && data.length > 0) {
        const csvData = convertToCSV(data);
        downloadCSV(csvData, `${tableName}_export_${new Date().toISOString().split('T')[0]}`);
        toast({ title: "Download Started", description: `Data for ${tableName} is being downloaded.`, variant: "default" });
      } else {
        toast({ title: "No Data", description: `No data found in table ${tableName} to download.`, variant: "default" });
      }
    } catch (error: any) {
      toast({ title: "Download Error", description: `Failed to download data for ${tableName}: ${error.message}`, variant: "destructive" });
    } finally {
      setIsDownloading(null);
    }
  };

  const handleImportFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setImportFile(event.target.files[0]);
    }
  };

  const handleImportData = async () => {
    if (!importFile) {
      toast({ title: "No File Selected", description: "Please select a CSV file to import.", variant: "destructive" });
      return;
    }
    setIsImporting(true);
    // Placeholder for actual import logic
    toast({
      title: "Import Functionality Placeholder",
      description: "Actual data import from CSV is a complex feature requiring robust parsing, validation, and error handling. This UI is a placeholder. For a production app, this would typically involve server-side processing.",
      variant: "default",
      duration: 10000,
    });
    // Simulate import process
    await new Promise(resolve => setTimeout(resolve, 2000));
    setImportFile(null); 
    if (document.getElementById('import-file-input')) {
        (document.getElementById('import-file-input') as HTMLInputElement).value = '';
    }
    setIsImporting(false);
  };

  const handleClearData = async (groupLabel: string, tablesToClear: string[]) => {
    setIsClearing(groupLabel);
    try {
      for (const tableName of tablesToClear) {
        const { error } = await supabase.from(tableName).delete().neq('id', '0'); // Placeholder condition to delete all rows
        if (error) throw new Error(`Error clearing ${tableName}: ${error.message}`);
      }
      toast({ title: "Data Cleared", description: `${groupLabel} has been cleared successfully.`, variant: "default" });
    } catch (error: any) {
      toast({ title: "Clear Data Error", description: error.message, variant: "destructive" });
    } finally {
      setIsClearing(null);
      setConfirmationText('');
    }
  };


  return (
    <>
      <PageTitle title="Settings & Data Management" subtitle="Manage your application data, export, import, or reset." icon={Settings} />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
        <Card className="shadow-lg">
          <CardHeader className="p-4">
            <CardTitle className="font-headline flex items-center"><Download className="mr-2 h-5 w-5" /> Data Export</CardTitle>
            <CardDescription className="font-body">Download your data from various tables as CSV files.</CardDescription>
          </CardHeader>
          <CardContent className="p-4 space-y-2">
            {exportableTables.map(table => (
              <Button
                key={table.name}
                variant="outline"
                className="w-full justify-start"
                onClick={() => handleDownloadData(table.name)}
                disabled={isDownloading === table.name}
              >
                {isDownloading === table.name ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Download className="mr-2 h-4 w-4" />
                )}
                Download {table.label} Data
              </Button>
            ))}
          </CardContent>
        </Card>

        <Card className="shadow-lg">
          <CardHeader className="p-4">
            <CardTitle className="font-headline flex items-center"><Upload className="mr-2 h-5 w-5" /> Data Import (Placeholder)</CardTitle>
            <CardDescription className="font-body">Import data from CSV files. This feature is a placeholder for UI demonstration.</CardDescription>
          </CardHeader>
          <CardContent className="p-4 space-y-2">
            <div className="grid gap-2">
              <Label htmlFor="import-file-input" className="font-body">Select CSV File</Label>
              <Input 
                id="import-file-input" 
                type="file" 
                accept=".csv" 
                onChange={handleImportFileChange} 
                disabled={isImporting}
              />
            </div>
            <Button
              onClick={handleImportData}
              disabled={!importFile || isImporting}
              className="w-full mt-2"
            >
              {isImporting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Upload className="mr-2 h-4 w-4" />
              )}
              Import Data
            </Button>
            <p className="text-xs text-muted-foreground mt-2 font-body">
              Note: Full CSV import with validation is complex and typically handled server-side. This is a UI placeholder.
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-lg border-destructive">
          <CardHeader className="p-4">
            <CardTitle className="font-headline flex items-center text-destructive"><AlertTriangle className="mr-2 h-5 w-5" /> Data Reset</CardTitle>
            <CardDescription className="font-body text-destructive">
              Permanently delete data from your database. This action is irreversible. Proceed with extreme caution.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 space-y-2">
            {dataGroupsToClear.map(group => (
              <AlertDialog key={group.label}>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="destructive"
                    className="w-full justify-start"
                    disabled={!!isClearing}
                  >
                    {isClearing === group.label ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="mr-2 h-4 w-4" />
                    )}
                    Clear {group.label}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle className="font-headline text-destructive">Confirm Deletion: {group.label}</AlertDialogTitle>
                    <AlertDialogDescription className="font-body">
                      {group.description} To confirm, please type "DELETE DATA" in the box below.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <Input 
                    type="text"
                    placeholder='Type "DELETE DATA" to confirm'
                    value={confirmationText}
                    onChange={(e) => setConfirmationText(e.target.value)}
                    className="my-2 border-destructive focus:ring-destructive"
                  />
                  <AlertDialogFooter>
                    <AlertDialogCancel onClick={() => setConfirmationText('')} disabled={isClearing === group.label}>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => handleClearData(group.label, group.tables)}
                      disabled={confirmationText !== "DELETE DATA" || isClearing === group.label}
                      className="bg-destructive hover:bg-destructive/90"
                    >
                      {isClearing === group.label && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Permanently Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            ))}
             <p className="text-xs text-destructive/80 mt-2 font-body">
              It is strongly recommended to back up your data before performing any reset operations.
            </p>
          </CardContent>
        </Card>
      </div>
    </>
  );
}

