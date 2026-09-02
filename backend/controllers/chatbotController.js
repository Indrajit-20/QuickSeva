const axios = require("axios");
const { pool } = require("../config/db");

// @desc    Process chatbot query with optional Gemini AI & Database integration
// @route   POST /api/chatbot/query
// @access  Public (Optional auth token)
exports.handleChatbotQuery = async (req, res) => {
  try {
    const { message, language = "en", userId = null, userName = null } = req.body;

    if (!message || typeof message !== "string" || !message.trim()) {
      return res.status(400).json({
        success: false,
        message: "Message string is required",
      });
    }

    const cleanInput = message.trim();
    const normalizedInput = cleanInput.toLowerCase();
    const activeUserId = req.user?.id || userId;

    // Detect Booking ID formats (e.g. QS-20260826-LAAA, BK-1024, or string starting with QS- or BK-)
    const bookingIdMatch = cleanInput.match(/(QS-[\w-]+|BK-\d+|\b\d{4,}\b)/i);
    const searchedCode = bookingIdMatch ? bookingIdMatch[0] : null;

    // 1. Order Status / Booking ID Lookup
    if (searchedCode || normalizedInput.includes("order") || normalizedInput.includes("booking") || normalizedInput.includes("ઓર્ડર") || normalizedInput.includes("બુકિંગ")) {
      try {
        let sql = `
          SELECT o.id, o.order_number, o.status, o.total_amount, o.created_at, s.business_name AS seller_name 
          FROM orders o 
          LEFT JOIN sellers s ON o.seller_id = s.id 
        `;
        let params = [];

        if (searchedCode) {
          // Extract numeric ID if searching BK-123
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
            const sellerInfo = order.seller_name ? ` (${order.seller_name})` : "";
            const priceInfo = order.total_amount ? ` (Amount: ₹${order.total_amount})` : "";

            let reply = "";
            if (language === "gu") {
              reply = `📦 **ઓર્ડર વિગત (${orderNum})**\n• સ્થિતિ: **${statusStr}**\n• પ્રદાતા: ${order.seller_name || "નિયુક્ત કાર્યરત"}\n• રકમ: ₹${order.total_amount || 0}\n\nવધુ વિગત માટે **[My Bookings](/my-bookings)** જુઓ.`;
            } else if (language === "hi") {
              reply = `📦 **बुकिंग विवरण (${orderNum})**\n• स्थिति: **${statusStr}**\n• सेलर: ${order.seller_name || "कार्यरत"}\n• राशि: ₹${order.total_amount || 0}\n\nविस्तृत जानकारी के लिए **[My Bookings](/my-bookings)** देखें।`;
            } else {
              reply = `📦 **Booking Details (${orderNum})**\n• Status: **${statusStr}**\n• Provider: ${order.seller_name || "Assigned Provider"}\n• Amount: ₹${order.total_amount || 0}\n\nView details under **[My Bookings](/my-bookings)**.`;
            }

            return res.json({
              success: true,
              reply,
              source: "database",
            });
          } else if (searchedCode) {
            let notFoundReply = "";
            if (language === "gu") {
              notFoundReply = `❌ બુકિંગ ID **${searchedCode}** સિસ્ટમમાં મળ્યો નથી. કૃપા કરીને સાચો બુકિંગ નંબર ચકાસો અથવા **[My Bookings](/my-bookings)** પર જુઓ.`;
            } else if (language === "hi") {
              notFoundReply = `❌ बुकिंग आईडी **${searchedCode}** नहीं मिला। कृपया अपनी सही आईडी **[My Bookings](/my-bookings)** में देखें।`;
            } else {
              notFoundReply = `❌ Booking ID **${searchedCode}** was not found. Please verify your code under **[My Bookings](/my-bookings)**.`;
            }

            return res.json({
              success: true,
              reply: notFoundReply,
              source: "database",
            });
          }
        }
      } catch (dbErr) {
        console.warn("Chatbot DB order lookup failed:", dbErr.message);
      }
    }

    // 2. Wallet Balance Query
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

          return res.json({
            success: true,
            reply: balanceReply,
            source: "database",
          });
        }
      } catch (dbErr) {
        console.warn("Chatbot DB wallet query failed:", dbErr.message);
      }
    }

    // 3. Gemini 1.5 Flash Free API Call (if GEMINI_API_KEY is configured in .env)
    const geminiKey = process.env.GEMINI_API_KEY;
    if (geminiKey) {
      try {
        const langName = language === "gu" ? "Gujarati" : language === "hi" ? "Hindi" : "English";

        // ── QuickSeva System Context Prompt ─────────────────────────────────────
        // This tells Gemini EVERYTHING about QuickSeva so it answers accurately.
        // Gemini charges tokens for this context (~200 tokens per call) but it stays
        // within the free tier (1500 requests/day, 15 req/min) easily.
        // ────────────────────────────────────────────────────────────────────────
        const QUICKSEVA_CONTEXT = `
You are QuickSeva Customer Support Assistant — a helpful, friendly and professional support bot for QuickSeva, a hyper-local service marketplace in Gujarat, India.

=== ABOUT QUICKSEVA ===
QuickSeva connects customers with verified local service providers in Gujarat.
Services offered: Plumbing, Electrician, AC Repair, Home Cleaning, Carpentry, Home Painting, Pest Control, Appliance Repair (fridge, washing machine, geyser).
Pricing: Starts from ₹199. Exact price depends on provider and service type.
Booking: Users book via the website at quickseva.com, paying through QuickSeva Wallet or UPI.
Only verified, background-checked providers are listed.

=== REFUND & CANCELLATION POLICY ===
- Cancelled BEFORE provider accepts the booking → 100% refund to QuickSeva wallet instantly.
- Cancelled AFTER provider accepts but BEFORE work starts → Partial refund, subject to platform review.
- Cancelled AFTER work has already started → NO refund as work is in progress.
- Disputed orders → Customer must contact support with booking ID for manual review.
- Refunds go to QuickSeva Wallet (not original payment method).

=== BOOKING STATUSES ===
Pending → Accepted → In Progress → Completed / Cancelled.

=== KEY PAGES ===
- Services: /services
- My Bookings: /my-bookings
- Wallet/Profile: /profile
- Seller Registration: /become-seller
- Login: /login

=== SUPPORT ===
Email: support@quickseva.com
Phone: +91 98765 43210 (Mon-Sat, 9 AM - 7 PM)
Office: Ahmedabad, Gujarat, India

=== INSTRUCTIONS ===
- ALWAYS reply strictly in ${langName} language (do not mix languages).
- Keep responses concise and helpful (max 80 words).
- When relevant, include markdown links like [Services](/services) or [My Bookings](/my-bookings).
- For refund questions, always mention the correct 3-tier refund policy above.
- Be empathetic and professional.
- Do NOT make up information not present in this context.
`;

        const prompt = `${QUICKSEVA_CONTEXT}

User question: "${cleanInput}"

Reply in ${langName}:`;

        const geminiRes = await axios.post(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiKey}`,
          { contents: [{ parts: [{ text: prompt }] }] },
          { timeout: 8000 }
        );

        const aiText = geminiRes.data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (aiText) {
          return res.json({
            success: true,
            reply: aiText.trim(),
            source: "gemini_ai",
          });
        }
      } catch (geminiErr) {
        console.warn("Gemini API call fallback to local:", geminiErr.message);
      }
    }

    // 4. Default Fallback
    let fallbackText = "";
    if (language === "gu") {
      fallbackText = `હું તમારી મદદ કરવા તૈયાર છું! બુકિંગ, વોલેટ અથવા સેવાઓ માટે ઉપર આપેલા બટન પર ક્લિક કરો અથવા પ્રશ્ન પૂછો.`;
    } else if (language === "hi") {
      fallbackText = `मैं आपकी सहायता करने के लिए तत्पर हूँ! आप बुकिंग स्थिति, वॉलेट या सेवाओं के लिए नीचे दिए गए विकल्पों पर क्लिक कर सकते हैं।`;
    } else {
      fallbackText = `I am here to help! You can track bookings, check wallet balance, or discover local services using the quick options below.`;
    }

    return res.json({
      success: true,
      reply: fallbackText,
      source: "local_fallback",
    });
  } catch (error) {
    console.error("Chatbot controller error:", error);
    return res.status(500).json({
      success: false,
      message: "Chatbot processing error",
    });
  }
};
