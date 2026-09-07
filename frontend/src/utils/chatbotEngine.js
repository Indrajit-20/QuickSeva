import Fuse from 'fuse.js';
import axios from 'axios';
import apiClient from '../api/axiosConfig';
import {
  TRANSLATIONS,
  KEYWORD_RULES,
  OUT_OF_SCOPE_KEYWORDS,
  SCOPE_OVERRIDE_KEYWORDS
} from '../data/chatbotTranslations';
import { API_BASE_URL } from '../config/api';

// ─────────────────────────────────────────────────────────────────
// Fuse.js Index Setup for Typo-Tolerant Local Intent Matching
// ─────────────────────────────────────────────────────────────────
const FUSE_TARGETS = [];
KEYWORD_RULES.forEach((rule, ruleIndex) => {
  rule.keywords.forEach((kw) => {
    FUSE_TARGETS.push({
      keyword: kw,
      ruleIndex,
      priority: rule.priority || 5
    });
  });
});

const fuse = new Fuse(FUSE_TARGETS, {
  keys: ['keyword'],
  threshold: 0.38, // 0.0 = exact match, 1.0 = anything. 0.38 handles typos like 'plumbr', 'elctrician', 'cleanng'
  distance: 100,
  includeScore: true,
  ignoreLocation: true,
  minMatchCharLength: 3
});

const SUPPORT_INTENT_KEYWORDS = [
  'order', 'booking', 'book', 'status', 'track', 'reply', 'response',
  'provider', 'seller', 'show', 'visible', 'not showing', 'not coming',
  'nathi', 'nahi', 'nai', 'na aave', 'avto', 'avato', 'aavto', 'aavato',
  'batav', 'batave', 'dekhatu', 'dekhat', 'jawab', 'javab', 'madad',
  'ઓર્ડર', 'બુકિંગ', 'જવાબ', 'નથી', 'આવતો', 'આવતું', 'બતાવતું',
  'दिख', 'नहीं', 'आया', 'जवाब', 'बुकिंग', 'ऑर्डर'
];

/**
 * Check if the user's message is clearly out-of-scope (not QuickSeva-related).
 */
function isOutOfScope(normalizedInput) {
  const hasQuickSevaContext = SCOPE_OVERRIDE_KEYWORDS.some((kw) =>
    normalizedInput.includes(kw.toLowerCase())
  );
  if (hasQuickSevaContext) return false;

  const offTopicMatches = OUT_OF_SCOPE_KEYWORDS.filter((kw) =>
    normalizedInput.includes(kw.toLowerCase())
  );
  return offTopicMatches.length > 0;
}

function hasSupportIntent(normalizedInput) {
  return SUPPORT_INTENT_KEYWORDS.some((kw) => normalizedInput.includes(kw.toLowerCase()));
}

function buildSupportIntentFallback(message, language) {
  const normalized = (message || '').trim().toLowerCase();
  const looksLikeOrderIssue = ['order', 'booking', 'book', 'status', 'track', 'ઓર્ડર', 'બુકિંગ', 'ऑर्डर', 'बुकिंग']
    .some((kw) => normalized.includes(kw));

  if (!looksLikeOrderIssue && !hasSupportIntent(normalized)) return null;

  if (language === 'gu') {
    return `હું સમજી શકું છું. જો ઓર્ડર દેખાતો નથી અથવા પ્રોવાઇડરનો જવાબ નથી આવતો, તો પહેલા **[My Bookings](/my-bookings)** માં સ્ટેટસ ચેક કરો.\n\n• **Pending** હોય તો પ્રોવાઇડર હજુ accept કરવાનું બાકી છે.\n• ઓર્ડર દેખાતો ન હોય તો login થયેલો નંબર/એકાઉન્ટ સાચું છે કે નહીં ચેક કરો.\n• Booking ID હોય તો અહીં મોકલો, હું તેને ચેક કરવાનો પ્રયત્ન કરીશ.\n\nતાત્કાલિક મદદ માટે support@quickseva.com અથવા +91 98765 43210 પર સંપર્ક કરો.`;
  }

  if (language === 'hi') {
    return `मैं समझ रहा हूँ। अगर ऑर्डर दिखाई नहीं दे रहा या प्रोवाइडर का जवाब नहीं आ रहा, तो पहले **[My Bookings](/my-bookings)** में स्टेटस देखें.\n\n• **Pending** है तो प्रोवाइडर ने अभी accept नहीं किया है।\n• ऑर्डर नहीं दिख रहा हो तो सही login नंबर/अकाउंट चेक करें।\n• Booking ID हो तो यहाँ भेजें, मैं चेक करने की कोशिश करूँगा।\n\nतुरंत मदद के लिए support@quickseva.com या +91 98765 43210 पर संपर्क करें।`;
  }

  return `I understand. If your order is not showing or the provider has not replied, please first check **[My Bookings](/my-bookings)**.\n\n• If it is **Pending**, the provider has not accepted yet.\n• If no order is visible, confirm you are logged in with the same account/phone used for booking.\n• If you have a Booking ID, send it here and I will try to check it.\n\nFor urgent help, contact support@quickseva.com or +91 98765 43210.`;
}

/**
 * Smart Local Keyword Matcher with Specificity & Fuse.js Fuzzy Scoring.
 *
 * Handles exact phrase matches, token overlaps, AND typos automatically using Fuse.js.
 */
export function findLocalResponse(userInput, language = 'en') {
  if (!userInput) return null;
  const normalized = userInput.trim().toLowerCase();

  // 1. Out-of-scope check FIRST — before any keyword matching
  if (isOutOfScope(normalized)) {
    const langDict = TRANSLATIONS[language] || TRANSLATIONS.en;
    return langDict.responses.out_of_scope || langDict.responses.fallback;
  }

  // Extract clean word tokens from user input
  const inputTokens = normalized
    .replace(/[^a-z0-9\u0A80-\u0AFF\u0900-\u097F\s]/g, '')
    .split(/\s+/)
    .filter((w) => w.length > 1);

  // 2. Score all keyword rules for exact substring & token overlap
  let bestMatch = null;
  let bestScore = 0;

  for (const rule of KEYWORD_RULES) {
    let ruleScore = 0;
    let matchCount = 0;

    for (const kw of rule.keywords) {
      const kwLower = kw.toLowerCase();

      // Exact substring match
      if (normalized.includes(kwLower)) {
        matchCount++;
        const wordCount = kw.trim().split(/\s+/).length;
        ruleScore += wordCount * 3; // Exact phrase match gets high score
      } else {
        // Token set match for scrambled phrases
        const kwTokens = kwLower.split(/\s+/).filter((w) => w.length > 2);
        if (kwTokens.length >= 2) {
          const matchingTokens = kwTokens.filter((t) => inputTokens.includes(t));
          if (matchingTokens.length >= 2) {
            matchCount++;
            ruleScore += matchingTokens.length * 2;
          }
        }
      }
    }

    if (matchCount === 0) continue;

    const priority = rule.priority || 5;
    const finalScore = ruleScore * priority;

    if (finalScore > bestScore) {
      bestScore = finalScore;
      bestMatch = rule;
    }
  }

  // High confidence exact/token match found
  if (bestMatch && bestScore >= 6) {
    const text = bestMatch.responses[language] || bestMatch.responses.en;
    return { text, showOptions: Boolean(bestMatch.showOptions) };
  }

  // 3. Fuse.js Fuzzy Fallback for Typos (e.g. 'plumbr', 'elctrician', 'ac repare')
  const fuseResults = fuse.search(normalized);

  // Also search individual word tokens if whole sentence didn't match directly
  if (fuseResults.length === 0 && inputTokens.length > 0) {
    for (const token of inputTokens) {
      if (token.length < 3) continue;
      const tokenFuseResults = fuse.search(token);
      fuseResults.push(...tokenFuseResults);
    }
  }

  if (fuseResults.length > 0) {
    // Sort by Fuse score ascending (lower score = closer match)
    fuseResults.sort((a, b) => (a.score || 1) - (b.score || 1));
    const topResult = fuseResults[0];

    // Threshold cutoff — only accept close fuzzy matches (score <= 0.38)
    if (topResult && topResult.score <= 0.38) {
      const targetRule = KEYWORD_RULES[topResult.item.ruleIndex];
      if (targetRule) {
        const text = targetRule.responses[language] || targetRule.responses.en;
        return { text, showOptions: Boolean(targetRule.showOptions) };
      }
    }
  }

  // If score was mediocre, return bestMatch if we had any low score exact/token match
  if (bestMatch && bestScore > 0) {
    const text = bestMatch.responses[language] || bestMatch.responses.en;
    return { text, showOptions: Boolean(bestMatch.showOptions) };
  }

  return null;
}

/**
 * Core Chatbot Query Processor
 */
export async function processChatbotMessage({ message, optionId, language = 'en', user = null, history = [] }) {
  // 1. If user requested menu or clicked an option
  if (optionId === 'back_to_menu') {
    const langDict = TRANSLATIONS[language] || TRANSLATIONS.en;
    return {
      text: `⚡ **${langDict.optionsTitle || 'Quick Help Options:'}**`,
      type: 'bot',
      source: 'option',
      showOptions: true
    };
  }

  if (optionId) {
    const langDict = TRANSLATIONS[language] || TRANSLATIONS.en;
    let responseText = langDict.responses[optionId] || langDict.responses.fallback;

    // Personalize if user is logged in
    if (user?.name && optionId === 'track_booking') {
      const greetingPrefix =
        language === 'gu'
          ? `👋 **નમસ્તે ${user.name}!**\n`
          : language === 'hi'
          ? `👋 **नमस्ते ${user.name}!**\n`
          : `👋 **Hello ${user.name}!**\n`;
      responseText = greetingPrefix + responseText;
    }

    return { text: responseText, type: 'bot', source: 'option' };
  }

  // 2. Backend Call (Gemini AI / DB Context) — send typed messages straight to backend AI
  try {
    const token = localStorage.getItem("authToken") || localStorage.getItem("token");
    const res = await apiClient.post("/chatbot/query", {
      message,
      language,
      userName: user?.name || null,
      userId: user?.id || null,
      history
    });

    if (res.data && res.data.reply) {
      return { text: res.data.reply, type: "bot", source: res.data.source || "ai" };
    }
  } catch (err) {
    console.warn("Backend chatbot endpoint failed, using local fallback:", err.message);
  }

  // 3. Optional Local Keyword Matcher Fallback if Backend AI is offline
  const localAnswer = findLocalResponse(message, language);
  if (localAnswer) {
    const text = typeof localAnswer === "string" ? localAnswer : localAnswer.text;
    const showOptions = typeof localAnswer === "object" ? Boolean(localAnswer.showOptions) : false;
    return { text, type: "bot", source: "local_rule", showOptions };
  }

  // 4. Use a conversational support fallback for QuickSeva support intents.
  const supportFallback = buildSupportIntentFallback(message, language);
  if (supportFallback) {
    return { text: supportFallback, type: 'bot', source: 'support_intent_fallback' };
  }

  // 5. Default Trilingual Fallback
  const fallbackDict = TRANSLATIONS[language] || TRANSLATIONS.en;
  return {
    text: fallbackDict.responses.fallback,
    type: 'bot',
    source: 'fallback'
  };
}
