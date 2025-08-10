// ======= Memory Game with CSV Logging (Offline) =======
let studentId = '';
let cards = [];
let flippedCards = [];
let matchedPairs = 0;
let moves = 0;
let LOGS = []; // rows for CSV

const statusEl = document.getElementById('status');
const uidPill = document.getElementById('uid-pill');
const movesEl = document.getElementById('moves');
const bar = document.getElementById('bar');
const start = document.getElementById('start');
const boardWrap = document.getElementById('board-wrap');
const beginBtn = document.getElementById('begin');
const idInput = document.getElementById('studentId');
const summary = document.getElementById('summary');
const end = document.getElementById('end');
const restartBtn = document.getElementById('restart');
const playAgainBtn = document.getElementById('playAgain');
const downloadBtn = document.getElementById('downloadBtn');

function nowISO(){ return new Date().toISOString(); }

function resetState(){
  flippedCards = [];
  matchedPairs = 0;
  moves = 0;
  LOGS = [];
  statusEl.textContent = 'Find all pairs';
  movesEl.textContent = 'Moves: 0';
  bar.style.width = '0%';
}

function downloadCSV(){
  if(!LOGS.length){ alert('No activity to download yet.'); return; }
  const headers = ['student_id','move_index','card1_id','card1_value','card2_id','card2_value','match','timestamp_iso'];
  const esc = (v) => '"' + String(v==null?'':v).replaceAll('"','""') + '"';
  const lines = [headers.join(',')].concat(
    LOGS.map(r => headers.map(h => esc(r[h])).join(','))
  );
  const blob = new Blob(["\uFEFF" + lines.join('\n')], {type:'text/csv;charset=utf-8;'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = `memory_log_${studentId || 'anon'}_${new Date().toISOString().slice(0,19).replace(/[:T]/g,'-')}.csv`;
  document.body.appendChild(a); a.click(); a.remove();
  URL.revokeObjectURL(url);
}

function handleResolve(){
  const [c1, c2] = flippedCards;
  const v1 = c1.getAttribute('data-match');
  const v2 = c2.getAttribute('data-match');
  const isMatch = v1 === v2;
  moves++;
  movesEl.textContent = `Moves: ${moves}`;

  // log one row per resolved pair
  LOGS.push({
    student_id: studentId,
    move_index: moves,
    card1_id: c1.id,
    card1_value: c1.getAttribute('data-image'),
    card2_id: c2.id,
    card2_value: c2.getAttribute('data-image'),
    match: isMatch ? 'TRUE' : 'FALSE',
    timestamp_iso: nowISO()
  });

  if(isMatch){
    c1.classList.add('matched'); c2.classList.add('matched');
    matchedPairs++;
    const progress = (matchedPairs/8)*100; // 8 pairs in 4×4
    bar.style.width = progress + '%';
    flippedCards = [];
    if(matchedPairs === 8){
      finishGame();
    }
  } else {
    setTimeout(() => {
      [c1,c2].forEach(card => {
        card.classList.remove('flipped');
        card.style.backgroundImage = "url('images/back.png')";
      });
      flippedCards = [];
    }, 800);
  }
}

function onCardClick(card){
  if(!boardWrap || boardWrap.style.display === 'none') return; // not started
  if(card.classList.contains('matched')) return;
  if(card.classList.contains('flipped')) return;
  if(flippedCards.length === 2) return;

  card.classList.add('flipped');
  const img = card.getAttribute('data-image');
  card.style.backgroundImage = `url('images/${img}')`;
  flippedCards.push(card);

  if(flippedCards.length === 2){
    setTimeout(handleResolve, 550);
  }
}

function wireCards(){
  cards = Array.from(document.querySelectorAll('.card'));
  cards.forEach(card => {
    card.classList.remove('flipped','matched');
    card.style.backgroundImage = "url('images/back.png')";
    card.addEventListener('click', () => onCardClick(card));
  });
}

function finishGame(){
  statusEl.textContent = 'Finished';
  boardWrap.style.display = 'none';
  end.style.display = 'block';
  summary.textContent = `You finished in ${moves} moves.`;
  // auto-download CSV
  downloadCSV();
}

// UI buttons
beginBtn.addEventListener('click', () => {
  const id = idInput.value.trim();
  if(!id){ idInput.focus(); idInput.placeholder = 'Student ID required'; return; }
  studentId = id; uidPill.textContent = `ID: ${studentId}`;
  start.style.display = 'none';
  boardWrap.style.display = 'block';
  statusEl.textContent = 'Find all pairs';
});

restartBtn.addEventListener('click', () => {
  resetState();
  wireCards();
});

playAgainBtn.addEventListener('click', () => {
  end.style.display = 'none';
  boardWrap.style.display = 'block';
  resetState();
  wireCards();
});

downloadBtn.addEventListener('click', downloadCSV);

// boot
resetState();
wireCards();