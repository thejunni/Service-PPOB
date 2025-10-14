import express from "express";
import userRoutes from "./routes/userRoute";
import productRoutes from "./routes/productRoute";
import transactionRoutes from "./routes/transactionRoute";
import digiflazzRoutes from "./routes/digiflazzRoute";
import reportRoute from "./routes/reportRoute";
import authRoutes from "./routes/authRoute";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import { digiflazzWebhook } from "./controllers/digiflazzWebhookController";
import { setupSwagger } from "./swagger";

const app = express();
const PORT = process.env.PORT || 5000;

app.use(express.json());
app.use(cookieParser());
// Swagger docs
setupSwagger(app);

app.use("/users", userRoutes);
app.use("/auth", authRoutes);
app.use("/products", productRoutes);
app.use("/transactions", transactionRoutes);
app.post("/digiflazz", digiflazzRoutes);
app.post("/api/digiflazz/webhook", digiflazzWebhook);
app.use("/reports", reportRoute);

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📖 Swagger docs: http://localhost:${PORT}/docs`);
});

dotenv.config();
