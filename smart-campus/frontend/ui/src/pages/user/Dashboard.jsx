import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../../api";

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
                return;
            } catch (adminErr) {
                const adminStatus = adminErr.response?.status;

                if (adminStatus === 401) {
                    navigate("/login");
                    return;
                }

                try {
                    const [homeResponse, profileResponse] = await Promise.all([
                        api.get("/user/home"),
                        api.get("/user/me"),
                    ]);

                    setHomeData(homeResponse.data);
                    setProfile(profileResponse.data);
                } catch (fallbackErr) {
                    const status = fallbackErr.response?.status;

                    if (status === 401 || status === 403) {
                        navigate("/login");
                        return;
                    }

                    setError(fallbackErr.response?.data?.message || "Failed to load dashboard.");
                }
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

    const roleLabel = String(profile?.role || "").replace("ROLE_", "") || "USER";

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
                        <Link className="nav-link" to="/home">Home</Link>
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
