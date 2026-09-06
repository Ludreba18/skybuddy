import { ReactNode } from "react";
import { Link, useNavigate, useLocation, Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useAccessStatus } from "@/hooks/useAccessStatus";
import { Button } from "@/components/ui/button";
import { Plane, User, Mail, LogOut, Clock } from "lucide-react";
import { NotificationDropdown } from "@/components/notifications/NotificationDropdown";
import MobileBottomNav from "./MobileBottomNav";
import DashboardFooter from "./DashboardFooter";

interface DashboardLayoutProps {
  children: ReactNode;
}

const DashboardLayout = ({ children }: DashboardLayoutProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, profile, loading, signOut } = useAuth();
  const { hasActiveAccess, daysRemaining, isInTrial } = useAccessStatus();

  const displayName = profile?.nickname || profile?.first_name || "Pilot";

  // Navigation items - for desktop secondary nav
  const navItems = [
    { name: "Mein Cockpit", href: "/dashboard" },
    { name: "Piloten", href: "/pilots" },
    { name: "Fly-Outs & Events", href: "/events" },
    { name: "Gruppen", href: "/groups" },
    { name: "Forum", href: "/forum" },
    { name: "Nachrichten", href: "/messages" },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Plane className="w-12 h-12 text-primary animate-pulse" />
      </div>
    );
  }

  if (!user || !profile) {
    return <Navigate to="/auth" replace />;
  }

  // Redirect to subscribe if access expired
  if (!hasActiveAccess) {
    return <Navigate to="/subscribe" replace />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/30 flex flex-col pb-16 md:pb-0">
      {/* Trial Expiring Banner */}
      {isInTrial && daysRemaining <= 7 && (
        <div className="bg-gradient-to-r from-amber-500/90 to-orange-500/90 text-white py-2 px-4 text-center text-sm">
          <Clock className="w-4 h-4 inline-block mr-2" />
          Deine Testphase endet in {daysRemaining} {daysRemaining === 1 ? "Tag" : "Tagen"}.{" "}
          <Link to="/subscribe" className="underline font-semibold hover:no-underline">
            Jetzt Mitglied werden
          </Link>
        </div>
      )}

      {/* Top Header - Enhanced */}
      <header className="bg-card/95 backdrop-blur-xl border-b border-border/50 sticky top-0 z-50 shadow-sm">
        <div className="container mx-auto px-3 sm:px-4">
          <div className="flex items-center justify-between h-14 sm:h-16">
            {/* Logo with hover effect */}
            <Link to="/" className="flex items-center gap-2 group">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl hero-gradient flex items-center justify-center shadow-lg group-hover:shadow-xl group-hover:scale-105 transition-all duration-300">
                <Plane className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              </div>
              <span className="font-heading font-bold text-lg sm:text-xl">
                Sky<span className="text-gradient-sky">Buddy</span>
              </span>
            </Link>

            {/* Header Actions - Enhanced */}
            <div className="flex items-center gap-1.5 sm:gap-3">
              <Link
                to="/messages"
                className={`relative p-2 rounded-xl hover:bg-primary/10 transition-all duration-200 hidden sm:block group ${
                  location.pathname === "/messages" ? "bg-primary/10" : ""
                }`}
              >
                <Mail className={`w-5 h-5 transition-colors ${location.pathname === "/messages" ? "text-primary" : "text-muted-foreground group-hover:text-primary"}`} />
              </Link>
              <NotificationDropdown />
              <Link
                to="/profile"
                className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-primary/10 transition-all duration-200 group"
              >
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary/10 to-secondary/10 flex items-center justify-center overflow-hidden ring-1 ring-primary/10 group-hover:ring-primary/30 transition-all">
                  {profile.avatar_url ? (
                    <img
                      src={profile.avatar_url}
                      alt="Avatar"
                      className="w-8 h-8 rounded-xl object-cover"
                    />
                  ) : (
                    <User className="w-4 h-4 text-primary" />
                  )}
                </div>
                <span className="hidden md:block text-sm font-medium group-hover:text-primary transition-colors">{displayName}</span>
              </Link>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  signOut();
                  navigate("/");
                }}
                className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 hidden sm:flex rounded-xl"
              >
                <LogOut className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Secondary Navigation - Sticky */}
      <nav className="bg-card/95 backdrop-blur-sm border-b border-border/50 hidden md:block sticky top-14 sm:top-16 z-40">
        <div className="container mx-auto px-4">
          <div className="flex items-center gap-1 overflow-x-auto py-2 scrollbar-hide">
            {navItems.map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all duration-200 ${
                    isActive
                      ? "bg-primary text-primary-foreground shadow-md"
                      : "text-muted-foreground hover:bg-primary/10 hover:text-primary"
                  }`}
                >
                  {item.name}
                </Link>
              );
            })}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      {children}

      {/* Footer mit rechtlichen Links */}
      <DashboardFooter />

      {/* Mobile Bottom Navigation */}
      <MobileBottomNav />
    </div>
  );
};

export default DashboardLayout;