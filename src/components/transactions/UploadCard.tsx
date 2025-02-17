"use client";

import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Upload } from "lucide-react";

export function UploadCard({ userId }: { userId: string }) {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileUpload = useCallback(async (file: File) => {
    if (!file) return;
    
    setIsUploading(true);
    setError(null);
    
    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const csvData = e.target?.result as string;
        
        const response = await fetch('/api/transactions/process-csv', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ csvData }),
        });

        if (!response.ok) {
          throw new Error('Failed to process CSV file');
        }

        // Refresh the page to show new transactions
        window.location.reload();
      };

      reader.readAsText(file);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload file');
    } finally {
      setIsUploading(false);
    }
  }, []);

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button>
          <Upload className="mr-2 h-4 w-4" />
          Upload Transactions
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Upload Transaction CSV</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-lg p-12">
            <input
              type="file"
              accept=".csv"
              onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
              className="hidden"
              id="csv-upload"
            />
            <label
              htmlFor="csv-upload"
              className="flex flex-col items-center cursor-pointer"
            >
              <Upload className="h-12 w-12 text-gray-400" />
              <span className="mt-2 text-sm text-gray-500">
                Click to upload a CSV file
              </span>
            </label>
          </div>
          {isUploading && (
            <div className="text-center text-sm text-gray-500">
              Processing your transactions...
            </div>
          )}
          {error && (
            <div className="text-center text-sm text-red-500">
              {error}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
} 