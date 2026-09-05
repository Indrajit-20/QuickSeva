import React, { useEffect, useState, useRef } from "react";
import {
  MessageSquare,
  Search,
  Send,
  User,
  Phone,
  Mail,
  MapPin,
  CheckCircle2,
  Clock,
  Sparkles,
  Plus,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  RefreshCw,
  ExternalLink,
  ChevronRight,
  FileText,
  Tag,
  DollarSign,
  Briefcase,
  SlidersHorizontal,
  X,
  Bot,
  Building2,
  HardHat
} from "lucide-react";
import { socialInboxApi } from "../../api/socialInboxApi";
import { useAuth } from "../../context/AuthContext";
import { useSocket } from "../../context/SocketContext";

const PLATFORM_CONFIG = {
  quickseva: {
    label: "QuickSeva",
    badgeBg: "bg-amber-100 text-amber-900 border-amber-300",
    color: "#d97706",
    icon: ShieldCheck,
    tag: "🟠 QuickSeva Direct"
  },
  instagram: {
    label: "Instagram",
    badgeBg: "bg-rose-100 text-rose-800 border-rose-200",
    color: "#e1306c",
    icon: Sparkles,
    tag: "🔴 Instagram DM"
  },
  facebook: {
    label: "Facebook",
    badgeBg: "bg-indigo-100 text-indigo-800 border-indigo-200",
    color: "#1877f2",
    icon: MessageSquare,
    tag: "🟣 Facebook Page"
  }
};

const STATUS_CONFIG = {
  new: { label: "New Lead", bg: "bg-red-500 text-white shadow-red-200" },
  contacted: { label: "Contacted", bg: "bg-amber-500 text-white shadow-amber-200" },
  interested: { label: "Interested", bg: "bg-blue-600 text-white shadow-blue-200" },
  quoted: { label: "Quoted", bg: "bg-purple-600 text-white shadow-purple-200" },
  converted: { label: "Converted / Site Booked", bg: "bg-emerald-600 text-white shadow-emerald-200" },
  lost: { label: "Lost", bg: "bg-slate-400 text-white shadow-slate-100" }
};

export default function ContractorSocialInbox() {
  const { user } = useAuth();
  const { socket } = useSocket();

  const [stats, setStats] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [selectedConv, setSelectedConv] = useState(null);
  const [messages, setMessages] = useState([]);
  const [notes, setNotes] = useState([]);
  const [logs, setLogs] = useState([]);
  const [accounts, setAccounts] = useState([]);

  const [platformFilter, setPlatformFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  const [loadingConvs, setLoadingConvs] = useState(true);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [sendingReply, setSendingReply] = useState(false);
  const [newNoteText, setNewNoteText] = useState("");
  const [addingNote, setAddingNote] = useState(false);
  const [converting, setConverting] = useState(false);

  const [showAccountsModal, setShowAccountsModal] = useState(false);
  const [notificationMsg, setNotificationMsg] = useState(null);

  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Load Overview Data & List
  const loadData = async () => {
    try {
      setLoadingConvs(true);
      const [statsRes, convsRes, accsRes] = await Promise.all([
        socialInboxApi.getStats(),
        socialInboxApi.getConversations({ platform: platformFilter, status: statusFilter, q: searchQuery }),
        socialInboxApi.getAccounts()
      ]);

      if (statsRes?.stats) setStats(statsRes.stats);
      if (accsRes?.accounts) setAccounts(accsRes.accounts);

      const convList = convsRes?.conversations || [];
      setConversations(convList);

      // Auto select first conversation if none selected
      if (convList.length > 0 && !selectedConv) {
        selectConversation(convList[0].id);
      }
    } catch (err) {
      console.error("Error loading contractor social inbox data:", err);
    } finally {
      setLoadingConvs(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [platformFilter, statusFilter, searchQuery]);

  // Live Socket.io updates for incoming messages & leads
  useEffect(() => {
    if (!socket) return;

    const handleNewMessage = (data) => {
      if (selectedConv && data.conversation_id === selectedConv.id) {
        setMessages(prev => [...prev, data.message]);
        scrollToBottom();
      }
      loadData();
    };

    const handleNewLead = () => {
      loadData();
      showBanner("🔔 New Social Inquiry Received!");
    };

    socket.on("social_lead_message", handleNewMessage);
    socket.on("social_lead_new", handleNewLead);

    return () => {
      socket.off("social_lead_message", handleNewMessage);
      socket.off("social_lead_new", handleNewLead);
    };
  }, [socket, selectedConv]);

  // Listen for OAuth Popup PostMessage callback
  useEffect(() => {
    const handleAuthMessage = (event) => {
      if (event.data?.type === "META_AUTH_SUCCESS") {
        showBanner(`Successfully connected ${event.data.platform.toUpperCase()} Business account!`);
        loadData();
        setShowAccountsModal(false);
      }
    };
    window.addEventListener("message", handleAuthMessage);
    return () => window.removeEventListener("message", handleAuthMessage);
  }, []);

  // Select & load conversation details
  const selectConversation = async (convId) => {
    try {
      setLoadingDetail(true);
      const res = await socialInboxApi.getConversationById(convId);
      if (res?.conversation) {
        setSelectedConv(res.conversation);
        setMessages(res.messages || []);
        setNotes(res.notes || []);
        setLogs(res.logs || []);

        // update list unread count locally
        setConversations(prev =>
          prev.map(c => (c.id === convId ? { ...c, unread_count: 0 } : c))
        );
      }
    } catch (err) {
      console.error("Error loading conversation detail:", err);
    } finally {
      setLoadingDetail(false);
      setTimeout(scrollToBottom, 100);
    }
  };

  useEffect(() => {
    if (messages.length > 0) {
      scrollToBottom();
    }
  }, [messages]);

  // Send Reply Message
  const handleSendMessage = async (e) => {
    e?.preventDefault();
    if (!replyText.trim() || !selectedConv || sendingReply) return;

    try {
      setSendingReply(true);
      const res = await socialInboxApi.sendMessage(selectedConv.id, { message: replyText.trim() });
      if (res?.message) {
        setMessages(prev => [...prev, res.message]);
        setReplyText("");
        
        // Update local conversation item
        const updatedStatus = res.status || selectedConv.status;
        setSelectedConv(prev => ({
          ...prev,
          last_message: res.message.message,
          last_message_at: new Date().toISOString(),
          status: updatedStatus
        }));

        setConversations(prev =>
          prev.map(c =>
            c.id === selectedConv.id
              ? { ...c, last_message: res.message.message, status: updatedStatus }
              : c
          )
        );

        // Refresh stats
        socialInboxApi.getStats().then(s => s?.stats && setStats(s.stats));
      }
    } catch (err) {
      alert(err?.response?.data?.message || "Failed to send message");
    } finally {
      setSendingReply(false);
    }
  };

  // Quick Reply Template helper
  const sendQuickReply = (text) => {
    setReplyText(text);
  };

  // Change Lead Status
  const handleStatusChange = async (newStatus) => {
    if (!selectedConv) return;
    try {
      await socialInboxApi.updateStatus(selectedConv.id, newStatus);
      setSelectedConv(prev => ({ ...prev, status: newStatus }));
      setConversations(prev =>
        prev.map(c => (c.id === selectedConv.id ? { ...c, status: newStatus } : c))
      );
      socialInboxApi.getStats().then(s => s?.stats && setStats(s.stats));
    } catch (err) {
      alert("Failed to update status");
    }
  };

  // Add Internal Note
  const handleAddNote = async (e) => {
    e.preventDefault();
    if (!newNoteText.trim() || !selectedConv || addingNote) return;

    try {
      setAddingNote(true);
      const res = await socialInboxApi.addNote(selectedConv.id, newNoteText.trim());
      if (res?.note) {
        setNotes(prev => [res.note, ...prev]);
        setNewNoteText("");
      }
    } catch (err) {
      alert("Failed to add note");
    } finally {
      setAddingNote(false);
    }
  };

  // Convert to QuickSeva Booking / Site Project
  const handleConvertToBooking = async () => {
    if (!selectedConv || converting) return;
    if (!window.confirm(`Convert lead "${selectedConv.customer_name}" into a confirmed Contractor Site Project?`)) return;

    try {
      setConverting(true);
      const res = await socialInboxApi.convertToBooking(selectedConv.id);
      if (res?.status === "converted") {
        setSelectedConv(prev => ({ ...prev, status: "converted" }));
        setConversations(prev =>
          prev.map(c => (c.id === selectedConv.id ? { ...c, status: "converted" } : c))
        );
        showBanner("🎉 Lead successfully converted into a confirmed Contractor Site Project!");
        socialInboxApi.getStats().then(s => s?.stats && setStats(s.stats));
      }
    } catch (err) {
      alert("Failed to convert lead");
    } finally {
      setConverting(false);
    }
  };

  // Toggle Social Account Connection or Launch OAuth Popup
  const handleConnectChannel = async (platform) => {
    try {
      const res = await socialInboxApi.getMetaAuthUrl(platform);
      if (res?.url) {
        const width = 600;
        const height = 700;
        const left = window.screenX + (window.outerWidth - width) / 2;
        const top = window.screenY + (window.outerHeight - height) / 2;
        window.open(
          res.url,
          `meta_oauth_${platform}`,
          `width=${width},height=${height},left=${left},top=${top},scrollbars=yes,status=yes`
        );
      } else {
        await handleToggleAccount(platform);
      }
    } catch (err) {
      await handleToggleAccount(platform);
    }
  };

  const handleToggleAccount = async (platform) => {
    try {
      const res = await socialInboxApi.toggleAccount(platform);
      if (res?.is_connected !== undefined) {
        setAccounts(prev =>
          prev.map(a => (a.platform === platform ? { ...a, is_connected: res.is_connected } : a))
        );
        showBanner(`Updated ${platform.toUpperCase()} connection status!`);
      }
    } catch (err) {
      alert("Failed to update social account");
    }
  };

  const showBanner = (msg) => {
    setNotificationMsg(msg);
    setTimeout(() => setNotificationMsg(null), 4000);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-100px)] bg-slate-50 font-sans text-slate-800 rounded-2xl overflow-hidden border border-slate-200 shadow-sm">
      {/* ── Top Header & Stats Bar ── */}
      <div className="bg-white border-b border-slate-200 px-6 py-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4 shrink-0 shadow-xs">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <HardHat className="text-amber-600 fill-amber-100" size={24} />
              Contractor Social Inbox
            </h1>
            <span className="bg-amber-50 text-amber-800 text-xs font-bold px-2.5 py-1 rounded-full border border-amber-200 flex items-center gap-1.5 shadow-2xs">
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
              Contractor CRM
            </span>
          </div>
          <p className="text-xs font-medium text-slate-500 mt-1">
            Centralized Lead Inbox for Instagram, Facebook Pages, Meta Lead Ads & QuickSeva Direct Site Inquiries
          </p>
        </div>

        {/* Quick Stats Pills & Connect Button */}
        <div className="flex items-center gap-3 overflow-x-auto no-scrollbar pb-1 md:pb-0">
          <div className="flex items-center gap-2 bg-slate-50 p-1.5 rounded-xl border border-slate-200">
            <div className="px-3 py-1 bg-white rounded-lg border border-slate-100 shadow-2xs text-center">
              <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Total</div>
              <div className="text-sm font-black text-slate-900">{stats?.total || 0}</div>
            </div>
            <div className="px-3 py-1 bg-rose-50 rounded-lg border border-rose-100 text-center">
              <div className="text-[10px] text-rose-600 font-bold uppercase tracking-wider">New</div>
              <div className="text-sm font-black text-rose-700">{stats?.new || 0}</div>
            </div>
            <div className="px-3 py-1 bg-amber-50 rounded-lg border border-amber-100 text-center">
              <div className="text-[10px] text-amber-700 font-bold uppercase tracking-wider">Contacted</div>
              <div className="text-sm font-black text-amber-900">{stats?.contacted || 0}</div>
            </div>
            <div className="px-3 py-1 bg-emerald-50 rounded-lg border border-emerald-100 text-center">
              <div className="text-[10px] text-emerald-700 font-bold uppercase tracking-wider">Converted Sites</div>
              <div className="text-sm font-black text-emerald-900">{stats?.converted || 0}</div>
            </div>
          </div>

          <button
            onClick={() => setShowAccountsModal(true)}
            className="flex items-center gap-2 px-3.5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold shadow-xs active:scale-95 transition shrink-0 cursor-pointer"
          >
            <SlidersHorizontal size={14} />
            Connect Channels
          </button>
        </div>
      </div>

      {notificationMsg && (
        <div className="bg-emerald-600 text-white px-6 py-2 text-xs font-bold flex items-center justify-between shadow-inner">
          <span>{notificationMsg}</span>
          <button onClick={() => setNotificationMsg(null)} className="cursor-pointer"><X size={14} /></button>
        </div>
      )}

      {/* ── Main 3-Column Layout ── */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* ── LEFT COLUMN: Filters & Lead Feed (320px - 360px) ── */}
        <div className="w-full md:w-80 lg:w-96 border-r border-slate-200 bg-white flex flex-col shrink-0">
          
          {/* Platform Filters */}
          <div className="p-3 border-b border-slate-100 space-y-3 bg-slate-50/50">
            <div className="flex items-center gap-1 bg-slate-200/70 p-1 rounded-xl">
              {["all", "quickseva", "instagram", "facebook"].map((p) => (
                <button
                  key={p}
                  onClick={() => setPlatformFilter(p)}
                  className={`flex-1 py-1.5 text-xs font-bold rounded-lg capitalize transition cursor-pointer ${
                    platformFilter === p
                      ? "bg-white text-amber-700 shadow-xs"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>

            {/* Status Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
              {["all", "new", "contacted", "interested", "converted"].map((st) => (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  className={`px-2.5 py-1 rounded-full text-[11px] font-bold whitespace-nowrap border capitalize transition cursor-pointer ${
                    statusFilter === st
                      ? "bg-amber-600 text-white border-amber-600 shadow-2xs"
                      : "bg-white text-slate-600 border-slate-200 hover:bg-slate-100"
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>

            {/* Search Box */}
            <div className="relative">
              <Search size={14} className="absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search by customer, phone, trade interest..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Conversation List */}
          <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
            {loadingConvs ? (
              <div className="p-8 text-center text-slate-400 text-xs flex flex-col items-center gap-2">
                <RefreshCw size={18} className="animate-spin text-amber-600" />
                Loading contractor leads...
              </div>
            ) : conversations.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs">
                No contractor leads match your current filter.
              </div>
            ) : (
              conversations.map((conv) => {
                const platformMeta = PLATFORM_CONFIG[conv.platform] || PLATFORM_CONFIG.quickseva;
                const statusMeta = STATUS_CONFIG[conv.status] || STATUS_CONFIG.new;
                const isSelected = selectedConv?.id === conv.id;

                return (
                  <div
                    key={conv.id}
                    onClick={() => selectConversation(conv.id)}
                    className={`p-3.5 cursor-pointer transition flex items-start gap-3 hover:bg-amber-50/40 relative ${
                      isSelected ? "bg-amber-50/70 border-l-4 border-amber-600 shadow-2xs" : ""
                    }`}
                  >
                    <div className="relative shrink-0">
                      <img
                        src={conv.customer_avatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150"}
                        alt={conv.customer_name}
                        className="w-10 h-10 rounded-full object-cover border border-slate-200"
                      />
                      <span
                        className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold text-white shadow-xs"
                        style={{ backgroundColor: platformMeta.color }}
                      >
                        {conv.platform[0].toUpperCase()}
                      </span>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <h4 className="text-xs font-bold text-slate-900 truncate">
                          {conv.customer_name}
                        </h4>
                        <span className="text-[10px] text-slate-400 whitespace-nowrap font-medium">
                          {conv.last_message_at ? new Date(conv.last_message_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                        </span>
                      </div>

                      <div className="text-[11px] text-amber-700 font-extrabold truncate mt-0.5">
                        {conv.service_interest || "Site Work Inquiry"}
                      </div>

                      <p className="text-xs text-slate-500 truncate mt-1">
                        {conv.last_message || "No messages yet"}
                      </p>

                      <div className="flex items-center justify-between mt-2">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${statusMeta.bg}`}>
                          {statusMeta.label}
                        </span>
                        {conv.unread_count > 0 && (
                          <span className="bg-rose-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full animate-pulse">
                            {conv.unread_count} new
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* ── CENTER COLUMN: Live Chat & Message History ── */}
        <div className="flex-1 bg-white flex flex-col min-w-0 border-r border-slate-200">
          {selectedConv ? (
            <>
              {/* Active Conversation Header */}
              <div className="px-6 py-3 border-b border-slate-200 flex items-center justify-between bg-slate-50/70">
                <div className="flex items-center gap-3">
                  <img
                    src={selectedConv.customer_avatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150"}
                    alt={selectedConv.customer_name}
                    className="w-10 h-10 rounded-full object-cover border border-slate-200"
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-bold text-slate-900">{selectedConv.customer_name}</h3>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${PLATFORM_CONFIG[selectedConv.platform]?.badgeBg}`}>
                        {PLATFORM_CONFIG[selectedConv.platform]?.tag}
                      </span>
                    </div>
                    <div className="text-xs text-slate-500 flex items-center gap-2 mt-0.5">
                      <span>Requirement: <strong className="text-slate-800">{selectedConv.service_interest}</strong></span>
                      {selectedConv.customer_phone && (
                        <>
                          <span>•</span>
                          <a href={`tel:${selectedConv.customer_phone}`} className="text-amber-700 hover:underline flex items-center gap-1 font-bold">
                            <Phone size={12} /> {selectedConv.customer_phone}
                          </a>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Quick Status Dropdown */}
                <div className="flex items-center gap-2">
                  <select
                    value={selectedConv.status}
                    onChange={(e) => handleStatusChange(e.target.value)}
                    className="text-xs font-bold px-3 py-1.5 bg-white border border-slate-200 rounded-xl shadow-2xs focus:outline-none focus:ring-2 focus:ring-amber-500 cursor-pointer"
                  >
                    <option value="new">🔴 New Lead</option>
                    <option value="contacted">🟡 Contacted</option>
                    <option value="interested">🔵 Interested</option>
                    <option value="quoted">🟣 Quoted</option>
                    <option value="converted">🟢 Converted / Site Booked</option>
                    <option value="lost">⚪ Lost</option>
                  </select>
                </div>
              </div>

              {/* Messages Feed */}
              <div className="flex-1 p-6 overflow-y-auto space-y-4 bg-slate-50/40">
                {loadingDetail ? (
                  <div className="text-center text-xs text-slate-400 py-8">Loading conversation history...</div>
                ) : messages.length === 0 ? (
                  <div className="text-center text-xs text-slate-400 py-8">No message history available.</div>
                ) : (
                  messages.map((m) => {
                    const isSeller = m.sender_type === "seller";
                    const isSystem = m.sender_type === "system";

                    if (isSystem) {
                      return (
                        <div key={m.id} className="flex justify-center my-2">
                          <div className="bg-amber-50 border border-amber-200 text-amber-900 text-xs px-4 py-2 rounded-xl flex items-center gap-2 max-w-md shadow-2xs font-medium">
                            <Bot size={16} className="text-amber-600 shrink-0" />
                            <div>{m.message}</div>
                          </div>
                        </div>
                      );
                    }

                    return (
                      <div
                        key={m.id}
                        className={`flex flex-col ${isSeller ? "items-end" : "items-start"}`}
                      >
                        <div className="text-[10px] text-slate-400 mb-1 px-1 font-medium">
                          {m.sender_name || (isSeller ? "You (Contractor)" : selectedConv.customer_name)} • {new Date(m.sent_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                        <div
                          className={`max-w-md px-4 py-2.5 rounded-2xl text-xs leading-relaxed shadow-2xs font-medium ${
                            isSeller
                              ? "bg-amber-600 text-white rounded-tr-none font-semibold"
                              : "bg-white text-slate-800 border border-slate-200 rounded-tl-none"
                          }`}
                        >
                          {m.message}
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Quick Reply Suggestions for Contractor */}
              <div className="px-6 py-2.5 bg-white border-t border-slate-100 flex items-center gap-2 overflow-x-auto no-scrollbar">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider shrink-0">Trade Quick Replies:</span>
                <button
                  onClick={() => sendQuickReply("Hello! We can schedule a site visit and measurement inspection. When suits you best?")}
                  className="px-3 py-1 bg-slate-100 hover:bg-amber-50 text-slate-700 hover:text-amber-800 border border-slate-200 rounded-lg text-xs font-bold whitespace-nowrap transition cursor-pointer"
                >
                  "📅 Site Visit Schedule"
                </button>
                <button
                  onClick={() => sendQuickReply("Hi! Our rate per sq. ft. depends on material specifications and site area. Shall we send an estimate?")}
                  className="px-3 py-1 bg-slate-100 hover:bg-amber-50 text-slate-700 hover:text-amber-800 border border-slate-200 rounded-lg text-xs font-bold whitespace-nowrap transition cursor-pointer"
                >
                  "📐 Rate Estimate per Sq. Ft."
                </button>
                <button
                  onClick={() => sendQuickReply("Hello! We provide experienced shuttering, painting, and civil labor teams with complete supervision.")}
                  className="px-3 py-1 bg-slate-100 hover:bg-amber-50 text-slate-700 hover:text-amber-800 border border-slate-200 rounded-lg text-xs font-bold whitespace-nowrap transition cursor-pointer"
                >
                  "👷 Labor Team Availability"
                </button>
                <button
                  onClick={() => sendQuickReply("Sure! We can prepare a formal project contract with milestone payments. Please share full site location.")}
                  className="px-3 py-1 bg-slate-100 hover:bg-amber-50 text-slate-700 hover:text-amber-800 border border-slate-200 rounded-lg text-xs font-bold whitespace-nowrap transition cursor-pointer"
                >
                  "📄 Contract Agreement Draft"
                </button>
              </div>

              {/* Send Box */}
              <form onSubmit={handleSendMessage} className="p-4 bg-white border-t border-slate-200 flex items-center gap-3">
                <input
                  type="text"
                  placeholder={`Reply to ${selectedConv.customer_name} via ${selectedConv.platform}...`}
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white font-medium"
                />
                <button
                  type="submit"
                  disabled={sendingReply || !replyText.trim()}
                  className="px-5 py-2.5 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-xs active:scale-95 transition cursor-pointer"
                >
                  <Send size={14} />
                  Send
                </button>
              </form>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8 text-slate-400">
              <MessageSquare size={48} className="text-slate-300 mb-3" />
              <h3 className="text-sm font-bold text-slate-700">Select a lead conversation</h3>
              <p className="text-xs text-slate-400 max-w-sm mt-1">
                Choose any site inquiry lead from the left feed to view messaging history, manage lead status, add notes, or convert to a confirmed site project.
              </p>
            </div>
          )}
        </div>

        {/* ── RIGHT COLUMN: Lead CRM Details & Action Panel (300px - 340px) ── */}
        {selectedConv && (
          <div className="w-80 lg:w-84 bg-slate-50 p-5 overflow-y-auto border-l border-slate-200 shrink-0 space-y-5">
            
            {/* Customer Summary Card */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
              <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">
                Client & Site Details
              </h3>

              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs">
                  <User size={14} className="text-slate-400 shrink-0" />
                  <span className="font-bold text-slate-900">{selectedConv.customer_name}</span>
                </div>
                {selectedConv.customer_phone && (
                  <div className="flex items-center gap-2 text-xs">
                    <Phone size={14} className="text-slate-400 shrink-0" />
                    <a href={`tel:${selectedConv.customer_phone}`} className="text-amber-700 hover:underline font-bold">
                      {selectedConv.customer_phone}
                    </a>
                  </div>
                )}
                {selectedConv.lead_email && (
                  <div className="flex items-center gap-2 text-xs">
                    <Mail size={14} className="text-slate-400 shrink-0" />
                    <span className="text-slate-600 truncate">{selectedConv.lead_email}</span>
                  </div>
                )}
                {selectedConv.city && (
                  <div className="flex items-center gap-2 text-xs">
                    <MapPin size={14} className="text-slate-400 shrink-0" />
                    <span className="text-slate-700 font-medium">{selectedConv.city}</span>
                  </div>
                )}
              </div>

              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-slate-400 font-medium">Estimated Project Value:</span>
                <span className="font-black text-slate-900">₹{selectedConv.estimated_value || '15,000.00'}</span>
              </div>
            </div>

            {/* Convert to QuickSeva Booking / Site Project Button */}
            <div className="bg-gradient-to-br from-amber-600 via-amber-700 to-amber-800 text-white p-4 rounded-2xl shadow-sm space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-wider text-amber-200">Contractor Action</span>
                <Sparkles size={16} className="text-amber-200" />
              </div>
              <h4 className="text-sm font-black">Convert Lead to Site Project</h4>
              <p className="text-[11px] text-amber-100">
                Transform this social inquiry directly into an active QuickSeva Contractor site project.
              </p>
              <button
                onClick={handleConvertToBooking}
                disabled={converting || selectedConv.status === "converted"}
                className={`w-full mt-2 py-2.5 px-3 rounded-xl text-xs font-black flex items-center justify-center gap-2 transition cursor-pointer ${
                  selectedConv.status === "converted"
                    ? "bg-white/20 text-white cursor-not-allowed"
                    : "bg-white text-amber-900 hover:bg-amber-50 shadow-xs"
                }`}
              >
                <CheckCircle2 size={16} />
                {selectedConv.status === "converted" ? "Already Converted ✓" : "Convert Now"}
              </button>
            </div>

            {/* Contractor Notes Section */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
              <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider flex items-center justify-between">
                <span>Internal Site Notes</span>
                <FileText size={14} />
              </h3>

              <form onSubmit={handleAddNote} className="space-y-2">
                <textarea
                  placeholder="Add private note (e.g. Site measurement done, quote of ₹22k sent)..."
                  value={newNoteText}
                  onChange={(e) => setNewNoteText(e.target.value)}
                  className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 resize-none h-18 font-medium"
                />
                <button
                  type="submit"
                  disabled={addingNote || !newNoteText.trim()}
                  className="w-full py-2 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition cursor-pointer shadow-xs"
                >
                  Save Note
                </button>
              </form>

              <div className="space-y-2 max-h-44 overflow-y-auto divide-y divide-slate-100">
                {notes.length === 0 ? (
                  <div className="text-[11px] text-slate-400 italic">No notes added yet.</div>
                ) : (
                  notes.map((n) => (
                    <div key={n.id} className="pt-2 text-xs">
                      <p className="text-slate-700 leading-snug font-medium">{n.note_text}</p>
                      <div className="text-[10px] text-slate-400 mt-1">
                        {new Date(n.created_at).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Activity Logs */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
              <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">
                Activity History
              </h3>
              <div className="space-y-2 text-xs">
                {logs.map((log) => (
                  <div key={log.id} className="flex items-start gap-2 text-[11px] text-slate-600">
                    <div className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1 shrink-0" />
                    <div>
                      <div className="font-medium">{log.description}</div>
                      <div className="text-[9px] text-slate-400">
                        {new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        )}
      </div>

      {/* ── META / SOCIAL ACCOUNTS MODAL ── */}
      {showAccountsModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-5 shadow-2xl border border-slate-100">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <SlidersHorizontal size={18} className="text-amber-600" />
                Connect Contractor Social Channels
              </h3>
              <button onClick={() => setShowAccountsModal(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X size={18} />
              </button>
            </div>

            <p className="text-xs text-slate-500 leading-relaxed font-medium">
              Connect your official Meta Business App accounts to sync Instagram Direct Messages, Facebook Page inquiries, and Meta Lead Ads directly into your QuickSeva Contractor CRM.
            </p>

            <div className="space-y-3">
              {/* Instagram */}
              <div className="p-4 rounded-xl border border-slate-200 flex items-center justify-between bg-rose-50/30">
                <div className="flex items-center gap-3">
                  <Sparkles size={24} className="text-rose-600" />
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">Instagram Business Profile</h4>
                    <p className="text-[11px] text-slate-500">Sync Direct Messages & Inquiries</p>
                  </div>
                </div>
                <button
                  onClick={() => handleConnectChannel("instagram")}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                    accounts.find(a => a.platform === "instagram")?.is_connected
                      ? "bg-emerald-100 text-emerald-800"
                      : "bg-slate-900 text-white hover:bg-slate-800"
                  }`}
                >
                  {accounts.find(a => a.platform === "instagram")?.is_connected ? "Connected ✓" : "Connect via Meta"}
                </button>
              </div>

              {/* Facebook */}
              <div className="p-4 rounded-xl border border-slate-200 flex items-center justify-between bg-indigo-50/30">
                <div className="flex items-center gap-3">
                  <MessageSquare size={24} className="text-indigo-600" />
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">Facebook Page & Lead Ads</h4>
                    <p className="text-[11px] text-slate-500">Sync Messenger & Site Lead Forms</p>
                  </div>
                </div>
                <button
                  onClick={() => handleConnectChannel("facebook")}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                    accounts.find(a => a.platform === "facebook")?.is_connected
                      ? "bg-emerald-100 text-emerald-800"
                      : "bg-slate-900 text-white hover:bg-slate-800"
                  }`}
                >
                  {accounts.find(a => a.platform === "facebook")?.is_connected ? "Connected ✓" : "Connect via Meta"}
                </button>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setShowAccountsModal(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
