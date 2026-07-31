import { Router } from 'express';
import { upload } from '../config/multer.js';
import { uploadFotoConvidado, listarFotosController } from '../controllers/PhotoController.js';

const router = Router();

router.post('/fotos/upload', upload.single('foto'), uploadFotoConvidado);
router.get('/fotos', listarFotosController);

export default router;