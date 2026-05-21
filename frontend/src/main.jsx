import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { seedFakeSellers } from "./data/seedSellers";
import "./index.css";
import App from "./App.jsx";

seedFakeSellers();

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <App />
  </StrictMode>
);
