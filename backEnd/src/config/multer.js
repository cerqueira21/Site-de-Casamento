import multer from 'multer';

const storage = multer.memoryStorage();

export const upload = multer({
    storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB, igual ao seu HTML já avisa
    fileFilter: (req, file, cb) => {
        const tiposPermitidos = ['image/jpeg', 'image/png', 'image/webp'];
        if (tiposPermitidos.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Tipo de arquivo não permitido.'));
        }
    },
});