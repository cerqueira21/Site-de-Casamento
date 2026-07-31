import { uploadFotoParaStorage, salvarFotoNoBanco, listarFotos } from '../services/PhotoService.js';

export async function uploadFotoConvidado(req, res) {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'Nenhuma imagem enviada.' });
        }

        const { guestName } = req.body;

        const url = await uploadFotoParaStorage(req.file, 'convidados');
        const foto = await salvarFotoNoBanco({ url, uploadedBy: 'convidado', guestName });

        return res.status(201).json(foto);
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: 'Erro ao enviar foto.' });
    }
}

export async function listarFotosController(req, res) {
    try {
        const { tipo } = req.query; // 'noivo', 'convidado', ou vazio (todas)
        const fotos = await listarFotos(tipo);
        return res.json(fotos);
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: 'Erro ao listar fotos.' });
    }
}