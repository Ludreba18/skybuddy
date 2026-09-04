import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import CookieConsent from "@/components/gdpr/CookieConsent";
import { Plane } from "lucide-react";

// Eagerly load Index for fast FCP on landing page
import Index from "./pages/Index";

// Lazy load all other pages to reduce initial bundle size
const Auth = lazy(() => import("./pages/Auth"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Profile = lazy(() => import("./pages/Profile"));
const Events = lazy(() => import("./pages/Events"));
const Pilots = lazy(() => import("./pages/Pilots"));
const Messages = lazy(() => import("./pages/Messages"));
const Forum = lazy(() => import("./pages/Forum"));
const Groups = lazy(() => import("./pages/Groups"));
const GroupDetail = lazy(() => import("./pages/GroupDetail"));
const Subscribe = lazy(() => import("./pages/Subscribe"));
const Account = lazy(() => import("./pages/Account"));
const NotFound = lazy(() => import("./pages/NotFound"));
const Impressum = lazy(() => import("./pages/legal/Impressum"));
const Datenschutz = lazy(() => import("./pages/legal/Datenschutz"));
const AGB = lazy(() => import("./pages/legal/AGB"));
const CommunityGuidelines = lazy(() => import("./pages/legal/CommunityGuidelines"));
const Faq = lazy(() => import("./pages/support/Faq"));
const Kontakt = lazy(() => import("./pages/support/Kontakt"));
const Feedback = lazy(() => import("./pages/support/Feedback"));

// Minimal loading fallback to not block FCP
const PageLoader = () => (
  <div className="min-h-screen bg-background flex items-center justify-center">
    <Plane className="w-10 h-10 text-primary animate-pulse" />
  </div>
);

const App = () => (
  <AuthProvider>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <CookieConsent />
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/passwort-zuruecksetzen" element={<ResetPassword />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/events" element={<Events />} />
            <Route path="/pilots" element={<Pilots />} />
            <Route path="/messages" element={<Messages />} />
            <Route path="/forum" element={<Forum />} />
            <Route path="/groups" element={<Groups />} />
            <Route path="/groups/:groupId" element={<GroupDetail />} />
            <Route path="/subscribe" element={<Subscribe />} />
            <Route path="/premium" element={<Subscribe />} />
            <Route path="/account" element={<Account />} />
            <Route path="/impressum" element={<Impressum />} />
            <Route path="/datenschutz" element={<Datenschutz />} />
            <Route path="/agb" element={<AGB />} />
            <Route path="/community-richtlinien" element={<CommunityGuidelines />} />
            <Route path="/hilfe" element={<Faq />} />
            <Route path="/kontakt" element={<Kontakt />} />
            <Route path="/feedback" element={<Feedback />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </TooltipProvider>
  </AuthProvider>
);

export default App;
