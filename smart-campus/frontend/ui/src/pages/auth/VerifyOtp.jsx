import { useState } from "react";
import { Link, useNavigate, useSearchParams, useLocation } from "react-router-dom";
import api from "../../api";
import { HiShieldCheck, HiArrowRight, HiRefresh, HiLockClosed, HiMail } from "react-icons/hi";

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
        <div className="page-shell" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', padding: '2rem' }}>
            <div className="bg-layer bg-auth" />
            
            <div className="glass-card auth-card" style={{ maxWidth: '450px', width: '100%', padding: '3rem', borderRadius: '32px', backdropFilter: 'blur(30px)', textAlign: 'center' }}>
                <div style={{ display: 'inline-flex', background: 'var(--brand-soft)', color: 'var(--brand)', padding: '1rem', borderRadius: '20px', marginBottom: '1.5rem' }}>
                    <HiShieldCheck size={40} />
                </div>
                
                <h1 className="brand" style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '0.75rem' }}>Security Verify</h1>
                <p className="subtitle" style={{ color: '#64748b', marginBottom: '2.5rem', lineHeight: 1.6 }}>
                    We've sent a 6-digit code to <br/>
                    <span style={{ fontWeight: 700, color: 'var(--text-main)' }}>{emailHint || "your university email"}</span>
                </p>

                {error && <div className="message error" style={{ borderRadius: '12px', padding: '1rem', marginBottom: '1.5rem' }}>{error}</div>}
                {success && <div className="message success" style={{ borderRadius: '12px', padding: '1rem', marginBottom: '1.5rem' }}>{success}</div>}

                <form className="form-grid" onSubmit={handleVerify} style={{ display: 'grid', gap: '1.5rem' }}>
                    <div className="form-group" style={{ textAlign: 'left' }}>
                        <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#334155', marginBottom: '0.5rem', display: 'block' }}>One-Time Password</span>
                        <div style={{ position: 'relative' }}>
                            <HiLockClosed style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} size={20} />
                            <input
                                value={otp}
                                onChange={(event) => setOtp(event.target.value)}
                                placeholder="0 0 0 0 0 0"
                                required
                                style={{ paddingLeft: '3rem', letterSpacing: '0.2em', textAlign: 'center', fontWeight: 800, fontSize: '1.1rem' }}
                                maxLength={6}
                            />
                        </div>
                    </div>

                    <button className="btn btn-primary" type="submit" disabled={loading} style={{ padding: '1rem', borderRadius: '14px', fontSize: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem' }}>
                        {loading ? "Confirming..." : <><HiArrowRight /> Verify Account</>}
                    </button>
                </form>

                <div style={{ marginTop: '2.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <button
                        className="btn btn-ghost"
                        type="button"
                        onClick={handleResend}
                        disabled={resending}
                        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
                    >
                        <HiRefresh className={resending ? "spin" : ""} />
                        {resending ? "Resending Code..." : "Resend Verification Code"}
                    </button>
                    
                    <Link to="/login" style={{ fontSize: '0.9rem', color: '#64748b', textDecoration: 'none' }}>
                        Back to sign in
                    </Link>
                </div>
            </div>
        </div>
    );
}
