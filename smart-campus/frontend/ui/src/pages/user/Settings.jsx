import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../../api";

function buildAssetUrl(path) {
    if (!path) {
        return "";
    }

    if (path.startsWith("http://") || path.startsWith("https://")) {
        return path;
    }

    return `${api.defaults.baseURL}${path}`;
}

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

export default function Settings() {
    const navigate = useNavigate();
    const [initialLoading, setInitialLoading] = useState(true);
    const [working, setWorking] = useState(false);
    const [notice, setNotice] = useState({ type: "", text: "" });

    const [user, setUser] = useState({
        firstName: "",
        lastName: "",
        email: "",
        role: "",
        profileImageUrl: "",
        coverImageUrl: "",
    });

    const [nameForm, setNameForm] = useState({ firstName: "", lastName: "" });
    const [emailForm, setEmailForm] = useState({ newEmail: "", otp: "" });
    const [passwordForm, setPasswordForm] = useState({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
    });
    const [deletePassword, setDeletePassword] = useState("");
    const [profileFile, setProfileFile] = useState(null);
    const [coverFile, setCoverFile] = useState(null);

    const setErrorNotice = (error, fallback) => {
        setNotice({ type: "error", text: getErrorMessage(error, fallback) });
    };

    useEffect(() => {
        let cancelled = false;

        const timerId = window.setTimeout(() => {
            const run = async () => {
                try {
                    let response;

                    try {
                        response = await api.get("/user/me");
                    } catch (error) {
                        if (error.response?.status === 403) {
                            response = await api.get("/user/Admin/me");
                        } else {
                            throw error;
                        }
                    }

                    if (cancelled) {
                        return;
                    }

                    const data = response.data;
                    const firstName = data.name || data.firstname || "";
                    const lastName = data.lastName || "";

                    setUser({
                        firstName,
                        lastName,
                        email: data.email || "",
                        role: String(data.role || "").replace("ROLE_", ""),
                        profileImageUrl: data.profileImageUrl || "",
                        coverImageUrl: data.coverImageUrl || "",
                    });
                    setNameForm({ firstName, lastName });
                } catch (error) {
                    if (cancelled) {
                        return;
                    }

                    const status = error.response?.status;
                    if (status === 401 || status === 403) {
                        navigate("/login", { replace: true });
                        return;
                    }

                    setNotice({
                        type: "error",
                        text: getErrorMessage(error, "Failed to load settings."),
                    });
                } finally {
                    if (!cancelled) {
                        setInitialLoading(false);
                    }
                }
            };

            void run();
        }, 0);

        return () => {
            cancelled = true;
            window.clearTimeout(timerId);
        };
    }, [navigate]);

    const updateName = async () => {
        setNotice({ type: "", text: "" });

        if (!nameForm.firstName.trim() || !nameForm.lastName.trim()) {
            setNotice({ type: "error", text: "First name and last name are required." });
            return;
        }

        setWorking(true);
        try {
            const response = await api.put("/user/update-name", {
                name: nameForm.firstName.trim(),
                lastName: nameForm.lastName.trim(),
            });

            setUser((prev) => ({
                ...prev,
                firstName: nameForm.firstName.trim(),
                lastName: nameForm.lastName.trim(),
            }));
            setNotice({
                type: "success",
                text: typeof response.data === "string" ? response.data : "Name updated successfully.",
            });
        } catch (error) {
            setErrorNotice(error, "Failed to update name.");
        } finally {
            setWorking(false);
        }
    };

    const requestEmailChange = async () => {
        setNotice({ type: "", text: "" });

        if (!emailForm.newEmail.trim()) {
            setNotice({ type: "error", text: "New email is required." });
            return;
        }

        setWorking(true);
        try {
            const response = await api.put("/user/update-email", {
                newEmail: emailForm.newEmail.trim(),
            });
            setNotice({
                type: "success",
                text: typeof response.data === "string" ? response.data : "OTP sent to your new email.",
            });
        } catch (error) {
            setErrorNotice(error, "Failed to send OTP.");
        } finally {
            setWorking(false);
        }
    };

    const verifyEmailChange = async () => {
        setNotice({ type: "", text: "" });

        if (!emailForm.otp.trim()) {
            setNotice({ type: "error", text: "OTP is required." });
            return;
        }

        setWorking(true);
        try {
            const response = await api.post("/user/verify-new-email", null, {
                params: { otp: emailForm.otp.trim() },
            });

            setNotice({
                type: "success",
                text: typeof response.data === "string" ? response.data : "Email updated successfully.",
            });

            await api.post("/auth/logout");
            navigate("/login", { replace: true });
        } catch (error) {
            setErrorNotice(error, "Failed to verify OTP.");
        } finally {
            setWorking(false);
        }
    };

    const updatePassword = async () => {
        setNotice({ type: "", text: "" });

        if (!passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) {
            setNotice({ type: "error", text: "All password fields are required." });
            return;
        }

        if (passwordForm.newPassword !== passwordForm.confirmPassword) {
            setNotice({ type: "error", text: "New password and confirm password must match." });
            return;
        }

        setWorking(true);
        try {
            const response = await api.put("/user/update-password", passwordForm);
            setNotice({
                type: "success",
                text: typeof response.data === "string" ? response.data : "Password updated successfully.",
            });

            setPasswordForm({
                currentPassword: "",
                newPassword: "",
                confirmPassword: "",
            });
        } catch (error) {
            setErrorNotice(error, "Failed to update password.");
        } finally {
            setWorking(false);
        }
    };

    const deleteAccount = async () => {
        setNotice({ type: "", text: "" });

        if (!deletePassword) {
            setNotice({ type: "error", text: "Current password is required." });
            return;
        }

        setWorking(true);
        try {
            const response = await api.delete("/user/delete", {
                data: { currentPassword: deletePassword },
            });

            setNotice({
                type: "success",
                text: typeof response.data === "string" ? response.data : "Account deleted.",
            });

            await api.post("/auth/logout");
            navigate("/login", { replace: true });
        } catch (error) {
            setErrorNotice(error, "Failed to delete account.");
        } finally {
            setWorking(false);
        }
    };

    const uploadImage = async (type) => {
        setNotice({ type: "", text: "" });
        const file = type === "profile" ? profileFile : coverFile;

        if (!file) {
            setNotice({ type: "error", text: "Choose an image first." });
            return;
        }

        setWorking(true);
        try {
            const formData = new FormData();
            formData.append("file", file);

            const endpoint =
                type === "profile" ? "/user/upload-profile-image" : "/user/upload-cover-image";

            const response = await api.post(endpoint, formData);
            const imagePath = typeof response.data === "string" ? response.data : "";

            if (type === "profile") {
                setUser((prev) => ({ ...prev, profileImageUrl: imagePath }));
                setProfileFile(null);
            } else {
                setUser((prev) => ({ ...prev, coverImageUrl: imagePath }));
                setCoverFile(null);
            }

            setNotice({ type: "success", text: "Image uploaded successfully." });
        } catch (error) {
            setErrorNotice(error, "Image upload failed.");
        } finally {
            setWorking(false);
        }
    };

    const handleLogout = async () => {
        try {
            await api.post("/auth/logout");
        } finally {
            navigate("/login", { replace: true });
        }
    };

    if (initialLoading) {
        return (
            <div className="loading-center">
                <div className="spinner" />
                <p>Loading settings...</p>
            </div>
        );
    }

    return (
        <div className="page-shell">
            <div className="bg-layer bg-user" />
            <div className="panel page-panel">
                <header className="top-nav">
                    <div>
                        <h1 className="brand">Settings</h1>
                        <p className="subtitle">Manage profile, credentials, and account security.</p>
                    </div>
                    <div className="nav-group">
                        <Link className="nav-link" to="/home">
                            Home
                        </Link>
                        <Link className="nav-link" to="/dashboard">
                            Dashboard
                        </Link>
                        <Link className="nav-link" to="/profile">
                            Profile
                        </Link>
                        <button className="btn btn-danger" type="button" onClick={handleLogout}>
                            Logout
                        </button>
                    </div>
                </header>

                {notice.text && <p className={`message ${notice.type}`}>{notice.text}</p>}

                <section className="settings-grid">
                    <article className="section">
                        <h3>Basic Profile</h3>
                        <p className="muted">Role: {user.role || "USER"}</p>
                        <div className="form-grid">
                            <label className="field">
                                <span>First Name</span>
                                <input
                                    value={nameForm.firstName}
                                    onChange={(event) =>
                                        setNameForm((prev) => ({ ...prev, firstName: event.target.value }))
                                    }
                                />
                            </label>
                            <label className="field">
                                <span>Last Name</span>
                                <input
                                    value={nameForm.lastName}
                                    onChange={(event) =>
                                        setNameForm((prev) => ({ ...prev, lastName: event.target.value }))
                                    }
                                />
                            </label>
                            <button className="btn btn-primary" type="button" onClick={updateName} disabled={working}>
                                Save Name
                            </button>
                        </div>
                    </article>

                    <article className="section">
                        <h3>Email Update</h3>
                        <p className="muted">Current email: {user.email}</p>
                        <div className="form-grid">
                            <label className="field">
                                <span>New Email</span>
                                <input
                                    type="email"
                                    value={emailForm.newEmail}
                                    onChange={(event) =>
                                        setEmailForm((prev) => ({ ...prev, newEmail: event.target.value }))
                                    }
                                />
                            </label>
                            <button
                                className="btn btn-secondary"
                                type="button"
                                onClick={requestEmailChange}
                                disabled={working}
                            >
                                Send OTP
                            </button>
                            <label className="field">
                                <span>Email OTP</span>
                                <input
                                    value={emailForm.otp}
                                    onChange={(event) =>
                                        setEmailForm((prev) => ({ ...prev, otp: event.target.value }))
                                    }
                                />
                            </label>
                            <button
                                className="btn btn-primary"
                                type="button"
                                onClick={verifyEmailChange}
                                disabled={working}
                            >
                                Verify New Email
                            </button>
                        </div>
                    </article>

                    <article className="section">
                        <h3>Password</h3>
                        <div className="form-grid">
                            <label className="field">
                                <span>Current Password</span>
                                <input
                                    type="password"
                                    value={passwordForm.currentPassword}
                                    onChange={(event) =>
                                        setPasswordForm((prev) => ({
                                            ...prev,
                                            currentPassword: event.target.value,
                                        }))
                                    }
                                />
                            </label>
                            <label className="field">
                                <span>New Password</span>
                                <input
                                    type="password"
                                    value={passwordForm.newPassword}
                                    onChange={(event) =>
                                        setPasswordForm((prev) => ({
                                            ...prev,
                                            newPassword: event.target.value,
                                        }))
                                    }
                                />
                            </label>
                            <label className="field">
                                <span>Confirm Password</span>
                                <input
                                    type="password"
                                    value={passwordForm.confirmPassword}
                                    onChange={(event) =>
                                        setPasswordForm((prev) => ({
                                            ...prev,
                                            confirmPassword: event.target.value,
                                        }))
                                    }
                                />
                            </label>
                            <button
                                className="btn btn-primary"
                                type="button"
                                onClick={updatePassword}
                                disabled={working}
                            >
                                Update Password
                            </button>
                        </div>
                    </article>

                    <article className="section">
                        <h3>Profile Images</h3>
                        <div className="upload-grid">
                            <div className="upload-card">
                                <div className="image-preview">
                                    {user.profileImageUrl ? (
                                        <img src={buildAssetUrl(user.profileImageUrl)} alt="Profile preview" />
                                    ) : (
                                        <span>No profile image</span>
                                    )}
                                </div>
                                <input
                                    className="file-input"
                                    type="file"
                                    accept="image/*"
                                    onChange={(event) => setProfileFile(event.target.files?.[0] || null)}
                                />
                                <button
                                    className="btn btn-secondary"
                                    type="button"
                                    onClick={() => uploadImage("profile")}
                                    disabled={working}
                                >
                                    Upload Profile Image
                                </button>
                            </div>

                            <div className="upload-card">
                                <div className="image-preview cover">
                                    {user.coverImageUrl ? (
                                        <img src={buildAssetUrl(user.coverImageUrl)} alt="Cover preview" />
                                    ) : (
                                        <span>No cover image</span>
                                    )}
                                </div>
                                <input
                                    className="file-input"
                                    type="file"
                                    accept="image/*"
                                    onChange={(event) => setCoverFile(event.target.files?.[0] || null)}
                                />
                                <button
                                    className="btn btn-secondary"
                                    type="button"
                                    onClick={() => uploadImage("cover")}
                                    disabled={working}
                                >
                                    Upload Cover Image
                                </button>
                            </div>
                        </div>
                    </article>

                    <article className="section danger-zone">
                        <h3>Delete Account</h3>
                        <p className="muted">This action cannot be undone.</p>
                        <div className="form-grid">
                            <label className="field">
                                <span>Current Password</span>
                                <input
                                    type="password"
                                    value={deletePassword}
                                    onChange={(event) => setDeletePassword(event.target.value)}
                                />
                            </label>
                            <button className="btn btn-danger" type="button" onClick={deleteAccount} disabled={working}>
                                Delete Account
                            </button>
                        </div>
                    </article>
                </section>
            </div>
        </div>
    );
}
