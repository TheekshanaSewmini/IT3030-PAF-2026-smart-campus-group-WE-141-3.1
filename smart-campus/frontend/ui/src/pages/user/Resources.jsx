import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { resourceApi } from "../../api";
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

function buildAssetUrl(path) {
    if (!path) {
        return "";
    }

    if (path.startsWith("http://") || path.startsWith("https://")) {
        return path;
    }

    return `${api.defaults.baseURL}${path}`;
}

function formatEnumLabel(value) {
    return String(value || "")
        .toLowerCase()
        .split("_")
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(" ");
}

const FACILITY_TYPES = ["LECTURE_HALL", "LAB", "MEETING_ROOM", "PROJECTOR", "CAMERA", "OTHER"];
const FACILITY_STATUSES = ["ACTIVE", "OUT_OF_SERVICE"];

export default function Resources() {
    const navigate = useNavigate();
    const [resources, setResources] = useState([]);
    const [profileData, setProfileData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    // Search and filter state
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedType, setSelectedType] = useState("");
    const [selectedStatus, setSelectedStatus] = useState("");

    // Modal state
    const [selectedResource, setSelectedResource] = useState(null);
    const [showDetailModal, setShowDetailModal] = useState(false);

    useEffect(() => {
        const loadData = async () => {
            try {
                const [resourcesResponse, profileResponse] = await Promise.all([
                    resourceApi.getAll(),
                    api.get("/user/me"),
                ]);

                setResources(Array.isArray(resourcesResponse.data) ? resourcesResponse.data : []);
                setProfileData(profileResponse.data);
            } catch (loadError) {
                const status = loadError.response?.status;

                if (status === 401) {
                    navigate("/login", { replace: true });
                    return;
                }

                setError(getErrorMessage(loadError, "Failed to load resources."));
            } finally {
                setLoading(false);
            }
        };

        loadData();
    }, [navigate]);

    const filteredResources = resources.filter((resource) => {
        const matchesSearch = resource.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            resource.location.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesType = !selectedType || resource.type === selectedType;
        const matchesStatus = !selectedStatus || resource.status === selectedStatus;

        return matchesSearch && matchesType && matchesStatus;
    });

    const openResourceDetail = (resource) => {
        setSelectedResource(resource);
        setShowDetailModal(true);
    };

    const closeDetailModal = () => {
        setShowDetailModal(false);
        setSelectedResource(null);
    };

    const handleLogout = async () => {
        try {
            await api.post("/auth/logout");
        } finally {
            navigate("/login", { replace: true });
        }
    };

    if (loading) {
        return (
            <div className="loading-center">
                <div className="spinner" />
                <p>Loading resources...</p>
            </div>
        );
    }

    return (
        <div className="page-shell">
            <div className="bg-layer bg-user" />
            <div className="panel page-panel">
                <AppNavbar
                    title="Available Resources"
                    subtitle="Browse all campus facilities and resources"
                    profile={profileData}
                    onLogout={handleLogout}
                />

                {error && <p className="message error">{error}</p>}

                {!error && (
                    <>
                        {/* Search and Filter Section */}
                        <section className="section">
                            <h3>Search Resources</h3>
                            <div className="filter-row">
                                <div className="filter-group">
                                    <label>
                                        <span>Search by Name or Location</span>
                                        <input
                                            type="text"
                                            placeholder="Search resources..."
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                            className="search-input"
                                        />
                                    </label>
                                </div>

                                <div className="filter-group">
                                    <label>
                                        <span>Filter by Type</span>
                                        <select
                                            value={selectedType}
                                            onChange={(e) => setSelectedType(e.target.value)}
                                        >
                                            <option value="">All Types</option>
                                            {FACILITY_TYPES.map((type) => (
                                                <option key={type} value={type}>
                                                    {formatEnumLabel(type)}
                                                </option>
                                            ))}
                                        </select>
                                    </label>
                                </div>

                                <div className="filter-group">
                                    <label>
                                        <span>Filter by Status</span>
                                        <select
                                            value={selectedStatus}
                                            onChange={(e) => setSelectedStatus(e.target.value)}
                                        >
                                            <option value="">All Status</option>
                                            {FACILITY_STATUSES.map((status) => (
                                                <option key={status} value={status}>
                                                    {formatEnumLabel(status)}
                                                </option>
                                            ))}
                                        </select>
                                    </label>
                                </div>

                                <div className="filter-actions">
                                    <button
                                        className="btn btn-secondary"
                                        onClick={() => {
                                            setSearchTerm("");
                                            setSelectedType("");
                                            setSelectedStatus("");
                                        }}
                                    >
                                        Reset Filters
                                    </button>
                                </div>
                            </div>
                        </section>

                        {/* Results Count */}
                        <section className="section">
                            <div className="results-info">
                                <p>
                                    Showing <strong>{filteredResources.length}</strong> of{" "}
                                    <strong>{resources.length}</strong> resources
                                </p>
                            </div>

                            {filteredResources.length > 0 ? (
                                <div className="resource-cards">
                                    {filteredResources.map((resource) => (
                                        <article
                                            key={resource.id}
                                            className="resource-card"
                                            onClick={() => openResourceDetail(resource)}
                                            style={{ cursor: "pointer" }}
                                        >
                                            <div className="resource-image">
                                                {resource.imageUrl ? (
                                                    <img
                                                        src={buildAssetUrl(resource.imageUrl)}
                                                        alt={resource.name}
                                                    />
                                                ) : (
                                                    <div className="resource-image-fallback">
                                                        <span>No Image</span>
                                                    </div>
                                                )}
                                            </div>
                                            <div className="resource-body">
                                                <h4>{resource.name}</h4>
                                                <p className="resource-type">{formatEnumLabel(resource.type)}</p>
                                                <p className="resource-meta">
                                                    <span>Capacity: {resource.capacity}</span>
                                                </p>
                                                <p className="resource-location">{resource.location}</p>
                                                <p className={`resource-status ${resource.status?.toLowerCase()}`}>
                                                    {formatEnumLabel(resource.status)}
                                                </p>
                                            </div>
                                        </article>
                                    ))}
                                </div>
                            ) : (
                                <div className="empty-state">
                                    <p>No resources found matching your criteria.</p>
                                    <button
                                        className="btn btn-secondary"
                                        onClick={() => {
                                            setSearchTerm("");
                                            setSelectedType("");
                                            setSelectedStatus("");
                                        }}
                                    >
                                        Clear Filters
                                    </button>
                                </div>
                            )}
                        </section>
                    </>
                )}

                {/* Resource Details Modal */}
                {showDetailModal && selectedResource && (
                    <div className="modal-overlay" onClick={closeDetailModal}>
                        <div className="modal-content modal-detail" onClick={(e) => e.stopPropagation()}>
                            <div className="modal-header">
                                <h3>{selectedResource.name}</h3>
                                <button
                                    className="modal-close"
                                    type="button"
                                    onClick={closeDetailModal}
                                >
                                    ✕
                                </button>
                            </div>

                            <div className="detail-image">
                                {selectedResource.imageUrl ? (
                                    <img
                                        src={buildAssetUrl(selectedResource.imageUrl)}
                                        alt={selectedResource.name}
                                    />
                                ) : (
                                    <div className="resource-image-fallback">
                                        <span>No Image</span>
                                    </div>
                                )}
                            </div>

                            <div className="detail-body">
                                <div className="detail-row">
                                    <span className="label">Type:</span>
                                    <span className="value">{formatEnumLabel(selectedResource.type)}</span>
                                </div>
                                <div className="detail-row">
                                    <span className="label">Capacity:</span>
                                    <span className="value">{selectedResource.capacity} seats</span>
                                </div>
                                <div className="detail-row">
                                    <span className="label">Location:</span>
                                    <span className="value">{selectedResource.location}</span>
                                </div>
                                <div className="detail-row">
                                    <span className="label">Available From:</span>
                                    <span className="value">{selectedResource.availableFrom}</span>
                                </div>
                                <div className="detail-row">
                                    <span className="label">Available To:</span>
                                    <span className="value">{selectedResource.availableTo}</span>
                                </div>
                                <div className="detail-row">
                                    <span className="label">Status:</span>
                                    <span className={`status-badge ${selectedResource.status?.toLowerCase()}`}>
                                        {formatEnumLabel(selectedResource.status)}
                                    </span>
                                </div>
                            </div>

                            <div className="modal-actions">
                                <button
                                    type="button"
                                    className="btn btn-secondary"
                                    onClick={closeDetailModal}
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
