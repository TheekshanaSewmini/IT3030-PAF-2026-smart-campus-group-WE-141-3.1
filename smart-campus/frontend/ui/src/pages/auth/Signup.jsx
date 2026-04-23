import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../../api";
import { HiUser, HiMail, HiPhone, HiShieldCheck, HiArrowRight, HiIdentification, HiAcademicCap, HiCalendar, HiLockClosed, HiSparkles } from "react-icons/hi";

const roleOptions = ["USER", "ADMIN", "TECHNICIAN"];
const yearOptions = ["FIRST", "SECOND", "THIRD", "FOURTH"];
const semesterOptions = ["SEM1", "SEM2"];

export default function Signup() {
    const navigate = useNavigate();

    const [form, setForm] = useState({
        firstName: "",
        lastName: "",
        email: "",
        tempEmail: "",
        phoneNumber: "",
        role: "USER",
        year: "FIRST",
        semester: "SEM1",
        password: "",
        confirmPassword: "",
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const handleChange = (event) => {
        const { name, value } = event.target;
        setForm((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        setError("");
        setSuccess("");

        if (form.password.length < 6) {
            setError("Password must be at least 6 characters.");
            return;
        }

        if (form.password !== form.confirmPassword) {
            setError("Passwords do not match.");
            return;
        }

        setLoading(true);

        try {
            const phoneCheck = await api.post("/auth/check-phone", {
                phoneNumber: form.phoneNumber.trim(),
            });

            if (!phoneCheck.data?.available) {
                setError("Phone number already exists.");
                return;
            }

            const response = await api.post("/auth/register", {
                firstname: form.firstName.trim(),
                lastName: form.lastName.trim(),
                email: form.email.trim(),
                tempEmail: form.tempEmail.trim(),
                phoneNumber: form.phoneNumber.trim(),
                role: form.role,
                year: form.year,
                semester: form.semester,
                password: form.password,
            });

            if (!response.data?.success) {
                setError(response.data?.message || "Signup failed.");
                return;
            }

            setSuccess("Registration successful. Enter OTP to verify your account.");
            navigate("/verify", { state: { email: form.email.trim() } });
        } catch (err) {
            setError(err.response?.data?.message || "Signup failed.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="page-shell" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', padding: '2rem' }}>
            <div className="bg-layer bg-auth" />
            
            <div className="glass-card auth-card" style={{ maxWidth: '850px', width: '100%', padding: '3rem', borderRadius: '32px', backdropFilter: 'blur(30px)' }}>
                <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
                    <div style={{ display: 'inline-flex', background: 'var(--brand-soft)', color: 'var(--brand)', padding: '0.75rem', borderRadius: '16px', marginBottom: '1rem' }}>
                        <HiIdentification size={32} />
                    </div>
                    <h1 className="brand" style={{ fontSize: '2.25rem', fontWeight: 800, marginBottom: '0.5rem' }}>Create Account</h1>
                    <p className="subtitle" style={{ fontSize: '1.05rem', color: '#64748b' }}>Start your journey with Smarter Campus Management</p>
                </div>

                {error && <div className="message error" style={{ borderRadius: '12px', padding: '1rem', marginBottom: '2rem' }}>{error}</div>}
                {success && <div className="message success" style={{ borderRadius: '12px', padding: '1rem', marginBottom: '2rem' }}>{success}</div>}

                <form className="form-grid" onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                    <div className="form-group">
                        <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#334155', marginBottom: '0.5rem', display: 'block' }}>First Name</span>
                        <div style={{ position: 'relative' }}>
                            <HiUser style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} size={18} />
                            <input name="firstName" value={form.firstName} onChange={handleChange} required style={{ paddingLeft: '3rem' }} placeholder="John" />
                        </div>
                    </div>

                    <div className="form-group">
                        <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#334155', marginBottom: '0.5rem', display: 'block' }}>Last Name</span>
                        <div style={{ position: 'relative' }}>
                            <HiUser style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} size={18} />
                            <input name="lastName" value={form.lastName} onChange={handleChange} required style={{ paddingLeft: '3rem' }} placeholder="Doe" />
                        </div>
                    </div>

                    <div className="form-group" style={{ gridColumn: 'span 2' }}>
                        <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#334155', marginBottom: '0.5rem', display: 'block' }}>University Email</span>
                        <div style={{ position: 'relative' }}>
                            <HiMail style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} size={18} />
                            <input name="email" type="email" placeholder="ITXXXXXXXX@my.sliit.lk" value={form.email} onChange={handleChange} required style={{ paddingLeft: '3rem' }} />
                        </div>
                    </div>

                    <div className="form-group">
                        <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#334155', marginBottom: '0.5rem', display: 'block' }}>Phone Number</span>
                        <div style={{ position: 'relative' }}>
                            <HiPhone style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} size={18} />
                            <input name="phoneNumber" placeholder="07XXXXXXXX" value={form.phoneNumber} onChange={handleChange} required style={{ paddingLeft: '3rem' }} />
                        </div>
                    </div>

                    <div className="form-group">
                        <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#334155', marginBottom: '0.5rem', display: 'block' }}>Academic Year</span>
                        <div style={{ position: 'relative' }}>
                            <HiCalendar style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} size={18} />
                            <select name="year" value={form.year} onChange={handleChange} style={{ paddingLeft: '3rem' }}>
                                {yearOptions.map(y => <option key={y} value={y}>{y}</option>)}
                            </select>
                        </div>
                    </div>

                    <div className="form-group">
                        <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#334155', marginBottom: '0.5rem', display: 'block' }}>Academic Role</span>
                        <div style={{ position: 'relative' }}>
                            <HiAcademicCap style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} size={18} />
                            <select name="role" value={form.role} onChange={handleChange} style={{ paddingLeft: '3rem' }}>
                                {roleOptions.map(r => <option key={r} value={r}>{r}</option>)}
                            </select>
                        </div>
                    </div>

                    <div className="form-group">
                        <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#334155', marginBottom: '0.5rem', display: 'block' }}>Semester</span>
                        <div style={{ position: 'relative' }}>
                            <HiSparkles style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} size={18} />
                            <select name="semester" value={form.semester} onChange={handleChange} style={{ paddingLeft: '3rem' }}>
                                {semesterOptions.map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                        </div>
                    </div>

                    <div className="form-group">
                        <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#334155', marginBottom: '0.5rem', display: 'block' }}>Password</span>
                        <div style={{ position: 'relative' }}>
                            <HiLockClosed style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} size={18} />
                            <input name="password" type="password" value={form.password} onChange={handleChange} required style={{ paddingLeft: '3rem' }} placeholder="••••••••" />
                        </div>
                    </div>

                    <div className="form-group">
                        <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#334155', marginBottom: '0.5rem', display: 'block' }}>Confirm Password</span>
                        <div style={{ position: 'relative' }}>
                            <HiShieldCheck style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} size={18} />
                            <input name="confirmPassword" type="password" value={form.confirmPassword} onChange={handleChange} required style={{ paddingLeft: '3rem' }} placeholder="••••••••" />
                        </div>
                    </div>

                    <button className="btn btn-primary" type="submit" disabled={loading} style={{ gridColumn: 'span 2', padding: '1rem', borderRadius: '14px', fontSize: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem', marginTop: '1rem' }}>
                        {loading ? "Creating your account..." : <><HiArrowRight /> Complete Registration</>}
                    </button>
                </form>

                <div style={{ marginTop: '2rem', textAlign: 'center', color: '#64748b' }}>
                    Already have an account? <Link className="inline-link" to="/login" style={{ fontWeight: 700, color: 'var(--brand)' }}>Sign in here</Link>
                </div>
            </div>
        </div>
    );
}
