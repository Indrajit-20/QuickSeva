import React, { useState, useEffect } from "react";
import { getPolicy, updatePolicy } from "../api/policyService";
import {
  FileText,
  Save,
  Eye,
  Edit3,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  ExternalLink,
  ShieldCheck,
  FileCheck,
} from "lucide-react";
import { Link } from "react-router-dom";

const inputClass =
  "w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 font-medium text-sm transition-all";

const POLICY_KEYS = [
  {
    key: "privacy_policy",
    label: "Privacy Policy",
    desc: "Customer privacy rights, data collection, and security policies.",
    publicUrl: "/privacy-policy",
  },
  {
    key: "terms_of_service",
    label: "Terms of Service",
    desc: "Terms, user agreements, and service guidelines.",
    publicUrl: "/terms-of-service",
  },
  {
    key: "refund_policy",
    label: "Refund & Cancellation Policy",
    desc: "Rules for booking cancellations, wallet refunds, and lead disputes.",
    publicUrl: "/refund-policy",
  },
];

const AdminPolicies = () => {
  const [selectedKey, setSelectedKey] = useState("privacy_policy");
  const [policyTitle, setPolicyTitle] = useState("");
  const [policyContent, setPolicyContent] = useState("");
  const [lastUpdated, setLastUpdated] = useState(null);
  const [updatedBy, setUpdatedBy] = useState(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);
  const [activeTab, setActiveTab] = useState("edit"); // "edit" | "preview"

  const loadPolicy = async (key) => {
    setSelectedKey(key);
    setLoading(true);
    setError(null);
    setSuccessMsg(null);
    try {
      const res = await getPolicy(key);
      if (res && res.data) {
        setPolicyTitle(res.data.title || "");
        setPolicyContent(res.data.content || "");
        setLastUpdated(res.data.updated_at || null);
        setUpdatedBy(res.data.updated_by_name || null);
      }
    } catch (err) {
      console.error("Failed to load policy:", err);
      setError("Failed to load policy document from database.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPolicy(selectedKey);
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setSuccessMsg(null);
    try {
      await updatePolicy(selectedKey, {
        title: policyTitle,
        content: policyContent,
      });
      setSuccessMsg("Policy document updated and published successfully!");
      setLastUpdated(new Date().toISOString());
    } catch (err) {
      console.error("Failed to update policy:", err);
      setError(
        err.response?.data?.message || "Failed to save policy updates."
      );
    } finally {
      setSaving(false);
    }
  };

  const selectedPolicyInfo = POLICY_KEYS.find((p) => p.key === selectedKey);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-2.5">
            <ShieldCheck className="text-blue-600" size={26} />
            <span>CMS & Site Policies</span>
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Manage legal documents, terms of service, and public platform policies.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {selectedPolicyInfo && (
            <Link
              to={selectedPolicyInfo.publicUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-bold transition-all"
            >
              <ExternalLink size={14} />
              <span>View Live Page</span>
            </Link>
          )}
          <button
            onClick={handleSave}
            disabled={saving || loading || !policyTitle || !policyContent}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-bold shadow-xs transition-all cursor-pointer"
          >
            {saving ? (
              <>
                <RefreshCw size={14} className="animate-spin" />
                <span>Saving...</span>
              </>
            ) : (
              <>
                <Save size={14} />
                <span>Publish Changes</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Notifications */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-4 text-xs font-semibold flex items-center gap-2">
          <AlertTriangle size={16} />
          <span>{error}</span>
        </div>
      )}

      {successMsg && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl p-4 text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 size={16} />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Document Selector & Tabs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Sidebar: Policy Selector */}
        <div className="md:col-span-1 space-y-3">
          <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider px-1">
            Documents
          </h2>
          <div className="space-y-2">
            {POLICY_KEYS.map((item) => {
              const isActive = selectedKey === item.key;
              return (
                <button
                  key={item.key}
                  onClick={() => loadPolicy(item.key)}
                  className={`w-full text-left p-4 rounded-xl border transition-all cursor-pointer ${
                    isActive
                      ? "bg-blue-50 border-blue-200 text-blue-900 shadow-xs"
                      : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  <div className="flex items-center gap-2.5 font-bold text-sm">
                    <FileText
                      size={16}
                      className={isActive ? "text-blue-600" : "text-slate-400"}
                    />
                    <span>{item.label}</span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                    {item.desc}
                  </p>
                </button>
              );
            })}
          </div>

          {/* Policy Metadata Card */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
            <h3 className="text-xs font-bold text-slate-600 uppercase tracking-wider">
              Document Info
            </h3>
            <div className="text-xs text-slate-500 space-y-1">
              <p>
                <span className="font-semibold text-slate-700">Key:</span>{" "}
                <code className="bg-white px-1.5 py-0.5 rounded border border-slate-200 text-slate-800">
                  {selectedKey}
                </code>
              </p>
              {lastUpdated && (
                <p>
                  <span className="font-semibold text-slate-700">
                    Last Updated:
                  </span>{" "}
                  {new Date(lastUpdated).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </p>
              )}
              {updatedBy && (
                <p>
                  <span className="font-semibold text-slate-700">By:</span>{" "}
                  {updatedBy}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Main Editor / Preview Area */}
        <div className="md:col-span-3 bg-white rounded-2xl border border-slate-200 p-6 space-y-5">
          {loading ? (
            <div className="py-20 text-center space-y-3">
              <RefreshCw
                size={24}
                className="animate-spin text-blue-600 mx-auto"
              />
              <p className="text-slate-500 text-xs font-bold">
                Loading Policy Document...
              </p>
            </div>
          ) : (
            <>
              {/* Header inside Editor */}
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div className="flex items-center gap-2">
                  <FileCheck size={18} className="text-blue-600" />
                  <span className="font-bold text-slate-800 text-base">
                    {selectedPolicyInfo?.label}
                  </span>
                </div>

                {/* Edit / Preview Toggle */}
                <div className="flex items-center bg-slate-100 p-1 rounded-xl">
                  <button
                    onClick={() => setActiveTab("edit")}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      activeTab === "edit"
                        ? "bg-white text-slate-800 shadow-xs"
                        : "text-slate-500 hover:text-slate-800"
                    }`}
                  >
                    <Edit3 size={14} />
                    <span>Editor</span>
                  </button>
                  <button
                    onClick={() => setActiveTab("preview")}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      activeTab === "preview"
                        ? "bg-white text-slate-800 shadow-xs"
                        : "text-slate-500 hover:text-slate-800"
                    }`}
                  >
                    <Eye size={14} />
                    <span>Live Preview</span>
                  </button>
                </div>
              </div>

              {activeTab === "edit" ? (
                <div className="space-y-4">
                  <div>
                    <label
                      htmlFor="policy-title"
                      className="block text-slate-600 text-xs font-bold uppercase tracking-wider mb-1.5"
                    >
                      Document Title
                    </label>
                    <input
                      id="policy-title"
                      type="text"
                      value={policyTitle}
                      onChange={(e) => setPolicyTitle(e.target.value)}
                      placeholder="e.g., Privacy Policy"
                      className={inputClass}
                    />
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-1.5">
                      <label
                        htmlFor="policy-content"
                        className="block text-slate-600 text-xs font-bold uppercase tracking-wider"
                      >
                        Document Content (HTML / Rich Text Format)
                      </label>
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                        Supports standard HTML formatting tags (&lt;p&gt;, &lt;h2&gt;, &lt;ul&gt;, &lt;strong&gt;)
                      </span>
                    </div>
                    <textarea
                      id="policy-content"
                      value={policyContent}
                      onChange={(e) => setPolicyContent(e.target.value)}
                      placeholder="Enter policy content in HTML format..."
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 font-mono text-xs leading-relaxed h-96 resize-y"
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                    <h3 className="text-xl font-bold text-slate-900 mb-2">
                      {policyTitle || "Untitled Policy"}
                    </h3>
                    <div
                      className="prose prose-slate max-w-none text-slate-700 text-xs leading-relaxed space-y-2"
                      dangerouslySetInnerHTML={{ __html: policyContent }}
                    />
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminPolicies;
