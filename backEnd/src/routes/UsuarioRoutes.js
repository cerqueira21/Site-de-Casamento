import { Router } from "express";
import { confirmacaoPresenca } from '../controllers/ConfirmacaoController.js';


const router = Router();

router.post("/confirmacao", confirmacaoPresenca);

export default router;