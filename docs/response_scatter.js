/**
 * Creates a scatter plot comparing total response lengths for different intervention types across questions,
 * and displays the median response length ratio relative to the base case below the chart.
 *
 * @param {string[]} interventionTypes - An array of intervention type names (e.g., ['base', 'paraphrased', 'concise']). Must include 'base'.
 * @param {object[]} samples - An array of sample objects, where each object contains intervention data (e.g., sample.base, sample.paraphrased). Each intervention object should have an 'output' property (the full response string).
 * @param {string} targetElementId - The ID of the canvas element where the chart will be rendered.
 */
function createResponseLengthScatterPlot(interventionTypes, samples, targetElementId) {
  const canvasElement = document.getElementById(targetElementId); // Get canvas element
  if (!canvasElement) {
    console.error(`Element with ID "${targetElementId}" not found.`);
    return;
  }
  const ctx = canvasElement.getContext('2d'); // Get context
  if (!ctx) {
      console.error(`Could not get 2D context for canvas with ID "${targetElementId}".`);
      return;
  }
  if (typeof Chart === 'undefined') {
      console.error("Chart.js is not loaded. Make sure the Chart.js library is included before this script.");
      canvasElement.textContent = "Error: Chart.js library not loaded."; // Use canvasElement
      canvasElement.style.color = '#C62828';
      return;
  }
   if (!interventionTypes.includes('base')) {
     console.error("`interventionTypes` must include 'base' to calculate relative ratios.");
     return;
   }

  // Define the same consistent color map - Updated 'concise'
  const interventionColorMap = {
    'base':        'hsla(120, 70%, 60%, 0.8)', // Greenish
    'paraphrased': 'hsla(0, 70%, 60%, 0.8)',   // Reddish
    'concise':     'hsla(210, 70%, 60%, 0.8)', // Light Blue (Hue 210) - CORRECTED
    'unparaphrased': 'hsla(240, 70%, 60%, 0.8)' // Bluish
    // Add other types if needed
  };
  // Helper to get color or a default grey
  const getColor = (type) => interventionColorMap[type] || 'hsla(0, 0%, 50%, 0.8)';

  const datasets = [];
  let maxLength = 0;
  const ratioLists = {};       // Store lists of ratios per type (relative to base)
  const baseLengths = samples.map(sample => // Pre-calculate base lengths
      (sample.base && typeof sample.base.output === 'string') ? sample.base.output.length : null
  );

  interventionTypes.forEach((type, typeIndex) => {
    const dataPoints = [];
     // Initialize ratio list only for non-base types
    if (type !== 'base') {
        ratioLists[type] = [];
    }

    samples.forEach((sample, sampleIndex) => {
      const interventionData = sample[type];
      const baseLength = baseLengths[sampleIndex]; // Get pre-calculated base length

      if (interventionData && typeof interventionData.output === 'string') {
        const length = interventionData.output.length;
        dataPoints.push({
          x: sampleIndex,
          y: length
        });
        maxLength = Math.max(maxLength, length);

        // Calculate and collect ratio if not base and baseLength is valid
        if (type !== 'base' && baseLength !== null && baseLength > 0) {
            const ratio = length / baseLength;
            ratioLists[type].push(ratio); // Collect the ratio
        } else if (type !== 'base' && (baseLength === null || baseLength === 0)) {
             console.warn(`Cannot calculate ratio for type "${type}" at index ${sampleIndex} due to invalid base length.`);
        }

      } else {
         console.warn(`Output missing or not a string for intervention type "${type}" in sample index ${sampleIndex}.`);
      }
    });

    datasets.push({
      label: type.charAt(0).toUpperCase() + type.slice(1),
      data: dataPoints,
      backgroundColor: getColor(type),
      borderColor: getColor(type).replace('0.8', '1'),
      pointRadius: 5,
      pointHoverRadius: 7,
    });
  });

  const yAxisLimit = Math.ceil(maxLength * 1.1 / 1000) * 1000;

  const config = {
    type: 'scatter',
    data: { datasets: datasets },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { position: 'top' },
        tooltip: {
          callbacks: {
            label: function(context) {
              let label = context.dataset.label || '';
              if (label) { label += ': '; }
              if (context.parsed.x !== null && context.parsed.y !== null) {
                label += `(Question ${context.parsed.x + 1}, Length: ${context.parsed.y})`;
              }
              return label;
            }
          }
        },
        title: {
            display: true,
            text: 'Total Response Length by Question and Intervention Type'
        }
      },
      scales: {
        x: {
          type: 'linear',
          position: 'bottom',
          title: { display: true, text: 'Question Index' },
          min: -1,
          max: samples.length,
          ticks: {
            stepSize: 1,
             callback: function(value, index, values) {
                 if (value >= 0 && value < samples.length && Number.isInteger(value)) {
                    return value + 1;
                 }
                 return '';
             }
          }
        },
        y: {
          type: 'linear',
          title: { display: true, text: 'Response Length (characters)' },
          min: 0,
          max: yAxisLimit
        }
      }
    }
  };

  new Chart(ctx, config);

   // --- Add Median Ratio Display (Relative to Base) ---
  let mediansHtml = `<div style="text-align: center; margin-top: 10px;"><span style="font-size: 0.8em;"><strong>Median Response Length Ratio (vs. Base):</strong></span><br>`;
  interventionTypes.forEach(type => {
       // Only display for non-base types
      if (type !== 'base' && ratioLists[type]) {
          const ratios = ratioLists[type];
          let median = 0;
          if (ratios.length) {
              const sorted = ratios.slice().sort((a, b) => a - b);
              const mid = Math.floor(sorted.length / 2);
              median = sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
          }
          const color = getColor(type).replace('0.8', '1'); // Use border color

          mediansHtml += `<span style="color: ${color}; margin: 0 10px; display: inline-block;">${type.charAt(0).toUpperCase() + type.slice(1)}: ${median.toFixed(2)}</span>`;
      }
  });
  mediansHtml += '</div>';

  // Find the container div that holds the canvas
  const canvasContainer = canvasElement.parentNode;

  // Check if the averages div already exists, if so, update it, otherwise create it
  let averagesDiv = document.getElementById(targetElementId + '-averages');
  if (!averagesDiv) {
      averagesDiv = document.createElement('div');
      averagesDiv.id = targetElementId + '-averages';
      if (canvasContainer && canvasContainer.parentNode) {
          canvasContainer.parentNode.insertBefore(averagesDiv, canvasContainer.nextSibling);
      } else {
          console.warn("Could not find canvas container to insert averages div after.");
          document.body.appendChild(averagesDiv);
      }
  }
  averagesDiv.innerHTML = mediansHtml;
}
