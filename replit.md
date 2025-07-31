# P91 Car Care Booking Portal

## Overview

This is a lightweight booking portal for P91 Car Care, a car detailing and maintenance service based in Bangalore. The application allows administrators to create and manage service events while customers can book appointments, select time slots, make payments online, and receive confirmations via WhatsApp and email.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript for type safety and modern development
- **Routing**: Wouter for lightweight client-side routing
- **State Management**: TanStack Query (React Query) for server state management and caching
- **UI Components**: Radix UI primitives with shadcn/ui design system
- **Styling**: Tailwind CSS with dark theme and custom P91 branding (neon green accents)
- **Build Tool**: Vite for fast development and optimized production builds

### Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript for type safety across the full stack
- **Session Management**: Express sessions with PostgreSQL storage
- **Authentication**: Simple email/password authentication with bcrypt password hashing
- **API Design**: RESTful APIs with consistent error handling and logging middleware

### Database Architecture
- **Database**: PostgreSQL with Neon serverless hosting
- **ORM**: Drizzle ORM with TypeScript integration
- **Schema Management**: Drizzle Kit for migrations and schema management
- **Connection**: Connection pooling with @neondatabase/serverless

## Key Components

### Admin Panel Features
- Secure login system with session-based authentication
- Service management (create, edit, delete services)
- Rich text support for service descriptions
- Image/video upload capabilities
- Time slot management for each service
- Booking dashboard with status filters (Paid, Pending)
- Pricing configuration with discount support

### Customer Booking Flow
- Service discovery with detailed service pages
- Date and time slot selection with real-time availability
- Customer information collection (name, email, phone)
- Integrated payment processing via Razorpay
- Booking confirmation with automatic notifications

### Notification System
- WhatsApp integration using Meta WhatsApp Cloud API
- Email confirmations using Nodemailer with SMTP
- Automated booking confirmations with service details and location

## Data Flow

### Service Management
1. Admin logs into dashboard
2. Creates service with title, description, pricing, and media
3. Auto-generates unique slug for service URL
4. Sets up available time slots for the service
5. Service becomes bookable on frontend

### Booking Process
1. Customer browses services on homepage
2. Selects service and views detailed service page
3. Clicks "Book Now" to open booking modal
4. Selects date and available time slot
5. Fills in personal information
6. Redirected to Razorpay payment gateway
7. Upon successful payment:
   - Booking record created in database
   - WhatsApp confirmation sent to customer
   - Email confirmation sent to customer
   - Customer redirected to confirmation page

### Data Models
- **Admins**: Authentication and user management
- **Services**: Service catalog with pricing and media
- **TimeSlots**: Available booking slots per service
- **Bookings**: Customer bookings with payment status
- **Sessions**: Secure session management

## External Dependencies

### Payment Gateway
- **Razorpay**: Primary payment processor for Indian market
- Environment variables for API keys (test/production)
- Signature verification for payment security

### Communication Services
- **WhatsApp Business API**: Meta WhatsApp Cloud API for instant messaging
- **Email Service**: SMTP integration (Gmail/custom) for email notifications
- Location sharing with Google Maps integration

### Media Storage
- Image and video upload support for service galleries
- Frontend image optimization and responsive display

### Development Tools
- **Replit Integration**: Development environment optimization
- **Runtime Error Handling**: Enhanced development experience
- **Hot Module Replacement**: Fast development feedback

## Deployment Strategy

### Development Environment
- Vite development server with HMR
- Express server with TypeScript compilation via tsx
- Database migrations handled by Drizzle Kit
- Environment variable management for API keys

### Production Build
- Frontend built with Vite (static assets)
- Backend compiled with esbuild (Node.js bundle)
- Single deployment artifact with both frontend and backend
- Environment-specific configuration for database and external services

### Database Management
- Schema changes handled through Drizzle migrations
- Connection pooling for production scalability
- Environment-based database URL configuration

### Security Considerations
- Session-based authentication with secure cookies
- Password hashing with bcrypt
- CSRF protection through session management
- Input validation using Zod schemas
- Secure payment processing with signature verification

### Monitoring and Logging
- Request/response logging middleware
- Payment transaction logging
- Error tracking and handling
- Performance monitoring through query optimization

## Recent Changes
- **January 31, 2025**: Updated WhatsApp contact number to +91 74066 19191
- **January 31, 2025**: Created professional Contact Us page with form validation and backend integration
- **January 31, 2025**: Added Contact Us link to footer navigation under "Quick Links" section
- **January 31, 2025**: Fixed mobile responsiveness issues in booking modal and date picker functionality