import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import api, { resourceApi } from "../../api";
import AppNavbar from "../../components/AppNavbar";
import { HiSearch, HiFilter, HiLocationMarker, HiUsers, HiClock, HiCheckCircle, HiXCircle, HiAcademicCap, HiCube } from "react-icons/hi";

function getErrorMessage(error, fallback) {
    const payload = error?.response?.data;
    if (typeof payload === "string" && payload.trim()) return payload;
    if (payload?.message) return payload.message;
    return fallback;
}

function buildAssetUrl(path) {
    if (!path) return "";
    if (path.startsWith("http://") || path.startsWith("https://")) return path;
    const base = api.defaults.baseURL || "http://localhost:8080";
    return `${base}${path}`;
}

function formatEnumLabel(value) {
    return String(value || "")
        .toLowerCase()
        .split("_")
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(" ");
}

const FACILITY_TYPES = ["LECTURE_HALL", "LAB", "MEETING_ROOM", "PROJECTOR", "CAMERA", "OTHER"];
const FACILITY_STATUSES = ["ACTIVE", "MAINTENANCE", "UNAVAILABLE", "OUT_OF_SERVICE"];

export default function Resources() {
    const navigate = useNavigate();
    const [resources, setResources] = useState([]);
    const [profileData, setProfileData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const [searchTerm, setSearchTerm] = useState("");
    const [selectedType, setSelectedType] = useState("");
    const [selectedStatus, setSelectedStatus] = useState("");

    const [selectedResource, setSelectedResource] = useState(null);
    const [showModal, setShowModal] = useState(false);

    useEffect(() => {
        const loadData = async () => {
            try {
                const [resResp, profResp] = await Promise.all([
                    resourceApi.getAll(),
                    api.get("/user/me"),
                ]);
                setResources(Array.isArray(resResp.data) ? resResp.data : []);
                setProfileData(profResp.data);
            } catch (err) {
                if (err.response?.status === 401) navigate("/login");
                else setError(getErrorMessage(err, "Catalog unavailable."));
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, [navigate]);

    const filteredResources = useMemo(() => {
        return resources.filter((res) => {
            const matchesSearch = res.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                res.location.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesType = !selectedType || res.type === selectedType;
            const matchesStatus = !selectedStatus || res.status === selectedStatus;
            return matchesSearch && matchesType && matchesStatus;
        });
    }, [resources, searchTerm, selectedType, selectedStatus]);

    if (loading) return <div className="loading-center"><div className="spinner" /></div>;

    const getStatusStyle = (status) => {
        switch(status) {
            case 'ACTIVE': return { color: '#10b981', label: 'Available' };
            case 'MAINTENANCE': return { color: '#f59e0b', label: 'Maintenance' };
            case 'UNAVAILABLE': return { color: '#ef4444', label: 'Unavailable' };
            default: return { color: '#64748b', label: formatEnumLabel(status) };
        }
    };

    return (
        <div className="page-shell">
            <div className="bg-layer bg-user" />
            <div className="panel page-panel">
                <AppNavbar 
                    title="Resource Directory" 
                    subtitle="Explore campus facilities and hardware assets."
                    profile={profileData} 
                />

                <main className="dashboard-content" style={{ padding: '0 1.5rem 2.5rem' }}>
                    {error && <div className="message error glass-alert">{error}</div>}

                    {/* Filter Bar */}
                    <section className="glass-panel" style={{ padding: '1.5rem', marginBottom: '2rem', display: 'flex', flexWrap: 'wrap', gap: '1.25rem', alignItems: 'flex-end', background: 'rgba(255,255,255,0.7)' }}>
                        <div style={{ flex: '1', minWidth: '240px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', color: 'var(--text-soft)', fontWeight: 600, fontSize: '0.85rem' }}>
                                <HiSearch /> Search Name or Location
                            </div>
                            <input 
                                className="search-input" 
                                value={searchTerm} 
                                onChange={e => setSearchTerm(e.target.value)}
                                placeholder="e.g. Science Block, Projector..."
                                style={{ background: '#fff', borderRadius: '12px' }}
                            />
                        </div>
                        <div style={{ width: '180px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', color: 'var(--text-soft)', fontWeight: 600, fontSize: '0.85rem' }}>
                                <HiFilter /> Type
                            </div>
                            <select value={selectedType} onChange={e => setSelectedType(e.target.value)} style={{ background: '#fff', borderRadius: '12px' }}>
                                <option value="">All Types</option>
                                {FACILITY_TYPES.map(t => <option key={t} value={t}>{formatEnumLabel(t)}</option>)}
                            </select>
                        </div>
                        <div style={{ width: '180px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', color: 'var(--text-soft)', fontWeight: 600, fontSize: '0.85rem' }}>
                                <HiCheckCircle /> Availability States
                            </div>
                            <select value={selectedStatus} onChange={e => setSelectedStatus(e.target.value)} style={{ background: '#fff', borderRadius: '12px' }}>
                                <option value="">All Status</option>
                                {FACILITY_STATUSES.map(s => <option key={s} value={s}>{formatEnumLabel(s)}</option>)}
                            </select>
                        </div>
                        <button className="btn btn-ghost" onClick={() => { setSearchTerm(""); setSelectedType(""); setSelectedStatus(""); }} style={{ height: '46px', borderRadius: '12px' }}>
                            Reset
                        </button>
                    </section>

                    {/* Results Header */}
                    <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <p style={{ margin: 0, fontWeight: 700, color: 'var(--text-soft)' }}>
                            Found <span style={{ color: 'var(--brand)' }}>{filteredResources.length}</span> matching assets
                        </p>
                    </div>

                    {/* Resource Grid */}
                    <div className="resource-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.5rem' }}>
                        {filteredResources.map(res => {
                            const statusInfo = getStatusStyle(res.status);
                            return (
                                <article 
                                    key={res.id} 
                                    className="resource-card glass-card clickable-card" 
                                    onClick={() => { setSelectedResource(res); setShowModal(true); }}
                                    style={{ overflow: 'hidden', cursor: 'pointer', transition: 'transform 0.2s ease', maxWidth: '400px' }}
                                >
                                    <div style={{ height: '180px', position: 'relative' }}>
                                        {res.imageUrl ? (
                                            <img src={buildAssetUrl(res.imageUrl)} alt={res.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                        ) : (
                                            <div style={{ width: '100%', height: '100%', background: '#cbd5e1', display: 'grid', placeItems: 'center' }}>
                                                <HiCube size={32} style={{ opacity: 0.2 }} />
                                            </div>
                                        )}
                                        <div style={{ position: 'absolute', top: '1rem', left: '1rem', background: 'rgba(255,255,255,0.9)', padding: '0.3rem 0.8rem', borderRadius: '999px', fontSize: '0.7rem', fontWeight: 800, color: 'var(--brand)', textTransform: 'uppercase', backdropFilter: 'blur(4px)' }}>
                                            {formatEnumLabel(res.type)}
                                        </div>
                                    </div>
                                    <div style={{ padding: '1.25rem' }}>
                                        <h4 style={{ margin: '0 0 0.5rem', fontSize: '1.1rem', fontWeight: 800 }}>{res.name}</h4>
                                        <p style={{ margin: '0 0 1rem', fontSize: '0.85rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                            <HiLocationMarker /> {res.location}
                                        </p>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '1rem', borderTop: '1px solid var(--line-soft)' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', fontWeight: 600, color: '#64748b' }}>
                                                <HiUsers /> {res.capacity} Seats
                                            </div>
                                            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: statusInfo.color }}>
                                                {statusInfo.label}
                                            </span>
                                        </div>
                                    </div>
                                </article>
                            );
                        })}
                    </div>

                    {filteredResources.length === 0 && (
                        <div className="glass-panel" style={{ padding: '5rem', textAlign: 'center', color: '#64748b' }}>
                            <HiSearch size={48} style={{ opacity: 0.2, marginBottom: '1rem' }} />
                            <h3>No matches found</h3>
                            <p>Try adjusting your search terms or filters.</p>
                        </div>
                    )}
                </main>
            </div>

            {/* Detail Modal */}
            {showModal && selectedResource && (
                <div className="modern-modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modern-modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '600px' }}>
                        <div className="modal-header">
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                <div style={{ background: 'var(--brand-soft)', color: 'var(--brand)', padding: '0.75rem', borderRadius: '12px' }}><HiAcademicCap size={24} /></div>
                                <div>
                                    <h3 style={{ margin: 0 }}>{selectedResource.name}</h3>
                                    <p className="muted" style={{ margin: 0 }}>Asset ID: #{selectedResource.id}</p>
                                </div>
                            </div>
                            <button className="close-modal-btn" onClick={() => setShowModal(false)}><HiXCircle size={24} /></button>
                        </div>
                        
                        <div style={{ padding: '0 2rem 2rem' }}>
                            <div style={{ height: '260px', borderRadius: '16px', overflow: 'hidden', marginBottom: '2rem', border: '1px solid var(--line-soft)' }}>
                                {selectedResource.imageUrl ? (
                                    <img src={buildAssetUrl(selectedResource.imageUrl)} alt={selectedResource.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                ) : (
                                    <div style={{ width: '100%', height: '100%', background: '#f1f5f9', display: 'grid', placeItems: 'center' }}>No Preview Available</div>
                                )}
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                                <div className="info-block">
                                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-soft)', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Type & Class</label>
                                    <p style={{ margin: 0, fontWeight: 700 }}>{formatEnumLabel(selectedResource.type)}</p>
                                </div>
                                <div className="info-block">
                                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-soft)', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Capacity</label>
                                    <p style={{ margin: 0, fontWeight: 700 }}>{selectedResource.capacity} Person Max</p>
                                </div>
                                <div className="info-block">
                                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-soft)', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Location</label>
                                    <p style={{ margin: 0, fontWeight: 700 }}>{selectedResource.location}</p>
                                </div>
                                <div className="info-block">
                                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-soft)', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Service Hours</label>
                                    <p style={{ margin: 0, fontWeight: 700 }}>{selectedResource.availableFrom?.slice(0, 5)} - {selectedResource.availableTo?.slice(0, 5)}</p>
                                </div>
                            </div>
                        </div>

                        <div className="modal-actions" style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', padding: '1.5rem 2rem' }}>
                            <button className="btn btn-ghost" onClick={() => setShowModal(false)}>Close View</button>
                            <button className="btn btn-primary" onClick={() => navigate("/booking")} disabled={selectedResource.status !== 'ACTIVE'}>
                                {selectedResource.status === 'ACTIVE' ? "Book Now" : "Currently Unavailable"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
