import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileImage, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ExtractedInfo {
  name: string;
  phone: string;
  email: string;
  address: string;
  confidence: number;
}

export default function DocumentOCR() {
  const [file, setFile] = useState<File | null>(null);
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractedInfo, setExtractedInfo] = useState<ExtractedInfo | null>(null);
  const { toast } = useToast();

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const uploadedFile = acceptedFiles[0];
    if (uploadedFile) {
      setFile(uploadedFile);
      setExtractedInfo(null);
      toast({
        title: "Document Selected",
        description: `${uploadedFile.name} is ready for OCR processing`,
      });
    }
  }, [toast]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
    },
    multiple: false,
    maxSize: 10 * 1024 * 1024, // 10MB
  });

  const handleExtract = async () => {
    if (!file) return;

    setIsExtracting(true);
    try {
      // Simulate OCR processing
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Mock extracted data
      const mockData: ExtractedInfo = {
        name: "Rajesh Kumar",
        phone: "9876543210",
        email: "rajesh.kumar@email.com",
        address: "123 Main Street, New Delhi - 110001",
        confidence: 0.92,
      };
      
      setExtractedInfo(mockData);
      
      toast({
        title: "OCR Completed",
        description: "Information extracted successfully from document",
      });
    } catch (error) {
      toast({
        title: "OCR Failed",
        description: "Failed to extract information from document",
        variant: "destructive",
      });
    } finally {
      setIsExtracting(false);
    }
  };

  const ExtractionResults = () => {
    if (!extractedInfo) return null;

    return (
      <Card className="mt-6 p-4">
        <h4 className="font-semibold text-slate-900 mb-3">Extracted Information</h4>
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-slate-600">Name:</span>
            <div className="flex items-center space-x-2">
              <span className="font-medium">{extractedInfo.name}</span>
              <span className="text-xs text-green-600">
                {Math.round(extractedInfo.confidence * 100)}% confidence
              </span>
            </div>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-slate-600">Phone:</span>
            <div className="flex items-center space-x-2">
              <span className="font-medium">{extractedInfo.phone}</span>
              <span className="text-xs text-green-600">
                {Math.round(extractedInfo.confidence * 100)}% confidence
              </span>
            </div>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-slate-600">Email:</span>
            <div className="flex items-center space-x-2">
              <span className="font-medium">{extractedInfo.email}</span>
              <span className="text-xs text-green-600">
                {Math.round(extractedInfo.confidence * 100)}% confidence
              </span>
            </div>
          </div>
          
          <div className="flex justify-between items-start">
            <span className="text-slate-600">Address:</span>
            <div className="flex flex-col items-end space-y-1">
              <span className="font-medium text-right max-w-xs">{extractedInfo.address}</span>
              <span className="text-xs text-green-600">
                {Math.round(extractedInfo.confidence * 100)}% confidence
              </span>
            </div>
          </div>
        </div>
        
        <div className="mt-4 pt-4 border-t border-slate-200">
          <Button className="w-full bg-primary hover:bg-emerald-600">
            Use This Information to Create Lead
          </Button>
        </div>
      </Card>
    );
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
            <FileImage className="h-8 w-8 text-slate-500" />
          </div>
          <p className="text-lg font-medium text-slate-900 mb-2">Upload Document</p>
          <p className="text-slate-500 mb-4">PDF, JPG, PNG, or Word files</p>
          <Button className="bg-primary hover:bg-emerald-600">
            Choose Document
          </Button>
          <p className="text-xs text-slate-400 mt-2">
            Supports PDF, DOCX, JPG, PNG up to 10MB
          </p>
        </div>

        {file && (
          <Card className="mt-4 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <FileImage className="h-8 w-8 text-primary" />
                <div>
                  <p className="font-medium text-slate-900">{file.name}</p>
                  <p className="text-sm text-slate-500">
                    {(file.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
              </div>
              <Button 
                onClick={handleExtract}
                disabled={isExtracting}
                className="bg-primary hover:bg-emerald-600"
              >
                {isExtracting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Extracting...
                  </>
                ) : (
                  'Extract Information'
                )}
              </Button>
            </div>
          </Card>
        )}
      </div>

      {/* OCR Results */}
      <div>
        {!extractedInfo && !isExtracting && (
          <Card className="p-6 bg-slate-50">
            <h4 className="font-semibold text-slate-900 mb-3">Extracted Information</h4>
            <div className="text-center text-slate-500 py-8">
              <FileImage className="h-12 w-12 mx-auto mb-3 text-slate-400" />
              <p>Upload a document to see extracted information here</p>
              <p className="text-sm mt-1">AI will automatically detect names, phone numbers, emails, and addresses</p>
            </div>
          </Card>
        )}

        {isExtracting && (
          <Card className="p-6">
            <h4 className="font-semibold text-slate-900 mb-3">Extracting Information</h4>
            <div className="space-y-3">
              {['Name', 'Phone', 'Email', 'Address'].map((field) => (
                <div key={field} className="flex justify-between items-center">
                  <span className="text-slate-600">{field}:</span>
                  <div className="flex items-center space-x-2">
                    <span className="font-medium">Extracting...</span>
                    <Loader2 className="h-4 w-4 animate-spin text-primary" />
                  </div>
                </div>
              ))}
            </div>
            <p className="text-xs text-slate-500 mt-4">
              AI is analyzing the document and extracting information...
            </p>
          </Card>
        )}

        <ExtractionResults />
      </div>
    </div>
  );
}
