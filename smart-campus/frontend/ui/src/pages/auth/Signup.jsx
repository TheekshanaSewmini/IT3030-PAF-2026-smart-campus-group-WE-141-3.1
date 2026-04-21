import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../../api";

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

            // Email stored in backend cookie, no need for localStorage
            setSuccess("Registration successful. Enter OTP to verify your account.");
            navigate("/verify", { state: { email: form.email.trim() } });
        } catch (err) {
            setError(err.response?.data?.message || "Signup failed.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="page-shell">
            <div className="bg-layer bg-auth" />
            <div className="glass-card auth-card">
                <h1 className="brand">Create Account</h1>
                <p className="subtitle">Use your SLIIT email to register.</p>

                {error && <p className="message error">{error}</p>}
                {success && <p className="message success">{success}</p>}

                <form className="form-grid" onSubmit={handleSubmit}>
                    <label className="field">
                        <span>First Name</span>
                        <input
                            name="firstName"
                            value={form.firstName}
                            onChange={handleChange}
                            required
                        />
                    </label>

                    <label className="field">
                        <span>Last Name</span>
                        <input
                            name="lastName"
                            value={form.lastName}
                            onChange={handleChange}
                            required
                        />
                    </label>

                    <label className="field">
                        <span>University Email</span>
                        <input
                            name="email"
                            type="email"
                            placeholder="IT23687882@my.sliit.lk"
                            value={form.email}
                            onChange={handleChange}
                            required
                        />
                    </label>

                    <label className="field">
                        <span>Recovery Email</span>
                        <input
                            name="tempEmail"
                            type="email"
                            placeholder="your-backup-email@example.com"
                            value={form.tempEmail}
                            onChange={handleChange}
                            required
                        />
                    </label>

                    <label className="field">
                        <span>Phone Number</span>
                        <input
                            name="phoneNumber"
                            placeholder="07XXXXXXXX"
                            value={form.phoneNumber}
                            onChange={handleChange}
                            required
                        />
                    </label>

                    <label className="field">
                        <span>Role</span>
                        <select name="role" value={form.role} onChange={handleChange}>
                            {roleOptions.map((role) => (
                                <option key={role} value={role}>
                                    {role}
                                </option>
                            ))}
                        </select>
                    </label>

                    <label className="field">
                        <span>Year</span>
                        <select name="year" value={form.year} onChange={handleChange}>
                            {yearOptions.map((year) => (
                                <option key={year} value={year}>
                                    {year}
                                </option>
                            ))}
                        </select>
                    </label>

                    <label className="field">
                        <span>Semester</span>
                        <select name="semester" value={form.semester} onChange={handleChange}>
                            {semesterOptions.map((semester) => (
                                <option key={semester} value={semester}>
                                    {semester}
                                </option>
                            ))}
                        </select>
                    </label>

                    <label className="field">
                        <span>Password</span>
                        <input
                            name="password"
                            type="password"
                            value={form.password}
                            onChange={handleChange}
                            required
                        />
                    </label>

                    <label className="field">
                        <span>Confirm Password</span>
                        <input
                            name="confirmPassword"
                            type="password"
                            value={form.confirmPassword}
                            onChange={handleChange}
                            required
                        />
                    </label>

                    <button className="btn btn-primary" type="submit" disabled={loading}>
                        {loading ? "Creating account..." : "Sign Up"}
                    </button>
                </form>

                <p className="muted">
                    Already registered? <Link className="inline-link" to="/login">Go to login</Link>
                </p>
            </div>
        </div>
    );
}
