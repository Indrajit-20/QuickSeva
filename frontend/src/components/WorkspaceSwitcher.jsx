import { useAuth } from "../context/AuthContext";

const WorkspaceSwitcher = ({ layout = "dropdown" }) => {
  const { isSeller, activeRole, switchRole } = useAuth();

  const isUserActive = activeRole === "user";
  const isSellerActive = activeRole === "seller";

  const cardBase = {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: layout === "sidebar" ? "12px 16px" : "10px 14px",
    borderRadius: "10px",
    marginBottom: "8px",
    transition: "all 0.2s ease",
    width: "100%"
  };

  return (
    <div style={{ padding: layout === "dropdown" ? "10px 16px" : "4px 0" }}>

      <p style={{
        fontSize: "10px",
        color: "rgba(255,255,255,0.3)",
        textTransform: "uppercase",
        letterSpacing: "0.08em",
        marginBottom: "8px"
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
            ? "1px solid rgba(34,197,94,0.6)"
            : "1px solid rgba(255,255,255,0.08)"
        }}
      >
        <span style={{ fontSize: "13px", color: "#fff" }}>
          👤 Customer
        </span>
        {isUserActive
          ? <span style={{ fontSize:"11px", color:"#22c55e", fontWeight:600 }}>Active</span>
          : <span style={{ fontSize:"11px", color:"rgba(255,255,255,0.4)" }}>Switch</span>
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
            ? "rgba(99,102,241,0.08)"
            : "transparent",
          border: isSellerActive
            ? "1px solid rgba(99,102,241,0.6)"
            : "1px solid rgba(255,255,255,0.08)"
        }}
      >
        <span style={{ fontSize: "13px", color: "#fff" }}>
          🏪 {isSeller ? "Seller" : "Become a Seller"}
        </span>
        {isSeller ? (
          isSellerActive
            ? <span style={{ fontSize:"11px", color:"#6366f1", fontWeight:600 }}>Active</span>
            : <span style={{ fontSize:"11px", color:"rgba(255,255,255,0.4)" }}>Switch</span>
        ) : (
          <span style={{ fontSize:"11px", color:"#f43f5e", fontWeight:600 }}>Join</span>
        )}
      </div>

    </div>
  );
};

export default WorkspaceSwitcher;
