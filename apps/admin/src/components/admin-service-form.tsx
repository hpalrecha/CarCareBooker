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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { minutesToDurationInput, durationInputToMinutes, type DurationUnit } from "@/lib/duration-input";
import { X } from "lucide-react";

interface AdminServiceFormProps {
  isOpen: boolean;
  onClose: () => void;
  editingService?: any;
}

/**
 * Deliberately minimal: name, content (description), price and duration are the only
 * things staff change day to day. Everything else a service record carries — hero copy,
 * process steps, testimonials, FAQs, gallery/images, SEO meta — is real content already
 * on the live pages, so this form never reads or submits those fields. On edit, only
 * {title, description, price, originalPrice, duration, durationText} go in the PUT body;
 * storage.updateService() does a partial column set, so every field this form doesn't
 * send is left exactly as it is in the database. Creating a brand-new service still
 * needs a slug (server-generated from the title), so that is filled in silently rather
 * than asked for.
 *
 * Duration is edited as a value+unit pair (lib/duration-input.ts) and converted to the
 * integer minutes the `duration` column has always stored — the API payload shape and the
 * DB column are unchanged, only how the admin types the number changed. The optional
 * "display text override" writes `durationText` (nullable column, added 2026-09-28), which
 * lib/service-time.ts's formatServiceTime() shows instead of the computed value, for a
 * turnaround that's a range or "depends on condition" — a single minutes figure can't
 * express that. Neither of these has anything to do with a service's marketed
 * warranty/validity period (e.g. "1 Year Ceramic Coating") — that text lives in the
 * title/description and is untouched by this form.
 */
const formSchema = z
  .object({
    title: z.string().min(1, "Service name is required"),
    description: z.string().min(1, "Content is required"),
    price: z.string().min(1, "Price is required"),
    originalPrice: z.string().optional(),
    durationValue: z.string().min(1, "Duration is required"),
    durationUnit: z.enum(["minutes", "hours", "days"]),
    durationText: z.string().optional(),
  })
  .refine((data) => Number.isFinite(Number(data.durationValue)) && Number(data.durationValue) > 0, {
    message: "Enter a duration greater than 0",
    path: ["durationValue"],
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
      durationValue: "",
      durationUnit: "minutes",
      durationText: "",
    },
  });

  useEffect(() => {
    if (isOpen) {
      const { value: durationValue, unit: durationUnit } = minutesToDurationInput(editingService?.duration);
      form.reset({
        title: editingService?.title || "",
        description: editingService?.description || "",
        price: editingService?.price?.toString() || "",
        originalPrice: editingService?.originalPrice?.toString() || "",
        durationValue,
        durationUnit,
        durationText: editingService?.durationText || "",
      });
    }
  }, [editingService, isOpen, form]);

  const durationValue = form.watch("durationValue");
  const durationUnit = form.watch("durationUnit");
  const storedMinutesPreview = durationInputToMinutes(durationValue, durationUnit);

  const serviceActionMutation = useMutation({
    mutationFn: async (data: FormValues) => {
      if (editingService?.id) {
        const payload = {
          title: data.title,
          description: data.description,
          price: String(data.price),
          originalPrice: data.originalPrice ? String(data.originalPrice) : null,
          duration: durationInputToMinutes(data.durationValue, data.durationUnit),
          durationText: data.durationText?.trim() ? data.durationText.trim() : null,
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
          duration: durationInputToMinutes(data.durationValue, data.durationUnit),
          durationText: data.durationText?.trim() || undefined,
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
      <DialogContent className="admin-x admin-dialog max-w-lg bg-dark-gray text-white border-medium-gray flex flex-col max-h-[85vh] overflow-hidden">
        <DialogHeader className="flex-shrink-0">
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
          {/* Fixed header/footer, scrolling middle: the field list grew past a typical
              viewport height once duration became value+unit+override (3 fields instead
              of 1), which pushed the close button and Update/Cancel off-screen with no way
              to reach them. Only this middle section scrolls now. */}
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col flex-1 min-h-0">
            <div className="space-y-4 overflow-y-auto flex-1 min-h-0 pr-1 -mr-1">
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

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="durationValue"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-white">Duration *</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="number"
                        step="any"
                        min="0"
                        className="bg-medium-gray border-gray-600 text-white"
                        placeholder="1"
                        data-testid="input-service-duration"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="durationUnit"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-white">Unit</FormLabel>
                    <Select onValueChange={(v) => field.onChange(v as DurationUnit)} value={field.value}>
                      <FormControl>
                        <SelectTrigger
                          className="bg-medium-gray border-gray-600 text-white"
                          data-testid="select-service-duration-unit"
                        >
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="minutes">Minutes</SelectItem>
                        <SelectItem value="hours">Hours</SelectItem>
                        <SelectItem value="days">Days</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            {Number.isFinite(storedMinutesPreview) && (
              <p className="text-xs text-gray-400" data-testid="text-duration-stored-preview">
                Stored as {storedMinutesPreview} minute{storedMinutesPreview === 1 ? "" : "s"}
              </p>
            )}

            <FormField
              control={form.control}
              name="durationText"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-white">Display text override (optional)</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      className="bg-medium-gray border-gray-600 text-white"
                      placeholder='e.g. "36-48 hrs" or "2-3 days"'
                      data-testid="input-service-duration-text"
                    />
                  </FormControl>
                  <p className="text-xs text-gray-400">
                    Shown on the site instead of the number above — for a turnaround that's a range or depends on
                    the car's condition. Leave blank to show the computed value.
                  </p>
                  <FormMessage />
                </FormItem>
              )}
            />

            {editingService && (
              <p className="text-xs text-gray-400">
                Photos and other page content (hero copy, testimonials, FAQs, gallery) stay exactly as they are and aren't editable here.
              </p>
            )}
            </div>

            <div className="flex justify-end space-x-4 pt-4 border-t border-gray-600 flex-shrink-0">
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
