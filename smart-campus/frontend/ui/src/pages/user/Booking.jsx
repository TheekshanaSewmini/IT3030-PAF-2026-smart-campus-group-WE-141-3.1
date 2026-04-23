import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import api, { bookingApi, resourceApi } from "../../api";
import AppNavbar from "../../components/AppNavbar";
import { normalizeRole } from "../../utils/roleHome";

function getErrorMessage(error, fallback) {
    const payload = error?.response?.data;

    if (typeof payload === "string" && payload.trim()) {
        return payload;
    }

    if (payload?.message) {
        return payload.message;
    }

    // Try to get error message from nested structures
    if (payload?.error) {
        return payload.error;
    }

    // Log the full error for debugging
    console.error("API Error Details:", {
        status: error?.response?.status,
        data: payload,
        config: error?.config
    });

    return fallback;
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

    const parts = Array.isArray(timeText) ? timeText : String(timeText).split(":");
    const hours = parts[0];
    const minutes = parts[1];

    if (hours === undefined || minutes === undefined) {
        return timeText;
    }

    const parsed = new Date();
    parsed.setHours(Number(hours), Number(minutes), 0, 0);
    return parsed.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function toMinutes(timeValue) {
    if (!timeValue) return NaN;

    // Handle array format [HH, mm] or [HH, mm, ss] if Jackson sends it that way
    if (Array.isArray(timeValue)) {
        const [h, m] = timeValue;
        return (Number(h) || 0) * 60 + (Number(m) || 0);
    }

    const [hours, minutes] = String(timeValue).split(":");
    const hourNumber = Number(hours);
    const minuteNumber = Number(minutes);

    if (Number.isNaN(hourNumber) || Number.isNaN(minuteNumber)) {
        return NaN;
    }

    return hourNumber * 60 + minuteNumber;
}

function hasOverlap(slotAStart, slotAEnd, slotBStart, slotBEnd) {
    return slotAStart < slotBEnd && slotAEnd > slotBStart;
}

function statusClass(status) {
    return `status-badge booking-status ${(status || "").toLowerCase()}`;
}

const initialForm = {
    title: "",
    description: "",
    bookingDate: "",
    startTime: "",
    endTime: "",
};

export default function Booking() {
    const navigate = useNavigate();

    const [profileData, setProfileData] = useState(null);
    const [resources, setResources] = useState([]);
    const [selectedResourceId, setSelectedResourceId] = useState("");
    const [resourceAvailability, setResourceAvailability] = useState(null);

    const [myBookings, setMyBookings] = useState([]);
    const [pendingBookings, setPendingBookings] = useState([]);

    const [loadingPage, setLoadingPage] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [checkingAvailability, setCheckingAvailability] = useState(false);
    const [actionBookingId, setActionBookingId] = useState(null);

    const [form, setForm] = useState(initialForm);
    const [error, setError] = useState("");
    const [notice, setNotice] = useState({ type: "", text: "" });

    const roleLabel = normalizeRole(profileData?.role) || "USER";
    const isAdmin = roleLabel === "ADMIN";

    const stats = useMemo(() => {
        const today = new Date().toISOString().slice(0, 10);
        const pendingCount = myBookings.filter((item) => item.status === "PENDING").length;
        const approvedCount = myBookings.filter((item) => item.status === "APPROVED").length;
        const todayApproved = myBookings.filter(
            (item) => item.status === "APPROVED" && item.bookingDate === today
        ).length;

        return { pendingCount, approvedCount, todayApproved };
    }, [myBookings]);

    const activeResources = useMemo(
        () => resources.filter((resource) => resource.status === "ACTIVE"),
        [resources]
    );

    const handleLogout = async () => {
        try {
            await api.post("/auth/logout");
        } finally {
            navigate("/login", { replace: true });
        }
    };

    const loadResourceAvailability = async (facilityAssetId, bookingDate) => {
        if (!facilityAssetId || !bookingDate) {
            setResourceAvailability(null);
            return null;
        }

        const response = await bookingApi.getResourceAvailability(facilityAssetId, { bookingDate });
        setResourceAvailability(response.data);
        return response.data;
    };

    const loadPageData = async () => {
        setLoadingPage(true);
        setError("");

        try {
            const [profileResponse, myBookingsResponse, resourcesResponse] = await Promise.all([
                api.get("/user/me"),
                bookingApi.getMy(),
                resourceApi.getAll(),
            ]);

            const userProfile = profileResponse.data;
            const resourcesData = Array.isArray(resourcesResponse.data) ? resourcesResponse.data : [];
            const sortedResources = [...resourcesData].sort((a, b) => Number(a.id) - Number(b.id));

            setProfileData(userProfile);
            setMyBookings(Array.isArray(myBookingsResponse.data) ? myBookingsResponse.data : []);
            setResources(sortedResources);

            if (!selectedResourceId) {
                const firstActiveResource = sortedResources.find((resource) => resource.status === "ACTIVE");
                if (firstActiveResource) {
                    setSelectedResourceId(String(firstActiveResource.id));
                }
            }

            const normalizedRole = normalizeRole(userProfile?.role) || "USER";
            if (normalizedRole === "ADMIN") {
                const pendingResponse = await bookingApi.getPending();
                setPendingBookings(Array.isArray(pendingResponse.data) ? pendingResponse.data : []);
            } else {
                setPendingBookings([]);
            }
        } catch (loadError) {
            const status = loadError.response?.status;
            if (status === 401) {
                navigate("/login", { replace: true });
                return;
            }

            setError(getErrorMessage(loadError, "Failed to load booking page."));
        } finally {
            setLoadingPage(false);
        }
    };

    useEffect(() => {
        loadPageData();
    }, []);

    const handleChange = (event) => {
        const { name, value } = event.target;
        setForm((current) => ({ ...current, [name]: value }));
    };

    const handleCheckAvailability = async () => {
        setNotice({ type: "", text: "" });

        if (!selectedResourceId) {
            setNotice({ type: "error", text: "Please select a resource ID." });
            return;
        }

        if (!form.bookingDate || !form.startTime || !form.endTime) {
            setNotice({ type: "error", text: "Please fill date, start time, and end time." });
            return;
        }

        const requestStart = toMinutes(form.startTime);
        const requestEnd = toMinutes(form.endTime);

        if (!Number.isFinite(requestStart) || !Number.isFinite(requestEnd) || requestEnd <= requestStart) {
            setNotice({ type: "error", text: "End time must be greater than start time." });
            return;
        }

        setCheckingAvailability(true);
        try {
            const availability = await loadResourceAvailability(Number(selectedResourceId), form.bookingDate);
            if (!availability) {
                setNotice({ type: "error", text: "Could not read resource availability." });
                return;
            }

            const windowStart = toMinutes(availability.availableFrom);
            const windowEnd = toMinutes(availability.availableTo);

            if (requestStart < windowStart || requestEnd > windowEnd) {
                setNotice({
                    type: "error",
                    text: `Selected resource is available only from ${formatTime(availability.availableFrom)} to ${formatTime(availability.availableTo)}.`,
                });
                return;
            }

            const conflict = (availability.bookedSlots || []).find((slot) => {
                const slotStart = toMinutes(slot.startTime);
                const slotEnd = toMinutes(slot.endTime);
                return hasOverlap(requestStart, requestEnd, slotStart, slotEnd);
            });

            if (conflict) {
                setNotice({
                    type: "error",
                    text: `Selected time overlaps an existing booking (${formatTime(conflict.startTime)} - ${formatTime(conflict.endTime)}).`,
                });
                return;
            }

            setNotice({
                type: "success",
                text: `Resource ID ${selectedResourceId} is available for selected time slot.`,
            });
        } catch (availabilityError) {
            if (availabilityError?.response?.status === 401) {
                navigate("/login", { replace: true });
                return;
            }

            setResourceAvailability(null);
            setNotice({
                type: "error",
                text: getErrorMessage(availabilityError, "Failed to check availability."),
            });
        } finally {
            setCheckingAvailability(false);
        }
    };

    const handleCreateBooking = async (event) => {
        event.preventDefault();
        setNotice({ type: "", text: "" });

        if (!selectedResourceId) {
            setNotice({ type: "error", text: "Please select a resource ID." });
            return;
        }

        if (!form.title.trim()) {
            setNotice({ type: "error", text: "Booking title is required." });
            return;
        }

        if (!form.bookingDate || !form.startTime || !form.endTime) {
            setNotice({ type: "error", text: "Please fill date and time fields." });
            return;
        }

        setSubmitting(true);
        try {
            const bookingPayload = {
                title: form.title.trim(),
                description: form.description.trim() || null,
                facilityAssetId: Number(selectedResourceId),
                bookingDate: form.bookingDate,
                startTime: form.startTime,
                endTime: form.endTime,
            };

            console.log("Submitting booking with payload:", bookingPayload);

            await bookingApi.create(bookingPayload);

            setNotice({
                type: "success",
                text: `Booking request submitted for Resource ID ${selectedResourceId}. Status: PENDING.`,
            });
            setForm((current) => ({ ...current, title: "", description: "" }));
            await loadPageData();
            await loadResourceAvailability(Number(selectedResourceId), form.bookingDate);
        } catch (submitError) {
            if (submitError?.response?.status === 401) {
                navigate("/login", { replace: true });
                return;
            }

            const errorMsg = getErrorMessage(submitError, "Failed to submit booking request.");
            console.error("Booking creation error:", submitError);
            setNotice({
                type: "error",
                text: errorMsg,
            });
        } finally {
            setSubmitting(false);
        }
    };

    const handleAdminAction = async (bookingId, action) => {
        setNotice({ type: "", text: "" });
        setActionBookingId(bookingId);

        try {
            if (action === "approve") {
                await bookingApi.approve(bookingId);
                setNotice({ type: "success", text: "Booking request approved." });
            } else {
                await bookingApi.reject(bookingId);
                setNotice({ type: "success", text: "Booking request rejected." });
            }

            await loadPageData();
        } catch (actionError) {
            if (actionError?.response?.status === 401) {
                navigate("/login", { replace: true });
                return;
            }

            setNotice({
                type: "error",
                text: getErrorMessage(actionError, "Failed to update booking request."),
            });
        } finally {
            setActionBookingId(null);
        }
    };

    if (loadingPage) {
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
                    subtitle="Select resource ID and submit booking requests."
                    profile={profileData}
                    onLogout={handleLogout}
                />

                {error && <p className="message error">{error}</p>}
                {notice.text && <p className={`message ${notice.type}`}>{notice.text}</p>}

                {!error && (
                    <>
                        <div className="stats">
                            <article className="stat-card">
                                <h3>My Pending</h3>
                                <p className="value">{stats.pendingCount}</p>
                            </article>
                            <article className="stat-card">
                                <h3>My Approved</h3>
                                <p className="value">{stats.approvedCount}</p>
                            </article>
                            <article className="stat-card">
                                <h3>Today Approved</h3>
                                <p className="value">{stats.todayApproved}</p>
                            </article>
                            {isAdmin && (
                                <article className="stat-card">
                                    <h3>Need Approval</h3>
                                    <p className="value">{pendingBookings.length}</p>
                                </article>
                            )}
                        </div>

                        <section className="section">
                            <h3>Create Booking Request</h3>
                            <p className="muted">
                                Select a resource ID, check availability, then book it.
                            </p>

                            <form className="booking-form" onSubmit={handleCreateBooking}>
                                <div className="booking-grid">
                                    <label className="field">
                                        <span>Booking Resource ID</span>
                                        <select
                                            value={selectedResourceId}
                                            onChange={(event) => {
                                                setSelectedResourceId(event.target.value);
                                                setResourceAvailability(null);
                                            }}
                                            required
                                        >
                                            {activeResources.length === 0 && (
                                                <option value="">No active resources</option>
                                            )}
                                            {activeResources.map((resource) => (
                                                <option key={resource.id} value={resource.id}>
                                                    ID {resource.id} - {resource.name} ({resource.location})
                                                </option>
                                            ))}
                                        </select>
                                    </label>

                                    <label className="field">
                                        <span>Title</span>
                                        <input
                                            name="title"
                                            value={form.title}
                                            onChange={handleChange}
                                            placeholder="Lecture / Meeting title"
                                            required
                                        />
                                    </label>

                                    <label className="field">
                                        <span>Description</span>
                                        <input
                                            name="description"
                                            value={form.description}
                                            onChange={handleChange}
                                            placeholder="Optional details"
                                        />
                                    </label>

                                    <label className="field">
                                        <span>Date</span>
                                        <input
                                            type="date"
                                            name="bookingDate"
                                            value={form.bookingDate}
                                            onChange={handleChange}
                                            required
                                        />
                                    </label>

                                    <label className="field">
                                        <span>Start Time</span>
                                        <input
                                            type="time"
                                            name="startTime"
                                            value={form.startTime}
                                            onChange={handleChange}
                                            required
                                        />
                                    </label>

                                    <label className="field">
                                        <span>End Time</span>
                                        <input
                                            type="time"
                                            name="endTime"
                                            value={form.endTime}
                                            onChange={handleChange}
                                            required
                                        />
                                    </label>
                                </div>

                                <div className="actions-row booking-actions">
                                    <button
                                        type="button"
                                        className="btn btn-secondary"
                                        onClick={handleCheckAvailability}
                                        disabled={checkingAvailability || !selectedResourceId}
                                    >
                                        {checkingAvailability ? "Checking..." : "Check Availability"}
                                    </button>
                                    <button
                                        type="submit"
                                        className="btn btn-primary"
                                        disabled={submitting || !selectedResourceId}
                                    >
                                        {submitting ? "Submitting..." : "Submit Booking Request"}
                                    </button>
                                </div>
                            </form>
                        </section>

                        {resourceAvailability && (
                            <section className="section">
                                <h3>
                                    Resource ID {resourceAvailability.facilityAssetId} Schedule on{" "}
                                    {formatDate(resourceAvailability.bookingDate)}
                                </h3>
                                {resourceAvailability.bookedSlots?.length > 0 ? (
                                    <div className="booking-list">
                                        {resourceAvailability.bookedSlots.map((slot) => (
                                            <article key={slot.bookingId} className="booking-card">
                                                <div className="booking-card__head">
                                                    <h4>
                                                        {formatTime(slot.startTime)} - {formatTime(slot.endTime)}
                                                    </h4>
                                                    <span className={statusClass(slot.status)}>{slot.status}</span>
                                                </div>
                                            </article>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-muted">No bookings for this resource on selected date.</p>
                                )}
                            </section>
                        )}

                        <section className="section">
                            <h3>My Booking Requests</h3>
                            {myBookings.length > 0 ? (
                                <div className="booking-list">
                                    {myBookings.map((booking) => (
                                        <article key={booking.bookingId} className="booking-card">
                                            <div className="booking-card__head">
                                                <h4>{booking.title}</h4>
                                                <span className={statusClass(booking.status)}>{booking.status}</span>
                                            </div>
                                            <p className="muted">
                                                Resource ID {booking.facilityAssetId || "-"} -{" "}
                                                {booking.facilityName || "Resource"} ({booking.location})
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
                                <p className="text-muted">No booking requests yet.</p>
                            )}
                        </section>

                        {isAdmin && (
                            <section className="section">
                                <h3>Admin Approval Queue</h3>
                                {pendingBookings.length > 0 ? (
                                    <div className="booking-list">
                                        {pendingBookings.map((booking) => (
                                            <article key={booking.bookingId} className="booking-card">
                                                <div className="booking-card__head">
                                                    <h4>{booking.title}</h4>
                                                    <span className={statusClass(booking.status)}>{booking.status}</span>
                                                </div>
                                                <p className="muted">
                                                    Requested by {booking.bookedByEmail} | Resource ID{" "}
                                                    {booking.facilityAssetId || "-"} - {booking.facilityName || "Resource"}
                                                </p>
                                                <p className="muted">
                                                    {formatDate(booking.bookingDate)} | {formatTime(booking.startTime)} -{" "}
                                                    {formatTime(booking.endTime)}
                                                </p>
                                                {booking.description && <p>{booking.description}</p>}

                                                <div className="actions-row">
                                                    <button
                                                        className="btn btn-primary"
                                                        type="button"
                                                        onClick={() => handleAdminAction(booking.bookingId, "approve")}
                                                        disabled={actionBookingId === booking.bookingId}
                                                    >
                                                        Approve
                                                    </button>
                                                    <button
                                                        className="btn btn-danger"
                                                        type="button"
                                                        onClick={() => handleAdminAction(booking.bookingId, "reject")}
                                                        disabled={actionBookingId === booking.bookingId}
                                                    >
                                                        Reject
                                                    </button>
                                                </div>
                                            </article>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-muted">No pending booking requests.</p>
                                )}
                            </section>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}
