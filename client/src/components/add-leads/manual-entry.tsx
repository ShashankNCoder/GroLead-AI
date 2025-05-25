import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { insertLeadSchema } from "@shared/schema";
import { z } from "zod";

const manualLeadSchema = insertLeadSchema.extend({
  phone: z.string().min(10, "Phone number must be at least 10 digits"),
  email: z.string().email("Invalid email address").optional().or(z.literal("")),
});

type ManualLeadForm = z.infer<typeof manualLeadSchema>;

export default function ManualEntry() {
  const [isRepeatLead, setIsRepeatLead] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<ManualLeadForm>({
    resolver: zodResolver(manualLeadSchema),
    defaultValues: {
      name: "",
      phone: "",
      email: "",
      address: "",
      city: "",
      state: "",
      pincode: "",
      product: "",
      incomeLevel: "",
      source: "manual",
      contactMethod: "",
      pastInteractions: 0,
      status: "new",
      notes: "",
      whatsappStatus: "not_sent",
    },
  });

  const addLeadMutation = useMutation({
    mutationFn: async (data: ManualLeadForm) => {
      const leadData = {
        ...data,
        email: data.email || null, // Convert empty string to null
      };
      await apiRequest("POST", "/api/leads", leadData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/leads"] });
      queryClient.invalidateQueries({ queryKey: ["/api/analytics"] });
      toast({
        title: "Lead Added",
        description: "New lead has been added successfully.",
      });
      form.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to add lead.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: ManualLeadForm) => {
    addLeadMutation.mutate(data);
  };

  const products = [
    "Credit Card",
    "Personal Loan", 
    "Insurance",
    "Home Loan",
    "Car Loan",
    "Business Loan",
  ];

  const incomeLevels = [
    "₹25,000",
    "₹50,000",
    "₹1,00,000",
    "₹2,00,000+",
  ];

  const contactMethods = [
    "WhatsApp",
    "Phone",
    "In-Person",
  ];

  return (
    <div className="w-full max-w-5xl mx-auto p-4 md:p-6">
      <Card className="shadow-lg border-0 bg-gradient-to-br from-white via-blue-50/30 to-indigo-50/40 dark:from-gray-900 dark:via-blue-950/30 dark:to-indigo-950/40">
        <div className="text-center p-6 border-b border-gray-200/50">
          <h2 className="text-2xl md:text-3xl font-bold gradient-text mb-2">Add New Lead</h2>
          <p className="text-gray-600 dark:text-gray-300 text-sm md:text-base">
            Enter lead details manually for AI scoring and immediate processing
          </p>
        </div>
        
        <div className="p-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              
              {/* Basic Information Section */}
              <div className="space-y-4">
                <h3 className="text-lg md:text-xl font-semibold text-gray-900 dark:text-gray-100 border-l-4 border-blue-500 pl-3">
                  Basic Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium text-gray-700 dark:text-gray-300">Lead Name *</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="e.g., Raj Kumar" 
                            className="h-11 focus-ring border-gray-300" 
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium text-gray-700 dark:text-gray-300">Phone *</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="9876543210" 
                            className="h-11 focus-ring border-gray-300" 
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium text-gray-700 dark:text-gray-300">Email</FormLabel>
                        <FormControl>
                          <Input 
                            type="email"
                            placeholder="raj@example.com" 
                            className="h-11 focus-ring border-gray-300" 
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Address Information Section */}
              <div className="space-y-4">
                <h3 className="text-lg md:text-xl font-semibold text-gray-900 dark:text-gray-100 border-l-4 border-green-500 pl-3">
                  Address Details
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <FormField
                    control={form.control}
                    name="address"
                    render={({ field }) => (
                      <FormItem className="md:col-span-2">
                        <FormLabel className="text-sm font-medium text-gray-700 dark:text-gray-300">Address</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="e.g., 123 Main Street" 
                            className="h-11 focus-ring border-gray-300" 
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="city"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium text-gray-700 dark:text-gray-300">City</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Mumbai" 
                            className="h-11 focus-ring border-gray-300" 
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="state"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium text-gray-700 dark:text-gray-300">State</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Maharashtra" 
                            className="h-11 focus-ring border-gray-300" 
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="pincode"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium text-gray-700 dark:text-gray-300">Pincode</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="400001" 
                            className="h-11 focus-ring border-gray-300" 
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Product & Financial Information Section */}
              <div className="space-y-4">
                <h3 className="text-lg md:text-xl font-semibold text-gray-900 dark:text-gray-100 border-l-4 border-purple-500 pl-3">
                  Product & Financial Details
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="product"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium text-gray-700 dark:text-gray-300">Product Interest *</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger className="h-11 focus-ring border-gray-300">
                              <SelectValue placeholder="Select product" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {products.map((product) => (
                              <SelectItem key={product} value={product}>
                                {product}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="incomeLevel"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium text-gray-700 dark:text-gray-300">Income Level</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger className="h-11 focus-ring border-gray-300">
                              <SelectValue placeholder="Select income" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {incomeLevels.map((income) => (
                              <SelectItem key={income} value={income}>
                                {income}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="contactMethod"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium text-gray-700 dark:text-gray-300">Contact Method</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger className="h-11 focus-ring border-gray-300">
                              <SelectValue placeholder="How to contact" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {contactMethods.map((method) => (
                              <SelectItem key={method} value={method}>
                                {method}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Additional Information Section */}
              <div className="space-y-4">
                <h3 className="text-lg md:text-xl font-semibold text-gray-900 dark:text-gray-100 border-l-4 border-orange-500 pl-3">
                  Additional Information
                </h3>
                
                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium text-gray-700 dark:text-gray-300">Short Notes about Lead</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Add any relevant notes about this lead..."
                          className="min-h-[100px] focus-ring border-gray-300 resize-none"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <Button 
                type="submit" 
                className="w-full h-12 text-base font-semibold gradient-primary text-white shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50"
                disabled={addLeadMutation.isPending}
              >
                {addLeadMutation.isPending ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    Adding Lead...
                  </div>
                ) : (
                  "Add Lead & Generate AI Score"
                )}
              </Button>
            </form>
          </Form>
        </div>
      </Card>
    </div>
  );
}
