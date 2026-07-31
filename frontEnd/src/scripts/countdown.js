import { $, $$ } from './utils.js';
// Data do casamento para contagem regressiva

const weddingDate = new Date('2027-01-09T18:00:00');

// Função para atualizar a contagem regressiva
function initCountdown() {
    updateCountdown(); // Atualiza imediatamente
    setInterval(updateCountdown, 1000);
}

function updateCountdown() {
    const now = new Date().getTime();
    const distance = weddingDate - now;

    const msg = $('#msg_id_contagem');
    const msg2 = $('#msg_id_contagem2');

    const startDay = new Date(weddingDate);
    startDay.setHours(0, 0, 0, 0);

    const endDay = new Date(weddingDate);
    endDay.setHours(23, 59, 59, 999);

    if (now >= startDay && now <= endDay) {
        msg.textContent = "Hoje é o grande dia! 🎉";
        msg2.textContent = "Estamos muito felizes em compartilhar este momento com você!";
    } else if (distance > 0) {
        msg.textContent = "Faltam apenas";
        msg2.textContent = "para o nosso casamento!";
    } else {
        msg.textContent = "Fazem";
        msg2.textContent = "que nos casamos!";
    }

    const absDistance = Math.abs(distance);

    const days = Math.floor(absDistance / (1000 * 60 * 60 * 24));
    const hours = Math.floor((absDistance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((absDistance % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((absDistance % (1000 * 60)) / 1000);

    document.getElementById('cdDays').textContent = days;
    document.getElementById('cdHours').textContent = hours;
    document.getElementById('cdMinutes').textContent = minutes;
    document.getElementById('cdSeconds').textContent = seconds;

}
export { initCountdown };