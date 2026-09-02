// Trilingual Dictionary & Workflows for QuickSeva Chatbot (English, Hindi, Gujarati)

export const LANGUAGES = [
  { code: 'en', label: 'English', flag: '🇬🇧', scriptName: 'English' },
  { code: 'hi', label: 'हिंदी', flag: '🇮🇳', scriptName: 'Hindi' },
  { code: 'gu', label: 'ગુજરાતી', flag: '🇮🇳', scriptName: 'Gujarati' }
];

export const TRANSLATIONS = {
  en: {
    welcomeHeader: 'QuickSeva Assistant',
    onlineStatus: 'Online • Customer Support',
    selectLangTitle: 'Please select your language / ભાષા પસંદ કરો / भाषा चुनें:',
    greeting: 'Hello 👋! Welcome to QuickSeva. How can I help you today?',
    typePlaceholder: 'Type your message or query here...',
    sendTooltip: 'Send Message',
    optionsTitle: '⚡ Quick Help Options:',
    backToMenu: '🔙 Main Menu',
    typing: 'QuickSeva Bot is typing...',
    poweredBy: 'QuickSeva Customer Support • English, Hindi, Gujarati',

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
  },

  hi: {
    welcomeHeader: 'क्विकसेवा असिस्टेंट',
    onlineStatus: 'ऑनलाइन • कस्टमर सहायता',
    selectLangTitle: 'अपनी भाषा चुनें / Choose language:',
    greeting: 'नमस्ते 👋! क्विकसेवा (QuickSeva) में आपका स्वागत है। आज मैं आपकी क्या मदद कर सकता हूँ?',
    typePlaceholder: 'सवाल पूछें या नीचे दिया गया विकल्प चुनें...',
    sendTooltip: 'संदेश भेजें',
    optionsTitle: '⚡ त्वरित सहायता विकल्प:',
    backToMenu: 'मुख्य मेनू',
    typing: 'क्विकसेवा बोट टाइप कर रहा है...',
    poweredBy: 'क्विकसेवा कस्टमर सहायता • गुजराती, हिंदी, अंग्रेजी',

    options: [
      { id: 'track_booking', label: 'मेरी बुकिंग ट्रैक करें', icon: 'PackageSearch' },
      { id: 'wallet_refund', label: 'वॉलेट और रिफंड सहायता', icon: 'Wallet' },
      { id: 'how_to_book', label: 'सर्विस कैसे बुक करें', icon: 'BookOpen' },
      { id: 'become_seller', label: 'सेलर / सर्विस प्रोवाइडर बनें', icon: 'Briefcase' },
      { id: 'become_contractor', label: 'ठेकेदार (कॉन्ट्रैक्टर) बनें', icon: 'HardHat' },
      { id: 'about_quickseva', label: 'क्विकसेवा के बारे में', icon: 'Info' },
      { id: 'contact_support', label: 'कस्टमर सपोर्ट से बात करें', icon: 'PhoneCall' }
    ],

    responses: {
      track_booking: `📦 **अपनी बुकिंग ट्रैक करें**
- अपनी बुकिंग देखने के लिए **[My Bookings](/my-bookings)** पर जाएँ।
- बुकिंग आईडी है? (जैसे *QS-20260826-LAAA*) नीचे टाइप करें।
- बुकिंग स्थिति:
  • **Pending**: स्वीकार होने का इंतज़ार।
  • **Accepted**: प्रोवाइडर आ रहा है!
  • **In Progress**: काम जारी है।
  • **Completed**: सर्विस पूरी हो गई।
  • **Cancelled**: बुकिंग रद्द। रिफंड **[वॉलेट](/profile)** में देखें।`,

      wallet_refund: `💰 **वॉलेट और रिफंड नीति**

**पैसे जोड़ें:**
- **[प्रोफाइल → वॉलेट](/profile)** में UPI या कार्ड से बैलेंस जोड़ें।

**कैंसलेशन और रिफंड नियम:**
  • **प्रोवाइडर के स्वीकार करने से पहले रद्द** → 100% रिफंड, तुरंत वॉलेट में।
  • **स्वीकार के बाद, काम शुरू से पहले रद्द** → आंशिक रिफंड, समीक्षा के अधीन।
  • **काम शुरू होने के बाद रद्द** → रिफंड नहीं मिलेगा।
  • **विवादित ऑर्डर** → मैन्युअल समीक्षा के लिए सपोर्ट से संपर्क करें।

📞 रिफंड के लिए बुकिंग आईडी के साथ **[कस्टमर सपोर्ट](/profile)** से संपर्क करें।`,

      how_to_book: `🛠️ **क्विकसेवा पर सर्विस कैसे बुक करें**
1️⃣ **[सर्विस पेज](/services)** पर जाएँ या मैप पर नज़दीकी सेलर ढूँढें।
2️⃣ कैटेगरी चुनें: प्लंबिंग, इलेक्ट्रिक, AC, सफाई, कारपेंटरी, पेंटिंग, पेस्ट कंट्रोल।
3️⃣ रेटिंग और कीमत देखकर प्रोवाइडर चुनें।
4️⃣ तारीख और समय चुनें।
5️⃣ वॉलेट या UPI से बुकिंग कन्फर्म करें!

**सुझाव:** केवल वेरिफाइड प्रोवाइडर ही QuickSeva पर सूचीबद्ध हैं।`,

      become_seller: `💼 **सर्विस प्रोवाइडर (सेलर) बनें**
- क्या आप प्लंबर, इलेक्ट्रीशियन, AC तकनीशियन, कारपेंटर या पेंटर हैं?
- **[सेलर रजिस्ट्रेशन करें](/become-seller)** — 2 मिनट में शुरू करें।

**फायदे:**
  • लिस्टिंग फ्री
  • डायरेक्ट ग्राहक बुकिंग
  • वॉलेट से तुरंत पेमेंट
  • अपने क्षेत्र में काम करें

**सेलर डैशबोर्ड:**
  • ऑर्डर मैनेज करें
  • कार्य समय सेट करें (जैसे सुबह 9 - शाम 7)
  • स्लॉट क्षमता कॉन्फ़िगर करें
  • कमाई और वॉलेट ट्रैक करें`,

      become_contractor: `🏗️ **क्विकसेवा पर ठेकेदार (कॉन्ट्रैक्टर) बनें**

ठेकेदार बड़े प्रोजेक्ट जैसे निर्माण, नवीनीकरण और व्यावसायिक सेवाएं संभालते हैं।

**रजिस्ट्रेशन कैसे करें:**
1️⃣ **[ठेकेदार रजिस्ट्रेशन](/become-contractor)** पेज पर जाएँ।
2️⃣ अपनी जानकारी भरें: नाम, फोन, कंपनी का नाम।
3️⃣ अपनी विशेषज्ञता चुनें (सिविल, इलेक्ट्रिकल, प्लंबिंग, इंटीरियर डिज़ाइन)।
4️⃣ अपना शहर चुनें।
5️⃣ वेरिफाई हों और प्रोजेक्ट लीड प्राप्त करें!

**फायदे:**
  • अपने शहर में सीधे प्रोजेक्ट लीड
  • कंपनी प्रोफाइल प्रदर्शित करें
  • वेरिफाइड ठेकेदार बैज
  • नई लीड के लिए WhatsApp सूचना`,

      about_quickseva: `ℹ️ **क्विकसेवा के बारे में**

क्विकसेवा गुजरात, भारत में एक **हाइपर-लोकल सर्विस मार्केटप्लेस** है। हम ग्राहकों को वेरिफाइड स्थानीय सेवा प्रदाताओं से जोड़ते हैं।

**हम क्या ऑफर करते हैं:**
  • 🔧 होम सर्विस (प्लंबिंग, इलेक्ट्रीशियन, कारपेंटरी, पेंटिंग)
  • ❄️ अप्लायंस सर्विस (AC, फ्रिज, वॉशिंग मशीन)
  • 🧹 क्लीनिंग और पेस्ट कंट्रोल
  • 🏗️ बड़े प्रोजेक्ट के लिए ठेकेदार सेवाएं

**उपयोगकर्ता भूमिकाएं:**
  • **खरीदार** — सेवाएं बुक करें
  • **सेलर/प्रोवाइडर** — सेवाएं प्रदान करें
  • **ठेकेदार** — बड़े प्रोजेक्ट हैंडल करें
  • **एडमिन** — प्लेटफ़ॉर्म प्रबंधन

📍 अहमदाबाद, गुजरात | 📧 support@quickseva.com | 📱 +91 98765 43210`,

      contact_support: `📞 **क्विकसेवा कस्टमर केयर**
- 📧 **ईमेल**: support@quickseva.com
- 📱 **हेल्पलाइन**: +91 98765 43210 (सोम-शनि, 9 AM - 7 PM)
- 📍 **कार्यालय**: अहमदाबाद, गुजरात, भारत
- 🕐 ईमेल पर 24 घंटे में जवाब, कॉल पर तुरंत।`,

      services_list: `🛠️ **क्विकसेवा की सेवाएं**

हम इन सेवाओं के लिए वेरिफाइड पेशेवरों से जोड़ते हैं:
  • 🔧 **प्लंबिंग** — लीकेज, पाइप, फिटिंग
  • ⚡ **इलेक्ट्रीशियन** — वायरिंग, पंखा, MCB
  • ❄️ **AC सर्विस** — गैस रिफिल, सर्विसिंग
  • 🧹 **होम क्लीनिंग** — डीप क्लीन, बाथरूम, किचन
  • 🪚 **कारपेंटरी** — फर्नीचर, वुडवर्क
  • 🎨 **पेंटिंग** — इंटीरियर और एक्सटीरियर
  • 🐛 **पेस्ट कंट्रोल** — कॉकरोच, दीमक
  • 🏠 **अप्लायंस रिपेयर** — वाशिंग मशीन, फ्रिज

सभी सर्विस देखें **[सर्विस पेज](/services)** पर।`,

      out_of_scope: `🤖 मैं क्विकसेवा का कस्टमर सहायता असिस्टेंट हूँ। अगर आपको कोई विशेष सहायता चाहिए, तो हमारी टीम से संपर्क करें:

- 📧 **ईमेल**: support@quickseva.com
- 📱 **हेल्पलाइन**: +91 98765 43210 (सोम-शनि, सुबह 9 - शाम 7)

आप इन विषयों के बारे में पूछ सकते हैं:
  • 📦 बुकिंग स्थिति
  • 🛠️ उपलब्ध सेवाएं
  • 💼 सेलर या ठेकेदार बनें
  • 💰 वॉलेट और भुगतान`,

      fallback: `🤖 आपके प्रश्न का सीधा उत्तर नहीं मिला। आप हमसे संपर्क कर सकते हैं:

📧 **ईमेल**: support@quickseva.com
📱 **हेल्पलाइन**: +91 98765 43210 (सोम-शनि, सुबह 9 - शाम 7)

**या नीचे दिया गया विकल्प चुनें:**
  • 📦 बुकिंग स्थिति
  • 💰 वॉलेट और रिफंड
  • 🛠️ सेवाएं (प्लंबर, इलेक्ट्रीशियन, AC)
  • 💼 सेलर/ठेकेदार रजिस्ट्रेशन`
    }
  },

  gu: {
    welcomeHeader: 'ક્વિકસેવા આસિસ્ટન્ટ',
    onlineStatus: 'ઓનલાઇન • કસ્ટમર સપોર્ટ',
    selectLangTitle: 'તમારી ભાષા પસંદ કરો / Select Language:',
    greeting: 'નમસ્તે 👋! ક્વિકસેવા (QuickSeva) માં આપનું સ્વાગત છે. હું આજે તમારી શું મદદ કરી શકું?',
    typePlaceholder: 'પ્રશ્ન પૂછો અથવા નીચેનો વિકલ્પ પસંદ કરો...',
    sendTooltip: 'સંદેશ મોકલો',
    optionsTitle: '⚡ ઝડપી મદદ વિકલ્પો:',
    backToMenu: 'મુખ્ય મેનૂ',
    typing: 'ક્વિકસેવા બોટ ટાઇપ કરી રહ્યું છે...',
    poweredBy: 'ક્વિકસેવા કસ્ટમર સપોર્ટ • ગુજરાતી, હિન્દી, અંગ્રેજી',

    options: [
      { id: 'track_booking', label: 'મારો ઓર્ડર સ્ટેટસ તપાસો', icon: 'PackageSearch' },
      { id: 'wallet_refund', label: 'વોલેટ અને રીફંડ મદદ', icon: 'Wallet' },
      { id: 'how_to_book', label: 'સર્વિસ કેવી રીતે બુક કરવી', icon: 'BookOpen' },
      { id: 'become_seller', label: 'આપણી સર્વિસ રજીસ્ટર કરો', icon: 'Briefcase' },
      { id: 'become_contractor', label: 'ઠેકેદાર (કોન્ટ્રાક્ટર) બનો', icon: 'HardHat' },
      { id: 'about_quickseva', label: 'ક્વિકસેવા વિશે', icon: 'Info' },
      { id: 'contact_support', label: 'કસ્ટમર કેર સાથે વાત કરો', icon: 'PhoneCall' }
    ],

    responses: {
      track_booking: `📦 **ઓર્ડર સ્ટેટસ તપાસો**
- **[My Bookings](/my-bookings)** પર જઈ સક્રિય ઓર્ડર જુઓ.
- બુકિંગ ID હોય (જેમ કે *QS-20260826-LAAA*)? નીચે ટાઈપ કરો.
- ઓર્ડર સ્થિતિ:
  • **Pending**: મંજૂરીની રાહ.
  • **Accepted**: કારીગર આવી રહ્યો છે!
  • **In Progress**: કામ ચાલુ છે.
  • **Completed**: સર્વિસ પૂર્ણ!
  • **Cancelled**: ઓર્ડર રદ. **[વોલેટ](/profile)** માં રીફંડ તપાસો.`,

      wallet_refund: `💰 **વોલેટ અને રીફંડ નીતિ**

**પૈસા ઉમેરો:**
- **[Profile → Wallet](/profile)** માં UPI અથવા કાર્ડ વડે ઉમેરો.

**કેન્સલેશન અને રીફંડ નિયમ:**
  • **કારીગર સ્વીકારે તે પહેલાં રદ** → 100% રીફંડ, તરત વોલેટમાં.
  • **સ્વીકૃતિ પછી, કામ શરૂ થાય તે પહેલાં રદ** → આંશિક રીફંડ, સમીક્ષાને આધીન.
  • **કામ શરૂ થઈ ગયા પછી રદ** → રીફંડ મળશે નહીં.
  • **વિવાદિત ઓર્ડર** → **[કસ્ટમર સપોર્ટ](/profile)** ને સંપર્ક કરો.

📞 રીફંડ માટે બુકિંગ ID સાથે સંપર્ક કરો.`,

      how_to_book: `🛠️ **સર્વિસ બુક કરવાની રીત**
1️⃣ **[સર્વિસ પેજ](/services)** પર જાવ.
2️⃣ કેટેગરી પસંદ કરો: ઇલેક્ટ્રિશિયન, પ્લમ્બર, AC, સફાઈ, કડીયા, પેઇન્ટિંગ, pest control.
3️⃣ રેટિંગ અને ભાવ જોઈ કારીગર પસંદ કરો.
4️⃣ તારીખ અને સમય નક્કી કરો.
5️⃣ Wallet અથવા UPI વડે બુકિંગ ફાઇનલ કરો!

**ટિપ:** ફક્ત ચકાસેલ (verified) કારીગર QuickSeva પર છે.`,

      become_seller: `💼 **સર્વિસ પ્રોવાઇડર (સેલર) જોડાઓ**
- ઇલેક્ટ્રિશિયન, પ્લમ્બર, AC ટેકનિશિયન, કડીયા, પેઇન્ટર છો?
- **[સેલર રજીસ્ટ્રેશન](/become-seller)** 2 મિનિટમાં.

**ફાયદા:**
  • રજીસ્ટ્રેશન ફ્રી
  • સીધા ગ્રાહક ઓર્ડર
  • વોલેટ દ્વારા ઝડપી પેમેન્ટ
  • પોતાના વિસ્તારમાં કામ

**સેલર ડેશબોર્ડ:**
  • ઓર્ડર મેનેજ કરો
  • કાર્ય સમય સેટ કરો
  • સ્લોટ ક્ષમતા કૉન્ફિગર કરો
  • કમાણી અને વોલેટ ટ્રેક કરો`,

      become_contractor: `🏗️ **ક્વિકસેવા પર ઠેકેદાર (કોન્ટ્રાક્ટર) બનો**

ઠેકેદાર મોટા પ્રોજેક્ટ જેમ કે બાંધકામ, નવીનીકરણ અને વ્યાવસાયિક સેવાઓ સંભાળે છે.

**રજીસ્ટ્રેશન કેવી રીતે:**
1️⃣ **[ઠેકેદાર રજીસ્ટ્રેશન](/become-contractor)** પેજ પર જાવ.
2️⃣ તમારી માહિતી ભરો: નામ, ફોન, કંપનીનું નામ.
3️⃣ તમારી વિશેષતા પસંદ કરો (સિવિલ, ઇલેક્ટ્રિકલ, પ્લમ્બિંગ, ઇન્ટિરિયર ડિઝાઇન).
4️⃣ તમારું શહેર પસંદ કરો.
5️⃣ ચકાસણી થાવ અને પ્રોજેક્ટ લીડ મેળવવાનું શરૂ કરો!

**ફાયદા:**
  • તમારા શહેરમાં સીધી પ્રોજેક્ટ લીડ
  • કંપની પ્રોફાઇલ પ્રદર્શિત કરો
  • ચકાસેલ ઠેકેદાર બેજ
  • નવી લીડ માટે WhatsApp સૂચના`,

      about_quickseva: `ℹ️ **ક્વિકસેવા વિશે**

ક્વિકસેવા ગુજરાત, ભારતમાં એક **હાઇપર-લોકલ સર્વિસ માર્કેટપ્લેસ** છે. અમે ગ્રાહકોને ચકાસેલ સ્થાનિક સર્વિસ પ્રોવાઇડર સાથે જોડીએ છીએ.

**અમે શું ઓફર કરીએ છીએ:**
  • 🔧 હોમ સર્વિસ (પ્લમ્બિંગ, ઇલેક્ટ્રિશિયન, કારપેન્ટ્રી, પેઇન્ટિંગ)
  • ❄️ ઉપકરણ સર્વિસ (AC, ફ્રિજ, વોશિંગ મશીન)
  • 🧹 ક્લીનિંગ અને Pest Control
  • 🏗️ મોટા પ્રોજેક્ટ માટે ઠેકેદાર સેવાઓ

**વપરાશકર્તા ભૂમિકાઓ:**
  • **ખરીદનાર** — સેવાઓ બુક કરો
  • **સેલર/પ્રોવાઇડર** — સેવાઓ આપો
  • **ઠેકેદાર** — મોટા પ્રોજેક્ટ સંભાળો
  • **એડમિન** — પ્લેટફોર્મ મેનેજમેન્ટ

📍 અમદાવાદ, ગુજરાત | 📧 support@quickseva.com | 📱 +91 98765 43210`,

      contact_support: `📞 **ક્વિકસેવા કસ્ટમર કેર**
- 📧 **ઈમેલ**: support@quickseva.com
- 📱 **ફોન**: +91 98765 43210 (સોમ-શનિ, 9 AM - 7 PM)
- 📍 **સરનામું**: અમદાવાદ, ગુજરાત, ભારત
- 🕐 ઈમેલ પ્રતિભાવ 24 કલાકમાં, ફોન પર તરત.`,

      services_list: `🛠️ **ક્વિકસેવાની સેવાઓ**

અમે આ સેવાઓ માટે ચકાસેલ કારીગરો સાથે જોડીએ છીએ:
  • 🔧 **પ્લમ્બિંગ** — નળ, પાઇપ, ફિટિંગ
  • ⚡ **ઇલેક્ટ્રિશિયન** — વાયરિંગ, પંખો, MCB
  • ❄️ **AC સર્વિસ** — ગેસ રિફિલ, સર્વિસિંગ
  • 🧹 **ઘર સફાઈ** — ડીપ ક્લીન, બાથરૂમ, રસોઈ
  • 🪚 **કડીયા/કારપેન્ટ્રી** — ફર્નિચર, વુડ વર્ક
  • 🎨 **પેઇન્ટિંગ** — અંદર અને બહાર
  • 🐛 **Pest Control** — વંદો, ઉધઈ
  • 🏠 **ઉપકરણ સમારકામ** — ફ્રિઝ, ઓવન, ગીઝર

બધી સર્વિસ **[સર્વિસ પેજ](/services)** પર.`,

      out_of_scope: `🤖 હું ક્વિકસેવાનો કસ્ટમર સપોર્ટ આસિસ્ટન્ટ છું. વિશેષ મદદ માટે અમારી ટીમનો સંપર્ક કરો:

- 📧 **ઈમેલ**: support@quickseva.com
- 📱 **ફોન**: +91 98765 43210 (સોમ-શનિ, 9 AM - 7 PM)

આ પૂછી શકો છો:
  • 📦 બુકિંગ સ્ટેટસ
  • 🛠️ ઉપલબ્ધ સેવાઓ
  • 💼 સેલર કે ઠેકેદાર બનો
  • 💰 વોલેટ અને પેમેન્ટ`,

      fallback: `🤖 તમારા પ્રશ્નનો સીધો જવાબ મળ્યો નથી. આપ કસ્ટમર કેર સંપર્ક કરી શકો છો:

📧 **ઈમેલ**: support@quickseva.com
📱 **ફોન**: +91 98765 43210 (સોમ-શનિ, 9 AM - 7 PM)

**અથવા વિકલ્પ પસંદ કરો:**
  • 📦 ઓર્ડર ટ્રેકિંગ
  • 💰 વોલેટ અને રીફંડ
  • 🛠️ સેવાઓ (પ્લમ્બર, ઇલેક્ટ્રિશિયન, AC)
  • 💼 સેલર કે ઠેકેદાર રજીસ્ટ્રેશન`
    }
  }
};

// ─────────────────────────────────────────────────────────────────
// OUT-OF-SCOPE KEYWORDS — Detect clearly unrelated questions
// These trigger a polite decline BEFORE any service keyword matching
// ─────────────────────────────────────────────────────────────────
export const OUT_OF_SCOPE_KEYWORDS = [
  // Programming / Tech
  'html', 'css', 'javascript', 'python', 'java', 'react', 'angular', 'vue',
  'nodejs', 'node.js', 'php', 'ruby', 'golang', 'rust', 'swift', 'kotlin',
  'c++', 'c#', 'sql', 'mongodb', 'coding', 'programming', 'developer',
  'frontend', 'backend', 'framework', 'algorithm', 'data structure',
  'machine learning', 'artificial intelligence', 'blockchain', 'crypto',
  'bitcoin', 'ethereum', 'nft',
  // General Knowledge
  'capital of', 'president of', 'prime minister', 'who invented', 'history of',
  'geography', 'physics', 'chemistry', 'biology', 'mathematics', 'calculus',
  'population of', 'area of', 'distance between', 'tallest', 'longest',
  'deepest', 'oldest', 'youngest', 'richest',
  // Entertainment / Lifestyle
  'movie', 'film', 'song', 'music', 'game', 'cricket', 'football', 'ipl',
  'recipe', 'cook', 'food recipe', 'diet', 'exercise', 'gym', 'yoga',
  'horoscope', 'zodiac', 'astrology',
  // Weather / News
  'weather', 'temperature', 'forecast', 'news', 'stock market', 'share price',
  // Social Media
  'instagram', 'facebook', 'twitter', 'tiktok', 'youtube', 'snapchat',
  // School / Exam
  'exam', 'syllabus', 'admission', 'college', 'university', 'school',
  'homework', 'assignment', 'essay', 'thesis',
  // Unrelated services
  'flight', 'train ticket', 'bus ticket', 'hotel booking', 'cab booking',
  'uber', 'ola', 'zomato', 'swiggy', 'amazon', 'flipkart',
  // Jokes / Misc
  'joke', 'funny', 'poem', 'story', 'riddle', 'puzzle',
  'what is love', 'meaning of life', 'who are you really', 'are you human'
];

// Terms that LOOK off-topic but are actually QuickSeva-relevant (prevent false decline)
export const SCOPE_OVERRIDE_KEYWORDS = [
  'quickseva', 'quick seva', 'booking', 'order', 'seller', 'provider',
  'contractor', 'plumber', 'electrician', 'carpenter', 'painter',
  'ac repair', 'cleaning', 'pest control', 'wallet', 'refund', 'service',
  'ઠેકેદાર', 'સર્વિસ', 'બુકિંગ', 'ઓર્ડર', 'વોલેટ', 'સેલર',
  'ठेकेदार', 'सर्विस', 'बुकिंग', 'ऑर्डर', 'वॉलेट', 'सेलर', 'lead', 'લીડ', 'लीड'
];

// ─────────────────────────────────────────────────────────────────
// EXPANDED Keyword Matching Rules (Local Smart Engine)
// FIXED: Removed generic single-word triggers that cause false matches
// Each rule now has a `priority` field (higher = more specific)
// ─────────────────────────────────────────────────────────────────
export const KEYWORD_RULES = [

  // ── About QuickSeva / How It Works (HIGH PRIORITY) ──────────────
  {
    priority: 10,
    keywords: [
      'what is quickseva', 'about quickseva', 'how quickseva works',
      'how does quickseva', 'how it works', 'about this platform',
      'what does quickseva do', 'tell me about quickseva', 'tell me quickseva',
      'quickseva is what', 'quickseva about', 'tell me about', 'about platform',
      'what is this website', 'what is this platform', 'what is quick seva',
      'ક્વિકસેવા શું છે', 'ક્વિકસેવા વિશે', 'ક્વિકસેવા કેવી રીતે',
      'ક્વિકસેવા વિશે જણાવો', 'ક્વિકસેવા શું',
      'क्विकसेवा क्या है', 'क्विकसेवा के बारे में', 'कैसे काम करता',
      'क्विकसेवा क्या', 'क्विकसेवा बताओ',
      'your platform', 'this website', 'your website', 'your app',
      'who built this', 'who made this'
    ],
    responses: {
      en: `ℹ️ **About QuickSeva**

QuickSeva is a hyper-local service marketplace in Gujarat, India. We connect customers with verified service providers for home services like Plumbing, Electrician, AC Repair, Cleaning, Carpentry, Painting, Pest Control & more.

**Key Features:**
  • Verified, background-checked providers
  • Secure wallet-based payments
  • Real-time booking tracking
  • Ratings & reviews system
  • Seller & Contractor registration

Learn more at **[Services](/services)** or **[About](/about)**.`,
      hi: `ℹ️ **क्विकसेवा के बारे में**

क्विकसेवा गुजरात, भारत में एक हाइपर-लोकल सर्विस मार्केटप्लेस है। हम ग्राहकों को वेरिफाइड सेवा प्रदाताओं से जोड़ते हैं।

**मुख्य विशेषताएं:**
  • वेरिफाइड प्रोवाइडर
  • वॉलेट-आधारित सुरक्षित भुगतान
  • रियल-टाइम बुकिंग ट्रैकिंग
  • रेटिंग और रिव्यू

**[सर्विस पेज](/services)** पर और जानें।`,
      gu: `ℹ️ **ક્વિકસેવા વિશે**

ક્વિકસેવા ગુજરાત, ભારતમાં એક હાઇપર-લોકલ સર્વિસ માર્કેટપ્લેસ છે. અમે ગ્રાહકોને ચકાસેલ સર્વિસ પ્રોવાઇડર સાથે જોડીએ છીએ.

**મુખ્ય વિશેષતાઓ:**
  • ચકાસેલ કારીગરો
  • વોલેટ-આધારિત સુરક્ષિત ચુકવણી
  • રીયલ-ટાઇમ બુકિંગ ટ્રેકિંગ
  • રેટિંગ અને રીવ્યૂ

**[સર્વિસ પેજ](/services)** પર વધુ જાણો.`
    }
  },

  // ── Contractor Registration & Info (HIGH PRIORITY) ──────────────
  {
    priority: 10,
    keywords: [
      'contractor', 'become contractor', 'register contractor', 'contractor registration',
      'how to become contractor', 'contractor kaise bane', 'join as contractor',
      'thekedar', 'construction work', 'renovation', 'big project',
      'ઠેકેદાર', 'કોન્ટ્રાક્ટર', 'ઠેકેદાર બનવું', 'ઠેકેદાર રજીસ્ટ્રેશન',
      'ठेकेदार', 'कॉन्ट्रैक्टर', 'ठेकेदार बनना', 'ठेकेदार रजिस्ट्रेशन',
      'trade specialization', 'company registration', 'project lead'
    ],
    responses: {
      en: `🏗️ **Become a Contractor on QuickSeva**

Contractors handle large-scale projects: construction, renovation, commercial work.

**How to Register:**
1️⃣ Visit **[Contractor Registration](/become-contractor)**
2️⃣ Enter your details (Name, Phone, Company)
3️⃣ Select trade specialization (Civil, Electrical, Plumbing, Interior)
4️⃣ Choose your city → Get verified!

**Benefits:** Direct project leads, verified badge, WhatsApp alerts, lead-based pricing.

Already a user? Log in and upgrade to Contractor from your profile.`,
      hi: `🏗️ **ठेकेदार बनें**

**[ठेकेदार रजिस्ट्रेशन](/become-contractor)** पर जाएँ। नाम, फोन, कंपनी, विशेषज्ञता और शहर भरें। वेरिफाई होकर सीधे प्रोजेक्ट लीड पाएं!

फायदे: डायरेक्ट लीड, वेरिफाइड बैज, WhatsApp अलर्ट।`,
      gu: `🏗️ **ઠેકેદાર બનો**

**[ઠેકેદાર રજીસ્ટ્રેશન](/become-contractor)** પર જાવ. નામ, ફોન, કંપની, વિશેષતા અને શહેર ભરો. ચકાસણી થાવ અને સીધી પ્રોજેક્ટ લીડ મેળવો!

ફાયદા: ડાયરેક્ટ લીડ, ચકાસેલ બેજ, WhatsApp સૂચના.`
    }
  },

  // ── Lead System Info (HIGH PRIORITY) ────────────────────────────
  {
    priority: 9,
    keywords: [
      'lead', 'leads', 'customer lead', 'lead charge', 'lead cost',
      'how leads work', 'lead system', 'social lead',
      'લીડ', 'લીડ ચાર્જ', 'લીડ સિસ્ટમ',
      'लीड', 'लीड चार्ज', 'लीड सिस्टम'
    ],
    responses: {
      en: `📋 **QuickSeva Lead System**

**How Leads Work:**
  • When a customer needs a service, a lead is generated
  • Verified sellers/contractors in the area receive the lead notification
  • You can accept leads and connect directly with the customer
  • Lead charges may apply based on service category

**Lead Types:**
  • **Service Leads** — For regular service bookings (plumbing, electrical, etc.)
  • **Social Leads** — From social media and marketing campaigns
  • **Project Leads** — For contractors handling large-scale work

For lead pricing, check your **[Seller Dashboard](/seller/dashboard)** or contact **[Support](/profile)**.`,
      hi: `📋 **लीड सिस्टम**

ग्राहक जब सर्विस चाहते हैं, तब एक लीड बनती है। वेरिफाइड सेलर/ठेकेदार को सूचना मिलती है। लीड स्वीकार करके ग्राहक से सीधे जुड़ें। लीड चार्ज सर्विस कैटेगरी पर निर्भर।

**[सेलर डैशबोर्ड](/seller/dashboard)** में लीड प्राइसिंग देखें।`,
      gu: `📋 **લીડ સિસ્ટમ**

ગ્રાહક જ્યારે સર્વિસ ઈચ્છે છે, ત્યારે લીડ બને છે. ચકાસેલ સેલર/ઠેકેદારને સૂચના મળે છે. લીડ સ્વીકારીને ગ્રાહક સાથે સીધા જોડાવ. લીડ ચાર્જ સર્વિસ કેટેગરી પર નિર્ભર.

**[સેલર ડેશબોર્ડ](/seller/dashboard)** માં લીડ પ્રાઇસિંગ જુઓ.`
    }
  },

  // ── Seller Dashboard / Seller Panel ─────────────────────────────
  {
    priority: 8,
    keywords: [
      'seller dashboard', 'my dashboard', 'seller panel', 'provider dashboard',
      'manage orders', 'seller account', 'seller profile', 'my seller',
      'working hours', 'slot capacity', 'slot management',
      'સેલર ડેશબોર્ડ', 'મારું ડેશબોર્ડ',
      'सेलर डैशबोर्ड', 'मेरा डैशबोर्ड'
    ],
    responses: {
      en: `📊 **Seller Dashboard Features**

As a registered seller, you can manage everything from your dashboard:
  • 📋 View & accept incoming orders
  • ⏰ Set working hours (e.g., 9 AM - 7 PM)
  • 📅 Configure slot capacity (jobs per day)
  • 💰 Track earnings & wallet balance
  • ⭐ Manage reviews & ratings
  • 📍 Update your service area & radius

Access your dashboard at **[Seller Dashboard](/seller/dashboard)**.`,
      hi: `📊 **सेलर डैशबोर्ड** — ऑर्डर मैनेज करें, कार्य समय सेट करें, स्लॉट क्षमता कॉन्फ़िगर करें, कमाई ट्रैक करें। **[डैशबोर्ड](/seller/dashboard)** पर जाएँ।`,
      gu: `📊 **સેલર ડેશબોર્ડ** — ઓર્ડર મેનેજ કરો, કાર્ય સમય સેટ કરો, સ્લોટ ક્ષમતા કૉન્ફિગર કરો, કમાણી ટ્રેક કરો. **[ડેશબોર્ડ](/seller/dashboard)** પર જાવ.`
    }
  },

  // ── Services List / What services (MEDIUM PRIORITY) ────────────
  {
    priority: 6,
    keywords: [
      'what services', 'which services', 'services offered', 'services available',
      'all services', 'service categories', 'service list',
      'કઈ સર્વિસ', 'કઈ સેવા', 'બધી સર્વિસ',
      'कौन सी सेवा', 'कौन सी सर्विस', 'सभी सेवा', 'सारी सर्विस'
    ],
    responses: {
      en: `🛠️ **QuickSeva Services Available:**
  • 🔧 Plumbing — leaks, pipe, tap repair
  • ⚡ Electrician — wiring, fan, switch
  • ❄️ AC Repair — gas refill, servicing
  • 🧹 Home Cleaning — deep clean, bathroom
  • 🪚 Carpentry — furniture, woodwork
  • 🎨 Painting — interior & exterior
  • 🐛 Pest Control — cockroach, termite
  • 🏠 Appliance Repair — fridge, washing machine

Browse all on **[Services Page](/services)**!`,
      hi: `🛠️ **क्विकसेवा सेवाएं:**
  • 🔧 प्लंबिंग • ⚡ इलेक्ट्रीशियन • ❄️ AC सर्विस
  • 🧹 होम क्लीनिंग • 🪚 कारपेंटरी • 🎨 पेंटिंग
  • 🐛 पेस्ट कंट्रोल • 🏠 अप्लायंस रिपेयर

सब देखें **[सर्विस पेज](/services)** पर!`,
      gu: `🛠️ **ક્વિકસેવા સેવાઓ:**
  • 🔧 પ્લમ્બિંગ • ⚡ ઇલેક્ટ્રિશિયન • ❄️ AC સર્વિસ
  • 🧹 ઘર સફાઈ • 🪚 કારપેન્ટ્રી • 🎨 પેઇન્ટિંગ
  • 🐛 Pest Control • 🏠 ઉપકરણ સમારકામ

**[સર્વિસ પેજ](/services)** પર જુઓ!`
    }
  },

  // ── Plumbing ────────────────────────────────────────────────────
  {
    priority: 7,
    keywords: ['plumber', 'plumbing', 'pipe leak', 'tap repair', 'pipe repair', 'plumber service',
      'નળ રિપેર', 'પાઇપ લીક', 'પ્લમ્બર', 'नल रिपेयर', 'पाइप लीक', 'प्लंबर सर्विस'],
    responses: {
      en: '🔧 **Plumbing Help?** Book verified plumbers for leaks, tap/pipe repair & more. Rates from ₹199. **[Book Now](/services)**.',
      hi: '🔧 **प्लंबिंग सेवा** — लीकेज, नल और पाइप रिपेयर के लिए **[यहाँ बुक करें](/services)**। ₹199 से शुरू।',
      gu: '🔧 **પ્લમ્બિંગ** — નળ, પાઇપ, લીક રિપેર. ₹199 થી. **[હવે બુક કરો](/services)**.'
    }
  },

  // ── Electrician ─────────────────────────────────────────────────
  {
    priority: 7,
    keywords: ['electrician', 'electrician service', 'wiring repair', 'fan repair', 'fan fitting',
      'switch repair', 'mcb repair', 'light repair', 'socket repair',
      'ઇલેક્ટ્રિશિયન', 'વાયરિંગ', 'पंखा रिपेयर', 'इलेक्ट्रीशियन सर्विस', 'बिजली रिपेयर'],
    responses: {
      en: '⚡ **Electrician needed?** Get certified electricians for wiring, fan fitting, MCB & switches. **[Book Now](/services)**.',
      hi: '⚡ **इलेक्ट्रीशियन सेवा** — वायरिंग, पंखा, MCB फिट करवाएं। **[बुक करें](/services)**।',
      gu: '⚡ **ઇલેક્ટ્રિશિયન** — વાયરિંગ, પંખો, સ્વીચ. **[બુક કરો](/services)**.'
    }
  },

  // ── AC Service ──────────────────────────────────────────────────
  {
    priority: 7,
    keywords: ['ac repair', 'ac service', 'air conditioner', 'ac gas refill', 'ac installation',
      'ac servicing', 'ac not cooling',
      'એસી રિપેર', 'એસી સર્વિસ', 'एसी रिपेयर', 'एसी सर्विस', 'एसी गैस'],
    responses: {
      en: '❄️ **AC Repair & Service** — Gas refill, deep service & installation from ₹499. **[Book Now](/services)**.',
      hi: '❄️ **AC सर्विस** — गैस रिफिल, जेट सर्विस, इंस्टॉलेशन। **[बुक करें](/services)**।',
      gu: '❄️ **AC સર્વિસ** — ગેસ રિફિલ, ઊંડી સર્વિસ. **[બુક કરો](/services)**.'
    }
  },

  // ── Cleaning ────────────────────────────────────────────────────
  {
    priority: 7,
    keywords: ['home cleaning', 'deep cleaning', 'house cleaning', 'bathroom cleaning',
      'kitchen cleaning', 'sofa cleaning', 'cleaning service',
      'ઘર સફાઈ', 'ક્લીનિંગ સર્વિસ', 'सफाई सर्विस', 'होम क्लीनिंग', 'डीप क्लीनिंग'],
    responses: {
      en: '🧹 **Home Cleaning** — Deep home clean, bathroom, sofa & more. **[Book Now](/services)**.',
      hi: '🧹 **होम क्लीनिंग** — डीप क्लीन, बाथरूम, सोफा सफाई। **[बुक करें](/services)**।',
      gu: '🧹 **ઘર સફાઈ** — ડીપ ક્લીન, બાથરૂમ, સોફા. **[બુક કરો](/services)**.'
    }
  },

  // ── Painting ────────────────────────────────────────────────────
  {
    priority: 7,
    keywords: ['home painting', 'wall painting', 'house painting', 'interior painting',
      'exterior painting', 'painting service', 'painter',
      'ઘર પેઇન્ટિંગ', 'પેઇન્ટર', 'घर पेंटिंग', 'पेंटर', 'पेंटिंग सर्विस'],
    responses: {
      en: '🎨 **Home Painting** — Interior & exterior painting at competitive rates. **[Book Now](/services)**.',
      hi: '🎨 **पेंटिंग सेवा** — इंटीरियर और एक्सटीरियर पेंटिंग। **[बुक करें](/services)**।',
      gu: '🎨 **ઘર પેઇન્ટિંગ** — અંદર અને બહારની પેઇન્ટિંગ. **[બુક કરો](/services)**.'
    }
  },

  // ── Pest Control ─────────────────────────────────────────────────
  {
    priority: 7,
    keywords: ['pest control', 'cockroach control', 'termite control', 'rat control',
      'mosquito control', 'pest treatment', 'insect control',
      'વંદો નિયંત્રણ', 'ઉધઈ', 'कॉकरोच कंट्रोल', 'दीमक', 'पेस्ट कंट्रोल सर्विस'],
    responses: {
      en: '🐛 **Pest Control Services** — Cockroach, termite, rodent & mosquito treatment. **[Book Now](/services)**.',
      hi: '🐛 **पेस्ट कंट्रोल** — कॉकरोच, दीमक, चूहे का उपचार। **[बुक करें](/services)**।',
      gu: '🐛 **Pest Control** — વંદો, ઉધઈ, ઉંદર. **[બુક કરો](/services)**.'
    }
  },

  // ── Carpentry ───────────────────────────────────────────────────
  {
    priority: 7,
    keywords: ['carpentry', 'carpenter', 'furniture repair', 'woodwork', 'door repair',
      'wardrobe repair', 'carpenter service',
      'કારપેન્ટ્રી', 'કડીયા', 'कारपेंटर', 'फर्नीचर रिपेयर', 'कारपेंटर सर्विस'],
    responses: {
      en: '🪚 **Carpentry** — Furniture repair, door fitting, woodwork & more. **[Book Now](/services)**.',
      hi: '🪚 **कारपेंटरी** — फर्नीचर रिपेयर, दरवाजा फिटिंग। **[बुक करें](/services)**।',
      gu: '🪚 **કારપેન્ટ્રી** — ફર્નિચર, દરવાજો, વુડ વર્ક. **[બુક કરો](/services)**.'
    }
  },

  // ── Appliance Repair ────────────────────────────────────────────
  {
    priority: 7,
    keywords: ['appliance repair', 'fridge repair', 'refrigerator repair', 'washing machine repair',
      'geyser repair', 'oven repair', 'microwave repair',
      'ફ્રિઝ રિપેર', 'ઉપકરણ', 'वॉशिंग मशीन रिपेयर', 'फ्रिज रिपेयर', 'गीजर रिपेयर'],
    responses: {
      en: '🏠 **Appliance Repair** — Fridge, washing machine, geyser & oven repair. **[Book Now](/services)**.',
      hi: '🏠 **अप्लायंस रिपेयर** — फ्रिज, वाशिंग मशीन, गीजर। **[बुक करें](/services)**।',
      gu: '🏠 **ઉપકરણ સમારકામ** — ફ્રિઝ, ઓવન, ગીઝર. **[બુક કરો](/services)**.'
    }
  },

  // ── Refund / Cancellation ────────────────────────────────────────
  {
    priority: 8,
    keywords: ['refund', 'cancel booking', 'cancellation', 'cancelled order', 'money back',
      'return money', 'refund policy', 'cancel my order',
      'રદ કરો', 'રીફંડ', 'ઓર્ડર રદ', 'कैंसल करो', 'रिफंड', 'ऑर्डर कैंसल', 'पैसे वापस'],
    responses: {
      en: `💰 **Cancellation & Refund Policy:**
  • Cancelled **before** provider accepts → 100% refund to wallet.
  • Cancelled **after** acceptance, before work starts → Partial refund (reviewed by team).
  • Cancelled **after work starts** → No refund.
  • Disputed orders → Contact support with booking ID.`,
      hi: `💰 **रिफंड नियम:**
  • स्वीकार से **पहले** रद्द → 100% रिफंड।
  • स्वीकार के **बाद**, काम शुरू से **पहले** → आंशिक रिफंड (समीक्षा के अधीन)।
  • काम शुरू होने के **बाद** रद्द → रिफंड नहीं।`,
      gu: `💰 **રીફંડ નિયમ:**
  • સ્વીકૃતિ **પહેલાં** રદ → 100% રીફંડ.
  • સ્વીકૃતિ **પછી**, કામ **પહેલાં** → આંશિક રીફંડ.
  • કામ **શરૂ પછી** રદ → રીફંડ નહીં.`
    }
  },

  // ── Pricing / Cost ─────────────────────────────────────────────
  {
    priority: 6,
    keywords: ['price of service', 'service cost', 'service charge', 'service rate', 'how much cost',
      'how much charge', 'service fee', 'pricing details', 'kitna charge',
      'સર્વિસ ભાવ', 'સર્વિસ ચાર્જ', 'कितना चार्ज', 'सर्विस रेट', 'सर्विस कीमत'],
    responses: {
      en: '💸 Pricing depends on the service and provider. Most services start from **₹199**. Check exact prices on each provider\'s profile at **[Services](/services)**.',
      hi: '💸 कीमत सर्विस और प्रोवाइडर पर निर्भर करती है। अधिकांश ₹199 से शुरू। **[सर्विस पेज](/services)** पर प्रोवाइडर प्रोफाइल देखें।',
      gu: '💸 ભાવ સર્વિસ અને કારીગર પ્રમાણે. ₹199 થી શરૂ. **[સર્વિસ પેજ](/services)** પર પ્રોફાઇલ જુઓ.'
    }
  },

  // ── Rating / Reviews ────────────────────────────────────────────
  {
    priority: 6,
    keywords: ['provider rating', 'service rating', 'review provider', 'provider reviews',
      'trusted provider', 'verified provider', 'good provider', 'rate service',
      'how to review', 'give rating',
      'રેટિંગ આપો', 'પ્રોવાઇડર રેટિંગ', 'प्रोवाइडर रेटिंग', 'समीक्षा देना'],
    responses: {
      en: '⭐ All providers on QuickSeva are background-verified and rated by real customers. Filter by ratings on **[Services](/services)** to find the best near you!',
      hi: '⭐ सभी प्रोवाइडर वेरिफाइड हैं और असली ग्राहकों ने रेट किए हैं। **[सर्विस पेज](/services)** पर रेटिंग फिल्टर करें।',
      gu: '⭐ QuickSeva ના બધા કારીગર ચકાસેલ છે. **[સર્વિસ પેજ](/services)** પર રેટિંગ ફિલ્ટર કરો.'
    }
  },

  // ── OTP / Login ──────────────────────────────────────────────────
  {
    priority: 7,
    keywords: ['otp login', 'how to login', 'sign in quickseva', 'create account', 'register account',
      'forgot password', 'otp not received', 'login problem', 'cannot login',
      'ક્વિકસેવા લૉગિન', 'OTP નથી આવતો', 'लॉगिन कैसे करें', 'OTP नहीं आया', 'अकाउंट बनाना'],
    responses: {
      en: '🔐 QuickSeva uses OTP-based login — no passwords needed! Enter your phone/email on the **[Login Page](/login)** and verify via OTP.',
      hi: '🔐 क्विकसेवा OTP आधारित लॉगिन उपयोग करता है। **[लॉगिन पेज](/login)** पर फोन/ईमेल डालें और OTP से वेरिफाई करें।',
      gu: '🔐 QuickSeva OTP-based login. **[Login Page](/login)** પર ફોન/ઈમેલ નાખો, OTP થી verify કરો.'
    }
  },

  // ── Wallet / Balance ─────────────────────────────────────────────
  {
    priority: 7,
    keywords: ['wallet balance', 'check balance', 'add money wallet', 'wallet recharge',
      'top up wallet', 'upi payment', 'payment method', 'how to pay',
      'વોલેટ બેલેન્સ', 'પૈસા ઉમેરો', 'बैलेंस चेक', 'वॉलेट में पैसे', 'पेमेंट कैसे'],
    responses: {
      en: '💳 Manage your QuickSeva Wallet in **[Profile → Wallet](/profile)**. Add money via UPI, Debit or Credit Card instantly!',
      hi: '💳 **[Profile → Wallet](/profile)** में UPI या कार्ड से पैसे जोड़ें।',
      gu: '💳 **[Profile → Wallet](/profile)** માં UPI કે કાર્ડ વડે પૈસા ઉમેરો.'
    }
  },

  // ── Become a Seller / Provider ──────────────────────────────────
  {
    priority: 7,
    keywords: ['become seller', 'become provider', 'register seller', 'seller registration',
      'how to become seller', 'join as seller', 'provider registration',
      'sell on quickseva', 'list my service',
      'સેલર બનવું', 'સેલર રજીસ્ટ્રેશન', 'सेलर बनना', 'सेलर रजिस्ट्रेशन', 'प्रोवाइडर बनना'],
    responses: {
      en: `💼 **Become a Service Provider on QuickSeva**
Register at **[Become a Seller](/become-seller)** in just 2 minutes!

**Benefits:** Zero listing fee, direct customer bookings, wallet-based instant payment, work in your area.
**Dashboard:** Manage orders, set working hours, configure slots, track earnings.`,
      hi: `💼 **सेलर बनें** — **[सेलर रजिस्ट्रेशन](/become-seller)** पर 2 मिनट में रजिस्टर करें! फ्री लिस्टिंग, डायरेक्ट बुकिंग, वॉलेट पेमेंट।`,
      gu: `💼 **સેલર બનો** — **[સેલર રજીસ્ટ્રેશન](/become-seller)** પર 2 મિનિટમાં રજીસ્ટર કરો! ફ્રી લિસ્ટિંગ, ડાયરેક્ટ બુકિંગ, વોલેટ પેમેન્ટ.`
    }
  },

  // ── Greetings ───────────────────────────────────────────────────
  {
    priority: 5,
    keywords: ['hello', 'hi', 'hey', 'good morning', 'good afternoon', 'good evening',
      'namaste', 'namaskar', 'kem cho',
      'નમસ્તે', 'કેમ છો', 'नमस्ते', 'नमस्कार'],
    responses: {
      en: '👋 Hello! Welcome to QuickSeva. I can help you book services, track orders, manage your wallet, or learn about becoming a seller/contractor. What would you like to know?',
      hi: '👋 नमस्ते! क्विकसेवा में स्वागत है। मैं सर्विस बुकिंग, ऑर्डर ट्रैकिंग, वॉलेट, या सेलर/ठेकेदार बनने में मदद कर सकता हूँ। क्या जानना चाहेंगे?',
      gu: '👋 નમસ્તે! ક્વિકસેવામાં સ્વાગત છે. સર્વિસ બુકિંગ, ઓર્ડર ટ્રેકિંગ, વોલેટ, કે સેલર/ઠેકેદાર બનવામાં મદદ કરી શકું. શું જાણવું છે?'
    }
  },

  // ── Thank You ───────────────────────────────────────────────────
  {
    priority: 5,
    keywords: ['thank you', 'thanks', 'thankyou', 'thank', 'dhanyavaad', 'shukriya',
      'આભાર', 'ધન્યવાદ', 'धन्यवाद', 'शुक्रिया'],
    responses: {
      en: '😊 You\'re welcome! Happy to help. If you need anything else, just ask or use the quick options below!',
      hi: '😊 आपका स्वागत है! अगर कुछ और जानना हो, तो पूछें या नीचे विकल्प चुनें!',
      gu: '😊 આપનું સ્વાગત છે! બીજું કંઈ જાણવું હોય, તો પૂછો કે નીચે વિકલ્પ પસંદ કરો!'
    }
  }
];
