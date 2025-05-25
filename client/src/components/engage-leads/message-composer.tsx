import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Image, Paperclip, Smile, Save, MessageCircle, Loader2 } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { MessageTemplate, Lead } from "@shared/schema";

interface MessageComposerProps {
  selectedLeads: Set<number>;
  onMessageSent?: () => void;
}

export default function MessageComposer({ selectedLeads, onMessageSent }: MessageComposerProps) {
  const [selectedTemplate, setSelectedTemplate] = useState<string>("");
  const [messageContent, setMessageContent] = useState<string>("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: templates = [] } = useQuery<MessageTemplate[]>({
    queryKey: ["/api/templates"],
  });

  const { data: leads = [] } = useQuery<Lead[]>({
    queryKey: ["/api/leads"],
  });

  const sendMessageMutation = useMutation({
    mutationFn: async (data: { leadIds: number[]; message: string; templateId?: string }) => {
      await apiRequest("POST", "/api/whatsapp/send", data);
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

  const handleSendMessages = () => {
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

    sendMessageMutation.mutate({
      leadIds: Array.from(selectedLeads),
      message: messageContent,
      templateId: selectedTemplate || undefined,
    });
  };

  const previewMessage = () => {
    if (!messageContent) return "";
    
    // Get first selected lead for preview
    const firstLeadId = Array.from(selectedLeads)[0];
    const firstLead = leads.find(lead => lead.id === firstLeadId);
    
    if (!firstLead) return messageContent;

    // Replace placeholders with actual data
    return messageContent
      .replace(/\{name\}/g, firstLead.name)
      .replace(/\{product\}/g, firstLead.product)
      .replace(/\{loanAmount\}/g, firstLead.loanAmount || "Amount not specified")
      .replace(/\{amount\}/g, firstLead.loanAmount || "Amount not specified");
  };

  const WhatsAppPreview = () => {
    const preview = previewMessage();
    if (!preview) return null;

    const messages = preview.split('\n\n').filter(msg => msg.trim());

    return (
      <div className="space-y-2">
        {messages.map((message, index) => (
          <div key={index} className="whatsapp-bubble">
            {message.trim()}
          </div>
        ))}
      </div>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Compose Message</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Template Selection */}
        <div>
          <Label htmlFor="template" className="text-sm font-medium text-slate-700 mb-2 block">
            Message Template
          </Label>
          <Select value={selectedTemplate} onValueChange={handleTemplateChange}>
            <SelectTrigger>
              <SelectValue placeholder="Select Template" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Custom Message</SelectItem>
              {templates.map((template) => (
                <SelectItem key={template.id} value={template.id.toString()}>
                  {template.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Message Content Preview */}
        <div>
          <Label className="text-sm font-medium text-slate-700 mb-2 block">
            Message Preview
          </Label>
          <div className="border border-slate-300 rounded-lg p-4 bg-slate-50 min-h-32">
            {messageContent ? (
              <WhatsAppPreview />
            ) : (
              <div className="text-center text-slate-400 py-8">
                <MessageCircle className="h-8 w-8 mx-auto mb-2" />
                <p className="text-sm">Select a template or type a custom message</p>
              </div>
            )}
          </div>
        </div>

        {/* Message Editor */}
        <div>
          <Label htmlFor="message" className="text-sm font-medium text-slate-700 mb-2 block">
            Edit Message
          </Label>
          <Textarea
            id="message"
            placeholder="Type your message here..."
            value={messageContent}
            onChange={(e) => setMessageContent(e.target.value)}
            className="min-h-32"
          />
          <p className="text-xs text-slate-500 mt-1">
            Use placeholders: {"{name}"}, {"{product}"}, {"{loanAmount}"}
          </p>
        </div>

        {/* Media Attachments and Send Actions */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-200">
          <div className="flex items-center space-x-3">
            <Button variant="ghost" size="sm" className="text-slate-600 hover:text-slate-700">
              <Image className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" className="text-slate-600 hover:text-slate-700">
              <Paperclip className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" className="text-slate-600 hover:text-slate-700">
              <Smile className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="flex items-center space-x-3">
            <span className="text-sm text-slate-600">
              {selectedLeads.size} lead{selectedLeads.size !== 1 ? 's' : ''} selected
            </span>
            <Button variant="outline" size="sm">
              <Save className="mr-2 h-4 w-4" />
              Save Template
            </Button>
            <Button
              onClick={handleSendMessages}
              disabled={sendMessageMutation.isPending || selectedLeads.size === 0 || !messageContent.trim()}
              className="bg-green-600 hover:bg-green-700"
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
