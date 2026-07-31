import express from "express";
import cors from "cors";
import UsuarioRoutes from "./routes/UsuarioRoutes.js";
import PaymentRoutes from "./routes/PaymentRoutes.js"
import PhotoRoutes from "./routes/PhotoRoutes.js"
import AdminRoutes from './routes/AdminRoutes.js'

const app = express();

app.use(cors());

app.use(express.json());

app.use("/usuarios", UsuarioRoutes);
app.use(PaymentRoutes);
app.use(PhotoRoutes);
app.use(AdminRoutes)

export default app;