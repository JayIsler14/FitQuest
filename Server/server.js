const express = require("express");
const cors = require("cors");
require("dotenv").config();
const cookieParser = require("cookie-parser");

const app = express();

// Middleware
app.use(cors({
  origin: ["http://localhost:5173", "http://localhost:3000"],
  credentials: true
}));

app.use(express.json());
app.use(cookieParser());

// Routes
app.use("/api/auth", require("./routes/auth"));
app.use("/api/onboarding", require("./routes/onboarding"));
app.use("/api/plans", require("./routes/plans"));
app.use("/api/workouts", require("./routes/workouts"));
app.use("/api/meals", require("./routes/meals"));
app.use("/api/social", require("./routes/social"));
app.use("/api/health", require("./routes/health"));
app.use("/api/userHealth", require("./routes/userHealth"));
app.use('/api/workouts', require('./routes/workouts'));

// Server
const PORT = process.env.PORT || 8080;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});