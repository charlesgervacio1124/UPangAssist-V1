const express = require("express");
const mongoose = require("mongoose");
const taskRoutes = require("./routes/taskRoutes");

const app = express();
app.use(express.json());

mongoose
  .connect(process.env.MONGODB_URI || "mongodb+srv://nionnatividadup_db_user:wjScL5MGgAauz42N@cluster0.hdsyjq5.mongodb.net/")
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.error("MongoDB connection error:", err.message));

app.use("/api/tasks", taskRoutes);

app.listen(3000, () => {
  console.log("Server running on http://localhost:3000");
});