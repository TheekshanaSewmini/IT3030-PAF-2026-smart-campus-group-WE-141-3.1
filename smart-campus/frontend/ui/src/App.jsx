import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import Login from "./pages/auth/Login.jsx";
import Signup from "./pages/auth/Signup.jsx";
import VerifyOtp from "./pages/auth/VerifyOtp.jsx";
import ForgotPassword from "./pages/user/ForgotPassword.jsx";
import Home from "./pages/user/Home.jsx";
import Dashboard from "./pages/user/Dashboard.jsx";
import TechHome from "./pages/user/TechHome.jsx";
import Profile from "./pages/user/Profile.jsx";
import Settings from "./pages/user/Settings.jsx";
import AdminResources from "./pages/user/AdminResources.jsx";

export default function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<Navigate to="/login" replace />} />
                <Route path="/login" element={<Login />} />
                <Route path="/signup" element={<Signup />} />
                <Route path="/verify" element={<VerifyOtp />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />

                <Route path="/home" element={<Home />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/admin/resources" element={<AdminResources />} />
                <Route path="/tech-home" element={<TechHome />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/settings" element={<Settings />} />

                <Route path="*" element={<Navigate to="/login" replace />} />
            </Routes>
        </BrowserRouter>
    );
}
