import jwt from 'jsonwebtoken';
import { supabase } from '../config/supabase.js';
import { uploadFotoParaStorage, salvarFotoNoBanco } from '../services/PhotoService.js';

export function loginAdmin(req, res) {
    const { password } = req.body;

    if (password !== process.env.ADMIN_PASSWORD) {
        return res.status(401).json({ error: 'Senha incorreta.' });
    }

    const token = jwt.sign({ role: 'admin' }, process.env.JWT_SECRET, { expiresIn: '7d' });
    return res.json({ token });
}

export async function listarPresentesAdmin(req, res) {
    try {
        const { data, error } = await supabase
            .from('gift_payments')
            .select('*')
            .eq('status', 'approved')
            .order('created_at', { ascending: false });

        if (error) throw error;
        return res.json(data);
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: 'Erro ao listar presentes.' });
    }
}

export async function listarFotosAdmin(req, res) {
    try {
        const { tipo } = req.query;

        let query = supabase
            .from('photos')
            .select('*')
            .order('created_at', { ascending: false });

        if (tipo && tipo !== 'all') {
            query = query.eq('uploaded_by', tipo);
        }

        const { data, error } = await query;
        if (error) throw error;
        return res.json(data);
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: 'Erro ao listar fotos.' });
    }
}

export async function excluirFotoAdmin(req, res) {
    try {
        const { id } = req.params;

        const { data: foto, error: fetchError } = await supabase
            .from('photos')
            .select('url')
            .eq('id', id)
            .single();

        if (fetchError || !foto) {
            return res.status(404).json({ error: 'Foto não encontrada.' });
        }

        // Extrai o caminho do arquivo dentro do bucket a partir da URL pública
        const caminhoArquivo = foto.url.split('/wedding-photos/')[1];

        await supabase.storage.from('wedding-photos').remove([caminhoArquivo]);

        const { error: deleteError } = await supabase
            .from('photos')
            .delete()
            .eq('id', id);

        if (deleteError) throw deleteError;

        return res.json({ success: true });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: 'Erro ao excluir foto.' });
    }
}

export async function uploadFotoNoivo(req, res) {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'Nenhuma imagem enviada.' });
        }

        const url = await uploadFotoParaStorage(req.file, 'noivos');
        const foto = await salvarFotoNoBanco({ url, uploadedBy: 'noivo', guestName: null });

        return res.status(201).json(foto);
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: 'Erro ao enviar foto.' });
    }
}