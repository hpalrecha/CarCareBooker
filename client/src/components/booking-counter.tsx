import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, Clock, CheckCircle } from "lucide-react";

interface RecentBooking {
  name: string;
  service: string;
  location: string;
  timeAgo: string;
}

const recentBookings: RecentBooking[] = [
  { name: "Rajesh K.", service: "Premium Wash & Detail", location: "Koramangala", timeAgo: "2 min ago" },
  { name: "Priya S.", service: "Engine Bay Clean", location: "Indiranagar", timeAgo: "5 min ago" },
  { name: "Arjun M.", service: "Paint Protection", location: "Whitefield", timeAgo: "8 min ago" },
  { name: "Sneha P.", service: "Premium Wash & Detail", location: "HSR Layout", timeAgo: "12 min ago" },
  { name: "Vikram R.", service: "Engine Bay Clean", location: "Bannerghatta", timeAgo: "15 min ago" },
  { name: "Anita D.", service: "Premium Wash & Detail", location: "Electronic City", timeAgo: "18 min ago" },
];

export default function BookingCounter() {
  const [currentBooking, setCurrentBooking] = useState(0);
  const [todayBookings] = useState(47); // This would be from API in real app
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentBooking((prev) => (prev + 1) % recentBookings.length);
      setIsVisible(false);
      setTimeout(() => setIsVisible(true), 200);
    }, 4000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed bottom-6 left-6 z-50 max-w-sm">
      <Card className="bg-gray-900 border-green-400 shadow-lg shadow-green-400/20">
        <CardContent className="p-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
            <Badge className="bg-green-600 text-white text-xs">
              LIVE BOOKINGS
            </Badge>
          </div>
          
          <div className={`transition-opacity duration-200 ${isVisible ? 'opacity-100' : 'opacity-50'}`}>
            <div className="flex items-center gap-3 mb-2">
              <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-white font-medium text-sm truncate">
                  {recentBookings[currentBooking].name}
                </p>
                <p className="text-gray-400 text-xs truncate">
                  booked {recentBookings[currentBooking].service}
                </p>
                <p className="text-green-400 text-xs">
                  {recentBookings[currentBooking].location} • {recentBookings[currentBooking].timeAgo}
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