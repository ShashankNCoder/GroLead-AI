import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Upload, Download, FileSpreadsheet } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from '@/lib/supabase';
import Papa from 'papaparse';
import { useAuth } from '@/hooks/use-auth';

export default function UploadCSV() {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const uploadedFile = acceptedFiles[0];
    if (uploadedFile) {
      setFile(uploadedFile);
      toast({
        title: "File Selected",
        description: `${uploadedFile.name} is ready to upload`,
      });
    }
  }, [toast]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
      'application/vnd.ms-excel': ['.xls'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
    },
    multiple: false,
    maxSize: 10 * 1024 * 1024, // 10MB
  });

  const handleUpload = async () => {
    if (!file) return;
    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to upload leads.",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);
    try {
      // Read and parse CSV file
      const text = await file.text();
      const { data: csvData, errors } = Papa.parse(text, {
        header: true,
        skipEmptyLines: true,
      });

      if (errors.length > 0) {
        throw new Error('Failed to parse CSV file');
      }

      // Transform CSV data to match lead schema (snake_case for DB)
      const leads = csvData.map((row: any) => ({
        name: row['Lead Name'] || '',
        phone: row['Phone']
          ? row['Phone'].replace(/^="(.+)"$/, '$1')
          : '',
        email: row['Email'] || '',
        address: row['Address'] || null,
        city: row['City'] || null,
        state: row['State'] || null,
        pincode: row['Pincode'] || null,
        product: row['Product'] || row['Product Interested'] || '',
        income_level: row['Income'] || row['Income Level'] || null,
        employment: row['Employment'] || null,
        last_contacted: row['Last Contacted'] ? new Date(row['Last Contacted']) : null,
        contact_method: row['Contact Method'] || null,
        past_interactions: parseInt(row['Past Interactions']) || 0,
        status: row['Status'] || 'new',
        notes: row['Notes'] || row['Short Notes about lead'] || null,
        source: 'csv',
        user_id: user.id,
      }));

      // Insert leads into database
      const { data, error } = await supabase
        .from('leads')
        .insert(leads)
        .select();

      if (error) throw error;

      // Invalidate queries to refresh the leads table
      queryClient.invalidateQueries({ queryKey: ["/api/leads"] });
      queryClient.invalidateQueries({ queryKey: ["/api/analytics"] });
      
      toast({
        title: "Upload Successful",
        description: `Processed ${file.name} - ${leads.length} leads imported successfully`,
      });
      
      setFile(null);
    } catch (error: any) {
      toast({
        title: "Upload Failed",
        description: error.message || "Failed to process the file. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const downloadSample = () => {
    // Create sample CSV content with headers and example data
    const sampleData = [
      ['Lead Name', 'Phone', 'Email', 'Address', 'City', 'State', 'Pincode', 'Product', 'Income', 'Employment', 'Last Contacted', 'Contact Method', 'Past Interactions', 'Status', 'Notes'],
      ['Raj Kumar', '+919876543210', 'you@gmail.com', '123 Main Street', 'Mumbai', 'Maharashtra', '400001', 'Credit Card', '₹50,000', 'Salaried', '2024-03-20', 'WhatsApp', '2', 'new', 'Interested in premium card']
    ];

    // Convert to CSV format
    const csvContent = sampleData
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');

    // Create blob and download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'sample_leads.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: "Sample Downloaded",
      description: "Check your downloads folder for sample_leads.csv",
    });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Upload Area */}
      <div>
        <div
          {...getRootProps()}
          className={`upload-zone ${isDragActive ? 'drag-over' : ''}`}
        >
          <input {...getInputProps()} />
          <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Upload className="h-8 w-8 text-slate-500" />
          </div>
          <p className="text-lg font-medium text-slate-900 mb-2">
            {isDragActive ? 'Drop your file here' : 'Drop your file here'}
          </p>
          <p className="text-slate-500 mb-4">or click to browse</p>
          <Button 
            type="button" 
            className="bg-primary hover:bg-gray-600"
          >
            Choose File
          </Button>
          <p className="text-xs text-slate-400 mt-2">
            Supports CSV, XLSX, XLS files up to 10MB
          </p>
        </div>

        {file && (
          <Card className="mt-4 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <FileSpreadsheet className="h-8 w-8 text-primary" />
                <div>
                  <p className="font-medium text-slate-900">{file.name}</p>
                  <p className="text-sm text-slate-500">
                    {(file.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
              </div>
              <Button 
                onClick={handleUpload}
                disabled={isUploading}
                className="bg-primary hover:bg-gray-600"
              >
                {isUploading ? 'Processing...' : 'Upload & Save'}
              </Button>
            </div>
          </Card>
        )}
      </div>

      {/* Sample Structure */}
      <div>
        <h4 className="font-semibold text-slate-900 mb-3">Sample File Structure</h4>
        <Card className="p-4">
          <div className="overflow-x-auto">
            {/* Desktop Table View */}
            <div className="hidden md:block">
              <div className="min-w-[1200px]">
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="bg-slate-50">
                      <th className="text-left py-3 px-4 text-slate-700 font-medium border-b border-slate-200">Lead Name</th>
                      <th className="text-left py-3 px-4 text-slate-700 font-medium border-b border-slate-200">Phone</th>
                      <th className="text-left py-3 px-4 text-slate-700 font-medium border-b border-slate-200">Email</th>
                      <th className="text-left py-3 px-4 text-slate-700 font-medium border-b border-slate-200">Address</th>
                      <th className="text-left py-3 px-4 text-slate-700 font-medium border-b border-slate-200">City</th>
                      <th className="text-left py-3 px-4 text-slate-700 font-medium border-b border-slate-200">State</th>
                      <th className="text-left py-3 px-4 text-slate-700 font-medium border-b border-slate-200">Pincode</th>
                      <th className="text-left py-3 px-4 text-slate-700 font-medium border-b border-slate-200">Product</th>
                      <th className="text-left py-3 px-4 text-slate-700 font-medium border-b border-slate-200">Income</th>
                      <th className="text-left py-3 px-4 text-slate-700 font-medium border-b border-slate-200">Employment</th>
                      <th className="text-left py-3 px-4 text-slate-700 font-medium border-b border-slate-200">Last Contacted</th>
                      <th className="text-left py-3 px-4 text-slate-700 font-medium border-b border-slate-200">Contact Method</th>
                      <th className="text-left py-3 px-4 text-slate-700 font-medium border-b border-slate-200">Past Interactions</th>
                      <th className="text-left py-3 px-4 text-slate-700 font-medium border-b border-slate-200">Status</th>
                      <th className="text-left py-3 px-4 text-slate-700 font-medium border-b border-slate-200">Notes</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-4 text-slate-600 border-b border-slate-100">Raj Kumar</td>
                      <td className="py-3 px-4 text-slate-600 border-b border-slate-100">+919876543210</td>
                      <td className="py-3 px-4 text-slate-600 border-b border-slate-100">you@gmail.com</td>
                      <td className="py-3 px-4 text-slate-600 border-b border-slate-100">123 Main Street</td>
                      <td className="py-3 px-4 text-slate-600 border-b border-slate-100">Chikkabalapura</td>
                      <td className="py-3 px-4 text-slate-600 border-b border-slate-100">Karnataka</td>
                      <td className="py-3 px-4 text-slate-600 border-b border-slate-100">562105</td>
                      <td className="py-3 px-4 text-slate-600 border-b border-slate-100">Credit Card</td>
                      <td className="py-3 px-4 text-slate-600 border-b border-slate-100">₹50,000</td>
                      <td className="py-3 px-4 text-slate-600 border-b border-slate-100">Salaried</td>
                      <td className="py-3 px-4 text-slate-600 border-b border-slate-100">2025-05-20</td>
                      <td className="py-3 px-4 text-slate-600 border-b border-slate-100">WhatsApp</td>
                      <td className="py-3 px-4 text-slate-600 border-b border-slate-100">2</td>
                      <td className="py-3 px-4 text-slate-600 border-b border-slate-100">
                        <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs">Contacted</span>
                      </td>
                      <td className="py-3 px-4 text-slate-600 border-b border-slate-100">Interested in premium card</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden space-y-4">
              {/* Lead Card */}
              <div className="bg-slate-50 rounded-lg px-2 py-4 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-slate-700 font-medium">Lead Name</span>
                  <span className="text-slate-600">Raj Kumar</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-700 font-medium">Phone</span>
                  <span className="text-slate-600">+919876543210</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-700 font-medium">Email</span>
                  <span className="text-slate-600">you@gmail.com</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-700 font-medium">Address</span>
                  <span className="text-slate-600">123 Main Street</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-700 font-medium">City</span>
                  <span className="text-slate-600">Mumbai</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-700 font-medium">State</span>
                  <span className="text-slate-600">Maharashtra</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-700 font-medium">Pincode</span>
                  <span className="text-slate-600">400001</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-700 font-medium">Product</span>
                  <span className="text-slate-600">Credit Card</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-700 font-medium">Income</span>
                  <span className="text-slate-600">₹50,000</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-700 font-medium">Employment</span>
                  <span className="text-slate-600">Salaried</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-700 font-medium">Last Contacted</span>
                  <span className="text-slate-600">2025-05-20</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-700 font-medium">Contact Method</span>
                  <span className="text-slate-600">WhatsApp</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-700 font-medium">Past Interactions</span>
                  <span className="text-slate-600">2</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-700 font-medium">Status</span>
                  <span className="text-slate-600">Contacted</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-700 font-medium">Notes</span>
                  <span className="text-slate-600">Interested in premium card</span>
                </div>
              </div>
            </div>
          </div>
        </Card>
        
        <Button 
          variant="outline" 
          onClick={downloadSample}
          className="mt-3 text-accent hover:text-white hover:bg-gray-600"
        >
          <Download className="mr-2 h-4 w-4" />
          Download Sample File
        </Button>
      </div>
    </div>
  );
}
