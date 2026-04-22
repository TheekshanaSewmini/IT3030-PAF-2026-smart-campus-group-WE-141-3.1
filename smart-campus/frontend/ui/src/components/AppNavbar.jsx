import { NavLink } from "react-router-dom";
import { normalizeRole, roleHomePath } from "../utils/roleHome";

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
        <header className="top-nav top-nav--glass">
            <div>
                <h1 className="brand">{title}</h1>
                {subtitle && <p className="subtitle">{subtitle}</p>}
            </div>

            <div className="nav-main">
                <nav className="nav-group professional-nav">
                    <NavLink className={({ isActive }) => `nav-link${isActive ? " active" : ""}`} to={homePath} end>
                        Home
                    </NavLink>
                    <NavLink className={({ isActive }) => `nav-link${isActive ? " active" : ""}`} to="/resources">
                        Resources
                    </NavLink>
                    <NavLink className={({ isActive }) => `nav-link${isActive ? " active" : ""}`} to="/booking">
                        Booking
                    </NavLink>
                    <NavLink className={({ isActive }) => `nav-link${isActive ? " active" : ""}`} to="/settings">
                        Settings
                    </NavLink>
                    {isAdmin && (
                        <NavLink
                            className={({ isActive }) => `nav-link${isActive ? " active" : ""}`}
                            to="/admin/resources"
                        >
                            Manage
                        </NavLink>
                    )}
                </nav>

                <div className="nav-user">
                    <NavLink className="user-pill" to="/profile">
                        <span className="user-avatar">{initials}</span>
                        <span className="user-details">
                            <span className="user-name">{displayName}</span>
                            <span className="user-role">{roleLabel}</span>
                        </span>
                    </NavLink>
                    <button className="btn btn-danger btn-logout" type="button" onClick={onLogout}>
                        Logout
                    </button>
                </div>
            </div>
        </header>
    );
}
