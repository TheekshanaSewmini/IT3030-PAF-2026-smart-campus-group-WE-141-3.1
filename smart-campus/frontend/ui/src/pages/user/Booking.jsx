import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api";
import AppNavbar from "../../components/AppNavbar";

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

export default function Booking() {
    const navigate = useNavigate();
    const [profileData, setProfileData] = useState(null);
    const [error, setError] = useState("");

    useEffect(() => {
        const loadProfile = async () => {
            try {
                const response = await api.get("/user/me");
                setProfileData(response.data);
            } catch (loadError) {
                const status = loadError.response?.status;
                if (status === 401 || status === 403) {
                    navigate("/login", { replace: true });
                    return;
                }
                setError(getErrorMessage(loadError, "Failed to load booking page."));
            }
        };

        loadProfile();
    }, [navigate]);

    const handleLogout = async () => {
        try {
            await api.post("/auth/logout");
        } finally {
            navigate("/login", { replace: true });
        }
    };

    if (!profileData && !error) {
        return (
            <div className="loading-center">
                <div className="spinner" />
                <p>Loading booking page...</p>
            </div>
        );
    }

    return (
        <div className="page-shell">
            <div className="bg-layer bg-user" />
            <div className="panel page-panel">
                <AppNavbar
                    title="Booking"
                    subtitle="Reserve campus facilities for classes, meetings, and events."
                    profile={profileData}
                    onLogout={handleLogout}
                />

                {error && <p className="message error">{error}</p>}

                {!error && (
                    <>
                        <section className="section">
                            <h3>Booking Module</h3>
                            <p>
                                Booking tools are now linked in the main navigation. You can extend this page to connect
                                availability search, calendar views, and booking requests.
                            </p>
                        </section>

                        <div className="stats">
                            <article className="stat-card">
                                <h3>Pending Requests</h3>
                                <p className="value">0</p>
                            </article>
                            <article className="stat-card">
                                <h3>Confirmed Bookings</h3>
                                <p className="value">0</p>
                            </article>
                            <article className="stat-card">
                                <h3>Today</h3>
                                <p className="value">No schedules</p>
                            </article>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
