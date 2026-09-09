import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import AdminServiceForm from "@/components/admin-service-form";
import { Plus, Eye, MessageCircle, Edit, Users, Clock, CheckCircle, DollarSign, Settings, Phone, Calendar, Trash2, AlertCircle, Play, Copy } from "lucide-react";
import { format } from "date-fns";

function BlackoutDatesTab() {
  const { toast } = useToast();
  const [selectedDate, setSelectedDate] = useState("");
  const [reason, setReason] = useState("");

  const { data: blackoutDates = [], isLoading } = useQuery({
    queryKey: ["/api/blackout-dates"],
  });

  const createBlackoutMutation = useMutation({
    mutationFn: async (data: { date: string; reason: string }) => {
      const response = await apiRequest("POST", "/api/blackout-dates", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/blackout-dates"] });
      setSelectedDate("");
      setReason("");
      toast({
        title: "Blackout Date Added",
        description: "The date has been blocked successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to Add",
        description: error.message || "Failed to add blackout date",
        variant: "destructive",
      });
    },
  });

  const deleteBlackoutMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest("DELETE", `/api/blackout-dates/${id}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/blackout-dates"] });
      toast({
        title: "Blackout Date Removed",
        description: "The date has been unblocked successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to Remove",
        description: error.message || "Failed to remove blackout date",
        variant: "destructive",
      });
    },
  });

  const handleAddBlackout = () => {
    if (!selectedDate || !reason.trim()) {
      toast({
        title: "Missing Information",
        description: "Please select a date and enter a reason.",
        variant: "destructive",
      });
      return;
    }

    createBlackoutMutation.mutate({ date: selectedDate, reason: reason.trim() });
  };

  const handleDeleteBlackout = (id: string) => {
    if (confirm("Are you sure you want to remove this blackout date?")) {
      deleteBlackoutMutation.mutate(id);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="glass-effect border-medium-gray">
        <CardHeader>
          <CardTitle className="text-xl text-neon-green flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Add Blackout Date
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="blackout-date" className="text-gray-300">Select Date</Label>
              <Input
                id="blackout-date"
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="bg-dark-gray border-gray-600 text-white"
                data-testid="input-blackout-date"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="blackout-reason" className="text-gray-300">Reason (Required)</Label>
              <Input
                id="blackout-reason"
                type="text"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="e.g., Public Holiday, Store Closed"
                className="bg-dark-gray border-gray-600 text-white"
                data-testid="input-blackout-reason"
              />
            </div>
          </div>
          <Button
            onClick={handleAddBlackout}
            disabled={createBlackoutMutation.isPending}
            className="mt-4 bg-neon-green text-deep-black hover:bg-neon-green/80"
            data-testid="button-add-blackout"
          >
            <Plus className="mr-2 h-4 w-4" />
            {createBlackoutMutation.isPending ? "Adding..." : "Add Blackout Date"}
          </Button>
        </CardContent>
      </Card>

      <Card className="glass-effect border-medium-gray">
        <CardHeader>
          <CardTitle className="text-xl text-neon-green">Blocked Dates</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-gray-400">Loading blackout dates...</div>
          ) : blackoutDates.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <AlertCircle className="h-12 w-12 mx-auto mb-3 text-gray-600" />
              <p>No blackout dates configured.</p>
              <p className="text-sm mt-2">Add dates above to block customer bookings.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {blackoutDates.map((blackout: any) => (
                <div
                  key={blackout.id}
                  className="flex items-center justify-between bg-deep-black/50 border border-gray-700 rounded-lg p-4"
                  data-testid={`blackout-${blackout.id}`}
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <Calendar className="h-5 w-5 text-neon-green" />
                      <div>
                        <div className="font-semibold text-white" data-testid={`blackout-date-${blackout.id}`}>
                          {format(new Date(blackout.date + 'T00:00:00'), 'MMMM d, yyyy')}
                        </div>
                        <div className="text-sm text-gray-400" data-testid={`blackout-reason-${blackout.id}`}>
                          {blackout.reason}
                        </div>
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteBlackout(blackout.id)}
                    disabled={deleteBlackoutMutation.isPending}
                    className="text-red-400 hover:text-red-300 hover:bg-red-900/20"
                    data-testid={`button-delete-${blackout.id}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

interface BusinessHour {
  id: string;
  dayOfWeek: number;
  dayName: string;
  isOpen: boolean;
  openTime: string;
  cutoffTime: string;
  updatedAt: string;
}

function BusinessHoursTab() {
  const { toast } = useToast();

  const { data: businessHours = [], isLoading, refetch } = useQuery<BusinessHour[]>({
    queryKey: ["/api/business-hours"],
  });

  const initializeMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/business-hours/initialize");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/business-hours"] });
      toast({
        title: "Business Hours Initialized",
        description: "Default business hours have been set up.",
      });
    },
    onError: () => {
      toast({
        title: "Failed to Initialize",
        description: "Failed to initialize business hours.",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ dayOfWeek, updates }: { dayOfWeek: number; updates: { isOpen?: boolean; openTime?: string; cutoffTime?: string } }) => {
      const response = await apiRequest("PATCH", `/api/business-hours/${dayOfWeek}`, updates);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/business-hours"] });
      toast({
        title: "Business Hours Updated",
        description: "The hours have been saved.",
      });
    },
    onError: () => {
      toast({
        title: "Failed to Update",
        description: "Failed to update business hours.",
        variant: "destructive",
      });
    },
  });

  const handleToggleOpen = (dayOfWeek: number, isOpen: boolean) => {
    updateMutation.mutate({ dayOfWeek, updates: { isOpen } });
  };

  const handleUpdateTime = (dayOfWeek: number, field: 'openTime' | 'cutoffTime', value: string) => {
    updateMutation.mutate({ dayOfWeek, updates: { [field]: value } });
  };

  return (
    <div className="space-y-6">
      <Card className="glass-effect border-medium-gray">
        <CardHeader>
          <CardTitle className="text-xl text-neon-green flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Business Hours & Daily Cutoff Times
          </CardTitle>
          <p className="text-gray-400 text-sm mt-2">
            Set the last booking time for each day. For example, if you have a half day on Saturday, set the cutoff to 2:00 PM.
            Customers won't be able to book time slots after the cutoff time.
          </p>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-gray-400">Loading business hours...</div>
          ) : businessHours.length === 0 ? (
            <div className="text-center py-8">
              <AlertCircle className="h-12 w-12 mx-auto mb-3 text-gray-600" />
              <p className="text-gray-400 mb-4">Business hours not configured yet.</p>
              <Button
                onClick={() => initializeMutation.mutate()}
                disabled={initializeMutation.isPending}
                className="bg-neon-green text-deep-black hover:bg-neon-green/80"
                data-testid="button-initialize-hours"
              >
                {initializeMutation.isPending ? "Setting up..." : "Set Up Business Hours"}
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {businessHours.map((hour) => (
                <div
                  key={hour.id}
                  className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 border rounded-lg p-4 transition-colors ${
                    hour.isOpen 
                      ? "bg-deep-black/50 border-gray-700" 
                      : "bg-red-900/20 border-red-800/50"
                  }`}
                  data-testid={`business-hour-${hour.dayOfWeek}`}
                >
                  <div className="flex items-center gap-4 min-w-[150px]">
                    <button
                      onClick={() => handleToggleOpen(hour.dayOfWeek, !hour.isOpen)}
                      className={`w-12 h-6 rounded-full transition-colors relative ${
                        hour.isOpen ? "bg-neon-green" : "bg-gray-600"
                      }`}
                      data-testid={`toggle-${hour.dayOfWeek}`}
                    >
                      <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                        hour.isOpen ? "right-1" : "left-1"
                      }`} />
                    </button>
                    <div>
                      <div className="font-semibold text-white">{hour.dayName}</div>
                      <div className={`text-xs ${hour.isOpen ? "text-green-400" : "text-red-400"}`}>
                        {hour.isOpen ? "Open" : "Closed"}
                      </div>
                    </div>
                  </div>
                  
                  {hour.isOpen && (
                    <div className="flex flex-wrap items-center gap-4">
                      <div className="flex items-center gap-2">
                        <Label className="text-gray-400 text-sm whitespace-nowrap">Opens at:</Label>
                        <Input
                          type="time"
                          value={hour.openTime}
                          onChange={(e) => handleUpdateTime(hour.dayOfWeek, 'openTime', e.target.value)}
                          className="bg-dark-gray border-gray-600 text-white w-28"
                          data-testid={`open-time-${hour.dayOfWeek}`}
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <Label className="text-gray-400 text-sm whitespace-nowrap">Last booking:</Label>
                        <Input
                          type="time"
                          value={hour.cutoffTime}
                          onChange={(e) => handleUpdateTime(hour.dayOfWeek, 'cutoffTime', e.target.value)}
                          className="bg-dark-gray border-gray-600 text-white w-28"
                          data-testid={`cutoff-time-${hour.dayOfWeek}`}
                        />
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="glass-effect border-medium-gray">
        <CardHeader>
          <CardTitle className="text-lg text-neon-green">How It Works</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-gray-300 space-y-2 text-sm">
            <p>• <strong>Open/Closed Toggle:</strong> Completely block bookings for that day (like Sunday)</p>
            <p>• <strong>Opens at:</strong> First available booking time of the day</p>
            <p>• <strong>Last booking:</strong> The cutoff time after which no bookings are allowed (e.g., 2 PM for half days)</p>
            <p className="text-yellow-400 mt-3">Example: For Saturday half-day, set "Last booking" to 14:00 (2 PM)</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function PpfLeadsTab() {
  const { toast } = useToast();
  
  const { data: leads = [], isLoading } = useQuery({
    queryKey: ["/api/ppf-leads"],
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const response = await apiRequest("PATCH", `/api/ppf-leads/${id}/status`, { status });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/ppf-leads"] });
      toast({
        title: "Status Updated",
        description: "Lead status has been updated.",
      });
    },
    onError: () => {
      toast({
        title: "Failed to Update",
        description: "Failed to update lead status.",
        variant: "destructive",
      });
    },
  });

  const deleteLeadMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest("DELETE", `/api/ppf-leads/${id}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/ppf-leads"] });
      toast({
        title: "Lead Deleted",
        description: "The lead has been removed.",
      });
    },
    onError: () => {
      toast({
        title: "Failed to Delete",
        description: "Failed to delete lead.",
        variant: "destructive",
      });
    },
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "new": return "bg-blue-900 text-blue-300";
      case "contacted": return "bg-yellow-900 text-yellow-300";
      case "converted": return "bg-green-900 text-green-300";
      case "closed": return "bg-gray-900 text-gray-300";
      default: return "bg-gray-900 text-gray-300";
    }
  };

  return (
    <div className="space-y-6">
      <Card className="glass-effect border-medium-gray">
        <CardHeader>
          <CardTitle className="text-xl text-neon-green flex items-center gap-2">
            <Users className="h-5 w-5" />
            PPF & Ceramic Coating Leads
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-gray-400">Loading leads...</div>
          ) : leads.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <AlertCircle className="h-12 w-12 mx-auto mb-3 text-gray-600" />
              <p>No leads yet.</p>
              <p className="text-sm mt-2">Leads from the PPF landing page will appear here.</p>
              <p className="text-xs mt-4 text-gray-500">
                Share this link: <span className="text-neon-green">/ppf-ceramic-coating</span>
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-gray-700">
                    <TableHead className="text-gray-300">Name</TableHead>
                    <TableHead className="text-gray-300">Contact</TableHead>
                    <TableHead className="text-gray-300">Vehicle</TableHead>
                    <TableHead className="text-gray-300">Interest</TableHead>
                    <TableHead className="text-gray-300">Source</TableHead>
                    <TableHead className="text-gray-300">Status</TableHead>
                    <TableHead className="text-gray-300">Date</TableHead>
                    <TableHead className="text-gray-300">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {leads.map((lead: any) => (
                    <TableRow key={lead.id} className="border-gray-700" data-testid={`lead-row-${lead.id}`}>
                      <TableCell className="font-medium text-white">
                        {lead.name}
                        {lead.vehicleModel && (
                          <div className="text-xs text-gray-400">{lead.vehicleModel}</div>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="text-white">{lead.phone}</div>
                        <div className="text-xs text-gray-400">{lead.email}</div>
                      </TableCell>
                      <TableCell className="text-gray-300 capitalize">{lead.vehicleType}</TableCell>
                      <TableCell className="text-gray-300 capitalize">
                        {lead.serviceInterest === "both" ? "PPF + Ceramic" : lead.serviceInterest.toUpperCase()}
                      </TableCell>
                      <TableCell>
                        <Badge className={lead.source === "exit_intent" ? "bg-purple-900 text-purple-300" : "bg-blue-900 text-blue-300"}>
                          {lead.source === "exit_intent" ? "Exit Offer" : "Landing Page"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Select
                          value={lead.status}
                          onValueChange={(value) => updateStatusMutation.mutate({ id: lead.id, status: value })}
                        >
                          <SelectTrigger className="w-32 bg-medium-gray border-gray-600">
                            <Badge className={getStatusColor(lead.status)}>
                              {lead.status.charAt(0).toUpperCase() + lead.status.slice(1)}
                            </Badge>
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="new">New</SelectItem>
                            <SelectItem value="contacted">Contacted</SelectItem>
                            <SelectItem value="converted">Converted</SelectItem>
                            <SelectItem value="closed">Closed</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell className="text-gray-400 text-sm">
                        {format(new Date(lead.createdAt), 'MMM d, yyyy')}
                        <div className="text-xs">{format(new Date(lead.createdAt), 'h:mm a')}</div>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <a href={`tel:${lead.phone}`}>
                            <Button variant="ghost" size="sm" className="text-green-400 hover:bg-green-900/20">
                              <Phone className="h-4 w-4" />
                            </Button>
                          </a>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              if (confirm("Are you sure you want to delete this lead?")) {
                                deleteLeadMutation.mutate(lead.id);
                              }
                            }}
                            className="text-red-400 hover:bg-red-900/20"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="glass-effect border-medium-gray">
        <CardHeader>
          <CardTitle className="text-lg text-neon-green">Quick Stats</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-4 gap-4">
            <div className="bg-deep-black/50 p-4 rounded-lg text-center">
              <div className="text-2xl font-bold text-blue-400">{leads.filter((l: any) => l.status === "new").length}</div>
              <div className="text-sm text-gray-400">New Leads</div>
            </div>
            <div className="bg-deep-black/50 p-4 rounded-lg text-center">
              <div className="text-2xl font-bold text-yellow-400">{leads.filter((l: any) => l.status === "contacted").length}</div>
              <div className="text-sm text-gray-400">Contacted</div>
            </div>
            <div className="bg-deep-black/50 p-4 rounded-lg text-center">
              <div className="text-2xl font-bold text-green-400">{leads.filter((l: any) => l.status === "converted").length}</div>
              <div className="text-sm text-gray-400">Converted</div>
            </div>
            <div className="bg-deep-black/50 p-4 rounded-lg text-center">
              <div className="text-2xl font-bold text-gray-400">{leads.length}</div>
              <div className="text-sm text-gray-400">Total Leads</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function AdminDashboard() {
  const [, setLocation] = useLocation();
  const { admin, isLoading: authLoading, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [statusFilter, setStatusFilter] = useState("all");
  const [showServiceForm, setShowServiceForm] = useState(false);
  const [activeTab, setActiveTab] = useState("bookings");
  const [editingService, setEditingService] = useState<any>(null);
  const [viewingBooking, setViewingBooking] = useState<any>(null);
  const [editingBooking, setEditingBooking] = useState<any>(null);
  const [editForm, setEditForm] = useState<any>({});
  const [settings, setSettings] = useState<any>({
    bookingAmount: "299",
    currency: "INR",
    paymentGateway: "razorpay",
    // Final day of the free-booking offer (YYYY-MM-DD, IST). Blank = offer off.
    freeBookingUntil: ""
  });



  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "Please log in to access the admin dashboard.",
        variant: "destructive",
      });
      setLocation("/admin/login");
    }
  }, [authLoading, isAuthenticated, setLocation, toast]);

  const { data: bookings, isLoading: bookingsLoading } = useQuery({
    queryKey: ["/api/bookings"],
    enabled: isAuthenticated,
  });

  /**
   * Current free-booking offer, so the field below shows what is actually live rather
   * than an empty box while customers are booking for free.
   */
  const { data: currentOffer } = useQuery<{ free: boolean; until: string | null }>({
    queryKey: ["/api/booking-offer"],
    enabled: isAuthenticated,
    retry: false,
  });

  useEffect(() => {
    if (currentOffer?.until) {
      setSettings((prev: any) => ({ ...prev, freeBookingUntil: currentOffer.until }));
    }
  }, [currentOffer?.until]);

  const { data: services, isLoading: servicesLoading } = useQuery({
    queryKey: ["/api/admin/services"],
    enabled: isAuthenticated,
  });

  const { data: siteSettings = [], isLoading: settingsLoading } = useQuery({
    queryKey: ["/api/settings"],
    enabled: isAuthenticated,
  });

  const { data: schedulerStatus, isLoading: schedulerLoading } = useQuery({
    queryKey: ["/api/admin/scheduler/status"],
    enabled: isAuthenticated,
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/admin/logout");
      return response.json();
    },
    onSuccess: () => {
      queryClient.clear();
      setLocation("/admin/login");
      toast({
        title: "Logged Out",
        description: "You have been successfully logged out.",
      });
    },
  });

  const sendWhatsAppMutation = useMutation({
    mutationFn: async (bookingId: string) => {
      const response = await apiRequest("POST", `/api/bookings/${bookingId}/send-whatsapp`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/bookings"] });
      toast({
        title: "WhatsApp Sent",
        description: "WhatsApp notification sent successfully!",
      });
    },
    onError: (error: any) => {
      toast({
        title: "WhatsApp Failed",
        description: error.message || "Failed to send WhatsApp notification",
        variant: "destructive",
      });
    },
  });

  const handleViewBooking = (booking: any) => {
    setViewingBooking(booking);
  };

  const handleSendWhatsApp = (booking: any) => {
    sendWhatsAppMutation.mutate(booking.id);
  };

  const handleEditBooking = (booking: any) => {
    setEditingBooking(booking);
    setEditForm({
      customerName: booking.customerName ?? "",
      customerPhone: booking.customerPhone ?? "",
      customerEmail: booking.customerEmail ?? "",
      appointmentDate: booking.appointmentDate ?? "",
      appointmentTime: booking.appointmentTime ?? "",
      bookingStatus: booking.bookingStatus ?? "confirmed",
    });
  };

  const editBookingMutation = useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: any }) => {
      // timeSlotId mirrors appointmentTime (the booking model keys capacity on the hour string)
      const body = { ...patch };
      if (patch.appointmentTime) body.timeSlotId = patch.appointmentTime;
      const res = await apiRequest("PATCH", `/api/admin/bookings/${id}`, body);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/bookings"] });
      toast({ title: "Booking updated", description: "Changes saved successfully." });
      setEditingBooking(null);
    },
    onError: (error: any) => {
      toast({ title: "Update failed", description: error?.message || "Could not update booking.", variant: "destructive" });
    },
  });

  const handleEditService = (service: any) => {
    setEditingService(service);
    setShowServiceForm(true);
  };

  const handleDeleteService = async (serviceId: string) => {
    if (confirm("Are you sure you want to delete this service?")) {
      try {
        await apiRequest("DELETE", `/api/services/${serviceId}`);
        queryClient.invalidateQueries({ queryKey: ["/api/admin/services"] });
        toast({
          title: "Service Deleted",
          description: "Service has been deleted successfully.",
        });
      } catch (error: any) {
        toast({
          title: "Delete Failed",
          description: error.message || "Failed to delete service",
          variant: "destructive",
        });
      }
    }
  };

  const deactivateServiceMutation = useMutation({
    mutationFn: async (serviceId: string) => {
      await apiRequest("PUT", `/api/services/${serviceId}`, { isActive: false });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/services"] });
      toast({ title: "Service Deactivated", description: "The service is now hidden from customers." });
    },
    onError: (error: any) => {
      toast({ title: "Failed", description: error.message || "Could not deactivate service.", variant: "destructive" });
    },
  });

  const activateServiceMutation = useMutation({
    mutationFn: async (serviceId: string) => {
      await apiRequest("PUT", `/api/services/${serviceId}`, { isActive: true });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/services"] });
      toast({ title: "Service Activated", description: "The service is now visible to customers." });
    },
    onError: (error: any) => {
      toast({ title: "Failed", description: error.message || "Could not activate service.", variant: "destructive" });
    },
  });

  const handleDuplicateService = (service: any) => {
    const duplicatedService = {
      ...service,
      id: undefined,
      title: `${service.title} (Copy)`,
      slug: undefined,
      isActive: false,
    };
    setEditingService(duplicatedService);
    setShowServiceForm(true);
  };

  const updateSettingMutation = useMutation({
    mutationFn: async ({ key, value, description, category, dataType }: any) => {
      const response = await apiRequest("PUT", `/api/settings/${key}`, {
        value,
        description,
        category,
        dataType
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/settings"] });
      toast({
        title: "Setting Updated",
        description: "Setting has been updated successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Update Failed",
        description: error.message || "Failed to update setting",
        variant: "destructive",
      });
    },
  });

  const testRemindersMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/admin/scheduler/test-reminders");
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Reminder Test Complete",
        description: data.message,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Reminder Test Failed",
        description: error.message || "Failed to run reminder test",
        variant: "destructive",
      });
    },
  });

  const markPaidMutation = useMutation({
    mutationFn: async (bookingId: string) => {
      const response = await apiRequest("POST", `/api/admin/bookings/${bookingId}/mark-paid`, {
        paymentId: `manual_${Date.now()}`
      });
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/bookings"] });
      toast({
        title: "Payment Updated",
        description: data.message,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Update Failed",
        description: error.message || "Failed to mark payment as paid",
        variant: "destructive",
      });
    },
  });

  /**
   * Start or end the free-booking offer.
   *
   * The value is a plain YYYY-MM-DD date. The SERVER decides whether that window is still
   * open in IST and therefore whether anything is charged — this field only records the
   * intent. Clearing it ends the offer immediately, and the server fails closed on any
   * value it cannot parse, so a typo here restores the ₹299 fee rather than giving the
   * catalogue away.
   */
  const handleUpdateFreeBooking = (until: string) => {
    updateSettingMutation.mutate({
      key: "free_booking_until",
      value: until,
      description: "Final day (YYYY-MM-DD, IST) of the free-booking offer. Blank = no offer.",
      category: "booking",
      dataType: "string"
    });
  };

  const handleUpdateBookingAmount = (amount: string) => {
    updateSettingMutation.mutate({
      key: "booking_amount",
      value: amount,
      description: "Default booking fee amount charged to customers",
      category: "booking",
      dataType: "number"
    });
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-deep-black flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  const filteredBookings = Array.isArray(bookings) ? bookings.filter((booking: any) => 
    statusFilter === "all" || booking.paymentStatus === statusFilter
  ) : [];

  // Status model:
  //   payment_status: pending | paid | refunded | failed   (money state)
  //   booking_status: pending | confirmed | completed | cancelled   (service state)
  // "Paid" must count payment_status === 'paid' only. "Completed" is a service state and
  // must NOT be added into the paid count (that double-counted / mislabelled before).
  const list = Array.isArray(bookings) ? bookings : [];
  const stats = {
    totalBookings: list.length,
    pendingBookings: list.filter((b: any) => b.paymentStatus === "pending").length,
    paidBookings: list.filter((b: any) => b.paymentStatus === "paid").length,
    completedServices: list.filter((b: any) => b.bookingStatus === "completed").length,
    // Revenue = genuine paid money only.
    totalRevenue: list.filter((b: any) => b.paymentStatus === "paid")
      .reduce((sum: number, b: any) => sum + parseFloat(b.amount || "0"), 0),
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "paid":
        return <Badge className="bg-green-900 text-green-300 font-semibold">✓ Paid</Badge>;
      case "pending":
        return <Badge className="bg-yellow-900 text-yellow-300 font-semibold">⏳ Pending</Badge>;
      // Booked during the free-booking offer. Deliberately its own status: it is not
      // "paid" (no money arrived, and revenue must not include it) and not "pending"
      // (nothing is owed online, so it must not sit in the chase-the-payment queue).
      case "free":
        return <Badge className="bg-emerald-900 text-emerald-300 font-semibold">🎁 Free</Badge>;
      case "failed":
        return <Badge className="bg-red-900 text-red-300 font-semibold">✗ Failed</Badge>;
      default:
        return <Badge variant="secondary" className="font-semibold">{status}</Badge>;
    }
  };

  const getBookingStatusBadge = (status: string) => {
    switch (status) {
      case "confirmed":
        return <Badge className="bg-blue-900 text-blue-300 font-semibold">📋 Confirmed</Badge>;
      case "completed":
        return <Badge className="bg-green-900 text-green-300 font-semibold">🏁 Completed</Badge>;
      case "cancelled":
        return <Badge className="bg-gray-900 text-gray-300 font-semibold">⊘ Cancelled</Badge>;
      case "in-progress":
        return <Badge className="bg-purple-900 text-purple-300 font-semibold">🔧 In Progress</Badge>;
      default:
        return <Badge variant="secondary" className="font-semibold">{status}</Badge>;
    }
  };

  return (
    <div className="min-h-screen bg-deep-black text-white">
      {/* Header */}
      <div className="glass-effect border-b border-medium-gray">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <img 
                src="/Car Care (4)_1753951564515.png" 
                alt="P91 Car Care" 
                className="h-8 w-auto"
                data-testid="img-logo-admin"
              />
              <h1 className="text-2xl font-semibold gradient-text" data-testid="text-dashboard-title">
                P91 Admin Panel
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <Button
                onClick={() => setLocation("/admin/whatsapp")}
                variant="outline"
                className="border-gray-600 text-gray-300 hover:bg-gray-800"
                data-testid="button-whatsapp-config"
              >
                <MessageCircle className="mr-2 h-4 w-4" />
                WhatsApp
              </Button>
              <Button
                onClick={() => setShowServiceForm(true)}
                className="bg-neon-green text-deep-black hover:bg-neon-green/90"
                data-testid="button-new-service"
              >
                <Plus className="mr-2 h-4 w-4" />
                New Service
              </Button>
              <div className="flex items-center space-x-2 text-gray-400">
                <div className="w-8 h-8 bg-neon-green rounded-full flex items-center justify-center">
                  <span className="text-deep-black font-semibold text-sm">{admin?.name?.[0] || 'A'}</span>
                </div>
                <span data-testid="text-admin-name">{admin?.name || 'Admin'}</span>
              </div>
              <Button
                variant="ghost"
                onClick={() => logoutMutation.mutate()}
                disabled={logoutMutation.isPending}
                className="text-gray-400 hover:text-white"
                data-testid="button-logout"
              >
                Logout
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Navigation Tabs */}
        <div className="mb-8">
          <div className="flex space-x-1 bg-medium-gray/50 p-1 rounded-lg w-fit">
            <Button
              variant={activeTab === "bookings" ? "default" : "ghost"}
              onClick={() => setActiveTab("bookings")}
              className={activeTab === "bookings" ? "bg-neon-green text-deep-black" : "text-gray-400 hover:text-white"}
              data-testid="tab-bookings"
            >
              Bookings
            </Button>
            <Button
              variant={activeTab === "services" ? "default" : "ghost"}
              onClick={() => setActiveTab("services")}
              className={activeTab === "services" ? "bg-neon-green text-deep-black" : "text-gray-400 hover:text-white"}
              data-testid="tab-services"
            >
              Services
            </Button>
            <Button
              variant={activeTab === "settings" ? "default" : "ghost"}
              onClick={() => setActiveTab("settings")}
              className={activeTab === "settings" ? "bg-neon-green text-deep-black" : "text-gray-400 hover:text-white"}
              data-testid="tab-settings"
            >
              Settings
            </Button>
            <Button
              variant={activeTab === "scheduler" ? "default" : "ghost"}
              onClick={() => setActiveTab("scheduler")}
              className={activeTab === "scheduler" ? "bg-neon-green text-deep-black" : "text-gray-400 hover:text-white"}
              data-testid="tab-scheduler"
            >
              <Clock className="mr-2 h-4 w-4" />
              Scheduler
            </Button>
            <Button
              variant={activeTab === "blackout" ? "default" : "ghost"}
              onClick={() => setActiveTab("blackout")}
              className={activeTab === "blackout" ? "bg-neon-green text-deep-black" : "text-gray-400 hover:text-white"}
              data-testid="tab-blackout"
            >
              Blackout Dates
            </Button>
            <Button
              variant={activeTab === "business-hours" ? "default" : "ghost"}
              onClick={() => setActiveTab("business-hours")}
              className={activeTab === "business-hours" ? "bg-neon-green text-deep-black" : "text-gray-400 hover:text-white"}
              data-testid="tab-business-hours"
            >
              <Clock className="mr-2 h-4 w-4" />
              Business Hours
            </Button>
            <Button
              variant={activeTab === "ppf-leads" ? "default" : "ghost"}
              onClick={() => setActiveTab("ppf-leads")}
              className={activeTab === "ppf-leads" ? "bg-neon-green text-deep-black" : "text-gray-400 hover:text-white"}
              data-testid="tab-ppf-leads"
            >
              PPF Leads
            </Button>
          </div>
        </div>

        {activeTab === "bookings" && (
          <>
            {/* Stats Cards */}
            <div className="grid md:grid-cols-4 gap-6 mb-8">
          <Card className="glass-effect border-medium-gray">
            <CardContent className="p-6 text-center">
              <Users className="h-8 w-8 mx-auto mb-2 text-neon-green" />
              <div className="text-3xl font-bold text-neon-green mb-2" data-testid="stat-total-bookings">
                {stats.totalBookings}
              </div>
              <div className="text-gray-400">Total Bookings</div>
            </CardContent>
          </Card>

          <Card className="glass-effect border-medium-gray">
            <CardContent className="p-6 text-center">
              <Clock className="h-8 w-8 mx-auto mb-2 text-yellow-400" />
              <div className="text-3xl font-bold text-yellow-400 mb-2" data-testid="stat-pending-bookings">
                {stats.pendingBookings}
              </div>
              <div className="text-gray-400">Pending</div>
            </CardContent>
          </Card>

          <Card className="glass-effect border-medium-gray">
            <CardContent className="p-6 text-center">
              <CheckCircle className="h-8 w-8 mx-auto mb-2 text-green-400" />
              <div className="text-3xl font-bold text-green-400 mb-2" data-testid="stat-paid-bookings">
                {stats.paidBookings}
              </div>
              <div className="text-gray-400">Paid</div>
            </CardContent>
          </Card>

          <Card className="glass-effect border-medium-gray">
            <CardContent className="p-6 text-center">
              <DollarSign className="h-8 w-8 mx-auto mb-2 text-blue-400" />
              <div className="text-3xl font-bold text-blue-400 mb-2" data-testid="stat-revenue">
                ₹{stats.totalRevenue.toLocaleString()}
              </div>
              <div className="text-gray-400">Revenue</div>
            </CardContent>
          </Card>
        </div>

            {/* Bookings Table */}
            <Card className="glass-effect border-medium-gray">
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle className="text-xl text-neon-green">Recent Bookings</CardTitle>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-56 bg-medium-gray border-gray-600 text-white" data-testid="select-status-filter">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent className="bg-medium-gray border-gray-600">
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">⏳ Payment Pending</SelectItem>
                  <SelectItem value="paid">✓ Paid</SelectItem>
                  <SelectItem value="free">🎁 Free Booking</SelectItem>
                  <SelectItem value="completed">🏁 Service Completed</SelectItem>
                  <SelectItem value="failed">✗ Payment Failed</SelectItem>
                  <SelectItem value="cancelled">⊘ Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            {bookingsLoading ? (
              <div className="text-center py-8">Loading bookings...</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="border-gray-700">
                    <TableHead className="text-gray-400">Customer</TableHead>
                    <TableHead className="text-gray-400">Service</TableHead>
                    <TableHead className="text-gray-400">Appointment Date</TableHead>
                    <TableHead className="text-gray-400">Booked Date</TableHead>
                    <TableHead className="text-gray-400">Amount</TableHead>
                    <TableHead className="text-gray-400">Payment Status</TableHead>
                    <TableHead className="text-gray-400">Service Status</TableHead>
                    <TableHead className="text-gray-400">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredBookings.map((booking: any) => (
                    <TableRow key={booking.id} className="border-gray-700 hover:bg-medium-gray/50" data-testid={`row-booking-${booking.id}`}>
                      <TableCell>
                        <div>
                          <div className="font-medium text-white" data-testid={`text-customer-name-${booking.id}`}>
                            {booking.customerName}
                          </div>
                          <div className="text-sm text-gray-400" data-testid={`text-customer-phone-${booking.id}`}>
                            {booking.customerPhone}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-gray-300" data-testid={`text-service-name-${booking.id}`}>
                        {booking.service?.title}
                      </TableCell>
                      <TableCell className="text-gray-300">
                        <div data-testid={`text-booking-date-${booking.id}`}>
                          {booking.appointmentDate ? 
                            new Date(booking.appointmentDate).toLocaleDateString('en-IN', { 
                              day: '2-digit', 
                              month: 'short', 
                              year: 'numeric' 
                            }) : 
                            booking.timeSlotId && booking.timeSlotId.includes(':') ? 
                            `Today at ${booking.timeSlotId}` : 
                            booking.timeSlotId && booking.timeSlotId.length > 10 ?
                            'Legacy booking' :
                            'To be scheduled'
                          }
                        </div>
                        <div className="text-sm text-gray-400" data-testid={`text-booking-time-${booking.id}`}>
                          {booking.appointmentTime ? 
                            `${booking.appointmentTime}:00 - ${(parseInt(booking.appointmentTime) + 1).toString().padStart(2, '0')}:00` :
                            booking.timeSlotId && booking.timeSlotId.includes(':') ? 'Time slot confirmed' : 'Appointment pending'
                          }
                        </div>
                      </TableCell>
                      <TableCell className="text-gray-300">
                        <div data-testid={`text-booking-created-${booking.id}`}>
                          {new Date(booking.createdAt).toLocaleDateString()}
                        </div>
                        <div className="text-sm text-gray-400" data-testid={`text-booking-created-time-${booking.id}`}>
                          {new Date(booking.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </TableCell>
                      <TableCell data-testid={`text-booking-amount-${booking.id}`}>
                        <div className="font-semibold text-neon-green">₹{booking.amount}</div>
                        <div className="text-xs text-gray-500">
                          {booking.paymentId ? `ID: ${booking.paymentId.slice(-6)}` : "No Payment ID"}
                        </div>
                      </TableCell>
                      <TableCell data-testid={`payment-status-${booking.id}`}>
                        {getStatusBadge(booking.paymentStatus)}
                      </TableCell>
                      <TableCell data-testid={`booking-status-${booking.id}`}>
                        {getBookingStatusBadge(booking.bookingStatus)}
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button 
                            size="sm" 
                            variant="ghost" 
                            className="text-blue-400 hover:text-blue-300" 
                            data-testid={`button-view-${booking.id}`}
                            onClick={() => handleViewBooking(booking)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button 
                            size="sm" 
                            variant="ghost" 
                            className="text-neon-green hover:text-green-300" 
                            data-testid={`button-whatsapp-${booking.id}`}
                            onClick={() => handleSendWhatsApp(booking)}
                          >
                            <MessageCircle className="h-4 w-4" />
                          </Button>
                          {booking.paymentStatus === "pending" && (
                            <Button 
                              size="sm" 
                              variant="ghost" 
                              className="text-green-400 hover:text-green-300" 
                              data-testid={`button-mark-paid-${booking.id}`}
                              onClick={() => markPaidMutation.mutate(booking.id)}
                              disabled={markPaidMutation.isPending}
                            >
                              <CheckCircle className="h-4 w-4" />
                            </Button>
                          )}
                          <Button 
                            size="sm" 
                            variant="ghost" 
                            className="text-yellow-400 hover:text-yellow-300" 
                            data-testid={`button-edit-${booking.id}`}
                            onClick={() => handleEditBooking(booking)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
          </>
        )}

        {activeTab === "services" && (
          <Card className="glass-effect border-medium-gray">
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle className="text-xl text-neon-green">Manage Services</CardTitle>
                <Button
                  onClick={() => {
                    setEditingService(null);
                    setShowServiceForm(true);
                  }}
                  className="bg-neon-green text-deep-black hover:bg-neon-green/90"
                  data-testid="button-add-service"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add Service
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {servicesLoading ? (
                <div className="text-center py-8">Loading services...</div>
              ) : (
                <div className="grid gap-4">
                  {Array.isArray(services) && services.map((service: any) => (
                    <div key={service.id} className="border border-gray-700 rounded-lg p-4 hover:bg-medium-gray/20" data-testid={`service-card-${service.id}`}>
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-4 mb-3">
                            {service.imageUrl && (
                              <img 
                                src={service.imageUrl} 
                                alt={service.title}
                                className="w-16 h-16 object-cover rounded-lg"
                                data-testid={`img-service-${service.id}`}
                              />
                            )}
                            <div>
                              <h3 className="text-lg font-semibold text-white" data-testid={`text-service-title-${service.id}`}>
                                {service.title}
                              </h3>
                              <p className="text-gray-400 text-sm" data-testid={`text-service-slug-${service.id}`}>
                                /{service.slug}
                              </p>
                            </div>
                          </div>
                          <p className="text-gray-300 mb-3 line-clamp-2" data-testid={`text-service-description-${service.id}`}>
                            {service.description}
                          </p>
                          <div className="flex items-center gap-4 text-sm">
                            <span className="text-neon-green font-semibold" data-testid={`text-service-price-${service.id}`}>
                              ₹{service.price}
                            </span>
                            <span className={`px-2 py-1 rounded text-xs ${service.isActive ? 'bg-green-900 text-green-300' : 'bg-red-900 text-red-300'}`} data-testid={`badge-service-status-${service.id}`}>
                              {service.isActive ? 'Active' : 'Inactive'}
                            </span>
                          </div>
                        </div>
                        <div className="flex space-x-2 ml-4">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDuplicateService(service)}
                            className="text-green-400 hover:text-green-300"
                            title="Duplicate Service"
                            data-testid={`button-duplicate-service-${service.id}`}
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleEditService(service)}
                            className="text-blue-400 hover:text-blue-300"
                            data-testid={`button-edit-service-${service.id}`}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          {service.isActive ? (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                if (confirm(`Deactivate "${service.title}"? It will be hidden from customers.`)) {
                                  deactivateServiceMutation.mutate(service.id);
                                }
                              }}
                              className="text-orange-400 hover:text-orange-300"
                              title="Deactivate Service"
                              data-testid={`button-deactivate-service-${service.id}`}
                              disabled={deactivateServiceMutation.isPending}
                            >
                              <span className="text-xs font-medium">Deactivate</span>
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => activateServiceMutation.mutate(service.id)}
                              className="text-green-400 hover:text-green-300"
                              title="Activate Service"
                              data-testid={`button-activate-service-${service.id}`}
                              disabled={activateServiceMutation.isPending}
                            >
                              <span className="text-xs font-medium">Activate</span>
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDeleteService(service.id)}
                            className="text-red-400 hover:text-red-300"
                            data-testid={`button-delete-service-${service.id}`}
                          >
                            ✕
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                  {(!Array.isArray(services) || services.length === 0) && (
                    <div className="text-center py-8 text-gray-400">
                      No services found. Click "Add Service" to create your first service.
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {activeTab === "settings" && (
          <div className="space-y-6">
            <Card className="glass-effect border-medium-gray">
              <CardHeader>
                <CardTitle className="text-xl text-neon-green">Booking Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="md:col-span-2 p-4 rounded-lg border border-neon-green/40 bg-green-900/10">
                    <Label className="text-white text-lg font-semibold mb-1 block">
                      🎁 Free Booking Offer
                    </Label>
                    <p className="text-gray-400 text-sm mb-3">
                      While this date is in the future, <strong className="text-white">nothing is charged
                      online for any service</strong> — including the Annual Maintenance Package.
                      Customers book with just their name, number, email and a slot. Leave it blank
                      (or set a past date) to end the offer and go back to the ₹{settings.bookingAmount} fee.
                    </p>
                    <div className="flex flex-wrap gap-3">
                      <Input
                        type="date"
                        value={settings.freeBookingUntil}
                        onChange={(e: any) => setSettings((prev: any) => ({ ...prev, freeBookingUntil: e.target.value }))}
                        className="bg-dark-gray border-gray-600 text-white text-lg font-semibold max-w-[220px]"
                        data-testid="input-free-booking-until"
                      />
                      <Button
                        onClick={() => handleUpdateFreeBooking(settings.freeBookingUntil)}
                        disabled={updateSettingMutation.isPending}
                        className="bg-neon-green text-deep-black hover:bg-neon-green/90"
                        data-testid="button-update-free-booking"
                      >
                        {updateSettingMutation.isPending ? "Saving..." : "Save offer"}
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => {
                          setSettings((prev: any) => ({ ...prev, freeBookingUntil: "" }));
                          handleUpdateFreeBooking("");
                        }}
                        disabled={updateSettingMutation.isPending}
                        className="border-gray-600 text-gray-300 hover:text-white"
                        data-testid="button-end-free-booking"
                      >
                        End offer now
                      </Button>
                    </div>
                    <p className="text-xs text-gray-500 mt-3">
                      Free bookings appear below with a <strong>Free</strong> payment status. They are
                      deliberately not counted as revenue, and the service itself is still collected
                      at the studio.
                    </p>
                  </div>

                  <div>
                    <Label className="text-white text-lg font-semibold mb-3 block">Booking Amount (₹)</Label>
                    <p className="text-gray-400 text-sm mb-4">
                      This is the booking fee amount charged to customers. The remaining amount will be collected during service.
                    </p>
                    <div className="flex gap-3">
                      <Input
                        type="number"
                        value={settings.bookingAmount}
                        onChange={(e: any) => setSettings((prev: any) => ({ ...prev, bookingAmount: e.target.value }))}
                        className="bg-dark-gray border-gray-600 text-white text-lg font-semibold"
                        placeholder="299"
                        data-testid="input-booking-amount"
                      />
                      <Button
                        onClick={() => handleUpdateBookingAmount(settings.bookingAmount)}
                        disabled={updateSettingMutation.isPending}
                        className="bg-neon-green text-deep-black hover:bg-neon-green/90"
                        data-testid="button-update-booking-amount"
                      >
                        {updateSettingMutation.isPending ? "Updating..." : "Update"}
                      </Button>
                    </div>
                    <div className="mt-4 p-4 bg-yellow-900/20 border border-yellow-600/50 rounded-lg">
                      <div className="flex items-center gap-2 text-yellow-400 font-semibold mb-2">
                        <span>⚠️</span>
                        Important Note
                      </div>
                      <p className="text-yellow-300 text-sm">
                        Changing the booking amount will affect all new bookings. Existing bookings will retain their original amount.
                      </p>
                    </div>
                  </div>
                  <div>
                    <Label className="text-white text-lg font-semibold mb-3 block">Current Configuration</Label>
                    <div className="space-y-3">
                      <div className="p-4 bg-medium-gray rounded-lg">
                        <div className="text-sm text-gray-400">Current Booking Fee</div>
                        <div className="text-2xl font-bold text-neon-green">₹{settings.bookingAmount}</div>
                      </div>
                      <div className="p-4 bg-medium-gray rounded-lg">
                        <div className="text-sm text-gray-400">Payment Gateway</div>
                        <div className="text-lg font-semibold text-white">Razorpay</div>
                      </div>
                      <div className="p-4 bg-medium-gray rounded-lg">
                        <div className="text-sm text-gray-400">Currency</div>
                        <div className="text-lg font-semibold text-white">Indian Rupees (₹)</div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="glass-effect border-medium-gray">
              <CardHeader>
                <CardTitle className="text-xl text-neon-green">Site Settings</CardTitle>
              </CardHeader>
              <CardContent>
                {settingsLoading ? (
                  <div className="text-center py-8">Loading settings...</div>
                ) : (
                  <div className="space-y-4">
                    {Array.isArray(siteSettings) && siteSettings.map((setting: any) => (
                      <div key={setting.key} className="border border-gray-700 rounded-lg p-4" data-testid={`setting-${setting.key}`}>
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <h3 className="font-semibold text-white mb-1">{setting.key.replace(/_/g, ' ').toUpperCase()}</h3>
                            <p className="text-gray-400 text-sm mb-2">{setting.description}</p>
                            <div className="text-neon-green font-mono">{setting.value}</div>
                          </div>
                          <div className="flex items-center gap-2 ml-4">
                            <Badge className={`${setting.category === 'booking' ? 'bg-blue-900 text-blue-300' : 'bg-gray-700 text-gray-300'}`}>
                              {setting.category}
                            </Badge>
                            <Badge variant="outline" className="border-gray-600 text-gray-400">
                              {setting.dataType}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    ))}
                    {(!Array.isArray(siteSettings) || siteSettings.length === 0) && (
                      <div className="text-center py-8 text-gray-400">
                        No custom settings configured. Settings will appear here as you configure them.
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === "scheduler" && (
          <div className="space-y-6">
            <Card className="glass-effect border-medium-gray">
              <CardHeader>
                <CardTitle className="text-xl text-neon-green flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Reminder Scheduler
                </CardTitle>
              </CardHeader>
              <CardContent>
                {schedulerLoading ? (
                  <div className="text-center py-8">Loading scheduler status...</div>
                ) : (
                  <div className="space-y-6">
                    {/* Scheduler Status */}
                    <div className="bg-deep-black/50 border border-gray-700 rounded-lg p-6">
                      <h3 className="text-lg font-semibold text-white mb-4">📅 Automatic Reminder Status</h3>
                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <Label className="text-gray-300">Scheduler Status</Label>
                          <div className="mt-1">
                            <Badge className={schedulerStatus?.reminderJobActive ? "bg-green-900 text-green-300" : "bg-red-900 text-red-300"}>
                              {schedulerStatus?.reminderJobActive ? "🟢 Active" : "🔴 Inactive"}
                            </Badge>
                          </div>
                        </div>
                        <div>
                          <Label className="text-gray-300">Next Reminder Time</Label>
                          <div className="mt-1 text-neon-green font-mono">
                            {schedulerStatus?.nextReminderTime || "Not scheduled"}
                          </div>
                        </div>
                        <div>
                          <Label className="text-gray-300">Timezone</Label>
                          <div className="mt-1 text-gray-400">
                            {schedulerStatus?.timezone || "Asia/Kolkata (IST)"}
                          </div>
                        </div>
                        <div>
                          <Label className="text-gray-300">Reminder Schedule</Label>
                          <div className="mt-1 text-gray-400">
                            Daily at 8:00 PM IST for next day appointments
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Test Reminders */}
                    <div className="bg-deep-black/50 border border-gray-700 rounded-lg p-6">
                      <h3 className="text-lg font-semibold text-white mb-4">🧪 Test Reminder System</h3>
                      <p className="text-gray-400 mb-4">
                        Test the reminder system manually. This will check for appointments tomorrow and send WhatsApp reminders to customers.
                      </p>
                      <Button
                        onClick={() => testRemindersMutation.mutate()}
                        disabled={testRemindersMutation.isPending}
                        className="bg-blue-600 hover:bg-blue-700 text-white"
                        data-testid="button-test-reminders"
                      >
                        <Play className="mr-2 h-4 w-4" />
                        {testRemindersMutation.isPending ? "Testing..." : "Test Reminders Now"}
                      </Button>
                    </div>

                    {/* How It Works */}
                    <div className="bg-deep-black/50 border border-gray-700 rounded-lg p-6">
                      <h3 className="text-lg font-semibold text-white mb-4">ℹ️ How Automatic Reminders Work</h3>
                      <div className="space-y-3 text-gray-300">
                        <div className="flex items-start gap-3">
                          <div className="w-2 h-2 bg-neon-green rounded-full mt-2 flex-shrink-0"></div>
                          <div>
                            <strong>Daily Schedule:</strong> System runs every day at 8:00 PM IST
                          </div>
                        </div>
                        <div className="flex items-start gap-3">
                          <div className="w-2 h-2 bg-neon-green rounded-full mt-2 flex-shrink-0"></div>
                          <div>
                            <strong>Target Customers:</strong> Finds customers with confirmed appointments tomorrow
                          </div>
                        </div>
                        <div className="flex items-start gap-3">
                          <div className="w-2 h-2 bg-neon-green rounded-full mt-2 flex-shrink-0"></div>
                          <div>
                            <strong>WhatsApp Reminder:</strong> Sends approved p91_booking_reminder template message
                          </div>
                        </div>
                        <div className="flex items-start gap-3">
                          <div className="w-2 h-2 bg-neon-green rounded-full mt-2 flex-shrink-0"></div>
                          <div>
                            <strong>Template Content:</strong> Customer name, service details, appointment time
                          </div>
                        </div>
                        <div className="flex items-start gap-3">
                          <div className="w-2 h-2 bg-neon-green rounded-full mt-2 flex-shrink-0"></div>
                          <div>
                            <strong>Rate Limiting:</strong> 1-second delay between messages to avoid spam
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Recent Activity */}
                    <div className="bg-deep-black/50 border border-gray-700 rounded-lg p-6">
                      <h3 className="text-lg font-semibold text-white mb-4">📊 Today's Reminders Summary</h3>
                      <p className="text-gray-400">
                        Reminder activity logs will appear here after the scheduler runs. Check the server console for detailed logs.
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === "blackout" && (
          <BlackoutDatesTab />
        )}

        {activeTab === "business-hours" && (
          <BusinessHoursTab />
        )}

        {activeTab === "ppf-leads" && (
          <PpfLeadsTab />
        )}
      </div>

      <AdminServiceForm
        isOpen={showServiceForm}
        onClose={() => {
          setShowServiceForm(false);
          setEditingService(null);
        }}
        editingService={editingService}
      />

      {/* Booking detail (View) */}
      <Dialog open={!!viewingBooking} onOpenChange={(o) => !o && setViewingBooking(null)}>
        <DialogContent className="max-w-lg bg-dark-gray border-medium-gray text-white max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Booking details</DialogTitle></DialogHeader>
          {viewingBooking && (() => {
            const b = viewingBooking;
            const rows: Array<[string, any]> = [
              ["Booking ID", b.id],
              ["Customer", b.customerName],
              ["Phone", b.customerPhone],
              ["Email", b.customerEmail],
              ["Service", b.service?.title || "—"],
              ["Appointment", b.appointmentDate ? `${b.appointmentDate} ${b.appointmentTime || ""}` : "To be scheduled"],
              ["Amount", `₹${b.amount}`],
              ["Payment status", b.paymentStatus],
              ["Booking status", b.bookingStatus],
              ["Razorpay order", b.razorpayOrderId || "—"],
              ["Razorpay payment", b.paymentId || "—"],
              ["WhatsApp msg id", b.customerWhatsappMessageId || "—"],
              ["ERP sync status", b.erpSyncStatus || "—"],
              ["ERP appointment", b.erpDocumentId || "—"],
              ["ERP attempts", b.erpSyncAttempts ?? 0],
              ["ERP last error", b.erpSyncError || "—"],
              ["ERP synced at", b.erpSyncedAt ? new Date(b.erpSyncedAt).toLocaleString() : "—"],
              ["Created", b.createdAt ? new Date(b.createdAt).toLocaleString() : "—"],
              ["Updated", b.updatedAt ? new Date(b.updatedAt).toLocaleString() : "—"],
            ];
            return (
              <div className="space-y-1 text-sm">
                {rows.map(([k, v]) => (
                  <div key={k} className="flex justify-between gap-4 py-1 border-b border-gray-800">
                    <span className="text-gray-400">{k}</span>
                    <span className="text-right break-all">{String(v)}</span>
                  </div>
                ))}
              </div>
            );
          })()}
        </DialogContent>
      </Dialog>

      {/* Edit booking */}
      <Dialog open={!!editingBooking} onOpenChange={(o) => !o && setEditingBooking(null)}>
        <DialogContent className="max-w-lg bg-dark-gray border-medium-gray text-white">
          <DialogHeader><DialogTitle>Edit booking</DialogTitle></DialogHeader>
          {editingBooking && (
            <div className="space-y-3">
              <p className="text-xs text-gray-400">
                Payment, amount and ERP fields cannot be changed here. Editing the date or time
                is re-checked against holidays, business hours and capacity.
              </p>
              {[
                ["Customer name", "customerName", "text"],
                ["Phone", "customerPhone", "text"],
                ["Email", "customerEmail", "email"],
                ["Appointment date", "appointmentDate", "date"],
                ["Appointment time (HH:MM)", "appointmentTime", "text"],
              ].map(([label, key, type]) => (
                <div key={key}>
                  <Label className="text-gray-300">{label}</Label>
                  <Input
                    type={type as string}
                    value={editForm[key as string] ?? ""}
                    onChange={(e) => setEditForm({ ...editForm, [key as string]: e.target.value })}
                    className="bg-medium-gray border-gray-600 text-white"
                  />
                </div>
              ))}
              <div>
                <Label className="text-gray-300">Booking status</Label>
                <Select value={editForm.bookingStatus} onValueChange={(v) => setEditForm({ ...editForm, bookingStatus: v })}>
                  <SelectTrigger className="bg-medium-gray border-gray-600 text-white"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="confirmed">Confirmed</SelectItem>
                    <SelectItem value="completed">Completed (service done)</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="ghost" onClick={() => setEditingBooking(null)}>Cancel</Button>
            <Button
              onClick={() => editBookingMutation.mutate({ id: editingBooking.id, patch: editForm })}
              disabled={editBookingMutation.isPending}
              className="bg-neon-green text-black hover:bg-green-400"
            >
              {editBookingMutation.isPending ? "Saving…" : "Save changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
