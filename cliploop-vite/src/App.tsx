import { Routes, Route } from "react-router-dom";
import { PublicLayout } from "./layouts/PublicLayout";
import { AppLayout } from "./layouts/AppLayout";
import LandingPage from "./pages/LandingPage";
import PricingPage from "./pages/PricingPage";
import SignInPage from "./pages/SignInPage";
import DashboardHome from "./pages/app/DashboardHome";
import CreatePage from "./pages/app/CreatePage";
import ProjectsPage from "./pages/app/ProjectsPage";
import ChatsPage from "./pages/app/ChatsPage";
import WeeklyPromoPage from "./pages/app/WeeklyPromo";
import ApiKeysPage from "./pages/app/ApiKeysPage";
import TermsPage from "./pages/TermsPage";
import PrivacyPage from "./pages/PrivacyPage";
import SupportPage from "./pages/SupportPage";
import RequestAccessPage from "./pages/RequestAccessPage";

export default function App() {
  return (
    <Routes>
      {/* Public routes with header/footer */}
      <Route element={<PublicLayout />}>
        <Route path="/" element={<LandingPage />} />
        <Route path="/pricing" element={<PricingPage />} />
        <Route path="/signin" element={<SignInPage />} />
        <Route path="/terms" element={<TermsPage />} />
        <Route path="/privacy" element={<PrivacyPage />} />
        <Route path="/support" element={<SupportPage />} />
        <Route path="/request-access" element={<RequestAccessPage />} />
      </Route>

      {/* App routes with sidebar */}
      <Route element={<AppLayout />}>
        <Route path="/app" element={<DashboardHome />} />
        <Route path="/app/create" element={<CreatePage />} />
        <Route path="/app/projects" element={<ProjectsPage />} />
        <Route path="/app/chats" element={<ChatsPage />} />
        <Route path="/app/weekly-promo" element={<WeeklyPromoPage />} />
        <Route path="/app/settings/api-keys" element={<ApiKeysPage />} />
      </Route>
    </Routes>
  );
}
