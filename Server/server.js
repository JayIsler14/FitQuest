import express from "express";
import cors from "cors";

const app = express();

const corsOptions = {
    origin: ["http://localhost:5173"]
}

app.use(cors(corsOptions));
app.use(express.json());

app.get("/", (req, res) => {
    req.json({ message: "Backend is running" });
});

app.listen(8080, () => {
    console.log("Server started on port 8080");
});
