import { useParams, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import Navbar from "@/components/navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { CheckCircle, Calendar, Clock, MapPin, Phone, Mail, MessageCircle, ArrowLeft } from "lucide-react";
import { Link } from "wouter";

export default function BookingConfirmation() {
  const { id } = useParams();
  const [, setLocation] = useLocation();

  const { data: booking, isLoading, error } = useQuery({
    queryKey: ["/api/bookings", id],
    enabled: !!id,
  });

  useEffect(() => {
    if (error) {
      setLocation("/");
    }
  }, [error, setLocation]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-deep-black text-white">
        <Navbar />
        <div className="pt-16 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center mb-8">
            <Skeleton className="w-16 h-16 mx-auto mb-4 bg-medium-gray rounded-full" />
            <Skeleton className="w-64 h-8 mx-auto mb-2 bg-medium-gray" />
            <Skeleton className="w-48 h-6 mx-auto bg-medium-gray" />
          </div>
          <Card className="glass-effect border-medium-gray">
            <CardContent className="p-8 space-y-6">
              <Skeleton className="w-full h-32 bg-medium-gray" />
              <Skeleton className="w-full h-24 bg-medium-gray" />
              <Skeleton className="w-full h-16 bg-medium-gray" />
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className="min-h-screen bg-deep-black text-white">
        <Navbar />
        <div className="pt-16 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-red-400 mb-4" data-testid="text-error-title">
              Booking Not Found
            </h1>
            <p className="text-gray-300 mb-6">
              The booking you're looking for doesn't exist or you don't have permission to view it.
            </p>
            <Link href="/">
              <Button className="bg-neon-green text-deep-black hover:bg-neon-green/90" data-testid="button-back-home">
                Back to Home
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "paid":
        return <Badge className="bg-green-900 text-green-300">Confirmed & Paid</Badge>;
      case "pending":
        return <Badge className="bg-yellow-900 text-yellow-300">Payment Pending</Badge>;
      case "failed":
        return <Badge className="bg-red-900 text-red-300">Payment Failed</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const isConfirmed = booking.paymentStatus === "paid";

  return (
    <div className="min-h-screen bg-deep-black text-white">
      <Navbar />
      
      <div className="pt-16 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className={`w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center ${isConfirmed ? 'bg-green-900' : 'bg-yellow-900'}`}>
            <CheckCircle className={`w-8 h-8 ${isConfirmed ? 'text-green-300' : 'text-yellow-300'}`} />
          </div>
          <h1 className="text-3xl font-bold gradient-text mb-2" data-testid="text-confirmation-title">
            {isConfirmed ? "Booking Confirmed!" : "Booking Created"}
          </h1>
          <p className="text-gray-300" data-testid="text-confirmation-subtitle">
            {isConfirmed 
              ? "Thank you for choosing P91 Car Care. Your appointment is confirmed."
              : "Your booking has been created. Please complete the payment to confirm your appointment."
            }
          </p>
        </div>

        {/* Booking Details Card */}
        <Card className="glass-effect border-medium-gray mb-8">
          <CardHeader>
            <CardTitle className="flex justify-between items-center">
              <span className="text-neon-green">Booking Details</span>
              <span data-testid="status-badge">{getStatusBadge(booking.paymentStatus)}</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Service Information */}
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold text-white mb-3">Service Information</h3>
                <div className="space-y-2 text-gray-300">
                  <div className="flex justify-between">
                    <span>Service:</span>
                    <span className="text-white font-medium" data-testid="text-service-name">
                      {booking.service?.title || "Service details unavailable"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Booking ID:</span>
                    <span className="text-white font-mono" data-testid="text-booking-id">
                      #{booking.id.slice(-8).toUpperCase()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Amount:</span>
                    <span className="text-neon-green font-bold" data-testid="text-booking-amount">
                      ₹{booking.amount}
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="font-semibold text-white mb-3">Appointment Details</h3>
                <div className="space-y-2 text-gray-300">
                  <div className="flex items-center space-x-2">
                    <Calendar className="w-4 h-4 text-neon-green" />
                    <span data-testid="text-appointment-date">
                      {booking.timeSlot?.date ? formatDate(booking.timeSlot.date) : "Date unavailable"}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Clock className="w-4 h-4 text-neon-green" />
                    <span data-testid="text-appointment-time">
                      {booking.timeSlot?.startTime || "Time unavailable"}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Customer Information */}
            <div className="border-t border-gray-600 pt-6">
              <h3 className="font-semibold text-white mb-3">Customer Information</h3>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2 text-gray-300">
                  <div className="flex justify-between">
                    <span>Name:</span>
                    <span className="text-white" data-testid="text-customer-name">
                      {booking.customerName}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Email:</span>
                    <span className="text-white" data-testid="text-customer-email">
                      {booking.customerEmail}
                    </span>
                  </div>
                </div>
                <div className="space-y-2 text-gray-300">
                  <div className="flex justify-between">
                    <span>Phone:</span>
                    <span className="text-white" data-testid="text-customer-phone">
                      {booking.customerPhone}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Booked on:</span>
                    <span className="text-white" data-testid="text-booking-date">
                      {new Date(booking.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Location & Contact Card */}
        <Card className="glass-effect border-medium-gray mb-8">
          <CardHeader>
            <CardTitle className="text-neon-green">Service Center Location</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <MapPin className="w-5 h-5 text-neon-green mt-1" />
                  <div>
                    <h4 className="font-semibold text-white mb-1">P91 Car Care Center</h4>
                    <p className="text-gray-300" data-testid="text-service-center-address">
                      123 Service Road, Adugodi<br />
                      Bangalore, Karnataka 560030
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <Phone className="w-5 h-5 text-neon-green" />
                  <div>
                    <h4 className="font-semibold text-white mb-1">Contact</h4>
                    <p className="text-gray-300" data-testid="text-contact-phone">
                      +91 98765 43210
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  <MessageCircle className="w-5 h-5 text-neon-green" />
                  <div>
                    <h4 className="font-semibold text-white mb-1">WhatsApp</h4>
                    <p className="text-gray-300" data-testid="text-whatsapp-number">
                      +91 98765 43210
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Important Information */}
        {isConfirmed && (
          <Card className="glass-effect border-medium-gray mb-8">
            <CardHeader>
              <CardTitle className="text-neon-green">Important Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-gray-300">
                <div className="flex items-start space-x-2">
                  <CheckCircle className="w-5 h-5 text-neon-green mt-0.5 flex-shrink-0" />
                  <p>Please arrive 10 minutes before your scheduled appointment time.</p>
                </div>
                <div className="flex items-start space-x-2">
                  <CheckCircle className="w-5 h-5 text-neon-green mt-0.5 flex-shrink-0" />
                  <p>Bring a valid ID and your vehicle registration documents.</p>
                </div>
                <div className="flex items-start space-x-2">
                  <CheckCircle className="w-5 h-5 text-neon-green mt-0.5 flex-shrink-0" />
                  <p>If you need to reschedule, please contact us at least 2 hours in advance.</p>
                </div>
                <div className="flex items-start space-x-2">
                  <CheckCircle className="w-5 h-5 text-neon-green mt-0.5 flex-shrink-0" />
                  <p>You will receive WhatsApp and email confirmations shortly.</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/">
            <Button 
              variant="outline" 
              className="border-2 border-neon-green text-neon-green hover:bg-neon-green hover:text-deep-black"
              data-testid="button-back-home"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Home
            </Button>
          </Link>
          
          {isConfirmed && (
            <Button 
              className="bg-neon-green text-deep-black hover:bg-neon-green/90 neon-glow"
              onClick={() => {
                const mapUrl = `https://maps.google.com/?q=P91+Car+Care+Adugodi+Bangalore`;
                window.open(mapUrl, '_blank');
              }}
              data-testid="button-get-directions"
            >
              <MapPin className="w-4 h-4 mr-2" />
              Get Directions
            </Button>
          )}
        </div>

        {/* Contact Support */}
        <div className="text-center mt-8 p-6 glass-effect rounded-xl">
          <h3 className="font-semibold text-white mb-2">Need Help?</h3>
          <p className="text-gray-300 mb-4">
            If you have any questions about your booking, feel free to contact us.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button 
              variant="ghost" 
              className="text-neon-green hover:bg-neon-green/10"
              onClick={() => window.open(`tel:+919876543210`)}
              data-testid="button-call-support"
            >
              <Phone className="w-4 h-4 mr-2" />
              Call Support
            </Button>
            <Button 
              variant="ghost" 
              className="text-neon-green hover:bg-neon-green/10"
              onClick={() => window.open(`https://wa.me/919876543210?text=Hi, I need help with my booking ${booking.id}`)}
              data-testid="button-whatsapp-support"
            >
              <MessageCircle className="w-4 h-4 mr-2" />
              WhatsApp
            </Button>
            <Button 
              variant="ghost" 
              className="text-neon-green hover:bg-neon-green/10"
              onClick={() => window.open(`mailto:support@p91carcare.com?subject=Booking Support - ${booking.id}`)}
              data-testid="button-email-support"
            >
              <Mail className="w-4 h-4 mr-2" />
              Email Support
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
