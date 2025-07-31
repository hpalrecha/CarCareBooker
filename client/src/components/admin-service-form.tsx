import { useMutation } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { insertServiceSchema } from "@shared/schema";
import { X, Plus, Minus } from "lucide-react";
import { useState } from "react";

interface AdminServiceFormProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AdminServiceForm({ isOpen, onClose }: AdminServiceFormProps) {
  const { toast } = useToast();
  const [includedItems, setIncludedItems] = useState<string[]>([""]);

  const form = useForm({
    resolver: zodResolver(insertServiceSchema),
    defaultValues: {
      title: "",
      description: "",
      whyChoose: "",
      whatIncluded: [""],
      price: "",
      originalPrice: "",
      duration: 60,
      images: [],
      isActive: true,
    },
  });

  const createServiceMutation = useMutation({
    mutationFn: async (data: any) => {
      const serviceData = {
        ...data,
        whatIncluded: includedItems.filter(item => item.trim() !== ""),
        duration: parseInt(data.duration),
      };
      const response = await apiRequest("POST", "/api/services", serviceData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/services"] });
      toast({
        title: "Service Created",
        description: "The service has been successfully created.",
      });
      onClose();
      form.reset();
      setIncludedItems([""]);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create service.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: any) => {
    createServiceMutation.mutate(data);
  };

  const addIncludedItem = () => {
    setIncludedItems([...includedItems, ""]);
  };

  const removeIncludedItem = (index: number) => {
    if (includedItems.length > 1) {
      setIncludedItems(includedItems.filter((_, i) => i !== index));
    }
  };

  const updateIncludedItem = (index: number, value: string) => {
    const newItems = [...includedItems];
    newItems[index] = value;
    setIncludedItems(newItems);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-dark-gray text-white border-medium-gray">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold gradient-text" data-testid="text-service-form-title">
            Create New Service
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
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-white">Service Title</FormLabel>
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

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="price"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-white">Price (₹)</FormLabel>
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
                      <FormLabel className="text-white">Original Price (₹)</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="number"
                          step="0.01"
                          className="bg-medium-gray border-gray-600 text-white"
                          placeholder="3499"
                          data-testid="input-service-original-price"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <FormField
              control={form.control}
              name="duration"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-white">Duration (minutes)</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type="number"
                      className="bg-medium-gray border-gray-600 text-white"
                      placeholder="120"
                      data-testid="input-service-duration"
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
                  <FormLabel className="text-white">Description</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      className="bg-medium-gray border-gray-600 text-white"
                      placeholder="Brief description of the service..."
                      rows={3}
                      data-testid="textarea-service-description"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="whyChoose"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-white">Why Choose This Service?</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      className="bg-medium-gray border-gray-600 text-white"
                      placeholder="Explain the benefits and unique aspects of this service..."
                      rows={4}
                      data-testid="textarea-why-choose"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div>
              <Label className="text-white mb-4 block">What's Included</Label>
              <div className="space-y-3">
                {includedItems.map((item, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <Input
                      value={item}
                      onChange={(e) => updateIncludedItem(index, e.target.value)}
                      className="bg-medium-gray border-gray-600 text-white flex-1"
                      placeholder="Service inclusion..."
                      data-testid={`input-included-${index}`}
                    />
                    {includedItems.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeIncludedItem(index)}
                        className="text-red-400 hover:text-red-300"
                        data-testid={`button-remove-included-${index}`}
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={addIncludedItem}
                  className="text-neon-green hover:text-green-300"
                  data-testid="button-add-included"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Item
                </Button>
              </div>
            </div>

            <div className="flex justify-end space-x-4 pt-6 border-t border-gray-600">
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
                className="bg-neon-green text-deep-black hover:bg-neon-green/90 neon-glow"
                disabled={createServiceMutation.isPending}
                data-testid="button-create-service"
              >
                {createServiceMutation.isPending ? "Creating..." : "Create Service"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
