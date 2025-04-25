/**
 * Creates a styled HTML visualization for McNemar's exact test results.
 *
 * @param {number[][]} contingencyTable - A 2x2 array representing the contingency table counts.
 *                                        Should be in the format: [[a, b], [c, d]] where:
 *                                        a: Count where both tests were condition 1 (e.g., correct)
 *                                        b: Count where test 1 was condition 1, test 2 was condition 2
 *                                        c: Count where test 1 was condition 2, test 2 was condition 1
 *                                        d: Count where both tests were condition 2 (e.g., incorrect)
 *                                        NOTE: McNemar focuses on b and c (discordant pairs).
 * @param {number} statistic - The calculated statistic (often the smaller discordant count for exact test, or Chi-squared approx.).
 * @param {number} pValue - The calculated exact p-value.
 * @param {string} containerId - The ID of the HTML element to render the visualization into.
 * @param {string} [title="McNemar's Exact Test Results"] - Optional title for the visualization.
 * @param {string} [condition1Label="Correct"] - Label for the first condition (e.g., rows/cols where outcome is true/positive).
 * @param {string} [condition2Label="Incorrect"] - Label for the second condition (e.g., rows/cols where outcome is false/negative).
 * @param {string} [test1Name="Test 1"] - Name for the first test/condition being compared.
 * @param {string} [test2Name="Test 2"] - Name for the second test/condition being compared.
 */
function createMcNemarViz(
    contingencyTable,
    statistic,
    pValue,
    containerId,
    title = "McNemar's Exact Test Results",
    condition1Label = "Correct",
    condition2Label = "Incorrect",
    test1Name = "Test 1",
    test2Name = "Test 2"
) {
    const container = document.getElementById(containerId);
    if (!container) { /* ... error handling ... */ return; }

    // --- Basic Validation ---
    if (!contingencyTable || contingencyTable.length !== 2 || !contingencyTable[0] || contingencyTable[0].length !== 2 || !contingencyTable[1] || contingencyTable[1].length !== 2 || typeof statistic !== 'number' || typeof pValue !== 'number') { /* ... */ console.error('createMcNemarViz: Invalid input data.', { contingencyTable, statistic, pValue }); container.textContent = 'Error: Invalid data for McNemar visualization.'; container.style.color = '#C62828'; container.style.fontFamily = 'Georgia, serif'; return; }

    const [a, b] = contingencyTable[0];
    const [c, d] = contingencyTable[1];

    // --- Apply Container Styles ---
    Object.assign(container.style, { /* ... */ fontFamily: 'Georgia, serif', color: '#333', padding: '20px', backgroundColor: '#FAF0E6', borderRadius: '8px', boxShadow: '0 2px 6px rgba(0,0,0,0.1)', marginBottom: '25px', border: '1px solid #d2c4a9' });

    // --- Clear previous content ---
    container.innerHTML = '';

    // --- Title ---
    if (title) { /* ... Title creation ... */ const titleElement = document.createElement('h4'); titleElement.textContent = title; Object.assign(titleElement.style, { marginTop: '0', marginBottom: '1.5em', color: '#5a4a3f', textAlign: 'center', borderBottom: '1px solid #d2c4a9', paddingBottom: '0.5em' }); container.appendChild(titleElement); }

    // --- 2x2 Table Visualization ---
    const tableContainer = document.createElement('div');
    Object.assign(tableContainer.style, { display: 'flex', justifyContent: 'center', marginBottom: '1.5em' });

    const table = document.createElement('table');
    Object.assign(table.style, {
        borderCollapse: 'separate',
        borderSpacing: 0,
        backgroundColor: '#fffcf5',
        fontSize: '0.9em',
        textAlign: 'center',
        borderRadius: '6px',
        overflow: 'hidden',
        border: '1px solid #d2c4a9'
    });

    const cellBorderStyle = '1px solid #d2c4a9';
    const headerCellStyle = { padding: '6px 10px', backgroundColor: '#EADDCA', color: '#5a4a3f', border: 'none' };
    const dataCellStyle = { padding: '6px 10px', border: 'none' };
    const discordantCellStyle = { ...dataCellStyle, backgroundColor: '#FFF9C4'};

    // --- Revised Header Structure ---
    const thead = table.createTHead();

    // Header Row 1: Top-Left Corner and Test 2 Name
    const headerRow1 = thead.insertRow();
    // Top-left corner: Spans the first two columns (Vertical Header + Row Label)
    const thTopLeft = document.createElement('th');
    thTopLeft.colSpan = 2;
    Object.assign(thTopLeft.style, { ...headerCellStyle, borderBottom: cellBorderStyle, borderRight: cellBorderStyle });
    headerRow1.appendChild(thTopLeft);
    // Main header for Test 2: Spans the last two columns (Data Col 1 + Data Col 2)
    const thTest2Name = document.createElement('th');
    thTest2Name.colSpan = 2;
    thTest2Name.textContent = test2Name;
    Object.assign(thTest2Name.style, { ...headerCellStyle, fontWeight: 'bold', borderBottom: cellBorderStyle });
    headerRow1.appendChild(thTest2Name);

    // Header Row 2: Spacers and Test 2 Condition Labels
    const headerRow2 = thead.insertRow();
    // Spacer cell under top-left (for Vertical Header column)
    const thSpacer1 = document.createElement('th');
    Object.assign(thSpacer1.style, { ...headerCellStyle, borderBottom: cellBorderStyle, borderRight: cellBorderStyle });
    headerRow2.appendChild(thSpacer1);
    // Spacer cell under top-left (for Row Label column)
    const thSpacer2 = document.createElement('th');
    Object.assign(thSpacer2.style, { ...headerCellStyle, borderBottom: cellBorderStyle, borderRight: cellBorderStyle });
    headerRow2.appendChild(thSpacer2);
    // Test 2 Condition 1 Label (aligns with Data Col 1)
    const thTest2Cond1 = document.createElement('th');
    thTest2Cond1.textContent = condition1Label;
    Object.assign(thTest2Cond1.style, { ...headerCellStyle, fontWeight: 'normal', borderBottom: cellBorderStyle, borderRight: cellBorderStyle });
    headerRow2.appendChild(thTest2Cond1);
    // Test 2 Condition 2 Label (aligns with Data Col 2)
    const thTest2Cond2 = document.createElement('th');
    thTest2Cond2.textContent = condition2Label;
    Object.assign(thTest2Cond2.style, { ...headerCellStyle, fontWeight: 'normal', borderBottom: cellBorderStyle });
    headerRow2.appendChild(thTest2Cond2);

    // --- Body Rows (Structure is now correct relative to the 4-column header) ---
    const tbody = table.createTBody();

    // Vertical Header Cell for Test 1 Name (spans 2 rows)
    const thVerticalTest1Name = document.createElement('th');
    thVerticalTest1Name.setAttribute('rowspan', '2');
    Object.assign(thVerticalTest1Name.style, {
        ...headerCellStyle,
        fontWeight: 'bold',
        textAlign: 'center',
        verticalAlign: 'middle',
        borderRight: cellBorderStyle,
        writingMode: 'vertical-lr',
        transform: 'rotate(180deg)',
        padding: '10px 5px'
    });
    thVerticalTest1Name.textContent = test1Name;

    // Row 1 (Test 1 - Condition 1)
    const row1 = tbody.insertRow();
    row1.appendChild(thVerticalTest1Name);

    // Test 1 Condition 1 Header (Row Label)
    const thRow1Label = document.createElement('th');
    thRow1Label.textContent = condition1Label;
    Object.assign(thRow1Label.style, { ...headerCellStyle, fontWeight: 'normal', textAlign: 'right', borderRight: cellBorderStyle });
    row1.appendChild(thRow1Label);

    // Cell A (Data Col 1)
    const cellA = row1.insertCell(); cellA.textContent = a;
    Object.assign(cellA.style, { ...dataCellStyle, borderRight: cellBorderStyle });

    // Cell B (Data Col 2)
    const cellB = row1.insertCell(); cellB.textContent = b;
    Object.assign(cellB.style, { ...discordantCellStyle });

    // Row 2 (Test 1 - Condition 2)
    const row2 = tbody.insertRow();
    // Vertical header is spanned from row 1

    // Test 1 Condition 2 Header (Row Label)
     const thRow2Label = document.createElement('th');
     thRow2Label.textContent = condition2Label;
     Object.assign(thRow2Label.style, { ...headerCellStyle, fontWeight: 'normal', textAlign: 'right', borderRight: cellBorderStyle, borderTop: cellBorderStyle });
     row2.appendChild(thRow2Label);

    // Cell C (Data Col 1)
    const cellC = row2.insertCell(); cellC.textContent = c;
    Object.assign(cellC.style, { ...discordantCellStyle, borderRight: cellBorderStyle, borderTop: cellBorderStyle });

    // Cell D (Data Col 2)
    const cellD = row2.insertCell(); cellD.textContent = d;
    Object.assign(cellD.style, { ...dataCellStyle, borderTop: cellBorderStyle });

    tableContainer.appendChild(table);
    container.appendChild(tableContainer);

    // --- Results Display ---
    const resultsDiv = document.createElement('div'); /* ... */ Object.assign(resultsDiv.style, { textAlign: 'center', lineHeight: '1.6', color: '#5a4a3f' });
    const pValueFormatted = pValue < 0.0001 ? '< 0.0001' : pValue.toFixed(4);
    resultsDiv.innerHTML = `Discordant Pairs: ${b} vs ${c}<br>Exact p-value = ${pValueFormatted}`;
    container.appendChild(resultsDiv);
}
