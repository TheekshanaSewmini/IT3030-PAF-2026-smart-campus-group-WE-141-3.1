import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../../api";
import { normalizeRole, roleHomePath } from "../../utils/roleHome";

export default function Dashboard() {
    const navigate = useNavigate();

    const [homeData, setHomeData] = useState(null);
    const [profile, setProfile] = useState(null);
    const [error, setError] = useState("");

    useEffect(() => {
        const loadDashboard = async () => {
            try {
                const [dashboardResponse, profileResponse] = await Promise.all([
                    api.get("/user/Admin/dashboard"),
                    api.get("/user/Admin/me"),
                ]);

                setHomeData(dashboardResponse.data);
                setProfile(profileResponse.data);
            } catch (adminError) {
                const status = adminError.response?.status;

                if (status === 401) {
                    navigate("/login", { replace: true });
                    return;
                }

                if (status === 403) {
                    try {
                        const profileResponse = await api.get("/user/me");
                        const redirectPath = roleHomePath(profileResponse.data?.role);

                        if (redirectPath !== "/dashboard") {
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

                setError(adminError.response?.data?.message || "Failed to load dashboard.");
            }
        };

        loadDashboard();
    }, [navigate]);

    const handleLogout = async () => {
        try {
            // Call logout endpoint to clear cookies on backend
            await api.post("/auth/logout", {}, { withCredentials: true });
        } catch (err) {
            console.log("Logout error:", err.message);
        } finally {
            // Redirect to login regardless of API result
            navigate("/login", { replace: true });
        }
    };

    if (!homeData && !error) {
        return (
            <div className="loading-center">
                <div className="spinner" />
                <p>Loading dashboard...</p>
            </div>
        );
    }

    const roleLabel = normalizeRole(profile?.role) || "ADMIN";

    return (
        <div className="page-shell">
            <div className="bg-layer bg-user" />
            <div className="panel page-panel">
                <header className="top-nav">
                    <div>
                        <h1 className="brand">Dashboard</h1>
                        <p className="subtitle">{homeData?.welcomeMessage || "Overview panel."}</p>
                    </div>

                    <div className="nav-group">
                        <Link className="nav-link" to="/dashboard">Dashboard</Link>
                        <Link className="nav-link" to="/profile">Profile</Link>
                        <Link className="nav-link" to="/settings">Settings</Link>
                        <button className="btn btn-danger" type="button" onClick={handleLogout}>
                            Logout
                        </button>
                    </div>
                </header>

                {error && <p className="message error">{error}</p>}

                {!error && (
                    <>
                        <div className="stats">
                            <article className="stat-card">
                                <h3>Notifications</h3>
                                <p className="value">{homeData?.notifications ?? 0}</p>
                            </article>
                            <article className="stat-card">
                                <h3>Tasks</h3>
                                <p className="value">{homeData?.tasks ?? 0}</p>
                            </article>
                            <article className="stat-card">
                                <h3>Current Role</h3>
                                <p className="value">{roleLabel}</p>
                            </article>
                        </div>

                        <section className="section">
                            <h3>Admin Quick Actions</h3>
                            <div className="actions-row">
                                <Link className="btn btn-secondary" to="/profile">Manage Profile</Link>
                                <Link className="btn btn-secondary" to="/settings">User Settings</Link>
                            </div>
                        </section>
                    </>
                )}
            </div>
        </div>
    );
}
