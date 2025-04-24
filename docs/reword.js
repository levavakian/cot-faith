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
  const STEP_COUNT   = originals.length;
  const FINAL_TICK   = STEP_COUNT;
  const TYPE_DELAY   = 10; // ms per character (Keep it fast)
  const ANIM_TIME    = 500;
  const POST_TYPE_DELAY = 50;
  const POST_GREEN_PAUSE_AUTOPLAY = 150;
  const POST_SLIDE_DELAY = 50;
  const SCROLL_PADDING = 30; // Pixels

  let currentStep    = 0;
  let autoplayId     = null;
  let isAutoplaying  = false;
  let isDragging     = false;
  let activeTimeoutIds = [];
  let greenScheduled = false;

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
  Object.assign(ctrl.style, { display: 'flex', alignItems: 'center', marginTop: '1em', gap: '10px' });
  container.appendChild(ctrl);

  const playBtn = document.createElement('button');
  playBtn.textContent = '▶';
  playBtn.title       = 'Play';
  Object.assign(playBtn.style, {
    backgroundColor: '#d2c4a9',
    border: '1px solid #b3a68f',
    borderRadius: '4px',
    padding: '4px 10px',
    cursor: 'pointer',
    fontFamily: 'Georgia, serif',
    color: '#5a4a3f',
    fontWeight: 'bold',
    flexShrink: 0
  });
  ctrl.appendChild(playBtn);

  const slider = document.createElement('input');
  slider.type  = 'range';
  slider.min   = 0;
  slider.max   = FINAL_TICK.toString();
  slider.step  = 1;
  slider.value = '0';
  slider.style.flexGrow = '1';
  slider.style.width = 'auto';
  ctrl.appendChild(slider);

  /* Prev Button */
  const prevBtn = document.createElement('button');
  prevBtn.textContent = '←';
  prevBtn.title = 'Previous Step';
  Object.assign(prevBtn.style, {
    backgroundColor: '#d2c4a9',
    border: '1px solid #b3a68f',
    borderRadius: '4px',
    padding: '4px 10px',
    cursor: 'pointer',
    fontFamily: 'Georgia, serif',
    color: '#5a4a3f',
    fontWeight: 'bold',
    flexShrink: 0
  });
  ctrl.appendChild(prevBtn);

  /* Next Button */
  const nextBtn = document.createElement('button');
  nextBtn.textContent = '→';
  nextBtn.title = 'Next Step';
  Object.assign(nextBtn.style, {
    backgroundColor: '#d2c4a9',
    border: '1px solid #b3a68f',
    borderRadius: '4px',
    padding: '4px 10px',
    cursor: 'pointer',
    fontFamily: 'Georgia, serif',
    color: '#5a4a3f',
    fontWeight: 'bold',
    flexShrink: 0
  });
  ctrl.appendChild(nextBtn);

  /* ------------------------------------------------------------------ *
   *  PRE‑CREATE ROWS                                                   *
   * ------------------------------------------------------------------ */
  const rows = originals.map((orig, i) => {
    const row = document.createElement('div');
    Object.assign(row.style, {
        display: 'none', // Start hidden
        marginBottom: '1em',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        position: 'relative' // Needed if we absolutely position elements later
    });

    const red  = document.createElement('div');
    const green= document.createElement('div');

    // Setup base styles and transitions
    Object.assign(red.style, {
        flex: '0 0 48%', // Take up slightly less than half initially
        color: 'red',
        whiteSpace: 'pre-wrap',
        opacity: 0,
        transition: `opacity ${ANIM_TIME}ms ease-out`
    });
    Object.assign(green.style, {
        flex: '0 0 48%', // Take up slightly less than half initially
        color: 'green',
        whiteSpace: 'pre-wrap',
        opacity: 0,
        transform: 'translateX(0)', // Start in its initial position
        transition: `opacity ${ANIM_TIME}ms ease-out, transform ${ANIM_TIME}ms ease-in-out`
    });

    row.append(red, green);
    listBox.appendChild(row);

    return {
      row, red, green,
      origText: orig || "",
      replText: replacements[i] || "",
      // No complex state needed, determined by currentStep
    };
  });

  /* ------------------------------------------------------------------ *
   *  HELPER FX                                                         *
   * ------------------------------------------------------------------ */
   function clearStepTimeouts() { // Clears only intra-step timeouts
       activeTimeoutIds.forEach(clearTimeout);
       activeTimeoutIds = [];
       greenScheduled = false; // Reset flag
        // Stop typing animations
        rows.forEach(r => {
           if (r.red._typingId) cancelAnimationFrame(r.red._typingId);
           if (r.green._typingId) cancelAnimationFrame(r.green._typingId);
           r.red._typingId = null;
           r.green._typingId = null;
        });
   }
   function addStepTimeout(id) { // Tracks only intra-step timeouts
       activeTimeoutIds.push(id);
   }

   function typeText(el, text, onComplete = null) {
        if (el._typingId) cancelAnimationFrame(el._typingId);
        el.textContent = '';
        if (!text) { requestAnimationFrame(scrollToBottom); if(onComplete) onComplete(); return; }
        let idx = 0;

        function nextChar() {
            if (idx < text.length) {
                el.textContent += text[idx++];
                // *** Call scroll on every frame during typing ***
                requestAnimationFrame(scrollToBottom);
                el._typingId = requestAnimationFrame(nextChar);
            } else {
                el._typingId = null;
                requestAnimationFrame(scrollToBottom); // Final scroll after completion
                if (onComplete) onComplete();
            }
        }
        el._typingId = requestAnimationFrame(nextChar);
    }

    function scrollToBottom() {
        // Calculate the maximum scroll position
        const maxScrollTop = listBox.scrollHeight - listBox.clientHeight;
        // Determine target scroll position (max scroll + padding, ensuring it's not negative)
        const targetScroll = Math.max(0, maxScrollTop + SCROLL_PADDING);

        // Only scroll if the current scroll position is less than the target
        // (prevents unnecessary scrolling or jitter if already at/past the target)
        if (listBox.scrollTop < targetScroll) {
             if (typeof listBox.scrollTo === 'function') {
                 listBox.scrollTo({ top: targetScroll, behavior: 'smooth' });
             } else {
                 listBox.scrollTop = targetScroll; // Fallback for older browsers
             }
        }
   }

  /* ------------------------------------------------------------------ *
   *  CORE STATE UPDATE                                                 *
   * ------------------------------------------------------------------ */
  function setStep(targetStep, isScrubbing = false) {
    // Clear intra-step timeouts when setting step manually or scrubbing
    if (!isAutoplaying || isScrubbing) {
        clearStepTimeouts();
    } else {
        // If autoplaying, only clear if the target step is different from current
        // (prevents clearing timeouts needed for the ongoing step animation)
        if(targetStep !== currentStep) {
            clearStepTimeouts();
        }
    }

    const s = Math.max(0, Math.min(FINAL_TICK, targetStep));
    const stepChanged = (currentStep !== s);
    currentStep = s;
    if (!isDragging) {
        slider.value = s.toString();
    }

    // --- Update Button States ---
    prevBtn.disabled = (s === 0);
    nextBtn.disabled = (s === FINAL_TICK);

    rows.forEach((r, i) => {
        // Stop any active typing animations *before* applying new state, unless scrubbing
        if (!isScrubbing) {
             if (r.red._typingId) cancelAnimationFrame(r.red._typingId);
             if (r.green._typingId) cancelAnimationFrame(r.green._typingId);
             r.red._typingId = null;
             r.green._typingId = null;
        }

        // Apply styles based on relation to currentStep 's'
        if (i < s) {
            // **Completed Steps**
            if (r.row.style.display !== 'flex' || r.red.style.opacity !== '0' || r.green.style.transform !== 'translateX(-100%)') {
                r.row.style.display = 'flex';
                r.red.style.opacity = 0;
                r.green.style.opacity = 1;
                r.green.style.transform = 'translateX(-100%)';
                r.red.textContent = r.origText;
                r.green.textContent = r.replText;
            }
        } else if (i === s && s < STEP_COUNT) {
            // **Current Active Step**
             if (r.row.style.display !== 'flex') {
                 r.row.style.display = 'flex';
                 // Initial scroll deferred to after red text typing if possible
            }
            // Reset green state if needed
             if (r.green.style.transform !== 'translateX(0)') r.green.style.transform = 'translateX(0)';
             if (r.green.style.opacity !== '0' && !isScrubbing) r.green.style.opacity = 0; // Hide unless scrubbing


            // **Phase 1: Red**
            if (r.red.style.opacity !== '1') r.red.style.opacity = 1;

            if (isScrubbing) { // Show instantly when scrubbing
                r.red.textContent = r.origText;
                 if (r.green.style.opacity !== '1') r.green.style.opacity = 1;
                r.green.textContent = r.replText;
                requestAnimationFrame(scrollToBottom); // Scroll after instant text set
            } else { // Animate typing
                 // Ensure green isn't already scheduled from a previous unfinished run
                 if (!greenScheduled) {
                     typeText(r.red, r.origText, () => {
                         requestAnimationFrame(scrollToBottom); // Scroll after red finishes
                         // **Phase 2: Schedule Green**
                         if (!greenScheduled && currentStep === i) { // Double check step hasn't changed & not already scheduled
                             greenScheduled = true; // Set flag immediately
                             let greenTimeoutId = setTimeout(() => {
                                 if (currentStep === i) { // Still on this step?
                                     if (r.green.style.opacity !== '1') r.green.style.opacity = 1;
                                     typeText(r.green, r.replText, () => {
                                         // Green typing DONE
                                         greenScheduled = false; // Reset flag for this step
                                         if (isAutoplaying && currentStep === i) {
                                             scheduleNextAutoplayTransition(i);
                                         }
                                     });
                                 } else {
                                      greenScheduled = false; // Reset if step changed before green started
                                 }
                             }, POST_TYPE_DELAY);
                             addStepTimeout(greenTimeoutId); // Track this specific timeout
                         }
                     });
                 }
            }

        } else {
            // **Future Steps**
             if (r.row.style.display !== 'none') {
                r.row.style.display = 'none';
                 r.red.style.opacity = 0;
                 r.green.style.opacity = 0;
                 r.green.style.transform = 'translateX(0)';
            }
        }
    });

    // Final "Done" state for last item
     if (s === FINAL_TICK && STEP_COUNT > 0) {
         // Code to show last item as completed remains the same...
         const lastRow = rows[STEP_COUNT - 1];
         if (lastRow && (lastRow.row.style.display !== 'flex' || lastRow.green.style.transform !== 'translateX(-100%)')) {
             lastRow.row.style.display = 'flex';
             lastRow.red.style.opacity = 0;
             lastRow.green.style.opacity = 1;
             lastRow.green.style.transform = 'translateX(-100%)';
             lastRow.red.textContent = lastRow.origText;
             lastRow.green.textContent = lastRow.replText;
             requestAnimationFrame(scrollToBottom);
         }
          if (isAutoplaying) stopAutoplay(); // Stop autoplay when it reaches the absolute end
     }
  }


  /* ------------------------------------------------------------------ *
   *  EVENTS & AUTOPLAY                                                 *
   * ------------------------------------------------------------------ */
  slider.addEventListener('input', () => {
      isDragging = true;
      stopAutoplay(); // Stop autoplay immediately on scrub start
      setStep(+slider.value, true);
  });
  slider.addEventListener('change', () => {
       if(isDragging) {
          isDragging = false;
          // Apply final step state without animations after scrubbing
           setStep(+slider.value);
       }
  });
  // Use pointer events for better drag handling
  slider.addEventListener('pointerdown', () => { isDragging = true; stopAutoplay(); });
  slider.addEventListener('pointerup',   () => {
      // No action needed here now, 'change' handles the end of scrubbing
   });

  // --- Button Events ---
  prevBtn.addEventListener('click', () => {
      if (currentStep > 0) {
          stopAutoplay();
          setStep(currentStep - 1);
      }
  });

  nextBtn.addEventListener('click', () => {
      if (currentStep < FINAL_TICK) {
          stopAutoplay();
          setStep(currentStep + 1);
      }
  });

  function stopAutoplay() {
    isAutoplaying = false;
    // Clear only the main autoplay loop timeout, not necessarily intra-step ones
    if (autoplayId) {
        clearTimeout(autoplayId);
        autoplayId = null;
    }
    // We might optionally clear step timeouts here too, or let them finish
    // clearStepTimeouts();
    playBtn.textContent = '▶';
    playBtn.title = 'Play';
  }

  function startAutoplay() {
       if (isAutoplaying) return;
       isAutoplaying = true;
       isDragging = false;
       playBtn.textContent = '■';
       playBtn.title = 'Stop';
        // Clear any lingering step timeouts from manual interaction
       clearStepTimeouts();

       if (currentStep >= FINAL_TICK) {
           setStep(0); // Reset to start visually
           // Schedule the *trigger* for the first step's animations
           autoplayId = setTimeout(() => triggerAutoplayForStep(0), ANIM_TIME); // Wait for reset
       } else {
           // Trigger animations for the current step to kick things off
           triggerAutoplayForStep(currentStep);
       }
   }

   function triggerAutoplayForStep(stepIndex) {
        if (!isAutoplaying || stepIndex >= STEP_COUNT) {
           stopAutoplay();
           return;
       }
       // Ensure step is set correctly and start animations
       setStep(stepIndex, false); // false = not scrubbing
       // The actual progression is handled by green's onComplete -> scheduleNextAutoplayTransition
   }

   // Called by green's onComplete during autoplay for step `completedStepIndex`
   function scheduleNextAutoplayTransition(completedStepIndex) {
        if (!isAutoplaying) return; // Stop if autoplay was cancelled

        const nextStepIndex = completedStepIndex + 1;

        if (nextStepIndex > FINAL_TICK) { // Check if we just finished the last *step*
             stopAutoplay();
             return;
        }

        // Schedule the call to SET the state for the next step
        autoplayId = setTimeout(() => {
            if (isAutoplaying) {
                triggerAutoplayForStep(nextStepIndex); // This calls setStep for the next index
            }
        }, POST_GREEN_PAUSE_AUTOPLAY); // Wait after green text finishes
   }


  playBtn.addEventListener('click', () => {
    if (isAutoplaying) {
        stopAutoplay();
    } else {
        startAutoplay();
    }
  });

  /* ------------------------------------------------------------------ *
   *  INIT                                                              *
   * ------------------------------------------------------------------ */
  setStep(0); // Initialize view to the first step
}