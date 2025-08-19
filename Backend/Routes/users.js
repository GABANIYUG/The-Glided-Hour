import express from "express";
import User from "../models/User.js";
import multer from "multer";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const router = express.Router();

// 🔹 Register
router.post("/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const hashedPass = await bcrypt.hash(password, 10);
    const user = new User({ name, email, password: hashedPass });
    await user.save();
    res.json({ message: "User registered successfully" });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// 🔹 Login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ error: "User not found" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ error: "Invalid password" });

    const token = jwt.sign({ id: user._id }, "jwtsecret", { expiresIn: "1d" });
    res.json({ token, user });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Update user profile (name/email)
router.put("/:id", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    let updateData = { name, email };

    // If password is provided, hash it
    if (password) {
      const hashedPass = await bcrypt.hash(password, 10);
      updateData.password = hashedPass;
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    );

    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json(updatedUser);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Change password
router.put("/change-password/:id", async (req, res) => {
  try {
    const { password } = req.body;
    const hashedPass = await bcrypt.hash(password, 10);
    await User.findByIdAndUpdate(req.params.id, { password: hashedPass });
    res.json({ message: "Password updated successfully" });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// 🔹 Get user profile
router.get("/profile/:id", async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select("-password");
    if(!user) return res.status(404).json({ message: "User not found" });
    res.json(user);
  } catch (error) {
    console.error(err);
    res.status(500).json({ error: error.message });
  }
});

// Multer setup
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) => cb(null, Date.now() + "-" + file.originalname),
});
const upload = multer({ storage });

// Upload avatar
router.post("/upload-avatar/:userId", upload.single("avatar"), async (req, res) => {
  try {
    const userId = req.params.userId;
    if (!req.file) return res.status(400).json({ message: "No file uploaded" });

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { avatar: `/uploads/${req.file.filename}` },
      { new: true }
    );

    res.json({ message: "Profile picture updated", avatar: updatedUser.avatar });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;