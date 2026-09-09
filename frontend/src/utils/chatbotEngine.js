import Fuse from 'fuse.js';
import apiClient from '../api/axiosConfig';
import {
  TRANSLATIONS,
  KEYWORD_RULES,
  OUT_OF_SCOPE_KEYWORDS,
  SCOPE_OVERRIDE_KEYWORDS
} from '../data/chatbotTranslations';

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
  threshold: 0.38,
  distance: 100,
  includeScore: true,
  ignoreLocation: true,
  minMatchCharLength: 3
});

const EXPLICIT_ORDER_PHRASES = [
  'track order', 'track booking', 'order status', 'booking status',
  'where is my order', 'where is my booking', 'my order status',
  'ઓર્ડર સ્ટેટસ', 'બુકિંગ સ્ટેટસ', 'ऑर्डर स्थिति', 'बुकिंग स्थिति'
];

const COMPLAINT_PHRASES = [
  'didn\'t visit', 'did not visit', 'not visit', 'not come', 'didn\'t come',
  'nathi avya', 'nathi aavya', 'nahi aaya', 'nahi aaye',
  'ask pin', 'asked pin', 'asking pin', 'otp', 'pin maang', 'pin mang',
  'fake', 'cheat', 'fraud', 'done nothing', 'no work', 'refund', 'complaint'
];

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

function buildSupportIntentFallback(message, language) {
  const normalized = (message || '').trim().toLowerCase();
  const isComplaint = COMPLAINT_PHRASES.some((kw) => normalized.includes(kw));
  const isExplicitOrderReq = EXPLICIT_ORDER_PHRASES.some((kw) => normalized.includes(kw));

  if (isComplaint) {
    if (language === 'gu') {
      return `⚠️ **મહત્વપૂર્ણ સુરક્ષા ગાઈડલાઈન:**\nજો કાર્યકરે કામ કર્યા વિના PIN/OTP માગ્યો હોય, તો PIN આપશો નહીં.\n\nકૃપા કરીને બુકિંગ વિગત સાથે અમારા સપોર્ટ ઈમેલ **support@quickseva.com** અથવા ફોન **+91 98765 43210** પર સંપર્ક કરો. અમે ત્વરિત તપાસ કરીશું.`;
    }
    if (language === 'hi') {
      return `⚠️ **महत्वपूर्ण सुरक्षा नियम:**\nअगर सेलर ने काम किए बिना PIN/OTP मांगा है, तो PIN बिल्कुल न दें।\n\nकृपया अपनी बुकिंग आईडी के साथ **support@quickseva.com** या **+91 98765 43210** पर तुरंत संपर्क करें। हम इसकी जांच करेंगे।`;
    }
    return `⚠️ **Important Security Warning:**\nDo NOT share your completion PIN/OTP if the provider did not visit or complete the work.\n\nPlease contact support immediately at **support@quickseva.com** or call **+91 98765 43210** with your Booking ID so we can investigate and process your resolution/refund.`;
  }

  if (!isExplicitOrderReq) return null;

  if (language === 'gu') {
    return `હું સમજી શકું છું. જો ઓર્ડર સ્ટેટસ જાણવું હોય, તો પહેલા **[My Bookings](/my-bookings)** માં સ્ટેટસ ચેક કરો.\n\n• **Pending** હોય તો પ્રોવાઇડર હજુ accept કરવાનું બાકી છે.\n• Booking ID હોય તો અહીં મોકલો (દા.ત. QS-20260826-LAAA), હું ચેક કરીશ.\n\nતાત્કાલિક મદદ માટે support@quickseva.com અથવા +91 98765 43210 પર સંપર્ક કરો.`;
  }

  if (language === 'hi') {
    return `मैं समझ रहा हूँ। अगर बुकिंग स्टेटस देखना है, तो पहले **[My Bookings](/my-bookings)** में स्टेटस देखें.\n\n• **Pending** है तो प्रोवाइडर ने अभी accept नहीं किया है।\n• Booking ID हो तो यहाँ भेजें (जैसे QS-20260826-LAAA), मैं चेक करने की कोशिश करूँगा।\n\nतुरंत मदद के लिए support@quickseva.com या +91 98765 43210 पर संपर्क करें।`;
  }

  return `I understand. To check your order status, please see **[My Bookings](/my-bookings)**.\n\n• If it is **Pending**, the provider has not accepted yet.\n• If you have a Booking ID (e.g. QS-20260826-LAAA), send it here and I will check it.\n\nFor urgent help, contact support@quickseva.com or +91 98765 43210.`;
}

export function findLocalResponse(userInput, language = 'en') {
  if (!userInput) return null;
  const normalized = userInput.trim().toLowerCase();

  if (isOutOfScope(normalized)) {
    const langDict = TRANSLATIONS[language] || TRANSLATIONS.en;
    return langDict.responses.out_of_scope || langDict.responses.fallback;
  }

  const inputTokens = normalized
    .replace(/[^a-z0-9\u0A80-\u0AFF\u0900-\u097F\s]/g, '')
    .split(/\s+/)
    .filter((w) => w.length > 1);

  let bestMatch = null;
  let bestScore = 0;

  for (const rule of KEYWORD_RULES) {
    let ruleScore = 0;
    let matchCount = 0;

    for (const kw of rule.keywords) {
      const kwLower = kw.toLowerCase();

      if (normalized.includes(kwLower)) {
        matchCount++;
        const wordCount = kw.trim().split(/\s+/).length;
        ruleScore += wordCount * 3;
      } else {
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

  if (bestMatch && bestScore >= 6) {
    const text = bestMatch.responses[language] || bestMatch.responses.en;
    return { text, showOptions: Boolean(bestMatch.showOptions) };
  }

  const fuseResults = fuse.search(normalized);

  if (fuseResults.length === 0 && inputTokens.length > 0) {
    for (const token of inputTokens) {
      if (token.length < 3) continue;
      const tokenFuseResults = fuse.search(token);
      fuseResults.push(...tokenFuseResults);
    }
  }

  if (fuseResults.length > 0) {
    fuseResults.sort((a, b) => (a.score || 1) - (b.score || 1));
    const topResult = fuseResults[0];

    if (topResult && topResult.score <= 0.38) {
      const targetRule = KEYWORD_RULES[topResult.item.ruleIndex];
      if (targetRule) {
        const text = targetRule.responses[language] || targetRule.responses.en;
        return { text, showOptions: Boolean(targetRule.showOptions) };
      }
    }
  }

  if (bestMatch && bestScore > 0) {
    const text = bestMatch.responses[language] || bestMatch.responses.en;
    return { text, showOptions: Boolean(bestMatch.showOptions) };
  }

  return null;
}

export async function processChatbotMessage({ message, optionId, language = 'en', user = null, history = [] }) {
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

  try {
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

  const localAnswer = findLocalResponse(message, language);
  if (localAnswer) {
    const text = typeof localAnswer === "string" ? localAnswer : localAnswer.text;
    const showOptions = typeof localAnswer === "object" ? Boolean(localAnswer.showOptions) : false;
    return { text, type: "bot", source: "local_rule", showOptions };
  }

  const supportFallback = buildSupportIntentFallback(message, language);
  if (supportFallback) {
    return { text: supportFallback, type: 'bot', source: 'support_intent_fallback' };
  }

  const fallbackDict = TRANSLATIONS[language] || TRANSLATIONS.en;
  return {
    text: fallbackDict.responses.fallback,
    type: 'bot',
    source: 'fallback'
  };
}
