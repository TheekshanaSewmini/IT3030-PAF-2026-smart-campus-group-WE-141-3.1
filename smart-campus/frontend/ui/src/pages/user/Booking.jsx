import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import api, { bookingApi, resourceApi } from "../../api";
import AppNavbar from "../../components/AppNavbar";
import { HiSearch, HiCheckCircle, HiXCircle, HiClock, HiCheck, HiX, HiTrash, HiClipboardList, HiShieldExclamation, HiBell, HiCalendar, HiPlus, HiAcademicCap } from "react-icons/hi";
import { normalizeRole } from "../../utils/roleHome";

function getErrorMessage(error, fallback) {
    const payload = error?.response?.data;
    if (typeof payload === "string" && payload.trim()) return payload;
    if (payload?.message) return payload.message;
    return fallback;
}

function safeFormatDate(dateText) {
    try {
        if (!dateText) return "-";
        const parsed = new Date(`${dateText}T00:00:00`);
        return parsed.toLocaleDateString();
    } catch { return String(dateText); }
}

function safeFormatTime(timeText) {
    try {
        if (!timeText) return "-";
        const parts = Array.isArray(timeText) ? timeText : String(timeText).split(":");
        const h = parseInt(parts[0], 10);
        const m = parseInt(parts[1], 10);
        if (isNaN(h) || isNaN(m)) return String(timeText);
        const d = new Date();
        d.setHours(h, m, 0, 0);
        return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    } catch { return String(timeText); }
}

function statusClass(status) {
    return `status-badge booking-status ${(status || "").toLowerCase()}`;
}

export default function Booking() {
    const navigate = useNavigate();

    // Data State
    const [profileData, setProfileData] = useState(null);
    const [resources, setResources] = useState([]);
    const [myBookings, setMyBookings] = useState([]);
    const [pendingBookings, setPendingBookings] = useState([]);
    const [allBookings, setAllBookings] = useState([]);
    
    // UI State
    const [loading, setLoading] = useState(true);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [viewMode, setViewMode] = useState("PE");
    const [error, setError] = useState("");
    const [notice, setNotice] = useState({ type: "", text: "" });

    // New Booking Flow State
    const [selectedResourceId, setSelectedResourceId] = useState("");
    const [bookingDate, setBookingDate] = useState(new Date().toISOString().slice(0, 10));
    const [checkingAvailability, setCheckingAvailability] = useState(false);
    const [resourceAvailability, setResourceAvailability] = useState(null);
    const [selectedSlot, setSelectedSlot] = useState(null);
    const [bookingTitle, setBookingTitle] = useState("");
    const [submitting, setSubmitting] = useState(false);

    const roleLabel = useMemo(() => normalizeRole(profileData?.role) || "USER", [profileData]);
    const isAdmin = roleLabel === "ADMIN";

    const loadData = async () => {
        try {
            setLoading(true);
            const [p, m, r] = await Promise.all([
                api.get("/user/me"), 
                bookingApi.getMy(), 
                resourceApi.getAll()
            ]);
            
            setProfileData(p.data);
            setMyBookings(Array.isArray(m.data) ? m.data : []);
            setResources(Array.isArray(r.data) ? r.data : []);

            if (normalizeRole(p.data?.role) === "ADMIN") {
                const [pn, al] = await Promise.all([bookingApi.getPending(), bookingApi.getAll()]);
                setPendingBookings(Array.isArray(pn.data) ? pn.data : []);
                setAllBookings(Array.isArray(al.data) ? al.data : []);
            }
        } catch (err) {
            if (err.response?.status === 401) navigate("/login");
            else setError("Failed to connect to booking infrastructure.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { loadData(); }, []);

    // Availability Check Logic
    const handleCheckAvailability = async () => {
        if (!selectedResourceId || !bookingDate) {
            setNotice({ type: "error", text: "Please select both resource and date." });
            return;
        }
        try {
            setCheckingAvailability(true);
            const resp = await bookingApi.getResourceAvailability(selectedResourceId, { bookingDate });
            setResourceAvailability(resp.data);
            setSelectedSlot(null);
        } catch (err) {
            setNotice({ type: "error", text: "Availability check failed." });
        } finally {
            setCheckingAvailability(false);
        }
    };

    const handleCreateBooking = async () => {
        if (!selectedSlot || !bookingTitle) return;
        try {
            setSubmitting(true);
            await bookingApi.create({
                facilityAssetId: Number(selectedResourceId),
                title: bookingTitle,
                bookingDate,
                startTime: selectedSlot.startTime,
                endTime: selectedSlot.endTime,
            });
            setNotice({ type: "success", text: "Reservation queued successfully!" });
            setIsFormOpen(false);
            loadData();
        } catch (err) {
            setNotice({ type: "error", text: getErrorMessage(err, "Reservation failed.") });
        } finally {
            setSubmitting(false);
        }
    };

    const handleAdminAction = async (id, action) => {
        try {
            if (action === "approve") await bookingApi.approve(id);
            if (action === "reject") await bookingApi.reject(id);
            if (action === "cancel") await bookingApi.cancel(id);
            loadData();
        } catch (err) {
            setNotice({ type: "error", text: "Action unauthorized or failed." });
        }
    };

    if (loading) return <div className="loading-center"><div className="spinner" /></div>;

    const stats = {
        pending: isAdmin ? pendingBookings.length : myBookings.filter(b => b.status === 'PENDING').length,
        approved: isAdmin ? allBookings.filter(b => b.status === 'APPROVED').length : myBookings.filter(b => b.status === 'APPROVED').length,
        total: isAdmin ? allBookings.length : myBookings.length
    };

    return (
        <div className="page-shell">
            <div className="bg-layer bg-user" />
            <div className="panel page-panel">
                <AppNavbar title="Reservations" subtitle="Secure your campus resource allocations." profile={profileData} />

                <main className="dashboard-content" style={{ padding: '0 1.5rem 2.5rem' }}>
                    {error && <div className="message error glass-alert">{error}</div>}
                    {notice.text && <div className={`message ${notice.type} glass-alert`}>{notice.text}</div>}

                    {/* Quick Stats Grid */}
                    <div className="stats-dashboard" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
                        <div className="stat-card glass-card">
                            <div className="stat-icon stats-icon--blue"><HiBell /></div>
                            <div className="stat-info">
                                <h4 className="stat-label">Action Required</h4>
                                <p className="stat-value">{stats.pending}</p>
                            </div>
                        </div>
                        <div className="stat-card glass-card">
                            <div className="stat-icon stats-icon--green"><HiCheckCircle /></div>
                            <div className="stat-info">
                                <h4 className="stat-label">Confirmed</h4>
                                <p className="stat-value">{stats.approved}</p>
                            </div>
                        </div>
                        <div className="stat-card glass-card">
                            <div className="stat-icon stats-icon--purple"><HiClipboardList /></div>
                            <div className="stat-info">
                                <h4 className="stat-label">System Load</h4>
                                <p className="stat-value">Stable</p>
                            </div>
                        </div>
                    </div>

                    {/* Workspace Control Section */}
                    <section className="glass-panel" style={{ padding: '2rem', background: 'rgba(255,255,255,0.7)', borderRadius: '24px' }}>
                        <div className="section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                            <div>
                                <h3 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 800 }}>
                                    {isAdmin ? "Management Terminal" : "My Reservation Log"}
                                </h3>
                                <p className="muted" style={{ margin: '0.2rem 0 0' }}>Track and manage your institutional resource access.</p>
                            </div>
                            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                                {isAdmin && (
                                    <div className="tab-group" style={{ background: '#f1f5f9', padding: '0.35rem', borderRadius: '12px', display: 'flex', gap: '0.5rem' }}>
                                        <button className={`tab-btn ${viewMode === 'PE' ? 'active' : ''}`} onClick={() => setViewMode('PE')} style={{ border: 'none', padding: '0.5rem 1rem', borderRadius: '9px', fontWeight: 700, cursor: 'pointer', background: viewMode === 'PE' ? '#fff' : 'transparent', boxShadow: viewMode === 'PE' ? '0 4px 10px rgba(0,0,0,0.05)' : 'none' }}>Active</button>
                                        <button className={`tab-btn ${viewMode === 'ALL' ? 'active' : ''}`} onClick={() => setViewMode('ALL')} style={{ border: 'none', padding: '0.5rem 1rem', borderRadius: '9px', fontWeight: 700, cursor: 'pointer', background: viewMode === 'ALL' ? '#fff' : 'transparent', boxShadow: viewMode === 'ALL' ? '0 4px 10px rgba(0,0,0,0.05)' : 'none' }}>History</button>
                                    </div>
                                )}
                                <button className="btn btn-primary" onClick={() => setIsFormOpen(true)} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <HiPlus /> New Request
                                </button>
                            </div>
                        </div>

                        <div className="booking-list" style={{ display: 'grid', gap: '1rem' }}>
                            {(isAdmin ? (viewMode === 'PE' ? pendingBookings : allBookings) : myBookings).map(b => (
                                <article key={b.bookingId} className="booking-card glass-card" style={{ padding: '1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid var(--line-soft)' }}>
                                    <div style={{ display: 'flex', gap: '1.25rem', alignItems: 'center' }}>
                                        <div style={{ padding: '0.75rem', background: 'var(--brand-soft)', color: 'var(--brand)', borderRadius: '12px' }}><HiCalendar size={20} /></div>
                                        <div>
                                            <h4 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800 }}>{b.title}</h4>
                                            <p className="muted" style={{ margin: '0.2rem 0 0', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                <HiAcademicCap /> {b.facilityName} | <HiClock /> {safeFormatDate(b.bookingDate)} • {safeFormatTime(b.startTime)}
                                            </p>
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                                        <span className={statusClass(b.status)}>{b.status}</span>
                                        {isAdmin && b.status === 'PENDING' && (
                                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                <button className="icon-btn-success" onClick={() => handleAdminAction(b.bookingId, 'approve')} style={{ background: '#ecfdf5', color: '#059669', border: 'none', padding: '0.5rem', borderRadius: '8px', cursor: 'pointer' }}><HiCheck /></button>
                                                <button className="icon-btn-danger" onClick={() => handleAdminAction(b.bookingId, 'reject')} style={{ background: '#fff1f2', color: '#e11d48', border: 'none', padding: '0.5rem', borderRadius: '8px', cursor: 'pointer' }}><HiX /></button>
                                            </div>
                                        )}
                                        {(!isAdmin || b.status !== 'PENDING') && (
                                            <button className="btn-ghost" onClick={() => handleAdminAction(b.bookingId, 'cancel')} style={{ border: 'none', background: 'transparent', color: '#94a3b8', padding: '0.5rem', cursor: 'pointer' }}><HiTrash /></button>
                                        )}
                                    </div>
                                </article>
                            ))}
                            {(isAdmin ? (viewMode === 'PE' ? pendingBookings : allBookings) : myBookings).length === 0 && (
                                <div style={{ textAlign: 'center', padding: '4rem', opacity: 0.5 }}>
                                    <HiShuffle size={48} style={{ marginBottom: '1rem' }} />
                                    <p>No transactions identified in current filter.</p>
                                </div>
                            )}
                        </div>
                    </section>
                </main>
            </div>

            {/* Smart Booking Modal */}
            {isFormOpen && (
                <div className="modern-modal-overlay" onClick={() => setIsFormOpen(false)}>
                    <div className="modern-modal-content" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <div>
                                <h3 style={{ margin: 0 }}>New Reservation Request</h3>
                                <p className="muted" style={{ margin: 0 }}>Step 1: Check availability</p>
                            </div>
                            <button className="close-modal-btn" onClick={() => setIsFormOpen(false)}><HiX size={24} /></button>
                        </div>

                        <div className="modal-body" style={{ padding: '0 2rem 2rem' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
                                <div className="form-group">
                                    <span>Select Resource</span>
                                    <select value={selectedResourceId} onChange={e => setSelectedResourceId(e.target.value)}>
                                        <option value="">Choose Asset...</option>
                                        {resources.map(r => <option key={r.id} value={r.id}>{r.name} ({r.location})</option>)}
                                    </select>
                                </div>
                                <div className="form-group">
                                    <span>Reservation Date</span>
                                    <input type="date" value={bookingDate} onChange={e => setBookingDate(e.target.value)} />
                                </div>
                            </div>

                            <button className="btn btn-primary" onClick={handleCheckAvailability} disabled={checkingAvailability} style={{ width: '100%', marginBottom: '2rem' }}>
                                {checkingAvailability ? <><HiClock className="spin" /> Synchronizing...</> : <><HiSearch /> Verify Availability</>}
                            </button>

                            {resourceAvailability && (
                                <div className="availability-grid" style={{ marginTop: '1.5rem' }}>
                                     <h4 style={{ marginBottom: '1rem' }}>Available Time Slots</h4>
                                     <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '0.75rem' }}>
                                        {(resourceAvailability.slots || []).map((slot, i) => (
                                            <button 
                                                key={i} 
                                                className={`slot-btn ${selectedSlot === slot ? 'active' : ''}`}
                                                onClick={() => setSelectedSlot(slot)}
                                                style={{ border: '1px solid var(--line-soft)', padding: '0.6rem', borderRadius: '10px', background: selectedSlot === slot ? 'var(--brand)' : '#fff', color: selectedSlot === slot ? '#fff' : 'inherit', cursor: 'pointer', textAlign: 'center', fontWeight: 600 }}
                                            >
                                                {safeFormatTime(slot.startTime)}
                                            </button>
                                        ))}
                                     </div>
                                     {selectedSlot && (
                                         <div className="form-group" style={{ marginTop: '1.5rem' }}>
                                             <span>Reservation Purpose / Title</span>
                                             <input value={bookingTitle} onChange={e => setBookingTitle(e.target.value)} placeholder="e.g. Physics Tutorial Group A" />
                                         </div>
                                     )}
                                </div>
                            )}
                        </div>

                        <div className="modal-actions" style={{ display: 'flex', gap: '1rem', padding: '1.5rem 2rem', borderTop: '1px solid var(--line-soft)' }}>
                            <button className="btn btn-ghost" style={{ flex: 1 }} onClick={() => setIsFormOpen(false)}>Discard</button>
                            <button className="btn btn-primary" style={{ flex: 2 }} onClick={handleCreateBooking} disabled={submitting || !selectedSlot}>
                                {submitting ? "Finalizing..." : "Submit Reservation"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

function HiShuffle({ size, style }) {
    return <HiClipboardList size={size} style={{ ...style, opacity: 0.3 }} />;
}
