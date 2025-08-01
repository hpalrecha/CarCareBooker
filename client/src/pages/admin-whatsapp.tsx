import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { 
  MessageCircle, 
  Clock, 
  Send, 
  CheckCircle, 
  Calendar,
  Bell,
  Phone,
  Mail,
  ArrowLeft,
  Copy
} from "lucide-react";
import { useLocation } from "wouter";

interface Booking {
  id: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  serviceName: string;
  appointmentDate: string;
  appointmentTime: string;
  amount: string;
  paymentStatus: string;
  reminder24hSent: boolean;
  reminder2hSent: boolean;
  whatsappSent: boolean;
}

const WhatsAppTemplatePreview = ({ template, booking }: { template: string; booking?: Booking }) => {
  if (!booking) return null;
  
  const previewText = template
    .replace(/\${booking\.customerName}/g, booking.customerName)
    .replace(/\${booking\.serviceName}/g, booking.serviceName || 'Sample Service')
    .replace(/\${booking\.appointmentDate}/g, booking.appointmentDate)
    .replace(/\${booking\.appointmentTime}/g, booking.appointmentTime)
    .replace(/\${booking\.amount}/g, booking.amount)
    .replace(/\${booking\.bookingId\.slice\(0, 8\)\.toUpperCase\(\)}/g, booking.id.slice(0, 8).toUpperCase());

  return (
    <div className="bg-green-900/20 border border-green-700 rounded-lg p-4 mt-4">
      <div className="flex items-center gap-2 mb-2">
        <MessageCircle className="h-4 w-4 text-green-400" />
        <span className="text-sm text-green-400 font-medium">WhatsApp Preview</span>
      </div>
      <div className="text-sm text-gray-300 whitespace-pre-wrap font-mono">
        {previewText}
      </div>
    </div>
  );
};

export default function AdminWhatsApp() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [customMessage, setCustomMessage] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");

  // Fetch all bookings
  const { data: bookings = [], isLoading: bookingsLoading } = useQuery({
    queryKey: ["/api/bookings"],
  });

  // Send test reminder mutation
  const testReminderMutation = useMutation({
    mutationFn: async ({ bookingId, type }: { bookingId: string; type: '24h' | '2h' }) => {
      return apiRequest("POST", `/api/admin/test-reminder/${bookingId}`, { type });
    },
    onSuccess: () => {
      toast({
        title: "Test Reminder Sent",
        description: "WhatsApp reminder has been sent successfully!",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/bookings"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to Send Reminder",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Send custom message mutation
  const customMessageMutation = useMutation({
    mutationFn: async ({ phone, message }: { phone: string; message: string }) => {
      return apiRequest("POST", "/api/admin/send-custom-message", { 
        phoneNumber: phone, 
        message 
      });
    },
    onSuccess: () => {
      toast({
        title: "Custom Message Sent",
        description: "WhatsApp message has been sent successfully!",
      });
      setCustomMessage("");
      setPhoneNumber("");
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to Send Message",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const sampleTemplates = {
    bookingConfirmation: `🚗 *P91 Car Care - Booking Confirmed* ✅

Hello \${booking.customerName}! 👋

Your car service booking has been *CONFIRMED*:

📋 *Service Details:*
• Service: \${booking.serviceName}
• Date: \${booking.appointmentDate}  
• Time: \${booking.appointmentTime}
• Amount Paid: ₹\${booking.amount}
• Booking ID: #\${booking.bookingId.slice(0, 8).toUpperCase()}

📍 *Location:*
P91 Car Care Center
Bangalore, Karnataka

📞 *Contact:* +91 74066 19191

Thank you for choosing P91 Car Care! 🙏`,

    reminder24h: `⏰ *P91 Car Care - Reminder* 🚗

Hello \${booking.customerName}! 👋

This is a friendly reminder about your car service appointment *TOMORROW*:

📋 *Your Appointment:*
• Service: \${booking.serviceName}
• Date: \${booking.appointmentDate}
• Time: \${booking.appointmentTime}
• Booking ID: #\${booking.bookingId.slice(0, 8).toUpperCase()}

📍 *Location:* P91 Car Care Center
📞 *Contact:* +91 74066 19191

⭐ *Pro Tip:* Arrive 10 minutes early!

See you tomorrow! 🙏`,

    reminder2h: `🚨 *P91 Car Care - Today's Appointment* ⏰

Hello \${booking.customerName}! 👋

Your car service appointment is *TODAY in 2 hours*:

📋 *Appointment Details:*
• Service: \${booking.serviceName}
• Time: \${booking.appointmentTime}
• Booking ID: #\${booking.bookingId.slice(0, 8).toUpperCase()}

📍 P91 Car Care Center
📞 +91 74066 19191

⏰ *Please arrive 10 minutes early*

See you soon! 🚗✨`
  };

  return (
    <div className="min-h-screen bg-deep-black text-white">
      <div className="sticky top-0 z-50 bg-deep-black/95 backdrop-blur-sm border-b border-medium-gray">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                onClick={() => setLocation("/admin/dashboard")}
                className="text-gray-400 hover:text-white"
                data-testid="button-back-dashboard"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Dashboard
              </Button>
              <h1 className="text-xl font-bold text-neon-green">
                WhatsApp Management
              </h1>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Template Preview Section */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="glass-effect border-medium-gray">
              <CardHeader>
                <CardTitle className="text-xl text-neon-green flex items-center">
                  <MessageCircle className="mr-2 h-5 w-5" />
                  Message Templates
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                
                {/* Booking Confirmation Template */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-400" />
                    <h3 className="font-semibold text-white">Booking Confirmation</h3>
                    <Badge variant="secondary" className="bg-green-900 text-green-300">
                      Auto-sent
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-400">
                    Sent immediately after successful payment
                  </p>
                  <WhatsAppTemplatePreview 
                    template={sampleTemplates.bookingConfirmation} 
                    booking={selectedBooking || bookings[0]} 
                  />
                </div>

                <Separator className="bg-gray-700" />

                {/* 24-hour Reminder Template */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-blue-400" />
                    <h3 className="font-semibold text-white">24-Hour Reminder</h3>
                    <Badge variant="secondary" className="bg-blue-900 text-blue-300">
                      Auto-scheduled
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-400">
                    Sent 24 hours before appointment
                  </p>
                  <WhatsAppTemplatePreview 
                    template={sampleTemplates.reminder24h} 
                    booking={selectedBooking || bookings[0]} 
                  />
                </div>

                <Separator className="bg-gray-700" />

                {/* 2-hour Reminder Template */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Bell className="h-4 w-4 text-orange-400" />
                    <h3 className="font-semibold text-white">2-Hour Reminder</h3>
                    <Badge variant="secondary" className="bg-orange-900 text-orange-300">
                      Auto-scheduled
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-400">
                    Sent 2 hours before appointment
                  </p>
                  <WhatsAppTemplatePreview 
                    template={sampleTemplates.reminder2h} 
                    booking={selectedBooking || bookings[0]} 
                  />
                </div>

              </CardContent>
            </Card>

            {/* Custom Message Section */}
            <Card className="glass-effect border-medium-gray">
              <CardHeader>
                <CardTitle className="text-xl text-neon-green flex items-center">
                  <Send className="mr-2 h-5 w-5" />
                  Send Custom Message
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Phone Number
                  </label>
                  <Input
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="+91 9876543210"
                    className="bg-dark-gray border-gray-600 text-white"
                    data-testid="input-phone-number"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Message
                  </label>
                  <Textarea
                    value={customMessage}
                    onChange={(e) => setCustomMessage(e.target.value)}
                    placeholder="Type your custom WhatsApp message here..."
                    rows={6}
                    className="bg-dark-gray border-gray-600 text-white"
                    data-testid="textarea-custom-message"
                  />
                </div>
                <Button
                  onClick={() => customMessageMutation.mutate({ 
                    phone: phoneNumber, 
                    message: customMessage 
                  })}
                  disabled={!phoneNumber || !customMessage || customMessageMutation.isPending}
                  className="bg-neon-green text-deep-black hover:bg-neon-green/90"
                  data-testid="button-send-custom-message"
                >
                  {customMessageMutation.isPending ? "Sending..." : "Send Message"}
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Bookings List Section */}
          <div className="space-y-6">
            <Card className="glass-effect border-medium-gray">
              <CardHeader>
                <CardTitle className="text-lg text-white">Recent Bookings</CardTitle>
              </CardHeader>
              <CardContent>
                {bookingsLoading ? (
                  <div className="text-center py-4 text-gray-400">Loading bookings...</div>
                ) : bookings.length === 0 ? (
                  <div className="text-center py-4 text-gray-400">No bookings found</div>
                ) : (
                  <div className="space-y-3">
                    {bookings.slice(0, 10).map((booking: any) => (
                      <div 
                        key={booking.id} 
                        className={`border rounded-lg p-3 cursor-pointer transition-colors ${
                          selectedBooking?.id === booking.id 
                            ? 'border-neon-green bg-neon-green/10' 
                            : 'border-gray-700 hover:bg-gray-800/50'
                        }`}
                        onClick={() => setSelectedBooking(booking)}
                        data-testid={`booking-card-${booking.id}`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h4 className="font-medium text-white text-sm">
                              {booking.customerName}
                            </h4>
                            <div className="flex items-center gap-2 mt-1">
                              <Phone className="h-3 w-3 text-gray-400" />
                              <span className="text-xs text-gray-400">
                                {booking.customerPhone}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 mt-1">
                              <Calendar className="h-3 w-3 text-gray-400" />
                              <span className="text-xs text-gray-400">
                                {booking.appointmentDate} at {booking.appointmentTime}
                              </span>
                            </div>
                            
                            {/* Reminder Status */}
                            <div className="flex gap-1 mt-2">
                              <Badge 
                                variant={booking.whatsappSent ? "default" : "secondary"}
                                className={`text-xs ${
                                  booking.whatsappSent 
                                    ? "bg-green-900 text-green-300" 
                                    : "bg-gray-700 text-gray-400"
                                }`}
                              >
                                Confirmed
                              </Badge>
                              <Badge 
                                variant={booking.reminder24hSent ? "default" : "secondary"}
                                className={`text-xs ${
                                  booking.reminder24hSent 
                                    ? "bg-blue-900 text-blue-300" 
                                    : "bg-gray-700 text-gray-400"
                                }`}
                              >
                                24h
                              </Badge>
                              <Badge 
                                variant={booking.reminder2hSent ? "default" : "secondary"}
                                className={`text-xs ${
                                  booking.reminder2hSent 
                                    ? "bg-orange-900 text-orange-300" 
                                    : "bg-gray-700 text-gray-400"
                                }`}
                              >
                                2h
                              </Badge>
                            </div>
                          </div>
                          
                          <div className="flex flex-col gap-1">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={(e) => {
                                e.stopPropagation();
                                testReminderMutation.mutate({ 
                                  bookingId: booking.id, 
                                  type: '24h' 
                                });
                              }}
                              disabled={testReminderMutation.isPending}
                              className="text-xs h-6 px-2 border-blue-600 text-blue-400 hover:bg-blue-900/20"
                              data-testid={`button-test-24h-${booking.id}`}
                            >
                              Test 24h
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={(e) => {
                                e.stopPropagation();
                                testReminderMutation.mutate({ 
                                  bookingId: booking.id, 
                                  type: '2h' 
                                });
                              }}
                              disabled={testReminderMutation.isPending}
                              className="text-xs h-6 px-2 border-orange-600 text-orange-400 hover:bg-orange-900/20"
                              data-testid={`button-test-2h-${booking.id}`}
                            >
                              Test 2h
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {selectedBooking && (
              <Card className="glass-effect border-medium-gray">
                <CardHeader>
                  <CardTitle className="text-lg text-white">Selected Booking</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Customer:</span>
                      <span className="text-white">{selectedBooking.customerName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Phone:</span>
                      <span className="text-white">{selectedBooking.customerPhone}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Service:</span>
                      <span className="text-white">{selectedBooking.serviceName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Date & Time:</span>
                      <span className="text-white">
                        {selectedBooking.appointmentDate} at {selectedBooking.appointmentTime}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Amount:</span>
                      <span className="text-white">₹{selectedBooking.amount}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}