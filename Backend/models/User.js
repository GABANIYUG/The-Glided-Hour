import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  address: { type: String },
  avatar: { type: String, default: "" },
  orders: [
    {
      product: String,
      price: Number,
      date: { type: Date, default: Date.now }
    }
  ]
});

export default mongoose.model("User", userSchema);