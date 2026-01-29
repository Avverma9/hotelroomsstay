const MenuItem = require("../../models/additionalSettings/menuItem");

exports.addMenu = async (req, res) => {
    try {
        const { title, path, role } = req.body
        await MenuItem.create({ title, path, role });
        res.status(201).json({ message: 'Menu item added successfully' });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
}

// 🔹 Add bulk menu items
exports.addMenuBulk = async (req, res) => {
    try {
        const data = req.body; // should be an array
        if (!Array.isArray(data)) {
            return res.status(400).json({ error: 'Data should be an array' });
        }

        const insertedItems = await MenuItem.insertMany(data);
        res.status(201).json(insertedItems);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
}

exports.getAllMenuItems = async (req, res) => {
    try {
        const menuItems = await MenuItem.find();
        res.status(200).json(menuItems);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
exports.deleteMenuById = async (req, res) => {
    try {
        const { id } = req.params
        await MenuItem.findByIdAndDelete(id)
        res.status(200).json({ message: "Deleted Successfully" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}

exports.changeStatus = async (req, res) => {
    try {
      const { id } = req.params;
      const menuItem = await MenuItem.findById(id);
      if (!menuItem) {
        return res.status(404).json({ message: "Menu item not found" });
      }
      // Toggle the isActive field
      menuItem.isActive = !menuItem.isActive;
  
      await menuItem.save();
  
      return res.status(200).json({
        message: `Status changed to ${menuItem.isActive ? 'active' : 'inactive'}`,
        data: menuItem
      });
  
    } catch (error) {
      console.error("Error changing status:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  };
  