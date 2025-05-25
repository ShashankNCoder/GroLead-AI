import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Upload, Download, FileSpreadsheet } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function UploadCSV() {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();

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

    setIsUploading(true);
    try {
      // Simulate file processing
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      toast({
        title: "Upload Successful",
        description: `Processed ${file.name} - 15 leads imported successfully`,
      });
      
      setFile(null);
    } catch (error) {
      toast({
        title: "Upload Failed",
        description: "Failed to process the file. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const downloadSample = () => {
    // Create sample CSV content
    const sampleData = [
      ['Name', 'Phone', 'Email', 'Product', 'Loan Amount', 'Monthly Income', 'City', 'Employment Type'],
      ['Rahul Sharma', '9876543210', 'rahul@email.com', 'Home Loan', '5000000', '85000', 'Delhi', 'Salaried'],
      ['Priya Kapoor', '9876543211', 'priya@email.com', 'Car Loan', '800000', '45000', 'Mumbai', 'Salaried'],
      ['Amit Jain', '9876543212', 'amit@email.com', 'Personal Loan', '300000', '55000', 'Bangalore', 'Self Employed'],
    ];

    const csvContent = sampleData.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'sample_leads.csv';
    a.click();
    window.URL.revokeObjectURL(url);

    toast({
      title: "Sample Downloaded",
      description: "Check your downloads folder for the sample file",
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
            className="bg-primary hover:bg-emerald-600"
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
                className="bg-primary hover:bg-emerald-600"
              >
                {isUploading ? 'Processing...' : 'Upload & Process'}
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
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="text-left py-2 text-slate-700 font-medium">Name</th>
                  <th className="text-left py-2 text-slate-700 font-medium">Phone</th>
                  <th className="text-left py-2 text-slate-700 font-medium">Product</th>
                  <th className="text-left py-2 text-slate-700 font-medium">Income</th>
                </tr>
              </thead>
              <tbody>
                <tr className="text-slate-600">
                  <td className="py-2">Rahul Sharma</td>
                  <td className="py-2">9876543210</td>
                  <td className="py-2">Home Loan</td>
                  <td className="py-2">₹8,50,000</td>
                </tr>
                <tr className="text-slate-600">
                  <td className="py-2">Priya Kapoor</td>
                  <td className="py-2">9876543211</td>
                  <td className="py-2">Car Loan</td>
                  <td className="py-2">₹4,50,000</td>
                </tr>
              </tbody>
            </table>
          </div>
        </Card>
        
        <Button 
          variant="outline" 
          onClick={downloadSample}
          className="mt-3 text-accent hover:text-blue-600"
        >
          <Download className="mr-2 h-4 w-4" />
          Download Sample File
        </Button>
      </div>
    </div>
  );
}
