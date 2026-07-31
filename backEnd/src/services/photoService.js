import { supabase } from '../config/supabase.js';

export async function uploadFotoParaStorage(file, pasta) {
    const nomeArquivo = `${pasta}/${Date.now()}-${Math.random().toString(36).slice(2)}.${file.mimetype.split('/')[1]}`;

    const { error } = await supabase.storage
        .from('wedding-photos')
        .upload(nomeArquivo, file.buffer, {
            contentType: file.mimetype,
        });

    if (error) throw error;

    const { data: publicUrlData } = supabase.storage
        .from('wedding-photos')
        .getPublicUrl(nomeArquivo);

    return publicUrlData.publicUrl;
}

export async function salvarFotoNoBanco({ url, uploadedBy, guestName }) {
    const { data, error } = await supabase
        .from('photos')
        .insert({ url, uploaded_by: uploadedBy, guest_name: guestName || null })
        .select()
        .single();

    if (error) throw error;
    return data;
}

export async function listarFotos(uploadedBy) {
    let query = supabase
        .from('photos')
        .select('*')
        .order('created_at', { ascending: false });

    if (uploadedBy) {
        query = query.eq('uploaded_by', uploadedBy);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data;
}