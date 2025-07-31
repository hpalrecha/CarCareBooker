import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { loadRazorpay } from "@/lib/razorpay";
import { bookingFormSchema } from "@shared/schema";
import { Check, X } from "lucide-react";

interface BookingModalProps {
  service: {
    id: string;
    title: string;
    description: string;
    price: string;
    originalPrice?: string;
    duration: number;
    images?: string[];
    whyChoose?: string;
    whatIncluded?: string[];
  };
  isOpen: boolean;
  onClose: () => void;
}

export default function BookingModal({ service, isOpen, onClose }: BookingModalProps) {
  const [selectedDate, setSelectedDate] = useState("");
  const { toast } = useToast();

  const form = useForm({
    resolver: zodResolver(bookingFormSchema),
    defaultValues: {
      serviceId: service.id,
      timeSlotId: "",
      customerName: "",
      customerEmail: "",
      customerPhone: "",
    },
  });

  const { data: timeSlots, isLoading: slotsLoading } = useQuery({
    queryKey: ["/api/services", service.id, "slots", selectedDate],
    enabled: !!selectedDate,
  });

  const bookingMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("POST", "/api/bookings", data);
      return response.json();
    },
    onSuccess: async (data) => {
      const { booking, paymentOrder } = data;
      
      try {
        const razorpay = await loadRazorpay();
        if (!razorpay) {
          throw new Error("Razorpay failed to load");
        }

        const options = {
          key: paymentOrder.key,
          amount: paymentOrder.amount,
          currency: paymentOrder.currency,
          name: "P91 Car Care",
          description: service.title,
          order_id: paymentOrder.id,
          handler: async (response: any) => {
            try {
              await apiRequest("POST", "/api/payment-webhook", {
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              });
              
              toast({
                title: "Booking Confirmed!",
                description: "Your booking has been confirmed. You will receive WhatsApp and email confirmations shortly.",
              });
              
              onClose();
              form.reset();
            } catch (error) {
              toast({
                title: "Payment Error",
                description: "Payment was successful but confirmation failed. Please contact support.",
                variant: "destructive",
              });
            }
          },
          prefill: {
            name: form.getValues("customerName"),
            email: form.getValues("customerEmail"),
            contact: form.getValues("customerPhone"),
          },
          theme: {
            color: "#00FF94",
          },
        };

        const payment = new razorpay(options);
        payment.open();
      } catch (error) {
        toast({
          title: "Payment Error",
          description: "Failed to initialize payment. Please try again.",
          variant: "destructive",
        });
      }
    },
    onError: (error: any) => {
      toast({
        title: "Booking Error",
        description: error.message || "Failed to create booking. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: any) => {
    bookingMutation.mutate(data);
  };

  const today = new Date().toISOString().split('T')[0];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-dark-gray text-white border-medium-gray">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold gradient-text" data-testid="text-booking-modal-title">
            {service.title}
          </DialogTitle>
          <Button 
            variant="ghost" 
            size="sm" 
            className="absolute right-4 top-4 text-gray-400 hover:text-white"
            onClick={onClose}
            data-testid="button-close-modal"
          >
            <X className="h-4 w-4" />
          </Button>
        </DialogHeader>
        
        <div className="space-y-8">
          {/* Service Image Gallery */}
          <div>
            <img 
              src={service.images?.[0] || "https://images.unsplash.com/photo-1607860108855-64acf2078ed9?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&h=600"} 
              alt={service.title}
              className="w-full h-64 object-cover rounded-xl" 
              data-testid="img-service-banner"
            />
          </div>
          
          {/* Service Details */}
          <div className="space-y-6">
            {service.whyChoose && (
              <div>
                <h3 className="text-xl font-semibold text-neon-green mb-4">Why Choose This Service?</h3>
                <p className="text-gray-300 leading-relaxed" data-testid="text-why-choose">
                  {service.whyChoose}
                </p>
              </div>
            )}
            
            {service.whatIncluded && (
              <div>
                <h3 className="text-xl font-semibold text-neon-green mb-4">What You Get</h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <ul className="space-y-3 text-gray-300">
                    {service.whatIncluded.slice(0, Math.ceil(service.whatIncluded.length / 2)).map((item, index) => (
                      <li key={index} className="flex items-center" data-testid={`text-included-${index}`}>
                        <Check className="w-4 h-4 text-neon-green mr-3 flex-shrink-0" />
                        {item}
                      </li>
                    ))}
                  </ul>
                  <ul className="space-y-3 text-gray-300">
                    {service.whatIncluded.slice(Math.ceil(service.whatIncluded.length / 2)).map((item, index) => (
                      <li key={index} className="flex items-center" data-testid={`text-included-${index + Math.ceil(service.whatIncluded.length / 2)}`}>
                        <Check className="w-4 h-4 text-neon-green mr-3 flex-shrink-0" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </div>
          
          {/* Booking Form */}
          <div className="bg-medium-gray rounded-xl p-6">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h3 className="text-xl font-semibold">Service Price</h3>
                <p className="text-gray-400">Duration: {Math.floor(service.duration / 60)} hours</p>
              </div>
              <div className="text-right">
                {service.originalPrice && (
                  <span className="text-gray-500 line-through text-lg" data-testid="text-original-price">
                    ₹{service.originalPrice}
                  </span>
                )}
                <span className="text-neon-green font-bold text-2xl ml-2" data-testid="text-current-price">
                  ₹{service.price}
                </span>
              </div>
            </div>
            
            <div className="border-t border-gray-600 pt-4">
              <h4 className="font-semibold mb-4">Book Your Appointment</h4>
              
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="date">Select Date</Label>
                      <Input
                        id="date"
                        type="date"
                        min={today}
                        value={selectedDate}
                        onChange={(e) => setSelectedDate(e.target.value)}
                        className="bg-dark-gray border-gray-600 text-white"
                        data-testid="input-date"
                      />
                    </div>
                    
                    <FormField
                      control={form.control}
                      name="timeSlotId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Select Time</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value} disabled={!selectedDate || slotsLoading}>
                            <FormControl>
                              <SelectTrigger className="bg-dark-gray border-gray-600 text-white" data-testid="select-time">
                                <SelectValue placeholder="Choose time slot" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent className="bg-dark-gray border-gray-600">
                              {timeSlots?.filter((slot: any) => slot.isAvailable).map((slot: any) => (
                                <SelectItem key={slot.id} value={slot.id} data-testid={`option-slot-${slot.id}`}>
                                  {slot.startTime} - {slot.endTime}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <div className="grid md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="customerName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Your Name</FormLabel>
                          <FormControl>
                            <Input 
                              {...field} 
                              className="bg-dark-gray border-gray-600 text-white" 
                              data-testid="input-name"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="customerPhone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Mobile Number</FormLabel>
                          <FormControl>
                            <Input 
                              {...field} 
                              type="tel" 
                              className="bg-dark-gray border-gray-600 text-white" 
                              data-testid="input-phone"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <FormField
                    control={form.control}
                    name="customerEmail"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email Address</FormLabel>
                        <FormControl>
                          <Input 
                            {...field} 
                            type="email" 
                            className="bg-dark-gray border-gray-600 text-white" 
                            data-testid="input-email"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <Button 
                    type="submit" 
                    className="w-full bg-neon-green text-deep-black hover:bg-neon-green/90 neon-glow font-semibold text-lg py-4"
                    disabled={bookingMutation.isPending}
                    data-testid="button-proceed-payment"
                  >
                    {bookingMutation.isPending ? "Processing..." : `Proceed to Payment - ₹${service.price}`}
                  </Button>
                </form>
              </Form>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
