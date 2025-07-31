import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, Clock, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface RecentBooking {
  name: string;
  service: string;
  location: string;
  timeAgo: string;
}

const recentBookings: RecentBooking[] = [
  { name: "Rajesh K.", service: "Premium Wash & Detail", location: "Koramangala", timeAgo: "3 min ago" },
  { name: "Priya S.", service: "Interior Deep Clean", location: "Indiranagar", timeAgo: "7 min ago" },
  { name: "Arjun M.", service: "Glass Coating", location: "Whitefield", timeAgo: "12 min ago" },
  { name: "Sneha P.", service: "Headlight Restoration", location: "HSR Layout", timeAgo: "18 min ago" },
  { name: "Vikram R.", service: "Engine Bay Clean", location: "Bannerghatta", timeAgo: "23 min ago" },
  { name: "Anita D.", service: "Premium Wash & Detail", location: "Electronic City", timeAgo: "29 min ago" },
  { name: "Karthik N.", service: "Interior Deep Clean", location: "JP Nagar", timeAgo: "34 min ago" },
  { name: "Meera T.", service: "Glass Coating", location: "Marathahalli", timeAgo: "41 min ago" },
  { name: "Ravi P.", service: "Headlight Restoration", location: "BTM Layout", timeAgo: "47 min ago" },
  { name: "Deepa M.", service: "Engine Bay Clean", location: "Jayanagar", timeAgo: "52 min ago" },
];

export default function BookingCounter() {
  const { toast } = useToast();
  const [currentBooking, setCurrentBooking] = useState(0);
  const [todayBookings] = useState(47); // This would be from API in real app
  const [isVisible, setIsVisible] = useState(true);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setIsAnimating(true);
      setIsVisible(false);
      
      setTimeout(() => {
        const nextBooking = (currentBooking + 1) % recentBookings.length;
        setCurrentBooking(nextBooking);
        setIsVisible(true);
        
        // Show toast notification for the new booking
        toast({
          title: "🔥 New Booking Alert!",
          description: `${recentBookings[nextBooking].name} just booked ${recentBookings[nextBooking].service} in ${recentBookings[nextBooking].location}`,
          duration: 3000,
        });
        
        setTimeout(() => {
          setIsAnimating(false);
        }, 1000);
      }, 500);
    }, 8000); // Slower interval - every 8 seconds

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed bottom-6 left-6 z-50 max-w-sm">
      <Card className={`bg-gray-900 border-green-400 shadow-lg shadow-green-400/20 transition-all duration-500 ${isAnimating ? 'scale-105 border-yellow-400 shadow-yellow-400/30' : ''}`}>
        <CardContent className="p-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
            <Badge className={`text-white text-xs transition-colors duration-300 ${isAnimating ? 'bg-yellow-600' : 'bg-green-600'}`}>
              {isAnimating ? '🔥 NEW BOOKING!' : 'LIVE BOOKINGS'}
            </Badge>
          </div>
          
          <div className={`transition-all duration-500 transform ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}`}>
            <div className="flex items-center gap-3 mb-2">
              <CheckCircle className={`w-4 h-4 flex-shrink-0 transition-colors duration-300 ${isAnimating ? 'text-yellow-400' : 'text-green-400'}`} />
              <div className="min-w-0">
                <p className="text-white font-medium text-sm truncate">
                  {recentBookings[currentBooking].name}
                </p>
                <p className="text-gray-400 text-xs truncate">
                  just booked {recentBookings[currentBooking].service}
                </p>
                <p className={`text-xs transition-colors duration-300 ${isAnimating ? 'text-yellow-400' : 'text-green-400'}`}>
                  📍 {recentBookings[currentBooking].location} • {recentBookings[currentBooking].timeAgo}
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-gray-700">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-green-400" />
              <span className="text-green-400 font-bold text-sm">{todayBookings}</span>
              <span className="text-gray-400 text-xs">bookings today</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}