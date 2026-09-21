'use strict';
const $ = (id) => document.getElementById(id);
const durations = {1: 330 * 60, 2: 300 * 60};
let selectedDay = 1;
let remaining = durations[selectedDay];
let deadline = null;
let started = false;
let lastPassed = 0;
let viewMode = 'complete';
const pad = (n) => String(n).padStart(2, '0');
const timeText = (seconds) => `${pad(Math.floor(seconds / 3600))}:${pad(Math.floor(seconds / 60) % 60)}:${pad(seconds % 60)}`;
function milestones(total) {
  const values = [];
  for (let seconds = total; seconds >= 1800; seconds -= 1800) values.push(seconds);
  values.push(900);
  return values;
}
function markLabel(seconds) {
  const minutes = seconds / 60;
  return minutes >= 60 ? `${Math.floor(minutes / 60)}h${minutes % 60 ? '30' : ''}` : `${minutes} <small>min</small>`;
}
function drawMarks() {
  const values = milestones(durations[selectedDay]);
  $('marks').innerHTML = values.map((value, index) => `<li class="mark${value <= 1800 ? ' last' : ''}" data-end="${values[index + 1] ?? 0}" aria-label="${markLabel(value).replace(/<[^>]+>/g, '')} restantes">${markLabel(value)}</li>`).join('');
}
function snapshot() { return {day: selectedDay, remainingSeconds: remaining, status: remaining === 0 ? 'finished' : deadline !== null ? 'running' : started ? 'paused' : 'ready'}; }
function render() {
  const running = deadline !== null;
  $('clock').textContent = timeText(remaining);
  $('status').textContent = remaining === 0 ? 'Prova encerrada' : running ? 'Simulado em andamento' : started ? 'Simulado pausado' : 'Aguardando início';
  $('toggle').innerHTML = remaining === 0 ? 'Simulado concluído' : running ? '<span aria-hidden="true">Ⅱ</span> Pausar simulado' : started ? '<span aria-hidden="true">▶</span> Continuar simulado' : '<span aria-hidden="true">▶</span> Iniciar simulado';
  $('toggle').disabled = remaining === 0;
  $('reset').hidden = !started;
  $('view-mode').disabled = started;
  $('board-finished').hidden = remaining !== 0;
  $('day-badge').textContent = `${selectedDay}º DIA`;
  $('start-help').textContent = started ? 'Mantenha esta página aberta durante o simulado.' : 'Tudo pronto? O tempo começa quando você iniciar.';
  document.body.classList.toggle('finished', remaining === 0);
  let currentFound = false;
  let passed = 0;
  for (const mark of $('marks').children) {
    const isPassed = remaining <= Number(mark.dataset.end);
    mark.classList.toggle('passed', isPassed);
    mark.classList.toggle('active', started && !isPassed && !currentFound);
    if (isPassed) passed++;
    if (!isPassed && !currentFound) {
      currentFound = true;
      if (started) $('next-mark').textContent = `Próxima marcação em ${timeText(remaining - Number(mark.dataset.end))}`;
    }
  }
  if (!started) $('next-mark').textContent = 'O quadro acompanha o seu simulado.';
  if (remaining === 0) $('next-mark').textContent = 'Tempo esgotado. Simulado concluído!';
  if (passed !== lastPassed) {
    $('announcement').textContent = remaining === 0 ? 'Tempo esgotado. A prova terminou.' : `Marcação atualizada. Tempo restante: ${Math.ceil(remaining / 60)} minutos.`;
    lastPassed = passed;
  }
}
function tick() {
  if (deadline !== null) {
    remaining = Math.max(0, Math.ceil((deadline - Date.now()) / 1000));
    if (remaining === 0) deadline = null;
    render();
  }
}
function selectDay(day) {
  if (started) throw new Error('Reinicie o simulado antes de trocar o dia.');
  if (day !== 1 && day !== 2) throw new Error('Escolha o dia 1 ou 2.');
  selectedDay = day; remaining = durations[day];
  $('exam-title').textContent = `Simulado · ${day}º dia`;
  $('exam-subjects').textContent = day === 1 ? 'Linguagens, Ciências Humanas e Redação' : 'Ciências da Natureza e Matemática';
  drawMarks(); render(); return snapshot();
}
function toggleTimer() {
  tick();
  if (remaining === 0) return snapshot();
  if (deadline !== null) deadline = null;
  else { deadline = Date.now() + remaining * 1000; started = true; }
  render(); return snapshot();
}
function resetTimer() {
  deadline = null; started = false; remaining = durations[selectedDay]; lastPassed = 0;
  $('announcement').textContent = 'Simulado reiniciado.'; render();
}
function showRoute() {
  const match = window.location.hash.match(/^#dia-([12])$/);
  const isExam = Boolean(match);
  if (isExam) {
    const day = Number(match[1]);
    if (day !== selectedDay) resetTimer();
    if (!started) selectDay(day);
  }
  $('home-screen').hidden = isExam;
  $('exam-screen').hidden = !isExam;
  document.title = isExam ? `Simulado · ${selectedDay}º dia — Quadro ENEM` : 'Quadro ENEM — seu tempo de prova';
  $(isExam ? 'exam-title' : 'welcome-title').focus();
  window.scrollTo(0, 0);
}
function requestHome(event) {
  event.preventDefault();
  if (started && remaining > 0) $('leave-dialog').showModal();
  else window.location.hash = 'inicio';
}
function setViewMode(mode) {
  if(started) throw new Error('Reinicie o simulado antes de trocar a visualização.');
  if(!['complete','authentic'].includes(mode)) throw new Error('Visualização inválida.');
  viewMode = mode;
  document.body.classList.toggle('authentic', mode === 'authentic');
}
document.querySelectorAll('input[name="view-mode"]').forEach(input => input.addEventListener('change', () => setViewMode(input.value)));
$('back-home').addEventListener('click', requestHome);
document.querySelector('.brand').addEventListener('click', requestHome);
$('cancel-leave').addEventListener('click', () => $('leave-dialog').close());
$('confirm-leave').addEventListener('click', () => { resetTimer(); $('leave-dialog').close(); window.location.hash = 'inicio'; });
window.addEventListener('hashchange', showRoute);
$('toggle').addEventListener('click', toggleTimer);
$('reset').addEventListener('click', () => $('reset-dialog').showModal());
$('cancel-reset').addEventListener('click', () => $('reset-dialog').close());
$('confirm-reset').addEventListener('click', () => { resetTimer(); $('reset-dialog').close(); $('toggle').focus(); });
document.addEventListener('visibilitychange', tick);
window.addEventListener('pageshow', tick);
drawMarks(); render(); showRoute(); setInterval(tick, 250);
if (document.modelContext?.registerTool) {
  const lifecycle = new AbortController();
  const tool = {name:'start_enem_simulation',title:'Iniciar simulado ENEM',description:'Escolhe o primeiro ou segundo dia e inicia o cronômetro. Falha se um simulado já foi iniciado.',inputSchema:{type:'object',properties:{day:{type:'integer',enum:[1,2]}},required:['day'],additionalProperties:false},annotations:{readOnlyHint:false,untrustedContentHint:false},execute(input){if (!input || Object.keys(input).some(key => key !== 'day')) throw new Error('Informe apenas day: 1 ou 2.');selectDay(input.day);window.location.hash = `dia-${input.day}`;showRoute();return toggleTimer();}};
  try { Promise.resolve(document.modelContext.registerTool(tool,{signal:lifecycle.signal})).catch(() => {}); } catch {}
  window.addEventListener('pagehide', (event) => {if (!event.persisted) lifecycle.abort();});
}
