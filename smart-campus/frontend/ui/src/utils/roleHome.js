export const normalizeRole = (role) => String(role || "").replace("ROLE_", "").toUpperCase();

export const roleHomePath = (role) => {
    const normalized = normalizeRole(role);

    if (normalized === "ADMIN") {
        return "/dashboard";
    }

    if (normalized === "TECHNICIAN") {
        return "/tech-home";
    }

    return "/home";
};
