import { useAuth } from "../context/AuthContext";

const WorkspaceSwitcher = () => {
  const { isSeller, activeRole, switchRole } = useAuth();

  if (!isSeller) return null; // hide completely if not a seller

  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      gap: "8px",
      padding: "12px"
    }}>

      {/* Customer Card */}
      <div
        onClick={() => activeRole !== "user" && switchRole("user")}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "10px 14px",
          borderRadius: "10px",
          cursor: activeRole === "user" ? "default" : "pointer",
          background: activeRole === "user" ? "rgba(34,197,94,0.1)" : "transparent",
          border: activeRole === "user" ? "1px solid #22c55e" : "1px solid rgba(255,255,255,0.1)"
        }}
      >
        <span>👤 Customer</span>
        {activeRole === "user"
          ? <span style={{ color: "#22c55e", fontSize: "12px" }}>Active</span>
          : <span style={{ color: "#aaa", fontSize: "12px" }}>Switch</span>
        }
      </div>

      {/* Seller Card */}
      <div
        onClick={() => activeRole !== "seller" && switchRole("seller")}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "10px 14px",
          borderRadius: "10px",
          cursor: activeRole === "seller" ? "default" : "pointer",
          background: activeRole === "seller" ? "rgba(99,102,241,0.1)" : "transparent",
          border: activeRole === "seller" ? "1px solid #6366f1" : "1px solid rgba(255,255,255,0.1)"
        }}
      >
        <span>🏪 Seller</span>
        {activeRole === "seller"
          ? <span style={{ color: "#6366f1", fontSize: "12px" }}>Active</span>
          : <span style={{ color: "#aaa", fontSize: "12px" }}>Switch</span>
        }
      </div>

    </div>
  );
};

export default WorkspaceSwitcher;
