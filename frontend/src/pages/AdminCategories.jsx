import React, { useState, useEffect } from "react";
import { adminService } from "../api/adminService";
import {
  Wrench,
  PlusCircle,
  ToggleLeft,
  ToggleRight,
  X,
} from "lucide-react";

const AdminCategories = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // New Category State
  const [showAddModal, setShowAddModal] = useState(false);
  const [newCatName, setNewCatName] = useState("");
  const [newCatIcon, setNewCatIcon] = useState("");
  const [newCatDesc, setNewCatDesc] = useState("");
  const [addLoading, setAddLoading] = useState(false);
  const [addError, setAddError] = useState(null);
  const [addSuccess, setAddSuccess] = useState(null);

  const fetchCategories = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await adminService.getCategories();
      if (res.success && res.data) {
        setCategories(res.data.categories || []);
      }
    } catch (err) {
      console.error(err);
      setError("Failed to fetch service categories.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleToggleActive = async (cat) => {
    try {
      const res = await adminService.toggleCategory(cat.id);
      if (res.success) {
        setCategories((prev) =>
          prev.map((c) => (c.id === cat.id ? { ...c, is_active: c.is_active ? 0 : 1 } : c))
        );
      }
    } catch (err) {
      console.error(err);
      alert("Failed to toggle category active status.");
    }
  };

  const handleCreateCategory = async (e) => {
    e.preventDefault();
    if (!newCatName.trim() || !newCatIcon.trim()) {
      setAddError("Name and Icon (emoji) are required.");
      return;
    }

    setAddLoading(true);
    setAddError(null);
    setAddSuccess(null);

    try {
      const res = await adminService.createCategory({
        name: newCatName.trim(),
        icon: newCatIcon.trim(),
        description: newCatDesc.trim(),
      });

      if (res.success) {
        setAddSuccess("Category created successfully!");
        setNewCatName("");
        setNewCatIcon("");
        setNewCatDesc("");
        // Reload list
        fetchCategories();
        setTimeout(() => setShowAddModal(false), 1500);
      }
    } catch (err) {
      console.error(err);
      setAddError(err?.response?.data?.message || "Failed to create category.");
    } finally {
      setAddLoading(false);
    }
  };

  const inputClass =
    "w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 text-xs font-semibold shadow-xs";

  return (
    <div className="space-y-6 text-left">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 tracking-tight">
            Service Categories
          </h1>
          <p className="text-slate-500 font-semibold text-sm mt-1">
            Create new service categories, upload icons, or temporarily disable listings.
          </p>
        </div>
        <button
          onClick={() => {
            setAddError(null);
            setAddSuccess(null);
            setShowAddModal(true);
          }}
          className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 transition shadow-xs self-start cursor-pointer"
        >
          <PlusCircle size={14} />
          <span>Add New Category</span>
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-205 text-red-700 rounded-xl p-4 text-xs font-semibold shadow-xs">
          ⚠️ {error}
        </div>
      )}

      {/* Categories Grid list */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full py-12 text-center text-slate-400 text-xs animate-pulse font-bold bg-white rounded-2xl border border-slate-200 shadow-sm">
            Fetching service categories...
          </div>
        ) : categories.length === 0 ? (
          <div className="col-span-full py-12 text-center text-slate-400 text-xs font-bold bg-white rounded-2xl border border-slate-200 shadow-sm">
            No categories available. Click 'Add New Category' to start.
          </div>
        ) : (
          categories.map((cat) => (
            <div
              key={cat.id}
              className="bg-white border border-slate-200 rounded-2xl p-6 flex flex-col justify-between space-y-4 hover:border-blue-400 transition-all duration-300 shadow-sm"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl p-2 bg-slate-50 rounded-xl border border-slate-200 shadow-inner">
                      {cat.icon}
                    </span>
                    <div>
                      <h3 className="font-bold text-slate-800 text-base truncate">
                        {cat.name}
                      </h3>
                      <p className="text-[9px] text-slate-450 font-bold tracking-widest uppercase mt-0.5">
                        ID: QS-CAT-{cat.id}
                      </p>
                    </div>
                  </div>

                  <span
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider border ${
                      cat.is_active
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                        : "bg-red-50 text-red-700 border-red-200"
                    }`}
                  >
                    {cat.is_active ? "Active" : "Disabled"}
                  </span>
                </div>

                <p className="text-xs text-slate-550 font-semibold leading-relaxed">
                  {cat.description || "No description provided."}
                </p>
              </div>

              <div className="border-t border-slate-100 pt-4 flex items-center justify-between">
                <span className="text-[10px] text-slate-450 font-bold uppercase tracking-wider">Platform Status</span>
                <button
                  onClick={() => handleToggleActive(cat)}
                  className={`flex items-center gap-1 text-xs font-bold transition cursor-pointer ${
                    cat.is_active
                      ? "text-emerald-600 hover:text-emerald-750"
                      : "text-slate-400 hover:text-slate-600"
                  }`}
                  title={cat.is_active ? "Deactivate Category" : "Activate Category"}
                >
                  {cat.is_active ? <ToggleRight size={22} /> : <ToggleLeft size={22} />}
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add New Category Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 text-slate-805">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-6 space-y-5 shadow-2xl animate-fade-in">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                <Wrench size={16} className="text-blue-600" />
                <span>Add Service Category</span>
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer p-1"
              >
                <X size={16} />
              </button>
            </div>

            {addError && (
              <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-3 text-xs font-semibold text-left">
                ⚠️ {addError}
              </div>
            )}

            {addSuccess && (
              <div className="bg-emerald-50 border border-emerald-250 text-emerald-700 rounded-xl p-3 text-xs font-semibold text-left">
                ✅ {addSuccess}
              </div>
            )}

            <form onSubmit={handleCreateCategory} className="space-y-4 text-left">
              <div>
                <label className="block text-slate-600 text-xs font-bold uppercase tracking-wider mb-2">Category Name</label>
                <input
                  type="text"
                  placeholder="e.g. Home Cleaning, Carpenter"
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  required
                  disabled={addLoading}
                  className={inputClass}
                />
              </div>

              <div>
                <label className="block text-slate-600 text-xs font-bold uppercase tracking-wider mb-2">Icon (Emoji representation)</label>
                <input
                  type="text"
                  placeholder="🧹"
                  value={newCatIcon}
                  onChange={(e) => setNewCatIcon(e.target.value)}
                  maxLength="2"
                  required
                  disabled={addLoading}
                  className="w-20 px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-800 text-center text-lg placeholder-slate-400 focus:outline-none focus:border-blue-500 font-bold"
                />
              </div>

              <div>
                <label className="block text-slate-600 text-xs font-bold uppercase tracking-wider mb-2">Short Description</label>
                <textarea
                  placeholder="Enter details on what types of tasks this category covers..."
                  value={newCatDesc}
                  onChange={(e) => setNewCatDesc(e.target.value)}
                  disabled={addLoading}
                  className="w-full px-3 py-2.5 h-24 bg-white border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 text-xs font-medium leading-relaxed resize-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  disabled={addLoading}
                  className="px-4 py-2.5 bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold rounded-xl border border-slate-200 transition-all text-xs cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={addLoading || !newCatName || !newCatIcon}
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold rounded-xl transition-all text-xs flex items-center gap-1.5 cursor-pointer shadow-sm"
                >
                  {addLoading ? "Creating..." : "Create Category"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminCategories;
