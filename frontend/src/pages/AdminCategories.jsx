import React, { useState, useEffect } from "react";
import { adminService } from "../api/adminService";
import {
  Wrench,
  PlusCircle,
  ToggleLeft,
  ToggleRight,
  X,
  UploadCloud,
  FileSpreadsheet,
  Download,
  CheckCircle2,
  AlertTriangle,
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

  // Bulk Import State
  const [showImportModal, setShowImportModal] = useState(false);
  const [rawCSVText, setRawCSVText] = useState("");
  const [parsedRows, setParsedRows] = useState([]);
  const [importLoading, setImportLoading] = useState(false);
  const [importResult, setImportResult] = useState(null);
  const [exportingBookings, setExportingBookings] = useState(false);

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

  // Download Sample CSV Template
  const handleDownloadSampleCSV = () => {
    const sampleHeader = "seller_id,category_id,title,price,duration,description\n";
    const sampleRows =
      '1,1,"AC Deep Cleaning & Repair",599,"1.5 hours","Full servicing and gas pressure test"\n' +
      '1,2,"Switchboard & Wiring Repair",299,"45 mins","Includes safety check and socket replacement"\n' +
      '2,3,"Kitchen Deep Sanitization",899,"2 hours","Complete grease removal and surface polish"';
    const csvContent = "\uFEFF" + sampleHeader + sampleRows;

    const url = window.URL.createObjectURL(new Blob([csvContent], { type: "text/csv;charset=utf-8;" }));
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "Sample_Services_Import_Template.csv");
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  };

  // Parse CSV text into array of service objects
  const parseCSVToJSON = (text) => {
    const lines = text.split(/\r?\n/).filter((l) => l.trim());
    if (lines.length <= 1) return [];

    const headers = lines[0].split(",").map((h) => h.replace(/^["']|["']$/g, "").trim().toLowerCase());
    const items = [];

    for (let i = 1; i < lines.length; i++) {
      const rowVals = lines[i].match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g) || lines[i].split(",");
      const cleanVals = rowVals.map((v) => v.replace(/^["']|["']$/g, "").trim());

      const obj = {};
      headers.forEach((h, idx) => {
        obj[h] = cleanVals[idx] || "";
      });

      if (obj.title || obj.seller_id) {
        items.push({
          seller_id: parseInt(obj.seller_id) || 1,
          category_id: obj.category_id ? parseInt(obj.category_id) : null,
          title: obj.title || `Service Item #${i}`,
          price: parseFloat(obj.price) || 0,
          duration: obj.duration || "1 hour",
          description: obj.description || "",
        });
      }
    }
    return items;
  };

  // Handle CSV file drop or upload
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target.result;
      setRawCSVText(content);
      const parsed = parseCSVToJSON(content);
      setParsedRows(parsed);
    };
    reader.readAsText(file);
  };

  // Execute Bulk Import API
  const handleExecuteImport = async () => {
    const itemsToImport = parsedRows.length > 0 ? parsedRows : parseCSVToJSON(rawCSVText);
    if (itemsToImport.length === 0) {
      alert("No valid service rows found in CSV.");
      return;
    }

    setImportLoading(true);
    setImportResult(null);
    try {
      const res = await adminService.bulkImportServices(itemsToImport);
      setImportResult(res.data || res);
      fetchCategories();
    } catch (err) {
      console.error(err);
      alert(err?.response?.data?.message || "Failed to perform bulk import.");
    } finally {
      setImportLoading(false);
    }
  };

  const handleExportBookings = async () => {
    try {
      setExportingBookings(true);
      await adminService.exportBookingsCSV();
    } catch (err) {
      console.error(err);
      alert("Failed to export bookings report.");
    } finally {
      setExportingBookings(false);
    }
  };

  const inputClass =
    "w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 text-xs font-semibold shadow-xs";

  return (
    <div className="space-y-6 text-left">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 tracking-tight">
            Services & Categories
          </h1>
          <p className="text-slate-500 font-semibold text-sm mt-1">
            Create categories, bulk import services via CSV, or download booking reports.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={handleExportBookings}
            disabled={exportingBookings}
            className="px-3.5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 transition shadow-xs cursor-pointer disabled:opacity-50"
          >
            <FileSpreadsheet size={14} />
            <span>{exportingBookings ? "Exporting..." : "Export Bookings (.CSV)"}</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setRawCSVText("");
              setParsedRows([]);
              setImportResult(null);
              setShowImportModal(true);
            }}
            className="px-3.5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 transition shadow-xs cursor-pointer"
          >
            <UploadCloud size={14} />
            <span>Bulk Import Services</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setAddError(null);
              setAddSuccess(null);
              setShowAddModal(true);
            }}
            className="px-3.5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 transition shadow-xs cursor-pointer"
          >
            <PlusCircle size={14} />
            <span>Add Category</span>
          </button>
        </div>
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

      {/* ── Bulk Import Services Modal ── */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 text-slate-800">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-2xl w-full p-6 space-y-5 shadow-2xl animate-fade-in max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                  <UploadCloud size={18} className="text-indigo-600" />
                  <span>Bulk Import Services (CSV Upload)</span>
                </h3>
                <p className="text-xs font-medium text-slate-500 mt-0.5">
                  Upload a CSV spreadsheet to add multiple services to QuickSeva in seconds.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowImportModal(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer p-1"
              >
                <X size={18} />
              </button>
            </div>

            {/* Template Download Prompt */}
            <div className="flex items-center justify-between bg-indigo-50/80 border border-indigo-100 rounded-xl p-3.5">
              <div className="flex items-center gap-2.5">
                <FileSpreadsheet className="h-5 w-5 text-indigo-600 shrink-0" />
                <div>
                  <p className="text-xs font-bold text-indigo-950">Need the correct column format?</p>
                  <p className="text-[11px] font-semibold text-indigo-700">Columns: seller_id, category_id, title, price, duration, description</p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleDownloadSampleCSV}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-lg transition active:scale-95 cursor-pointer shrink-0"
              >
                <Download size={13} />
                <span>Download Template</span>
              </button>
            </div>

            {/* File Upload / CSV Input */}
            <div className="space-y-3 text-left">
              <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider">
                1. Select CSV File or Paste Data
              </label>
              <div className="flex items-center justify-center w-full">
                <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-slate-300 border-dashed rounded-xl cursor-pointer bg-slate-50/50 hover:bg-slate-100/80 transition-all">
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <UploadCloud className="w-8 h-8 mb-2 text-indigo-500" />
                    <p className="mb-1 text-xs font-bold text-slate-700">Click to upload CSV spreadsheet</p>
                    <p className="text-[10px] text-slate-400">CSV format up to 10MB</p>
                  </div>
                  <input type="file" accept=".csv,text/csv" className="hidden" onChange={handleFileUpload} />
                </label>
              </div>

              <div>
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  Or paste CSV rows manually:
                </span>
                <textarea
                  rows="4"
                  value={rawCSVText}
                  onChange={(e) => {
                    setRawCSVText(e.target.value);
                    setParsedRows(parseCSVToJSON(e.target.value));
                  }}
                  placeholder={`seller_id,category_id,title,price,duration,description\n1,1,"AC Deep Cleaning",599,"1.5 hours","Full servicing"`}
                  className="w-full p-3 font-mono text-[11px] bg-slate-900 text-slate-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 leading-relaxed"
                />
              </div>
            </div>

            {/* Parsed Preview Table */}
            {parsedRows.length > 0 && (
              <div className="space-y-2 text-left">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold text-slate-700">
                    2. Parsed Preview ({parsedRows.length} services ready to import)
                  </span>
                </div>
                <div className="max-h-40 overflow-y-auto border border-slate-200 rounded-xl text-xs">
                  <table className="w-full text-left border-collapse">
                    <thead className="bg-slate-100 text-slate-600 font-bold sticky top-0 border-b border-slate-200">
                      <tr>
                        <th className="p-2">#</th>
                        <th className="p-2">Seller ID</th>
                        <th className="p-2">Title</th>
                        <th className="p-2">Price</th>
                        <th className="p-2">Duration</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium">
                      {parsedRows.map((row, idx) => (
                        <tr key={idx} className="hover:bg-slate-50">
                          <td className="p-2 font-mono text-slate-400">{idx + 1}</td>
                          <td className="p-2 font-bold">{row.seller_id}</td>
                          <td className="p-2 font-semibold text-slate-900">{row.title}</td>
                          <td className="p-2 text-emerald-600 font-bold">₹{row.price}</td>
                          <td className="p-2 text-slate-500">{row.duration}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Result Summary Alert */}
            {importResult && (
              <div className={`p-4 rounded-xl border text-xs text-left ${importResult.failedCount === 0 ? "bg-emerald-50 border-emerald-200 text-emerald-800" : "bg-amber-50 border-amber-200 text-amber-900"}`}>
                <div className="flex items-center gap-2 font-bold mb-1">
                  {importResult.failedCount === 0 ? <CheckCircle2 className="h-4 w-4 text-emerald-600" /> : <AlertTriangle className="h-4 w-4 text-amber-600" />}
                  <span>{importResult.message || "Import execution finished."}</span>
                </div>
                {importResult.errors && importResult.errors.length > 0 && (
                  <ul className="list-disc pl-5 mt-2 space-y-1 font-mono text-[11px]">
                    {importResult.errors.map((err, idx) => (
                      <li key={idx}>{err}</li>
                    ))}
                  </ul>
                )}
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowImportModal(false)}
                disabled={importLoading}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition cursor-pointer"
              >
                Close
              </button>
              <button
                type="button"
                onClick={handleExecuteImport}
                disabled={importLoading || (parsedRows.length === 0 && !rawCSVText.trim())}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 transition cursor-pointer shadow-sm"
              >
                <UploadCloud size={14} />
                <span>{importLoading ? "Importing Services..." : "Confirm & Import Services"}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminCategories;
