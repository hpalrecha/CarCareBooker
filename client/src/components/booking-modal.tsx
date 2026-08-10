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
import { bookingFormSchema, type BlackoutDate, type BusinessHour } from "@shared/schema";
import { ImageWithFallback } from "@/components/image-with-fallback";
import { resolveServiceImage } from "@/lib/canonical-services";
import { Check } from "lucide-react";

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

  // Fetch blackout dates
  const { data: blackoutDates = [], isError: blackoutDatesError } = useQuery<BlackoutDate[]>({
    queryKey: ["/api/blackout-dates"],
    retry: 1,
  });

  // Fetch business hours
  const { data: businessHours = [] } = useQuery<BusinessHour[]>({
    queryKey: ["/api/business-hours"],
    retry: 1,
  });

  // Log error if blackout dates fail to fetch (but don't block booking - safer to allow than block incorrectly)
  useEffect(() => {
    if (blackoutDatesError) {
      console.warn("Failed to fetch blackout dates - all dates will be available for booking");
    }
  }, [blackoutDatesError]);

  // Fix Razorpay CORS issues when modal opens
  useEffect(() => {
    if (isOpen) {
      // Remove restrictive CSP meta tags that block Razorpay
      const cspMetas = document.querySelectorAll('meta[http-equiv="Content-Security-Policy"]');
      cspMetas.forEach(meta => meta.remove());
      
      // Add a small delay to ensure Razorpay has time to initialize properly
      const timer = setTimeout(() => {
        console.log("Razorpay environment prepared");
      }, 100);
      
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // Fetch booking amount from settings
  const { data: bookingAmountSetting } = useQuery({
    queryKey: ["/api/settings/booking_amount"],
    retry: false,
  });

  useEffect(() => {
    console.log("Booking amount setting changed:", bookingAmountSetting);
    // Check if this is the Annual Maintenance Package - charge full price
    if (service.title === 'Annual Maintenance Package') {
      const fullPrice = parseFloat(service.price);
      console.log("Annual Maintenance Package - setting full price:", fullPrice);
      setBookingAmount(fullPrice);
    } else if (bookingAmountSetting && typeof bookingAmountSetting === 'object' && 'value' in bookingAmountSetting) {
      const amount = parseFloat(String(bookingAmountSetting.value));
      console.log("Setting booking amount to:", amount);
      setBookingAmount(amount);
    }
  }, [bookingAmountSetting, service.title, service.price]);

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
  const allTimeSlots = [
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

  // Fetch slot availability when date is selected
  const { data: slotAvailability, isLoading: slotsLoading } = useQuery<{
    availability: Record<string, { booked: number; max: number; available: boolean }>;
    maxPerSlot: number;
    // New authoritative fields from the server (blackout / closed-day aware).
    available?: boolean;
    reason?: string | null;
    reasonText?: string;
  }>({
    queryKey: ["/api/slot-availability", service.id, selectedDate],
    enabled: !!selectedDate && selectedDate.length > 0,
  });

  // Helper: check if today in IST (use getUTC* to avoid double-offset in IST browsers)
  const isTodayIST = (dateStr: string) => {
    const now = new Date();
    const istOffset = 5.5 * 60 * 60 * 1000;
    const istNow = new Date(now.getTime() + istOffset);
    const y = istNow.getUTCFullYear();
    const m = String(istNow.getUTCMonth() + 1).padStart(2, '0');
    const d = String(istNow.getUTCDate()).padStart(2, '0');
    const todayIST = `${y}-${m}-${d}`;
    return dateStr === todayIST;
  };

  // Helper: get current IST time as "HH:MM" (use getUTC* to avoid double-offset)
  const getCurrentISTTime = () => {
    const now = new Date();
    const istOffset = 5.5 * 60 * 60 * 1000;
    const istNow = new Date(now.getTime() + istOffset);
    const hours = istNow.getUTCHours().toString().padStart(2, '0');
    const minutes = istNow.getUTCMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  };

  // Filter time slots based on business hours, past time, and availability.
  // The server's slot-availability response is now authoritative about whether the
  // DATE is bookable at all (blackout / closed day) — honour that even if the local
  // blackout/business-hours queries failed or lagged.
  const timeSlots = (() => {
    if (!selectedDate) return allTimeSlots;

    // Server says this date is not bookable (blackout or closed) → no slots.
    if (slotAvailability && slotAvailability.available === false) {
      return [];
    }

    if (businessHours.length === 0) {
      return allTimeSlots;
    }

    const selectedDay = new Date(selectedDate + 'T00:00:00').getDay();
    const dayHours = businessHours.find(h => h.dayOfWeek === selectedDay);

    if (!dayHours || !dayHours.isOpen) {
      return [];
    }

    const isToday = isTodayIST(selectedDate);
    const currentTime = isToday ? getCurrentISTTime() : "00:00";

    return allTimeSlots
      .filter(slot => {
        const slotTime = slot.id;
        if (slotTime < dayHours.openTime || slotTime > dayHours.cutoffTime) {
          return false;
        }
        if (isToday && slotTime <= currentTime) {
          return false;
        }
        // If the server returned an explicit slot list, drop slots it doesn't include.
        if (slotAvailability?.availability && Object.keys(slotAvailability.availability).length > 0
            && !(slot.id in slotAvailability.availability)) {
          return false;
        }
        return true;
      })
      .map(slot => {
        const avail = slotAvailability?.availability?.[slot.id];
        const isFull = avail ? !avail.available : false;
        return {
          ...slot,
          isAvailable: !isFull,
          bookedCount: avail?.booked || 0,
          maxBookings: avail?.max || 3,
        };
      });
  })();

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
        console.log("Opening Razorpay payment gateway...");
        
        // Load Razorpay with enhanced error handling
        const razorpay = await loadRazorpay();
        if (!razorpay) {
          throw new Error("Razorpay SDK failed to load");
        }

        console.log("Payment order data:", paymentOrder);
        console.log("Using Razorpay key:", paymentOrder.key);
        
        // Force focus management before opening Razorpay
        const activeElement = document.activeElement as HTMLElement;
        if (activeElement) {
          activeElement.blur();
        }
        
        // Add small delay to ensure DOM is ready
        await new Promise(resolve => setTimeout(resolve, 300));
        
        const options = {
          key: import.meta.env.VITE_RAZORPAY_KEY_ID || paymentOrder.key,
          amount: paymentOrder.amount,
          currency: paymentOrder.currency,
          name: "P91 Car Care",
          description: `₹${bookingAmount} Booking Fee - ${service.title}`,
          order_id: paymentOrder.id,
          handler: async (response: any) => {
            console.log("💰 Payment successful:", response);
            console.log("📄 Payment response:", JSON.stringify(response, null, 2));
            
            try {
              console.log("🔄 Processing payment confirmation...");
              
              // Call payment confirmation endpoint with retry logic
              let confirmResponse;
              for (let attempt = 1; attempt <= 5; attempt++) {
                try {
                  console.log(`🔄 Payment confirmation attempt ${attempt}/5`);
                  confirmResponse = await fetch("/api/confirm-payment", {
                    method: "POST",
                    headers: {
                      "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                      razorpay_order_id: response.razorpay_order_id,
                      razorpay_payment_id: response.razorpay_payment_id,
                      razorpay_signature: response.razorpay_signature,
                    }),
                  });
                  
                  if (confirmResponse.ok) {
                    console.log("✅ Payment confirmation successful");
                    const confirmData = await confirmResponse.json();
                    
                    toast({
                      title: "Booking Confirmed!",
                      description: confirmData.whatsappSent 
                        ? "Your booking is confirmed! WhatsApp confirmation sent."
                        : "Your booking is confirmed! You'll receive confirmation shortly.",
                    });
                    break;
                  } else {
                    const errorText = await confirmResponse.text();
                    throw new Error(`HTTP ${confirmResponse.status}: ${errorText}`);
                  }
                } catch (err) {
                  console.error(`⚠️ Confirmation attempt ${attempt} failed:`, err);
                  if (attempt === 5) {
                    // Still show success since payment went through
                    toast({
                      title: "Payment Successful!", 
                      description: "Payment completed! Your booking will be processed. Contact us if you don't receive confirmation within 10 minutes.",
                      variant: "default",
                    });
                  } else {
                    // Wait before retry
                    await new Promise(resolve => setTimeout(resolve, 2000));
                  }
                }
              }
              
              onClose();
              form.reset();
            } catch (error) {
              console.error("💥 Payment confirmation error:", error);
              // Payment was successful, just confirmation failed
              toast({
                title: "Payment Successful!", 
                description: "Payment completed successfully! Your booking will be processed. Please contact us if you don't receive confirmation.",
                variant: "default",
              });
              
              onClose();
              form.reset();
            }
          },

          prefill: {
            name: form.getValues("customerName"),
            email: form.getValues("customerEmail"),
            contact: form.getValues("customerPhone"),
          },
          theme: {
            color: "#00FF94"
          },
          modal: {
            backdropclose: false,
            escape: true,
            handleback: true,
            confirm_close: false,
            animation: true,
            ondismiss: function() {
              console.log("Payment modal dismissed");
            }
          },
          remember_customer: false,
          timeout: 900
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
        
        // Add modal dismiss handler 
        payment.on('payment.cancel', function () {
          console.log('Payment cancelled by user');
          toast({
            title: "Payment Cancelled",
            description: "Payment was cancelled. You can try again anytime.",
          });
        });
        
        console.log("Opening Razorpay payment gateway...");
        payment.open();
        
        // Fix the clicking issue by ensuring proper iframe interaction
        setTimeout(() => {
          // Find the Razorpay iframe and ensure it's interactive
          const razorpayIframe = document.querySelector('iframe[src*="razorpay"]') as HTMLIFrameElement;
          if (razorpayIframe) {
            console.log("Found Razorpay iframe, enabling interactions");
            
            // Force focus and enable interactions
            razorpayIframe.focus();
            razorpayIframe.style.pointerEvents = 'auto';
            
            // Simulate a user interaction to "wake up" the iframe
            const clickEvent = new MouseEvent('click', {
              view: window,
              bubbles: true,
              cancelable: true,
              clientX: razorpayIframe.offsetLeft + 50,
              clientY: razorpayIframe.offsetTop + 50
            });
            razorpayIframe.dispatchEvent(clickEvent);
            
            // Also try focusing on parent container
            const parentContainer = razorpayIframe.parentElement;
            if (parentContainer) {
              parentContainer.focus();
            }
          }
        }, 800); // Increased delay to ensure iframe is fully loaded
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
    // Check if the selected date is a blackout date
    const blackoutDate = blackoutDates.find((bd: any) => bd.date === selectedDate);
    if (blackoutDate) {
      toast({
        title: "Booking Not Available",
        description: `Booking not available for this day – ${blackoutDate.reason}. Please choose another date before or after.`,
        variant: "destructive",
      });
      return;
    }

    // Include the selected date and time in the booking data
    const bookingData = {
      ...data,
      appointmentDate: selectedDate,
      appointmentTime: data.timeSlotId, // The timeSlotId is actually the time (e.g., "16:00")
    };
    bookingMutation.mutate(bookingData);
  };

  const today = new Date().toISOString().split('T')[0];

  // Check if a date is a blackout date
  const isBlackoutDate = (dateString: string) => {
    return blackoutDates.some((bd: any) => bd.date === dateString);
  };

  // Get blackout date reason
  const getBlackoutReason = (dateString: string) => {
    const blackoutDate = blackoutDates.find((bd: any) => bd.date === dateString);
    return blackoutDate?.reason || "";
  };

  // Handle date selection with blackout date and business hours validation
  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newSelectedDate = e.target.value;
    
    if (isBlackoutDate(newSelectedDate)) {
      const reason = getBlackoutReason(newSelectedDate);
      toast({
        title: "Booking Not Available",
        description: `Booking not available for this day – ${reason}. Please choose another date before or after.`,
        variant: "destructive",
      });
      return; // Don't update the date if it's a blackout date
    }
    
    // Check if store is closed on this day
    if (businessHours.length > 0) {
      const dayOfWeek = new Date(newSelectedDate + 'T00:00:00').getDay();
      const dayHours = businessHours.find(h => h.dayOfWeek === dayOfWeek);
      
      if (dayHours && !dayHours.isOpen) {
        toast({
          title: "Store Closed",
          description: `We are closed on ${dayHours.dayName}. Please select another day.`,
          variant: "destructive",
        });
        return; // Don't update the date if store is closed
      }
    }
    
    // Reset time slot when date changes
    form.setValue("timeSlotId", "");
    setSelectedDate(newSelectedDate);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl w-[95vw] max-h-[90vh] overflow-y-auto bg-dark-gray text-white border-medium-gray p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold gradient-text pr-14" data-testid="text-booking-modal-title">
            {service.title}
          </DialogTitle>
          {/* No close button here on purpose. DialogContent (components/ui/dialog.tsx)
              already renders a Radix DialogPrimitive.Close in this same top-right
              corner; a second one stacked two X icons on every service. The Radix one
              also provides Escape-to-close, focus trapping and focus return to the
              trigger, which the hand-rolled Button did not. */}
        </DialogHeader>

        <div className="space-y-8">
          {/* Service image — same resolver and framing as the corrected service cards:
              images[0] straight off the canonical record, a 2:1 box reserved before load
              so the modal never jumps, cover/center so it never stretches, and the shared
              branded placeholder only after a genuine error event (no hardcoded Unsplash
              stand-in, and an HTML error response fails the decode rather than rendering). */}
          <div>
            <ImageWithFallback
              src={resolveServiceImage(service)}
              alt={`${service.title} being carried out at P91 Car Care`}
              width={1600}
              height={800}
              className="block w-full aspect-[2/1] object-cover object-center bg-[#1a1a1a] rounded-xl"
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
            {service.title === 'Annual Maintenance Package' ? (
              <div className="text-center mb-4">
                <h3 className="text-2xl font-bold text-neon-green mb-2">💳 Complete Package Payment!</h3>
                <p className="text-gray-300">Pay full package price of ₹{bookingAmount} and get started</p>
              </div>
            ) : (
              <div className="text-center mb-4">
                <h3 className="text-2xl font-bold text-neon-green mb-2">🎉 Special Booking Offer!</h3>
                <p className="text-gray-300">Secure your slot with just ₹{bookingAmount} booking fee</p>
              </div>
            )}
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 mb-6">
              <div className="text-center p-4 bg-dark-gray rounded-lg">
                <div className="text-3xl font-bold text-white mb-2">₹{bookingAmount}</div>
                <div className="text-sm text-gray-400 mb-2">
                  {service.title === 'Annual Maintenance Package' ? 'Full Package Price' : 'Booking Fee Only'}
                </div>
                <div className="text-xs text-green-400">
                  {service.title === 'Annual Maintenance Package' 
                    ? '✓ Complete payment - no more charges' 
                    : '✓ Secures your preferred slot'
                  }
                </div>
              </div>
              {service.title === 'Annual Maintenance Package' ? (
                <div className="text-center p-4 bg-dark-gray rounded-lg">
                  <div className="text-3xl font-bold text-neon-green mb-2">ALL</div>
                  <div className="text-sm text-gray-400 mb-2">Services Included</div>
                  <div className="text-xs text-green-400">✓ Worth ₹18,000 - Save ₹9,001</div>
                </div>
              ) : (
                <div className="text-center p-4 bg-dark-gray rounded-lg">
                  <div className="text-3xl font-bold text-neon-green mb-2">FREE</div>
                  <div className="text-sm text-gray-400 mb-2">Car Wash Voucher</div>
                  <div className="text-xs text-green-400">✓ Worth ₹500 - Show at store</div>
                </div>
              )}
            </div>

            <div className="bg-yellow-500/20 border border-yellow-500/50 rounded-lg p-4 mb-4">
              <div className="flex items-start gap-3">
                <div className="text-yellow-400">💡</div>
                <div>
                  <div className="font-semibold text-yellow-300 mb-1">How it works:</div>
                  {service.title === 'Annual Maintenance Package' ? (
                    <ul className="text-sm text-gray-300 space-y-1">
                      <li>• Pay full package price of ₹8,999 to secure your annual plan</li>
                      <li>• Valid for 12 months from purchase date</li>
                      <li>• Schedule services as per your convenience</li>
                      <li>• Pickup & drop available at cost</li>
                    </ul>
                  ) : (
                    <ul className="text-sm text-gray-300 space-y-1">
                      <li>• Pay ₹299 booking fee to reserve your slot</li>
                      <li>• Get a FREE car wash voucher worth ₹500</li>
                      <li>• Show your booking confirmation at our store to claim</li>
                      <li>• No hidden charges - transparent pricing</li>
                    </ul>
                  )}
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
                        onChange={handleDateChange}
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
                                <SelectValue placeholder={slotsLoading ? "Loading slots..." : "Choose time slot"} />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent className="bg-dark-gray border-gray-600">
                              {timeSlots.length === 0 && (
                                <div className="px-3 py-2 text-sm text-gray-400">No available slots for this date</div>
                              )}
                              {timeSlots.map((slot: any) => (
                                <SelectItem 
                                  key={slot.id} 
                                  value={slot.id} 
                                  disabled={!slot.isAvailable}
                                  data-testid={`option-slot-${slot.id}`}
                                  className={!slot.isAvailable ? "opacity-50" : ""}
                                >
                                  {slot.startTime} - {slot.endTime}
                                  {!slot.isAvailable && " (Full)"}
                                  {slot.isAvailable && slot.bookedCount > 0 && ` (${slot.maxBookings - slot.bookedCount} left)`}
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
                    {service.title === 'Annual Maintenance Package' ? (
                      <span>{bookingMutation.isPending ? "Processing..." : `Pay ₹${bookingAmount} Complete Package`}</span>
                    ) : (
                      <>
                        <span className="block sm:hidden">Pay ₹{bookingAmount} + FREE Voucher</span>
                        <span className="hidden sm:block">{bookingMutation.isPending ? "Processing..." : `Pay ₹${bookingAmount} Booking Fee + Get FREE Voucher`}</span>
                      </>
                    )}
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
