import { supabase } from '../config/supabase.js';
import { getGiftFromCatalog } from '../data/giftsCatalog.js';
import { gifts_catalog } from '../data/giftsCatalog.js';

async function countApprovedPayments(giftId){
    const { count, error } = await supabase
        .from('gift_payments')
        .select('*', {count: 'exact', head:true})
        .contains('gift_id', [giftId])
        .eq('status', 'approved');

    if (error) throw error;
    return count;
}

export async function checkGiftAvailability(giftId){
    const gift = getGiftFromCatalog(giftId);
    if (!gift) return {available: false, gift:null};

    const timesGiven = await countApprovedPayments(giftId);

    let available;
    if (!gift.repeatable){
        available = timesGiven < 1;
    } else if(gift.stock === null || gift.stock === undefined){
        available = true;
    } else{
        available = timesGiven < gift.stock;
    }

    return { available, gift, timesGiven};
}

export async function getAllGiftsAvailability() {
    const {data, error} = await supabase
    .from('gift_payments')
    .select('gift_id')
    .eq('status', 'approved');

    if(error) throw error;

    const contagem = {};
    data.forEach(row =>{
        row.gift_id.forEach(id => {
            contagem[id] = (contagem[id] || 0)+1;
        });
    });

    const resultado = {};
    gifts_catalog.forEach(gift => {
        const timesGiven = contagem[gift.id] || 0;

        let available;

        if(!gift.repeatable){
            available = timesGiven<1;
        } else if (gift.stock === null || gift.stock === undefined){
            available = true;
        } else {
            available = timesGiven < gift.stock;
        }

        resultado[gift.id] = { available, timesGiven };
    });
    return resultado;
}