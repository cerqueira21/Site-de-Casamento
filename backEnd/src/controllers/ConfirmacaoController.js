export function confirmacaoPresenca(req, res) {
    console.log(req.body);
    res.status(200).json({ message: "Confirmação recebida com sucesso!" });
}