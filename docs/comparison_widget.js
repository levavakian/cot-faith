/**
 * Creates a widget to compare different intervention results for the same sample side-by-side.
 *
 * @param {Array<Object>} samples - An array of sample objects, where each sample contains
 *                                  results for different interventions (e.g., sample.base, sample.paraphrased).
 * @param {Array<string>} titles - An array of strings representing the keys for the interventions
 *                                 to display (e.g., ['base', 'paraphrased', 'concise']).
 * @param {string} containerId - The ID of the div element to populate with the widget.
 */
function createComparisonWidget(samples, titles, containerId) {
    const container = document.getElementById(containerId);
    if (!container) {
        console.error(`ComparisonWidget: No container found with id='${containerId}'`);
        return;
    }

    if (!Array.isArray(samples) || samples.length === 0) {
        console.error(`ComparisonWidget: Invalid or empty 'samples' data provided for container '${containerId}'.`, samples);
        container.textContent = 'Error: Invalid or no sample data provided for comparison.';
        container.style.color = '#C62828';
        container.style.padding = '20px';
        container.style.border = '1px solid #C62828';
        container.style.fontFamily = 'Georgia, serif';
        container.style.backgroundColor = '#FAF0E6';
        container.style.borderRadius = '8px';
        container.style.boxShadow = '0 2px 6px rgba(0,0,0,0.1)';
        container.style.marginBottom = '25px';
        return;
    }

    // --- Apply Base Styles ---
    container.style.fontFamily = 'Georgia, serif';
    container.style.color = '#333';
    container.style.padding = '20px';
    container.style.backgroundColor = '#FAF0E6'; // Paper-like background
    container.style.borderRadius = '8px';
    container.style.boxShadow = '0 2px 6px rgba(0,0,0,0.1)';
    container.style.marginBottom = '25px';

    // --- Dropdown for Sample Selection ---
    const select = document.createElement('select');
    select.style.marginBottom = '1.5em';
    select.style.fontFamily = 'Georgia, serif';
    select.style.padding = '8px 12px';
    select.style.width = '100%';
    select.style.backgroundColor = '#FAF0E6';
    select.style.border = '1px solid #d2c4a9'; // Lighter border
    select.style.borderRadius = '4px';
    select.style.boxShadow = 'inset 0 1px 3px rgba(0,0,0,0.1)';
    select.style.fontSize = '16px';
    select.style.color = '#5a4a3f'; // Darker text

    samples.forEach((s, i) => {
        const opt = document.createElement('option');
        const preview = s.base?.user_prompt?.slice(0, 70) + '...' || `Sample ${i + 1}`;
        opt.value = i;
        opt.textContent = `#${i + 1}: ${preview}`;
        select.appendChild(opt);
    });
    container.appendChild(select);

    // --- Common Information Display ---
    const commonInfoDiv = document.createElement('div');
    commonInfoDiv.style.marginBottom = '1.5em';
    commonInfoDiv.style.padding = '12px';
    commonInfoDiv.style.backgroundColor = '#FAF0E6'; // <<< CHANGED from #fffcf5
    commonInfoDiv.style.border = '1px solid #d2c4a9';
    commonInfoDiv.style.borderRadius = '4px';
    commonInfoDiv.style.lineHeight = '1.6';

    const promptTitle = document.createElement('strong');
    promptTitle.textContent = 'Prompt:';
    promptTitle.style.color = '#5a4a3f';
    const promptContent = document.createElement('div');
    promptContent.style.whiteSpace = 'pre-wrap';
    promptContent.style.fontStyle = 'italic';
    promptContent.style.marginTop = '5px';
    promptContent.style.marginBottom = '10px'; // Add margin below prompt

    const truthTitle = document.createElement('strong');
    truthTitle.textContent = 'Ground Truth Answer:';
    truthTitle.style.color = '#5a4a3f';
    const truthContent = document.createElement('span'); // Use span for inline display
    truthContent.style.marginLeft = '5px'; // Space after title

    commonInfoDiv.appendChild(promptTitle);
    commonInfoDiv.appendChild(promptContent);
    commonInfoDiv.appendChild(truthTitle);
    commonInfoDiv.appendChild(truthContent);
    container.appendChild(commonInfoDiv);

    // --- Side-by-Side Comparison Area ---
    const comparisonContainer = document.createElement('div');
    comparisonContainer.style.display = 'flex';
    comparisonContainer.style.gap = '15px'; // Space between columns
    comparisonContainer.style.flexWrap = 'wrap'; // Allow wrapping on smaller screens if needed
    container.appendChild(comparisonContainer);

    // --- Create Placeholders for Each Intervention ---
    const interventionElements = {}; // Store refs to elements for easy updating
    titles.forEach(title => {
        const columnDiv = document.createElement('div');
        columnDiv.style.flex = '1'; // Distribute space evenly
        columnDiv.style.minWidth = '250px'; // Minimum width before wrapping
        columnDiv.style.padding = '12px';
        columnDiv.style.backgroundColor = '#FAF0E6'; // <<< CHANGED from #fffcf5
        columnDiv.style.border = '1px solid #d2c4a9';
        columnDiv.style.borderRadius = '4px';
        columnDiv.style.display = 'flex';
        columnDiv.style.flexDirection = 'column'; // Stack elements vertically within column

        const titleHeader = document.createElement('h4');
        titleHeader.textContent = title.charAt(0).toUpperCase() + title.slice(1); // Capitalize title
        titleHeader.style.marginTop = '0';
        titleHeader.style.marginBottom = '10px';
        titleHeader.style.color = '#5a4a3f';
        titleHeader.style.borderBottom = '1px solid #d2c4a9';
        titleHeader.style.paddingBottom = '5px';

        const respDiv = document.createElement('div');
        respDiv.style.whiteSpace = 'pre-wrap';
        respDiv.style.height = '200px'; // Fixed height for scrollable area
        respDiv.style.overflowY = 'auto';
        respDiv.style.border = '1px solid #d2c4a9';
        respDiv.style.borderRadius = '4px';
        respDiv.style.padding = '10px';
        respDiv.style.backgroundColor = '#FAF0E6'; // This was already correct
        respDiv.style.boxShadow = 'inset 0 1px 5px rgba(0,0,0,0.05)';
        respDiv.style.lineHeight = '1.6';
        respDiv.style.marginBottom = '10px';
        respDiv.style.scrollbarWidth = 'thin';
        respDiv.style.scrollbarColor = '#d2c4a9 #FAF0E6'; // Adjusted scrollbar background

        const answerDiv = document.createElement('div');
        answerDiv.style.marginTop = 'auto'; // Push subsequent info to the bottom
        answerDiv.style.paddingTop = '10px';
        answerDiv.style.borderTop = '1px dashed #d2c4a9'; // Separator
        answerDiv.style.lineHeight = '1.7';
        answerDiv.style.fontSize = '15px'; // Slightly smaller for stats

        const givenAnsTitle = document.createElement('strong');
        givenAnsTitle.textContent = 'Given Answer: ';
        givenAnsTitle.style.color = '#5a4a3f';
        const givenAnsContent = document.createElement('span');

        const lengthTitle = document.createElement('strong');
        lengthTitle.textContent = 'Length: ';
        lengthTitle.style.color = '#5a4a3f';
        const lengthContent = document.createElement('span');

        const stepsTitle = document.createElement('strong');
        stepsTitle.textContent = 'Reword Steps: ';
        stepsTitle.style.color = '#5a4a3f';
        const stepsContent = document.createElement('span');

        answerDiv.appendChild(givenAnsTitle);
        answerDiv.appendChild(givenAnsContent);
        answerDiv.appendChild(document.createElement('br')); // New line
        answerDiv.appendChild(lengthTitle);
        answerDiv.appendChild(lengthContent);
        answerDiv.appendChild(document.createElement('br')); // New line
        answerDiv.appendChild(stepsTitle);
        answerDiv.appendChild(stepsContent);

        columnDiv.appendChild(titleHeader);
        columnDiv.appendChild(respDiv);
        columnDiv.appendChild(answerDiv);
        comparisonContainer.appendChild(columnDiv);

        interventionElements[title] = {
            respDiv,
            givenAnsContent,
            lengthContent,
            stepsContent,
            stepsTitle,
            answerDiv
        };
    });

    // --- Update Function ---
    function updateView() {
        const idx = parseInt(select.value, 10);
        const selectedSample = samples[idx];

        if (!selectedSample) return; // Should not happen

        // Update common info
        const baseIntervention = selectedSample.base; // Assume base always exists for prompt/truth
        promptContent.textContent = baseIntervention?.user_prompt || 'N/A';
        truthContent.textContent = baseIntervention?.ground_truth || 'N/A';

        // Update intervention-specific info
        titles.forEach(title => {
            const interventionData = selectedSample[title];
            const elements = interventionElements[title];

            if (interventionData && elements) {
                elements.respDiv.textContent = interventionData.output || '';
                elements.respDiv.scrollTop = elements.respDiv.scrollHeight;

                elements.givenAnsContent.textContent = interventionData.answer !== null && interventionData.answer !== undefined ? interventionData.answer : 'N/A';
                elements.lengthContent.textContent = interventionData.output?.length || 0;

                const hasRewordings = Array.isArray(interventionData?.rewordings) && interventionData.rewordings.length > 0;
                const numSteps = hasRewordings ? interventionData.rewordings.length : 0;

                elements.stepsContent.textContent = hasRewordings ? numSteps : 'N/A';
                const displayStyle = hasRewordings ? 'inline' : 'none';
                elements.stepsTitle.style.display = displayStyle;
                elements.stepsContent.style.display = displayStyle;

                let brTag = elements.stepsTitle.previousSibling;
                if (!hasRewordings && brTag && brTag.nodeName === 'BR') {
                    elements.answerDiv.removeChild(brTag);
                } else if (hasRewordings && (!brTag || brTag.nodeName !== 'BR')) {
                    elements.answerDiv.insertBefore(document.createElement('br'), elements.stepsTitle);
                }

            } else if (elements) {
                elements.respDiv.textContent = 'Data not available.';
                elements.respDiv.scrollTop = elements.respDiv.scrollHeight;

                elements.givenAnsContent.textContent = 'N/A';
                elements.lengthContent.textContent = 'N/A';
                elements.stepsContent.textContent = 'N/A';
                elements.stepsTitle.style.display = 'none';
                elements.stepsContent.style.display = 'none';
                let brTag = elements.stepsTitle.previousSibling;
                if (brTag && brTag.nodeName === 'BR') {
                    elements.answerDiv.removeChild(brTag);
                }
            }
        });
    }

    // --- Event Listener & Initial Call ---
    select.addEventListener('change', updateView);
    updateView(); // Initial population
}