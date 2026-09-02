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

      become_seller: `💼 **Join QuickSeva as a Service Provider**
- Are you an electrician, plumber, carpenter, painter, AC technician, or pest control specialist?
- List your services and start getting direct bookings from local customers!
- **[Register as a Seller](/become-seller)** — takes less than 2 minutes.

**Benefits:**
  • Zero listing fee
  • Direct customer bookings
  • Wallet-based instant payment
  • Work in your own area & radius`,

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

      fallback: `I can help you with:
  • 📦 Tracking bookings
  • 💰 Wallet & refund queries
  • 🛠️ Finding services (Plumber, Electrician, AC, Cleaning & more)
  • 💼 Registering as a service provider
  • 📞 Contacting support

Select an option below or type your question in Gujarati, Hindi, or English!`
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
    backToMenu: '🔙 मुख्य मेनू',
    typing: 'क्विकसेवा बोट टाइप कर रहा है...',
    poweredBy: 'क्विकसेवा कस्टमर सहायता • गुजराती, हिंदी, अंग्रेजी',

    options: [
      { id: 'track_booking', label: 'मेरी बुकिंग ट्रैक करें', icon: 'PackageSearch' },
      { id: 'wallet_refund', label: 'वॉलेट और रिफंड सहायता', icon: 'Wallet' },
      { id: 'how_to_book', label: 'सर्विस कैसे बुक करें', icon: 'BookOpen' },
      { id: 'become_seller', label: 'सेलर / सर्विस प्रोवाइडर बनें', icon: 'Briefcase' },
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
  • अपने क्षेत्र में काम करें`,

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

      fallback: `मैं इन विषयों में मदद कर सकता हूँ:
  • 📦 बुकिंग ट्रैक करना
  • 💰 वॉलेट और रिफंड
  • 🛠️ सर्विस (प्लंबर, इलेक्ट्रीशियन, AC और अधिक)
  • 💼 सेलर रजिस्ट्रेशन
  • 📞 कस्टमर सपोर्ट

नीचे विकल्प चुनें या गुजराती, हिंदी या अंग्रेजी में सवाल पूछें!`
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
    backToMenu: '🔙 મુખ્ય મેનૂ',
    typing: 'ક્વિકસેવા બોટ ટાઇપ કરી રહ્યું છે...',
    poweredBy: 'ક્વિકસેવા કસ્ટમર સપોર્ટ • ગુજરાતી, હિન્દી, અંગ્રેજી',

    options: [
      { id: 'track_booking', label: 'મારો ઓર્ડર સ્ટેટસ તપાસો', icon: 'PackageSearch' },
      { id: 'wallet_refund', label: 'વોલેટ અને રીફંડ મદદ', icon: 'Wallet' },
      { id: 'how_to_book', label: 'સર્વિસ કેવી રીતે બુક કરવી', icon: 'BookOpen' },
      { id: 'become_seller', label: 'આપણી સર્વિસ રજીસ્ટર કરો', icon: 'Briefcase' },
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
  • પોતાના વિસ્તારમાં કામ`,

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

      fallback: `હું આ બાબતોમાં મદદ કરી શકું છું:
  • 📦 ઓર્ડર ટ્રેકિંગ
  • 💰 વોલેટ અને રીફંડ
  • 🛠️ સેવાઓ (પ્લમ્બર, ઇલેક્ટ્રિશિયન, AC, સફાઈ)
  • 💼 સેલર તરીકે નોંધણી
  • 📞 કસ્ટમર સપોર્ટ

નીચે વિકલ્પ પસંદ કરો અથવા ગુજરાતી, હિન્દી કે અંગ્રેજીમાં પ્રશ્ન પૂછો!`
    }
  }
};

// ─────────────────────────────────────────────────────────────────
// EXPANDED Keyword Matching Rules (Local Smart Engine)
// Covers: services, pricing, rating, categories, booking help,
//         refunds, cancellation, registration, contact & more
// ─────────────────────────────────────────────────────────────────
export const KEYWORD_RULES = [

  // ── Services List / What services ──────────────────────────────
  {
    keywords: [
      'service', 'services', 'what services', 'which services', 'available',
      'સર્વિસ', 'સેવા', 'ઉપલબ્ધ', 'सेवा', 'सर्विस', 'क्या सर्विस', 'जानना', 'जानकारी',
      'know more', 'tell me', 'more service', 'list', 'show services'
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
    keywords: ['plumber', 'plumbing', 'pipe', 'tap', 'leak', 'water', 'drain',
      'નળ', 'પાઇપ', 'લીક', 'પ્લમ્બર', 'नल', 'पाइप', 'प्लंबर', 'लीकेज'],
    responses: {
      en: '🔧 **Plumbing Help?** Book verified plumbers for leaks, tap/pipe repair & more. Rates from ₹199. **[Book Now](/services)**.',
      hi: '🔧 **प्लंबिंग सेवा** — लीकेज, नल और पाइप रिपेयर के लिए **[यहाँ बुक करें](/services)**। ₹199 से शुरू।',
      gu: '🔧 **પ્લમ્બિંગ** — નળ, પાઇપ, લીક રિપેર. ₹199 થી. **[હવે બુક કરો](/services)**.'
    }
  },

  // ── Electrician ─────────────────────────────────────────────────
  {
    keywords: ['electrician', 'electric', 'wiring', 'fan', 'switch', 'light', 'mcb', 'socket', 'power',
      'ઇલેક્ટ્રિશિયન', 'લાઈટ', 'વાયરિંગ', 'पावर', 'बिजली', 'इलेक्ट्रीशियन', 'वायरिंग'],
    responses: {
      en: '⚡ **Electrician needed?** Get certified electricians for wiring, fan fitting, MCB & switches. **[Book Now](/services)**.',
      hi: '⚡ **इलेक्ट्रीशियन सेवा** — वायरिंग, पंखा, MCB फिट करवाएं। **[बुक करें](/services)**।',
      gu: '⚡ **ઇલેક્ટ્રિશિયન** — વાયરિંગ, પંખો, સ્વીચ. **[બુક કરો](/services)**.'
    }
  },

  // ── AC Service ──────────────────────────────────────────────────
  {
    keywords: ['ac', 'air conditioner', 'cooling', 'gas', 'refill', 'ac repair', 'ac service',
      'એસી', 'ઠંડક', 'गर्मी', 'एसी', 'कूलिंग', 'एसी सर्विस'],
    responses: {
      en: '❄️ **AC Repair & Service** — Gas refill, deep service & installation from ₹499. **[Book Now](/services)**.',
      hi: '❄️ **AC सर्विस** — गैस रिफिल, जेट सर्विस, इंस्टॉलेशन। **[बुक करें](/services)**।',
      gu: '❄️ **AC સર્વિસ** — ગેસ રિફિલ, ઊંડી સર્વિસ. **[બુક કરો](/services)**.'
    }
  },

  // ── Cleaning ────────────────────────────────────────────────────
  {
    keywords: ['cleaning', 'clean', 'sweep', 'mop', 'bathroom', 'kitchen', 'sofa', 'deep clean',
      'સફાઈ', 'ક્લીનિંગ', 'सफाई', 'क्लीनिंग', 'झाड़ू', 'बाथरूम'],
    responses: {
      en: '🧹 **Home Cleaning** — Deep home clean, bathroom, sofa & more. **[Book Now](/services)**.',
      hi: '🧹 **होम क्लीनिंग** — डीप क्लीन, बाथरूम, सोफा सफाई। **[बुक करें](/services)**।',
      gu: '🧹 **ઘર સફાઈ** — ડીપ ક્લીન, બાથરૂમ, સોફા. **[બુક કરો](/services)**.'
    }
  },

  // ── Painting ────────────────────────────────────────────────────
  {
    keywords: ['painting', 'paint', 'wall', 'color', 'colour', 'interior', 'exterior',
      'પેઇન્ટિંગ', 'रंगाई', 'पेंटिंग', 'दीवार'],
    responses: {
      en: '🎨 **Home Painting** — Interior & exterior painting at competitive rates. **[Book Now](/services)**.',
      hi: '🎨 **पेंटिंग सेवा** — इंटीरियर और एक्सटीरियर पेंटिंग। **[बुक करें](/services)**।',
      gu: '🎨 **ઘર પેઇન્ટિંગ** — અંદર અને બહારની પેઇન્ટિંગ. **[બુક કરો](/services)**.'
    }
  },

  // ── Pest Control ─────────────────────────────────────────────────
  {
    keywords: ['pest', 'cockroach', 'termite', 'rat', 'mosquito', 'ant', 'insect', 'bug',
      'pest control', 'વંદો', 'ઉધઈ', 'कॉकरोच', 'दीमक'],
    responses: {
      en: '🐛 **Pest Control Services** — Cockroach, termite, rodent & mosquito treatment. **[Book Now](/services)**.',
      hi: '🐛 **पेस्ट कंट्रोल** — कॉकरोच, दीमक, चूहे का उपचार। **[बुक करें](/services)**।',
      gu: '🐛 **Pest Control** — વંદો, ઉધઈ, ઉંદર. **[બુક કરો](/services)**.'
    }
  },

  // ── Carpentry ───────────────────────────────────────────────────
  {
    keywords: ['carpentry', 'carpenter', 'furniture', 'wood', 'door', 'window', 'shelf', 'wardrobe',
      'કારપેન્ટ્રી', 'कारपेंटर', 'फर्नीचर'],
    responses: {
      en: '🪚 **Carpentry** — Furniture repair, door fitting, woodwork & more. **[Book Now](/services)**.',
      hi: '🪚 **कारपेंटरी** — फर्नीचर रिपेयर, दरवाजा फिटिंग। **[बुक करें](/services)**।',
      gu: '🪚 **કારપેન્ટ્રી** — ફર્નિચર, દરવાજો, વુડ વર્ક. **[બુક કરો](/services)**.'
    }
  },

  // ── Appliance Repair ────────────────────────────────────────────
  {
    keywords: ['appliance', 'fridge', 'refrigerator', 'washing machine', 'geyser', 'oven', 'microwave', 'repair',
      'ફ્રિઝ', 'वॉशिंग मशीन', 'फ्रिज', 'गीजर'],
    responses: {
      en: '🏠 **Appliance Repair** — Fridge, washing machine, geyser & oven repair. **[Book Now](/services)**.',
      hi: '🏠 **अप्लायंस रिपेयर** — फ्रिज, वाशिंग मशीन, गीजर। **[बुक करें](/services)**।',
      gu: '🏠 **ઉપકરણ સમારકામ** — ફ્રિઝ, ઓવન, ગીઝર. **[બુક કરો](/services)**.'
    }
  },

  // ── Refund / Cancellation ────────────────────────────────────────
  {
    keywords: ['refund', 'cancel', 'cancellation', 'cancelled', 'money back', 'return money',
      'રદ', 'રીફંડ', 'कैंसल', 'रिफंड', 'पैसे वापस'],
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
    keywords: ['price', 'cost', 'charge', 'rate', 'fee', 'how much', 'kitna', 'charges',
      'ભાવ', 'ચાર્જ', 'कितना', 'रेट', 'चार्ज', 'कीमत'],
    responses: {
      en: '💸 Pricing depends on the service and provider. Most services start from **₹199**. Check exact prices on each provider\'s profile at **[Services](/services)**.',
      hi: '💸 कीमत सर्विस और प्रोवाइडर पर निर्भर करती है। अधिकांश ₹199 से शुरू। **[सर्विस पेज](/services)** पर प्रोवाइडर प्रोफाइल देखें।',
      gu: '💸 ભાવ સર્વિસ અને કારીગર પ્રમાણે. ₹199 થી શરૂ. **[સર્વિસ પેજ](/services)** પર પ્રોફાઇલ જુઓ.'
    }
  },

  // ── Rating / Reviews ────────────────────────────────────────────
  {
    keywords: ['rating', 'review', 'trusted', 'verified', 'good provider', 'best', 'stars',
      'રેટિંગ', 'रेटिंग', 'समीक्षा', 'विश्वसनीय'],
    responses: {
      en: '⭐ All providers on QuickSeva are background-verified and rated by real customers. Filter by ratings on **[Services](/services)** to find the best near you!',
      hi: '⭐ सभी प्रोवाइडर वेरिफाइड हैं और असली ग्राहकों ने रेट किए हैं। **[सर्विस पेज](/services)** पर रेटिंग फिल्टर करें।',
      gu: '⭐ QuickSeva ના બધા કારીગર ચકાસેલ છે. **[સર્વિસ પેજ](/services)** પર રેટિંગ ફિલ્ટર કરો.'
    }
  },

  // ── OTP / Login ──────────────────────────────────────────────────
  {
    keywords: ['otp', 'login', 'sign in', 'register', 'signup', 'account', 'password', 'forgot',
      'OTP', 'લૉગિન', 'لاگin', 'लॉगिन', 'पासवर्ड'],
    responses: {
      en: '🔐 QuickSeva uses OTP-based login — no passwords needed! Enter your phone/email on the **[Login Page](/login)** and verify via OTP.',
      hi: '🔐 क्विकसेवा OTP आधारित लॉगिन उपयोग करता है। **[लॉगिन पेज](/login)** पर फोन/ईमेल डालें और OTP से वेरिफाई करें।',
      gu: '🔐 QuickSeva OTP-based login. **[Login Page](/login)** પર ફોન/ઈમેલ નાખો, OTP થી verify કરો.'
    }
  },

  // ── Wallet / Balance ─────────────────────────────────────────────
  {
    keywords: ['wallet', 'balance', 'add money', 'recharge', 'top up', 'upi', 'payment',
      'વોલેટ', 'बैलेंस', 'वॉलेट', 'पेमेंट', 'UPI'],
    responses: {
      en: '💳 Manage your QuickSeva Wallet in **[Profile → Wallet](/profile)**. Add money via UPI, Debit or Credit Card instantly!',
      hi: '💳 **[Profile → Wallet](/profile)** में UPI या कार्ड से पैसे जोड़ें।',
      gu: '💳 **[Profile → Wallet](/profile)** માં UPI કે કાર્ડ વડે પૈસા ઉમેરો.'
    }
  }
];
