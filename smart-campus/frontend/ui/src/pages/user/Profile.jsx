import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api, { bookingApi } from "../../api";
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

function formatDate(dateText) {
    if (!dateText) {
        return "-";
    }

    const parsed = new Date(`${dateText}T00:00:00`);
    return Number.isNaN(parsed.getTime()) ? dateText : parsed.toLocaleDateString();
}

function formatTime(timeText) {
    if (!timeText) {
        return "-";
    }

    const [hours, minutes] = String(timeText).split(":");
    if (hours === undefined || minutes === undefined) {
        return timeText;
    }

    const parsed = new Date();
    parsed.setHours(Number(hours), Number(minutes), 0, 0);
    return parsed.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function statusClass(status) {
    return `status-badge booking-status ${(status || "").toLowerCase()}`;
}

export default function Profile() {
    const navigate = useNavigate();

    const [profile, setProfile] = useState(null);
    const [bookings, setBookings] = useState([]);
    const [error, setError] = useState("");

    useEffect(() => {
        const loadData = async () => {
            try {
                const [profileResponse, bookingsResponse] = await Promise.all([
                    api.get("/user/me"),
                    bookingApi.getMy(),
                ]);

                setProfile(profileResponse.data);
                setBookings(Array.isArray(bookingsResponse.data) ? bookingsResponse.data : []);
            } catch (loadError) {
                const status = loadError.response?.status;

                if (status === 401 || status === 403) {
                    navigate("/login", { replace: true });
                    return;
                }

                setError(loadError.response?.data?.message || "Failed to load profile.");
            }
        };

        loadData();
    }, [navigate]);

    const handleLogout = async () => {
        try {
            await api.post("/auth/logout", {}, { withCredentials: true });
        } catch (logoutError) {
            console.log("Logout error:", logoutError.message);
        } finally {
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
                    subtitle="Your account details and booking history."
                    profile={profile}
                    onLogout={handleLogout}
                />

                {error && <p className="message error">{error}</p>}

                {!error && (
                    <>
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

                        <section className="section">
                            <h3>My Booking Details</h3>
                            {bookings.length > 0 ? (
                                <div className="booking-list">
                                    {bookings.map((booking) => (
                                        <article key={booking.bookingId} className="booking-card">
                                            <div className="booking-card__head">
                                                <h4>{booking.title}</h4>
                                                <span className={statusClass(booking.status)}>{booking.status}</span>
                                            </div>
                                            <p className="muted">
                                                {booking.facilityName || "Resource"} - {booking.location}
                                            </p>
                                            <p className="muted">
                                                {formatDate(booking.bookingDate)} | {formatTime(booking.startTime)} -{" "}
                                                {formatTime(booking.endTime)}
                                            </p>
                                            {booking.description && <p>{booking.description}</p>}
                                        </article>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-muted">No booking details available yet.</p>
                            )}
                        </section>
                    </>
                )}
            </div>
        </div>
    );
}
