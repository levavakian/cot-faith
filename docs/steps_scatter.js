/**
 * Creates a scatter plot comparing the number of reword steps for different intervention types across questions,
 * and displays the median step count ratio relative to the 'unparaphrased' case below the chart.
 *
 * @param {string[]} interventionTypes - An array of intervention type names (e.g., ['paraphrased', 'concise', 'unparaphrased']). Must include 'unparaphrased'.
 * @param {object[]} samples - An array of sample objects. Each relevant intervention object should have a 'rewordings' property (an array).
 * @param {string} targetElementId - The ID of the canvas element where the chart will be rendered.
 */
function createStepsScatterPlot(interventionTypes, samples, targetElementId) {
  const canvasElement = document.getElementById(targetElementId);
  if (!canvasElement) {
    console.error(`Element with ID "${targetElementId}" not found.`);
    return;
  }
  const ctx = canvasElement.getContext('2d');
  if (!ctx) {
      console.error(`Could not get 2D context for canvas with ID "${targetElementId}".`);
      return;
  }
  if (typeof Chart === 'undefined') {
      console.error("Chart.js is not loaded.");
      canvasElement.textContent = "Error: Chart.js library not loaded.";
      canvasElement.style.color = '#C62828';
      return;
  }
   // Check for 'unparaphrased' instead of 'base'
   if (!interventionTypes.includes('unparaphrased')) {
     console.error("`interventionTypes` must include 'unparaphrased' to calculate relative step ratios.");
     return;
   }
    // Filter out 'base' if present, as it's irrelevant for steps
   if (interventionTypes.includes('base')) {
     console.warn("`interventionTypes` includes 'base'. Base case has no 'rewordings' and is ignored for steps plot.");
     interventionTypes = interventionTypes.filter(type => type !== 'base');
   }


  // Define the consistent color map
  const interventionColorMap = {
    'base':        'hsla(120, 70%, 60%, 0.8)', // Greenish
    'paraphrased': 'hsla(0, 70%, 60%, 0.8)',   // Reddish
    'concise':     'hsla(210, 70%, 60%, 0.8)', // Light Blue
    'unparaphrased': 'hsla(240, 70%, 60%, 0.8)' // Bluish
  };
  const getColor = (type) => interventionColorMap[type] || 'hsla(0, 0%, 50%, 0.8)';

  const datasets = [];
  let maxSteps = 0;
  const ratioLists = {};       // Store lists of ratios per type (relative to unparaphrased)
  // Pre-calculate unparaphrased steps
  const unparaphrasedStepsList = samples.map(sample =>
      (sample.unparaphrased && Array.isArray(sample.unparaphrased.rewordings)) ? sample.unparaphrased.rewordings.length : null
  );

  interventionTypes.forEach((type) => {
    const dataPoints = [];
    // Initialize ratio list only for types other than 'unparaphrased'
    if (type !== 'unparaphrased') {
        ratioLists[type] = [];
    }

    samples.forEach((sample, sampleIndex) => {
      const interventionData = sample[type];
      const unparaphrasedSteps = unparaphrasedStepsList[sampleIndex]; // Get pre-calculated unparaphrased steps

      if (interventionData && Array.isArray(interventionData.rewordings)) {
        const steps = interventionData.rewordings.length;
        dataPoints.push({
          x: sampleIndex,
          y: steps
        });
        maxSteps = Math.max(maxSteps, steps);

        // Calculate and collect ratio if not unparaphrased and unparaphrasedSteps is valid
        if (type !== 'unparaphrased' && unparaphrasedSteps !== null && unparaphrasedSteps > 0) {
            const ratio = steps / unparaphrasedSteps;
            ratioLists[type].push(ratio); // Collect ratio
        } else if (type !== 'unparaphrased' && (unparaphrasedSteps === null || unparaphrasedSteps === 0)) {
             console.warn(`Cannot calculate step ratio for type "${type}" at index ${sampleIndex} due to invalid 'unparaphrased' steps.`);
        }

      } else {
         console.warn(`Rewordings missing or not an array for intervention type "${type}" in sample index ${sampleIndex}.`);
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

  const yAxisLimit = Math.ceil(maxSteps * 1.1);

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
                label += `(Question ${context.parsed.x + 1}, Steps: ${context.parsed.y})`;
              }
              return label;
            }
          }
        },
        title: {
            display: true,
            text: 'Number of Reword Steps by Question and Intervention Type'
        }
      },
      scales: {
        x: {
          type: 'linear',
          position: 'bottom',
          title: { display: true, text: 'Question Index' },
          min: -1, max: samples.length,
          ticks: {
            stepSize: 1,
             callback: function(value, index, values) {
                 if (value >= 0 && value < samples.length && Number.isInteger(value)) { return value + 1; }
                 return '';
             }
          }
        },
        y: {
          type: 'linear',
          title: { display: true, text: 'Number of Reword Steps' },
          min: 0, max: yAxisLimit,
          ticks: { stepSize: 1 }
        }
      }
    }
  };

  new Chart(ctx, config);

   // --- Add Median Step Ratio Display (Relative to Unparaphrased) ---
  let mediansHtml = `<div style="text-align: center; margin-top: 10px;"><span style="font-size: 0.8em;"><strong>Median Step Ratio (vs. Unparaphrased):</strong></span><br>`;
  interventionTypes.forEach(type => {
       // Only display for types other than 'unparaphrased'
      if (type !== 'unparaphrased' && ratioLists[type]) {
          const ratios = ratioLists[type];
          let median = 0;
          if (ratios.length > 0) {
              const sortedRatios = ratios.slice().sort((a, b) => a - b);
              const midIndex = Math.floor(sortedRatios.length / 2);
              if (sortedRatios.length % 2 === 0) {
                  // Even number of elements, average the two middle ones
                  median = (sortedRatios[midIndex - 1] + sortedRatios[midIndex]) / 2;
              } else {
                  // Odd number of elements, pick the middle one
                  median = sortedRatios[midIndex];
              }
          }
          const color = getColor(type).replace('0.8', '1'); // Use border color

          // Display the ratio, formatted to 2 decimal places
          mediansHtml += `<span style="color: ${color}; margin: 0 10px; display: inline-block;">${type.charAt(0).toUpperCase() + type.slice(1)}: ${median.toFixed(2)}</span>`;
      }
  });
  mediansHtml += '</div>';

  // Find the container div that holds the canvas
  const canvasContainer = canvasElement.parentNode;

  // Check if the medians div already exists, if so, update it, otherwise create it
  let mediansDiv = document.getElementById(targetElementId + '-medians');
  if (!mediansDiv) {
      mediansDiv = document.createElement('div');
      mediansDiv.id = targetElementId + '-medians';
      if (canvasContainer && canvasContainer.parentNode) {
          canvasContainer.parentNode.insertBefore(mediansDiv, canvasContainer.nextSibling);
      } else {
          console.warn("Could not find canvas container to insert medians div after.");
          document.body.appendChild(mediansDiv);
      }
  }
  mediansDiv.innerHTML = mediansHtml;
}
