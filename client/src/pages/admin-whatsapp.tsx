import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { MessageCircle, Download, CheckCircle, AlertCircle, Clock } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { whatsappConfigSchema } from "@shared/schema";
import { z } from "zod";

export default function AdminWhatsApp() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<z.infer<typeof whatsappConfigSchema>>({
    resolver: zodResolver(whatsappConfigSchema),
    defaultValues: {
      accessToken: "",
      phoneNumberId: "",
      businessAccountId: "",
      webhookVerifyToken: "",
      bookingConfirmationTemplateId: "none",
      appointmentReminderTemplateId: "none",
    },
  });

  const { data: config } = useQuery({
    queryKey: ["/api/whatsapp/config"],
  });

  const { data: templates, isLoading: templatesLoading } = useQuery({
    queryKey: ["/api/whatsapp/templates"],
  });

  const saveConfigMutation = useMutation({
    mutationFn: async (data: z.infer<typeof whatsappConfigSchema>) => {
      const response = await apiRequest("POST", "/api/whatsapp/config", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/whatsapp/config"] });
      toast({
        title: "Success",
        description: "WhatsApp configuration saved successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to save configuration.",
        variant: "destructive",
      });
    },
  });

  const fetchTemplatesMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/whatsapp/templates/fetch");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/whatsapp/templates"] });
      toast({
        title: "Success",
        description: "Templates fetched from Meta successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to fetch templates.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: z.infer<typeof whatsappConfigSchema>) => {
    saveConfigMutation.mutate(data);
  };

  const handleFetchTemplates = () => {
    fetchTemplatesMutation.mutate();
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case "approved":
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case "pending":
        return <Clock className="w-4 h-4 text-yellow-500" />;
      case "rejected":
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      default:
        return <AlertCircle className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "approved":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "pending":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
      case "rejected":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
    }
  };

  return (
    <div className="min-h-screen bg-deep-black text-white p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center gap-3 mb-8">
          <MessageCircle className="w-8 h-8 text-neon-green" />
          <h1 className="text-3xl font-bold">WhatsApp Business Configuration</h1>
        </div>

        {/* Configuration Form */}
        <Card className="bg-dark-gray border-gray-800">
          <CardHeader>
            <CardTitle className="text-white">WhatsApp Business API Settings</CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="accessToken"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-white">Access Token</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            type="password"
                            placeholder="Enter your WhatsApp Business API access token"
                            className="bg-deep-black border-gray-600 text-white"
                            data-testid="input-access-token"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="phoneNumberId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-white">Phone Number ID</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="Enter your phone number ID"
                            className="bg-deep-black border-gray-600 text-white"
                            data-testid="input-phone-number-id"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="businessAccountId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-white">Business Account ID</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="Enter your business account ID"
                            className="bg-deep-black border-gray-600 text-white"
                            data-testid="input-business-account-id"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="webhookVerifyToken"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-white">Webhook Verify Token (Optional)</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="Enter webhook verify token"
                            className="bg-deep-black border-gray-600 text-white"
                            data-testid="input-webhook-token"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Template Mapping Section */}
                {templates && Array.isArray(templates) && templates.length > 0 && (
                  <div className="space-y-4 border-t border-gray-700 pt-6 mb-6">
                    <h3 className="text-lg font-semibold text-white">Template Mapping</h3>
                    <p className="text-gray-400 text-sm">Choose which templates to use for different notifications</p>
                    
                    <div className="grid md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="bookingConfirmationTemplateId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-white">Booking Confirmation Template</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger className="bg-deep-black border-gray-600 text-white">
                                  <SelectValue placeholder="Select template for booking confirmations" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent className="bg-deep-black border-gray-600">
                                <SelectItem value="none">No template selected</SelectItem>
                                {(templates as any[])?.filter((t: any) => t.status === "APPROVED").map((template: any) => (
                                  <SelectItem key={template.templateId} value={template.templateId}>
                                    {template.templateName} ({template.category})
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
                        name="appointmentReminderTemplateId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-white">Appointment Reminder Template</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger className="bg-deep-black border-gray-600 text-white">
                                  <SelectValue placeholder="Select template for appointment reminders" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent className="bg-deep-black border-gray-600">
                                <SelectItem value="none">No template selected</SelectItem>
                                {(templates as any[])?.filter((t: any) => t.status === "APPROVED").map((template: any) => (
                                  <SelectItem key={template.templateId} value={template.templateId}>
                                    {template.templateName} ({template.category})
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
                )}

                <Button
                  type="submit"
                  disabled={saveConfigMutation.isPending}
                  className="bg-neon-green hover:bg-neon-green/90 text-black font-bold"
                  data-testid="button-save-config"
                >
                  {saveConfigMutation.isPending ? "Saving..." : "Save Configuration"}
                </Button>
              </form>
            </Form>

            {config && (
              <div className="mt-4 p-4 bg-green-900/20 border border-green-500/30 rounded-lg">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-400" />
                  <span className="text-green-400 font-medium">WhatsApp Business API is configured</span>
                </div>
                <p className="text-gray-400 text-sm mt-1">
                  Phone Number ID: ****{(config as any)?.phoneNumberId?.slice(-4) || ''}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Templates Management */}
        <Card className="bg-dark-gray border-gray-800">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-white">Message Templates</CardTitle>
              <Button
                onClick={handleFetchTemplates}
                disabled={fetchTemplatesMutation.isPending || !config}
                className="bg-blue-600 hover:bg-blue-700 text-white"
                data-testid="button-fetch-templates"
              >
                <Download className="w-4 h-4 mr-2" />
                {fetchTemplatesMutation.isPending ? "Fetching..." : "Fetch from Meta"}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {!config && (
              <div className="text-center py-8 text-gray-400">
                <MessageCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Please configure WhatsApp Business API first</p>
              </div>
            )}

            {config && templatesLoading && (
              <div className="text-center py-8 text-gray-400">Loading templates...</div>
            )}

            {config && templates && Array.isArray(templates) && templates.length === 0 && (
              <div className="text-center py-8 text-gray-400">
                <p>No templates found. Click "Fetch from Meta" to load your templates.</p>
              </div>
            )}

            {config && templates && Array.isArray(templates) && templates.length > 0 && (
              <Table>
                <TableHeader>
                  <TableRow className="border-gray-700">
                    <TableHead className="text-gray-300">Template Name</TableHead>
                    <TableHead className="text-gray-300">Category</TableHead>
                    <TableHead className="text-gray-300">Language</TableHead>
                    <TableHead className="text-gray-300">Status</TableHead>
                    <TableHead className="text-gray-300">Last Updated</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {templates.map((template: any) => (
                    <TableRow key={template.id} className="border-gray-700">
                      <TableCell className="text-white font-medium">
                        {template.templateName}
                      </TableCell>
                      <TableCell className="text-gray-300">
                        <Badge variant="outline" className="text-xs">
                          {template.category}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-gray-300">
                        {template.language.toUpperCase()}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getStatusIcon(template.status)}
                          <Badge className={`text-xs ${getStatusColor(template.status)}`}>
                            {template.status}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell className="text-gray-300 text-sm">
                        {new Date(template.updatedAt).toLocaleDateString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Usage Instructions */}
        <Card className="bg-dark-gray border-gray-800">
          <CardHeader>
            <CardTitle className="text-white">Setup Instructions</CardTitle>
          </CardHeader>
          <CardContent className="text-gray-300 space-y-4">
            <div>
              <h3 className="text-white font-semibold mb-2">1. Get Your WhatsApp Business API Credentials</h3>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li>Go to <a href="https://developers.facebook.com/" target="_blank" className="text-neon-green hover:underline">Meta for Developers</a></li>
                <li>Create a new app or select existing WhatsApp Business app</li>
                <li>Copy the Access Token from your app dashboard</li>
                <li>Copy Phone Number ID and Business Account ID from WhatsApp Business API section</li>
              </ul>
            </div>

            <div>
              <h3 className="text-white font-semibold mb-2">2. Create Message Templates</h3>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li>Create templates in Meta Business Manager for categories: <code>booking_confirmation</code>, <code>appointment_reminder</code></li>
                <li>Wait for template approval (usually takes 24-48 hours)</li>
                <li>Click "Fetch from Meta" to sync approved templates</li>
              </ul>
            </div>

            <div>
              <h3 className="text-white font-semibold mb-2">3. Automatic Notifications</h3>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li><strong>Booking Confirmation:</strong> Sent immediately after successful ₹299 payment</li>
                <li><strong>Appointment Reminder:</strong> Can be sent manually or scheduled before appointments</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}