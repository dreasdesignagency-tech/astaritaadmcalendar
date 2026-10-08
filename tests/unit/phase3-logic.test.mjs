import test from "node:test";
import assert from "node:assert/strict";
import { windowState, formatTimeLeft, SERVICE_WINDOW_MS } from "../../src/lib/inbox/window.ts";
import { renderQuickReply, firstName } from "../../src/lib/inbox/templates.ts";
import { bucketReminders, reminderBucket, localInputToIso, isoToLocalInput } from "../../src/lib/inbox/reminders-logic.ts";
import { cardsOfStage, dropPosition, daysSince } from "../../src/lib/inbox/funnel-logic.ts";

const NOW = Date.parse("2026-10-08T15:00:00-03:00");

test("janela de 24h: aberta, fechando e fechada", () => {
  const within = new Date(NOW - 23 * 3600_000).toISOString();
  const w = windowState(within, NOW);
  assert.equal(w.open, true);
  assert.equal(Math.round(w.msLeft / 3600_000), 1);
  assert.equal(windowState(new Date(NOW - 24 * 3600_000).toISOString(), NOW).open, false); // exatamente 24h: fechada
  assert.equal(windowState(new Date(NOW - 25 * 3600_000).toISOString(), NOW).open, false);
  assert.equal(windowState(null, NOW).open, false); // nunca recebeu mensagem do cliente
  assert.equal(windowState("lixo", NOW).open, false);
  assert.equal(SERVICE_WINDOW_MS, 86_400_000);
});

test("formatTimeLeft", () => {
  assert.equal(formatTimeLeft(3 * 3600_000 + 20 * 60_000), "3 h 20 min");
  assert.equal(formatTimeLeft(12 * 60_000), "12 min");
  assert.equal(formatTimeLeft(10_000), "menos de 1 min");
});

test("respostas rápidas: {nome} usa o primeiro nome e some com graça quando não há nome", () => {
  assert.equal(firstName("Maria Souza"), "Maria");
  assert.equal(firstName("+5511999998888"), "");
  assert.equal(firstName("5511999998888"), "");
  assert.equal(renderQuickReply("Oi, {nome}! Tudo bem?", "Maria Souza"), "Oi, Maria! Tudo bem?");
  assert.equal(renderQuickReply("Oi, {nome}! Tudo bem?", "+5511999998888"), "Oi! Tudo bem?");
  assert.equal(renderQuickReply("Olá {nome}", null), "Olá");
  assert.equal(renderQuickReply("Sem variável", "Maria"), "Sem variável");
  assert.equal(renderQuickReply("{NOME}, bom dia", "ana lima"), "ana, bom dia");
});

test("lembretes: atrasado, hoje e próximos; ignora concluídos; ordena por data", () => {
  const mk = (id, iso, status = "pending") => ({ id, due_at: iso, status });
  const list = [
    mk("amanha", "2026-10-09T10:00:00-03:00"),
    mk("hoje-tarde", "2026-10-08T18:00:00-03:00"),
    mk("ontem", "2026-10-07T09:00:00-03:00"),
    mk("hoje-cedo-atrasado", "2026-10-08T09:00:00-03:00"),
    mk("feito", "2026-10-07T09:00:00-03:00", "done"),
    mk("cancelado", "2026-10-09T09:00:00-03:00", "cancelled"),
  ];
  const b = bucketReminders(list, NOW);
  assert.deepEqual(b.overdue.map((r) => r.id), ["ontem", "hoje-cedo-atrasado"]);
  assert.deepEqual(b.today.map((r) => r.id), ["hoje-tarde"]);
  assert.deepEqual(b.upcoming.map((r) => r.id), ["amanha"]);
  assert.equal(reminderBucket("2026-10-08T14:59:00-03:00", NOW), "overdue");
});

test("lembretes: conversão do campo datetime-local", () => {
  const iso = localInputToIso("2026-10-08T15:30");
  assert.ok(iso && iso.endsWith("Z"));
  assert.equal(isoToLocalInput(iso), "2026-10-08T15:30");
  assert.equal(localInputToIso("não é data"), null);
});

test("funil: ordem dentro da etapa e posição ao soltar", () => {
  const cards = [
    { id: "a", stage_id: "s1", position: 1 }, { id: "b", stage_id: "s1", position: 2 },
    { id: "c", stage_id: "s1", position: 3 }, { id: "x", stage_id: "s2", position: 5 },
  ];
  assert.deepEqual(cardsOfStage(cards, "s1").map((c) => c.id), ["a", "b", "c"]);
  const col = cardsOfStage(cards, "s1");
  assert.equal(dropPosition([], 0), 1); // coluna vazia
  assert.equal(dropPosition(col, 0), 0); // antes do primeiro
  assert.equal(dropPosition(col, 1), 1.5); // entre a e b
  assert.equal(dropPosition(col, 3), 4); // depois do último
  assert.equal(dropPosition(col, 99), 4); // índice absurdo vira o fim
  assert.equal(dropPosition(col, -5), 0);
});

test("funil: dias desde a última interação", () => {
  assert.equal(daysSince("2026-10-05T15:00:00-03:00", NOW), 3);
  assert.equal(daysSince(null, NOW), null);
  assert.equal(daysSince("x", NOW), null);
});
