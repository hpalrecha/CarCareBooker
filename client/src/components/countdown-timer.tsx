import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, Zap } from "lucide-react";

export default function CountdownTimer() {
  const [timeLeft, setTimeLeft] = useState(3600); // 60 minutes in seconds

  useEffect(() => {
    // Get or set the countdown end time for today
    const today = new Date().toDateString();
    const storageKey = `countdown-${today}`;
    
    let endTime = localStorage.getItem(storageKey);
    if (!endTime) {
      // Set countdown to end 60 minutes from now
      const newEndTime = new Date(Date.now() + 60 * 60 * 1000).getTime();
      localStorage.setItem(storageKey, newEndTime.toString());
      endTime = newEndTime.toString();
    }

    const updateTimer = () => {
      const now = Date.now();
      const timeRemaining = Math.max(0, parseInt(endTime!) - now);
      setTimeLeft(Math.floor(timeRemaining / 1000));
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, []);

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  if (timeLeft <= 0) {
    return null; // Hide when timer expires
  }

  return (
    <Card className="bg-gradient-to-r from-red-600 to-red-700 border-red-500 shadow-lg shadow-red-500/20">
      <CardContent className="p-6 text-center">
        <div className="flex items-center justify-center gap-2 mb-3">
          <Zap className="w-5 h-5 text-yellow-300 animate-pulse" />
          <Badge className="bg-yellow-500 text-black font-bold">
            LIMITED TIME OFFER
          </Badge>
          <Zap className="w-5 h-5 text-yellow-300 animate-pulse" />
        </div>
        
        <h3 className="text-2xl font-bold text-white mb-2">
          SAVE UP TO 30% TODAY!
        </h3>
        
        <p className="text-yellow-100 mb-4 text-sm">
          Special discount ends in:
        </p>
        
        <div className="flex items-center justify-center gap-4 mb-4">
          <div className="bg-black bg-opacity-50 rounded-lg px-3 py-2 min-w-[60px]">
            <div className="text-2xl font-bold text-white">
              {minutes.toString().padStart(2, '0')}
            </div>
            <div className="text-xs text-gray-300">MIN</div>
          </div>
          <div className="text-white text-2xl font-bold animate-pulse">:</div>
          <div className="bg-black bg-opacity-50 rounded-lg px-3 py-2 min-w-[60px]">
            <div className="text-2xl font-bold text-white">
              {seconds.toString().padStart(2, '0')}
            </div>
            <div className="text-xs text-gray-300">SEC</div>
          </div>
        </div>
        
        <div className="flex items-center justify-center gap-2 text-yellow-100 text-sm">
          <Clock className="w-4 h-4" />
          <span>Hurry! Limited slots available</span>
        </div>
      </CardContent>
    </Card>
  );
}