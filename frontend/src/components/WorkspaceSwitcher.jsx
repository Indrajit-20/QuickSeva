import { useAuth } from "../context/AuthContext";

const WorkspaceSwitcher = ({ layout = "dropdown" }) => {
  const { isSeller, activeRole, switchRole } = useAuth();

  const isUserActive = activeRole === "user";
  const isSellerActive = activeRole === "seller";

  if (layout === "sidebar") {
    return (
      <div className="py-2.5">
        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5 px-0.5">
          Workspace
        </p>
        <div className="relative flex rounded-lg bg-slate-100 p-0.5 border border-slate-200/50">
          {/* Sliding indicator */}
          <div
            className={`absolute top-0.5 bottom-0.5 left-0.5 w-[calc(50%-2px)] rounded-md bg-white shadow-sm transition-transform duration-200 ease-out ${
              isSellerActive ? "translate-x-full" : "translate-x-0"
            }`}
          />
          
          <button
            type="button"
            onClick={() => !isUserActive && switchRole("user")}
            className={`relative z-10 flex flex-1 items-center justify-center gap-1.5 py-1 text-xs font-bold transition-colors duration-200 ${
              isUserActive ? "text-emerald-700" : "text-slate-500 hover:text-slate-700"
            }`}
          >
            <span>👤 Customer</span>
          </button>
          
          <button
            type="button"
            onClick={() => {
              if (!isSeller) {
                switchRole("seller");
              } else if (!isSellerActive) {
                switchRole("seller");
              }
            }}
            className={`relative z-10 flex flex-1 items-center justify-center gap-1.5 py-1 text-xs font-bold transition-colors duration-200 ${
              isSellerActive ? "text-[#0284c7]" : "text-slate-500 hover:text-slate-700"
            }`}
          >
            <span>🏪 {isSeller ? "Seller" : "Join"}</span>
          </button>
        </div>
      </div>
    );
  }

  const cardBase = {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "10px 14px",
    borderRadius: "10px",
    marginBottom: "8px",
    transition: "all 0.2s ease",
    width: "100%"
  };

  return (
    <div style={{ padding: "10px 16px" }}>

      <p style={{
        fontSize: "10px",
        color: "rgba(26,26,26,0.4)",
        textTransform: "uppercase",
        letterSpacing: "0.08em",
        marginBottom: "8px",
        fontWeight: "bold"
      }}>
        Workspace
      </p>

      {/* Customer Card */}
      <div
        onClick={() => !isUserActive && switchRole("user")}
        style={{
          ...cardBase,
          cursor: isUserActive ? "default" : "pointer",
          background: isUserActive
            ? "rgba(34,197,94,0.08)"
            : "transparent",
          border: isUserActive
            ? "1px solid rgba(34,197,94,0.4)"
            : "1px solid #e5e7eb"
        }}
      >
        <span style={{ fontSize: "13px", color: "#1a1a1a", fontWeight: "bold" }}>
          👤 Customer
        </span>
        {isUserActive
          ? <span style={{ fontSize:"11px", color:"#22c55e", fontWeight:700 }}>Active</span>
          : <span style={{ fontSize:"11px", color:"rgba(26,26,26,0.4)", fontWeight: "bold" }}>Switch</span>
        }
      </div>

      {/* Seller Card */}
      <div
        onClick={() => {
          if (!isSeller) {
            switchRole("seller");
          } else if (!isSellerActive) {
            switchRole("seller");
          }
        }}
        style={{
          ...cardBase,
          cursor: isSellerActive ? "default" : "pointer",
          background: isSellerActive
            ? "rgba(24,95,165,0.08)"
            : "transparent",
          border: isSellerActive
            ? "1px solid rgba(24,95,165,0.4)"
            : "1px solid #e5e7eb"
        }}
      >
        <span style={{ fontSize: "13px", color: "#1a1a1a", fontWeight: "bold" }}>
          🏪 {isSeller ? "Seller" : "Become a Seller"}
        </span>
        {isSeller ? (
          isSellerActive
            ? <span style={{ fontSize:"11px", color:"#0284c7", fontWeight:700 }}>Active</span>
            : <span style={{ fontSize:"11px", color:"rgba(26,26,26,0.4)", fontWeight: "bold" }}>Switch</span>
        ) : (
          <span style={{ fontSize:"11px", color:"#f43f5e", fontWeight:700 }}>Join</span>
        )}
      </div>

    </div>
  );
};

export default WorkspaceSwitcher;
