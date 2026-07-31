import { Router } from 'express';
import { criarPreferencia, 
        criarPagamentoPixController, 
        consultarStatusPagamento, 
        webhook, listarDisponibilidade } from '../controllers/PaymentController.js';

const router = Router();

router.post('/pagamentos/criar-preferencia', criarPreferencia);
router.post('/pagamentos/webhook', webhook);
router.post('/pagamentos/criar-pix', criarPagamentoPixController);
router.get('/pagamentos/status/:id', consultarStatusPagamento);
router.get('/gifts/disponibilidade', listarDisponibilidade);

export default router;