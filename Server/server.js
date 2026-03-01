import express from "express";
import cors from "cors";
import dotnev from "dotnev";

const app = express();

const dotnev = require("dotnev").config();
const { Pool } = require("pg");

const corsOptions = {
    origin: ["http://localhost:5173"]
}

app.use(cors(corsOptions));
app.use(express.json());

const { PGHOST, PGDATABASE, PGUSER, PGPASSWORD } = process.env;

const pool = new Pool({
    host: PGHOST,
    database: PGDATABASE,
    username: PGUSER,
    password: PGPASSWORD,
    port: 5432,
    ssl: {
        require: true,
    }
})

app.get("/", async (req, res) => {

    const client = await pool.connect();

    try {

        const result = await client.query("") 

        res.json("");

    } catch (errors) {

        console.log(errors)
    } finally {
        client.release();
    }

    res.status(404);
    
    req.json({ message: "Backend is running" });
});

app.listen(8080, () => {
    console.log("Server started on port 8080");
});





