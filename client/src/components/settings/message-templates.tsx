import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Edit, Plus, Trash2, TrendingUp, Loader2, Sparkles } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import type { MessageTemplate } from "@shared/schema";
import { useAuth } from '@/hooks/use-auth';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

const CATEGORIES = [
  { value: "pitch", label: "Product Pitch" },
  { value: "followup", label: "Follow-up" },
  { value: "greeting", label: "Greeting" },
  { value: "upsell", label: "Upselling" },
  { value: "custom", label: "Custom Category" },
] as const;

const getCategoryColor = (category: string) => {
  switch (category) {
    case "pitch": return "bg-blue-100 text-blue-700 hover:bg-blue-600 hover:text-white";
    case "followup": return "bg-yellow-100 text-yellow-700 hover:bg-yellow-600 hover:text-white";
    case "greeting": return "bg-green-100 text-green-700 hover:bg-green-600 hover:text-white";
    case "upsell": return "bg-purple-100 text-purple-700 hover:bg-purple-600 hover:text-white";
    default: return "bg-slate-100 text-slate-700 hover:bg-slate-600 hover:text-white";
  }
};

export default function MessageTemplates() {
  const [editingTemplate, setEditingTemplate] = useState<MessageTemplate | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newTemplate, setNewTemplate] = useState({
    name: "",
    content: "",
    category: "pitch",
    customCategory: "",
  });
  const [suggestLoading, setSuggestLoading] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [isDesktop, setIsDesktop] = useState(true);

  useEffect(() => {
    const check = () => setIsDesktop(window.matchMedia('(min-width: 768px)').matches);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  const { data: templates = [] } = useQuery<MessageTemplate[]>({
    queryKey: ["message-templates", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('message_templates')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const createTemplateMutation = useMutation({
    mutationFn: async (data: { name: string; content: string; category: string }) => {
      if (!user) throw new Error('User not authenticated');
      const { data: newTemplate, error } = await supabase
        .from('message_templates')
        .insert([{
          name: data.name,
          content: data.content,
          category: data.category,
          usage_count: 0,
          response_rate: 0,
          user_id: user.id
        }])
        .select()
        .single();

      if (error) throw error;
      return newTemplate;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["message-templates"] });
      toast({
        title: "Template Created",
        description: "New message template has been created successfully.",
      });
      setNewTemplate({ name: "", content: "", category: "pitch", customCategory: "" });
      setIsCreateDialogOpen(false);
    },
    onError: (error: any) => {
      toast({
        title: "Error Creating Template",
        description: error.message || "Failed to create template. Please try again.",
        variant: "destructive",
      });
    },
  });

  const updateTemplateMutation = useMutation({
    mutationFn: async (data: { id: number; updates: Partial<MessageTemplate> }) => {
      const { data: updatedTemplate, error } = await supabase
        .from('message_templates')
        .update(data.updates)
        .eq('id', data.id)
        .select()
        .single();

      if (error) throw error;
      return updatedTemplate;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["message-templates"] });
      toast({
        title: "Template Updated",
        description: "Message template has been updated successfully.",
      });
      setEditingTemplate(null);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update template. Please try again.",
        variant: "destructive",
      });
    },
  });

  const deleteTemplateMutation = useMutation({
    mutationFn: async (id: number) => {
      const { error } = await supabase
        .from('message_templates')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["message-templates"] });
      toast({
        title: "Template Deleted",
        description: "Message template has been deleted successfully.",
      });
    },
    onError: (error) => {
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

    // If custom category is selected, use the custom category value
    const category = newTemplate.category === "custom" ? newTemplate.customCategory : newTemplate.category;

    createTemplateMutation.mutate({
      ...newTemplate,
      category,
    });
  };

  const handleUpdateTemplate = (original: MessageTemplate, updated: MessageTemplate) => {
    updateTemplateMutation.mutate({
      id: original.id,
      updates: {
        name: updated.name,
        content: updated.content,
        category: updated.category,
      },
    });
  };

  const handleAISuggestion = async () => {
    if (!newTemplate.name || !newTemplate.category) return;
    
    setSuggestLoading(true);
    try {
      const res = await fetch("/api/ai/suggest-template", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newTemplate.name, category: newTemplate.category })
      });
      const data = await res.json();
      setNewTemplate(prev => ({ ...prev, content: data.suggestion || "" }));
    } catch (err) {
      toast({
        title: "AI Suggestion Failed",
        description: "Could not get suggestion. Please try again.",
        variant: "destructive"
      });
    } finally {
      setSuggestLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="font-poppins text-lg">Message<span className="md:hidden"><br /></span> Templates</CardTitle>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-primary hover:bg-gray-400">
                <Plus className="mr-2 h-4 w-4" />
                Add Template
              </Button>
            </DialogTrigger>
            <DialogContent className="flex-1 flex flex-col space-y-6">
              <div className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="template-name">Template Name</Label>
                  <Input
                    id="template-name"
                    placeholder="e.g., Home Loan Welcome"
                    value={newTemplate.name}
                    onChange={(e) => setNewTemplate(prev => ({ ...prev, name: e.target.value }))}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="template-category">Category</Label>
                  <Select 
                    value={newTemplate.category} 
                    onValueChange={(value) => setNewTemplate(prev => ({ ...prev, category: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map((cat) => (
                        <SelectItem key={cat.value} value={cat.value}>
                          {cat.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {newTemplate.category === "custom" && (
                    <Input
                      placeholder="Enter custom category"
                      value={newTemplate.customCategory}
                      onChange={(e) => setNewTemplate(prev => ({ ...prev, customCategory: e.target.value }))}
                      className="mt-2"
                    />
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="template-content">Message Content</Label>
                  <Textarea
                    id="template-content"
                    placeholder="Hi {name}! I hope this message finds you well..."
                    className="min-h-32"
                    value={newTemplate.content}
                    onChange={(e) => setNewTemplate(prev => ({ ...prev, content: e.target.value }))}
                  />
                  <div className="flex items-center gap-2 mt-1">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={suggestLoading || !newTemplate.name || !newTemplate.category}
                      onClick={handleAISuggestion}
                      className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                    >
                      {suggestLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Generating...
                        </>
                      ) : (
                        <>
                          <Sparkles className="mr-2 h-4 w-4" />
                          Suggest with AI
                        </>
                      )}
                    </Button>
                    <p className="text-xs text-slate-500">Use placeholders: {"{name}"}, {"{product}"}, {"{loanAmount}"}, {"{amount}"}, {"{city}"}, {"{income}"}, {"{employment}"}</p>
                  </div>
                </div>

                <div className="flex justify-end space-x-3 pt-4 border-t">
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
                    {createTemplateMutation.isPending ? "Creating..." : "Create Template"}
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
          <TooltipProvider delayDuration={100}>
            {templates.map((template) => (
              <Tooltip key={template.id}>
                <TooltipTrigger asChild>
                  <div className="border border-slate-200 rounded-lg p-4 cursor-pointer hover:bg-slate-50 transition">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <h4 className="font-medium text-slate-900">{template.name}</h4>
                        <Badge className={`${getCategoryColor(template.category)} text-[10px] sm:text-xs px-2 py-0.5 whitespace-nowrap`}>
                          {CATEGORIES.find(c => c.value === template.category)?.label || template.category}
                        </Badge>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="text-accent hover:bg-blue-500 hover:text-white" 
                          onClick={() => setEditingTemplate(template)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="text-destructive hover:bg-red-500 hover:text-white"
                          onClick={() => deleteTemplateMutation.mutate(template.id)}
                          disabled={deleteTemplateMutation.isPending}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <p className="text-sm text-slate-600 mb-3 line-clamp-2">{template.content}</p>
                    <div className="flex items-center justify-between text-xs text-slate-500">
                      <span>Used {template.usage_count || 0} times</span>
                      <div className="flex items-center space-x-1">
                        <TrendingUp className="h-3 w-3 text-green-600" />
                        <span className="text-green-600">
                          {Math.round((template.response_rate || 0) * 100)}% response rate
                        </span>
                      </div>
                    </div>
                  </div>
                </TooltipTrigger>
                <TooltipContent
                  side={isDesktop ? "right" : undefined}
                  align="center"
                  sideOffset={30}
                  className="max-w-xs md:max-w-lg p-2 md:p-4 bg-white border border-slate-200 rounded-lg shadow-lg"
                >
                  <div className="mb-2 text-xs md:text-xs text-slate-500 font-semibold">Template Content:</div>
                  <div className="mb-2 whitespace-pre-line text-slate-800 text-sm md:text-sm bg-slate-100 p-2 md:p-3 rounded-md max-h-80 overflow-y-auto">
                    {template.content}
                  </div>
                </TooltipContent>
              </Tooltip>
            ))}
          </TooltipProvider>
        )}

        <Dialog open={!!editingTemplate} onOpenChange={(open) => { if (!open) setEditingTemplate(null); }}>
          <DialogContent className="max-w-lg w-full p-6 md:p-10">
            <DialogTitle className="text-center w-full mb-6 text-2xl font-semibold">Edit Template</DialogTitle>
            {editingTemplate && (
              <form className="w-full max-w-md flex flex-col gap-5">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="edit-name">Template Name</Label>
                  <Input
                    id="edit-name"
                    value={editingTemplate.name}
                    onChange={(e) => setEditingTemplate(prev => prev ? { ...prev, name: e.target.value } : prev)}
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="edit-category">Category</Label>
                  <Select 
                    value={editingTemplate.category}
                    onValueChange={(value) => setEditingTemplate(prev => prev ? { ...prev, category: value } : prev)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map((cat) => (
                        <SelectItem key={cat.value} value={cat.value}>
                          {cat.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="edit-content">Message Content</Label>
                  <Textarea
                    id="edit-content"
                    value={editingTemplate.content}
                    onChange={(e) => setEditingTemplate(prev => prev ? { ...prev, content: e.target.value } : prev)}
                    className="min-h-32"
                  />
                </div>
                <div className="flex justify-end gap-3 pt-4">
                  <Button variant="outline" onClick={() => setEditingTemplate(null)}>
                    Cancel
                  </Button>
                  <Button 
                    onClick={() => editingTemplate && handleUpdateTemplate(editingTemplate, editingTemplate)}
                    disabled={updateTemplateMutation.isPending}
                  >
                    {updateTemplateMutation.isPending ? "Updating..." : "Update Template"}
                  </Button>
                </div>
              </form>
            )}
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
