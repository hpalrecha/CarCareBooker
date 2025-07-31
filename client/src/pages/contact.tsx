import { Header } from "@/components/header";
import Footer from "@/components/footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { z } from "zod";
import { MapPin, Phone, Mail, Clock, MessageCircle } from "lucide-react";

const contactFormSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email address"),
  phone: z.string().min(10, "Please enter a valid phone number"),
  subject: z.string().min(5, "Subject must be at least 5 characters"),
  message: z.string().min(10, "Message must be at least 10 characters"),
});

type ContactForm = z.infer<typeof contactFormSchema>;

export default function Contact() {
  const { toast } = useToast();

  const form = useForm<ContactForm>({
    resolver: zodResolver(contactFormSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      subject: "",
      message: "",
    },
  });

  const contactMutation = useMutation({
    mutationFn: async (data: ContactForm) => {
      const response = await apiRequest("POST", "/api/contact", data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Message Sent!",
        description: "Thank you for contacting us. We'll get back to you within 24 hours.",
      });
      form.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to send message. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: ContactForm) => {
    contactMutation.mutate(data);
  };

  return (
    <div className="min-h-screen bg-deep-black text-white">
      <Header />
      
      <div className="pt-4">
        {/* Hero Section */}
        <div className="bg-gradient-to-r from-deep-black via-dark-gray to-deep-black py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h1 className="text-4xl md:text-5xl font-bold gradient-text mb-6" data-testid="text-contact-title">
              Get In Touch
            </h1>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto" data-testid="text-contact-subtitle">
              Have questions about our services? Need to schedule an appointment? 
              We're here to help you keep your car looking its best.
            </p>
          </div>
        </div>

        {/* Contact Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="grid lg:grid-cols-2 gap-16">
            {/* Contact Information */}
            <div className="space-y-8">
              <div>
                <h2 className="text-3xl font-bold text-neon-green mb-6">Contact Information</h2>
                <p className="text-gray-300 text-lg mb-8">
                  Reach out to us through any of these channels. We're committed to providing 
                  exceptional car care services in Bangalore.
                </p>
              </div>

              <div className="space-y-6">
                <div className="flex items-start space-x-4 p-4 glass-effect rounded-xl">
                  <MapPin className="w-6 h-6 text-neon-green mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-lg mb-2">Visit Our Location</h3>
                    <p className="text-gray-300" data-testid="text-address">
                      Bangalore, Karnataka, India<br />
                      Service available across the city
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-4 p-4 glass-effect rounded-xl">
                  <Phone className="w-6 h-6 text-neon-green mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-lg mb-2">Call Us</h3>
                    <p className="text-gray-300" data-testid="text-phone">
                      <a href="tel:+917406619191" className="hover:text-neon-green transition-colors">
                        +91 74066 19191
                      </a>
                    </p>
                    <p className="text-sm text-gray-400">Mon - Sat: 9:00 AM - 7:00 PM</p>
                  </div>
                </div>

                <div className="flex items-start space-x-4 p-4 glass-effect rounded-xl">
                  <Mail className="w-6 h-6 text-neon-green mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-lg mb-2">Email Us</h3>
                    <p className="text-gray-300" data-testid="text-email">
                      <a href="mailto:info@p91carcare.com" className="hover:text-neon-green transition-colors">
                        info@p91carcare.com
                      </a>
                    </p>
                    <p className="text-sm text-gray-400">We'll respond within 24 hours</p>
                  </div>
                </div>

                <div className="flex items-start space-x-4 p-4 glass-effect rounded-xl">
                  <MessageCircle className="w-6 h-6 text-neon-green mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-lg mb-2">WhatsApp</h3>
                    <p className="text-gray-300" data-testid="text-whatsapp">
                      <a href="https://wa.me/917406619191" className="hover:text-neon-green transition-colors">
                        +91 74066 19191
                      </a>
                    </p>
                    <p className="text-sm text-gray-400">Quick responses during business hours</p>
                  </div>
                </div>

                <div className="flex items-start space-x-4 p-4 glass-effect rounded-xl">
                  <Clock className="w-6 h-6 text-neon-green mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-lg mb-2">Business Hours</h3>
                    <div className="text-gray-300 space-y-1" data-testid="text-hours">
                      <p>Monday - Friday: 9:00 AM - 7:00 PM</p>
                      <p>Saturday: 9:00 AM - 6:00 PM</p>
                      <p>Sunday: 10:00 AM - 5:00 PM</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Contact Form */}
            <div>
              <div className="glass-effect rounded-2xl p-8">
                <h2 className="text-3xl font-bold text-neon-green mb-6">Send Us a Message</h2>
                <p className="text-gray-300 mb-8">
                  Fill out the form below and we'll get back to you as soon as possible.
                </p>

                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <div className="grid md:grid-cols-2 gap-6">
                      <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Your Name</FormLabel>
                            <FormControl>
                              <Input 
                                {...field} 
                                className="bg-dark-gray border-gray-600 text-white" 
                                data-testid="input-contact-name"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="phone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Phone Number</FormLabel>
                            <FormControl>
                              <Input 
                                {...field} 
                                type="tel"
                                className="bg-dark-gray border-gray-600 text-white" 
                                data-testid="input-contact-phone"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email Address</FormLabel>
                          <FormControl>
                            <Input 
                              {...field} 
                              type="email"
                              className="bg-dark-gray border-gray-600 text-white" 
                              data-testid="input-contact-email"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="subject"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Subject</FormLabel>
                          <FormControl>
                            <Input 
                              {...field} 
                              className="bg-dark-gray border-gray-600 text-white" 
                              data-testid="input-contact-subject"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="message"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Message</FormLabel>
                          <FormControl>
                            <Textarea 
                              {...field} 
                              rows={6}
                              className="bg-dark-gray border-gray-600 text-white resize-none" 
                              data-testid="textarea-contact-message"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <Button 
                      type="submit" 
                      className="w-full bg-neon-green text-deep-black hover:bg-neon-green/90 neon-glow font-semibold text-lg py-3"
                      disabled={contactMutation.isPending}
                      data-testid="button-send-message"
                    >
                      {contactMutation.isPending ? "Sending..." : "Send Message"}
                    </Button>
                  </form>
                </Form>
              </div>
            </div>
          </div>
        </div>

        {/* Service Areas */}
        <div className="bg-gradient-to-r from-dark-gray to-medium-gray py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl font-bold text-neon-green mb-8">Service Areas in Bangalore</h2>
            <div className="grid md:grid-cols-3 lg:grid-cols-4 gap-4 text-gray-300">
              <div className="p-4 bg-deep-black/50 rounded-lg">Koramangala</div>
              <div className="p-4 bg-deep-black/50 rounded-lg">Indiranagar</div>
              <div className="p-4 bg-deep-black/50 rounded-lg">Whitefield</div>
              <div className="p-4 bg-deep-black/50 rounded-lg">Electronic City</div>
              <div className="p-4 bg-deep-black/50 rounded-lg">HSR Layout</div>
              <div className="p-4 bg-deep-black/50 rounded-lg">BTM Layout</div>
              <div className="p-4 bg-deep-black/50 rounded-lg">Marathahalli</div>
              <div className="p-4 bg-deep-black/50 rounded-lg">JP Nagar</div>
            </div>
            <p className="text-gray-400 mt-6">
              Don't see your area? Contact us - we may still be able to serve you!
            </p>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}