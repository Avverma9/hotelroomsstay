const mongoose = require("mongoose");

const sidebarLinkSchema = new mongoose.Schema(
  {
    parentLink: {
      type: String,
      required: true,
      trim: true,
    },
    childLink: {
      type: String,
      default: "",
      trim: true,
    },
    isParentOnly: {
      type: Boolean,
      default: false,
    },
    icon: {
      type: String,
      default: "",
      trim: true,
    },
    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
    },
    role: {
      type: [String],
      required: true,
      validate: {
        validator: (value) => Array.isArray(value) && value.length > 0,
        message: "At least one role is required",
      },
    },
    order: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true },
);

const SidebarLink = mongoose.model("SidebarLink", sidebarLinkSchema);
module.exports = SidebarLink;
