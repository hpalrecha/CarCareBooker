import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import AdminServiceForm from "@/components/admin-service-form";
import { Plus, Eye, MessageCircle, Edit, Users, Clock, CheckCircle, DollarSign, Settings, Phone } from "lucide-react";

export default function AdminDashboard() {
  const [, setLocation] = useLocation();
  const { admin, isLoading: authLoading, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [statusFilter, setStatusFilter] = useState("all");
  const [showServiceForm, setShowServiceForm] = useState(false);
  const [activeTab, setActiveTab] = useState("bookings");
  const [editingService, setEditingService] = useState<any>(null);
  const [settings, setSettings] = useState<any>({
    bookingAmount: "299",
    currency: "INR",
    paymentGateway: "razorpay"
  });

  // Update settings state when data is loaded
  useEffect(() => {
    if (siteSettings && siteSettings.length > 0) {
      const bookingAmountSetting = siteSettings.find((s: any) => s.key === "booking_amount");
      if (bookingAmountSetting) {
        setSettings(prev => ({ ...prev, bookingAmount: bookingAmountSetting.value }));
      }
    }
  }, [siteSettings]);

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

  const { data: services, isLoading: servicesLoading } = useQuery({
    queryKey: ["/api/services"],
    enabled: isAuthenticated,
  });

  const { data: siteSettings = [], isLoading: settingsLoading } = useQuery({
    queryKey: ["/api/settings"],
    enabled: isAuthenticated,
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
    toast({
      title: "Booking Details",
      description: `Customer: ${booking.customerName}\nPhone: ${booking.customerPhone}\nEmail: ${booking.customerEmail}\nService: ${booking.service?.title}\nAmount: ₹${booking.amount}`,
    });
  };

  const handleSendWhatsApp = (booking: any) => {
    sendWhatsAppMutation.mutate(booking.id);
  };

  const handleEditBooking = (booking: any) => {
    toast({
      title: "Edit Booking",
      description: "Booking edit functionality coming soon!",
    });
  };

  const handleEditService = (service: any) => {
    setEditingService(service);
    setShowServiceForm(true);
  };

  const handleDeleteService = async (serviceId: string) => {
    if (confirm("Are you sure you want to delete this service?")) {
      try {
        await apiRequest("DELETE", `/api/services/${serviceId}`);
        queryClient.invalidateQueries({ queryKey: ["/api/services"] });
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

  const stats = {
    totalBookings: Array.isArray(bookings) ? bookings.length : 0,
    pendingBookings: Array.isArray(bookings) ? bookings.filter((b: any) => b.paymentStatus === "pending").length : 0,
    paidBookings: Array.isArray(bookings) ? bookings.filter((b: any) => b.paymentStatus === "paid").length : 0,
    completedBookings: Array.isArray(bookings) ? bookings.filter((b: any) => b.paymentStatus === "completed").length : 0,
    totalRevenue: Array.isArray(bookings) ? bookings.filter((b: any) => b.paymentStatus === "paid" || b.paymentStatus === "completed")
      .reduce((sum: number, b: any) => sum + parseFloat(b.amount), 0) : 0,
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "paid":
        return <Badge className="bg-green-900 text-green-300 font-semibold">✓ Paid</Badge>;
      case "pending":
        return <Badge className="bg-yellow-900 text-yellow-300 font-semibold">⏳ Pending</Badge>;
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
                  <span className="text-deep-black font-semibold text-sm">{admin?.name?.[0]}</span>
                </div>
                <span data-testid="text-admin-name">{admin?.name}</span>
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
                {stats.paidBookings + stats.completedBookings}
              </div>
              <div className="text-gray-400">Paid/Completed</div>
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
                  {services?.map((service: any) => (
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
                            onClick={() => handleEditService(service)}
                            className="text-blue-400 hover:text-blue-300"
                            data-testid={`button-edit-service-${service.id}`}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
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
                  {(!services || services.length === 0) && (
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
                  <div>
                    <Label className="text-white text-lg font-semibold mb-3 block">Booking Amount (₹)</Label>
                    <p className="text-gray-400 text-sm mb-4">
                      This is the booking fee amount charged to customers. The remaining amount will be collected during service.
                    </p>
                    <div className="flex gap-3">
                      <Input
                        type="number"
                        value={settings.bookingAmount}
                        onChange={(e) => setSettings(prev => ({ ...prev, bookingAmount: e.target.value }))}
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
                    {siteSettings?.map((setting: any) => (
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
                    {(!siteSettings || siteSettings.length === 0) && (
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
      </div>

      <AdminServiceForm 
        isOpen={showServiceForm} 
        onClose={() => {
          setShowServiceForm(false);
          setEditingService(null);
        }}
        editingService={editingService}
      />
    </div>
  );
}
