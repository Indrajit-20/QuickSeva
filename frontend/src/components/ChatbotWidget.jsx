import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
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
  X
} from 'lucide-react';
import { LANGUAGES, TRANSLATIONS } from '../data/chatbotTranslations';
import { processChatbotMessage } from '../utils/chatbotEngine';
import { useAuth } from '../context/AuthContext';

const INITIAL_OPTIONS_COUNT = 3;

export default function ChatbotWidget() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [isOpen, setIsOpen] = useState(false);
  const [language, setLanguage] = useState(() => localStorage.getItem('quickseva_lang') || 'en');
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showLangMenu, setShowLangMenu] = useState(false);
  const [showAllOptions, setShowAllOptions] = useState(false);

  const latestMessageRef = useRef(null);
  const inputRef = useRef(null);
  const currentDict = TRANSLATIONS[language] || TRANSLATIONS.en;

  // Initialize welcome message
  useEffect(() => {
    localStorage.setItem('quickseva_lang', language);

    const initialWelcome = {
      id: 'welcome-init',
      sender: 'bot',
      text: '👋 **Welcome to QuickSeva Support!**\nPlease select your preferred language to get started:',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      showLanguageSelector: true,
      showOptions: true
    };

    setMessages((prev) => (prev.length === 0 ? [initialWelcome] : prev));
  }, [language]);

  // Scroll focus to latest bot message
  useEffect(() => {
    if (isOpen && latestMessageRef.current) {
      latestMessageRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [messages, isTyping, isOpen]);

  // Reset expanded options on new message
  useEffect(() => {
    setShowAllOptions(false);
  }, [messages.length]);

  const renderOptionIcon = (iconName) => {
    switch (iconName) {
      case 'PackageSearch': return <PackageSearch className="w-4 h-4 text-emerald-600" />;
      case 'Wallet': return <Wallet className="w-4 h-4 text-amber-600" />;
      case 'BookOpen': return <BookOpen className="w-4 h-4 text-indigo-600" />;
      case 'Briefcase': return <Briefcase className="w-4 h-4 text-blue-600" />;
      case 'HardHat': return <HardHat className="w-4 h-4 text-orange-600" />;
      case 'Info': return <Info className="w-4 h-4 text-cyan-600" />;
      case 'PhoneCall': return <PhoneCall className="w-4 h-4 text-rose-600" />;
      default: return <Sparkles className="w-4 h-4 text-indigo-500" />;
    }
  };

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

  const handleSendMessage = async (textToSend, optionId = null) => {
    const queryText = textToSend || input;
    if (!queryText.trim() && !optionId) return;

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

    const recentMessages = messages
      .slice(-6)
      .map((msg) => ({
        role: msg.sender === 'bot' ? 'assistant' : 'user',
        text: msg.text
      }));

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
        showOptions: true
      }
    ]);
  };

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

  const resetChat = () => {
    setMessages([
      {
        id: `welcome-reset-${Date.now()}`,
        sender: 'bot',
        text: '👋 **Welcome to QuickSeva Support!**\nPlease select your preferred language to get started:',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        showLanguageSelector: true,
        showOptions: true
      }
    ]);
  };

  const visibleOptions = showAllOptions
    ? currentDict.options
    : currentDict.options.slice(0, INITIAL_OPTIONS_COUNT);

  const hasMoreOptions = currentDict.options.length > INITIAL_OPTIONS_COUNT;
  const hiddenCount = currentDict.options.length - INITIAL_OPTIONS_COUNT;

  return (
    <div className="fixed bottom-20 right-4 sm:bottom-6 sm:right-6 z-50 font-sans">
      {/* Floating Toggle Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="flex items-center gap-2.5 px-5 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full shadow-lg shadow-indigo-600/30 hover:scale-105 active:scale-95 transition-all duration-200"
          aria-label="Open Chatbot"
        >
          <div className="relative">
            <Bot className="w-5 h-5 text-white" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-400 border-2 border-indigo-600 rounded-full animate-pulse" />
          </div>
          <span className="font-semibold text-sm">
            {language === 'gu' ? 'મદદ' : language === 'hi' ? 'सहायता' : 'Support'}
          </span>
        </button>
      )}

      {/* Expanded Chat Dialog */}
      {isOpen && (
        <div className="w-[92vw] sm:w-[400px] h-[590px] max-h-[85vh] bg-white border border-slate-200 rounded-3xl shadow-2xl shadow-slate-300/40 flex flex-col overflow-hidden">

          {/* Header */}
          <div className="bg-white border-b border-slate-100 px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative p-2 bg-indigo-50 rounded-2xl border border-indigo-100">
                <Bot className="w-5 h-5 text-indigo-600" />
                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 border-2 border-white rounded-full" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-slate-800">{currentDict.welcomeHeader}</h3>
                <p className="text-[11px] text-slate-500 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  {currentDict.onlineStatus}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              {/* Language Selector */}
              <div className="relative">
                <button
                  onClick={() => setShowLangMenu(!showLangMenu)}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl border border-slate-200 transition-colors"
                >
                  <Globe className="w-3.5 h-3.5 text-slate-500" />
                  <span>{LANGUAGES.find((l) => l.code === language)?.flag}</span>
                  <span className="uppercase text-[11px]">{language}</span>
                  <ChevronDown className="w-3 h-3 text-slate-400" />
                </button>

                {showLangMenu && (
                  <div className="absolute right-0 mt-2 w-44 bg-white border border-slate-200 rounded-2xl shadow-xl py-1 z-50">
                    <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100">
                      Select Language
                    </div>
                    {LANGUAGES.map((lang) => (
                      <button
                        key={lang.code}
                        onClick={() => handleLanguageSelect(lang.code)}
                        className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-indigo-50/60 transition-colors ${
                          language === lang.code ? 'bg-indigo-50 font-semibold text-indigo-600' : 'text-slate-700'
                        }`}
                      >
                        <span className="flex items-center gap-2">
                          <span>{lang.flag}</span>
                          <span>{lang.label}</span>
                        </span>
                        {language === lang.code && <Check className="w-3.5 h-3.5 text-indigo-600" />}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <button onClick={resetChat} title="Restart" className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors">
                <RefreshCw className="w-4 h-4" />
              </button>
              <button onClick={() => setIsOpen(false)} className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/60">
            {messages.map((msg, i) => {
              const isLatest = i === messages.length - 1;
              return (
                <div
                  key={msg.id || i}
                  ref={isLatest ? latestMessageRef : null}
                  className={`flex flex-col scroll-mt-3 ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
                >
                  <div className="flex items-end gap-2 max-w-[88%]">
                    {msg.sender === 'bot' && (
                      <div className="w-7 h-7 rounded-xl bg-indigo-100 border border-indigo-200 text-indigo-600 flex items-center justify-center shrink-0">
                        <Bot className="w-4 h-4" />
                      </div>
                    )}

                    <div className={`p-3.5 rounded-2xl text-xs leading-relaxed ${
                      msg.sender === 'user'
                        ? 'bg-indigo-600 text-white rounded-br-xs font-medium'
                        : 'bg-white text-slate-800 border border-slate-200 rounded-bl-xs'
                    }`}>
                      {renderFormattedMessage(msg.text)}

                      {/* Language Selector Buttons in initial message */}
                      {msg.showLanguageSelector && (
                        <div className="mt-3 pt-3 border-t border-slate-100">
                          <p className="text-[11px] font-medium text-slate-500 mb-2">
                            Choose / પસંદ / चुनें:
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

                    {msg.sender === 'user' && (
                      <div className="w-7 h-7 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0">
                        <User className="w-4 h-4" />
                      </div>
                    )}
                  </div>

                  {/* Quick Options after bot messages (show 2 + expand) */}
                  {msg.sender === 'bot' && msg.showOptions && isLatest && (
                    <div className="mt-3 ml-9 w-[calc(100%-2.25rem)] space-y-1.5 animate-in fade-in duration-300">
                      <p className="text-[11px] font-semibold text-slate-600 flex items-center gap-1 mb-2">
                        <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                        {currentDict.optionsTitle}
                      </p>

                      {/* First 2 options always visible */}
                      <div className="flex flex-col gap-1.5">
                        {visibleOptions.map((opt) => (
                          <button
                            key={opt.id}
                            onClick={() => handleSendMessage('', opt.id)}
                            className="flex items-center gap-2.5 px-3.5 py-2.5 bg-white hover:bg-indigo-50 border border-slate-200 hover:border-indigo-300 text-slate-700 font-medium text-xs rounded-2xl shadow-xs transition-all text-left active:scale-98 group"
                          >
                            <div className="p-1.5 rounded-lg bg-slate-50 border border-slate-100 group-hover:bg-white group-hover:border-indigo-200 transition-colors shrink-0">
                              {renderOptionIcon(opt.icon)}
                            </div>
                            <span className="flex-1">{opt.label}</span>
                          </button>
                        ))}
                      </div>

                      {/* Expand / Collapse button */}
                      {hasMoreOptions && (
                        <button
                          onClick={() => setShowAllOptions((p) => !p)}
                          className="w-full flex items-center justify-center gap-2 py-2.5 px-3.5 bg-slate-100 hover:bg-indigo-50 border border-dashed border-slate-300 hover:border-indigo-300 text-slate-600 hover:text-indigo-700 font-semibold text-[11px] rounded-2xl transition-all active:scale-98"
                        >
                          {showAllOptions ? (
                            <>
                              <ChevronUp className="w-3.5 h-3.5" />
                              {language === 'gu' ? 'ઓછા વિકલ્પો' : language === 'hi' ? 'कम विकल्प' : 'Show Less'}
                            </>
                          ) : (
                            <>
                              <ChevronDown className="w-3.5 h-3.5" />
                              {language === 'gu'
                                ? `${hiddenCount} વધુ વિકલ્પ`
                                : language === 'hi'
                                ? `${hiddenCount} और विकल्प`
                                : `${hiddenCount} More Options`}
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })}

            {/* Typing Indicator */}
            {isTyping && (
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-xl bg-indigo-100 border border-indigo-200 text-indigo-600 flex items-center justify-center shrink-0">
                  <Bot className="w-4 h-4" />
                </div>
                <div className="bg-white border border-slate-200 px-4 py-3 rounded-2xl rounded-bl-xs flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce" />
                  <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce [animation-delay:0.2s]" />
                  <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce [animation-delay:0.4s]" />
                  <span className="text-[11px] text-slate-400 ml-1">{currentDict.typing}</span>
                </div>
              </div>
            )}
          </div>

          {/* Input Footer - Premium Redesign */}
          <div className="bg-white border-t border-slate-100">
            <form
              onSubmit={(e) => { e.preventDefault(); handleSendMessage(input); }}
              className="flex items-center gap-2 p-3"
            >
              {/* Textbox */}
              <div className="flex-1 relative">
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder={currentDict.typePlaceholder}
                  className="w-full px-4 py-3 text-xs text-slate-800 font-medium placeholder-slate-400 bg-slate-100 border border-transparent rounded-2xl focus:outline-none focus:bg-white focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100 transition-all duration-200"
                />
              </div>

              {/* Send Button */}
              <button
                type="submit"
                disabled={!input.trim()}
                title={currentDict.sendTooltip}
                className="flex-shrink-0 w-11 h-11 flex items-center justify-center bg-indigo-600 hover:bg-indigo-700 active:scale-95 disabled:bg-slate-300 disabled:cursor-not-allowed text-white rounded-2xl transition-all duration-200 shadow-md shadow-indigo-600/30"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>

            {/* Footer */}
            <div className="text-[10px] text-center text-slate-400 font-medium pb-2.5">
              {currentDict.poweredBy}
            </div>
          </div>

        </div>
      )}
    </div>
  );
}
