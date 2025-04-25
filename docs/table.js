/**
 * Creates a styled HTML table displaying boolean data as checkmarks and crosses,
 * including a column showing the percentage of true values for each row.
 *
 * @param {string[]} titles - An array of strings for the row headers (left column).
 * @param {boolean[][]} dataArrays - An array of arrays. Each inner array corresponds
 *                                   to a title and contains boolean values. All inner
 *                                   arrays MUST have the same length.
 * @param {string} containerId - The ID of the HTML element to render the table into.
 */
function createBooleanTable(titles, dataArrays, containerId) {
  const container = document.getElementById(containerId);
  if (!container) {
    console.error('createBooleanTable: No container found with id=', containerId);
    return;
  }

  // --- Basic Validation ---
  if (!titles || !dataArrays || titles.length === 0 || dataArrays.length === 0) {
      console.error('createBooleanTable: Titles or dataArrays are empty.');
      container.textContent = 'Error: Missing data for table.';
      return;
  }
  if (titles.length !== dataArrays.length) {
      console.error('createBooleanTable: Mismatch between number of titles and data arrays.');
      container.textContent = 'Error: Data structure mismatch.';
      return;
  }
  const numCols = dataArrays[0].length;
  if (numCols === 0) {
      console.error('createBooleanTable: Data arrays are empty.');
      container.textContent = 'Error: No data columns.';
      return;
  }
  if (!dataArrays.every(arr => arr.length === numCols)) {
      console.error('createBooleanTable: Data arrays have inconsistent lengths.');
      container.textContent = 'Error: Inconsistent data columns.';
      return;
  }

  // --- Apply Container Styles (ONLY for centering) ---
  Object.assign(container.style, {
    fontFamily: 'Georgia, serif', // Keep font family
    display: 'flex',
    justifyContent: 'center',
    marginBottom: '25px'
    // Base font size can remain default or be slightly adjusted if needed
  });

  // --- Create Table Elements ---
  const table = document.createElement('table');
  Object.assign(table.style, {
    // Visual styles
    color: '#333',
    padding: '20px', // Padding will also scale down visually
    backgroundColor: '#FAF0E6',
    borderRadius: '8px', // Radius will also scale
    boxShadow: '0 2px 6px rgba(0,0,0,0.1)', // Shadow will also scale
    // Table structure styles
    borderCollapse: 'separate',
    borderSpacing: 0,
    fontSize: '1em', // Keep relative font size
    flexShrink: 0,
    // --- SCALING ---
    transform: 'scale(0.75)',
    transformOrigin: 'center center' // Scale from the center
    // overflow: 'hidden', // Optional: Uncomment if needed
  });

  const thead = table.createTHead();
  const headerRow = thead.insertRow();

  // --- Create Table Header ---
  // Top-left empty cell
  const thCorner = document.createElement('th');
   Object.assign(thCorner.style, {
        border: '1px solid #d2c4a9',
        padding: '8px 12px',
        textAlign: 'left',
        backgroundColor: '#EADDCA', // Keep header bg distinct
        color: '#5a4a3f',
        fontWeight: 'bold',
        // Apply top-left radius manually if using border-collapse: separate
        borderTopLeftRadius: '8px'
   });
  headerRow.appendChild(thCorner);

  // --- NEW: Header for Percentage Column ---
  const thPercent = document.createElement('th');
  thPercent.textContent = '% Correct'; // Or 'Accuracy', 'Score', etc.
  Object.assign(thPercent.style, {
      border: '1px solid #d2c4a9',
      borderTopStyle: 'solid',
      borderBottomStyle: 'solid',
      borderLeftStyle: 'none', // No left border
      borderRightStyle: 'solid',
      padding: '8px 12px',
      textAlign: 'center',
      backgroundColor: '#EADDCA',
      color: '#5a4a3f',
      fontWeight: 'bold', // Make percentage header bold
      minWidth: '70px' // Give it some space
  });
  headerRow.appendChild(thPercent);

  // Column number headers (1 to N)
  for (let j = 0; j < numCols; j++) {
    const th = document.createElement('th');
    th.textContent = j + 1;
    Object.assign(th.style, {
        border: '1px solid #d2c4a9',
        borderTopStyle: 'solid', // Ensure top border is visible
        borderBottomStyle: 'solid',
        borderLeftStyle: 'none', // Changed: No left border for number headers either
        borderRightStyle: 'solid',
        padding: '8px 12px',
        textAlign: 'center',
        backgroundColor: '#EADDCA',
        color: '#5a4a3f',
        fontWeight: 'normal',
        minWidth: '30px'
    });
     // Apply top-right radius to the last header cell
    if (j === numCols - 1) {
       th.style.borderTopRightRadius = '8px';
    }
    headerRow.appendChild(th);
  }

  // --- Create Table Body ---
  const tbody = table.createTBody();
  titles.forEach((title, i) => {
    const row = tbody.insertRow();
    const isLastRow = (i === titles.length - 1);
    const dataRow = dataArrays[i]; // Get the data for this row

    // --- Calculate Percentage ---
    const numTrue = dataRow.filter(val => val === true).length;
    const percentage = numCols > 0 ? (numTrue / numCols) * 100 : 0;
    const formattedPercent = percentage.toFixed(1) + '%'; // Format to one decimal place

    // Row Header (Title)
    const thTitle = document.createElement('th');
    thTitle.textContent = title;
    thTitle.scope = 'row';
    Object.assign(thTitle.style, {
        border: '1px solid #d2c4a9',
        borderTopStyle: 'none', // Remove top border except for first body row if needed
        borderBottomStyle: 'solid',
        borderLeftStyle: 'solid',
        borderRightStyle: 'solid',
        padding: '8px 12px',
        textAlign: 'left',
        backgroundColor: '#EADDCA',
        color: '#5a4a3f',
        fontWeight: 'bold'
    });
     // Apply bottom-left radius to the first header of the last row
    if (isLastRow) {
       thTitle.style.borderBottomLeftRadius = '8px';
    }
    row.appendChild(thTitle);

    // --- NEW: Percentage Cell ---
    const tdPercent = row.insertCell();
    tdPercent.textContent = formattedPercent;
    Object.assign(tdPercent.style, {
        border: '1px solid #d2c4a9',
        borderTopStyle: 'none',
        borderBottomStyle: 'solid',
        borderLeftStyle: 'none', // No left border
        borderRightStyle: 'solid',
        padding: '8px 12px',
        textAlign: 'center', // Center the percentage
        color: '#5a4a3f', // Use header text color for emphasis
        fontWeight: 'normal' // Or 'bold' if preferred
    });
     // Apply bottom radius if it's the last row (before checkmarks start)
     if (isLastRow) {
        // Note: This assumes the percentage column is NOT the very last column.
        // If checkmarks could be empty, radius logic might need adjustment.
        // tdPercent.style.borderBottomRightRadius = '0'; // Ensure it doesn't get radius
     }

    // Data Cells (Checkmarks/Crosses)
    dataRow.forEach((value, j) => {
      const cell = row.insertCell();
      cell.textContent = value ? '✅' : '❌';
      Object.assign(cell.style, {
        border: '1px solid #d2c4a9',
         borderTopStyle: 'none', // Remove top border for data cells
         borderBottomStyle: 'solid',
         borderLeftStyle: 'none', // Remove left border for data cells
         borderRightStyle: 'solid',
        padding: '8px 12px',
        textAlign: 'center',
        color: value ? '#2E7D32' : '#C62828',
        fontSize: '1.1em' // Keep this relative, it will scale with the table
      });
      // Apply bottom-right radius to the last cell of the last row
      if (isLastRow && j === numCols - 1) {
         cell.style.borderBottomRightRadius = '8px';
      }
    });
  });

  // --- Render Table ---
  container.innerHTML = '';
  container.appendChild(table);
}
