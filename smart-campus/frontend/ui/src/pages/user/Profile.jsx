import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api";
import { normalizeRole } from "../../utils/roleHome";
import AppNavbar from "../../components/AppNavbar";

function buildAssetUrl(path) {
    if (!path) {
        return "";
    }

    if (path.startsWith("http://") || path.startsWith("https://")) {
        return path;
    }

    return `${api.defaults.baseURL}${path}`;
}

export default function Profile() {
    const navigate = useNavigate();

    const [profile, setProfile] = useState(null);
    const [error, setError] = useState("");

    useEffect(() => {
        const loadProfile = async () => {
            try {
                const profileResponse = await api.get("/user/me");
                setProfile(profileResponse.data);
            } catch (error) {
                const status = error.response?.status;

                if (status === 401 || status === 403) {
                    navigate("/login", { replace: true });
                    return;
                }

                setError(error.response?.data?.message || "Failed to load profile.");
            }
        };

        loadProfile();
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

    if (!profile && !error) {
        return (
            <div className="loading-center">
                <div className="spinner" />
                <p>Loading profile...</p>
            </div>
        );
    }

    const profileImage = buildAssetUrl(profile?.profileImageUrl);
    const coverImage = buildAssetUrl(profile?.coverImageUrl);
    const roleLabel = normalizeRole(profile?.role) || "USER";
    const initials = (profile?.name?.[0] || "U").toUpperCase();
    const fullName = `${profile?.name || ""} ${profile?.lastName || ""}`.trim();

    return (
        <div className="page-shell">
            <div className="bg-layer bg-user" />
            <div className="panel page-panel">
                <AppNavbar
                    title="Profile"
                    subtitle="Your account details from backend profile APIs."
                    profile={profile}
                    onLogout={handleLogout}
                />

                {error && <p className="message error">{error}</p>}

                {!error && (
                    <section className="profile-card">
                        <div className="cover-image">
                            {coverImage ? <img src={coverImage} alt="Cover" /> : <div className="cover-fallback" />}
                        </div>

                        <div className="profile-main">
                            <div className="avatar-wrap">
                                <div className="avatar">
                                    {profileImage ? <img src={profileImage} alt="Profile" /> : <span>{initials}</span>}
                                </div>
                            </div>

                            <div className="profile-details">
                                <h2>{fullName || "User"}</h2>
                                <p>{profile?.email}</p>
                                <span className="chip">{roleLabel}</span>
                            </div>
                        </div>

                        <div className="profile-list">
                            <div className="list-row">
                                <span>Phone</span>
                                <strong>{profile?.phoneNumber || "-"}</strong>
                            </div>
                            <div className="list-row">
                                <span>Recovery Email</span>
                                <strong>{profile?.tempEmail || "-"}</strong>
                            </div>
                            <div className="list-row">
                                <span>Year</span>
                                <strong>{profile?.year || "-"}</strong>
                            </div>
                            <div className="list-row">
                                <span>Semester</span>
                                <strong>{profile?.semester || "-"}</strong>
                            </div>
                        </div>
                    </section>
                )}
            </div>
        </div>
    );
}
