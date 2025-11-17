(() => {
  // ---- Estado ----
  let allQuestions = [];
  let triviaData = [];
  let currentIndex = 0;
  let score = 0;

  // ---- Elementos ----
  const $ = (sel) => document.querySelector(sel);
  const menu = $('#menu');
  const categoryMenu = $('#categoryMenu');
  const categoriesDiv = $('#categories');
  const triviaContainer = $('#triviaContainer');
  const triviaDiv = $('#trivia');
  const nextBtn = $('#nextBtn');
  const backToMenuFromTrivia = $('#backToMenuFromTrivia');
  const feedbackEl = $('#feedback');
  const soundToggle = $('#soundToggle');
  const progressBar = $('#progressBar');
  const questionCountEl = document.querySelector('#questionCount');

  function getSelectedCount() {
    const raw = parseInt(questionCountEl?.value ?? '0', 10);
    // 0 o inválido => “Todas”
    if (!Number.isFinite(raw) || raw <= 0) return allQuestions.length;
    return Math.min(raw, allQuestions.length);
  }

  // Sonido
  let soundOn = JSON.parse(localStorage.getItem('trivia:soundOn') ?? 'true'); // por defecto: activado
  let audioCtx = null;
  

  // Controles del menú principal
  const randomBtn = $('#randomBtn');
  const categoryBtn = $('#categoryBtn');
  const backToMenuBtn = $('#backToMenuBtn');

  const scoreEl = $('#score');
  const progressEl = $('#progress');

  // ---- Helpers de visibilidad ----
  const show  = (el) => el.classList.remove('hidden');
  const hide  = (el) => el.classList.add('hidden');

  function setView({ showMenu = false, showCategory = false, showTrivia = false }) {
    [menu, categoryMenu, triviaContainer].forEach(hide);
    if (showMenu)     show(menu);
    if (showCategory) show(categoryMenu);
    if (showTrivia)   show(triviaContainer);
  }

  function updateHUD() {
    scoreEl.textContent = `Puntuación: ${score}`;
    progressEl.textContent = triviaData.length
      ? `Pregunta ${Math.min(currentIndex + 1, triviaData.length)} de ${triviaData.length}`
      : '';

    // ⬇️ Progreso visual
    if (progressBar) {
      const total = triviaData.length || 1;
      const current = triviaData.length ? Math.min(currentIndex + 1, triviaData.length) : 0;
      progressBar.max = total;
      progressBar.value = current;
    }
  }


  function resetGame() {
    currentIndex = 0;
    score = 0;
    updateHUD();
    hide(nextBtn);
    hide(backToMenuFromTrivia);
    triviaDiv.innerHTML = '';
    if (progressBar) { progressBar.max = 1; progressBar.value = 0; }

  }

  // ---- Cargar preguntas ----
  async function loadQuestions() {
    try {
      const res = await fetch('questions.json');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();

      allQuestions = Array.isArray(data) ? data.filter(q =>
        q && q.pregunta && q.opciones && q.respuesta && q.categoria
      ) : [];

      if (allQuestions.length === 0) throw new Error('El JSON no contiene preguntas válidas.');

      setView({ showMenu: true });
      // Sync UI (toggle) con preferencia guardada
      if (soundToggle) soundToggle.checked = !!soundOn;

    } catch (err) {
      console.error('Error al cargar el JSON:', err);
      alert('No se pudieron cargar las preguntas. Revisa questions.json y la consola.');
    }
    // Valor inicial desde localStorage (por defecto 10)
    const saved = localStorage.getItem('trivia:count');
    if (questionCountEl) {
      if (saved) questionCountEl.value = saved;
      questionCountEl.addEventListener('change', () =>
        localStorage.setItem('trivia:count', questionCountEl.value)
      );
    }

  }

  // ---- Renderizar pregunta ----
  function renderQuestion() {
  // --- Animación de salida ---
  triviaDiv.classList.remove('show');
  triviaDiv.classList.add('fade');

  // Espera el fin de la animación antes de cambiar el contenido
  setTimeout(() => {
    triviaDiv.innerHTML = '';
    feedbackEl.textContent = '';
    feedbackEl.classList.remove('feedback--correct', 'feedback--wrong');
    feedbackEl.classList.add('visually-hidden');

    if (currentIndex >= triviaData.length) {
      renderSummary();
      return;
    }

    const qData = triviaData[currentIndex];

    const questionWrap = document.createElement('div');
    questionWrap.className = 'question';
    questionWrap.innerHTML = `
      <h2>${qData.pregunta}</h2>
      <p><em>${qData.categoria}</em></p>
    `;

    const optionsDiv = document.createElement('div');
    optionsDiv.className = 'options';

    shuffleArray(qData.opciones).forEach(opt => {
      const btn = document.createElement('button');
      btn.textContent = opt;
      btn.addEventListener('click', () => checkAnswer(qData, opt, btn, optionsDiv));
      optionsDiv.appendChild(btn);
    });
    
    triviaDiv.appendChild(questionWrap);
    triviaDiv.appendChild(optionsDiv);

    hide(nextBtn);
    hide(backToMenuFromTrivia);
    updateHUD();

    // --- Animación de entrada ---
    requestAnimationFrame(() => triviaDiv.classList.add('show'));
  }, 100);
}

    function ensureAudio() {
      if (!audioCtx) {
        try { audioCtx = new (window.AudioContext || window.webkitAudioContext)(); }
        catch (e) { console.warn('AudioContext no disponible', e); }
      }
    }

    function playTone({ freq = 880, duration = 0.12, type = 'sine', volume = 0.25 }) {
      if (!soundOn) return;
      ensureAudio();
      if (!audioCtx) return;

      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = type;
      osc.frequency.value = freq;
      gain.gain.value = volume;

      osc.connect(gain);
      gain.connect(audioCtx.destination);
      const now = audioCtx.currentTime;
      osc.start(now);
      osc.stop(now + duration);

      // pequeña envolvente para evitar clicks
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(volume, now + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
    }

    function playSuccess() {
      // dos tonos cortitos ascendentes
      playTone({ freq: 660, duration: 0.09, type: 'triangle', volume: 0.22 });
      setTimeout(() => playTone({ freq: 880, duration: 0.09, type: 'triangle', volume: 0.22 }), 95);
    }

    function playError() {
      // tono descendente más grave
      playTone({ freq: 240, duration: 0.14, type: 'sawtooth', volume: 0.22 });
      setTimeout(() => playTone({ freq: 180, duration: 0.12, type: 'sawtooth', volume: 0.22 }), 120);
    }

  // ---- Verificar respuesta ----
  function checkAnswer(qData, selected, btn, container) {
    const buttons = [...container.querySelectorAll('button')];
    buttons.forEach(b => b.disabled = true);

    const isCorrect = selected === qData.respuesta;
    const correctBtn = buttons.find(b => b.textContent === qData.respuesta);

    btn.style.backgroundColor = isCorrect ? 'lightgreen' : 'salmon';
    if (!isCorrect && correctBtn) correctBtn.style.backgroundColor = 'lightgreen';

    feedbackEl.classList.remove('visually-hidden', 'feedback--correct', 'feedback--wrong', 'feedback-anim');
    feedbackEl.textContent = isCorrect ? '¡Correcto!' : `Incorrecto. Respuesta: ${qData.respuesta}`;
    feedbackEl.classList.add(isCorrect ? 'feedback--correct' : 'feedback--wrong');
    void feedbackEl.offsetWidth; // reinicia animación
    feedbackEl.classList.add('feedback-anim');

    (isCorrect ? playSuccess : playError)();
    if (isCorrect) { score++; btn.classList.add('correct'); }

    updateHUD();
    show(nextBtn);
  }


  // ---- Resumen final ----
  function renderSummary() {
    // Contenido del resumen dentro de la tarjeta
    triviaDiv.innerHTML = `
      <h2>¡Has completado la trivia!</h2>
      <p>Tu resultado: <strong>${score}</strong> de <strong>${triviaData.length}</strong></p>
      <div class="stack" aria-label="Acciones al finalizar">
        <button id="restartBtn" type="button" aria-label="Volver a jugar con las mismas preguntas">
          Volver a jugar
        </button>
        <button id="playRandomAgain" type="button" aria-label="Nueva trivia aleatoria">
          Nueva trivia aleatoria
        </button>
      </div>
    `;

    // Ocultamos "Siguiente", mostramos "Volver al menú"
    hide(nextBtn);
    show(backToMenuFromTrivia);

    // Listeners de los botones finales
    const restartBtn = $('#restartBtn');
    const playRandomAgainBtn = $('#playRandomAgain');

    restartBtn.addEventListener('click', () => {
      currentIndex = 0;
      score = 0;
      updateHUD();
      renderQuestion();
    });

    playRandomAgainBtn.addEventListener('click', () => {
      const n = getSelectedCount();
      triviaData = shuffleArray(allQuestions).slice(0, n);
      resetGame();
      setView({ showTrivia: true });
      renderQuestion();
    });


    // Accesibilidad: foco inicial al botón principal
    restartBtn?.focus();

    // Asegura que el resumen quede visible (fade + show)
    triviaDiv.classList.remove('show');   // resetea por si quedó de la pregunta anterior
    triviaDiv.classList.add('fade');
    requestAnimationFrame(() => triviaDiv.classList.add('show'));
  }


  // ---- Categorías ----
  function showCategories() {
    categoriesDiv.innerHTML = '';
    const categories = [...new Set(allQuestions.map(q => q.categoria))].sort((a, b) =>
      a.localeCompare(b, 'es', { sensitivity: 'base' })
    );

    categories.forEach(cat => {
      const btn = document.createElement('button');
      btn.textContent = cat;
      btn.addEventListener('click', () => {
        const n = getSelectedCount(); // lee lo que elegiste en el select
        const catQuestions = allQuestions.filter(q => q.categoria === cat);

        // baraja y corta a N preguntas
        triviaData = shuffleArray(catQuestions).slice(0, n);

        resetGame();
        setView({ showTrivia: true });
        renderQuestion();
      });
      categoriesDiv.appendChild(btn);
    });
  }


  // ---- Utilidad: barajar ----
  function shuffleArray(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  // ---- Listeners ----
  nextBtn.addEventListener('click', () => {
    currentIndex++;
    renderQuestion();
  });

  backToMenuBtn.addEventListener('click', () => setView({ showMenu: true }));
  backToMenuFromTrivia.addEventListener('click', () => setView({ showMenu: true }));

  randomBtn.addEventListener('click', () => {
    const n = getSelectedCount();
    triviaData = shuffleArray(allQuestions).slice(0, n);
    resetGame();
    setView({ showTrivia: true });
    renderQuestion();
  });

  categoryBtn.addEventListener('click', () => {
    showCategories();
    setView({ showCategory: true });
  });

  // ---- Inicio ----
  window.addEventListener('DOMContentLoaded', loadQuestions);
})();
