import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Image, Paperclip, Smile, Save, MessageCircle, Loader2, X, Sparkles } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { MessageTemplate, Lead as BaseLead } from "@shared/schema";
import { supabase } from "@/lib/supabase";
import { useAuth } from '@/hooks/use-auth';

interface MessageComposerProps {
  selectedLeads: Set<number>;
  onMessageSent?: () => void;
}

interface Attachment {
  file: File;
  type: 'image' | 'document';
  preview?: string;
}

interface Lead extends BaseLead {
  employment?: string | null;
}

export default function MessageComposer({ selectedLeads, onMessageSent }: MessageComposerProps) {
  const [selectedTemplate, setSelectedTemplate] = useState<string>("");
  const [messageContent, setMessageContent] = useState<string>("");
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [isSaveTemplateDialogOpen, setIsSaveTemplateDialogOpen] = useState(false);
  const [newTemplate, setNewTemplate] = useState({
    name: "",
    category: "pitch",
    customCategory: "",
  });
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);

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

  const { data: leads = [] } = useQuery<Lead[]>({
    queryKey: ["/api/leads"],
  });

  const sendMessageMutation = useMutation({
    mutationFn: async (data: { messages: { phoneNumber: string; message: string; attachments?: string[] }[]; templateId?: string }) => {
      const response = await fetch('/api/whatsapp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        throw new Error('Failed to send WhatsApp messages');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/leads"] });
      queryClient.invalidateQueries({ queryKey: ["/api/analytics"] });
      toast({
        title: "Messages Sent",
        description: `Successfully sent messages to ${selectedLeads.size} leads`,
      });
      setMessageContent("");
      setSelectedTemplate("");
      onMessageSent?.();
    },
    onError: () => {
      toast({
        title: "Send Failed",
        description: "Failed to send messages. Please try again.",
        variant: "destructive",
      });
    },
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
      queryClient.invalidateQueries({ queryKey: ["message-templates", user?.id] });
      toast({
        title: "Template Saved",
        description: "Message template has been saved successfully.",
      });
      setIsSaveTemplateDialogOpen(false);
      setNewTemplate({ name: "", category: "pitch", customCategory: "" });
    },
    onError: (error: any) => {
      toast({
        title: "Error Saving Template",
        description: error.message || "Failed to save template. Please try again.",
        variant: "destructive",
      });
    },
  });

  const generateAISuggestionMutation = useMutation({
    mutationFn: async () => {
      const firstLeadId = Array.from(selectedLeads)[0];
      const firstLead = leads.find(lead => lead.id === firstLeadId);
      
      if (!firstLead) throw new Error('No lead selected');
      
      const response = await fetch('/api/ai/suggest-template', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: firstLead.name,
          category: newTemplate.category || 'pitch'
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate AI suggestion');
      }

      const data = await response.json();
      return data.suggestion;
    },
    onSuccess: (content) => {
      setMessageContent(content);
      toast({
        title: "AI Suggestion Generated",
        description: "Message content has been updated with AI suggestion.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "AI Generation Failed",
        description: error.message || "Failed to generate AI suggestion. Please try again.",
        variant: "destructive",
      });
    },
    onSettled: () => {
      setIsGeneratingAI(false);
    },
  });

  const handleTemplateChange = (templateId: string) => {
    setSelectedTemplate(templateId);
    if (templateId) {
      const template = templates.find(t => t.id.toString() === templateId);
      if (template) {
        setMessageContent(template.content);
      }
    } else {
      setMessageContent("");
    }
  };

  const handleSendMessages = async () => {
    if (selectedLeads.size === 0) {
      toast({
        title: "No Leads Selected",
        description: "Please select at least one lead to send messages to.",
        variant: "destructive",
      });
      return;
    }

    if (!messageContent.trim()) {
      toast({
        title: "Message Required",
        description: "Please enter a message to send.",
        variant: "destructive",
      });
      return;
    }

    try {
      // Personalize message for each lead
      const personalizedMessages = Array.from(selectedLeads)
        .map(id => leads.find(lead => lead.id === id))
        .filter((lead): lead is Lead => Boolean(lead))
        .map(lead => ({
          phoneNumber: lead.phone,
          message: messageContent
            .replace(/\{name\}/g, lead.name)
            .replace(/\{product\}/g, lead.product)
            .replace(/\{loanAmount\}/g, lead.loanAmount || "Amount not specified")
            .replace(/\{amount\}/g, lead.loanAmount || "Amount not specified")
            .replace(/\{city\}/g, lead.city || "City not specified")
            .replace(/\{income\}/g, lead.incomeLevel || "Income not specified")
            .replace(/\{employment\}/g, lead.employment || "Employment not specified"),
        }));

      await sendMessageMutation.mutateAsync({
        messages: personalizedMessages,
        templateId: selectedTemplate || undefined,
      });

      setMessageContent("");
      setSelectedTemplate("");
      toast({
        title: "Messages Sent",
        description: `Successfully sent messages to ${selectedLeads.size} leads`,
      });
      onMessageSent?.();
    } catch (error) {
      console.error('Error sending messages:', error);
      toast({
        title: "Send Failed",
        description: "Failed to send messages. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleSaveTemplate = () => {
    if (!newTemplate.name.trim()) {
      toast({
        title: "Template Name Required",
        description: "Please enter a name for the template.",
        variant: "destructive",
      });
      return;
    }

    // If custom category is selected, use the custom category value
    const category = newTemplate.category === "custom" ? newTemplate.customCategory : newTemplate.category;

    createTemplateMutation.mutate({
      name: newTemplate.name,
      content: messageContent,
      category,
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

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case "pitch":
        return "Product Pitch";
      case "followup":
        return "Follow-up";
      case "greeting":
        return "Greeting";
      case "upsell":
        return "Upselling";
      default:
        return category;
    }
  };

  const categories = [
    { value: "pitch", label: "Product Pitch" },
    { value: "followup", label: "Follow-up" },
    { value: "greeting", label: "Greeting" },
    { value: "upsell", label: "Upselling" },
    { value: "custom", label: "Custom Category" },
  ];

  const handleGenerateAI = () => {
    if (selectedLeads.size === 0) {
      toast({
        title: "No Lead Selected",
        description: "Please select at least one lead to generate an AI suggestion.",
        variant: "destructive",
      });
      return;
    }
    setIsGeneratingAI(true);
    generateAISuggestionMutation.mutate();
  };

  // Add back a proper message preview
  const previewMessage = () => {
    if (!messageContent) return "";
    // Get first selected lead for preview
    const firstLeadId = Array.from(selectedLeads)[0];
    const firstLead = leads.find(lead => lead.id === firstLeadId);
    if (!firstLead) return messageContent;
    return messageContent
      .replace(/\{name\}/g, firstLead.name)
      .replace(/\{product\}/g, firstLead.product)
      .replace(/\{loanAmount\}/g, firstLead.loanAmount || "Amount not specified")
      .replace(/\{amount\}/g, firstLead.loanAmount || "Amount not specified")
      .replace(/\{city\}/g, firstLead.city || "City not specified")
      .replace(/\{income\}/g, firstLead.incomeLevel || "Income not specified")
      .replace(/\{employment\}/g, firstLead.employment || "Employment not specified");
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-poppins text-lg">Compose Message</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Template Selection */}
        <div className="space-y-2">
          <Label htmlFor="template" className="text-sm font-medium text-slate-700">
            Message Template
          </Label>
          <Select value={selectedTemplate} onValueChange={handleTemplateChange}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select Template" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="custom">Custom Message</SelectItem>
              {templates.map((template) => (
                <SelectItem key={template.id} value={template.id.toString()}>
                  <div className="flex items-center justify-between w-full">
                    <span>{template.name}</span>
                    <span className={`ml-2 px-2 py-0.5 rounded text-[10px] ${getCategoryColor(template.category)}`}>
                      {getCategoryLabel(template.category)}
                    </span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Message Content Preview */}
        <div className="space-y-2">
          <Label className="text-sm font-medium text-slate-700">
            Message Preview
          </Label>
          <div className="border border-slate-300 rounded-lg p-3 sm:p-4 bg-slate-50 min-h-24 sm:min-h-32">
            {messageContent ? (
              <div className="flex justify-start">
                <div className="relative max-w-[80%] bg-green-50 border border-green-200 rounded-2xl px-4 py-3 shadow-sm text-slate-800 whitespace-pre-line font-sans" style={{fontSize: '1rem', lineHeight: '1.5'}}>
                  {previewMessage()}
                  <span className="absolute bottom-1 right-2 flex items-center space-x-1 text-green-500 text-xs">
                    <svg width="16" height="16" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg"><rect width="32" height="32" rx="16" fill="#25D366"/><path d="M22.5 17.5C21.5 19.5 19.5 21.5 17.5 22.5C15.5 23.5 13.5 23.5 11.5 22.5C9.5 21.5 7.5 19.5 6.5 17.5C5.5 15.5 5.5 13.5 6.5 11.5C7.5 9.5 9.5 7.5 11.5 6.5C13.5 5.5 15.5 5.5 17.5 6.5C19.5 7.5 21.5 9.5 22.5 11.5C23.5 13.5 23.5 15.5 22.5 17.5Z" fill="white"/><path d="M13.5 16.5L15.5 18.5L19.5 14.5" stroke="#25D366" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    <span>WhatsApp</span>
                  </span>
                </div>
              </div>
            ) : (
              <div className="text-center text-slate-400 py-6 sm:py-8">
                <MessageCircle className="h-6 w-6 sm:h-8 sm:w-8 mx-auto mb-2" />
                <p className="text-xs sm:text-sm">Select a template or type a custom message</p>
              </div>
            )}
          </div>
        </div>

        {/* Custom Message Fields */}
        {selectedTemplate === "custom" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            <div className="space-y-2">
              <Label htmlFor="message-title" className="text-sm font-medium text-slate-700">
                Message Title
              </Label>
              <Input
                id="message-title"
                placeholder="Enter message title"
                value={newTemplate.name}
                onChange={(e) => setNewTemplate(prev => ({ ...prev, name: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="message-category" className="text-sm font-medium text-slate-700">
                Category
              </Label>
              <Select 
                value={newTemplate.category} 
                onValueChange={(value) => setNewTemplate(prev => ({ ...prev, category: value }))}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
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
          </div>
        )}

        {/* Message Editor */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="message" className="text-sm font-medium text-slate-700">
              Edit Message
            </Label>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={isGeneratingAI || !newTemplate.name || !newTemplate.category}
              onClick={handleGenerateAI}
              className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
            >
              {isGeneratingAI ? (
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
          <Textarea
            id="message"
            placeholder="Type your message here..."
            value={messageContent}
            onChange={(e) => setMessageContent(e.target.value)}
            className="min-h-24 sm:min-h-32 resize-none"
          />
        </div>

        {/* Action Buttons */}
        <div className="space-y-4 pt-4 border-t border-slate-200">
          <div className="flex flex-col space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-600">
                {selectedLeads.size} lead{selectedLeads.size !== 1 ? 's' : ''} selected
              </span>
              <Button 
                variant="outline" 
                size="sm"
                className="w-auto"
                onClick={() => setIsSaveTemplateDialogOpen(true)}
                disabled={!messageContent.trim()}
              >
                <Save className="mr-2 h-4 w-4" />
                Save Template
              </Button>
            </div>
            
            <Button
              onClick={handleSendMessages}
              disabled={sendMessageMutation.isPending || selectedLeads.size === 0 || !messageContent.trim()}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              {sendMessageMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <MessageCircle className="mr-2 h-4 w-4" />
                  Send Messages
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Save Template Dialog */}
        <Dialog open={isSaveTemplateDialogOpen} onOpenChange={setIsSaveTemplateDialogOpen}>
          <DialogContent className="w-full max-w-md sm:max-w-lg md:max-w-lg lg:max-w-lg p-4 md:p-6 rounded-2xl flex flex-col items-center">
            <DialogHeader className="w-full">
              <DialogTitle className="text-center w-full">Save Message Template</DialogTitle>
            </DialogHeader>
            <form className="flex flex-col items-center gap-4 py-2 md:gap-5 md:py-3 w-full">
              <div className="flex flex-col gap-2 w-full max-w-sm">
                <Label htmlFor="template-name">Template Name</Label>
                <Input
                  id="template-name"
                  placeholder="e.g., Home Loan Welcome"
                  value={newTemplate.name}
                  onChange={(e) => setNewTemplate(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full"
                />
              </div>
              <div className="flex flex-col gap-2 w-full max-w-sm">
                <Label htmlFor="template-category">Category</Label>
                <Select 
                  value={newTemplate.category} 
                  onValueChange={(value) => setNewTemplate(prev => ({ ...prev, category: value }))}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select category" />
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
              <div className="flex flex-col gap-2 w-full max-w-sm">
                <Label htmlFor="template-message">Message Content</Label>
                <Textarea
                  id="template-message"
                  placeholder="Enter your message content here..."
                  value={messageContent}
                  onChange={e => setMessageContent(e.target.value)}
                  className="w-full min-h-[120px]"
                />
              </div>
              <div className="flex justify-center gap-3 mt-2 w-full max-w-sm">
                <Button
                  variant="outline"
                  onClick={() => setIsSaveTemplateDialogOpen(false)}
                  type="button"
                  className="w-32"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSaveTemplate}
                  disabled={createTemplateMutation.isPending || !newTemplate.name.trim()}
                  type="button"
                  className="w-32"
                >
                  {createTemplateMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    "Save Template"
                  )}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* Send Status */}
        {selectedLeads.size > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-sm text-blue-800">
              Ready to send to {selectedLeads.size} lead{selectedLeads.size !== 1 ? 's' : ''}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}