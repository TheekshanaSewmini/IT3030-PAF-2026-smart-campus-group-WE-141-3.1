import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../../api";

export default function ForgotPassword() {
    const navigate = useNavigate();

    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [timer, setTimer] = useState(0);
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");

    const [form, setForm] = useState({
        email: "",
        otp: "",
        password: "",
        repeatPassword: "",
    });

    useEffect(() => {
        if (timer <= 0) {
            return undefined;
        }

        const timeout = setTimeout(() => setTimer((prev) => prev - 1), 1000);
        return () => clearTimeout(timeout);
    }, [timer]);

    const handleChange = (event) => {
        const { name, value } = event.target;
        setForm((prev) => ({ ...prev, [name]: value }));
    };

    const sendOtp = async () => {
        setError("");
        setMessage("");

        if (!form.email.trim()) {
            setError("Email is required.");
            return;
        }

        setLoading(true);

        try {
            const response = await api.post("/forgotpass/send-otp", {
                email: form.email.trim(),
            });

            setMessage(response.data || "OTP sent.");
            setStep(2);
            setTimer(60);
        } catch (err) {
            setError(err.response?.data || "Failed to send OTP.");
        } finally {
            setLoading(false);
        }
    };

    const verifyOtp = async () => {
        setError("");
        setMessage("");

        if (!form.otp.trim()) {
            setError("OTP is required.");
            return;
        }

        setLoading(true);

        try {
            const response = await api.post("/forgotpass/verify-otp", {
                otp: form.otp.trim(),
            });

            setMessage(response.data || "OTP verified.");
            setStep(3);
        } catch (err) {
            setError(err.response?.data || "OTP verification failed.");
        } finally {
            setLoading(false);
        }
    };

    const resendOtp = async () => {
        setError("");
        setMessage("");
        setLoading(true);

        try {
            const response = await api.post("/forgotpass/resend-otp");
            setMessage(response.data || "OTP resent.");
            setTimer(60);
        } catch (err) {
            setError(err.response?.data || "Failed to resend OTP.");
        } finally {
            setLoading(false);
        }
    };

    const resetPassword = async () => {
        setError("");
        setMessage("");

        if (!form.password || form.password.length < 6) {
            setError("Password must be at least 6 characters.");
            return;
        }

        if (form.password !== form.repeatPassword) {
            setError("Passwords do not match.");
            return;
        }

        setLoading(true);

        try {
            const response = await api.post("/forgotpass/change-password", {
                password: form.password,
                repeatPassword: form.repeatPassword,
            });

            setMessage(response.data || "Password changed successfully.");
            setTimeout(() => navigate("/login"), 900);
        } catch (err) {
            setError(err.response?.data || "Failed to change password.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="page-shell">
            <div className="bg-layer bg-auth" />
            <div className="glass-card auth-card">
                <h1 className="brand">Forgot Password</h1>
                <p className="subtitle">Recover your account in three quick steps.</p>

                {error && <p className="message error">{error}</p>}
                {message && <p className="message success">{message}</p>}

                {step === 1 && (
                    <div className="form-grid">
                        <label className="field">
                            <span>Email</span>
                            <input
                                name="email"
                                type="email"
                                placeholder="your-email@my.sliit.lk"
                                value={form.email}
                                onChange={handleChange}
                            />
                        </label>

                        <button className="btn btn-primary" type="button" onClick={sendOtp} disabled={loading}>
                            {loading ? "Sending..." : "Send OTP"}
                        </button>
                    </div>
                )}

                {step === 2 && (
                    <div className="form-grid">
                        <label className="field">
                            <span>OTP</span>
                            <input
                                name="otp"
                                placeholder="Enter OTP"
                                value={form.otp}
                                onChange={handleChange}
                            />
                        </label>

                        <button className="btn btn-primary" type="button" onClick={verifyOtp} disabled={loading}>
                            {loading ? "Verifying..." : "Verify OTP"}
                        </button>

                        <button
                            className="btn btn-secondary"
                            type="button"
                            onClick={resendOtp}
                            disabled={loading || timer > 0}
                        >
                            {timer > 0 ? `Resend in ${timer}s` : "Resend OTP"}
                        </button>
                    </div>
                )}

                {step === 3 && (
                    <div className="form-grid">
                        <label className="field">
                            <span>New Password</span>
                            <input
                                name="password"
                                type="password"
                                value={form.password}
                                onChange={handleChange}
                            />
                        </label>

                        <label className="field">
                            <span>Repeat Password</span>
                            <input
                                name="repeatPassword"
                                type="password"
                                value={form.repeatPassword}
                                onChange={handleChange}
                            />
                        </label>

                        <button className="btn btn-primary" type="button" onClick={resetPassword} disabled={loading}>
                            {loading ? "Saving..." : "Change Password"}
                        </button>
                    </div>
                )}

                <p className="muted">
                    Back to <Link className="inline-link" to="/login">login</Link>
                </p>
            </div>
        </div>
    );
}
