import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import api, { bookingApi, resourceApi } from "../../api";
import AppNavbar from "../../components/AppNavbar";
import { 
    HiSearch, 
    HiCheckCircle, 
    HiClock, 
    HiCheck, 
    HiX, 
    HiTrash, 
    HiClipboardList, 
    HiBell, 
    HiCalendar, 
    HiPlus, 
    HiAcademicCap,
    HiArrowRight,
    HiOutlineInformationCircle
} from "react-icons/hi";
import { normalizeRole } from "../../utils/roleHome";
import styles from "./Booking.module.css";

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
        return parsed.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
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
                api.get("/auth/me"), 
                bookingApi.getMy(), 
                resourceApi.getAll()
            ]);
            
            const user = p.data?.user || p.data;
            setProfileData(user);
            setMyBookings(Array.isArray(m.data) ? m.data : []);
            setResources(Array.isArray(r.data) ? r.data : []);

            if (normalizeRole(user?.role) === "ADMIN") {
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

    if (loading) return (
        <div className="loading-center">
            <div className={styles.texture} />
            <div className="spinner" />
        </div>
    );

    const stats = {
        pending: isAdmin ? pendingBookings.length : myBookings.filter(b => b.status === 'PENDING').length,
        approved: isAdmin ? allBookings.filter(b => b.status === 'APPROVED').length : myBookings.filter(b => b.status === 'APPROVED').length,
        total: isAdmin ? allBookings.length : myBookings.length
    };

    return (
        <div className={styles.page}>
            <div className={styles.texture} />
            <div className={styles.container}>
                <AppNavbar title="Booking" subtitle="Reservations Terminal" profile={profileData} />

                <main>
                    {error && <div className="message error glass-alert">{error}</div>}
                    {notice.text && <div className={`message ${notice.type} glass-alert`}>{notice.text}</div>}

                    <div className={styles.statsGrid}>
                        <div className={styles.statCard}>
                            <div className={`${styles.statIcon} ${styles.iconBlue}`}><HiBell /></div>
                            <div className={styles.statInfo}>
                                <h4>Action Required</h4>
                                <p>{stats.pending}</p>
                            </div>
                        </div>
                        <div className={styles.statCard}>
                            <div className={`${styles.statIcon} ${styles.iconGreen}`}><HiCheckCircle /></div>
                            <div className={styles.statInfo}>
                                <h4>Confirmed</h4>
                                <p>{stats.approved}</p>
                            </div>
                        </div>
                        <div className={styles.statCard}>
                            <div className={`${styles.statIcon} ${styles.iconPurple}`}><HiClipboardList /></div>
                            <div className={styles.statInfo}>
                                <h4>Total Logs</h4>
                                <p>{stats.total}</p>
                            </div>
                        </div>
                    </div>

                    <section className={styles.mainSection}>
                        <div className={styles.sectionHeader}>
                            <div>
                                <h3>{isAdmin ? "Institutional Terminal" : "My Reservation Log"}</h3>
                                <p>Track and manage campus resource allocations in real-time.</p>
                            </div>
                            <div className={styles.headerActions}>
                                {isAdmin && (
                                    <div className="tab-group" style={{ background: '#f1f5f9', padding: '0.35rem', borderRadius: '12px', display: 'flex', gap: '0.5rem' }}>
                                        <button className={`tab-btn ${viewMode === 'PE' ? 'active' : ''}`} onClick={() => setViewMode('PE')}>Active</button>
                                        <button className={`tab-btn ${viewMode === 'ALL' ? 'active' : ''}`} onClick={() => setViewMode('ALL')}>History</button>
                                    </div>
                                )}
                                <button className="btn btn-primary" onClick={() => setIsFormOpen(true)} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <HiPlus /> New Request
                                </button>
                            </div>
                        </div>

                        <div className={styles.bookingList}>
                            {(isAdmin ? (viewMode === 'PE' ? pendingBookings : allBookings) : myBookings).map(b => (
                                <article key={b.bookingId} className={styles.bookingCard}>
                                    <div className={styles.bookingInfo}>
                                        <div className={styles.bookingIcon}><HiCalendar size={22} /></div>
                                        <div className={styles.bookingTitle}>
                                            <h4>{b.title}</h4>
                                            <div className={styles.bookingMeta}>
                                                <div className={styles.metaItem}><HiAcademicCap /> {b.facilityName}</div>
                                                <div className={styles.metaItem}>•</div>
                                                <div className={styles.metaItem}><HiClock /> {safeFormatDate(b.bookingDate)} at {safeFormatTime(b.startTime)}</div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className={styles.bookingActions}>
                                        <span className={`${styles.statusBadge} status-badge booking-status ${(b.status || "").toLowerCase()}`}>
                                            {b.status}
                                        </span>
                                        {isAdmin && b.status === 'PENDING' && (
                                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                <button className="icon-btn-success" onClick={() => handleAdminAction(b.bookingId, 'approve')}><HiCheck /></button>
                                                <button className="icon-btn-danger" onClick={() => handleAdminAction(b.bookingId, 'reject')}><HiX /></button>
                                            </div>
                                        )}
                                        {(!isAdmin || b.status !== 'PENDING') && (
                                            <button className="btn-ghost" onClick={() => handleAdminAction(b.bookingId, 'cancel')} style={{ color: '#94a3b8' }}><HiTrash /></button>
                                        )}
                                    </div>
                                </article>
                            ))}
                            
                            {(isAdmin ? (viewMode === 'PE' ? pendingBookings : allBookings) : myBookings).length === 0 && (
                                <div style={{ textAlign: 'center', padding: '6rem 2rem', opacity: 0.3 }}>
                                    <HiClipboardList size={64} style={{ marginBottom: '1.5rem' }} />
                                    <h3>No reservations found</h3>
                                    <p>Your institutional access logs are currently empty.</p>
                                </div>
                            )}
                        </div>
                    </section>
                </main>
            </div>

            {/* FULL UI RESERVATION FORM */}
            {isFormOpen && (
                <div className={styles.formOverlay}>
                    <aside className={styles.formSidebar}>
                        <div className={styles.sidebarHeader}>
                            <h2>Campus<br/>Reservations</h2>
                            <p>Follow the streamlined process to secure campus equipment or facility space.</p>
                        </div>
                        <div className={styles.stepList}>
                            <div className={`${styles.step} ${!resourceAvailability ? styles.stepActive : ''}`}>
                                <div className={styles.stepNumber}>1</div>
                                <div className={styles.stepLabel}>Select & Verify</div>
                            </div>
                            <div className={`${styles.step} ${resourceAvailability && !selectedSlot ? styles.stepActive : ''}`}>
                                <div className={styles.stepNumber}>2</div>
                                <div className={styles.stepLabel}>Time Allocation</div>
                            </div>
                            <div className={`${styles.step} ${selectedSlot ? styles.stepActive : ''}`}>
                                <div className={styles.stepNumber}>3</div>
                                <div className={styles.stepLabel}>Finalize Submission</div>
                            </div>
                        </div>
                        <div style={{ marginTop: 'auto', display: 'flex', alignItems: 'center', gap: '0.75rem', color: '#94a3b8', fontSize: '0.85rem' }}>
                            <HiOutlineInformationCircle size={20} />
                            <span>Your request will be sent to the department admin for approval.</span>
                        </div>
                    </aside>

                    <main className={styles.formMain}>
                        <button className={styles.closeForm} onClick={() => setIsFormOpen(false)}>
                            <HiX size={24} />
                        </button>

                        <div className={styles.formContent}>
                            <header className={styles.formTitle}>
                                <h3>New Reservation</h3>
                                <p>Provide details to verify real-time availability.</p>
                            </header>

                            <div className={styles.formGrid}>
                                <div className={styles.fieldGroup}>
                                    <label className={styles.fieldLabel}>Resource Asset</label>
                                    <select 
                                        className={styles.select}
                                        value={selectedResourceId} 
                                        onChange={e => setSelectedResourceId(e.target.value)}
                                    >
                                        <option value="">Choose an institutional asset...</option>
                                        {resources.map(r => (
                                            <option key={r.id} value={r.id}>
                                                {r.name} — {r.location}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div className={styles.fieldGroup}>
                                    <label className={styles.fieldLabel}>Reservation Date</label>
                                    <input 
                                        type="date" 
                                        className={styles.input}
                                        value={bookingDate} 
                                        onChange={e => setBookingDate(e.target.value)} 
                                    />
                                </div>
                                
                                <button 
                                    className={styles.verifyBtn} 
                                    onClick={handleCheckAvailability} 
                                    disabled={checkingAvailability || !selectedResourceId}
                                >
                                    {checkingAvailability ? (
                                        <HiClock className="spin" />
                                    ) : (
                                        <HiSearch />
                                    )}
                                    {checkingAvailability ? "Synchronizing..." : "Check Availability"}
                                </button>
                            </div>

                            {resourceAvailability && (
                                <div className={styles.slotsSection}>
                                    <h4>Available Time Allocations</h4>
                                    <div className={styles.slotGrid}>
                                        {(resourceAvailability.slots || []).map((slot, i) => (
                                            <button 
                                                key={i} 
                                                className={`${styles.slotBtn} ${selectedSlot === slot ? styles.slotBtnActive : ''}`}
                                                onClick={() => setSelectedSlot(slot)}
                                            >
                                                {safeFormatTime(slot.startTime)}
                                            </button>
                                        ))}
                                    </div>

                                    {selectedSlot && (
                                        <div className={styles.fieldGroup} style={{ marginTop: '3rem', animation: 'fadeIn 0.3s ease-out' }}>
                                            <label className={styles.fieldLabel}>Purpose of Reservation</label>
                                            <input 
                                                className={styles.input}
                                                value={bookingTitle} 
                                                onChange={e => setBookingTitle(e.target.value)} 
                                                placeholder="e.g. Project Group Discussion, Research Lab Work..." 
                                            />
                                        </div>
                                    )}
                                </div>
                            )}

                            <div className={styles.submitSection}>
                                <button className={styles.cancelBtn} onClick={() => setIsFormOpen(false)}>Discard Request</button>
                                <button 
                                    className={styles.submitBtn} 
                                    onClick={handleCreateBooking} 
                                    disabled={submitting || !selectedSlot || !bookingTitle}
                                >
                                    {submitting ? "Processing..." : "Finalize Reservation"}
                                    <HiArrowRight style={{ marginLeft: '0.75rem' }} />
                                </button>
                            </div>
                        </div>
                    </main>
                </div>
            )}
        </div>
    );
}
