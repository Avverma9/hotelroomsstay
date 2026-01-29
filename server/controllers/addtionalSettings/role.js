const Role = require("../../models/additionalSettings/role");

// Add a new role
exports.addRole = async (req, res) => {
  try {
    const { role } = req.body;
    if (!role) {
      return res.status(400).json({ message: "Role is required" });
    }

    await Role.create({ role });
    return res.status(201).json({ message: "A new role added" });
  } catch (error) {
    return res.status(500).json({ message: "Internal Server Error", error });
  }
};

// Get all roles
exports.getRole = async (req, res) => {
  try {
    const roles = await Role.find();
    return res.status(200).json( roles );
  } catch (error) {
    return res.status(500).json({ message: "Internal Server Error", error });
  }
};

// Delete a role by ID
exports.deleteRoleById = async (req, res) => {
  try {
    const { id } = req.params;
    const deletedRole = await Role.findByIdAndDelete(id);

    if (!deletedRole) {
      return res.status(404).json({ message: "Role not found" });
    }

    return res.status(200).json({ message: "Role deleted successfully" });
  } catch (error) {
    return res.status(500).json({ message: "Internal Server Error", error });
  }
};
