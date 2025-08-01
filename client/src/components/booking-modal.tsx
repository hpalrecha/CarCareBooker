import { useState, useEffect } from "react";
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
  const [bookingAmount, setBookingAmount] = useState(299);
  const { toast } = useToast();

  // Fetch booking amount from settings
  const { data: bookingAmountSetting } = useQuery({
    queryKey: ["/api/settings/booking_amount"],
    retry: false,
  });

  useEffect(() => {
    console.log("Booking amount setting changed:", bookingAmountSetting);
    if (bookingAmountSetting && typeof bookingAmountSetting === 'object' && 'value' in bookingAmountSetting) {
      const amount = parseFloat(String(bookingAmountSetting.value));
      console.log("Setting booking amount to:", amount);
      setBookingAmount(amount);
    }
  }, [bookingAmountSetting]);

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

  // Static time slots from 10 AM to 7 PM
  const timeSlots = [
    { id: "10:00", startTime: "10:00 AM", endTime: "11:00 AM", isAvailable: true },
    { id: "11:00", startTime: "11:00 AM", endTime: "12:00 PM", isAvailable: true },
    { id: "12:00", startTime: "12:00 PM", endTime: "1:00 PM", isAvailable: true },
    { id: "13:00", startTime: "1:00 PM", endTime: "2:00 PM", isAvailable: true },
    { id: "14:00", startTime: "2:00 PM", endTime: "3:00 PM", isAvailable: true },
    { id: "15:00", startTime: "3:00 PM", endTime: "4:00 PM", isAvailable: true },
    { id: "16:00", startTime: "4:00 PM", endTime: "5:00 PM", isAvailable: true },
    { id: "17:00", startTime: "5:00 PM", endTime: "6:00 PM", isAvailable: true },
    { id: "18:00", startTime: "6:00 PM", endTime: "7:00 PM", isAvailable: true },
  ];

  const slotsLoading = false;

  const bookingMutation = useMutation({
    mutationFn: async (data: any) => {
      // Add booking fee amount (₹299) to the request
      console.log("Sending booking amount:", bookingAmount);
      const bookingData = {
        ...data,
        amount: bookingAmount, // Fixed booking fee
        isBookingFee: true, // Flag to indicate this is a booking fee, not full payment
      };
      const response = await apiRequest("POST", "/api/bookings", bookingData);
      return response.json();
    },
    onSuccess: async (data) => {
      const { booking, paymentOrder } = data;
      
      try {
        const razorpay = await loadRazorpay();
        if (!razorpay) {
          throw new Error("Razorpay failed to load");
        }

        console.log("Payment order data:", paymentOrder);
        console.log("Using Razorpay key:", paymentOrder.key);
        
        const options = {
          key: import.meta.env.VITE_RAZORPAY_KEY_ID || paymentOrder.key,
          amount: paymentOrder.amount,
          currency: paymentOrder.currency,
          name: "P91 Car Care",
          description: `₹${bookingAmount} Booking Fee - ${service.title}`,
          image: "https://img.icons8.com/color/96/car-wash.png", // Add logo
          notes: {
            booking_fee: `₹${bookingAmount} booking fee to secure your slot`,
            free_voucher: "Includes FREE car wash voucher worth ₹500",
            service_title: service.title,
          },
          order_id: paymentOrder.id,
          handler: async (response: any) => {
            console.log("Payment successful:", response);
            console.log("Payment response object:", JSON.stringify(response, null, 2));
            
            try {
              const webhookResponse = await apiRequest("POST", "/api/payment-webhook", {
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              });
              
              console.log("Webhook response:", webhookResponse);
              
              toast({
                title: "Booking Confirmed!",
                description: "Your booking has been confirmed. You will receive WhatsApp and email confirmations shortly.",
              });
              
              onClose();
              form.reset();
            } catch (error) {
              console.error("Payment confirmation error:", error);
              toast({
                title: "Payment Error", 
                description: "Payment was successful but confirmation failed. Please contact support.",
                variant: "destructive",
              });
            }
          },
          modal: {
            ondismiss: () => {
              console.log("Payment modal dismissed by user");
            },
            escape: true,
            backdrop_close: false
          },
          prefill: {
            name: form.getValues("customerName"),
            email: form.getValues("customerEmail"),
            contact: form.getValues("customerPhone"),
          },
          theme: {
            color: "#00FF94",
          },
          method: {
            upi: true,
            card: true, 
            netbanking: true,
            wallet: true,
          },
          remember_customer: false,
          timeout: 300, // 5 minutes timeout
        };

        const payment = new razorpay(options);
        
        // Add error handlers
        payment.on('payment.failed', function (response: any) {
          console.error('Payment failed:', response.error);
          toast({
            title: "Payment Failed",
            description: response.error.description || "Payment could not be processed. Please try again.",
            variant: "destructive",
          });
        });
        
        console.log("Opening Razorpay payment gateway...");
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
    // Include the selected date and time in the booking data
    const bookingData = {
      ...data,
      appointmentDate: selectedDate,
      appointmentTime: data.timeSlotId, // The timeSlotId is actually the time (e.g., "16:00")
    };
    bookingMutation.mutate(bookingData);
  };

  const today = new Date().toISOString().split('T')[0];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl w-[95vw] max-h-[90vh] overflow-y-auto bg-dark-gray text-white border-medium-gray p-4 sm:p-6">
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
              className="w-full h-48 sm:h-64 object-cover rounded-xl" 
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
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <ul className="space-y-3 text-gray-300">
                    {service.whatIncluded.slice(0, Math.ceil(service.whatIncluded.length / 2)).map((item, index) => (
                      <li key={index} className="flex items-center" data-testid={`text-included-${index}`}>
                        <Check className="w-4 h-4 text-neon-green mr-3 flex-shrink-0" />
                        {item}
                      </li>
                    ))}
                  </ul>
                  <ul className="space-y-3 text-gray-300">
                    {service.whatIncluded?.slice(Math.ceil(service.whatIncluded.length / 2)).map((item, index) => (
                      <li key={index} className="flex items-center" data-testid={`text-included-${index + Math.ceil(service.whatIncluded?.length || 0 / 2)}`}>
                        <Check className="w-4 h-4 text-neon-green mr-3 flex-shrink-0" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </div>
          
          {/* Booking Fee Structure */}
          <div className="bg-gradient-to-r from-green-900/30 to-blue-900/30 rounded-xl p-6 border border-green-500/30">
            <div className="text-center mb-4">
              <h3 className="text-2xl font-bold text-neon-green mb-2">🎉 Special Booking Offer!</h3>
              <p className="text-gray-300">Secure your slot with just ₹{bookingAmount} booking fee</p>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 mb-6">
              <div className="text-center p-4 bg-dark-gray rounded-lg">
                <div className="text-3xl font-bold text-white mb-2">₹{bookingAmount}</div>
                <div className="text-sm text-gray-400 mb-2">Booking Fee Only</div>
                <div className="text-xs text-green-400">✓ Secures your preferred slot</div>
              </div>
              <div className="text-center p-4 bg-dark-gray rounded-lg">
                <div className="text-3xl font-bold text-neon-green mb-2">FREE</div>
                <div className="text-sm text-gray-400 mb-2">Car Wash Voucher</div>
                <div className="text-xs text-green-400">✓ Worth ₹500 - Show at store</div>
              </div>
            </div>

            <div className="bg-yellow-500/20 border border-yellow-500/50 rounded-lg p-4 mb-4">
              <div className="flex items-start gap-3">
                <div className="text-yellow-400">💡</div>
                <div>
                  <div className="font-semibold text-yellow-300 mb-1">How it works:</div>
                  <ul className="text-sm text-gray-300 space-y-1">
                    <li>• Pay ₹299 booking fee to reserve your slot</li>
                    <li>• Get a FREE car wash voucher worth ₹500</li>
                    <li>• Show your booking confirmation at our store to claim</li>
                    <li>• No hidden charges - transparent pricing</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="text-center">
              <div className="text-sm text-gray-400 mb-2">Full Service Price: 
                {service.originalPrice && (
                  <span className="text-gray-500 line-through ml-2" data-testid="text-original-price">
                    ₹{service.originalPrice}
                  </span>
                )}
                <span className="text-neon-green font-bold text-lg ml-2" data-testid="text-current-price">
                  ₹{service.price}
                </span>
              </div>
              <div className="text-xs text-gray-500">Duration: {Math.floor(service.duration / 60)} hours</div>
            </div>
          </div>

          {/* Booking Form */}
          <div className="bg-medium-gray rounded-xl p-6">
            
            <div className="border-t border-gray-600 pt-4">
              <h4 className="font-semibold mb-4">Book Your Appointment</h4>
              
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                          <Select onValueChange={field.onChange} value={field.value} disabled={!selectedDate}>
                            <FormControl>
                              <SelectTrigger className="bg-dark-gray border-gray-600 text-white" data-testid="select-time">
                                <SelectValue placeholder="Choose time slot" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent className="bg-dark-gray border-gray-600">
                              {timeSlots.filter((slot: any) => slot.isAvailable).map((slot: any) => (
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
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                    className="w-full bg-neon-green text-deep-black hover:bg-neon-green/90 neon-glow font-semibold text-sm sm:text-lg py-4 px-4"
                    disabled={bookingMutation.isPending}
                    data-testid="button-proceed-payment"
                  >
                    <span className="block sm:hidden">Pay ₹{bookingAmount} + FREE Voucher</span>
                    <span className="hidden sm:block">{bookingMutation.isPending ? "Processing..." : `Pay ₹${bookingAmount} Booking Fee + Get FREE Voucher`}</span>
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
