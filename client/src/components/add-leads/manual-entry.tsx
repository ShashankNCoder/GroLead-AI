import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { insertLeadSchema } from "@shared/schema";
import { z } from "zod";

import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/use-auth';

const manualLeadSchema = insertLeadSchema.extend({
  phone: z.string().min(10, "Phone number must be at least 10 digits"),
  email: z.string().email("Invalid email address").optional().or(z.literal("")),
  address: z.string().nullable().transform(val => val || ""),
  city: z.string().nullable().transform(val => val || ""),
  state: z.string().nullable().transform(val => val || ""),
  pincode: z.string().nullable().transform(val => val || ""),
  product: z.string().nullable().transform(val => val || ""),
  otherProduct: z.string().optional(),
  incomeLevel: z.string().nullable().transform(val => val || ""),
  otherIncomeLevel: z.string().optional(),
  contactMethod: z.string().nullable().transform(val => val || ""),
  otherContactMethod: z.string().optional(),
  notes: z.string().nullable().transform(val => val || ""),
  lastContacted: z.string().nullable().transform(val => val || ""),
  employment: z.string().nullable().transform(val => val || ""),
  otherEmployment: z.string().optional(),
  pastInteractions: z.string().transform(val => {
    if (val === "3+") return 3;
    return parseInt(val) || 0;
  }),
});

type ManualLeadForm = z.infer<typeof manualLeadSchema>;

export default function ManualEntry() {
  const [isRepeatLead, setIsRepeatLead] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();

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
      otherProduct: "",
      incomeLevel: "",
      otherIncomeLevel: "",
      source: "manual",
      contactMethod: "",
      otherContactMethod: "",
      pastInteractions: 0,
      status: "new",
      notes: "",
      employment: "",
      otherEmployment: "",
    },
  });

  const addLeadMutation = useMutation({
    mutationFn: async (data: ManualLeadForm) => {
      if (!user) throw new Error("User not authenticated");
      const leadData = {
        name: data.name,
        phone: data.phone,
        email: data.email || null,
        address: data.address || null,
        city: data.city || null,
        state: data.state || null,
        pincode: data.pincode || null,
        product: data.product === "Other" ? data.otherProduct : data.product,
        income_level: data.incomeLevel === "Other" ? data.otherIncomeLevel : data.incomeLevel || null,
        source: 'manual',
        contact_method: data.contactMethod === "Other" ? data.otherContactMethod : data.contactMethod || null,
        past_interactions: typeof data.pastInteractions === 'string'
          ? (data.pastInteractions === "3+" ? 3 : parseInt(data.pastInteractions) || 0)
          : data.pastInteractions,
        status: data.status || 'new',
        notes: data.notes || null,
        whatsapp_status: 'not_sent',
        employment: data.employment === "Other" ? data.otherEmployment : data.employment || null,
        last_contacted: data.lastContacted ? new Date(data.lastContacted) : null,
        ai_score: 0,
        user_id: user.id,
      };
      
      const { data: result, error } = await supabase
        .from('leads')
        .insert([leadData])
        .select()
        .single();

      if (error) throw error;
      return result;
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
      console.error('Add Lead Error:', error);
      toast({
        title: "Error",
        description: JSON.stringify(error, null, 2) || "Failed to add lead.",
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
    "Other"
  ];

  const incomeLevels = [
    "₹25,000",
    "₹50,000",
    "₹1,00,000",
    "₹2,00,000+",
    "Other"
  ];

  const employment = [
    "Salaried",
    "Self Employed",
    "Business Owner",
    "Other"
  ];

  const contactMethods = [
    "Referral",
    "Phone",
    "Other"
  ];

  const interactionCounts = ["0", "1", "2", "3+"];
  const leadStatuses = ["new", "contacted", "dropped"];

  return (
    <Card className="w-full max-w-5xl mx-auto shadow-lg border border-gray-100 bg-white dark:bg-gray-900 dark:border-gray-800">
      <div className="text-center py-3 px-2 sm:p-6 border-b border-gray-100 dark:border-gray-800">
        
      </div>
      
      <div className="py-3 px-2 sm:p-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 sm:space-y-8">
            
            {/* Basic Information Section */}
            <div className="space-y-3 sm:space-y-4">
              <h3 className="text-base sm:text-lg md:text-xl font-semibold text-gray-900 dark:text-gray-100 border-l-4 border-blue-500 pl-3">
                Basic Information
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium text-gray-700 dark:text-gray-300">Lead Name *</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="e.g., Raj Kumar" 
                          className="h-9 sm:h-10 focus-ring border-gray-300" 
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
                          placeholder="+919xxxxxxxxxx" 
                          className="h-9 sm:h-10 focus-ring border-gray-300" 
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
                          className="h-9 sm:h-10 focus-ring border-gray-300" 
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
            <div className="space-y-3 sm:space-y-4">
              <h3 className="text-base sm:text-lg md:text-xl font-semibold text-gray-900 dark:text-gray-100 border-l-4 border-green-500 pl-3">
                Address Details
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                <FormField
                  control={form.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem className="sm:col-span-2">
                      <FormLabel className="text-sm font-medium text-gray-700 dark:text-gray-300">Address</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="e.g., 123 Main Street" 
                          className="h-9 sm:h-10 focus-ring border-gray-300" 
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
                          placeholder="Chikkabalapura" 
                          className="h-9 sm:h-10 focus-ring border-gray-300" 
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
                          placeholder="Karnataka" 
                          className="h-9 sm:h-10 focus-ring border-gray-300" 
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
                          placeholder="562105" 
                          className="h-9 sm:h-10 focus-ring border-gray-300" 
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
            <div className="space-y-3 sm:space-y-4">
              <h3 className="text-base sm:text-lg md:text-xl font-semibold text-gray-900 dark:text-gray-100 border-l-4 border-purple-500 pl-3">
                Product & Financial Details
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                <FormField
                  control={form.control}
                  name="product"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium text-gray-700 dark:text-gray-300">Product Interest *</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value?.toString() ?? undefined}>
                        <FormControl>
                          <SelectTrigger className="h-9 sm:h-10 focus-ring border-gray-300">
                            <SelectValue placeholder="Select product" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent position="popper" className="w-[--radix-select-trigger-width]">
                          {products.map((product) => (
                            <SelectItem key={product} value={product}>
                              {product}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {field.value === "Other" && (
                        <FormField
                          control={form.control}
                          name="otherProduct"
                          render={({ field }) => (
                            <FormItem className="mt-2">
                              <FormControl>
                                <Input 
                                  placeholder="Please specify product" 
                                  className="h-9 sm:h-10 focus-ring border-gray-300" 
                                  {...field} 
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      )}
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
                      <Select onValueChange={field.onChange} defaultValue={field.value?.toString() ?? undefined}>
                        <FormControl>
                          <SelectTrigger className="h-9 sm:h-10 focus-ring border-gray-300">
                            <SelectValue placeholder="Select income" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent position="popper" className="w-[--radix-select-trigger-width]">
                          {incomeLevels.map((income) => (
                            <SelectItem key={income} value={income}>
                              {income}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {field.value === "Other" && (
                        <FormField
                          control={form.control}
                          name="otherIncomeLevel"
                          render={({ field }) => (
                            <FormItem className="mt-2">
                              <FormControl>
                                <Input 
                                  placeholder="Please specify income level" 
                                  className="h-9 sm:h-10 focus-ring border-gray-300" 
                                  {...field} 
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      )}
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="employment"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium text-gray-700 dark:text-gray-300">Employment</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value?.toString() ?? undefined}>
                        <FormControl>
                          <SelectTrigger className="h-9 sm:h-10 focus-ring border-gray-300">
                            <SelectValue placeholder="Select employment" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent position="popper" className="w-[--radix-select-trigger-width]">
                          {employment.map((emp) => (
                            <SelectItem key={emp} value={emp}>
                              {emp}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {field.value === "Other" && (
                        <FormField
                          control={form.control}
                          name="otherEmployment"
                          render={({ field }) => (
                            <FormItem className="mt-2">
                              <FormControl>
                                <Input 
                                  placeholder="Please specify employment type" 
                                  className="h-9 sm:h-10 focus-ring border-gray-300" 
                                  {...field} 
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      )}
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
                      <Select onValueChange={field.onChange} defaultValue={field.value?.toString() ?? undefined}>
                        <FormControl>
                          <SelectTrigger className="h-9 sm:h-10 focus-ring border-gray-300">
                            <SelectValue placeholder="How to contact" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent position="popper" className="w-[--radix-select-trigger-width]">
                          {contactMethods.map((method) => (
                            <SelectItem key={method} value={method}>
                              {method}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {field.value === "Other" && (
                        <FormField
                          control={form.control}
                          name="otherContactMethod"
                          render={({ field }) => (
                            <FormItem className="mt-2">
                              <FormControl>
                                <Input 
                                  placeholder="Please specify" 
                                  className="h-9 sm:h-10 focus-ring border-gray-300" 
                                  {...field} 
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      )}
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Additional Information Section */}
            <div className="space-y-3 sm:space-y-4">
              <h3 className="text-base sm:text-lg md:text-xl font-semibold text-gray-900 dark:text-gray-100 border-l-4 border-orange-500 pl-3">
                Additional Information
              </h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                <FormField
                  control={form.control}
                  name="lastContacted"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium text-gray-700 dark:text-gray-300">Last Contacted</FormLabel>
                      <FormControl>
                        <Input 
                          type="date"
                          className="h-9 sm:h-10 focus-ring border-gray-300" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="pastInteractions"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium text-gray-700 dark:text-gray-300">No. of Past Interactions</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value?.toString() ?? undefined}>
                        <FormControl>
                          <SelectTrigger className="h-9 sm:h-10 focus-ring border-gray-300">
                            <SelectValue placeholder="Select count" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent position="popper" className="w-[--radix-select-trigger-width]">
                          {interactionCounts.map((count) => (
                            <SelectItem key={count} value={count}>
                              {count}
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
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium text-gray-700 dark:text-gray-300">Status</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value?.toString() ?? undefined}>
                        <FormControl>
                          <SelectTrigger className="h-9 sm:h-10 focus-ring border-gray-300">
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent position="popper" className="w-[--radix-select-trigger-width]">
                          {leadStatuses.map((status) => (
                            <SelectItem key={status} value={status.toLowerCase()}>
                              {status}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

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

            <div className="flex justify-center pt-4">
              <Button 
                type="submit" 
                className="w-full sm:w-3/4 h-10 sm:h-12 text-sm sm:text-base font-semibold gradient-primary hover:bg-gray-600 text-white shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50"
                disabled={addLeadMutation.isPending}
              >
                {addLeadMutation.isPending ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    Adding Lead...
                  </div>
                ) : (
                  "Add Lead"
                )}
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </Card>
  );
}
