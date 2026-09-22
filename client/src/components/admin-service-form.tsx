import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { X } from "lucide-react";

interface AdminServiceFormProps {
  isOpen: boolean;
  onClose: () => void;
  editingService?: any;
}

/**
 * Deliberately minimal: name, content (description) and price are the only things staff
 * change day to day. Everything else a service record carries — hero copy, process steps,
 * testimonials, FAQs, gallery/images, SEO meta — is real content already on the live
 * pages, so this form never reads or submits those fields. On edit, only {title,
 * description, price, originalPrice} go in the PUT body; storage.updateService() does a
 * partial column set, so every field this form doesn't send is left exactly as it is in
 * the database. Creating a brand-new service still needs a duration (DB column is
 * NOT NULL with no default) and a slug (server-generated from the title), so those are
 * filled in silently rather than asked for.
 */
const NEW_SERVICE_DEFAULT_DURATION_MINUTES = 60;

const formSchema = z.object({
  title: z.string().min(1, "Service name is required"),
  description: z.string().min(1, "Content is required"),
  price: z.string().min(1, "Price is required"),
  originalPrice: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

export default function AdminServiceForm({ isOpen, onClose, editingService }: AdminServiceFormProps) {
  const { toast } = useToast();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
      price: "",
      originalPrice: "",
    },
  });

  useEffect(() => {
    if (isOpen) {
      form.reset({
        title: editingService?.title || "",
        description: editingService?.description || "",
        price: editingService?.price?.toString() || "",
        originalPrice: editingService?.originalPrice?.toString() || "",
      });
    }
  }, [editingService, isOpen, form]);

  const serviceActionMutation = useMutation({
    mutationFn: async (data: FormValues) => {
      if (editingService?.id) {
        const payload = {
          title: data.title,
          description: data.description,
          price: String(data.price),
          originalPrice: data.originalPrice ? String(data.originalPrice) : null,
        };
        const response = await apiRequest("PUT", `/api/services/${editingService.id}`, payload);
        const text = await response.text();
        return text ? JSON.parse(text) : {};
      } else {
        const payload = {
          title: data.title,
          description: data.description,
          price: String(data.price),
          originalPrice: data.originalPrice ? String(data.originalPrice) : undefined,
          duration: NEW_SERVICE_DEFAULT_DURATION_MINUTES,
          isActive: true,
        };
        const response = await apiRequest("POST", "/api/services", payload);
        const text = await response.text();
        return text ? JSON.parse(text) : {};
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/services"] });
      toast({
        title: editingService?.id ? "Service Updated" : "Service Created",
        description: `The service has been successfully ${editingService?.id ? "updated" : "created"}.`,
      });
      onClose();
      form.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to save service.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: FormValues) => {
    serviceActionMutation.mutate(data);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg bg-dark-gray text-white border-medium-gray">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold gradient-text" data-testid="text-service-form-title">
            {editingService ? `Edit Service: ${editingService.title}` : "Create New Service"}
          </DialogTitle>
          <Button
            variant="ghost"
            size="sm"
            className="absolute right-4 top-4 text-gray-400 hover:text-white"
            onClick={onClose}
            data-testid="button-close-form"
          >
            <X className="h-4 w-4" />
          </Button>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-white">Service Name *</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      className="bg-medium-gray border-gray-600 text-white"
                      placeholder="e.g., Premium Wash & Detail"
                      data-testid="input-service-title"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-white">Content *</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      className="bg-medium-gray border-gray-600 text-white"
                      placeholder="What this service is and what's included..."
                      rows={5}
                      data-testid="textarea-service-description"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-white">Price (₹) *</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="number"
                        step="0.01"
                        className="bg-medium-gray border-gray-600 text-white"
                        placeholder="2999"
                        data-testid="input-service-price"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="originalPrice"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-white">Was Price (₹)</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="number"
                        step="0.01"
                        className="bg-medium-gray border-gray-600 text-white"
                        placeholder="Optional"
                        data-testid="input-service-original-price"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {editingService && (
              <p className="text-xs text-gray-400">
                Photos and other page content (hero copy, testimonials, FAQs, gallery) stay exactly as they are and aren't editable here.
              </p>
            )}

            <div className="flex justify-end space-x-4 pt-4 border-t border-gray-600">
              <Button
                type="button"
                variant="ghost"
                onClick={onClose}
                className="text-gray-400 hover:text-white"
                data-testid="button-cancel"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-neon-green text-deep-black hover:bg-neon-green/90 neon-glow px-8"
                disabled={serviceActionMutation.isPending}
                data-testid="button-service-action"
              >
                {serviceActionMutation.isPending
                  ? (editingService ? "Updating..." : "Creating...")
                  : (editingService ? "Update Service" : "Create Service")}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
