// Os fixtures do webhook têm horários fixos (outubro/2026). A janela de 24 h do WhatsApp depende do relógio,
// então os testes deslocam todos os horários para que o mais recente seja "agora" (ordem entre eles preservada).
const NEWEST = 1791500900;
const DELTA = Math.floor(Date.now() / 1000) - NEWEST - 60;
export const shiftTs = (s) => s.replace(/\b17915\d{5}\b/g, (m) => String(Number(m) + DELTA));
