import { useState } from "react";
import { Link, useLocation } from "react-router";
import { useAuth } from "@/hooks/useAuth";
import {
  Mic,
  History,
  Cat,
  Settings,
  LayoutDashboard,
  LogOut,
  User,
  Menu,
  X,
} from "lucide-react";

const navItems = [
  { path: "/", label: "Translator", icon: Mic },
  { path: "/history", label: "History", icon: History },
  { path: "/profiles", label: "Cats", icon: Cat },
  { path: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { path: "/settings", label: "Settings", icon: Settings },
];

export default function Header() {
  const { user, isAuthenticated, logout } = useAuth();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="fixed top-0 left-0 right-0 z-40 h-16">
      <div
        className="h-full mx-4 mt-3 rounded-2xl flex items-center justify-between px-6"
        style={{
          background: "rgba(255, 255, 255, 0.03)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          border: "1px solid rgba(255, 255, 255, 0.08)",
        }}
      >
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#33ff99]/20 to-[#33ccdd]/20 flex items-center justify-center">
            <Cat className="w-4 h-4 text-[#33ff99]" />
          </div>
          <span
            className="text-sm font-semibold tracking-[0.1em] text-white/90"
            style={{ fontFamily: "'Space Grotesk', sans-serif" }}
          >
            PURRCEPTION
          </span>
        </Link>

        {/* Center Status Pill */}
        <div className="hidden md:flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/[0.03] border border-white/[0.06]">
          <span className="w-1.5 h-1.5 rounded-full bg-[#33ff99] animate-pulse" />
          <span className="text-[11px] text-white/50 tracking-wide">
            Neural Engine Active
          </span>
        </div>

        {/* Desktop Nav */}
        <nav className="hidden lg:flex items-center gap-1">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium transition-all duration-200 ${
                  isActive
                    ? "bg-white/[0.06] text-[#33ff99] border border-[#33ff99]/20"
                    : "text-white/40 hover:text-white/70 hover:bg-white/[0.03]"
                }`}
              >
                <item.icon className="w-3.5 h-3.5" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Right Side */}
        <div className="flex items-center gap-2">
          {isAuthenticated && user ? (
            <div className="hidden sm:flex items-center gap-2">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                {user.avatar ? (
                  <img
                    src={user.avatar}
                    alt=""
                    className="w-5 h-5 rounded-full"
                  />
                ) : (
                  <User className="w-4 h-4 text-white/50" />
                )}
                <span className="text-xs text-white/60 max-w-[100px] truncate">
                  {user.name || "User"}
                </span>
              </div>
              <button
                onClick={logout}
                className="p-2 rounded-xl text-white/30 hover:text-red-400 hover:bg-white/[0.03] transition-all"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <Link
              to="/login"
              className="glass-button px-4 py-2 text-xs font-medium"
            >
              Sign In
            </Link>
          )}

          {/* Mobile Menu Toggle */}
          <button
            className="lg:hidden p-2 rounded-xl text-white/50 hover:text-white/80 hover:bg-white/[0.03] transition-all"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? (
              <X className="w-5 h-5" />
            ) : (
              <Menu className="w-5 h-5" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Nav */}
      {mobileMenuOpen && (
        <div
          className="lg:hidden mx-4 mt-2 rounded-2xl p-4"
          style={{
            background: "rgba(255, 255, 255, 0.03)",
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
            border: "1px solid rgba(255, 255, 255, 0.08)",
          }}
        >
          <nav className="flex flex-col gap-1">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                    isActive
                      ? "bg-white/[0.06] text-[#33ff99] border border-[#33ff99]/20"
                      : "text-white/40 hover:text-white/70 hover:bg-white/[0.03]"
                  }`}
                >
                  <item.icon className="w-4 h-4" />
                  {item.label}
                </Link>
              );
            })}
            {isAuthenticated && (
              <button
                onClick={() => {
                  logout();
                  setMobileMenuOpen(false);
                }}
                className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-red-400/70 hover:text-red-400 hover:bg-white/[0.03] transition-all"
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </button>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
