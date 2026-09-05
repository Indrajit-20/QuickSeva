import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Send,
  Globe,
  Bot,
  User,
  Sparkles,
  RefreshCw,
  PackageSearch,
  Wallet,
  BookOpen,
  Briefcase,
  PhoneCall,
  HardHat,
  Info,
  ChevronDown,
  Check,
  ChevronUp,
  X,
  Minus,
  ThumbsUp,
  ThumbsDown,
  Copy,
  CheckCheck,
  ArrowDown,
  AlertCircle,
  Mic,
  MicOff,
  LayoutGrid
} from 'lucide-react';
import { LANGUAGES, TRANSLATIONS } from '../data/chatbotTranslations';
import { processChatbotMessage } from '../utils/chatbotEngine';
import { useAuth } from '../context/AuthContext';

const INITIAL_OPTIONS_COUNT = 3;
const MAX_CHARS = 1000;
const SESSION_KEY = 'quickseva_chat_session';

// ─── Helper: Get user initials ──────────────────────────────────────────────
function getInitials(user) {
  if (!user) return null;
  const name = user.name || user.full_name || user.business_name || user.email || '';
  if (!name) return null;
  if (name.includes('@')) return name[0].toUpperCase();
  return name
    .trim()
    .split(' ')
    .filter(Boolean)
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

export default function ChatbotWidget() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const widgetRef = useRef(null);

  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [language, setLanguage] = useState(() => localStorage.getItem('quickseva_lang') || 'en');
  const [messages, setMessages] = useState(() => {
    // BUG FIX: Restore chat history from sessionStorage so it survives page refresh
    try {
      const saved = sessionStorage.getItem(SESSION_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showLangMenu, setShowLangMenu] = useState(false);
  const [showAllOptions, setShowAllOptions] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [feedbackMap, setFeedbackMap] = useState({});   // { msgId: 'up' | 'down' | 'thanks' }
  const [copiedMsgId, setCopiedMsgId] = useState(null);
  const [showScrollBtn, setShowScrollBtn] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const [isAnimatingOpen, setIsAnimatingOpen] = useState(false);
  const [isListening, setIsListening] = useState(false);

  const messagesAreaRef = useRef(null);
  const latestMessageRef = useRef(null);
  const inputRef = useRef(null);
  const langMenuRef = useRef(null);
  const recognitionRef = useRef(null);
  const currentDict = TRANSLATIONS[language] || TRANSLATIONS.en;

  // ─── Persist messages to sessionStorage ──────────────────────────────────
  useEffect(() => {
    try {
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(messages));
    } catch {
      // sessionStorage quota exceeded — just skip
    }
  }, [messages]);

  // ─── Initialize welcome message ──────────────────────────────────────────
  useEffect(() => {
    localStorage.setItem('quickseva_lang', language);
    setMessages((prev) => {
      if (prev.length === 0) {
        return [{
          id: 'welcome-init',
          sender: 'bot',
          text: '👋 **Welcome to QuickSeva Support!**\nPlease select your preferred language to get started:',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          showLanguageSelector: true,
          showOptions: true
        }];
      }
      return prev;
    });
  }, [language]);

  // ─── Scroll to latest bot message ────────────────────────────────────────
  useEffect(() => {
    if (isOpen && latestMessageRef.current) {
      latestMessageRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [messages, isTyping, isOpen]);

  // ─── BUG FIX #2: Reset showAllOptions only when the USER sends a message ─
  // Previously this fired on every message (including bot replies), collapsing
  // options in a jarring way mid-conversation.
  // Now handled explicitly in handleSendMessage below.

  // ─── Unread badge: track new bot messages when chat is closed/minimized ──
  useEffect(() => {
    const lastMsg = messages[messages.length - 1];
    if (lastMsg && lastMsg.sender === 'bot' && (!isOpen || isMinimized)) {
      setUnreadCount((n) => n + 1);
    }
  }, [messages]);

  // ─── Scroll indicator ────────────────────────────────────────────────────
  const handleScroll = useCallback(() => {
    const el = messagesAreaRef.current;
    if (!el) return;
    const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    setShowScrollBtn(distanceFromBottom > 120);
  }, []);

  // ─── Escape key to close ─────────────────────────────────────────────────
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape' && isOpen) setIsOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen]);

  // ─── Outside-click closes language dropdown ───────────────────────────────
  useEffect(() => {
    const handler = (e) => {
      if (langMenuRef.current && !langMenuRef.current.contains(e.target)) {
        setShowLangMenu(false);
      }
    };
    if (showLangMenu) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showLangMenu]);

  // ─── Auto-focus input when chat opens ────────────────────────────────────
  useEffect(() => {
    if (isOpen && !isMinimized) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen, isMinimized]);

  // ─── Toggle body class when chatbot is open/closed (hides mobile bottom navbar) ───
  useEffect(() => {
    if (isOpen) {
      document.body.classList.add('chatbot-open');
    } else {
      document.body.classList.remove('chatbot-open');
    }
    return () => {
      document.body.classList.remove('chatbot-open');
    };
  }, [isOpen]);

  // ─── Open animation ──────────────────────────────────────────────────────
  const openChat = () => {
    setIsOpen(true);
    setIsMinimized(false);
    setUnreadCount(0);
    setIsAnimatingOpen(true);
    setTimeout(() => setIsAnimatingOpen(false), 350);
  };

  const closeChat = () => {
    setIsOpen(false);
  };

  // Auto-close chatbot on page route/query navigation
  useEffect(() => {
    if (isOpen) {
      setIsOpen(false);
    }
  }, [location.pathname, location.search]);

  // Auto-close chatbot when clicking outside or clicking any link/button
  useEffect(() => {
    if (!isOpen) return;

    const handleOutsideClick = (e) => {
      if (widgetRef.current && !widgetRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };

    const handleLinkOrBtnClick = (e) => {
      const target = e.target;
      if (!target) return;
      const clickable = target.closest('a, button, .bottom-nav-item, [role="button"]');
      if (clickable && widgetRef.current && !widgetRef.current.contains(clickable)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);
    document.addEventListener('touchstart', handleOutsideClick);
    document.addEventListener('click', handleLinkOrBtnClick, true);

    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('touchstart', handleOutsideClick);
      document.removeEventListener('click', handleLinkOrBtnClick, true);
    };
  }, [isOpen]);

  const minimizeChat = () => {
    setIsMinimized(true);
  };

  // ─── Icon renderer ────────────────────────────────────────────────────────
  const renderOptionIcon = (iconName) => {
    switch (iconName) {
      case 'PackageSearch': return <PackageSearch className="w-4 h-4 text-emerald-600" />;
      case 'Wallet':        return <Wallet className="w-4 h-4 text-amber-600" />;
      case 'BookOpen':      return <BookOpen className="w-4 h-4 text-indigo-600" />;
      case 'Briefcase':     return <Briefcase className="w-4 h-4 text-blue-600" />;
      case 'HardHat':       return <HardHat className="w-4 h-4 text-orange-600" />;
      case 'Info':          return <Info className="w-4 h-4 text-cyan-600" />;
      case 'PhoneCall':     return <PhoneCall className="w-4 h-4 text-rose-600" />;
      default:              return <Sparkles className="w-4 h-4 text-indigo-500" />;
    }
  };

  // ─── Markdown link renderer ───────────────────────────────────────────────
  const formatTextWithLinks = (text) => {
    const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
    const parts = [];
    let lastIndex = 0;
    let match;

    while ((match = linkRegex.exec(text)) !== null) {
      if (match.index > lastIndex) parts.push(text.substring(lastIndex, match.index));
      const linkText = match[1];
      const linkUrl = match[2];
      parts.push(
        <button
          key={match.index}
          onClick={() => {
            if (linkUrl.startsWith('/')) { setIsOpen(false); navigate(linkUrl); }
            else window.open(linkUrl, '_blank');
          }}
          className="text-indigo-600 font-semibold underline hover:text-indigo-800 transition-colors mx-0.5"
        >
          {linkText}
        </button>
      );
      lastIndex = linkRegex.lastIndex;
    }

    if (lastIndex < text.length) parts.push(text.substring(lastIndex));
    return parts;
  };

  // ─── Formatted message renderer ───────────────────────────────────────────
  const renderFormattedMessage = (content) => {
    return content.split('\n').map((line, idx) => {
      const cleanLine = line.trim();
      const isBullet = cleanLine.startsWith('•') || cleanLine.startsWith('-') || /^\d+️⃣/.test(cleanLine);

      const renderedLine = cleanLine.split(/(\*\*[^*]+\*\*)/g).map((part, pIdx) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return <strong key={pIdx} className="font-semibold text-slate-900">{formatTextWithLinks(part.slice(2, -2))}</strong>;
        }
        return <span key={pIdx}>{formatTextWithLinks(part)}</span>;
      });

      return (
        <div key={idx} className={`${isBullet ? 'pl-2 py-0.5' : 'py-0.5'} min-h-[1.25rem]`}>
          {renderedLine}
        </div>
      );
    });
  };

  // ─── Copy message ─────────────────────────────────────────────────────────
  const handleCopyMessage = (msgId, text) => {
    // Strip markdown for clean copy
    const plain = text.replace(/\*\*([^*]+)\*\*/g, '$1').replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(plain).then(() => {
        setCopiedMsgId(msgId);
        setTimeout(() => setCopiedMsgId(null), 2000);
      });
    } else {
      try {
        const textArea = document.createElement("textarea");
        textArea.value = plain;
        textArea.style.position = "fixed";
        textArea.style.left = "-999999px";
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        setCopiedMsgId(msgId);
        setTimeout(() => setCopiedMsgId(null), 2000);
      } catch (err) {
        console.warn("Copy fallback failed:", err);
      }
    }
  };

  // ─── Feedback ─────────────────────────────────────────────────────────────
  const handleFeedback = (msgId, type) => {
    setFeedbackMap((prev) => ({ ...prev, [msgId]: type }));
    setTimeout(() => {
      setFeedbackMap((prev) => ({ ...prev, [msgId]: 'thanks' }));
    }, 1000);
  };

  // ─── Voice Input (Web Speech API) ───────────────────────────────────────
  const toggleVoiceInput = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setErrorMsg(currentDict.voiceNotSupported || 'Voice input is not supported in your browser.');
      return;
    }

    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = language === 'gu' ? 'gu-IN' : language === 'hi' ? 'hi-IN' : 'en-US';

      recognition.onstart = () => setIsListening(true);
      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        if (transcript) {
          setInput((prev) => (prev ? `${prev} ${transcript}` : transcript));
        }
        setIsListening(false);
      };
      recognition.onerror = () => setIsListening(false);
      recognition.onend = () => setIsListening(false);

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err) {
      setIsListening(false);
    }
  };

  // ─── Send message ─────────────────────────────────────────────────────────
  const handleSendMessage = async (textToSend, optionId = null) => {
    const queryText = textToSend || input;
    if (!queryText.trim() && !optionId) return;
    if (queryText.trim().length > MAX_CHARS) return;

    setErrorMsg(null);
    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const userMsg = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: optionId
        ? currentDict.options.find((o) => o.id === optionId)?.label || queryText
        : queryText,
      timestamp
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!optionId) setInput('');
    setIsTyping(true);
    // BUG FIX #2: Reset options only when user sends — not on every bot reply
    setShowAllOptions(false);

    const recentMessages = messages
      .slice(-16)
      .map((msg) => ({
        role: msg.sender === 'bot' ? 'assistant' : 'user',
        text: msg.text
      }));

    try {
      const result = await processChatbotMessage({
        message: queryText,
        optionId,
        language,
        user,
        history: recentMessages
      });
      setIsTyping(false);

      setMessages((prev) => [
        ...prev,
        {
          id: `bot-${Date.now()}`,
          sender: 'bot',
          text: result.text,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          showOptions: Boolean(result.showOptions || optionId === 'back_to_menu')
        }
      ]);
    } catch (err) {
      setIsTyping(false);
      setErrorMsg(currentDict.errorMessage || 'Something went wrong. Please try again.');
    }
  };

  // ─── Language select ──────────────────────────────────────────────────────
  const handleLanguageSelect = (langCode) => {
    setLanguage(langCode);
    setShowLangMenu(false);
    const newDict = TRANSLATIONS[langCode] || TRANSLATIONS.en;
    setMessages((prev) => [
      ...prev,
      {
        id: `lang-confirm-${Date.now()}`,
        sender: 'bot',
        text: `🌐 ${newDict.greeting}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        showOptions: true
      }
    ]);
  };

  // ─── Reset chat ──────────────────────────────────────────────────────────
  const resetChat = () => {
    const freshMsg = {
      id: `welcome-reset-${Date.now()}`,
      sender: 'bot',
      text: '👋 **Welcome to QuickSeva Support!**\nPlease select your preferred language to get started:',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      showLanguageSelector: true,
      showOptions: true
    };
    setMessages([freshMsg]);
    setFeedbackMap({});
    setErrorMsg(null);
    sessionStorage.setItem(SESSION_KEY, JSON.stringify([freshMsg]));
  };

  // ─── Scroll to bottom ────────────────────────────────────────────────────
  const scrollToBottom = () => {
    messagesAreaRef.current?.scrollTo({ top: messagesAreaRef.current.scrollHeight, behavior: 'smooth' });
  };

  const visibleOptions = showAllOptions
    ? currentDict.options
    : currentDict.options.slice(0, INITIAL_OPTIONS_COUNT);

  const hasMoreOptions = currentDict.options.length > INITIAL_OPTIONS_COUNT;
  const hiddenCount = currentDict.options.length - INITIAL_OPTIONS_COUNT;
  const charCount = MAX_CHARS - input.length;
  const isNearLimit = charCount < 100;

  return (
    <>
      {/* Mobile Backdrop Overlay when Chatbot is Open */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-[9998] sm:hidden animate-fade-in cursor-pointer"
          onClick={closeChat}
          aria-hidden="true"
        />
      )}
      <div ref={widgetRef} className="fixed bottom-[72px] right-3 sm:bottom-6 sm:right-6 z-[9999] font-sans">

        {/* ── Floating Toggle Button ── */}
        {!isOpen && (
          <button
            onClick={openChat}
            className="flex items-center gap-2 px-3.5 py-2.5 sm:px-4.5 sm:py-2.5 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white rounded-full shadow-lg shadow-indigo-600/30 hover:scale-105 active:scale-95 transition-all duration-200 relative cursor-pointer"
            aria-label="Open Chatbot"
          >
            {/* Unread badge */}
            {unreadCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-4.5 px-1 bg-rose-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center shadow-md animate-bounce">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
            <div className="relative shrink-0">
              <Bot className="w-4.5 h-4.5 sm:w-5 sm:h-5 text-white" />
              <span className="absolute -top-0.5 -right-0.5 w-2 h-2 sm:w-2.5 sm:h-2.5 bg-emerald-400 border-2 border-indigo-600 rounded-full animate-pulse" />
            </div>
            <span className="font-bold text-xs sm:text-sm whitespace-nowrap">
              Support
            </span>
          </button>
        )}

      {/* ── Expanded Chat Dialog ── */}
      {isOpen && (
        <div
          className={`
            fixed inset-x-0 bottom-0 sm:static w-full sm:w-[400px] h-[85vh] sm:h-[590px] max-h-[100vh] bg-white border border-slate-200 rounded-t-3xl sm:rounded-3xl shadow-2xl shadow-slate-400/30 flex flex-col overflow-hidden
            transition-all duration-300 ease-out
            ${isAnimatingOpen ? 'opacity-0 translate-y-4 scale-95' : 'opacity-100 translate-y-0 scale-100'}
          `}
        >
          {/* ── Header ── */}
          <div className="bg-white border-b border-slate-100 px-4 py-3 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3 min-w-0">
              <div className="relative p-2 bg-indigo-50 rounded-2xl border border-indigo-100 shrink-0">
                <Bot className="w-5 h-5 text-indigo-600" />
                <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 border-2 border-white rounded-full" />
              </div>
              <div className="min-w-0">
                <h3 className="font-bold text-sm text-slate-800 truncate">{currentDict.welcomeHeader}</h3>
                <p className="text-[11px] text-slate-500 truncate whitespace-nowrap">
                  {currentDict.onlineStatus}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1 shrink-0">
              {/* Language Selector */}
              <div className="relative" ref={langMenuRef}>
                <button
                  onClick={() => setShowLangMenu(!showLangMenu)}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl border border-slate-200 transition-colors"
                >
                  <Globe className="w-3.5 h-3.5 text-slate-500" />
                  <span>{LANGUAGES.find((l) => l.code === language)?.flag}</span>
                  <span className="uppercase text-[11px]">{language}</span>
                  <ChevronDown className={`w-3 h-3 text-slate-400 transition-transform ${showLangMenu ? 'rotate-180' : ''}`} />
                </button>

                {showLangMenu && (
                  <div className="absolute right-0 mt-2 w-48 bg-white border border-slate-200 rounded-2xl shadow-xl py-1 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                    <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100">
                      {currentDict.selectLangDropdown || 'Select Language'}
                    </div>
                    {LANGUAGES.map((lang) => (
                      <button
                        key={lang.code}
                        onClick={() => handleLanguageSelect(lang.code)}
                        className={`w-full text-left px-3 py-2.5 text-xs flex items-center justify-between hover:bg-indigo-50/60 transition-colors ${
                          language === lang.code ? 'bg-indigo-50 font-semibold text-indigo-600' : 'text-slate-700'
                        }`}
                      >
                        <span className="flex items-center gap-2">
                          <span className="text-base">{lang.flag}</span>
                          <span>{lang.label}</span>
                        </span>
                        {language === lang.code && <Check className="w-3.5 h-3.5 text-indigo-600" />}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Minimize button (collapses to round floating button) */}
              <button
                onClick={closeChat}
                title={currentDict.minimize || 'Minimize'}
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors"
              >
                <Minus className="w-4 h-4" />
              </button>

              {/* Reset button */}
              <button
                onClick={resetChat}
                title="Restart"
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
              </button>

              {/* Close button */}
              <button
                onClick={closeChat}
                className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* ── Body ── */}
          <>
              {/* ── Messages Area ── */}
              <div
                ref={messagesAreaRef}
                onScroll={handleScroll}
                className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/60 relative"
              >
                {messages.map((msg, i) => {
                  const isLatest = i === messages.length - 1;
                  const feedback = feedbackMap[msg.id];
                  const isCopied = copiedMsgId === msg.id;

                  return (
                    <div
                      key={msg.id || i}
                      ref={isLatest ? latestMessageRef : null}
                      className={`flex flex-col scroll-mt-3 group ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
                    >
                      <div className="flex items-end gap-2 max-w-[88%]">
                        {/* Bot avatar */}
                        {msg.sender === 'bot' && (
                          <div className="w-7 h-7 rounded-xl bg-indigo-100 border border-indigo-200 text-indigo-600 flex items-center justify-center shrink-0">
                            <Bot className="w-4 h-4" />
                          </div>
                        )}

                        {/* Bubble */}
                        <div className={`p-3.5 rounded-2xl text-xs leading-relaxed relative ${
                          msg.sender === 'user'
                            ? 'bg-gradient-to-br from-indigo-600 to-indigo-700 text-white rounded-br-sm font-medium'
                            : 'bg-white text-slate-800 border border-slate-200 rounded-bl-sm'
                        }`}>
                          {renderFormattedMessage(msg.text)}

                          {/* Language selector in first message */}
                          {msg.showLanguageSelector && (
                            <div className="mt-3 pt-3 border-t border-slate-100">
                              <p className="text-[11px] font-medium text-slate-500 mb-2">
                                {currentDict.chooseLangPrompt || 'Choose / પસંદ / चुनें:'}
                              </p>
                              <div className="grid grid-cols-3 gap-1.5">
                                {LANGUAGES.map((lang) => (
                                  <button
                                    key={lang.code}
                                    onClick={() => handleLanguageSelect(lang.code)}
                                    className={`flex items-center justify-center gap-1 py-2 px-2 rounded-xl border text-xs font-semibold transition-all active:scale-95 ${
                                      language === lang.code
                                        ? 'bg-indigo-600 text-white border-indigo-600'
                                        : 'bg-white text-slate-700 border-slate-200 hover:border-indigo-400 hover:bg-indigo-50/50'
                                    }`}
                                  >
                                    <span>{lang.flag}</span>
                                    <span className="truncate">{lang.label}</span>
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}

                          <div className={`text-[9px] mt-1.5 text-right ${msg.sender === 'user' ? 'text-indigo-200' : 'text-slate-400'}`}>
                            {msg.timestamp}
                          </div>
                        </div>

                        {/* User avatar — show initials if logged in */}
                        {msg.sender === 'user' && (
                          <div className="w-7 h-7 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 text-[10px] font-bold shadow-sm">
                            {getInitials(user) || <User className="w-4 h-4" />}
                          </div>
                        )}
                      </div>

                      {/* ── Per-message actions (copy + feedback) on bot messages ── */}
                      {msg.sender === 'bot' && (
                        <div className="ml-9 mt-1.5 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                          {/* Copy button */}
                          <button
                            onClick={() => handleCopyMessage(msg.id, msg.text)}
                            title={currentDict.copyMsg || 'Copy'}
                            className="flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] text-slate-400 hover:text-slate-700 hover:bg-white hover:shadow-sm border border-transparent hover:border-slate-200 transition-all"
                          >
                            {isCopied
                              ? <><CheckCheck className="w-3 h-3 text-emerald-500" /><span className="text-emerald-500">{currentDict.copied || 'Copied!'}</span></>
                              : <><Copy className="w-3 h-3" /><span>{currentDict.copyMsg || 'Copy'}</span></>
                            }
                          </button>

                          {/* Feedback buttons */}
                          {!feedback && (
                            <>
                              <button
                                onClick={() => handleFeedback(msg.id, 'up')}
                                title={currentDict.feedbackThumbsUp || 'Helpful'}
                                className="p-1 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition-all"
                              >
                                <ThumbsUp className="w-3 h-3" />
                              </button>
                              <button
                                onClick={() => handleFeedback(msg.id, 'down')}
                                title={currentDict.feedbackThumbsDown || 'Not helpful'}
                                className="p-1 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 transition-all"
                              >
                                <ThumbsDown className="w-3 h-3" />
                              </button>
                            </>
                          )}
                          {feedback === 'up' && <span className="text-[10px] text-emerald-600 font-medium flex items-center gap-1"><ThumbsUp className="w-3 h-3" /> {currentDict.feedbackThanks || 'Thanks!'}</span>}
                          {feedback === 'down' && <span className="text-[10px] text-rose-500 font-medium flex items-center gap-1"><ThumbsDown className="w-3 h-3" /> {currentDict.feedbackThanks || 'Thanks!'}</span>}
                          {feedback === 'thanks' && <span className="text-[10px] text-slate-500 font-medium">{currentDict.feedbackThanks || 'Thanks for your feedback!'}</span>}
                        </div>
                      )}

                      {/* ── Quick Options (only for latest bot message with showOptions) ── */}
                      {msg.sender === 'bot' && msg.showOptions && isLatest && (
                        <div className="mt-3 ml-9 w-[calc(100%-2.25rem)] space-y-1.5 animate-in fade-in duration-300">
                          <p className="text-[11px] font-semibold text-slate-600 flex items-center gap-1 mb-2">
                            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                            {currentDict.optionsTitle}
                          </p>

                          <div className="flex flex-col gap-1.5">
                            {visibleOptions.map((opt) => (
                              <button
                                key={opt.id}
                                onClick={() => handleSendMessage('', opt.id)}
                                className="flex items-center gap-2.5 px-3.5 py-2.5 bg-white hover:bg-indigo-50 border border-slate-200 hover:border-indigo-300 text-slate-700 font-medium text-xs rounded-2xl shadow-sm transition-all text-left active:scale-[0.98] group"
                              >
                                <div className="p-1.5 rounded-lg bg-slate-50 border border-slate-100 group-hover:bg-white group-hover:border-indigo-200 transition-colors shrink-0">
                                  {renderOptionIcon(opt.icon)}
                                </div>
                                <span className="flex-1">{opt.label}</span>
                              </button>
                            ))}
                          </div>

                          {hasMoreOptions && (
                            <button
                              onClick={() => setShowAllOptions((p) => !p)}
                              className="w-full flex items-center justify-center gap-2 py-2.5 px-3.5 bg-slate-100 hover:bg-indigo-50 border border-dashed border-slate-300 hover:border-indigo-300 text-slate-600 hover:text-indigo-700 font-semibold text-[11px] rounded-2xl transition-all active:scale-[0.98]"
                            >
                              {showAllOptions ? (
                                <><ChevronUp className="w-3.5 h-3.5" />{currentDict.showLess || 'Show Less'}</>
                              ) : (
                                <><ChevronDown className="w-3.5 h-3.5" />{`${hiddenCount} ${language === 'gu' ? 'વધુ વિકલ્પ' : language === 'hi' ? 'और विकल्प' : 'More Options'}`}</>
                              )}
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}

                {/* ── Typing Indicator ── */}
                {isTyping && (
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-xl bg-indigo-100 border border-indigo-200 text-indigo-600 flex items-center justify-center shrink-0">
                      <Bot className="w-4 h-4" />
                    </div>
                    <div className="bg-white border border-slate-200 px-4 py-3 rounded-2xl rounded-bl-sm flex items-center gap-1.5 shadow-sm">
                      <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce" />
                      <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce [animation-delay:0.15s]" />
                      <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce [animation-delay:0.3s]" />
                      <span className="text-[11px] text-slate-400 ml-1">{currentDict.typing}</span>
                    </div>
                  </div>
                )}

                {/* ── Error State ── */}
                {errorMsg && (
                  <div className="flex items-center gap-2 px-3 py-2.5 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-600 font-medium">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{errorMsg}</span>
                    <button onClick={() => setErrorMsg(null)} className="ml-auto text-rose-400 hover:text-rose-600">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>

              {/* ── Scroll to Bottom Button ── */}
              {showScrollBtn && (
                <button
                  onClick={scrollToBottom}
                  className="absolute bottom-24 right-8 sm:right-14 flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 text-white text-[11px] font-semibold rounded-full shadow-lg shadow-indigo-600/30 hover:bg-indigo-700 transition-all animate-in fade-in duration-200 z-10"
                >
                  <ArrowDown className="w-3 h-3" />
                  {currentDict.scrollToBottom || '↓ New message'}
                </button>
              )}

              {/* ── Input Footer ── */}
              <div className="bg-white border-t border-slate-100 shrink-0">
                {/* Persistent Quick Action Chips */}
                <div className="px-3 pt-2.5 flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-0.5">
                  <button
                    type="button"
                    onClick={() => handleSendMessage('', 'back_to_menu')}
                    className="flex items-center gap-1 px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-[11px] font-semibold rounded-full border border-indigo-200 shrink-0 transition-all active:scale-95"
                  >
                    <Sparkles className="w-3 h-3 text-indigo-600" />
                    <span>{currentDict.menuLabel || 'Menu'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSendMessage('', 'track_booking')}
                    className="flex items-center gap-1 px-2.5 py-1 bg-slate-50 hover:bg-slate-100 text-slate-700 text-[11px] font-medium rounded-full border border-slate-200 shrink-0 transition-all active:scale-95"
                  >
                    <PackageSearch className="w-3 h-3 text-emerald-600" />
                    <span>{currentDict.options?.find(o => o.id === 'track_booking')?.label || 'Track Booking'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSendMessage('', 'wallet_refund')}
                    className="flex items-center gap-1 px-2.5 py-1 bg-slate-50 hover:bg-slate-100 text-slate-700 text-[11px] font-medium rounded-full border border-slate-200 shrink-0 transition-all active:scale-95"
                  >
                    <Wallet className="w-3 h-3 text-amber-600" />
                    <span>{currentDict.options?.find(o => o.id === 'wallet_refund')?.label || 'Wallet'}</span>
                  </button>
                </div>

                <form
                  onSubmit={(e) => { e.preventDefault(); handleSendMessage(input); }}
                  className="flex items-center gap-2 p-3 pt-2"
                >
                  <div className="flex-1 relative">
                    <input
                      ref={inputRef}
                      type="text"
                      value={input}
                      onChange={(e) => setInput(e.target.value.slice(0, MAX_CHARS))}
                      placeholder={isListening ? (currentDict.listeningPlaceholder || 'Listening...') : currentDict.typePlaceholder}
                      className={`w-full px-4 py-3 text-xs text-slate-800 font-medium placeholder-slate-400 bg-slate-100 border rounded-2xl focus:outline-none focus:bg-white focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100 transition-all duration-200 pr-12 ${isListening ? 'border-rose-400 bg-rose-50 animate-pulse' : 'border-transparent'}`}
                    />
                    {/* Character count (only shown when close to limit) */}
                    {isNearLimit && (
                      <span className={`absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-semibold ${charCount < 20 ? 'text-rose-500' : 'text-amber-500'}`}>
                        {charCount}
                      </span>
                    )}
                  </div>

                  {/* Mic Button */}
                  <button
                    type="button"
                    onClick={toggleVoiceInput}
                    title={isListening ? 'Stop Listening' : 'Voice Input'}
                    className={`flex-shrink-0 w-11 h-11 flex items-center justify-center rounded-2xl transition-all duration-200 ${
                      isListening
                        ? 'bg-rose-500 text-white animate-pulse shadow-md shadow-rose-500/30'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-600 active:scale-95'
                    }`}
                  >
                    {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                  </button>

                  <button
                    type="submit"
                    disabled={!input.trim() || isTyping}
                    title={currentDict.sendTooltip}
                    className="flex-shrink-0 w-11 h-11 flex items-center justify-center bg-gradient-to-br from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 active:scale-95 disabled:from-slate-300 disabled:to-slate-300 disabled:cursor-not-allowed text-white rounded-2xl transition-all duration-200 shadow-md shadow-indigo-600/30"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </form>

                <div className="text-[10px] text-center text-slate-400 font-medium pb-2.5">
                  {currentDict.poweredBy}
                </div>
              </div>
            </>
        </div>
        )}
      </div>
    </>
  );
}
