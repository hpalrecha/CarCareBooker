import { useState, useEffect } from "react";
import { CheckCircle, Users, Clock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface FakeBooking {
  name: string;
  service: string;
  location: string;
  timeAgo: string;
  amount: string;
}

const fakeBookings: FakeBooking[] = [
  { name: "Rajesh K.", service: "Interior Deep Clean", location: "Koramangala", timeAgo: "2 min ago", amount: "₹2,500" },
  { name: "Priya S.", service: "Glass Coating", location: "Indiranagar", timeAgo: "5 min ago", amount: "₹3,000" },
  { name: "Arjun M.", service: "Headlight Restoration", location: "Whitefield", timeAgo: "8 min ago", amount: "₹1,800" },
  { name: "Sneha P.", service: "Complete Exterior Detail", location: "HSR Layout", timeAgo: "12 min ago", amount: "₹1,500" },
  { name: "Vikram R.", service: "Interior Deep Clean", location: "Bannerghatta", timeAgo: "15 min ago", amount: "₹2,500" },
  { name: "Anita D.", service: "Glass Coating", location: "Electronic City", timeAgo: "18 min ago", amount: "₹3,000" },
  { name: "Karthik N.", service: "Headlight Restoration", location: "JP Nagar", timeAgo: "22 min ago", amount: "₹1,800" },
  { name: "Meera T.", service: "Complete Exterior Detail", location: "Marathahalli", timeAgo: "25 min ago", amount: "₹1,500" },
];

export default function FakeBookingPopup() {
  const { toast } = useToast();
  const [currentBooking, setCurrentBooking] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      const booking = fakeBookings[currentBooking];
      
      // Show toast notification
      toast({
        title: "🔥 New Booking!",
        description: `${booking.name} just booked ${booking.service} in ${booking.location} for ${booking.amount}`,
        duration: 4000,
      });

      // Update to next booking
      setCurrentBooking((prev) => (prev + 1) % fakeBookings.length);
    }, 8000); // Show every 8 seconds

    return () => clearInterval(interval);
  }, [currentBooking, toast]);

  return null; // This component only shows toasts, no visual element
}