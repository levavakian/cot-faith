// Create a dropdown+viewer widget.
// prompts, responses, givenAnswers, finalAnswers must all be arrays of the same length.
// containerId is the id of an existing <div> on the page.
function createPromptWidget(prompts, responses, givenAnswers, finalAnswers, containerId) {
  const container = document.getElementById(containerId);
  if (!container) {
    console.error('No container found with id=', containerId);
    return;
  }

  // Apply paper-like styles to container
  container.style.fontFamily = 'Georgia, serif';
  container.style.color = '#333';
  container.style.padding = '20px';
  container.style.backgroundColor = '#FAF0E6';
  container.style.borderRadius = '8px';
  container.style.boxShadow = '0 2px 6px rgba(0,0,0,0.1)';
  container.style.marginBottom = '25px';

  // 1) dropdown
  const select = document.createElement('select');
  select.style.marginBottom = '1.5em';
  select.style.fontFamily = 'Georgia, serif';
  select.style.padding = '8px 12px';
  select.style.width = '100%';
  select.style.backgroundColor = '#FAF0E6';
  select.style.border = '1px solid #d2c4a9';
  select.style.borderRadius = '4px';
  select.style.boxShadow = 'inset 0 1px 3px rgba(0,0,0,0.1)';
  select.style.fontSize = '16px';
  select.style.color = '#5a4a3f';
  
  prompts.forEach((p, i) => {
    const opt = document.createElement('option');
    // show a short preview in the menu
    const preview = p.length > 50 ? p.slice(0,50) + '…' : p;
    opt.value = i;
    opt.textContent = `#${i+1}: ${preview}`;
    select.appendChild(opt);
  });
  container.appendChild(select);

  // 2) prompt display
  const promptDiv = document.createElement('div');
  promptDiv.style.whiteSpace = 'pre-wrap';
  promptDiv.style.marginBottom = '1.5em';
  promptDiv.style.padding = '12px';
  promptDiv.style.backgroundColor = '#FAF0E6';
  promptDiv.style.border = '1px solid #d2c4a9';
  promptDiv.style.borderRadius = '4px';
  promptDiv.style.fontSize = '17px';
  promptDiv.style.fontStyle = 'italic';
  container.appendChild(promptDiv);

  // 3) response display (scrollable)
  const respDiv = document.createElement('div');
  respDiv.style.whiteSpace = 'pre-wrap';
  respDiv.style.height = '200px';
  respDiv.style.overflowY = 'auto';
  respDiv.style.border = '1px solid #d2c4a9';
  respDiv.style.borderRadius = '4px';
  respDiv.style.padding = '12px';
  promptDiv.style.marginBottom = '1.5em';
  respDiv.style.backgroundColor = '#FAF0E6';
  respDiv.style.boxShadow = 'inset 0 1px 5px rgba(0,0,0,0.05)';
  respDiv.style.lineHeight = '1.6';
  container.appendChild(respDiv);

  // Customize scrollbar for the response div
  respDiv.style.scrollbarWidth = 'thin';
  respDiv.style.scrollbarColor = '#d2c4a9 #fffcf5';

  // 4) answer comparison
  const ansDiv = document.createElement('div');
  ansDiv.style.backgroundColor = '#FAF0E6';
  ansDiv.style.padding = '12px';
  ansDiv.style.borderRadius = '4px';
  ansDiv.style.border = '1px solid #d2c4a9';
  ansDiv.style.lineHeight = '1.8';
  container.appendChild(ansDiv);

  // When the selection changes, re‐render everything:
  function updateView() {
    const idx = select.value;
    promptDiv.textContent = prompts[idx];
    respDiv.textContent = responses[idx];
    ansDiv.innerHTML = 
      `<strong style="color:#5a4a3f">Given answer:</strong> ${givenAnswers[idx]}<br>` +
      `<strong style="color:#5a4a3f">Final answer:</strong> ${finalAnswers[idx]}`;
  }
  select.addEventListener('change', updateView);

  // select the first entry by default
  select.value = 0;
  updateView();
}

