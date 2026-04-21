import { useState } from "react";
import { Link, useNavigate, useSearchParams, useLocation } from "react-router-dom";
import api from "../../api";

export default function VerifyOtp() {
    const navigate = useNavigate();
    const location = useLocation();
    const [searchParams] = useSearchParams();
    const otpFromUrl = searchParams.get("code") || "";
    const emailHint = searchParams.get("email") || location.state?.email || "";

    const [otp, setOtp] = useState(otpFromUrl);
    const [loading, setLoading] = useState(false);
    const [resending, setResending] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const handleVerify = async (event) => {
        event.preventDefault();
        setError("");
        setSuccess("");

        if (!otp.trim()) {
            setError("OTP is required.");
            return;
        }

        setLoading(true);

        try {
            const response = await api.post("/auth/verify-code", {
                verifyCode: otp.trim(),
            });

            if (!response.data?.success) {
                setError(response.data?.message || "Verification failed.");
                return;
            }

            // Email stored in backend cookie, no localStorage cleanup needed
            setSuccess("Account verified successfully.");
            navigate("/login");
        } catch (err) {
            setError(err.response?.data?.message || "Verification failed.");
        } finally {
            setLoading(false);
        }
    };

    const handleResend = async () => {
        setError("");
        setSuccess("");
        setResending(true);

        try {
            const response = await api.post("/auth/resend-otp");

            if (!response.data?.success) {
                setError(response.data?.message || "Failed to resend OTP.");
                return;
            }

            setSuccess(response.data?.message || "OTP resent.");
        } catch (err) {
            setError(err.response?.data?.message || "Failed to resend OTP.");
        } finally {
            setResending(false);
        }
    };

    return (
        <div className="page-shell">
            <div className="bg-layer bg-auth" />
            <div className="glass-card auth-card">
                <h1 className="brand">Verify Account</h1>
                <p className="subtitle">
                    Enter the OTP sent to {emailHint || "your email"}.
                </p>

                {error && <p className="message error">{error}</p>}
                {success && <p className="message success">{success}</p>}

                <form className="form-grid" onSubmit={handleVerify}>
                    <label className="field">
                        <span>Verification Code</span>
                        <input
                            value={otp}
                            onChange={(event) => setOtp(event.target.value)}
                            placeholder="6-digit OTP"
                            required
                        />
                    </label>

                    <button className="btn btn-primary" type="submit" disabled={loading}>
                        {loading ? "Verifying..." : "Verify"}
                    </button>
                </form>

                <div className="actions-row">
                    <button
                        className="btn btn-secondary"
                        type="button"
                        onClick={handleResend}
                        disabled={resending}
                    >
                        {resending ? "Resending..." : "Resend OTP"}
                    </button>
                    <Link className="btn btn-ghost" to="/login">Back to Login</Link>
                </div>
            </div>
        </div>
    );
}
