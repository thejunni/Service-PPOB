import express from "express";
import userRoutes from "./routes/userRoute";
import productRoutes from "./routes/productRoute";
import transactionRoutes from "./routes/transactionRoute";
import digiflazzRoutes from "./routes/digiflazzRoute";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import { digiflazzWebhook } from "./controllers/digiflazzWebhookController";

const app = express();
const PORT = process.env.PORT || 5000;

app.use(express.json());
app.use(cookieParser())

app.use("/users", userRoutes);
app.use("/products", productRoutes);
app.use("/transactions", transactionRoutes);
app.post("digiflazz", digiflazzRoutes);
app.post("/api/digiflazz/webhook", digiflazzWebhook);


app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});

dotenv.config();
