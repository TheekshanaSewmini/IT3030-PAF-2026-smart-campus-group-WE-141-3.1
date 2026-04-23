import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../../api";
import { normalizeRole, roleHomePath } from "../../utils/roleHome";
import AppNavbar from "../../components/AppNavbar";
import { HiBell, HiCalendar, HiShieldCheck, HiOfficeBuilding, HiBookOpen, HiUser, HiCog, HiArrowRight } from "react-icons/hi";

function getErrorMessage(error, fallback) {
    const payload = error?.response?.data;

    if (typeof payload === "string" && payload.trim()) {
        return payload;
    }

    if (payload?.message) {
        return payload.message;
    }

    return fallback;
}

export default function Home() {
    const navigate = useNavigate();
    const [homeData, setHomeData] = useState(null);
    const [profileData, setProfileData] = useState(null);
    const [error, setError] = useState("");

    useEffect(() => {
        const loadData = async () => {
            try {
                const [homeResponse, profileResponse] = await Promise.all([
                    api.get("/user/home"),
                    api.get("/user/me"),
                ]);

                setHomeData(homeResponse.data);
                setProfileData(profileResponse.data);
            } catch (loadError) {
                const status = loadError.response?.status;
                if (status === 401) {
                    navigate("/login", { replace: true });
                    return;
                }

                if (status === 403) {
                    try {
                        const profileResponse = await api.get("/user/me");
                        const redirectPath = roleHomePath(profileResponse.data?.role);

                        if (redirectPath !== "/home") {
                            navigate(redirectPath, { replace: true });
                            return;
                        }
                    } catch (profileError) {
                        if (profileError.response?.status === 401) {
                            navigate("/login", { replace: true });
                            return;
                        }
                    }
                }

                setError(getErrorMessage(loadError, "Failed to load home details."));
            }
        };

        loadData();
    }, [navigate]);

    const handleLogout = async () => {
        try {
            await api.post("/auth/logout");
        } finally {
            navigate("/login", { replace: true });
        }
    };

    if (!homeData && !error) {
        return (
            <div className="loading-center">
                <div className="spinner" />
                <p>Loading home...</p>
            </div>
        );
    }

    const fullName = `${profileData?.name || ""} ${profileData?.lastName || ""}`.trim() || "User";
    const roleLabel = normalizeRole(profileData?.role) || "USER";

    return (
        <div className="page-shell">
            <div className="bg-layer bg-user" />
            <div className="page-container main-dashboard">
                <AppNavbar
                    title="Dashboard"
                    profile={profileData}
                    onLogout={handleLogout}
                />

                <main className="dashboard-content">
                    {error && <div className="message error glass-alert">{error}</div>}

                    {!error && (
                        <div className="dashboard-grid">
                            {/* Welcome Section */}
                            <section className="welcome-hero glass-panel">
                                <div className="hero-content">
                                    <span className="hero-badge">Welcome Back</span>
                                    <h2 className="hero-title">
                                        Hello, <span className="text-highlight">{profileData?.name || "User"}</span>!
                                    </h2>
                                    <p className="hero-subtitle">
                                        {homeData?.welcomeMessage || "Manage your university resources and bookings in one place."}
                                    </p>
                                    <div className="hero-actions">
                                        <Link to="/booking" className="btn btn-primary hero-btn">
                                            Manage Bookings <HiArrowRight />
                                        </Link>
                                    </div>
                                </div>
                                <div className="hero-visual">
                                    <div className="visual-circle blue" />
                                    <div className="visual-circle purple" />
                                </div>
                            </section>

                            {/* Status Section */}
                            <div className="stats-row">
                                <article className="stat-card glass-card">
                                    <div className="stat-icon stats-icon--blue"><HiBell /></div>
                                    <div className="stat-info">
                                        <h4 className="stat-label">Notifications</h4>
                                        <p className="stat-value">{homeData?.notifications ?? 0}</p>
                                    </div>
                                </article>
                                <article className="stat-card glass-card">
                                    <div className="stat-icon stats-icon--purple"><HiCalendar /></div>
                                    <div className="stat-info">
                                        <h4 className="stat-label">Active Bookings</h4>
                                        <p className="stat-value">{homeData?.tasks ?? 0}</p>
                                    </div>
                                </article>
                                <article className="stat-card glass-card">
                                    <div className="stat-icon stats-icon--green"><HiShieldCheck /></div>
                                    <div className="stat-info">
                                        <h4 className="stat-label">Account Role</h4>
                                        <p className="stat-value highlight-role">{roleLabel}</p>
                                    </div>
                                </article>
                            </div>

                            {/* Quick Access Section */}
                            <section className="quick-access-section glass-panel">
                                <div className="section-header">
                                    <h3>Quick Access</h3>
                                    <p>Jump to your most used features</p>
                                </div>
                                <div className="quick-nav-grid">
                                    <Link to="/resources" className="nav-card">
                                        <div className="nav-card-icon"><HiOfficeBuilding /></div>
                                        <div className="nav-card-body">
                                            <h4>Resources</h4>
                                            <p>Browse available campus facilities</p>
                                        </div>
                                    </Link>
                                    <Link to="/booking" className="nav-card">
                                        <div className="nav-card-icon"><HiBookOpen /></div>
                                        <div className="nav-card-body">
                                            <h4>Booking</h4>
                                            <p>Check availability and reserve</p>
                                        </div>
                                    </Link>
                                    <Link to="/profile" className="nav-card">
                                        <div className="nav-card-icon"><HiUser /></div>
                                        <div className="nav-card-body">
                                            <h4>My Profile</h4>
                                            <p>View and manage your account</p>
                                        </div>
                                    </Link>
                                    <Link to="/settings" className="nav-card">
                                        <div className="nav-card-icon"><HiCog /></div>
                                        <div className="nav-card-body">
                                            <h4>Settings</h4>
                                            <p>Preferences and security</p>
                                        </div>
                                    </Link>
                                </div>
                            </section>
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
}
