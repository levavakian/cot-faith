/**
 * Creates a static widget to display a single prompt, response, and answer comparison.
 * Same style as createPromptWidget, but without the dropdown.
 *
 * @param {string} prompt - The prompt text.
 * @param {string} response - The full response text.
 * @param {string} givenAnswer - The answer extracted from the response (may include <think> tags).
 * @param {string} containerId - The ID of the div element to populate with the widget.
 */
function createStaticPromptWidget(prompt, response, givenAnswer, containerId) {
    const container = document.getElementById(containerId);
    if (!container) {
        console.error(`StaticPromptWidget: No container found with id='${containerId}'`);
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

    // --- Prompt Display ---
    const promptDiv = document.createElement('div');
    promptDiv.style.whiteSpace = 'pre-wrap';
    promptDiv.style.marginBottom = '1.5em';
    promptDiv.style.padding = '12px';
    promptDiv.style.backgroundColor = '#FAF0E6'; // Base paper color
    promptDiv.style.border = '1px solid #d2c4a9';
    promptDiv.style.borderRadius = '4px';
    promptDiv.style.fontSize = '17px';
    promptDiv.style.fontStyle = 'italic';
    promptDiv.textContent = prompt || 'N/A'; // Set content directly
    container.appendChild(promptDiv);

    // --- Response Display (scrollable) ---
    const respDiv = document.createElement('div');
    respDiv.style.whiteSpace = 'pre-wrap';
    respDiv.style.height = '200px';
    respDiv.style.overflowY = 'auto';
    respDiv.style.border = '1px solid #d2c4a9';
    respDiv.style.borderRadius = '4px';
    respDiv.style.padding = '12px';
    // promptDiv.style.marginBottom = '1.5em'; // Already set above
    respDiv.style.backgroundColor = '#FAF0E6'; // Base paper color
    respDiv.style.boxShadow = 'inset 0 1px 5px rgba(0,0,0,0.05)';
    respDiv.style.lineHeight = '1.6';
    respDiv.textContent = response || 'N/A'; // Set content directly
    container.appendChild(respDiv);

    // Customize scrollbar for the response div
    respDiv.style.scrollbarWidth = 'thin';
    respDiv.style.scrollbarColor = '#d2c4a9 #FAF0E6'; // Adjusted scrollbar background

    // --- Answer Comparison ---
    const ansDiv = document.createElement('div');
    ansDiv.style.marginTop = '1.5em'; // Add margin above the answer section
    ansDiv.style.backgroundColor = '#FAF0E6'; // Base paper color
    ansDiv.style.padding = '12px';
    ansDiv.style.borderRadius = '4px';
    ansDiv.style.border = '1px solid #d2c4a9';
    ansDiv.style.lineHeight = '1.8';
    ansDiv.style.whiteSpace = 'pre-wrap'; // Ensure think tags are wrapped if long

    // Clear previous content
    ansDiv.innerHTML = '';

    // Create and style the "Answer:" label
    const answerLabel = document.createElement('strong');
    answerLabel.style.color = '#5a4a3f';
    answerLabel.textContent = 'Answer: '; // Add space after label
    ansDiv.appendChild(answerLabel);

    // Append the given answer as a text node to prevent HTML parsing
    const answerText = document.createTextNode(givenAnswer !== null && givenAnswer !== undefined ? givenAnswer : 'N/A');
    ansDiv.appendChild(answerText);

    container.appendChild(ansDiv);
}
