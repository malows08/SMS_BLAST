import { BrowserRouter as Router, Routes, Route } from "react-router";
import SignIn from "./pages/AuthPages/SignIn";
import SignUp from "./pages/AuthPages/SignUp";
import NotFound from "./pages/OtherPage/NotFound";
import UserProfiles from "./pages/UserProfiles";
import Videos from "./pages/UiElements/Videos";
import Images from "./pages/UiElements/Images";
import Alerts from "./pages/UiElements/Alerts";
import Badges from "./pages/UiElements/Badges";
import Avatars from "./pages/UiElements/Avatars";
import Buttons from "./pages/UiElements/Buttons";
import LineChart from "./pages/Charts/LineChart";
import BarChart from "./pages/Charts/BarChart";
import Calendar from "./pages/Calendar";
import BasicTables from "./pages/Tables/BasicTables";
import FormElements from "./pages/Forms/FormElements";
import CampaignReports from "./components/grid/CampaignReports";
import KizunaSMS from "./pages/Forms/KizunaSMS";
import QuickSend from "./pages/Forms/QuickSend";
import Blank from "./pages/Blank";
import AppLayout from "./layout/AppLayout";
import { ScrollToTop } from "./components/common/ScrollToTop";
import Home from "./pages/Dashboard/Home";
import { Toaster } from 'react-hot-toast';
//import { SenderIdProvider } from "./context/SenderIdContext";
//import { SmsProvider } from "./context/SmsProviderContext";
import { RefreshProvider } from "./context/RefreshContext"; // ✅ Import this

export default function App() {
  return (
    <RefreshProvider> {/* ✅ Wrap everything inside RefreshProvider */}
      <Toaster
        position="top-center"
        containerStyle={{
          position: "fixed",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          zIndex: 9999,
        }}
        toastOptions={{
          duration: 4000,
          style: {
            padding: "16px 24px",
            fontWeight: "bold",
            borderRadius: "8px",
            background: "#fff",
            color: "#000",
            boxShadow: "0 4px 12px rgba(0, 0, 0, 0.2)",
          },
        }}
      />
      <Router>
        <ScrollToTop />
        <Routes>
          <Route path="/" element={<SignIn />} />
          <Route path="/dashboard" element={<AppLayout />}>
            <Route index element={<Home />} />
            <Route path="profile" element={<UserProfiles />} />
            <Route path="calendar" element={<Calendar />} />
            <Route path="blank" element={<Blank />} />
            <Route path="form-elements" element={<FormElements />} />
            <Route path="campaign-reports" element={<CampaignReports />} />
            <Route path="kizuna-sms" element={<KizunaSMS />} />
            <Route path="quick-send" element={<QuickSend />} />
            <Route path="role-tables" element={<BasicTables />} />
            <Route path="alerts" element={<Alerts />} />
            <Route path="avatars" element={<Avatars />} />
            <Route path="badge" element={<Badges />} />
            <Route path="buttons" element={<Buttons />} />
            <Route path="images" element={<Images />} />
            <Route path="videos" element={<Videos />} />
            <Route path="line-chart" element={<LineChart />} />
            <Route path="bar-chart" element={<BarChart />} />
          </Route>

          <Route path="/signin" element={<SignIn />} />
          <Route path="/signup" element={<SignUp />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Router>
    </RefreshProvider>
  );
}
