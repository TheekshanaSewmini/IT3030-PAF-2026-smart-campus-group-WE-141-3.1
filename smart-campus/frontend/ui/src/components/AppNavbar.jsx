import { NavLink, Link } from "react-router-dom";
import { normalizeRole, roleHomePath } from "../utils/roleHome";
import { HiAcademicCap, HiLogout } from "react-icons/hi";

function getUserDisplayName(profile) {
    const fullName = `${profile?.name || ""} ${profile?.lastName || ""}`.trim();
    if (fullName) {
        return fullName;
    }

    if (profile?.email) {
        return profile.email;
    }

    return "Campus User";
}

export default function AppNavbar({ title, subtitle, profile, onLogout }) {
    const roleLabel = normalizeRole(profile?.role) || "USER";
    const homePath = roleHomePath(profile?.role);
    const displayName = getUserDisplayName(profile);
    const initials = (profile?.name?.[0] || displayName[0] || "U").toUpperCase();
    const isAdmin = roleLabel === "ADMIN";

    return (
        <header className="top-nav top-nav--glass professional-header">
            <div className="brand-section">
                <Link to={homePath} className="brand-logo">
                    <span className="logo-icon">
                        <HiAcademicCap />
                    </span>
                    <div>
                        <h1 className="brand-text">SmartCampus</h1>
                        <p className="subtitle-text">{title}</p>
                    </div>
                </Link>
            </div>

            <nav className="nav-center">
                <div className="nav-group professional-nav">
                    <NavLink className={({ isActive }) => `nav-link${isActive ? " active" : ""}`} to={homePath} end>
                        Dashboard
                    </NavLink>
                    <NavLink className={({ isActive }) => `nav-link${isActive ? " active" : ""}`} to="/resources">
                        Resources
                    </NavLink>
                    <NavLink className={({ isActive }) => `nav-link${isActive ? " active" : ""}`} to="/booking">
                        My Bookings
                    </NavLink>
                    {isAdmin && (
                        <NavLink
                            className={({ isActive }) => `nav-link${isActive ? " active" : ""}`}
                            to="/admin/resources"
                        >
                            Management
                        </NavLink>
                    )}
                </div>
            </nav>

            <div className="nav-end">
                <div className="nav-user-section">
                    <NavLink className="user-profile-pill" to="/profile">
                        <div className="avatar-circle">{initials}</div>
                        <div className="user-info-hint">
                            <span className="user-name-text">{displayName}</span>
                            <span className="user-role-badge">{roleLabel}</span>
                        </div>
                    </NavLink>
                    <button className="logout-icon-btn" type="button" onClick={onLogout} title="Logout">
                        <HiLogout size={18} /> <span>Logout</span>
                    </button>
                </div>
            </div>
        </header>
    );
}
