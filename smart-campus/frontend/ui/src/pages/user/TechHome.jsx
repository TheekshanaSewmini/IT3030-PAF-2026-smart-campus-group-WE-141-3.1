import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../../api";
import { normalizeRole, roleHomePath } from "../../utils/roleHome";

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

export default function TechHome() {
    const navigate = useNavigate();
    const [homeData, setHomeData] = useState(null);
    const [profileData, setProfileData] = useState(null);
    const [error, setError] = useState("");

    useEffect(() => {
        const loadData = async () => {
            try {
                const [homeResponse, profileResponse] = await Promise.all([
                    api.get("/user/techi/techdashboard"),
                    api.get("/user/me"),
                ]);

                setHomeData(homeResponse.data);
                setProfileData(profileResponse.data);
            } catch (techError) {
                const status = techError.response?.status;

                if (status === 401) {
                    navigate("/login", { replace: true });
                    return;
                }

                if (status === 403) {
                    try {
                        const profileResponse = await api.get("/user/me");
                        const redirectPath = roleHomePath(profileResponse.data?.role);

                        if (redirectPath !== "/tech-home") {
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

                setError(getErrorMessage(techError, "Failed to load technician home."));
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
                <p>Loading technician home...</p>
            </div>
        );
    }

    const fullName = `${profileData?.name || ""} ${profileData?.lastName || ""}`.trim() || "Technician";
    const roleLabel = normalizeRole(profileData?.role) || "TECHNICIAN";

    return (
        <div className="page-shell">
            <div className="bg-layer bg-user" />
            <div className="panel page-panel">
                <header className="top-nav">
                    <div>
                        <h1 className="brand">Technician Home</h1>
                        <p className="subtitle">{homeData?.welcomeMessage || "Technician operations overview."}</p>
                    </div>
                    <div className="nav-group">
                        <Link className="nav-link" to="/tech-home">
                            Home
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
                            <h3>Technician Panel</h3>
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
                                <h3>Assigned Tasks</h3>
                                <p className="value">{homeData?.tasks ?? 0}</p>
                            </article>
                            <article className="stat-card">
                                <h3>Role</h3>
                                <p className="value">{roleLabel}</p>
                            </article>
                        </div>

                        <section className="section">
                            <h3>Quick Actions</h3>
                            <div className="actions-row">
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
