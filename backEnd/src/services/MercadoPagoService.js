import { MercadoPagoConfig, Preference } from "mercadopago";
import { Payment } from "mercadopago";
import { title } from "node:process";

const client = new MercadoPagoConfig({
    accessToken: process.env.MP_ACCESS_TOKEN
});

export async function criarPagamentoPix(presentes, paymentRecordId) {
    const payment = new Payment(client);

    const amountTotal = presentes.reduce((soma, p) => soma + p.valor, 0);
    const descricao = presentes.map(p => p.nome).join(', ');

    const emailFicticio = `convidado.${Date.now()}@CasamentoLiandra.com`;

    const response = await payment.create({
        body: {
            transaction_amount: Number(amountTotal),
            description: descricao,
            payment_method_id: 'pix',
            external_reference: paymentRecordId,
            notification_url: `${process.env.BACKEND_URL}/pagamentos/webhook`,
            payer: {
                email: emailFicticio,
            },
        }
    });

    return {
        qr_code_base64: response.point_of_interaction.transaction_data.qr_code_base64,
        qr_code: response.point_of_interaction.transaction_data.qr_code,
        payment_id: response.id,
    };
}

export async function criarCheckout(presentes, paymentRecordId) {
    const preference = new Preference(client);

    const items = presentes.map(presente => ({
        id: String(presente.id),
        title: presente.nome,
        quantity: 1,
        unit_price: Number(presente.valor),
        currency_id: "BRL"
    }))

    const response = await preference.create({
        body: {
            items,
            external_reference: paymentRecordId,
            notification_url: `${process.env.BACKEND_URL}/pagamentos/webhook`,
            back_urls: {
                success: "http://192.168.15.4:5500/frontEnd/src/screens/obrigado.html?status=success",
                failure: "http://192.168.15.4:5500/frontEnd/src/screens/obrigado.html?status=failure",
                pending: "http://192.168.15.4:5500/frontEnd/src/screens/obrigado.html?status=pending"
            },
        }
    });

    return response.init_point;
}