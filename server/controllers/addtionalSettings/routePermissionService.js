const normalizeRouteList = (values) => {
  if (!Array.isArray(values)) {
    return [];
  }

  const normalized = values
    .map((value) => String(value || "").trim())
    .filter(Boolean)
    .map((value) => {
      let cleaned = value.split("?")[0].split("#")[0].trim();
      if (!cleaned.startsWith("/")) {
        cleaned = `/${cleaned}`;
      }
      if (cleaned.length > 1 && cleaned.endsWith("/")) {
        cleaned = cleaned.slice(0, -1);
      }
      return cleaned;
    });

  return [...new Set(normalized)];
};

const normalizeRouteMode = (mode) => {
  return mode === "custom" ? "custom" : "allow_all";
};

const sanitizePath = (value) => {
  let path = String(value || "").trim().split("?")[0].split("#")[0];
  if (!path.startsWith("/")) {
    path = `/${path}`;
  }
  if (path.length > 1 && path.endsWith("/")) {
    path = path.slice(0, -1);
  }
  return path;
};

const escapeRegex = (value) => {
  return value.replace(/[|\\{}()[\]^$+?.]/g, "\\$&");
};

const toRegexPattern = (pattern) => {
  const escaped = escapeRegex(pattern)
    .replace(/\\:[a-zA-Z0-9_]+/g, "[^/]+")
    .replace(/\*/g, ".*");
  return new RegExp(`^${escaped}$`);
};

const doesRouteMatchPattern = ({ routePath, pattern }) => {
  const normalizedPath = sanitizePath(routePath);
  const normalizedPattern = sanitizePath(pattern);

  if (normalizedPattern === "/*" || normalizedPattern === "/**") {
    return true;
  }

  return toRegexPattern(normalizedPattern).test(normalizedPath);
};

const getUserRouteAccess = ({ user, routePath }) => {
  const permissions = user?.routePermissions || {};
  const mode = normalizeRouteMode(permissions.mode);
  const allowedRoutes = normalizeRouteList(permissions.allowedRoutes || []);
  const blockedRoutes = normalizeRouteList(permissions.blockedRoutes || []);

  const blockedPattern = blockedRoutes.find((pattern) =>
    doesRouteMatchPattern({ routePath, pattern }),
  );

  if (blockedPattern) {
    return {
      hasAccess: false,
      mode,
      matchedRuleType: "blocked",
      matchedPattern: blockedPattern,
      allowedRoutes,
      blockedRoutes,
    };
  }

  if (mode === "allow_all") {
    return {
      hasAccess: true,
      mode,
      matchedRuleType: "default_allow_all",
      matchedPattern: null,
      allowedRoutes,
      blockedRoutes,
    };
  }

  const allowedPattern = allowedRoutes.find((pattern) =>
    doesRouteMatchPattern({ routePath, pattern }),
  );

  if (allowedPattern) {
    return {
      hasAccess: true,
      mode,
      matchedRuleType: "allowed",
      matchedPattern: allowedPattern,
      allowedRoutes,
      blockedRoutes,
    };
  }

  return {
    hasAccess: false,
    mode,
    matchedRuleType: "custom_no_match",
    matchedPattern: null,
    allowedRoutes,
    blockedRoutes,
  };
};

module.exports = {
  normalizeRouteList,
  normalizeRouteMode,
  doesRouteMatchPattern,
  getUserRouteAccess,
};
