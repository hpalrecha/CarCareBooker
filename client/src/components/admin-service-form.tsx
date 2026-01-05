import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { insertServiceSchema } from "@shared/schema";
import { X, Plus, Minus, Upload, Play, Image as ImageIcon, Star, HelpCircle } from "lucide-react";

interface AdminServiceFormProps {
  isOpen: boolean;
  onClose: () => void;
  editingService?: any;
}

interface ProcessStep {
  step: number;
  title: string;
  description: string;
}

interface BeforeAfter {
  before: string;
  after: string;
  description?: string;
}

interface GalleryItem {
  url: string;
  type: 'image' | 'video';
  caption?: string;
}

interface Testimonial {
  name: string;
  rating: number;
  comment: string;
  image?: string;
}

interface FAQ {
  question: string;
  answer: string;
}

export default function AdminServiceForm({ isOpen, onClose, editingService }: AdminServiceFormProps) {
  const { toast } = useToast();
  
  // State for dynamic arrays
  const [includedItems, setIncludedItems] = useState<string[]>([""]);
  const [processSteps, setProcessSteps] = useState<ProcessStep[]>([{ step: 1, title: "", description: "" }]);
  const [beforeAfterItems, setBeforeAfterItems] = useState<BeforeAfter[]>([{ before: "", after: "", description: "" }]);
  const [galleryItems, setGalleryItems] = useState<GalleryItem[]>([{ url: "", type: "video", caption: "" }]);
  const [testimonials, setTestimonials] = useState<Testimonial[]>([{ name: "", rating: 5, comment: "", image: "" }]);
  const [faqItems, setFaqItems] = useState<FAQ[]>([{ question: "", answer: "" }]);
  const [images, setImages] = useState<string[]>([""]);
  const [uploading, setUploading] = useState<string | null>(null);

  const uploadImage = async (file: File): Promise<string | null> => {
    try {
      const formData = new FormData();
      formData.append("image", file);
      
      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
        credentials: "include",
      });
      
      if (!response.ok) {
        throw new Error("Upload failed");
      }
      
      const data = await response.json();
      toast({
        title: "Image Uploaded",
        description: "Image uploaded successfully!",
      });
      return data.url;
    } catch (error) {
      toast({
        title: "Upload Failed",
        description: "Failed to upload image. Please try again.",
        variant: "destructive",
      });
      return null;
    }
  };

  const handleImageUpload = async (index: number, file: File) => {
    setUploading(`image-${index}`);
    const url = await uploadImage(file);
    if (url) updateImage(index, url);
    setUploading(null);
  };

  const handleBeforeAfterUpload = async (index: number, field: 'before' | 'after', file: File) => {
    setUploading(`ba-${field}-${index}`);
    const url = await uploadImage(file);
    if (url) updateBeforeAfter(index, field, url);
    setUploading(null);
  };

  const handleGalleryUpload = async (index: number, file: File) => {
    setUploading(`gallery-${index}`);
    const url = await uploadImage(file);
    if (url) updateGalleryItem(index, 'url', url);
    setUploading(null);
  };

  const form = useForm({
    resolver: zodResolver(insertServiceSchema),
    defaultValues: {
      title: "",
      description: "",
      heroTitle: "",
      heroSubtitle: "",
      heroVideo: "",
      whyChoose: "",
      whatIncluded: [""],
      process: [{ step: 1, title: "", description: "" }],
      beforeAfter: [{ before: "", after: "", description: "" }],
      testimonials: [{ name: "", rating: 5, comment: "", image: "" }],
      faq: [{ question: "", answer: "" }],
      price: "",
      originalPrice: "",
      discountText: "",
      duration: 60,
      images: [""],
      gallery: [{ url: "", type: "video" as const, caption: "" }],
      metaTitle: "",
      metaDescription: "",
      ctaText: "Book Now",
      urgencyText: "",
      guaranteeText: "",
      isActive: true,
    },
  });

  // Effect to populate form when editing
  useEffect(() => {
    if (editingService && isOpen) {
      form.reset({
        title: editingService.title || "",
        description: editingService.description || "",
        heroTitle: editingService.heroTitle || "",
        heroSubtitle: editingService.heroSubtitle || "",
        heroVideo: editingService.heroVideo || "",
        whyChoose: editingService.whyChoose || "",
        price: editingService.price?.toString() || "",
        originalPrice: editingService.originalPrice?.toString() || "",
        discountText: editingService.discountText || "",
        duration: editingService.duration || 60,
        metaTitle: editingService.metaTitle || "",
        metaDescription: editingService.metaDescription || "",
        ctaText: editingService.ctaText || "Book Now",
        urgencyText: editingService.urgencyText || "",
        guaranteeText: editingService.guaranteeText || "",
        isActive: editingService.isActive !== false,
      });
      
      // Set dynamic arrays
      setIncludedItems(editingService.whatIncluded?.length ? editingService.whatIncluded : [""]);
      setProcessSteps(editingService.process?.length ? editingService.process : [{ step: 1, title: "", description: "" }]);
      setBeforeAfterItems(editingService.beforeAfter?.length ? editingService.beforeAfter : [{ before: "", after: "", description: "" }]);
      setGalleryItems(editingService.gallery?.length ? editingService.gallery : [{ url: "", type: "video", caption: "" }]);
      setTestimonials(editingService.testimonials?.length ? editingService.testimonials : [{ name: "", rating: 5, comment: "", image: "" }]);
      setFaqItems(editingService.faq?.length ? editingService.faq : [{ question: "", answer: "" }]);
      setImages(editingService.images?.length ? editingService.images : [""]);
    }
  }, [editingService, isOpen, form]);

  const serviceActionMutation = useMutation({
    mutationFn: async (data: any) => {
      const serviceData = {
        ...data,
        whatIncluded: includedItems.filter(item => item.trim() !== ""),
        process: processSteps.filter(step => step.title.trim() !== ""),
        beforeAfter: beforeAfterItems.filter(item => item.before.trim() !== "" || item.after.trim() !== ""),
        gallery: galleryItems.filter(item => item.url.trim() !== ""),
        testimonials: testimonials.filter(testimonial => testimonial.name.trim() !== ""),
        faq: faqItems.filter(faq => faq.question.trim() !== ""),
        images: images.filter(img => img.trim() !== ""),
        duration: parseInt(String(data.duration), 10) || 60,
        price: String(data.price),
        originalPrice: data.originalPrice ? String(data.originalPrice) : null,
      };
      
      if (editingService?.id) {
        const response = await apiRequest("PUT", `/api/services/${editingService.id}`, serviceData);
        const text = await response.text();
        return text ? JSON.parse(text) : {};
      } else {
        const response = await apiRequest("POST", "/api/services", serviceData);
        const text = await response.text();
        return text ? JSON.parse(text) : {};
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/services"] });
      toast({
        title: editingService?.id ? "Service Updated" : "Service Created",
        description: `The service has been successfully ${editingService?.id ? "updated" : "created"} with full content.`,
      });
      onClose();
      resetForm();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create service.",
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    form.reset();
    setIncludedItems([""]);
    setProcessSteps([{ step: 1, title: "", description: "" }]);
    setBeforeAfterItems([{ before: "", after: "", description: "" }]);
    setGalleryItems([{ url: "", type: "video", caption: "" }]);
    setTestimonials([{ name: "", rating: 5, comment: "", image: "" }]);
    setFaqItems([{ question: "", answer: "" }]);
    setImages([""]);
  };

  const onSubmit = (data: any) => {
    serviceActionMutation.mutate(data);
  };

  // Helper functions for managing dynamic arrays
  const addIncludedItem = () => setIncludedItems([...includedItems, ""]);
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

  const addProcessStep = () => {
    setProcessSteps([...processSteps, { step: processSteps.length + 1, title: "", description: "" }]);
  };
  const removeProcessStep = (index: number) => {
    if (processSteps.length > 1) {
      setProcessSteps(processSteps.filter((_, i) => i !== index));
    }
  };
  const updateProcessStep = (index: number, field: keyof ProcessStep, value: string | number) => {
    const newSteps = [...processSteps];
    newSteps[index] = { ...newSteps[index], [field]: value };
    setProcessSteps(newSteps);
  };

  const addBeforeAfter = () => setBeforeAfterItems([...beforeAfterItems, { before: "", after: "", description: "" }]);
  const removeBeforeAfter = (index: number) => {
    if (beforeAfterItems.length > 1) {
      setBeforeAfterItems(beforeAfterItems.filter((_, i) => i !== index));
    }
  };
  const updateBeforeAfter = (index: number, field: keyof BeforeAfter, value: string) => {
    const newItems = [...beforeAfterItems];
    newItems[index] = { ...newItems[index], [field]: value };
    setBeforeAfterItems(newItems);
  };

  const addGalleryItem = () => setGalleryItems([...galleryItems, { url: "", type: "video", caption: "" }]);
  const removeGalleryItem = (index: number) => {
    if (galleryItems.length > 1) {
      setGalleryItems(galleryItems.filter((_, i) => i !== index));
    }
  };
  const updateGalleryItem = (index: number, field: keyof GalleryItem, value: string) => {
    const newItems = [...galleryItems];
    newItems[index] = { ...newItems[index], [field]: value };
    setGalleryItems(newItems);
  };

  const addTestimonial = () => setTestimonials([...testimonials, { name: "", rating: 5, comment: "", image: "" }]);
  const removeTestimonial = (index: number) => {
    if (testimonials.length > 1) {
      setTestimonials(testimonials.filter((_, i) => i !== index));
    }
  };
  const updateTestimonial = (index: number, field: keyof Testimonial, value: string | number) => {
    const newItems = [...testimonials];
    newItems[index] = { ...newItems[index], [field]: value };
    setTestimonials(newItems);
  };

  const addFAQ = () => setFaqItems([...faqItems, { question: "", answer: "" }]);
  const removeFAQ = (index: number) => {
    if (faqItems.length > 1) {
      setFaqItems(faqItems.filter((_, i) => i !== index));
    }
  };
  const updateFAQ = (index: number, field: keyof FAQ, value: string) => {
    const newItems = [...faqItems];
    newItems[index] = { ...newItems[index], [field]: value };
    setFaqItems(newItems);
  };

  const addImage = () => setImages([...images, ""]);
  const removeImage = (index: number) => {
    if (images.length > 1) {
      setImages(images.filter((_, i) => i !== index));
    }
  };
  const updateImage = (index: number, value: string) => {
    const newImages = [...images];
    newImages[index] = value;
    setImages(newImages);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[95vh] overflow-y-auto bg-dark-gray text-white border-medium-gray">
        <DialogHeader>
          <DialogTitle className="text-3xl font-bold gradient-text" data-testid="text-service-form-title">
            {editingService ? `Edit Service: ${editingService.title}` : "Create New Service - Complete Content Management"}
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
            <Tabs defaultValue="basic" className="w-full">
              <TabsList className="grid w-full grid-cols-7 bg-medium-gray">
                <TabsTrigger value="basic" className="text-xs">Basic Info</TabsTrigger>
                <TabsTrigger value="hero" className="text-xs">Hero Section</TabsTrigger>
                <TabsTrigger value="content" className="text-xs">Content</TabsTrigger>
                <TabsTrigger value="media" className="text-xs">Media</TabsTrigger>
                <TabsTrigger value="social" className="text-xs">Social Proof</TabsTrigger>
                <TabsTrigger value="faq" className="text-xs">FAQ</TabsTrigger>
                <TabsTrigger value="seo" className="text-xs">SEO</TabsTrigger>
              </TabsList>

              {/* Basic Information Tab */}
              <TabsContent value="basic" className="space-y-6">
                <Card className="bg-medium-gray border-gray-600">
                  <CardHeader>
                    <CardTitle className="text-neon-green">Basic Service Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="title"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-white">Service Title *</FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                className="bg-dark-gray border-gray-600 text-white"
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
                        name="duration"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-white">Duration (minutes) *</FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                type="number"
                                className="bg-dark-gray border-gray-600 text-white"
                                placeholder="120"
                                data-testid="input-service-duration"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-white">Description *</FormLabel>
                          <FormControl>
                            <Textarea
                              {...field}
                              className="bg-dark-gray border-gray-600 text-white"
                              placeholder="Brief description of the service..."
                              rows={3}
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
                                className="bg-dark-gray border-gray-600 text-white"
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
                                className="bg-dark-gray border-gray-600 text-white"
                                placeholder="3999"
                                data-testid="input-service-original-price"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Hero Section Tab */}
              <TabsContent value="hero" className="space-y-6">
                <Card className="bg-medium-gray border-gray-600">
                  <CardHeader>
                    <CardTitle className="text-neon-green">Hero Section Content</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <FormField
                      control={form.control}
                      name="heroTitle"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-white">Hero Title</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              className="bg-dark-gray border-gray-600 text-white"
                              placeholder="Transform Your Car Today"
                              data-testid="input-hero-title"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="heroSubtitle"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-white">Hero Subtitle</FormLabel>
                          <FormControl>
                            <Textarea
                              {...field}
                              className="bg-dark-gray border-gray-600 text-white"
                              placeholder="Professional car detailing that makes your vehicle look brand new"
                              rows={2}
                              data-testid="textarea-hero-subtitle"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="heroVideo"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-white">Hero Video URL (YouTube/Vimeo)</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              className="bg-dark-gray border-gray-600 text-white"
                              placeholder="https://www.youtube.com/embed/VIDEO_ID"
                              data-testid="input-hero-video"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="discountText"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-white">Discount Badge Text</FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                className="bg-dark-gray border-gray-600 text-white"
                                placeholder="🔥 LIMITED TIME: 60% OFF"
                                data-testid="input-discount-text"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="urgencyText"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-white">Urgency Text</FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                className="bg-dark-gray border-gray-600 text-white"
                                placeholder="Only 5 slots left today!"
                                data-testid="input-urgency-text"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="ctaText"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-white">CTA Button Text</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              className="bg-dark-gray border-gray-600 text-white"
                              placeholder="Book Now"
                              data-testid="input-cta-text"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Content Tab */}
              <TabsContent value="content" className="space-y-6">
                {/* Why Choose Section */}
                <Card className="bg-medium-gray border-gray-600">
                  <CardHeader>
                    <CardTitle className="text-neon-green">Why Choose This Service?</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <FormField
                      control={form.control}
                      name="whyChoose"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Textarea
                              {...field}
                              className="bg-dark-gray border-gray-600 text-white"
                              placeholder="Explain the benefits and unique aspects of this service..."
                              rows={4}
                              data-testid="textarea-why-choose"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>

                {/* What's Included Section */}
                <Card className="bg-medium-gray border-gray-600">
                  <CardHeader>
                    <CardTitle className="text-neon-green flex items-center justify-between">
                      What's Included
                      <Button
                        type="button"
                        onClick={addIncludedItem}
                        size="sm"
                        className="bg-neon-green text-deep-black hover:bg-neon-green/90"
                        data-testid="button-add-included"
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {includedItems.map((item, index) => (
                      <div key={index} className="flex gap-2">
                        <Input
                          value={item}
                          onChange={(e) => updateIncludedItem(index, e.target.value)}
                          className="bg-dark-gray border-gray-600 text-white"
                          placeholder="e.g., Interior vacuum cleaning"
                          data-testid={`input-included-${index}`}
                        />
                        <Button
                          type="button"
                          onClick={() => removeIncludedItem(index)}
                          size="sm"
                          variant="ghost"
                          className="text-red-400 hover:text-red-300"
                          data-testid={`button-remove-included-${index}`}
                        >
                          <Minus className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                {/* Process Steps */}
                <Card className="bg-medium-gray border-gray-600">
                  <CardHeader>
                    <CardTitle className="text-neon-green flex items-center justify-between">
                      Service Process Steps
                      <Button
                        type="button"
                        onClick={addProcessStep}
                        size="sm"
                        className="bg-neon-green text-deep-black hover:bg-neon-green/90"
                        data-testid="button-add-process"
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {processSteps.map((step, index) => (
                      <Card key={index} className="bg-dark-gray border-gray-600">
                        <CardContent className="p-4 space-y-3">
                          <div className="flex items-center justify-between">
                            <Badge className="bg-neon-green text-deep-black">Step {step.step}</Badge>
                            <Button
                              type="button"
                              onClick={() => removeProcessStep(index)}
                              size="sm"
                              variant="ghost"
                              className="text-red-400 hover:text-red-300"
                              data-testid={`button-remove-process-${index}`}
                            >
                              <Minus className="h-4 w-4" />
                            </Button>
                          </div>
                          <Input
                            value={step.title}
                            onChange={(e) => updateProcessStep(index, 'title', e.target.value)}
                            className="bg-medium-gray border-gray-600 text-white"
                            placeholder="Step title"
                            data-testid={`input-process-title-${index}`}
                          />
                          <Textarea
                            value={step.description}
                            onChange={(e) => updateProcessStep(index, 'description', e.target.value)}
                            className="bg-medium-gray border-gray-600 text-white"
                            placeholder="Step description"
                            rows={2}
                            data-testid={`textarea-process-description-${index}`}
                          />
                        </CardContent>
                      </Card>
                    ))}
                  </CardContent>
                </Card>

                {/* Guarantee */}
                <Card className="bg-medium-gray border-gray-600">
                  <CardHeader>
                    <CardTitle className="text-neon-green">Service Guarantee</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <FormField
                      control={form.control}
                      name="guaranteeText"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Textarea
                              {...field}
                              className="bg-dark-gray border-gray-600 text-white"
                              placeholder="100% satisfaction guaranteed or your money back..."
                              rows={3}
                              data-testid="textarea-guarantee"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Media Tab */}
              <TabsContent value="media" className="space-y-6">
                {/* Service Images */}
                <Card className="bg-medium-gray border-gray-600">
                  <CardHeader>
                    <CardTitle className="text-neon-green flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <ImageIcon className="h-5 w-5" />
                        Service Images
                      </div>
                      <Button
                        type="button"
                        onClick={addImage}
                        size="sm"
                        className="bg-neon-green text-deep-black hover:bg-neon-green/90"
                        data-testid="button-add-image"
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {images.map((image, index) => (
                      <div key={index} className="space-y-2">
                        <div className="flex gap-2">
                          <Input
                            value={image}
                            onChange={(e) => updateImage(index, e.target.value)}
                            className="bg-dark-gray border-gray-600 text-white flex-1"
                            placeholder="Image URL or upload below"
                            data-testid={`input-image-${index}`}
                          />
                          <label className="cursor-pointer">
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) handleImageUpload(index, file);
                              }}
                              data-testid={`input-image-upload-${index}`}
                            />
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              className="border-neon-green text-neon-green hover:bg-neon-green hover:text-deep-black"
                              disabled={uploading === `image-${index}`}
                              asChild
                            >
                              <span>
                                {uploading === `image-${index}` ? "..." : <Upload className="h-4 w-4" />}
                              </span>
                            </Button>
                          </label>
                          <Button
                            type="button"
                            onClick={() => removeImage(index)}
                            size="sm"
                            variant="ghost"
                            className="text-red-400 hover:text-red-300"
                            data-testid={`button-remove-image-${index}`}
                          >
                            <Minus className="h-4 w-4" />
                          </Button>
                        </div>
                        {image && (
                          <div className="flex items-center gap-2">
                            <img src={image} alt={`Preview ${index + 1}`} className="h-16 w-24 object-cover rounded border border-gray-600" />
                            <span className="text-xs text-gray-400 truncate flex-1">{image}</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </CardContent>
                </Card>

                {/* Before & After Images */}
                <Card className="bg-medium-gray border-gray-600">
                  <CardHeader>
                    <CardTitle className="text-neon-green flex items-center justify-between">
                      Before & After Transformations
                      <Button
                        type="button"
                        onClick={addBeforeAfter}
                        size="sm"
                        className="bg-neon-green text-deep-black hover:bg-neon-green/90"
                        data-testid="button-add-before-after"
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {beforeAfterItems.map((item, index) => (
                      <Card key={index} className="bg-dark-gray border-gray-600">
                        <CardContent className="p-4 space-y-3">
                          <div className="flex items-center justify-between">
                            <Badge className="bg-blue-600 text-white">Comparison {index + 1}</Badge>
                            <Button
                              type="button"
                              onClick={() => removeBeforeAfter(index)}
                              size="sm"
                              variant="ghost"
                              className="text-red-400 hover:text-red-300"
                              data-testid={`button-remove-before-after-${index}`}
                            >
                              <Minus className="h-4 w-4" />
                            </Button>
                          </div>
                          <div className="grid md:grid-cols-2 gap-3">
                            <div className="space-y-2">
                              <Label className="text-white">Before Image URL</Label>
                              <div className="flex gap-2">
                                <Input
                                  value={item.before}
                                  onChange={(e) => updateBeforeAfter(index, 'before', e.target.value)}
                                  className="bg-medium-gray border-gray-600 text-white flex-1"
                                  placeholder="Before image URL"
                                  data-testid={`input-before-${index}`}
                                />
                                <label className="cursor-pointer">
                                  <input
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={(e) => {
                                      const file = e.target.files?.[0];
                                      if (file) handleBeforeAfterUpload(index, 'before', file);
                                    }}
                                  />
                                  <Button
                                    type="button"
                                    size="sm"
                                    variant="outline"
                                    className="border-neon-green text-neon-green hover:bg-neon-green hover:text-deep-black"
                                    disabled={uploading === `ba-before-${index}`}
                                    asChild
                                  >
                                    <span>{uploading === `ba-before-${index}` ? "..." : <Upload className="h-4 w-4" />}</span>
                                  </Button>
                                </label>
                              </div>
                              {item.before && <img src={item.before} alt="Before preview" className="h-12 w-20 object-cover rounded border border-gray-600" />}
                            </div>
                            <div className="space-y-2">
                              <Label className="text-white">After Image URL</Label>
                              <div className="flex gap-2">
                                <Input
                                  value={item.after}
                                  onChange={(e) => updateBeforeAfter(index, 'after', e.target.value)}
                                  className="bg-medium-gray border-gray-600 text-white flex-1"
                                  placeholder="After image URL"
                                  data-testid={`input-after-${index}`}
                                />
                                <label className="cursor-pointer">
                                  <input
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={(e) => {
                                      const file = e.target.files?.[0];
                                      if (file) handleBeforeAfterUpload(index, 'after', file);
                                    }}
                                  />
                                  <Button
                                    type="button"
                                    size="sm"
                                    variant="outline"
                                    className="border-neon-green text-neon-green hover:bg-neon-green hover:text-deep-black"
                                    disabled={uploading === `ba-after-${index}`}
                                    asChild
                                  >
                                    <span>{uploading === `ba-after-${index}` ? "..." : <Upload className="h-4 w-4" />}</span>
                                  </Button>
                                </label>
                              </div>
                              {item.after && <img src={item.after} alt="After preview" className="h-12 w-20 object-cover rounded border border-gray-600" />}
                            </div>
                          </div>
                          <div>
                            <Label className="text-white">Description (Optional)</Label>
                            <Input
                              value={item.description || ""}
                              onChange={(e) => updateBeforeAfter(index, 'description', e.target.value)}
                              className="bg-medium-gray border-gray-600 text-white"
                              placeholder="Description of the transformation"
                              data-testid={`input-before-after-description-${index}`}
                            />
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </CardContent>
                </Card>

                {/* Gallery Items */}
                <Card className="bg-medium-gray border-gray-600">
                  <CardHeader>
                    <CardTitle className="text-neon-green flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Play className="h-5 w-5" />
                        Process Gallery (Videos & Images)
                      </div>
                      <Button
                        type="button"
                        onClick={addGalleryItem}
                        size="sm"
                        className="bg-neon-green text-deep-black hover:bg-neon-green/90"
                        data-testid="button-add-gallery"
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {galleryItems.map((item, index) => (
                      <Card key={index} className="bg-dark-gray border-gray-600">
                        <CardContent className="p-4 space-y-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Badge className={item.type === 'video' ? 'bg-blue-600' : 'bg-green-600'}>
                                {item.type === 'video' ? 'Video' : 'Image'}
                              </Badge>
                              <select
                                value={item.type}
                                onChange={(e) => updateGalleryItem(index, 'type', e.target.value)}
                                className="bg-medium-gray border border-gray-600 text-white rounded px-2 py-1 text-sm"
                                data-testid={`select-gallery-type-${index}`}
                              >
                                <option value="video">Video</option>
                                <option value="image">Image</option>
                              </select>
                            </div>
                            <Button
                              type="button"
                              onClick={() => removeGalleryItem(index)}
                              size="sm"
                              variant="ghost"
                              className="text-red-400 hover:text-red-300"
                              data-testid={`button-remove-gallery-${index}`}
                            >
                              <Minus className="h-4 w-4" />
                            </Button>
                          </div>
                          <div className="space-y-2">
                            <Label className="text-white">
                              {item.type === 'video' ? 'Video Embed URL' : 'Image URL'}
                            </Label>
                            <div className="flex gap-2">
                              <Input
                                value={item.url}
                                onChange={(e) => updateGalleryItem(index, 'url', e.target.value)}
                                className="bg-medium-gray border-gray-600 text-white flex-1"
                                placeholder={item.type === 'video' ? 'YouTube embed URL' : 'Image URL'}
                                data-testid={`input-gallery-url-${index}`}
                              />
                              {item.type === 'image' && (
                                <label className="cursor-pointer">
                                  <input
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={(e) => {
                                      const file = e.target.files?.[0];
                                      if (file) handleGalleryUpload(index, file);
                                    }}
                                  />
                                  <Button
                                    type="button"
                                    size="sm"
                                    variant="outline"
                                    className="border-neon-green text-neon-green hover:bg-neon-green hover:text-deep-black"
                                    disabled={uploading === `gallery-${index}`}
                                    asChild
                                  >
                                    <span>{uploading === `gallery-${index}` ? "..." : <Upload className="h-4 w-4" />}</span>
                                  </Button>
                                </label>
                              )}
                            </div>
                            {item.type === 'image' && item.url && (
                              <img src={item.url} alt="Gallery preview" className="h-12 w-20 object-cover rounded border border-gray-600" />
                            )}
                          </div>
                          <div>
                            <Label className="text-white">Caption (Optional)</Label>
                            <Input
                              value={item.caption || ""}
                              onChange={(e) => updateGalleryItem(index, 'caption', e.target.value)}
                              className="bg-medium-gray border-gray-600 text-white"
                              placeholder="Caption for this media"
                              data-testid={`input-gallery-caption-${index}`}
                            />
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Social Proof Tab */}
              <TabsContent value="social" className="space-y-6">
                <Card className="bg-medium-gray border-gray-600">
                  <CardHeader>
                    <CardTitle className="text-neon-green flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Star className="h-5 w-5" />
                        Customer Testimonials
                      </div>
                      <Button
                        type="button"
                        onClick={addTestimonial}
                        size="sm"
                        className="bg-neon-green text-deep-black hover:bg-neon-green/90"
                        data-testid="button-add-testimonial"
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {testimonials.map((testimonial, index) => (
                      <Card key={index} className="bg-dark-gray border-gray-600">
                        <CardContent className="p-4 space-y-3">
                          <div className="flex items-center justify-between">
                            <Badge className="bg-yellow-600 text-white">Review {index + 1}</Badge>
                            <Button
                              type="button"
                              onClick={() => removeTestimonial(index)}
                              size="sm"
                              variant="ghost"
                              className="text-red-400 hover:text-red-300"
                              data-testid={`button-remove-testimonial-${index}`}
                            >
                              <Minus className="h-4 w-4" />
                            </Button>
                          </div>
                          <div className="grid md:grid-cols-2 gap-3">
                            <div>
                              <Label className="text-white">Customer Name</Label>
                              <Input
                                value={testimonial.name}
                                onChange={(e) => updateTestimonial(index, 'name', e.target.value)}
                                className="bg-medium-gray border-gray-600 text-white"
                                placeholder="Rajesh Kumar"
                                data-testid={`input-testimonial-name-${index}`}
                              />
                            </div>
                            <div>
                              <Label className="text-white">Rating (1-5)</Label>
                              <Input
                                value={testimonial.rating}
                                onChange={(e) => updateTestimonial(index, 'rating', parseInt(e.target.value) || 5)}
                                type="number"
                                min="1"
                                max="5"
                                className="bg-medium-gray border-gray-600 text-white"
                                data-testid={`input-testimonial-rating-${index}`}
                              />
                            </div>
                          </div>
                          <div>
                            <Label className="text-white">Review Comment</Label>
                            <Textarea
                              value={testimonial.comment}
                              onChange={(e) => updateTestimonial(index, 'comment', e.target.value)}
                              className="bg-medium-gray border-gray-600 text-white"
                              placeholder="Excellent service! My car looks brand new."
                              rows={3}
                              data-testid={`textarea-testimonial-comment-${index}`}
                            />
                          </div>
                          <div>
                            <Label className="text-white">Customer Photo URL (Optional)</Label>
                            <Input
                              value={testimonial.image || ""}
                              onChange={(e) => updateTestimonial(index, 'image', e.target.value)}
                              className="bg-medium-gray border-gray-600 text-white"
                              placeholder="Customer photo URL"
                              data-testid={`input-testimonial-image-${index}`}
                            />
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* FAQ Tab */}
              <TabsContent value="faq" className="space-y-6">
                <Card className="bg-medium-gray border-gray-600">
                  <CardHeader>
                    <CardTitle className="text-neon-green flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <HelpCircle className="h-5 w-5" />
                        Frequently Asked Questions
                      </div>
                      <Button
                        type="button"
                        onClick={addFAQ}
                        size="sm"
                        className="bg-neon-green text-deep-black hover:bg-neon-green/90"
                        data-testid="button-add-faq"
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {faqItems.map((faq, index) => (
                      <Card key={index} className="bg-dark-gray border-gray-600">
                        <CardContent className="p-4 space-y-3">
                          <div className="flex items-center justify-between">
                            <Badge className="bg-purple-600 text-white">FAQ {index + 1}</Badge>
                            <Button
                              type="button"
                              onClick={() => removeFAQ(index)}
                              size="sm"
                              variant="ghost"
                              className="text-red-400 hover:text-red-300"
                              data-testid={`button-remove-faq-${index}`}
                            >
                              <Minus className="h-4 w-4" />
                            </Button>
                          </div>
                          <div>
                            <Label className="text-white">Question</Label>
                            <Input
                              value={faq.question}
                              onChange={(e) => updateFAQ(index, 'question', e.target.value)}
                              className="bg-medium-gray border-gray-600 text-white"
                              placeholder="How long does the service take?"
                              data-testid={`input-faq-question-${index}`}
                            />
                          </div>
                          <div>
                            <Label className="text-white">Answer</Label>
                            <Textarea
                              value={faq.answer}
                              onChange={(e) => updateFAQ(index, 'answer', e.target.value)}
                              className="bg-medium-gray border-gray-600 text-white"
                              placeholder="Typically 2-3 hours depending on the car's condition..."
                              rows={3}
                              data-testid={`textarea-faq-answer-${index}`}
                            />
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* SEO Tab */}
              <TabsContent value="seo" className="space-y-6">
                <Card className="bg-medium-gray border-gray-600">
                  <CardHeader>
                    <CardTitle className="text-neon-green">SEO & Meta Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <FormField
                      control={form.control}
                      name="metaTitle"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-white">Meta Title (SEO)</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              className="bg-dark-gray border-gray-600 text-white"
                              placeholder="Premium Car Wash & Detail - P91 Car Care Bangalore"
                              data-testid="input-meta-title"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="metaDescription"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-white">Meta Description (SEO)</FormLabel>
                          <FormControl>
                            <Textarea
                              {...field}
                              className="bg-dark-gray border-gray-600 text-white"
                              placeholder="Professional car detailing service in Bangalore. Transform your car with our premium wash, polish, and detail service. Book online today!"
                              rows={3}
                              data-testid="textarea-meta-description"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>

            {/* Action Buttons */}
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
                className="bg-neon-green text-deep-black hover:bg-neon-green/90 neon-glow px-8"
                disabled={serviceActionMutation.isPending}
                data-testid="button-service-action"
              >
                {serviceActionMutation.isPending 
                  ? (editingService ? "Updating Service..." : "Creating Service...") 
                  : (editingService ? "Update Service" : "Create Complete Service")
                }
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}