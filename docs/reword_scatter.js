/**
 * Creates a scatter plot comparing original vs. reworded chunk lengths for different intervention types,
 * and displays the average reword ratio for each type below the chart.
 *
 * @param {string[]} interventionTypes - An array of intervention type names (e.g., ['paraphrased', 'unparaphrased', 'concise']). These should match keys in the sample objects.
 * @param {object[]} samples - An array of sample objects, where each object contains intervention data (e.g., sample.paraphrased, sample.unparaphrased). Each intervention object should have a 'rewordings' property: an array of [original_text, reworded_text] pairs.
 * @param {string} targetElementId - The ID of the canvas element where the chart will be rendered.
 */
function createRewordScatterPlot(interventionTypes, samples, targetElementId) {
  const canvasElement = document.getElementById(targetElementId);
  if (!canvasElement) {
    console.error(`Element with ID "${targetElementId}" not found.`);
    return;
  }
  const ctx = canvasElement.getContext('2d'); // Get context from the canvas element
  if (!ctx) {
      console.error(`Could not get 2D context for canvas with ID "${targetElementId}".`);
      return;
  }
  if (typeof Chart === 'undefined') {
      console.error("Chart.js is not loaded. Make sure the Chart.js library is included before this script.");
      canvasElement.textContent = "Error: Chart.js library not loaded.";
      canvasElement.style.color = '#C62828'; // Use a visible error color
      return;
  }

  // Define a consistent color map - Updated 'concise'
  const interventionColorMap = {
    'base':        'hsla(120, 70%, 60%, 0.8)', // Greenish
    'paraphrased': 'hsla(0, 70%, 60%, 0.8)',   // Reddish
    'concise':     'hsla(210, 70%, 60%, 0.8)', // Light Blue (Hue 210)
    'unparaphrased': 'hsla(240, 70%, 60%, 0.8)' // Bluish
    // Add other types if needed
  };
  // Helper to get color or a default grey
  const getColor = (type) => interventionColorMap[type] || 'hsla(0, 0%, 50%, 0.8)';

  const datasets = [];
  const averageRatioData = {}; // Object to store sum of ratios and counts per type

  interventionTypes.forEach((type, index) => { // Index is no longer needed for color
    const dataPoints = [];
    averageRatioData[type] = { sum: 0, count: 0 }; // Initialize data for this type

    samples.forEach(sample => {
      const interventionData = sample[type];
      if (interventionData && interventionData.rewordings) {
        interventionData.rewordings.forEach(([original, reworded]) => {
          const originalText = original || "";
          const rewordedText = reworded || "";
          if (originalText.length > 0) { // Avoid points with zero original length
             const ratio = rewordedText.length / originalText.length;
             dataPoints.push({
               x: originalText.length,
               y: rewordedText.length
             });
             averageRatioData[type].sum += ratio;
             averageRatioData[type].count += 1;
          }
        });
      } else {
         console.warn(`No data found for intervention type "${type}" in one or more samples.`);
      }
    });

    // Get color from the map
    const color = getColor(type);
    datasets.push({
      label: type.charAt(0).toUpperCase() + type.slice(1),
      data: dataPoints,
      backgroundColor: color, // Use mapped color
      borderColor: color.replace('0.8', '1'), // Use mapped color
      pointRadius: 5,
      pointHoverRadius: 7,
    });
  });

  // Find max length for setting axis limits dynamically
  let maxLength = 0;
  datasets.forEach(dataset => {
    dataset.data.forEach(point => {
        maxLength = Math.max(maxLength, point.x, point.y);
    });
  });
  const axisLimit = Math.ceil(maxLength * 1.1 / 100) * 100;

  // Add the y=x reference line dataset
  const referenceLineDataset = {
    label: 'y = x (Equal Length)',
    data: [{x: 0, y: 0}, {x: axisLimit, y: axisLimit}],
    type: 'line',
    borderColor: 'rgba(100, 100, 100, 0.5)',
    borderWidth: 1,
    borderDash: [5, 5],
    pointRadius: 0,
    fill: false,
    tension: 0,
    showLine: true,
    pointHitRadius: 0,
    pointHoverRadius: 0,
    hoverBorderWidth: 1,
    hoverBackgroundColor: 'transparent',
    hoverBorderColor: 'rgba(100, 100, 100, 0.5)',
  };
  datasets.unshift(referenceLineDataset);

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
                label += `(Original: ${context.parsed.x}, Reworded: ${context.parsed.y})`;
              }
              return label;
            }
          }
        },
        title: {
            display: true,
            text: 'Original vs. Reworded Chunk Length by Intervention Type'
        }
      },
      scales: {
        x: {
          type: 'linear',
          position: 'bottom',
          title: { display: true, text: 'Original Chunk Length (characters)' },
          min: 0,
          max: axisLimit
        },
        y: {
          title: { display: true, text: 'Reworded Chunk Length (characters)' },
          min: 0,
          max: axisLimit
        }
      },
      aspectRatio: 1
    }
  };

  new Chart(ctx, config);

  // --- Add Average Ratio Display ---
  let averagesHtml = `<div style="text-align: center;"><span style="font-size: 0.8em;">Average Reword Ratio (Reworded Length / Original Length):</span><br>`;
  interventionTypes.forEach(type => {
      const data = averageRatioData[type];
      const average = data.count > 0 ? (data.sum / data.count) : 0;
      // Get the color from the map again for the text
      const color = getColor(type).replace('0.8', '1'); // Use border color opacity

      averagesHtml += `<span style="color: ${color}; margin: 0 10px; display: inline-block;">${type.charAt(0).toUpperCase() + type.slice(1)}: ${average.toFixed(2)}</span>`;
  });
  averagesHtml += '</div>';

  // Find the container div that holds the canvas
  const canvasContainer = canvasElement.parentNode;

  // Check if the averages div already exists, if so, update it, otherwise create it
  let averagesDiv = document.getElementById(targetElementId + '-averages');
  if (!averagesDiv) {
      averagesDiv = document.createElement('div');
      averagesDiv.id = targetElementId + '-averages';
      // Remove inline margin-top style
      // averagesDiv.style.marginTop = '15px';
      // Insert the averages div *after* the canvas's container element
      if (canvasContainer && canvasContainer.parentNode) {
          canvasContainer.parentNode.insertBefore(averagesDiv, canvasContainer.nextSibling);
      } else {
          // Fallback if the structure is unexpected
          console.warn("Could not find canvas container to insert averages div after.");
          document.body.appendChild(averagesDiv); // Append to body as a last resort
      }
  }
  averagesDiv.innerHTML = averagesHtml;
}
