import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Search, Globe, Loader2, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ScrapedLead {
  name: string;
  phone: string;
  business: string;
  location: string;
  category: string;
}

export default function WebScraper() {
  const [url, setUrl] = useState("");
  const [preset, setPreset] = useState("");
  const [isScraping, setIsScraping] = useState(false);
  const [scrapedLeads, setScrapedLeads] = useState<ScrapedLead[]>([]);
  const [selectedLeads, setSelectedLeads] = useState<Set<number>>(new Set());
  const { toast } = useToast();

  const presets = [
    { value: "justdial", label: "JustDial Business Listings", url: "https://www.justdial.com/search..." },
    { value: "indiamart", label: "IndiaMart Suppliers", url: "https://www.indiamart.com/search..." },
    { value: "tradeindia", label: "TradeIndia Directory", url: "https://www.tradeindia.com/search..." },
    { value: "custom", label: "Custom URL", url: "" },
  ];

  const handlePresetChange = (value: string) => {
    setPreset(value);
    const selectedPreset = presets.find(p => p.value === value);
    if (selectedPreset && selectedPreset.url) {
      setUrl(selectedPreset.url);
    }
  };

  const handleScrape = async () => {
    if (!url) {
      toast({
        title: "URL Required",
        description: "Please enter a URL to scrape",
        variant: "destructive",
      });
      return;
    }

    setIsScraping(true);
    try {
      // Simulate scraping process
      await new Promise(resolve => setTimeout(resolve, 4000));
      
      // Mock scraped data
      const mockLeads: ScrapedLead[] = [
        {
          name: "Rajesh Electronics",
          phone: "9876543210",
          business: "Electronics Retailer",
          location: "Connaught Place, Delhi",
          category: "Electronics",
        },
        {
          name: "Sharma Construction",
          phone: "9876543211",
          business: "Construction Services",
          location: "Karol Bagh, Delhi",
          category: "Construction",
        },
        {
          name: "Modern Textiles",
          phone: "9876543212",
          business: "Textile Manufacturing",
          location: "Chandni Chowk, Delhi",
          category: "Textiles",
        },
        {
          name: "Tech Solutions Pvt Ltd",
          phone: "9876543213",
          business: "IT Services",
          location: "Gurgaon, Haryana",
          category: "Technology",
        },
        {
          name: "City Medical Store",
          phone: "9876543214",
          business: "Pharmacy",
          location: "Lajpat Nagar, Delhi",
          category: "Healthcare",
        },
      ];
      
      setScrapedLeads(mockLeads);
      setSelectedLeads(new Set(mockLeads.map((_, index) => index)));
      
      toast({
        title: "Scraping Completed",
        description: `Found ${mockLeads.length} potential leads`,
      });
    } catch (error) {
      toast({
        title: "Scraping Failed",
        description: "Failed to scrape the website. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsScraping(false);
    }
  };

  const handleLeadToggle = (index: number) => {
    const newSelected = new Set(selectedLeads);
    if (newSelected.has(index)) {
      newSelected.delete(index);
    } else {
      newSelected.add(index);
    }
    setSelectedLeads(newSelected);
  };

  const handleImportSelected = () => {
    const selectedCount = selectedLeads.size;
    if (selectedCount === 0) {
      toast({
        title: "No Leads Selected",
        description: "Please select at least one lead to import",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Leads Imported",
      description: `Successfully imported ${selectedCount} leads to your pipeline`,
    });
    
    // Reset state
    setScrapedLeads([]);
    setSelectedLeads(new Set());
    setUrl("");
    setPreset("");
  };

  return (
    <div className="space-y-6">
      {/* Input Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <Label htmlFor="url" className="text-sm font-medium text-slate-700 mb-2 block">
            Website URL
          </Label>
          <Input
            id="url"
            type="url"
            placeholder="https://www.justdial.com/search..."
            value={url}
            onChange={(e) => setUrl(e.target.value)}
          />
        </div>
        
        <div>
          <Label htmlFor="preset" className="text-sm font-medium text-slate-700 mb-2 block">
            Quick Presets
          </Label>
          <Select value={preset} onValueChange={handlePresetChange}>
            <SelectTrigger>
              <SelectValue placeholder="Select Preset" />
            </SelectTrigger>
            <SelectContent>
              {presets.map((preset) => (
                <SelectItem key={preset.value} value={preset.value}>
                  {preset.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <Button
        onClick={handleScrape}
        disabled={isScraping || !url}
        className="bg-accent hover:bg-blue-600"
      >
        {isScraping ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Scraping...
          </>
        ) : (
          <>
            <Search className="mr-2 h-4 w-4" />
            Start Scraping
          </>
        )}
      </Button>

      {/* Results Section */}
      <Card className="p-6">
        <h4 className="font-semibold text-slate-900 mb-3">Scraped Results Preview</h4>
        
        {!isScraping && scrapedLeads.length === 0 && (
          <div className="text-center text-slate-500 py-8">
            <Globe className="h-12 w-12 mx-auto mb-3 text-slate-400" />
            <p>Start scraping to see extracted leads here</p>
            <p className="text-sm mt-1">AI will automatically extract business information</p>
          </div>
        )}

        {isScraping && (
          <div className="text-center py-8">
            <Loader2 className="h-12 w-12 mx-auto mb-3 text-primary animate-spin" />
            <p className="text-slate-600">Scraping website for business listings...</p>
            <p className="text-sm text-slate-500 mt-1">This may take a few moments</p>
          </div>
        )}

        {scrapedLeads.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-slate-600">
                Found {scrapedLeads.length} potential leads. Select leads to import:
              </p>
              <Button
                onClick={handleImportSelected}
                disabled={selectedLeads.size === 0}
                className="bg-primary hover:bg-emerald-600"
              >
                Import Selected ({selectedLeads.size})
              </Button>
            </div>

            <div className="space-y-3 max-h-96 overflow-y-auto">
              {scrapedLeads.map((lead, index) => (
                <div
                  key={index}
                  className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                    selectedLeads.has(index)
                      ? 'border-primary bg-primary/5'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                  onClick={() => handleLeadToggle(index)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <h5 className="font-medium text-slate-900">{lead.name}</h5>
                        <Badge variant="secondary" className="text-xs">
                          {lead.category}
                        </Badge>
                        {selectedLeads.has(index) && (
                          <CheckCircle className="h-4 w-4 text-primary" />
                        )}
                      </div>
                      <p className="text-sm text-slate-600 mb-1">{lead.business}</p>
                      <p className="text-sm text-slate-500">📍 {lead.location}</p>
                      <p className="text-sm text-slate-500">📞 {lead.phone}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
