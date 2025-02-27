'use client';

import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Upload } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

export function UploadCard() {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState<string>('');

  const uploadCSV = useCallback(async (csvData: string) => {
    try {
      setStatus('Uploading to server...');
      setProgress(50);

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

      setProgress(100);
      setStatus('Upload complete! Refreshing...');

      // Add a small delay before refresh to show completion
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload file');
      setStatus('Upload failed');
      setProgress(0);
    }
  }, []);

  const handleFileUpload = useCallback(async (file: File) => {
    if (!file) {
      return;
    }

    setIsUploading(true);
    setError(null);
    setProgress(0);
    setStatus('Starting upload...');

    try {
      const reader = new FileReader();

      // Create a promise to handle file reading
      const readFileContent = new Promise<string>((resolve, reject) => {
        reader.onload = (e) => resolve(e.target?.result as string);
        reader.onerror = () => reject(new Error('Failed to read file'));

        reader.onprogress = (event) => {
          if (event.lengthComputable) {
            const percentLoaded = Math.round((event.loaded / event.total) * 40);
            setProgress(percentLoaded);
            setStatus('Reading file...');
          }
        };
      });

      reader.readAsText(file);

      const csvData = await readFileContent;
      await uploadCSV(csvData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload file');
      setStatus('Upload failed');
      setProgress(0);
    } finally {
      setIsUploading(false);
    }
  }, [uploadCSV]);

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
              disabled={isUploading}
            />
            <label
              htmlFor="csv-upload"
              className={`flex flex-col items-center ${isUploading ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
            >
              <Upload className="h-12 w-12 text-gray-400" />
              <span className="mt-2 text-sm text-gray-500">
                {isUploading ? 'Upload in progress...' : 'Click to upload a CSV file'}
              </span>
            </label>
          </div>
          {isUploading && (
            <div className="space-y-2">
              <Progress value={progress} className="w-full" />
              <div className="text-center text-sm text-gray-500">
                {status}
              </div>
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
