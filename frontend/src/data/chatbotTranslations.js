import { en } from './translations/en';
import { hi } from './translations/hi';
import { gu } from './translations/gu';

export const LANGUAGES = [
  { code: 'en', label: 'English', flag: '🇬🇧', scriptName: 'English' },
  { code: 'hi', label: 'हिंदी', flag: '🇮🇳', scriptName: 'Hindi' },
  { code: 'gu', label: 'ગુજરાતી', flag: '🇮🇳', scriptName: 'Gujarati' }
];

export const TRANSLATIONS = { en, hi, gu };

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
  },

  // ── Main Menu / Options ─────────────────────────────────────────
  {
    priority: 10,
    showOptions: true,
    keywords: [
      'menu', 'main menu', 'show menu', 'where is menu', 'menu option',
      'options', 'help options', 'help topics', 'quick help', 'all options',
      'મેનૂ', 'મેનુ', 'મેન્યુ', 'મેનુ બતાવો', 'વિકલ્પો',
      'मेनू', 'मेन्यू', 'मेनू दिखाओ', 'विकल्प'
    ],
    responses: {
      en: '⚡ **Quick Help Options:**\nPlease select a topic from the list below or type your query:',
      hi: '⚡ **त्वरित सहायता विकल्प:**\nकृपया नीचे दी गई सूची से एक विषय चुनें या अपना प्रश्न टाइप करें:',
      gu: '⚡ **ઝડપી મદદ વિકલ્પો:**\nકૃપા કરીને નીચે આપેલી યાદીમાંથી વિષય પસંદ કરો અથવા તમારો પ્રશ્ન ટાઈપ કરો:'
    }
  }
];
