import express from "express";
import cors from "cors";
import routes from "./routes";
import db from "./db";

db.connect();

const app = express();
const port = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());
app.use("/", routes);

app.listen(port, () => console.log(`Server running on port ${port}`));
