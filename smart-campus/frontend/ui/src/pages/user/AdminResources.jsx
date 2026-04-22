import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../../api";
import { roleHomePath } from "../../utils/roleHome";

const FACILITY_TYPES = [
    "LECTURE_HALL",
    "LAB",
    "MEETING_ROOM",
    "PROJECTOR",
    "CAMERA",
    "OTHER",
];

const FACILITY_STATUSES = ["ACTIVE", "OUT_OF_SERVICE"];

const initialForm = {
    name: "",
    type: "LECTURE_HALL",
    capacity: "1",
    location: "",
    availableFrom: "08:00",
    availableTo: "17:00",
    status: "ACTIVE",
};

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

export default function AdminResources() {
    const navigate = useNavigate();

    const [form, setForm] = useState(initialForm);
    const [imageFile, setImageFile] = useState(null);
    const [previewUrl, setPreviewUrl] = useState("");

    const [resources, setResources] = useState([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    useEffect(() => {
        const loadData = async () => {
            try {
                const [adminProfileResponse, resourcesResponse] = await Promise.all([
                    api.get("/user/Admin/me"),
                    api.get("/facilities"),
                ]);

                const normalizedRole = String(adminProfileResponse?.data?.role || "").replace("ROLE_", "").toUpperCase();
                if (normalizedRole !== "ADMIN") {
                    navigate(roleHomePath(adminProfileResponse?.data?.role), { replace: true });
                    return;
                }

                setResources(Array.isArray(resourcesResponse.data) ? resourcesResponse.data : []);
            } catch (loadError) {
                const status = loadError.response?.status;

                if (status === 401) {
                    navigate("/login", { replace: true });
                    return;
                }

                if (status === 403) {
                    try {
                        const profileResponse = await api.get("/user/me");
                        navigate(roleHomePath(profileResponse.data?.role), { replace: true });
                        return;
                    } catch {
                        navigate("/login", { replace: true });
                        return;
                    }
                }

                setError(getErrorMessage(loadError, "Failed to load resources."));
            } finally {
                setLoading(false);
            }
        };

        loadData();
    }, [navigate]);

    useEffect(() => {
        if (!imageFile) {
            setPreviewUrl("");
            return undefined;
        }

        const localPreview = URL.createObjectURL(imageFile);
        setPreviewUrl(localPreview);

        return () => URL.revokeObjectURL(localPreview);
    }, [imageFile]);

    const sortedResources = useMemo(
        () => [...resources].sort((left, right) => (right.id || 0) - (left.id || 0)),
        [resources]
    );

    const handleChange = (event) => {
        const { name, value } = event.target;
        setForm((current) => ({
            ...current,
            [name]: value,
        }));
    };

    const handleFileChange = (event) => {
        const file = event.target.files?.[0] || null;
        setImageFile(file);
    };

    const resetForm = () => {
        setForm(initialForm);
        setImageFile(null);
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        setError("");
        setSuccess("");

        if (!imageFile) {
            setError("Please upload a resource image.");
            return;
        }

        try {
            setSubmitting(true);

            const payload = {
                ...form,
                capacity: Number(form.capacity),
                availableFrom: `${form.availableFrom}:00`,
                availableTo: `${form.availableTo}:00`,
            };

            const formData = new FormData();
            formData.append(
                "resource",
                new Blob([JSON.stringify(payload)], { type: "application/json" })
            );
            formData.append("image", imageFile);

            const response = await api.post("/facilities", formData, {
                headers: {
                    "Content-Type": "multipart/form-data",
                },
            });

            setResources((current) => [response.data, ...current]);
            setSuccess("Resource created successfully.");
            resetForm();
        } catch (submitError) {
            setError(getErrorMessage(submitError, "Failed to create resource."));
        } finally {
            setSubmitting(false);
        }
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
                <p>Loading admin resources...</p>
            </div>
        );
    }

    return (
        <div className="page-shell">
            <div className="bg-layer bg-user" />
            <div className="panel page-panel">
                <header className="top-nav">
                    <div>
                        <h1 className="brand">Catalog Resources</h1>
                        <p className="subtitle">Admin can add resources with real image uploads.</p>
                    </div>

                    <div className="nav-group">
                        <Link className="nav-link" to="/dashboard">Dashboard</Link>
                        <Link className="nav-link" to="/admin/resources">Resources</Link>
                        <Link className="nav-link" to="/profile">Profile</Link>
                        <button className="btn btn-danger" type="button" onClick={handleLogout}>
                            Logout
                        </button>
                    </div>
                </header>

                {error && <p className="message error">{error}</p>}
                {success && <p className="message success">{success}</p>}

                <section className="section">
                    <h3>Add Resource</h3>
                    <form className="form-grid" onSubmit={handleSubmit}>
                        <div className="resource-grid">
                            <label className="field">
                                <span>Resource Name</span>
                                <input
                                    name="name"
                                    value={form.name}
                                    onChange={handleChange}
                                    placeholder="Main Lecture Hall"
                                    required
                                />
                            </label>

                            <label className="field">
                                <span>Type</span>
                                <select name="type" value={form.type} onChange={handleChange}>
                                    {FACILITY_TYPES.map((type) => (
                                        <option key={type} value={type}>
                                            {formatEnumLabel(type)}
                                        </option>
                                    ))}
                                </select>
                            </label>

                            <label className="field">
                                <span>Capacity</span>
                                <input
                                    name="capacity"
                                    type="number"
                                    min="1"
                                    value={form.capacity}
                                    onChange={handleChange}
                                    required
                                />
                            </label>

                            <label className="field">
                                <span>Location</span>
                                <input
                                    name="location"
                                    value={form.location}
                                    onChange={handleChange}
                                    placeholder="Block B - Floor 2"
                                    required
                                />
                            </label>

                            <label className="field">
                                <span>Available From</span>
                                <input
                                    name="availableFrom"
                                    type="time"
                                    value={form.availableFrom}
                                    onChange={handleChange}
                                    required
                                />
                            </label>

                            <label className="field">
                                <span>Available To</span>
                                <input
                                    name="availableTo"
                                    type="time"
                                    value={form.availableTo}
                                    onChange={handleChange}
                                    required
                                />
                            </label>

                            <label className="field">
                                <span>Status</span>
                                <select name="status" value={form.status} onChange={handleChange}>
                                    {FACILITY_STATUSES.map((status) => (
                                        <option key={status} value={status}>
                                            {formatEnumLabel(status)}
                                        </option>
                                    ))}
                                </select>
                            </label>

                            <label className="field">
                                <span>Resource Image</span>
                                <input
                                    className="file-input"
                                    type="file"
                                    accept="image/*"
                                    onChange={handleFileChange}
                                    required
                                />
                            </label>
                        </div>

                        {previewUrl && (
                            <div className="resource-preview">
                                <img src={previewUrl} alt="Resource preview" />
                            </div>
                        )}

                        <div className="actions-row">
                            <button className="btn btn-primary" type="submit" disabled={submitting}>
                                {submitting ? "Saving..." : "Create Resource"}
                            </button>
                            <button className="btn btn-ghost" type="button" onClick={resetForm} disabled={submitting}>
                                Clear
                            </button>
                        </div>
                    </form>
                </section>

                <section className="section">
                    <h3>Current Resources</h3>
                    <div className="resource-cards">
                        {sortedResources.length === 0 && <p className="muted">No resources yet.</p>}

                        {sortedResources.map((item) => (
                            <article className="resource-card" key={item.id}>
                                <div className="resource-image">
                                    {item.imageUrl ? (
                                        <img src={buildAssetUrl(item.imageUrl)} alt={item.name} />
                                    ) : (
                                        <div className="resource-image-fallback">No Image</div>
                                    )}
                                </div>
                                <div className="resource-body">
                                    <h4>{item.name}</h4>
                                    <p>{formatEnumLabel(item.type)} • {item.capacity} seats</p>
                                    <p>{item.location}</p>
                                    <span className="chip">{formatEnumLabel(item.status)}</span>
                                </div>
                            </article>
                        ))}
                    </div>
                </section>
            </div>
        </div>
    );
}
