import React from "react";
import { Link } from "react-router-dom";

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-indigo-950 text-indigo-100 border-t border-indigo-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Footer Content Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          {/* Company Info */}
          <div>
            <h3 className="text-white font-bold text-xl mb-4">QuickSeva</h3>
            <p className="text-indigo-200 text-sm leading-relaxed">
              A modern authentication solution built with React. Secure, fast,
              and user-friendly.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-white font-semibold text-lg mb-4">
              Quick Links
            </h4>
            <ul className="space-y-2">
              <li>
                <Link
                  to="/"
                  className="text-indigo-200 hover:text-red-400 transition duration-200"
                >
                  Home
                </Link>
              </li>
              <li>
                <Link
                  to="/login"
                  className="text-indigo-200 hover:text-red-400 transition duration-200"
                >
                  Login
                </Link>
              </li>
              <li>
                <Link
                  to="/register"
                  className="text-indigo-200 hover:text-red-400 transition duration-200"
                >
                  Register
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact & Social */}
          <div>
            <h4 className="text-white font-semibold text-lg mb-4">Connect</h4>
            <ul className="space-y-2">
              <li>
                <a
                  href="mailto:contact@quickseva.com"
                  className="text-indigo-200 hover:text-red-400 transition duration-200"
                >
                  contact@quickseva.com
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="text-indigo-200 hover:text-red-400 transition duration-200"
                >
                  Twitter
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="text-indigo-200 hover:text-red-400 transition duration-200"
                >
                  GitHub
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-indigo-900 mb-6"></div>

        {/* Bottom Section */}
        <div className="flex flex-col md:flex-row justify-between items-center">
          <p className="text-indigo-200 text-sm mb-4 md:mb-0">
            &copy; {currentYear} QuickSeva. All rights reserved.
          </p>
          <div className="flex space-x-6">
            <a
              href="#"
              className="text-indigo-200 hover:text-red-400 text-sm transition duration-200"
            >
              Privacy Policy
            </a>
            <a
              href="#"
              className="text-indigo-200 hover:text-red-400 text-sm transition duration-200"
            >
              Terms of Service
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
