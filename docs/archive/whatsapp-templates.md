# WhatsApp Message Templates for Meta Approval

## Template 1: Booking Confirmation
**Template Name:** `booking_confirmation`
**Category:** UTILITY
**Language:** English (en)

### Template Content:
```
Hello {{1}}, 

Your booking with P91 Car Care has been confirmed! 🚗

📅 Service: {{2}}
📍 Date & Time: {{3}}
💰 Amount Paid: ₹{{4}}
📋 Booking ID: {{5}}

Our team will arrive at your location on the scheduled date. Please ensure your vehicle is accessible.

For any queries, call us at +91 74066 19191

Thank you for choosing P91 Car Care!
```

### Template Variables:
1. `{{1}}` = Customer Name (TEXT)
2. `{{2}}` = Service Name (TEXT) 
3. `{{3}}` = Date and Time (TEXT)
4. `{{4}}` = Amount Paid (TEXT)
5. `{{5}}` = Booking ID (TEXT)

---

## Template 2: Booking Reminder
**Template Name:** `booking_reminder`
**Category:** UTILITY  
**Language:** English (en)

### Template Content:
```
Hi {{1}},

This is a reminder that your P91 Car Care service is scheduled for tomorrow! 🔔

📅 Service: {{2}}
⏰ Time: {{3}}
📍 Location: Your provided address

Please ensure:
- Vehicle is accessible
- Area has sufficient lighting
- Water connection is available

For any changes, call +91 74066 19191

See you tomorrow!
P91 Car Care Team
```

### Template Variables:
1. `{{1}}` = Customer Name (TEXT)
2. `{{2}}` = Service Name (TEXT)
3. `{{3}}` = Scheduled Time (TEXT)

---

## Code Implementation Variables

When implementing in your WhatsApp service, use these variable mappings:

### For Confirmation Message:
```javascript
const confirmationVariables = {
  1: booking.customerName,
  2: booking.serviceName, 
  3: `${booking.date} at ${booking.timeSlot}`,
  4: booking.amount,
  5: booking.id
};
```

### For Reminder Message:
```javascript
const reminderVariables = {
  1: booking.customerName,
  2: booking.serviceName,
  3: booking.timeSlot
};
```

---

## Meta Template Submission Guidelines

1. **Template Name**: Use exactly `booking_confirmation` and `booking_reminder`
2. **Category**: Select "UTILITY" for both templates
3. **Variable Count**: Confirmation has 5 variables, Reminder has 3 variables
4. **Variable Types**: All variables are TEXT type
5. **Language**: English (en)

## Sample Data for Testing:
- Customer Name: "Rajesh Kumar"
- Service Name: "Premium Car Detailing" 
- Date & Time: "15th Feb 2025 at 10:00 AM"
- Amount: "2999"
- Booking ID: "P91-ABC123"

After Meta approval, you'll get template IDs that we'll use in the WhatsApp integration code.