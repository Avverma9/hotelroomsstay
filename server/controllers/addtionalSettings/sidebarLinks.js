const SidebarLink = require("../../models/additionalSettings/sidebarLink");
const DashboardUser = require("../../models/dashboardUser");
const {
  normalizeIdList,
  normalizeMode,
  getEffectiveSidebarLinksForUser,
} = require("./sidebarPermissionService");

const normalizeRoles = (roleInput) => {
  if (Array.isArray(roleInput)) {
    return roleInput
      .map((item) => String(item).trim())
      .filter(Boolean);
  }
  if (typeof roleInput === "string") {
    const roleValue = roleInput.trim();
    return roleValue ? [roleValue] : [];
  }
  return [];
};

const normalizeBoolean = (value) => {
  if (typeof value === "boolean") {
    return value;
  }
  if (typeof value === "string") {
    const v = value.trim().toLowerCase();
    if (["true", "1", "yes"].includes(v)) {
      return true;
    }
    if (["false", "0", "no"].includes(v)) {
      return false;
    }
  }
  return false;
};

const deriveLabelFromRoute = (value) => {
  const normalized = String(value || "").trim();
  if (!normalized || normalized === "#") {
    return "";
  }

  const lastSegment = normalized.split("/").filter(Boolean).pop() || normalized;
  return lastSegment
    .replace(/[-_]+/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
};

const normalizeLabel = ({ label, childLink, route, parentLink, isParentOnly }) => {
  const explicitLabel = String(label || "").trim();
  if (explicitLabel) {
    return explicitLabel;
  }

  if (isParentOnly) {
    return String(parentLink || "").trim();
  }

  return deriveLabelFromRoute(childLink || route);
};

exports.createSidebarLink = async (req, res) => {
  try {
    const {
      parentLink,
      childLink,
      label,
      route,
      isParentOnly,
      icon,
      status,
      role,
      order,
    } = req.body;
    const roles = normalizeRoles(role);
    const resolvedIsParentOnly = normalizeBoolean(isParentOnly);
    const resolvedChildLink = String(childLink || route || "").trim();
    const resolvedLabel = normalizeLabel({
      label,
      childLink: resolvedChildLink,
      route,
      parentLink,
      isParentOnly: resolvedIsParentOnly,
    });

    if (!parentLink || roles.length === 0) {
      return res.status(400).json({
        message: "parentLink and role are required",
      });
    }

    if (!resolvedIsParentOnly && !resolvedChildLink) {
      return res.status(400).json({
        message: "childLink/route is required for non-parent-only menu",
      });
    }

    const created = await SidebarLink.create({
      parentLink,
      childLink: resolvedChildLink || "#",
      label: resolvedLabel,
      isParentOnly: resolvedIsParentOnly,
      icon,
      status,
      role: roles,
      order,
    });

    return res.status(201).json({
      message: "Sidebar link created successfully",
      data: created,
    });
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
};

exports.createSidebarLinksBulk = async (req, res) => {
  try {
    if (!Array.isArray(req.body)) {
      return res.status(400).json({ message: "Payload must be an array" });
    }

    const payload = req.body.map((item) => {
      const resolvedChildLink = String(item.childLink || item.route || "").trim();
      const resolvedIsParentOnly = normalizeBoolean(item.isParentOnly);
      return {
        ...item,
        childLink: resolvedChildLink || "#",
        label: normalizeLabel({
          label: item.label,
          childLink: resolvedChildLink,
          route: item.route,
          parentLink: item.parentLink,
          isParentOnly: resolvedIsParentOnly,
        }),
        isParentOnly: resolvedIsParentOnly,
        role: normalizeRoles(item.role),
      };
    });

    const hasInvalidItem = payload.some(
      (item) =>
        !item.parentLink ||
        item.role.length === 0 ||
        (!item.isParentOnly && (!item.childLink || item.childLink === "#")),
    );
    if (hasInvalidItem) {
      return res.status(400).json({
        message:
          "Each item must include parentLink and role; non-parent-only items also need childLink/route",
      });
    }

    const created = await SidebarLink.insertMany(payload);
    return res.status(201).json({
      message: "Sidebar links created successfully",
      data: created,
    });
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
};

exports.getSidebarLinks = async (req, res) => {
  try {
    const { role, status } = req.query;
    const query = {};

    if (role) {
      query.role = { $in: [String(role).trim()] };
    }

    if (status) {
      query.status = String(status).trim().toLowerCase();
    }

    const sidebarLinks = await SidebarLink.find(query).sort({
      order: 1,
      parentLink: 1,
      childLink: 1,
    });

    return res.status(200).json({
      message: "Sidebar links fetched successfully",
      data: sidebarLinks.map((link) => ({
        ...link.toObject(),
        label: normalizeLabel({
          label: link.label,
          childLink: link.childLink,
          parentLink: link.parentLink,
          isParentOnly: link.isParentOnly,
        }),
      })),
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

exports.getSidebarLinksGrouped = async (req, res) => {
  try {
    const { role } = req.query;
    const query = { status: "active" };

    if (role) {
      query.role = { $in: [String(role).trim()] };
    }

    const sidebarLinks = await SidebarLink.find(query).sort({
      order: 1,
      parentLink: 1,
      childLink: 1,
    });

    const grouped = sidebarLinks.reduce((acc, link) => {
      if (!acc[link.parentLink]) {
        acc[link.parentLink] = [];
      }

      acc[link.parentLink].push({
        id: link._id,
        label: normalizeLabel({
          label: link.label,
          childLink: link.childLink,
          parentLink: link.parentLink,
          isParentOnly: link.isParentOnly,
        }),
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

    return res.status(200).json({
      message: "Sidebar links grouped by parentLink",
      data: grouped,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

exports.updateSidebarLink = async (req, res) => {
  try {
    const { id } = req.params;
    const payload = { ...req.body };

    if (Object.prototype.hasOwnProperty.call(payload, "route")) {
      payload.childLink = String(payload.route || "").trim();
      delete payload.route;
    }

    if (Object.prototype.hasOwnProperty.call(payload, "isParentOnly")) {
      payload.isParentOnly = normalizeBoolean(payload.isParentOnly);
    }

    if (Object.prototype.hasOwnProperty.call(payload, "role")) {
      payload.role = normalizeRoles(payload.role);
      if (payload.role.length === 0) {
        return res.status(400).json({ message: "role cannot be empty" });
      }
    }

    if (Object.prototype.hasOwnProperty.call(payload, "childLink")) {
      payload.childLink = String(payload.childLink || "").trim();
      const requestedParentOnly = Object.prototype.hasOwnProperty.call(
        payload,
        "isParentOnly",
      )
        ? payload.isParentOnly
        : undefined;

      if (!payload.childLink && requestedParentOnly !== true) {
        return res.status(400).json({
          message: "childLink/route cannot be empty for non-parent-only menu",
        });
      }

      if (!payload.childLink && requestedParentOnly === true) {
        payload.childLink = "#";
      }
    }

    if (
      Object.prototype.hasOwnProperty.call(payload, "label")
      || Object.prototype.hasOwnProperty.call(payload, "childLink")
      || Object.prototype.hasOwnProperty.call(payload, "isParentOnly")
      || Object.prototype.hasOwnProperty.call(payload, "parentLink")
    ) {
      payload.label = normalizeLabel({
        label: payload.label,
        childLink: payload.childLink,
        parentLink: payload.parentLink,
        isParentOnly: payload.isParentOnly,
      });
    }

    const updated = await SidebarLink.findByIdAndUpdate(id, payload, {
      new: true,
      runValidators: true,
    });

    if (!updated) {
      return res.status(404).json({ message: "Sidebar link not found" });
    }

    return res.status(200).json({
      message: "Sidebar link updated successfully",
      data: updated,
    });
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
};

exports.changeSidebarLinkStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!["active", "inactive"].includes(status)) {
      return res.status(400).json({
        message: "status must be either active or inactive",
      });
    }

    const updated = await SidebarLink.findByIdAndUpdate(
      id,
      { status },
      { new: true, runValidators: true },
    );

    if (!updated) {
      return res.status(404).json({ message: "Sidebar link not found" });
    }

    return res.status(200).json({
      message: `Sidebar link status changed to ${status}`,
      data: updated,
    });
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
};

exports.deleteSidebarLinkById = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await SidebarLink.findByIdAndDelete(id);

    if (!deleted) {
      return res.status(404).json({ message: "Sidebar link not found" });
    }

    return res.status(200).json({ message: "Sidebar link deleted successfully" });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

exports.getSidebarLinksForUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const { grouped = "true" } = req.query;

    const user = await DashboardUser.findById(userId).lean();
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const isGrouped = String(grouped).toLowerCase() !== "false";
    const links = await getEffectiveSidebarLinksForUser({
      user,
      grouped: isGrouped,
    });

    return res.status(200).json({
      message: "Sidebar links fetched for user",
      data: links,
      user: {
        id: user._id,
        role: user.role,
        permissionMode: normalizeMode(user.sidebarPermissions?.mode),
      },
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

exports.getUserSidebarPermissions = async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await DashboardUser.findById(userId)
      .select("role sidebarPermissions name email")
      .lean();

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.status(200).json({
      message: "User sidebar permissions fetched",
      data: {
        userId: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        sidebarPermissions: {
          mode: normalizeMode(user.sidebarPermissions?.mode),
          allowedLinkIds: normalizeIdList(user.sidebarPermissions?.allowedLinkIds),
          blockedLinkIds: normalizeIdList(user.sidebarPermissions?.blockedLinkIds),
        },
      },
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

exports.updateUserSidebarPermissions = async (req, res) => {
  try {
    const { userId } = req.params;
    const mode = normalizeMode(req.body.mode);
    const allowedLinkIds = normalizeIdList(req.body.allowedLinkIds || []);
    const blockedLinkIds = normalizeIdList(req.body.blockedLinkIds || []);

    const updatedUser = await DashboardUser.findByIdAndUpdate(
      userId,
      {
        $set: {
          "sidebarPermissions.mode": mode,
          "sidebarPermissions.allowedLinkIds": allowedLinkIds,
          "sidebarPermissions.blockedLinkIds": blockedLinkIds,
        },
      },
      { new: true },
    )
      .select("role sidebarPermissions name email")
      .lean();

    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.status(200).json({
      message: "User sidebar permissions updated",
      data: {
        userId: updatedUser._id,
        role: updatedUser.role,
        sidebarPermissions: updatedUser.sidebarPermissions,
      },
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};
