import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../../api";

const getErrorMessage = (error, fallback) => {
    const payload = error?.response?.data;

    if (typeof payload === "string" && payload.trim()) {
        return payload;
    }

    if (payload?.message) {
        return payload.message;
    }

    return fallback;
};

export default function Login() {
    const navigate = useNavigate();
    const [form, setForm] = useState({ email: "", password: "" });
    const [errors, setErrors] = useState({});
    const [notice, setNotice] = useState({ type: "", text: "" });
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleChange = (event) => {
        const { name, value } = event.target;
        setForm((prev) => ({ ...prev, [name]: value }));

        if (errors[name]) {
            setErrors((prev) => ({ ...prev, [name]: "" }));
        }
    };

    const validate = () => {
        const validationErrors = {};

        if (!form.email.trim()) {
            validationErrors.email = "Email is required.";
        } else if (!/\S+@\S+\.\S+/.test(form.email)) {
            validationErrors.email = "Enter a valid email address.";
        }

        if (!form.password.trim()) {
            validationErrors.password = "Password is required.";
        }

        return validationErrors;
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        setNotice({ type: "", text: "" });

        const validationErrors = validate();
        if (Object.keys(validationErrors).length > 0) {
            setErrors(validationErrors);
            return;
        }

        setLoading(true);

        try {
            const response = await api.post("/auth/login", form);
            if (!response.data?.success) {
                setNotice({
                    type: "error",
                    text: response.data?.message || "Login failed. Check your credentials.",
                });
                return;
            }

            const role = String(response.data.role || "").toUpperCase();
            setNotice({ type: "success", text: "Login successful. Redirecting..." });

            if (role.includes("ADMIN")) {
                navigate("/dashboard", { replace: true });
                return;
            }

            navigate("/home", { replace: true });
        } catch (error) {
            setNotice({
                type: "error",
                text: getErrorMessage(error, "Unable to connect to server."),
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-page">
            <div className="login-page__canvas" />

            <div className="login-layout">
                <section className="login-showcase" aria-hidden="true">
                    <div className="login-showcase__photo">
                        <span className="login-showcase__atom" />
                    </div>
                </section>

                <section className="login-card-wrap">
                    <div className="login-card">
                        <div className="login-card__header">
                            <span className="login-card__eyebrow">Sign in</span>
                            <h2>Smart Campus Portal</h2>
                            <p>Use your account credentials to continue.</p>
                        </div>

                        {notice.text && <p className={`message ${notice.type}`}>{notice.text}</p>}

                        <form onSubmit={handleSubmit} noValidate>
                            <label className="form-group">
                                <span>Email Address</span>
                                <input
                                    type="email"
                                    name="email"
                                    value={form.email}
                                    onChange={handleChange}
                                    placeholder="IT23687882@my.sliit.lk"
                                />
                                {errors.email && <span className="error">{errors.email}</span>}
                            </label>

                            <label className="form-group">
                                <span>Password</span>
                                <div className="password-wrapper">
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        name="password"
                                        value={form.password}
                                        onChange={handleChange}
                                        placeholder="Enter your password"
                                    />
                                    <button
                                        type="button"
                                        className="show-btn"
                                        onClick={() => setShowPassword((prev) => !prev)}
                                    >
                                        {showPassword ? "Hide" : "Show"}
                                    </button>
                                </div>
                                {errors.password && <span className="error">{errors.password}</span>}
                            </label>

                            <button type="submit" disabled={loading} className="btn btn-primary login-btn">
                                {loading ? "Signing in..." : "Login"}
                            </button>
                        </form>

                        <div className="login-card__footer">
                            <p>
                                Forgot password?{" "}
                                <Link to="/forgot-password" className="inline-link">
                                    Reset it here
                                </Link>
                            </p>
                            <p>
                                New user?{" "}
                                <Link to="/signup" className="inline-link">
                                    Create an account
                                </Link>
                            </p>
                        </div>
                    </div>
                </section>
            </div>

            <footer className="login-page__footer">
                {new Date().getFullYear()} Smart Campus. All rights reserved.
            </footer>
        </div>
    );
}
