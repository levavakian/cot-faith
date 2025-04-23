// A widget that shows a chain of paraphrases:
// - original text in red on the left
// - paraphrased text in green on the right
// - a slider to step forwards/backwards through the chain
// - letters stream in with a typewriter effect
// - when you advance, the green cell slides left to become the next red

function createParaphraseWidget(originals, replacements, containerId) {
  /* ------------------------------------------------------------------ *
   *  CONSTANTS & STATE                                                 *
   * ------------------------------------------------------------------ */
  const STEP_COUNT   = originals.length;          // real rows
  const FINAL_TICK   = STEP_COUNT;                // slider's last tick (only green)
  const TYPE_DELAY   = 30;                        // ms per character
  const ANIM_TIME    = 500;                       // ms for slide/fade
  const ROW_STATE    = { HIDDEN: 0, ACTIVE: 1, DONE: 2 };
  
  let currentStep    = 0;                         // current slider position
  let autoplayId     = null;                      // interval id
  let isDragging     = false;                     // suppress autoplay on user drag

  /* ------------------------------------------------------------------ *
   *  BUILD SKELETON DOM                                                *
   * ------------------------------------------------------------------ */
  const container = document.getElementById(containerId);
  if (!container) return console.error('No container:', containerId);

  // parchment styling (match view_widget.js)
  Object.assign(container.style, {
    fontFamily: 'Georgia, serif',
    color: '#333',
    padding: '20px',
    backgroundColor: '#FAF0E6',
    borderRadius: '8px',
    boxShadow: '0 2px 6px rgba(0,0,0,.1)',
    marginBottom: '25px'
  });

  /* scroll box */
  const listBox = document.createElement('div');
  Object.assign(listBox.style, {
    height: '300px',
    overflowY: 'auto',
    border: '1px solid #d2c4a9',
    borderRadius: '4px',
    padding: '10px'
  });
  container.appendChild(listBox);

  /* controls row: play button + slider */
  const ctrl = document.createElement('div');
  Object.assign(ctrl.style, { display: 'flex', alignItems: 'center', marginTop: '1em' });
  container.appendChild(ctrl);

  const playBtn = document.createElement('button');
  playBtn.textContent = '▶';
  playBtn.title       = 'Play';
  Object.assign(playBtn.style, {
    backgroundColor: '#d2c4a9',
    border: '1px solid #b3a68f',
    borderRadius: '4px',
    padding: '4px 10px',
    marginRight: '10px',
    cursor: 'pointer',
    fontFamily: 'Georgia, serif',
    color: '#5a4a3f',
    fontWeight: 'bold'
  });
  ctrl.appendChild(playBtn);

  const slider = document.createElement('input');
  slider.type  = 'range';
  slider.min   = 0;
  slider.max   = FINAL_TICK.toString();   // one extra tick
  slider.step  = 1;
  slider.value = '0';
  slider.style.width = '100%';
  ctrl.appendChild(slider);

  /* ------------------------------------------------------------------ *
   *  PRE‑CREATE ROWS                                                   *
   * ------------------------------------------------------------------ */
  const rows = originals.map((orig, i) => {
    const row = document.createElement('div');
    Object.assign(row.style, { display: 'none', marginBottom: '1em', 
                               justifyContent: 'space-between', alignItems: 'flex-start' });

    const red  = document.createElement('div');
    const green= document.createElement('div');
    Object.assign(red.style,   { flex: 1, color: 'red',   whiteSpace: 'pre-wrap' });
    Object.assign(green.style, { flex: 1, color: 'green', whiteSpace: 'pre-wrap',
                                 transformOrigin: 'left' });
    row.append(red, green);
    listBox.appendChild(row);

    return {
      row, red, green,
      origText: orig,
      replText: replacements[i],
      state: ROW_STATE.HIDDEN,
      typed: false            // has typewriter run?
    };
  });

  /* ------------------------------------------------------------------ *
   *  HELPER FX                                                         *
   * ------------------------------------------------------------------ */
  function typeText(el, text) {
    el.textContent = '';
    let idx = 0;
    (function next() {
      if (idx < text.length) {
        el.textContent += text[idx++];
        setTimeout(next, TYPE_DELAY);
      }
    })();
  }

  function toDone(r) {                // red fades out, green slides left
    if (r.state === ROW_STATE.DONE) return;
    r.red.style.transition   = `opacity ${ANIM_TIME}ms ease`;
    r.green.style.transition = `transform ${ANIM_TIME}ms ease`;
    r.red.style.opacity      = '0';
    r.green.style.transform  = 'translateX(-100%)';
    r.state = ROW_STATE.DONE;
  }

  function toActive(r) {              // show both columns
    if (r.state === ROW_STATE.ACTIVE) return;
    r.row.style.display      = 'flex';
    r.red.style.opacity      = '1';
    r.green.style.transform  = 'translateX(0)';
    if (!r.typed) { typeText(r.red, r.origText); typeText(r.green, r.replText); r.typed = true; }
    r.state = ROW_STATE.ACTIVE;
  }

  function hideRow(r) {               // invisible
    r.row.style.display = 'none';
    r.state = ROW_STATE.HIDDEN;
  }

  function scrollToBottom() {
    listBox.scrollTop = listBox.scrollHeight;
  }

  /* ------------------------------------------------------------------ *
   *  CORE STATE UPDATE                                                 *
   * ------------------------------------------------------------------ */
  function setStep(step) {
    // Clamp & remember
    const s = Math.max(0, Math.min(FINAL_TICK, step));
    currentStep = s;
    slider.value = s.toString();

    // Update rows
    rows.forEach((r, i) => {
      if (i < s) {
        toDone(r);
        r.row.style.display = 'flex';
      } else if (i === s && s < STEP_COUNT) {
        toActive(r);
      } else {
        hideRow(r);
      }
    });

    // Special case: final tick shows last row DONE (only green)
    if (s === FINAL_TICK) {
      toDone(rows[STEP_COUNT - 1]);
    }

    requestAnimationFrame(scrollToBottom);
  }

  /* ------------------------------------------------------------------ *
   *  EVENTS                                                            *
   * ------------------------------------------------------------------ */
  slider.addEventListener('input', () => setStep(+slider.value));

  slider.addEventListener('pointerdown', () => { isDragging = true; stopAutoplay(); });
  slider.addEventListener('pointerup',   () => { isDragging = false; });

  function stopAutoplay() {
    if (autoplayId) { clearInterval(autoplayId); autoplayId = null; playBtn.textContent = '▶'; playBtn.title = 'Play'; }
  }

  playBtn.addEventListener('click', () => {
    if (autoplayId) return stopAutoplay();

    // Restart if at end
    if (currentStep === FINAL_TICK) setStep(0);

    playBtn.textContent = '■';
    playBtn.title = 'Stop';
    autoplayId = setInterval(() => {
      if (isDragging) return;                 // user intervened
      if (currentStep >= FINAL_TICK) return stopAutoplay();
      setStep(currentStep + 1);
    }, TYPE_DELAY * 40);  // ~1.2 s per step with 30 ms char delay (tweak as desired)
  });

  /* ------------------------------------------------------------------ *
   *  INIT                                                              *
   * ------------------------------------------------------------------ */
  setStep(0);
}