const mongoose = require("mongoose");
const Owner = require("../../models/travel/carOwner");

exports.addOwner = async (req, res) => {
  try {
    const { mobile, ...data } = req.body;

    const imagePromise = req.files
      ?.filter((file) => file.fieldname === "images")
      .map((file) => file.location);
    const dlImagePromise = req.files
      ?.filter((file) => file.fieldname === "dlImage")
      .map((file) => file.location);

    const existingOwnerPromise = Owner.findOne({ mobile });

    const [images, dlImage, existingOwner] = await Promise.all([
      imagePromise,
      dlImagePromise,
      existingOwnerPromise,
    ]);

    if (existingOwner) {
      return res.status(400).json({ error: "Mobile number already exists." });
    }

    await Owner.create({ ...data, images, dlImage, mobile });
    return res.status(201).json("Successfully Created");
  } catch (error) {
    console.error(error);
    return res.status(500).json("We are working hard to fix this");
  }
};

exports.getOwner = async (_, res) => {
  try {
    const findData = await Owner.find();
    return res.status(200).json(findData);
  } catch (error) {
    return res.status(500).json("We are working hard to fix this");
  }
};

exports.getOwnerById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: "Invalid owner ID" });
    }

    const findData = await Owner.findById(id);
    if (!findData) {
      return res.status(404).json({ error: "Owner not found" });
    }
    return res.status(200).json(findData);
  } catch (error) {
    console.error("Error in getOwnerById:", error);
    return res.status(500).json("We are working hard to fix this");
  }
};

exports.getOwnerByEmail = async (req, res) => {
  try {
    const email = req.query?.email || req.body?.email;
    if (!email) {
      return res.status(400).json({ error: "Email is required" });
    }

    const escapedEmail = email.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const owner = await Owner.find({
      email: { $regex: `^${escapedEmail}$`, $options: 'i' }
    });
    return res.status(200).json(owner);
  } catch (error) {
    console.error("Error in getOwnerByEmail:", error);
    return res.status(500).json({ error: "Internal server error. We're working to fix this." });
  }
};

exports.filterOwners = async (req, res) => {
  try {
    const { mobile, email } = req.query;
    const { mobile: mobileBody, email: emailBody, ownerId } = req.body || {};
    const finalMobile = mobile || mobileBody;
    const finalEmail = email || emailBody;
    const filter = {};

    if (ownerId) {
      if (!mongoose.isValidObjectId(ownerId)) {
        return res.status(400).json({ error: "Invalid ownerId" });
      }
      filter._id = ownerId;
    }

    if (finalMobile) {
      const escapedMobile = finalMobile.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      filter.mobile = { $regex: escapedMobile, $options: "i" };
    }

    if (finalEmail) {
      const escapedEmail = finalEmail.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      filter.email = { $regex: `^${escapedEmail}$`, $options: "i" };
    }

    if (Object.keys(filter).length === 0) {
      return res.status(400).json({ error: "Provide at least one filter: mobile, email, or ownerId" });
    }

    const owners = await Owner.find(filter);
    return res.status(200).json(owners);
  } catch (error) {
    console.error("Error in filterOwners:", error);
    return res.status(500).json({ error: "Internal server error. We're working to fix this." });
  }
};

exports.updateOwner = async (req, res) => {
  const { id } = req.params;
  const { ...data } = req.body;

  try {
    const imagesPromise = req.files
      ?.filter((file) => file.fieldname === "images")
      .map((file) => file.location);
    const dlImagePromise = req.files
      ?.filter((file) => file.fieldname === "dlImage")
      .map((file) => file.location);
    const findImagePromise = Owner.findById(id);
    const [images, dlImage, findImage] = await Promise.all([
      imagesPromise,
      dlImagePromise,
      findImagePromise,
    ]);
    if (!findImage) {
      return res.status(404).json({ error: "Owner not found" });
    }
    data.images = images?.length > 0 ? images : findImage.images;
    if (dlImage?.length > 0) {
      data.dlImage = dlImage;
    } else if (!dlImage && findImage.dlImage) {
      data.dlImage = findImage.dlImage;
    }
    const updatedOwner = await Owner.findByIdAndUpdate(id, data, { new: true });
    return res
      .status(200)
      .json({ message: "Successfully Updated", updatedOwner });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "We are working hard to fix this" });
  }
};

exports.deleteOwner = async (req, res) => {
  try {
    const { id } = req.params;
    await Owner.findByIdAndDelete(id);
    return res.status(200).json({ message: "Successfully Deleted" });
  } catch (error) {
    return res.status(500).json("We are working hard to fix this");
  }
};
