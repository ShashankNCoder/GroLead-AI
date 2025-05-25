import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Edit, Plus, Trash2, TrendingUp } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { MessageTemplate } from "@shared/schema";

export default function MessageTemplates() {
  const [editingTemplate, setEditingTemplate] = useState<MessageTemplate | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newTemplate, setNewTemplate] = useState({
    name: "",
    content: "",
    category: "pitch",
  });
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: templates = [] } = useQuery<MessageTemplate[]>({
    queryKey: ["/api/templates"],
  });

  const createTemplateMutation = useMutation({
    mutationFn: async (data: { name: string; content: string; category: string }) => {
      await apiRequest("POST", "/api/templates", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/templates"] });
      toast({
        title: "Template Created",
        description: "New message template has been created successfully.",
      });
      setNewTemplate({ name: "", content: "", category: "pitch" });
      setIsCreateDialogOpen(false);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create template. Please try again.",
        variant: "destructive",
      });
    },
  });

  const updateTemplateMutation = useMutation({
    mutationFn: async (data: { id: number; updates: Partial<MessageTemplate> }) => {
      await apiRequest("PUT", `/api/templates/${data.id}`, data.updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/templates"] });
      toast({
        title: "Template Updated",
        description: "Message template has been updated successfully.",
      });
      setEditingTemplate(null);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update template. Please try again.",
        variant: "destructive",
      });
    },
  });

  const deleteTemplateMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/templates/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/templates"] });
      toast({
        title: "Template Deleted",
        description: "Message template has been deleted successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete template. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleCreateTemplate = () => {
    if (!newTemplate.name.trim() || !newTemplate.content.trim()) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    createTemplateMutation.mutate(newTemplate);
  };

  const handleUpdateTemplate = (template: MessageTemplate, updates: Partial<MessageTemplate>) => {
    updateTemplateMutation.mutate({
      id: template.id,
      updates,
    });
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "pitch":
        return "bg-blue-100 text-blue-700";
      case "followup":
        return "bg-yellow-100 text-yellow-700";
      case "greeting":
        return "bg-green-100 text-green-700";
      case "upsell":
        return "bg-purple-100 text-purple-700";
      default:
        return "bg-slate-100 text-slate-700";
    }
  };

  const categories = [
    { value: "pitch", label: "Product Pitch" },
    { value: "followup", label: "Follow-up" },
    { value: "greeting", label: "Greeting" },
    { value: "upsell", label: "Upselling" },
  ];

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Message Templates</CardTitle>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-primary hover:bg-emerald-600">
                <Plus className="mr-2 h-4 w-4" />
                Add Template
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Create New Template</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="template-name">Template Name</Label>
                  <Input
                    id="template-name"
                    placeholder="e.g., Home Loan Welcome"
                    value={newTemplate.name}
                    onChange={(e) => setNewTemplate({ ...newTemplate, name: e.target.value })}
                  />
                </div>
                
                <div>
                  <Label htmlFor="template-category">Category</Label>
                  <Select 
                    value={newTemplate.category} 
                    onValueChange={(value) => setNewTemplate({ ...newTemplate, category: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((cat) => (
                        <SelectItem key={cat.value} value={cat.value}>
                          {cat.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="template-content">Message Content</Label>
                  <Textarea
                    id="template-content"
                    placeholder="Hi {name}! I hope this message finds you well..."
                    className="min-h-24"
                    value={newTemplate.content}
                    onChange={(e) => setNewTemplate({ ...newTemplate, content: e.target.value })}
                  />
                  <p className="text-xs text-slate-500 mt-1">
                    Use placeholders: {"{name}"}, {"{product}"}, {"{loanAmount}"}
                  </p>
                </div>

                <div className="flex justify-end space-x-2">
                  <Button 
                    variant="outline" 
                    onClick={() => setIsCreateDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleCreateTemplate}
                    disabled={createTemplateMutation.isPending}
                  >
                    Create Template
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {templates.length === 0 ? (
          <div className="text-center py-8 text-slate-500">
            <p>No message templates yet</p>
            <p className="text-sm mt-1">Create your first template to get started</p>
          </div>
        ) : (
          templates.map((template) => (
            <div key={template.id} className="border border-slate-200 rounded-lg p-4">
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <h4 className="font-medium text-slate-900">{template.name}</h4>
                  <Badge className={`${getCategoryColor(template.category)} text-xs`}>
                    {categories.find(c => c.value === template.category)?.label || template.category}
                  </Badge>
                </div>
                <div className="flex items-center space-x-1">
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="ghost" size="sm" className="text-accent hover:text-blue-600">
                        <Edit className="h-4 w-4" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-md">
                      <DialogHeader>
                        <DialogTitle>Edit Template</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="edit-name">Template Name</Label>
                          <Input
                            id="edit-name"
                            defaultValue={template.name}
                            onChange={(e) => setEditingTemplate({ ...template, name: e.target.value })}
                          />
                        </div>
                        
                        <div>
                          <Label htmlFor="edit-content">Message Content</Label>
                          <Textarea
                            id="edit-content"
                            className="min-h-24"
                            defaultValue={template.content}
                            onChange={(e) => setEditingTemplate({ ...template, content: e.target.value })}
                          />
                        </div>

                        <div className="flex justify-end space-x-2">
                          <Button variant="outline">Cancel</Button>
                          <Button 
                            onClick={() => editingTemplate && handleUpdateTemplate(template, editingTemplate)}
                            disabled={updateTemplateMutation.isPending}
                          >
                            Update Template
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="text-destructive hover:text-red-600"
                    onClick={() => deleteTemplateMutation.mutate(template.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              
              <p className="text-sm text-slate-600 mb-3 line-clamp-2">{template.content}</p>
              
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span>Used {template.usageCount || 0} times this month</span>
                <div className="flex items-center space-x-1">
                  <TrendingUp className="h-3 w-3 text-green-600" />
                  <span className="text-green-600">
                    {Math.round((template.responseRate || 0) * 100)}% response rate
                  </span>
                </div>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
