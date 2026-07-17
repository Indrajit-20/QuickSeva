import React from "react";
import { Link } from "react-router-dom";
import { Mail, Heart } from "lucide-react";

const GithubIcon = (props) => (
  <svg
    viewBox="0 0 24 24"
    width="15"
    height="15"
    stroke="currentColor"
    strokeWidth="2.5"
    fill="none"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22" />
  </svg>
);

const TwitterIcon = (props) => (
  <svg
    viewBox="0 0 24 24"
    width="15"
    height="15"
    stroke="currentColor"
    strokeWidth="2.5"
    fill="none"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M23 3a10.9 10.9 0 0 1-3.14 1.53 4.48 4.48 0 0 0-7.86 3v1A10.66 10.66 0 0 1 3 4s-4 9 5 13a11.64 11.64 0 0 1-7 2c9 5 20 0 20-11.5a4.5 4.5 0 0 0-.08-.83A7.72 7.72 0 0 0 23 3z" />
  </svg>
);

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-slate-50 text-slate-600 border-t border-slate-200 pb-20 text-left relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Footer Content Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 mb-10">
          {/* Company Info */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <span className="text-xl font-black tracking-tight text-slate-800">
                Quick<span className="text-indigo-600">Seva</span>
              </span>
            </div>
            <p className="text-slate-500 text-sm leading-relaxed font-semibold">
              A modern localized service solution. Find and book verified local service experts near you instantly.
            </p>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h4 className="text-slate-800 font-bold text-xs uppercase tracking-wider">
              Quick Links
            </h4>
            <ul className="space-y-2.5 font-bold text-sm">
              <li>
                <Link
                  to="/"
                  className="text-slate-500 hover:text-indigo-650 transition duration-200"
                >
                  Home
                </Link>
              </li>
              <li>
                <Link
                  to="/login"
                  className="text-slate-500 hover:text-indigo-650 transition duration-200"
                >
                  Login
                </Link>
              </li>
              <li>
                <Link
                  to="/register"
                  className="text-slate-500 hover:text-indigo-650 transition duration-200"
                >
                  Register
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact & Social */}
          <div className="space-y-4">
            <h4 className="text-slate-800 font-bold text-xs uppercase tracking-wider">
              Connect
            </h4>
            <ul className="space-y-3 font-bold text-sm">
              <li>
                <a
                  href="mailto:contact@quickseva.com"
                  className="inline-flex items-center gap-2 text-slate-500 hover:text-indigo-650 transition duration-200"
                >
                  <Mail size={15} className="text-slate-400" />
                  <span>contact@quickseva.com</span>
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="inline-flex items-center gap-2 text-slate-500 hover:text-indigo-650 transition duration-200"
                >
                  <TwitterIcon className="text-slate-400" />
                  <span>Twitter</span>
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="inline-flex items-center gap-2 text-slate-500 hover:text-indigo-650 transition duration-200"
                >
                  <GithubIcon className="text-slate-400" />
                  <span>GitHub</span>
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-slate-200 mb-6"></div>

        {/* Bottom Section */}
        <div className="flex flex-col sm:flex-row justify-between items-center text-xs font-semibold text-slate-500 gap-4">
          <p>
            &copy; {currentYear} QuickSeva. Made with <Heart size={12} className="inline text-red-500 fill-red-500" />.
          </p>
          <div className="flex space-x-6">
            <Link
              to="/privacy-policy"
              className="text-slate-450 hover:text-indigo-650 transition duration-200"
            >
              Privacy Policy
            </Link>
            <Link
              to="/terms-of-service"
              className="text-slate-455 hover:text-indigo-650 transition duration-200"
            >
              Terms of Service
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
