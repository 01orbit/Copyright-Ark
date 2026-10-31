import { useEffect } from "react";
import { Route, Routes, useNavigate } from "react-router-dom";
import Landing from "./Landing";
import Layout from "./components/Layout";
import Discover from "./pages/Discover";
import Register from "./pages/Register";
import WorkDetail from "./pages/WorkDetail";
import Verify from "./pages/Verify";
import Account from "./pages/Account";
import Admin from "./pages/Admin";
import Developer from "./pages/Developer";

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
  );
}
