const axios = require("axios");
const { pool } = require("../config/db");

// ─────────────────────────────────────────────────────────────────────────────
// Support Contact Constants
// ─────────────────────────────────────────────────────────────────────────────
const SUPPORT_EMAIL = "support@quickseva.com";
const SUPPORT_PHONE = "+91 98765 43210";
const SUPPORT_HOURS = "Mon-Sat, 9 AM - 7 PM";

// ─────────────────────────────────────────────────────────────────────────────
// Intent Detection Keywords
// ─────────────────────────────────────────────────────────────────────────────
const OFF_TOPIC_KEYWORDS = [
  'html', 'css', 'javascript', 'python', 'java', 'react', 'angular', 'vue',
  'nodejs', 'php', 'ruby', 'golang', 'rust', 'swift', 'kotlin', 'c++', 'c#',
  'coding', 'programming', 'developer', 'frontend', 'backend', 'framework',
  'algorithm', 'data structure', 'machine learning', 'blockchain', 'crypto',
  'bitcoin', 'nft', 'capital of', 'president of', 'prime minister',
  'who invented', 'history of', 'geography', 'physics', 'chemistry', 'biology',
  'mathematics', 'calculus', 'movie', 'film', 'song', 'music', 'game',
  'cricket', 'football', 'ipl', 'recipe', 'cook', 'weather', 'temperature',
  'forecast', 'news', 'stock market', 'share price', 'instagram', 'facebook',
  'twitter', 'tiktok', 'youtube', 'exam', 'syllabus', 'college', 'university',
  'homework', 'assignment', 'flight', 'train ticket', 'bus ticket',
  'hotel booking', 'uber', 'ola', 'zomato', 'swiggy', 'amazon', 'flipkart',
  'joke', 'poem', 'story', 'riddle', 'puzzle', 'what is love', 'meaning of life'
];

const QUICKSEVA_CONTEXT_KEYWORDS = [
  'quickseva', 'quick seva', 'booking', 'order', 'seller', 'provider',
  'contractor', 'plumber', 'electrician', 'carpenter', 'painter',
  'ac repair', 'cleaning', 'pest control', 'wallet', 'refund', 'service',
  'lead', 'payment', 'cancel', 'track', 'dashboard', 'otp', 'login',
  'nathi', 'nahi', 'nai', 'avto', 'avato', 'aavto', 'aavato', 'batav',
  'batave', 'dekhatu', 'jawab', 'javab'
];

// EXPLICIT status checking phrases ONLY — do not put generic words like 'seller' or 'booking' here
const EXPLICIT_STATUS_KEYWORDS = [
  'track order', 'track booking', 'order status', 'booking status',
  'where is my order', 'where is my booking', 'my order status', 'my booking status',
  'check order status', 'check booking status', 'status of my order', 'status of my booking',
  'ઓર્ડર સ્ટેટસ', 'બુકિંગ સ્ટેટસ', 'ઓર્ડર ટ્રેક', 'ઓર્ડર ક્યાં છે',
  'ऑर्डर स्थिति', 'बुकिंग स्थिति', 'ऑर्डर ट्रैक', 'मेरा ऑर्डर कहाँ है'
];

const COMPLAINT_KEYWORDS = [
  'didn\'t visit', 'did not visit', 'not visit', 'not come', 'didn\'t come', 'did not come',
  'nathi avya', 'nathi aavya', 'nathi avyo', 'nathi aavyo', 'nahi aaya', 'nahi aaye',
  'ask pin', 'asked pin', 'asking pin', 'otp', 'pin maang', 'pin mang', 'pin maangyo',
  'fake', 'cheat', 'fraud', 'done nothing', 'no work', 'kam nathi karyu', 'kaam nahi kiya',
  'refund', 'complaint', 'problem', 'issue', 'wrong', 'why', 'su kaam', 'kyon', 'kyu',
  'properly', 'answers not give', 'incorrect'
];

function isOffTopic(normalizedInput) {
  const hasQuickSevaContext = QUICKSEVA_CONTEXT_KEYWORDS.some((kw) =>
    normalizedInput.includes(kw)
  );
  if (hasQuickSevaContext) return false;
  return OFF_TOPIC_KEYWORDS.some((kw) => normalizedInput.includes(kw));
}

function isExplicitStatusRequest(normalizedInput) {
  return EXPLICIT_STATUS_KEYWORDS.some((kw) => normalizedInput.includes(kw));
}

function containsComplaintOrQuestion(normalizedInput) {
  return COMPLAINT_KEYWORDS.some((kw) => normalizedInput.includes(kw));
}

function buildOrderGuidanceReply(language, reason = "generic") {
  if (language === "gu") {
    if (reason === "no_orders") {
      return `હું સમજી શકું છું. આ એકાઉન્ટમાં હાલ કોઈ ઓર્ડર મળ્યો નથી.\n\n• તમે બુકિંગ કરેલું એ જ ફોન/ઈમેલથી login છો કે નહીં ચેક કરો.\n• **[My Bookings](/my-bookings)** પેજ refresh કરીને જુઓ.\n• Booking ID હોય તો અહીં મોકલો, હું ફરી ચેક કરીશ.\n\nતાત્કાલિક મદદ માટે ${SUPPORT_EMAIL} અથવા ${SUPPORT_PHONE} પર સંપર્ક કરો.`;
    }
    return `હું સમજી શકું છું. જો ઓર્ડર દેખાતો નથી અથવા પ્રોવાઇડરનો જવાબ નથી આવતો, તો પહેલા **[My Bookings](/my-bookings)** માં સ્ટેટસ ચેક કરો.\n\n• **Pending** હોય તો પ્રોવાઇડરે હજી accept કરવાનું બાકી છે.\n• ઓર્ડર દેખાતો ન હોય તો સાચા ફોન/ઈમેલથી login થયેલા છો કે નહીં ચેક કરો.\n• Booking ID હોય તો અહીં મોકલો, હું ચેક કરીશ.`;
  }

  if (language === "hi") {
    if (reason === "no_orders") {
      return `मैं समझ रहा हूँ। इस अकाउंट में अभी कोई ऑर्डर नहीं मिला।\n\n• जिस फोन/ईमेल से बुकिंग की थी उसी से login हैं या नहीं चेक करें।\n• **[My Bookings](/my-bookings)** पेज refresh करके देखें।\n• Booking ID हो तो यहाँ भेजें, मैं फिर चेक करूँगा।\n\nतुरंत मदद के लिए ${SUPPORT_EMAIL} या ${SUPPORT_PHONE} पर संपर्क करें।`;
    }
    return `मैं समझ रहा हूँ। अगर ऑर्डर नहीं दिख रहा या प्रोवाइडर का जवाब नहीं आ रहा, तो पहले **[My Bookings](/my-bookings)** में स्टेटस देखें।\n\n• **Pending** है तो प्रोवाइडर ने अभी accept नहीं किया है।\n• ऑर्डर नहीं दिख रहा हो तो सही फोन/ईमेल से login हैं या नहीं चेक करें।\n• Booking ID हो तो यहाँ भेजें, मैं चेक करूँगा।`;
  }

  if (reason === "no_orders") {
    return `I understand. I could not find any orders for this account right now.\n\n• Make sure you are logged in with the same phone/email used for booking.\n• Refresh **[My Bookings](/my-bookings)** and check again.\n• If you have a Booking ID, send it here and I will check again.\n\nFor urgent help, contact ${SUPPORT_EMAIL} or ${SUPPORT_PHONE}.`;
  }
  return `I understand. If your order is not showing or the provider has not replied, please first check **[My Bookings](/my-bookings)**.\n\n• If it is **Pending**, the provider has not accepted it yet.\n• If no order is visible, confirm you are logged in with the same phone/email used for booking.\n• If you have a Booking ID, send it here and I will check it.`;
}

// @desc    Process chatbot query with Gemini AI & Database integration
// @route   POST /api/chatbot/query
// @access  Public (Optional auth token)
exports.handleChatbotQuery = async (req, res) => {
  try {
    const { message, language = "en", history = [] } = req.body;

    if (!message || typeof message !== "string" || !message.trim()) {
      return res.status(400).json({
        success: false,
        message: "Message string is required",
      });
    }

    if (message.trim().length > 1000) {
      return res.status(400).json({
        success: false,
        message: "Message is too long. Please keep it under 1000 characters.",
      });
    }

    const cleanInput = message.trim();
    const normalizedInput = cleanInput.toLowerCase();
    const activeUserId = req.user?.id || null;

    // ── 0. Out-of-scope Pre-check ────────────────────────────────────────────
    if (isOffTopic(normalizedInput)) {
      let outOfScopeReply = "";
      if (language === "gu") {
        outOfScopeReply = `🤖 હું ક્વિકસેવાનો કસ્ટમર સપોર્ટ આસિસ્ટન્ટ છું. હું ફક્ત અમારા પ્લેટફોર્મ સંબંધિત પ્રશ્નોમાં મદદ કરી શકું છું — જેમ કે સર્વિસ બુક કરવી, ઓર્ડર ટ્રેક કરવો, વોલેટ, સેલર/ઠેકેદાર રજીસ્ટ્રેશન.\n\nઆ પૂછી શકો છો:\n  • 📦 બુકિંગ સ્ટેટસ\n  • 🛠️ ઉપલબ્ધ સેવાઓ\n  • 💼 સેલર કે ઠેકેદાર બનો\n  • 💰 વોલેટ અને પેમેન્ટ`;
      } else if (language === "hi") {
        outOfScopeReply = `🤖 मैं क्विकसेवा का कस्टमर सपोर्ट असिस्टेंट हूँ। मैं केवल हमारे प्लेटफ़ॉर्म से संबंधित प्रश्नों में मदद कर सकता हूँ — जैसे सेवाएं बुक करना, ऑर्डर ट्रैक करना, वॉलेट, सेलर/ठेकेदार रजिस्ट्रेशन।\n\nये पूछ सकते हैं:\n  • 📦 बुकिंग स्थिति\n  • 🛠️ उपलब्ध सेवाएं\n  • 💼 सेलर या ठेकेदार बनें\n  • 💰 वॉलेट और भुगतान`;
      } else {
        outOfScopeReply = `🤖 I'm QuickSeva's customer support assistant. I can only help with questions about our platform — like booking services, tracking orders, wallet & payments, seller/contractor registration.\n\nTry asking about:\n  • 📦 Booking or order status\n  • 🛠️ Available services\n  • 💼 Becoming a seller or contractor\n  • 💰 Wallet & payments`;
      }

      return res.json({
        success: true,
        reply: outOfScopeReply,
        source: "out_of_scope",
      });
    }

    // Check for Booking ID pattern (e.g. QS-20260826-LAAA or BK-102)
    const bookingIdMatch = cleanInput.match(/\b(QS-[\w-]+|BK-\d+)\b/i);
    const searchedCode = bookingIdMatch ? bookingIdMatch[0] : null;
    const isPureStatusRequest = isExplicitStatusRequest(normalizedInput);
    const hasComplaint = containsComplaintOrQuestion(normalizedInput);

    // ── 1. Pure Booking Status Card Intercept (Only if NOT a complex complaint) ───
    if ((searchedCode || isPureStatusRequest) && !hasComplaint) {
      try {
        let sql = `
          SELECT o.id, o.order_number, o.status, o.total_amount, o.created_at, s.business_name AS seller_name 
          FROM orders o 
          LEFT JOIN sellers s ON o.seller_id = s.id 
        `;
        let params = [];

        if (searchedCode) {
          const numericId = searchedCode.replace(/\D/g, "");
          sql += ` WHERE o.order_number LIKE ? OR o.id = ? LIMIT 1`;
          params = [`%${searchedCode}%`, numericId || 0];
        } else if (activeUserId) {
          sql += ` WHERE o.buyer_id = ? ORDER BY o.created_at DESC LIMIT 1`;
          params = [activeUserId];
        }

        if (params.length > 0) {
          const [orders] = await pool.query(sql, params);

          if (orders.length > 0) {
            const order = orders[0];
            const orderNum = order.order_number || `#BK-${order.id}`;
            const statusStr = order.status ? order.status.toUpperCase() : "PENDING";

            let reply = "";
            if (language === "gu") {
              reply = `📦 **ઓર્ડર વિગત (${orderNum})**\n• સ્થિતિ: **${statusStr}**\n• પ્રદાતા: ${order.seller_name || "નિયુક્ત કાર્યરત"}\n• રકમ: ₹${order.total_amount || 0}\n\nવધુ વિગત માટે **[My Bookings](/my-bookings)** જુઓ.`;
            } else if (language === "hi") {
              reply = `📦 **बुकिंग विवरण (${orderNum})**\n• स्थिति: **${statusStr}**\n• सेलर: ${order.seller_name || "कार्यरत"}\n• राशि: ₹${order.total_amount || 0}\n\nविस्तृत जानकारी के लिए **[My Bookings](/my-bookings)** देखें।`;
            } else {
              reply = `📦 **Booking Details (${orderNum})**\n• Status: **${statusStr}**\n• Provider: ${order.seller_name || "Assigned Provider"}\n• Amount: ₹${order.total_amount || 0}\n\nView details under **[My Bookings](/my-bookings)**.`;
            }

            return res.json({ success: true, reply, source: "database" });

          } else if (searchedCode) {
            let notFoundReply = "";
            if (language === "gu") {
              notFoundReply = `❌ બુકિંગ ID **${searchedCode}** સિસ્ટમમાં મળ્યો નથી. કૃપા કરીને સાચો બુકિંગ નંબર ચકાસો અથવા **[My Bookings](/my-bookings)** પર જુઓ.`;
            } else if (language === "hi") {
              notFoundReply = `❌ बुकिंग आईडी **${searchedCode}** नहीं मिला। कृपया अपनी सही आईडी **[My Bookings](/my-bookings)** में देखें।`;
            } else {
              notFoundReply = `❌ Booking ID **${searchedCode}** was not found. Please verify your code under **[My Bookings](/my-bookings)**.`;
            }
            return res.json({ success: true, reply: notFoundReply, source: "database" });
          }
        }
      } catch (dbErr) {
        console.warn("Chatbot DB order lookup failed:", dbErr.message);
      }
    }

    // ── 2. Wallet Balance Query ──────────────────────────────────────────────
    if (activeUserId && (normalizedInput.includes("wallet") || normalizedInput.includes("balance") || normalizedInput.includes("વોલેટ") || normalizedInput.includes("બેલેન્સ"))) {
      try {
        const [users] = await pool.query(
          `SELECT wallet_balance FROM users WHERE id = ?`,
          [activeUserId]
        );

        if (users.length > 0) {
          const balance = users[0].wallet_balance || 0;
          let balanceReply = "";

          if (language === "gu") {
            balanceReply = `💰 તમારા **ક્વિકસેવા વોલેટ** માં હાલમાં **₹${balance}** ઉપલબ્ધ છે. રકમ ઉમેરવા **[Profile](/profile)** પર જાવ.`;
          } else if (language === "hi") {
            balanceReply = `💰 आपके **QuickSeva Wallet** में वर्तमान बैलेंस **₹${balance}** है। बैलेंस जोड़ने के लिए **[Profile](/profile)** पर जाएँ।`;
          } else {
            balanceReply = `💰 Your current **QuickSeva Wallet** balance is **₹${balance}**. Manage funds in **[Profile](/profile)**.`;
          }

          return res.json({ success: true, reply: balanceReply, source: "database" });
        }
      } catch (dbErr) {
        console.warn("Chatbot DB wallet query failed:", dbErr.message);
      }
    }

    // ── 3. Build Authenticated User Context for AI ─────────────────────────────
    let userContextText = "";
    if (activeUserId) {
      try {
        const [userOrders] = await pool.query(
          `SELECT o.id, o.order_number, o.status, o.total_amount, o.created_at, 
                  s.business_name AS seller_name, sv.name AS service_name
           FROM orders o 
           LEFT JOIN sellers s ON o.seller_id = s.id 
           LEFT JOIN services sv ON o.service_id = sv.id
           WHERE o.buyer_id = ? 
           ORDER BY o.created_at DESC 
           LIMIT 3`,
          [activeUserId]
        );

        const [userRows] = await pool.query(
          `SELECT wallet_balance, name FROM users WHERE id = ?`,
          [activeUserId]
        );
        const balance = userRows[0]?.wallet_balance || 0;
        const userName = userRows[0]?.name || "Customer";

        userContextText += `\n=== LOGGED-IN USER CONTEXT ===\nCustomer Name: ${userName}\nWallet Balance: ₹${balance}\n`;
        if (userOrders.length > 0) {
          userContextText += `Recent Bookings:\n` + userOrders.map((o, i) =>
            `${i + 1}. Booking ID: ${o.order_number || 'BK-' + o.id} | Status: ${o.status ? o.status.toUpperCase() : 'PENDING'} | Service: ${o.service_name || 'Service'} | Provider: ${o.seller_name || 'Assigned Provider'} | Amount: ₹${o.total_amount || 0}`
          ).join("\n");
        } else {
          userContextText += `Recent Bookings: None\n`;
        }
      } catch (ctxErr) {
        console.warn("Failed to fetch user context for AI prompt:", ctxErr.message);
      }
    }

    // ── 4. Gemini AI Processing (Token-Optimized with Quota Guard) ────────────
    const geminiKey = process.env.GEMINI_API_KEY;
    if (geminiKey) {
      try {
        const langName = language === "gu" ? "Gujarati" : language === "hi" ? "Hindi" : "English";
        
        // Token Optimization: Limit history to last 8 turns and max 300 chars per message
        const recentHistory = Array.isArray(history)
          ? history
            .slice(-8)
            .filter((item) => item && typeof item.text === "string")
            .map((item) => ({
              role: item.role === "assistant" ? "assistant" : "user",
              text: item.text.slice(0, 300),
            }))
          : [];

        const conversationContext = recentHistory.length
          ? recentHistory.map((item) => `${item.role}: ${item.text}`).join("\n")
          : "No previous messages.";

        const QUICKSEVA_CONTEXT = `
You are QuickSeva Customer Support Assistant — a helpful, friendly, and professional support bot for QuickSeva, a hyper-local service marketplace in Gujarat, India.

${userContextText}

=== CRITICAL RULES (MUST FOLLOW) ===
1. You ONLY answer questions related to QuickSeva platform, its services, features, users, bookings, payments, sellers, contractors, and operations.
2. If a user asks about ANYTHING not related to QuickSeva, politely decline: "I'm QuickSeva's customer support assistant. I can only help with our platform's services, bookings, wallet, seller/contractor registration, and related features."
3. NEVER make up features, services, or fake info not in this context.
4. ALWAYS reply strictly in ${langName} language.
5. Keep responses concise, clear, and helpful (max 100 words).
6. When relevant, include markdown links like [Services](/services) or [My Bookings](/my-bookings).
7. If user asks general feature questions (e.g. "can you find me seller and booking?"), explain how QuickSeva connects customers to local sellers clearly.
8. If user complains that provider didn't visit home or asked for completion PIN/OTP before work is done:
   - Warn user: "⚠️ NEVER share your completion PIN/OTP unless work is completely done and inspected by you."
   - State that asking for PIN without doing work is against QuickSeva policy.
   - Instruct user to contact support immediately at ${SUPPORT_EMAIL} or call ${SUPPORT_PHONE} with their Booking ID for investigation/refund.
9. Refer to the user's specific Booking ID from recent context or conversation history. Never confuse order IDs.
10. If user asks why answers were not proper previously, apologize politely and answer their question directly.

=== ABOUT QUICKSEVA ===
QuickSeva is a hyper-local service marketplace in Gujarat, India.
Services: Plumbing (₹199+), Electrician (₹199+), AC Service (₹499+), Cleaning, Carpentry, Painting, Pest Control, Appliance Repair.
Roles: Buyer (book & track), Seller (offer services), Contractor (large projects, WhatsApp leads), Admin.
Booking flow: Browse /services → select provider & slot → pay via Wallet/UPI → track at /my-bookings.
Status flow: Pending → Accepted → In Progress → Completed / Cancelled.
Refund policy: 100% refund before acceptance; review after acceptance; contact support for disputes.
Support contact: Email: ${SUPPORT_EMAIL} | Phone: ${SUPPORT_PHONE} (${SUPPORT_HOURS})
`;

        const prompt = `${QUICKSEVA_CONTEXT}

Recent conversation:
${conversationContext}

User question: "${cleanInput}"

Reply in ${langName}:`;

        const geminiRes = await axios.post(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiKey}`,
          { contents: [{ parts: [{ text: prompt }] }] },
          { timeout: 10000 }
        );

        const aiText = geminiRes.data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (aiText) {
          return res.json({ success: true, reply: aiText.trim(), source: "gemini_ai" });
        }
      } catch (geminiErr) {
        console.warn("Gemini API call fallback to local rule engine:", geminiErr.response?.data?.error?.message || geminiErr.message);
      }
    }

    // ── 5. Enhanced Local Fallback ──────────────────────────────────────────────
    let fallbackText = "";
    if (hasComplaint) {
      if (language === "gu") {
        fallbackText = `⚠️ **મહત્વપૂર્ણ સુરક્ષા ગાઈડલાઈન:**\nજો કાર્યકરે કામ કર્યા વિના PIN/OTP માગ્યો હોય, તો PIN આપશો નહીં.\n\nકૃપા કરીને બુકિંગ વિગત સાથે અમારા સપોર્ટ નંબર **${SUPPORT_PHONE}** અથવા ઈમેલ **${SUPPORT_EMAIL}** પર તાત્કાલિક સંપર્ક કરો. અમે તપાસ કરીને મદદ કરીશું.`;
      } else if (language === "hi") {
        fallbackText = `⚠️ **महत्वपूर्ण सुरक्षा नियम:**\nअगर सेलर ने काम किए बिना PIN/OTP मांगा है, तो PIN बिल्कुल न दें।\n\nकृपया अपनी बुकिंग आईडी के साथ **${SUPPORT_EMAIL}** या **${SUPPORT_PHONE}** पर तुरंत संपर्क करें। हम इसकी जांच करेंगे।`;
      } else {
        fallbackText = `⚠️ **Important Security Warning:**\nDo NOT share your completion PIN/OTP if the provider did not visit or complete the work.\n\nPlease contact support immediately at **${SUPPORT_EMAIL}** or call **${SUPPORT_PHONE}** with your Booking ID so we can investigate and assist you.`;
      }
    } else {
      if (language === "gu") {
        fallbackText = `🤖 ક્વિકસેવામાં આપનું સ્વાગત છે! આપ કસ્ટમર કેર સંપર્ક કરી શકો છો:\n\n📧 **ઈમેલ**: ${SUPPORT_EMAIL}\n📱 **ફોન**: ${SUPPORT_PHONE} (${SUPPORT_HOURS})\n\n**અથવા વિકલ્પ પસંદ કરો:**\n  • 📦 ઓર્ડર ટ્રેકિંગ ([My Bookings](/my-bookings))\n  • 💰 વોલેટ અને રીફંડ\n  • 🛠️ સેવાઓ (પ્લમ્બર, ઇલેક્ટ્રિશિયન, AC)\n  • 💼 સેલર કે ઠેકેદાર રજીસ્ટ્રેશન`;
      } else if (language === "hi") {
        fallbackText = `🤖 क्विकसेवा में आपका स्वागत है! सहायता के लिए संपर्क करें:\n\n📧 **ईमेल**: ${SUPPORT_EMAIL}\n📱 **हेल्पलाइन**: ${SUPPORT_PHONE} (${SUPPORT_HOURS})\n\n**या विकल्प चुनें:**\n  • 📦 बुकिंग स्थिति ([My Bookings](/my-bookings))\n  • 💰 वॉलेट और रिफंड\n  • 🛠️ सेवाएं\n  • 💼 सेलर/ठेकेदार रजिस्ट्रेशन`;
      } else {
        fallbackText = `🤖 Welcome to QuickSeva! How we can help you:\n\n📧 **Email**: ${SUPPORT_EMAIL}\n📱 **Helpline**: ${SUPPORT_PHONE} (${SUPPORT_HOURS})\n\n**Or choose a topic:**\n  • 📦 Track bookings & order status ([My Bookings](/my-bookings))\n  • 💰 Wallet & refund policy\n  • 🛠️ Home services\n  • 💼 Register as Provider or Contractor`;
      }
    }

    return res.json({ success: true, reply: fallbackText, source: "local_fallback" });

  } catch (error) {
    console.error("Chatbot controller error:", error);
    return res.status(500).json({
      success: false,
      message: "Chatbot processing error",
    });
  }
};


exports.handleChatbotHealth = async (req, res) => {
  const geminiConfigured = Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.trim());
  let databaseConnected = false;

  try {
    await pool.query("SELECT 1");
    databaseConnected = true;
  } catch (err) {
    databaseConnected = false;
  }

  return res.json({
    success: true,
    geminiConfigured,
    databaseConnected,
    mode: geminiConfigured ? "ai_enabled" : "local_fallback_only",
  });
};
