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
import { Plus, Eye, MessageCircle, Edit, Users, Clock, CheckCircle, DollarSign } from "lucide-react";

export default function AdminDashboard() {
  const [, setLocation] = useLocation();
  const { admin, isLoading: authLoading, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [statusFilter, setStatusFilter] = useState("all");
  const [showServiceForm, setShowServiceForm] = useState(false);

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

  const filteredBookings = bookings?.filter((booking: any) => 
    statusFilter === "all" || booking.paymentStatus === statusFilter
  ) || [];

  const stats = {
    totalBookings: bookings?.length || 0,
    pendingBookings: bookings?.filter((b: any) => b.paymentStatus === "pending").length || 0,
    paidBookings: bookings?.filter((b: any) => b.paymentStatus === "paid").length || 0,
    totalRevenue: bookings?.filter((b: any) => b.paymentStatus === "paid")
      .reduce((sum: number, b: any) => sum + parseFloat(b.amount), 0) || 0,
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "paid":
        return <Badge className="bg-green-900 text-green-300">Paid</Badge>;
      case "pending":
        return <Badge className="bg-yellow-900 text-yellow-300">Pending</Badge>;
      case "failed":
        return <Badge className="bg-red-900 text-red-300">Failed</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <div className="min-h-screen bg-deep-black text-white">
      {/* Header */}
      <div className="glass-effect border-b border-medium-gray">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <h1 className="text-2xl font-semibold gradient-text" data-testid="text-dashboard-title">
              P91 Admin Panel
            </h1>
            <div className="flex items-center space-x-4">
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
                <SelectTrigger className="w-48 bg-medium-gray border-gray-600 text-white" data-testid="select-status-filter">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent className="bg-medium-gray border-gray-600">
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
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
                    <TableHead className="text-gray-400">Date & Time</TableHead>
                    <TableHead className="text-gray-400">Amount</TableHead>
                    <TableHead className="text-gray-400">Status</TableHead>
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
                          {new Date(booking.timeSlot?.date).toLocaleDateString()}
                        </div>
                        <div className="text-sm text-gray-400" data-testid={`text-booking-time-${booking.id}`}>
                          {booking.timeSlot?.startTime}
                        </div>
                      </TableCell>
                      <TableCell className="font-semibold text-neon-green" data-testid={`text-booking-amount-${booking.id}`}>
                        ₹{booking.amount}
                      </TableCell>
                      <TableCell data-testid={`status-${booking.id}`}>
                        {getStatusBadge(booking.paymentStatus)}
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button size="sm" variant="ghost" className="text-blue-400 hover:text-blue-300" data-testid={`button-view-${booking.id}`}>
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="ghost" className="text-neon-green hover:text-green-300" data-testid={`button-whatsapp-${booking.id}`}>
                            <MessageCircle className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="ghost" className="text-yellow-400 hover:text-yellow-300" data-testid={`button-edit-${booking.id}`}>
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
      </div>

      <AdminServiceForm 
        isOpen={showServiceForm} 
        onClose={() => setShowServiceForm(false)} 
      />
    </div>
  );
}
