import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api, { setStoredAccessToken } from "../../api";
import { roleHomePath } from "../../utils/roleHome";
import { HiMail, HiLockClosed, HiEye, HiEyeOff, HiArrowRight, HiShieldCheck, HiSparkles } from "react-icons/hi";

const getErrorMessage = (error, fallback) => {
    const payload = error?.response?.data;
    if (typeof payload === "string" && payload.trim()) return payload;
    if (payload?.message) return payload.message;
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

            const role = response.data.role;
            const accessToken = response.data.accessToken;

            if (accessToken) {
                setStoredAccessToken(accessToken);
            }

            setNotice({ type: "success", text: "Login successful. Redirecting..." });
            navigate(roleHomePath(role), { replace: true });
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
                <section className="login-showcase" style={{ zIndex: 1 }}>
                    <div className="showcase-content" style={{ position: 'relative', zIndex: 2 }}>
                        <div className="showcase-brand" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '2rem' }}>
                            <div style={{ background: 'rgba(255,255,255,0.2)', padding: '0.6rem', borderRadius: '12px', backdropFilter: 'blur(10px)' }}>
                                <HiShieldCheck size={28} />
                            </div>
                            <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 800, letterSpacing: '-0.02em' }}>SmartCampus</h1>
                        </div>
                        
                        <div className="showcase-text">
                            <h2 style={{ fontSize: '2.5rem', fontWeight: 800, lineHeight: 1.1, marginBottom: '1.5rem' }}>
                                Elevating <span style={{ color: '#60a5fa' }}>University</span> Life through Intelligence.
                            </h2>
                            <p style={{ fontSize: '1.1rem', opacity: 0.9, lineHeight: 1.6, maxWidth: '400px' }}>
                                Access your resources, manage bookings, and stay connected with the most advanced campus management ecosystem.
                            </p>
                        </div>
                    </div>

                    <div className="showcase-stats" style={{ display: 'flex', gap: '2rem', position: 'relative', zIndex: 2 }}>
                        <div>
                            <div style={{ fontSize: '1.75rem', fontWeight: 800 }}>15k+</div>
                            <div style={{ fontSize: '0.85rem', opacity: 0.7 }}>Active Students</div>
                        </div>
                        <div>
                            <div style={{ fontSize: '1.75rem', fontWeight: 800 }}>98%</div>
                            <div style={{ fontSize: '0.85rem', opacity: 0.7 }}>Resource Uptime</div>
                        </div>
                    </div>
                </section>

                <section className="login-card-wrap" style={{ padding: '2rem' }}>
                    <div className="login-card">
                        <div className="login-card__header" style={{ marginBottom: '2.5rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <div>
                                    <span className="login-card__eyebrow">Welcome Back</span>
                                    <h2 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '0.5rem' }}>Sign In</h2>
                                    <p>Enter your details to access your portal</p>
                                </div>
                                <div style={{ color: 'var(--brand)', background: 'var(--brand-soft)', padding: '0.5rem', borderRadius: '12px' }}>
                                    <HiSparkles size={24} />
                                </div>
                            </div>
                        </div>

                        {notice.text && (
                            <div className={`message ${notice.type}`} style={{ marginBottom: '1.5rem', borderRadius: '12px', padding: '1rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                {notice.type === 'error' ? <HiShieldCheck style={{ transform: 'rotate(180deg)' }} /> : <HiShieldCheck />}
                                {notice.text}
                            </div>
                        )}

                        <form onSubmit={handleSubmit} noValidate style={{ display: 'grid', gap: '1.25rem' }}>
                            <div className="form-group">
                                <span style={{ fontSize: '0.9rem', fontWeight: 600, color: '#334155', marginBottom: '0.5rem' }}>Email Address</span>
                                <div style={{ position: 'relative' }}>
                                    <HiMail style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} size={20} />
                                    <input
                                        type="email"
                                        name="email"
                                        value={form.email}
                                        onChange={handleChange}
                                        placeholder="name@university.edu"
                                        style={{ paddingLeft: '3rem' }}
                                    />
                                </div>
                                {errors.email && <span className="error" style={{ fontSize: '0.8rem', color: 'var(--danger)', marginTop: '0.25rem' }}>{errors.email}</span>}
                            </div>

                            <div className="form-group">
                                <span style={{ fontSize: '0.9rem', fontWeight: 600, color: '#334155', marginBottom: '0.5rem' }}>Password</span>
                                <div style={{ position: 'relative' }}>
                                    <HiLockClosed style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} size={20} />
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        name="password"
                                        value={form.password}
                                        onChange={handleChange}
                                        placeholder="••••••••"
                                        style={{ paddingLeft: '3rem', paddingRight: '4rem' }}
                                    />
                                    <button
                                        type="button"
                                        style={{ position: 'absolute', right: '0.5rem', top: '50%', transform: 'translateY(-50%)', background: 'transparent', border: 'none', color: '#64748b', cursor: 'pointer', padding: '0.5rem' }}
                                        onClick={() => setShowPassword((prev) => !prev)}
                                    >
                                        {showPassword ? <HiEyeOff size={20} /> : <HiEye size={20} />}
                                    </button>
                                </div>
                                {errors.password && <span className="error" style={{ fontSize: '0.8rem', color: 'var(--danger)', marginTop: '0.25rem' }}>{errors.password}</span>}
                            </div>

                            <button type="submit" disabled={loading} className="btn btn-primary login-btn" style={{ padding: '1rem', borderRadius: '14px', fontSize: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem', marginTop: '1rem' }}>
                                {loading ? "Authenticating..." : <><HiArrowRight /> Sign In</>}
                            </button>
                        </form>

                        <div className="login-card__footer" style={{ marginTop: '2rem', paddingTop: '2rem', borderTop: '1px solid #f1f5f9', textAlign: 'center' }}>
                            <p style={{ margin: '0.5rem 0' }}>
                                Forgot password?{" "}
                                <Link to="/forgot-password" style={{ fontWeight: 700, color: 'var(--brand)' }}>
                                    Recover access
                                </Link>
                            </p>
                            <p style={{ margin: '0.5rem 0' }}>
                                Don't have an account?{" "}
                                <Link to="/signup" style={{ fontWeight: 700, color: 'var(--brand)' }}>
                                    Join the evolution
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
