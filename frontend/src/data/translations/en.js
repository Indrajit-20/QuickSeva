export const en = {
  welcomeHeader: 'QuickSeva Assistant',
  onlineStatus: 'Online • Customer Support',
  selectLangTitle: 'Please select your language / ભાષા પસંદ કરો / भाषा चुनें:',
  selectLangDropdown: 'Select Language',
  chooseLangPrompt: 'Choose / પસંદ / चुनें:',
  greeting: 'Hello 👋! Welcome to QuickSeva. How can I help you today?',
  typePlaceholder: 'Type your message or query here...',
  listeningPlaceholder: 'Listening...',
  sendTooltip: 'Send Message',
  optionsTitle: '⚡ Quick Help Options:',
  backToMenu: '🔙 Main Menu',
  menuLabel: 'Menu',
  typing: 'QuickSeva Bot is typing...',
  poweredBy: 'QuickSeva Customer Support • English, Hindi, Gujarati',
  showLess: 'Show Less',
  scrollToBottom: '↓ New message',
  copyMsg: 'Copy',
  copied: 'Copied!',
  feedbackThumbsUp: 'Helpful',
  feedbackThumbsDown: 'Not helpful',
  feedbackThanks: 'Thanks for your feedback!',
  minimize: 'Minimize',
  charLimit: 'characters remaining',
  errorMessage: 'Something went wrong. Please try again.',
  voiceNotSupported: 'Voice input is not supported in your browser.',
  stopListening: 'Stop Listening',
  voiceInput: 'Voice Input',

  options: [
    { id: 'track_booking', label: 'Track My Booking', icon: 'PackageSearch' },
    { id: 'wallet_refund', label: 'Wallet & Payment Help', icon: 'Wallet' },
    { id: 'how_to_book', label: 'How to Book a Service', icon: 'BookOpen' },
    { id: 'become_seller', label: 'Become a Provider / Seller', icon: 'Briefcase' },
    { id: 'become_contractor', label: 'Become a Contractor', icon: 'HardHat' },
    { id: 'about_quickseva', label: 'About QuickSeva', icon: 'Info' },
    { id: 'contact_support', label: 'Talk to Customer Support', icon: 'PhoneCall' }
  ],

  responses: {
    track_booking: `📦 **Track Your Booking**
- Logged in users can view active bookings under **[My Bookings](/my-bookings)**.
- Have a Booking ID (e.g., *QS-20260826-LAAA*)? Type it below and I'll look it up instantly!
- Booking Status Guide:
  • **Pending**: Waiting for provider to accept.
  • **Accepted**: Provider confirmed & coming soon!
  • **In Progress**: Work is currently ongoing.
  • **Completed**: Service done. Thank you for choosing QuickSeva!
  • **Cancelled**: Booking was cancelled. Check refund in your **[Wallet](/profile)**.`,

    wallet_refund: `💰 **Wallet & Refund Policy**

**Adding Money:**
- Add funds via UPI, Debit/Credit Card in **[Profile → Wallet](/profile)**.
- No extra charges on wallet top-ups.

**Cancellation & Refund Rules:**
  • **Cancelled before provider accepts** → Full refund (100%) to wallet, instantly.
  • **Cancelled after provider accepts but before work starts** → Partial refund, subject to platform review.
  • **Cancelled after work has started** → No refund as work is in progress.
  • **Disputed orders** → Contact support for manual review.

📞 For refund issues, contact **[Customer Support](/profile)** with your booking ID.`,

    how_to_book: `🛠️ **How to Book a Service on QuickSeva**
1️⃣ Go to **[Services](/services)** or browse nearby providers on the map.
2️⃣ Pick a category: Plumbing, Electrician, AC Repair, Cleaning, Carpentry, Painting, Pest Control.
3️⃣ View the provider's rating, reviews & pricing (fixed or hourly).
4️⃣ Select a date & time slot.
5️⃣ Confirm booking via QuickSeva Wallet or UPI!

**Tip:** Only verified, background-checked providers are listed on QuickSeva.`,

    become_seller: `💼 **Join QuickSeva as a Service Provider (Seller)**
- Are you an electrician, plumber, carpenter, painter, AC technician, or pest control specialist?
- List your services and start getting direct bookings from local customers!
- **[Register as a Seller](/become-seller)** — takes less than 2 minutes.

**Benefits:**
  • Zero listing fee
  • Direct customer bookings
  • Wallet-based instant payment
  • Work in your own area & radius
  • Manage your schedule with slot capacity & working hours

**Seller Dashboard Features:**
  • View & manage incoming orders
  • Set your working hours (e.g., 9 AM - 7 PM)
  • Configure slot capacity (how many jobs per day)
  • Track your earnings & wallet balance
  • Manage reviews & ratings`,

    become_contractor: `🏗️ **Become a Contractor on QuickSeva**

Contractors handle larger projects like construction, renovation, and commercial services.

**How to Register:**
1️⃣ Go to **[Contractor Registration](/become-contractor)** page.
2️⃣ Fill in your details: Name, Phone, Company Name (optional).
3️⃣ Select your trade specialization (Civil, Electrical, Plumbing, Interior Design, etc.)
4️⃣ Choose your city of operation.
5️⃣ Get verified and start receiving project leads!

**Benefits:**
  • Get direct project leads from customers in your city
  • Showcase your company profile & specialization
  • Verified contractor badge builds trust
  • WhatsApp notifications for new leads
  • Lead-based system — pay only for leads you receive

**Already a user?** Log in first, then upgrade your account to Contractor from your profile.`,

    about_quickseva: `ℹ️ **About QuickSeva**

QuickSeva is a **hyper-local service marketplace** based in Gujarat, India. We connect customers with verified, background-checked local service providers.

**What We Offer:**
  • 🔧 Home services (Plumbing, Electrician, Carpentry, Painting)
  • ❄️ Appliance services (AC Repair, Fridge, Washing Machine, Geyser)
  • 🧹 Cleaning & Pest Control
  • 🏗️ Contractor services for large projects

**How It Works:**
  • Customers browse & book verified providers
  • Providers accept bookings & complete work
  • Payment via secure QuickSeva Wallet or UPI
  • Both parties rate each other after service

**User Roles on QuickSeva:**
  • **Buyer** — Book services for your home/office
  • **Seller/Provider** — Offer services & receive bookings
  • **Contractor** — Handle large-scale projects & receive leads
  • **Admin** — Platform management

📍 Based in Ahmedabad, Gujarat | 📧 support@quickseva.com`,

    contact_support: `📞 **QuickSeva Customer Support**
- 📧 **Email**: support@quickseva.com
- 📱 **Helpline**: +91 98765 43210 (Mon-Sat, 9 AM - 7 PM)
- 📍 **Office**: Ahmedabad, Gujarat, India
- 🕐 **Response Time**: Within 24 hours on email, immediate on call.

For urgent issues, please call directly.`,

    services_list: `🛠️ **QuickSeva Services Available**

We connect you with verified local professionals for:
  • 🔧 **Plumbing** — leaks, pipe repair, installation
  • ⚡ **Electrician** — wiring, fan, switch, MCB repair
  • ❄️ **AC Service & Repair** — gas refill, servicing, installation
  • 🧹 **Home Cleaning** — deep clean, sofa, bathroom, kitchen
  • 🪚 **Carpentry** — furniture repair, woodwork
  • 🎨 **Home Painting** — interior & exterior painting
  • 🐛 **Pest Control** — cockroach, termite, rodent treatment
  • 🏠 **Appliance Repair** — washing machine, fridge, geyser

Browse all on **[Services Page](/services)**.`,

    out_of_scope: `🤖 I'm QuickSeva's customer support assistant. For specialized inquiries or questions outside our platform services, please reach out to our team:

- 📧 **Email**: support@quickseva.com
- 📱 **Helpline**: +91 98765 43210 (Mon-Sat, 9 AM - 7 PM)

You can also explore QuickSeva help topics:
  • 📦 Booking or order status
  • 🛠️ Available services & pricing
  • 💼 Becoming a seller or contractor
  • 💰 Wallet & payments`,

    fallback: `🤖 I couldn't find an exact match for your question. Here is how you can get help:

📧 **Email Support**: support@quickseva.com
📱 **Helpline**: +91 98765 43210 (Mon-Sat, 9 AM - 7 PM)

**Or select a topic below:**
  • 📦 Track bookings & order status
  • 💰 Wallet, balance & refund policy
  • 🛠️ Home services (Plumber, Electrician, AC Repair, Cleaning)
  • 💼 Register as a Service Provider or Contractor
  • ℹ️ Learn about QuickSeva platform`
  }
};
