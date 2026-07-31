import { Router } from 'express';
import { upload } from '../config/multer.js';
import { authAdmin } from '../middlewares/authAdmin.js';
import {
    loginAdmin,
    listarPresentesAdmin,
    listarFotosAdmin,
    excluirFotoAdmin,
    uploadFotoNoivo,
} from '../controllers/AdminController.js';

const router = Router();

router.post('/admin/login', loginAdmin);
router.get('/admin/gifts', authAdmin, listarPresentesAdmin);
router.get('/admin/photos', authAdmin, listarFotosAdmin);
router.delete('/admin/photos/:id', authAdmin, excluirFotoAdmin);
router.post('/admin/photos/upload', authAdmin, upload.single('foto'), uploadFotoNoivo);

export default router;