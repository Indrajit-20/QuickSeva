import axios from 'axios';
import { TRANSLATIONS, KEYWORD_RULES } from '../data/chatbotTranslations';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

/**
 * Smart Local Keyword Matcher
 */
export function findLocalResponse(userInput, language = 'en') {
  if (!userInput) return null;
  const normalized = userInput.trim().toLowerCase();

  for (const rule of KEYWORD_RULES) {
    const isMatch = rule.keywords.some((kw) => normalized.includes(kw.toLowerCase()));
    if (isMatch) {
      return rule.responses[language] || rule.responses.en;
    }
  }

  return null;
}

/**
 * Core Chatbot Query Processor
 */
export async function processChatbotMessage({ message, optionId, language = 'en', user = null }) {
  // 1. If user clicked a predefined option button
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

  // 2. Try Smart Local Keyword Match
  const localAnswer = findLocalResponse(message, language);
  if (localAnswer) {
    return { text: localAnswer, type: 'bot', source: 'local_rule' };
  }

  // 3. Optional Backend Call (Gemini AI / DB Context)
  try {
    const token = localStorage.getItem('token');
    const res = await axios.post(
      `${API_BASE_URL}/chatbot/query`,
      {
        message,
        language,
        userName: user?.name || null,
        userId: user?.id || null
      },
      {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        timeout: 8000
      }
    );

    if (res.data && res.data.reply) {
      return { text: res.data.reply, type: 'bot', source: res.data.source || 'ai' };
    }
  } catch (err) {
    console.warn('Backend chatbot endpoint fallback to local response:', err.message);
  }

  // 4. Default Trilingual Fallback
  const fallbackDict = TRANSLATIONS[language] || TRANSLATIONS.en;
  return {
    text: fallbackDict.responses.fallback,
    type: 'bot',
    source: 'fallback'
  };
}
