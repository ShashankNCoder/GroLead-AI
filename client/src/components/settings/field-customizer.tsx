import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, GripVertical, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface LeadField {
  id: string;
  name: string;
  type: string;
  required: boolean;
  enabled: boolean;
  order: number;
  options?: string[];
}

export default function FieldCustomizer() {
  const [fields, setFields] = useState<LeadField[]>([
    { id: "name", name: "Full Name", type: "text", required: true, enabled: true, order: 1 },
    { id: "phone", name: "Phone Number", type: "tel", required: true, enabled: true, order: 2 },
    { id: "email", name: "Email Address", type: "email", required: false, enabled: true, order: 3 },
    { id: "city", name: "City", type: "text", required: false, enabled: true, order: 4 },
    { id: "product", name: "Product Interest", type: "select", required: true, enabled: true, order: 5, options: ["Home Loan", "Car Loan", "Personal Loan"] },
    { id: "income", name: "Monthly Income", type: "text", required: false, enabled: true, order: 6 },
    { id: "employment", name: "Employment Type", type: "select", required: false, enabled: true, order: 7, options: ["Salaried", "Self Employed", "Business Owner"] },
    { id: "pan", name: "PAN Number", type: "text", required: false, enabled: false, order: 8 },
    { id: "aadhaar", name: "Aadhaar Number", type: "text", required: false, enabled: false, order: 9 },
  ]);

  const [isAddFieldOpen, setIsAddFieldOpen] = useState(false);
  const [newField, setNewField] = useState({
    name: "",
    type: "text",
    required: false,
    options: "",
  });

  const { toast } = useToast();

  const handleFieldToggle = (fieldId: string, enabled: boolean) => {
    setFields(fields.map(field => 
      field.id === fieldId ? { ...field, enabled } : field
    ));
  };

  const handleRequiredToggle = (fieldId: string, required: boolean) => {
    setFields(fields.map(field => 
      field.id === fieldId ? { ...field, required } : field
    ));
  };

  const handleAddField = () => {
    if (!newField.name.trim()) {
      toast({
        title: "Field Name Required",
        description: "Please enter a name for the custom field.",
        variant: "destructive",
      });
      return;
    }

    const customField: LeadField = {
      id: `custom_${Date.now()}`,
      name: newField.name,
      type: newField.type,
      required: newField.required,
      enabled: true,
      order: fields.length + 1,
      options: newField.type === "select" && newField.options 
        ? newField.options.split(",").map(opt => opt.trim())
        : undefined,
    };

    setFields([...fields, customField]);
    setNewField({ name: "", type: "text", required: false, options: "" });
    setIsAddFieldOpen(false);

    toast({
      title: "Field Added",
      description: "Custom field has been added successfully.",
    });
  };

  const handleDeleteField = (fieldId: string) => {
    // Don't allow deleting core required fields
    const coreFields = ["name", "phone", "product"];
    if (coreFields.includes(fieldId)) {
      toast({
        title: "Cannot Delete",
        description: "This is a core field and cannot be deleted.",
        variant: "destructive",
      });
      return;
    }

    setFields(fields.filter(field => field.id !== fieldId));
    toast({
      title: "Field Deleted",
      description: "Custom field has been deleted.",
    });
  };

  const fieldTypes = [
    { value: "text", label: "Text" },
    { value: "email", label: "Email" },
    { value: "tel", label: "Phone" },
    { value: "number", label: "Number" },
    { value: "select", label: "Dropdown" },
    { value: "textarea", label: "Long Text" },
    { value: "date", label: "Date" },
  ];

  const getFieldTypeIcon = (type: string) => {
    switch (type) {
      case "email": return "📧";
      case "tel": return "📞";
      case "number": return "🔢";
      case "select": return "📋";
      case "textarea": return "📝";
      case "date": return "📅";
      default: return "📄";
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Lead Field Customizer</CardTitle>
          <Dialog open={isAddFieldOpen} onOpenChange={setIsAddFieldOpen}>
            <DialogTrigger asChild>
              <Button className="bg-accent hover:bg-blue-600">
                <Plus className="mr-2 h-4 w-4" />
                Add Custom Field
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Add Custom Field</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="field-name">Field Name</Label>
                  <Input
                    id="field-name"
                    placeholder="e.g., Annual Income"
                    value={newField.name}
                    onChange={(e) => setNewField({ ...newField, name: e.target.value })}
                  />
                </div>

                <div>
                  <Label htmlFor="field-type">Field Type</Label>
                  <Select 
                    value={newField.type} 
                    onValueChange={(value) => setNewField({ ...newField, type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {fieldTypes.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {newField.type === "select" && (
                  <div>
                    <Label htmlFor="field-options">Options (comma-separated)</Label>
                    <Input
                      id="field-options"
                      placeholder="Option 1, Option 2, Option 3"
                      value={newField.options}
                      onChange={(e) => setNewField({ ...newField, options: e.target.value })}
                    />
                  </div>
                )}

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="field-required"
                    checked={newField.required}
                    onCheckedChange={(checked) => setNewField({ ...newField, required: checked as boolean })}
                  />
                  <Label htmlFor="field-required" className="text-sm">
                    Make this field required
                  </Label>
                </div>

                <div className="flex justify-end space-x-2">
                  <Button 
                    variant="outline" 
                    onClick={() => setIsAddFieldOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button onClick={handleAddField}>
                    Add Field
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {fields.map((field) => (
          <div
            key={field.id}
            className="flex items-center justify-between p-3 border border-slate-200 rounded-lg hover:bg-slate-50 group"
          >
            <div className="flex items-center space-x-3">
              <div className="cursor-move opacity-0 group-hover:opacity-100 transition-opacity">
                <GripVertical className="h-4 w-4 text-slate-400" />
              </div>
              
              <Checkbox
                checked={field.enabled}
                onCheckedChange={(checked) => handleFieldToggle(field.id, checked as boolean)}
              />
              
              <div className="flex items-center space-x-2">
                <span className="text-lg">{getFieldTypeIcon(field.type)}</span>
                <span className="text-sm font-medium text-slate-900">{field.name}</span>
              </div>
              
              <div className="flex items-center space-x-2">
                <Badge variant="outline" className="text-xs">
                  {fieldTypes.find(t => t.value === field.type)?.label || field.type}
                </Badge>
                
                {field.required && (
                  <Badge className="bg-red-100 text-red-700 text-xs">
                    Required
                  </Badge>
                )}
              </div>
            </div>

            <div className="flex items-center space-x-2">
              {!["name", "phone", "product"].includes(field.id) && (
                <div className="flex items-center space-x-2">
                  <Checkbox
                    checked={field.required}
                    onCheckedChange={(checked) => handleRequiredToggle(field.id, checked as boolean)}
                    disabled={!field.enabled}
                  />
                  <Label className="text-xs text-slate-600">Required</Label>
                </div>
              )}
              
              {field.id.startsWith("custom_") && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-destructive hover:text-red-600"
                  onClick={() => handleDeleteField(field.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        ))}

        <div className="mt-6 pt-4 border-t border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium text-slate-900">Export/Import Configuration</h4>
              <p className="text-sm text-slate-500">Save or load field configurations</p>
            </div>
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm">
                Import Config
              </Button>
              <Button variant="outline" size="sm">
                Export Config
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
