const SidebarLink = require("../../models/additionalSettings/sidebarLink");

const normalizeIdList = (values) => {
  if (!Array.isArray(values)) {
    return [];
  }

  const normalized = values
    .map((value) => String(value || "").trim())
    .filter(Boolean);

  return [...new Set(normalized)];
};

const normalizeMode = (mode) => {
  return mode === "custom" ? "custom" : "role_based";
};

const groupSidebarLinks = (sidebarLinks) => {
  return sidebarLinks.reduce((acc, link) => {
    if (!acc[link.parentLink]) {
      acc[link.parentLink] = [];
    }

    acc[link.parentLink].push({
      id: link._id,
      childLink: link.childLink,
      route: link.childLink,
      isParentOnly: Boolean(link.isParentOnly),
      icon: link.icon,
      status: link.status,
      role: link.role,
      order: link.order,
    });

    return acc;
  }, {});
};

const getEffectiveSidebarLinksForUser = async ({ user, grouped = true }) => {
  const permissions = user.sidebarPermissions || {};
  const mode = normalizeMode(permissions.mode);
  const allowedLinkIds = normalizeIdList(permissions.allowedLinkIds || []);
  const blockedLinkIds = normalizeIdList(permissions.blockedLinkIds || []);
  const blockedSet = new Set(blockedLinkIds);

  const query = { status: "active" };
  if (mode === "custom") {
    query._id = { $in: allowedLinkIds };
  } else {
    query.$or = [{ role: { $in: [user.role] } }];
    if (allowedLinkIds.length > 0) {
      query.$or.push({ _id: { $in: allowedLinkIds } });
    }
  }

  const sidebarLinks = await SidebarLink.find(query)
    .sort({ order: 1, parentLink: 1, childLink: 1 })
    .lean();

  const filteredLinks = sidebarLinks.filter(
    (item) => !blockedSet.has(String(item._id)),
  );

  return grouped ? groupSidebarLinks(filteredLinks) : filteredLinks;
};

module.exports = {
  normalizeIdList,
  normalizeMode,
  groupSidebarLinks,
  getEffectiveSidebarLinksForUser,
};
