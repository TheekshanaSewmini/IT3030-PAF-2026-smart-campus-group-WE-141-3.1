import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../../api";

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
            } catch (userError) {
                if (userError.response?.status === 403) {
                    try {
                        const [adminDashboardResponse, adminProfileResponse] = await Promise.all([
                            api.get("/user/Admin/dashboard"),
                            api.get("/user/Admin/me"),
                        ]);

                        setHomeData(adminDashboardResponse.data);
                        setProfileData(adminProfileResponse.data);
                        return;
                    } catch (adminError) {
                        const status = adminError.response?.status;
                        if (status === 401 || status === 403) {
                            navigate("/login", { replace: true });
                            return;
                        }

                        setError(getErrorMessage(adminError, "Failed to load home details."));
                        return;
                    }
                }

                const status = userError.response?.status;
                if (status === 401 || status === 403) {
                    navigate("/login", { replace: true });
                    return;
                }

                setError(getErrorMessage(userError, "Failed to load home details."));
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
    const roleLabel = String(profileData?.role || "").replace("ROLE_", "") || "USER";

    return (
        <div className="page-shell">
            <div className="bg-layer bg-user" />
            <div className="panel page-panel">
                <header className="top-nav">
                    <div>
                        <h1 className="brand">Home</h1>
                        <p className="subtitle">{homeData?.welcomeMessage || "Welcome to Smart Campus."}</p>
                    </div>
                    <div className="nav-group">
                        <Link className="nav-link" to="/dashboard">
                            Dashboard
                        </Link>
                        <Link className="nav-link" to="/profile">
                            Profile
                        </Link>
                        <Link className="nav-link" to="/settings">
                            Settings
                        </Link>
                        <button className="btn btn-danger" type="button" onClick={handleLogout}>
                            Logout
                        </button>
                    </div>
                </header>

                {error && <p className="message error">{error}</p>}

                {!error && (
                    <>
                        <section className="section">
                            <h3>Welcome Back</h3>
                            <p>
                                Logged in as <strong>{fullName}</strong> ({roleLabel}).
                            </p>
                        </section>

                        <div className="stats">
                            <article className="stat-card">
                                <h3>Notifications</h3>
                                <p className="value">{homeData?.notifications ?? 0}</p>
                            </article>
                            <article className="stat-card">
                                <h3>Open Tasks</h3>
                                <p className="value">{homeData?.tasks ?? 0}</p>
                            </article>
                            <article className="stat-card">
                                <h3>Role</h3>
                                <p className="value">{roleLabel}</p>
                            </article>
                        </div>

                        <section className="section">
                            <h3>Quick Navigation</h3>
                            <div className="actions-row">
                                <Link className="btn btn-secondary" to="/dashboard">
                                    Open Dashboard
                                </Link>
                                <Link className="btn btn-secondary" to="/profile">
                                    View Profile
                                </Link>
                                <Link className="btn btn-secondary" to="/settings">
                                    Account Settings
                                </Link>
                            </div>
                        </section>
                    </>
                )}
            </div>
        </div>
    );
}
