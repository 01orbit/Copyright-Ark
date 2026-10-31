import { lazy, Suspense, useEffect } from "react";
import { Route, Routes, useNavigate } from "react-router-dom";
import Layout from "./components/Layout";
import { useLanguage } from "./i18n";

const Landing = lazy(() => import("./Landing"));
const Discover = lazy(() => import("./pages/Discover"));
const Register = lazy(() => import("./pages/Register"));
const WorkDetail = lazy(() => import("./pages/WorkDetail"));
const Verify = lazy(() => import("./pages/Verify"));
const Account = lazy(() => import("./pages/Account"));
const Admin = lazy(() => import("./pages/Admin"));
const Developer = lazy(() => import("./pages/Developer"));

function PageLoading() {
  const { t } = useLanguage();
  return <div role="status" className="grid min-h-64 place-items-center text-sm text-muted">{t("正在加载页面…")}</div>;
}

export default function App() {
  const navigate = useNavigate();
  useEffect(() => {
    function openDeveloperMenu(event: KeyboardEvent) {
      if (event.altKey && event.shiftKey && event.code === "KeyD" && !event.repeat) {
        event.preventDefault();
        navigate("/dev");
      }
    }
    window.addEventListener("keydown", openDeveloperMenu);
    return () => window.removeEventListener("keydown", openDeveloperMenu);
  }, [navigate]);
  return (
    <Suspense fallback={<PageLoading />}>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route element={<Layout />}>
          <Route path="/discover" element={<Discover />} />
          <Route path="/register" element={<Register />} />
          <Route path="/works/:id" element={<WorkDetail />} />
          <Route path="/verify" element={<Verify />} />
          <Route path="/account" element={<Account />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/dev" element={<Developer />} />
          <Route path="*" element={<Discover />} />
        </Route>
      </Routes>
    </Suspense>
  );
}
