import React from "react";
import { ShieldCheck, TrendingUp, BookOpen, MessageSquareCode, FileText, User, LogOut, ChevronRight, Menu, X } from "lucide-react";

interface NavbarProps {
  currentTab: string;
  setTab: (tab: string) => void;
  user: any;
  onLogout: () => void;
  openLoginModal: () => void;
}

export default function Navbar({ currentTab, setTab, user, onLogout, openLoginModal }: NavbarProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  const navItems = [
    { label: "Analyzer", value: "analyzer", icon: ShieldCheck },
    { label: "Trends", value: "trends", icon: TrendingUp },
    { label: "Learning Center", value: "learning", icon: BookOpen },
    { label: "History", value: "history", icon: FileText, protected: true },
  ];

  const handleNavClick = (value: string, isProtected?: boolean) => {
    if (isProtected && !user) {
      openLoginModal();
    } else {
      setTab(value);
    }
    setMobileMenuOpen(false);
  };

  return (
    <nav className="sticky top-0 z-40 w-full bg-white/85 backdrop-blur-md border-b border-slate-100 shadow-sm" id="navbar">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo Branding */}
          <div className="flex items-center cursor-pointer" onClick={() => setTab("landing")}>
            <div className="flex items-center gap-2">
              <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-blue-600 text-white shadow-md shadow-blue-500/20">
                <ShieldCheck className="w-6 h-6 stroke-[2.25]" />
              </div>
              <div>
                <span className="font-sans text-xl font-extrabold tracking-tight bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent">
                  TruthLens
                </span>
                <span className="text-xs font-semibold text-slate-400 block -mt-1 tracking-wider uppercase">AI Core</span>
              </div>
            </div>
          </div>

          {/* Desktop Nav Items */}
          <div className="hidden md:flex items-center space-x-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentTab === item.value;
              return (
                <button
                  key={item.value}
                  onClick={() => handleNavClick(item.value, item.protected)}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    isActive
                      ? "text-blue-600 bg-blue-50/70"
                      : "text-slate-600 hover:text-blue-600 hover:bg-slate-50"
                  }`}
                >
                  <Icon className={`w-4.5 h-4.5 ${isActive ? "text-blue-600" : "text-slate-400"}`} />
                  {item.label}
                </button>
              );
            })}
          </div>

          {/* Auth Controls */}
          <div className="hidden md:flex items-center gap-3">
            {user ? (
              <div className="flex items-center gap-2.5">
                <button
                  onClick={() => setTab("profile")}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-sm font-medium transition-all ${
                    currentTab === "profile"
                      ? "border-blue-600 bg-blue-50/50 text-blue-600"
                      : "border-slate-200 text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  <User className="w-4 h-4 text-slate-500" />
                  <span className="max-w-[110px] truncate">{user.name}</span>
                </button>
                <button
                  onClick={onLogout}
                  className="p-2 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all"
                  title="Logout"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            ) : (
              <button
                onClick={openLoginModal}
                className="flex items-center gap-1 px-4.5 py-2 rounded-xl text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-500/10 hover:shadow-blue-500/20 active:translate-y-px transition-all"
              >
                Sign In
                <ChevronRight className="w-4.5 h-4.5" />
              </button>
            )}
          </div>

          {/* Mobile Menu Action */}
          <div className="flex items-center md:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-100 bg-white py-3 px-4 space-y-1.5 shadow-lg">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.value;
            return (
              <button
                key={item.value}
                onClick={() => handleNavClick(item.value, item.protected)}
                className={`flex items-center gap-3 w-full px-4 py-2.5 rounded-lg text-left text-sm font-medium transition-all ${
                  isActive ? "bg-blue-50 text-blue-600" : "text-slate-600 hover:bg-slate-50"
                }`}
              >
                <Icon className="w-5 h-5" />
                {item.label}
              </button>
            )}
          )}
          <hr className="border-slate-100 my-2" />
          {user ? (
            <div className="space-y-1.5 pt-1">
              <button
                onClick={() => {
                  setTab("profile");
                  setMobileMenuOpen(false);
                }}
                className="flex items-center gap-3 w-full px-4 py-2.5 rounded-lg text-left text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                <User className="w-5 h-5 text-slate-400" />
                Profile ({user.name})
              </button>
              <button
                onClick={() => {
                  onLogout();
                  setMobileMenuOpen(false);
                }}
                className="flex items-center gap-3 w-full px-4 py-2.5 rounded-lg text-left text-sm font-medium text-red-600 hover:bg-red-50"
              >
                <LogOut className="w-5 h-5" />
                Sign Out
              </button>
            </div>
          ) : (
            <button
              onClick={() => {
                openLoginModal();
                setMobileMenuOpen(false);
              }}
              className="flex items-center justify-center gap-1.5 w-full py-2.5 px-4 rounded-xl text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700"
            >
              Sign In Account
            </button>
          )}
        </div>
      )}
    </nav>
  );
}
