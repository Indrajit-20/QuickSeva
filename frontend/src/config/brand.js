/**
 * BRAND CONFIG - Single source of truth for app branding
 * UPDATE ONLY THIS FILE when you rename the app or change logo/colors.
 */
import React from "react";

export const BRAND = {
  name: "QuickSeva",
  namePart1: "Quick",
  namePart2: "Seva",
  tagline: "Professional Local Services",
  primaryColor: "#6366f1",
  accentColor: "#3b82f6",
  primaryLight: "rgba(99, 102, 241, 0.12)",
  bgColor: "#f8fafc",
  textDark: "#1e293b",
  textMuted: "#94a3b8",
};

export function BrandLogoIcon({ size = 30 }) {
  return React.createElement("svg", { width: size, height: size, viewBox: "0 0 30 30", fill: "none" },
    React.createElement("rect", { width: "30", height: "30", rx: "8", fill: BRAND.primaryColor }),
    React.createElement("path", { d: "M8 15.5L13 20.5L22 10", stroke: "white", strokeWidth: "2.5", strokeLinecap: "round", strokeLinejoin: "round" })
  );
}

export function getPageTitle(pageTitle) {
  return pageTitle ? pageTitle + " — " + BRAND.name : BRAND.name;
}
