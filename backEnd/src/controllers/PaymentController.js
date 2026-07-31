import { Payment } from 'mercadopago';
import { mpClient } from '../config/mercadopago.js';
import { supabase } from '../config/supabase.js';
import { checkGiftAvailability } from '../services/GiftsService.js';
import { criarCheckout, criarPagamentoPix} from '../services/MercadoPagoService.js';
import { getAllGiftsAvailability } from '../services/GiftsService.js';


export async function criarPreferencia(req, res) {
    try {
        const { giftIds, guestName, guestMessage } = req.body;

        if (!Array.isArray(giftIds) || giftIds.length === 0) {
            return res.status(400).json({ error: 'Nenhum presente selecionado.' });
        }

        const checagens = await Promise.all(
            giftIds.map(id => checkGiftAvailability(id))
        );

        const indisponivel = checagens.find(c => !c.gift || !c.available);
        if (indisponivel) {
            return res.status(400).json({
                error: `O presente "${indisponivel.gift?.id ?? 'desconhecido'}" não está mais disponível.`
            });
        }

        const presentes = checagens.map(c => ({ id: c.gift.id, nome: c.gift.id, valor: c.gift.price }));
        const amountTotal = presentes.reduce((soma, p) => soma + p.valor, 0);

        const { data: paymentRecord, error: insertError } = await supabase
            .from('gift_payments')
            .insert({
                gift_id: giftIds,
                amount: amountTotal,
                status: 'pending',
                guest_name: guestName || null,
                guest_message: guestMessage || null,
            })
            .select()
            .single();

        if (insertError) throw insertError;

        const initPoint = await criarCheckout(presentes, paymentRecord.id);

        return res.json({ init_point: initPoint });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: 'Erro ao criar pagamento.' });
    }
}


export async function criarPagamentoPixController(req, res) {
    try {
        const { giftIds, guestName, guestMessage } = req.body;

        if (!Array.isArray(giftIds) || giftIds.length === 0) {
            return res.status(400).json({ error: 'Nenhum presente selecionado.' });
        }

        const checagens = await Promise.all(
            giftIds.map(id => checkGiftAvailability(id))
        );

        const indisponivel = checagens.find(c => !c.gift || !c.available);
        if (indisponivel) {
            return res.status(400).json({
                error: `O presente "${indisponivel.gift?.id ?? 'desconhecido'}" não está mais disponível.`
            });
        }

        const presentes = checagens.map(c => ({ id: c.gift.id, nome: c.gift.id, valor: c.gift.price }));
        const amountTotal = presentes.reduce((soma, p) => soma + p.valor, 0);

        const { data: paymentRecord, error: insertError } = await supabase
            .from('gift_payments')
            .insert({
                gift_id: giftIds,
                amount: amountTotal,
                status: 'pending',
                guest_name: guestName || null,
                guest_message: guestMessage || null,
            })
            .select()
            .single();

        if (insertError) throw insertError;

        const pix = await criarPagamentoPix(presentes, paymentRecord.id);

        // Guarda o payment_id do Mercado Pago, útil pra debugar depois
        await supabase
            .from('gift_payments')
            .update({ mp_payment_id: pix.payment_id })
            .eq('id', paymentRecord.id);

        return res.json({
            paymentRecordId: paymentRecord.id,
            qr_code_base64: pix.qr_code_base64,
            qr_code: pix.qr_code,
        });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: 'Erro ao gerar pagamento Pix.' });
    }
}


export async function consultarStatusPagamento(req, res) {
    try {
        const { id } = req.params;

        const { data, error } = await supabase
            .from('gift_payments')
            .select('status')
            .eq('id', id)
            .single();

        if (error || !data) {
            return res.status(404).json({ error: 'Pagamento não encontrado.' });
        }

        return res.json({ status: data.status });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: 'Erro ao consultar status.' });
    }
}


export async function webhook(req, res){
    try{
        const { type, data} = req.body;
        
        if(type !== 'payment'){
            return res.sendStatus(200);
        }

        const payment = new Payment(mpClient);
        const paymentInfo = await payment.get({id: data.id});

        const paymentRecordId = paymentInfo.external_reference;
        const status = paymentInfo.status;

        const { data:paymentRecord } = await supabase
        .from('gift_payments')
        .select('*')
        .eq('id', paymentRecordId)
        .single();

        if (!paymentRecord || paymentRecord.status === 'approved'){
            return res.sendStatus(200);
        }

        await supabase
            .from('gift_payments')
            .update({status, mp_payment_id: paymentInfo.id })
            .eq ('id', paymentRecordId);

        return res.sendStatus(200);
    } catch(error){
        console.error(error);
        return res.sendStatus(500);
    }
}

export async function listarDisponibilidade(req, res) {
    try {
        const disponibilidade = await getAllGiftsAvailability();
        return res.json(disponibilidade);
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: 'Erro ao consultar disponibilidade.' });
    }
}