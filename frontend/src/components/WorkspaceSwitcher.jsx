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
