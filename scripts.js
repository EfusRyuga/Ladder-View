const fileSelector = document.getElementById('file-selector');
const trancheSelector = document.getElementById('tranche-selector');
const jsonContentDiv = document.getElementById('json-content');

const headers = ['Tranche', 'Feca', 'Osamodas', 'Enutrof', 'Sram', 'Xelor', 'Ecaflip', 'Eniripsa', 'Iop', 'Cra', 'Sadida', 'Sacrieur', 'Pandawa', 'Roublard', 'Zobal', 'Ouginak', 'Steamer', 'Eliotrope', 'Huppermage'];

// Store previously selected tranche for each file
const selectedTranches = {};

// Function to fetch JSON data
async function fetchData(filePath) {
    try {
        const response = await fetch(filePath);
        if (!response.ok) throw new Error('Network response was not ok');
        return await response.json();
    } catch (error) {
        console.error('Error fetching JSON:', error);
        return {};
    }
}

// Function to generate table from JSON data
function generateTable(data, includeTotal = false) {
    const table = document.createElement('table');
    const thead = document.createElement('thead');
    const tbody = document.createElement('tbody');

    // Create table header
    const headerRow = document.createElement('tr');
    headers.forEach(headerText => {
        const th = document.createElement('th');
        th.textContent = headerText;
        headerRow.appendChild(th);
    });
    thead.appendChild(headerRow);

    // Create table rows
    let totalSum = headers.slice(1).reduce((acc, header) => ({ ...acc, [header.toLowerCase()]: 0 }), {});
    let rows = [];

    Object.keys(data).forEach(key => {
        const values = data[key];
        const row = document.createElement('tr');
        const cellValues = [];

        const tdKey = document.createElement('td');
        tdKey.textContent = key;
        row.appendChild(tdKey);

        headers.slice(1).forEach(header => {
            const td = document.createElement('td');
            const value = values[header.toLowerCase()] || 0;
            td.textContent = value;
            cellValues.push(value);
            row.appendChild(td);
            totalSum[header.toLowerCase()] += value;
        });

        // Apply coloring based on values
        const sortedValues = [...cellValues].sort((a, b) => b - a);
        const getClassForValue = (value) => {
            const index = sortedValues.indexOf(value);
            if (index === 0) return 'gold';
            if (index === 1) return 'silver';
            if (index === 2) return 'bronze';
            if (index < 10) return 'light-green';
            if (index < 15) return 'light-red';
            if (index >= 15) return 'heavy-red';
            return '';
        };

        row.childNodes.forEach((cell, i) => {
            if (i > 0) { // Skip the first cell (tranche key)
                cell.classList.add(getClassForValue(cellValues[i - 1]));
            }
        });

        tbody.appendChild(row);
        rows.push(row); // Store row for later
    });

    // Add a row for total if required
    if (includeTotal) {
        const totalRow = document.createElement('tr');
        const totalKey = document.createElement('td');
        totalKey.textContent = 'Total';
        totalRow.appendChild(totalKey);

        headers.slice(1).forEach(header => {
            const td = document.createElement('td');
            td.textContent = totalSum[header.toLowerCase()] || 0;
            totalRow.appendChild(td);
        });

        // Apply coloring based on values for the total row
        const cellValues = Object.values(totalSum);
        const sortedValues = [...cellValues].sort((a, b) => b - a);
        const getClassForValue = (value) => {
            const index = sortedValues.indexOf(value);
            if (index === 0) return 'gold';
            if (index === 1) return 'silver';
            if (index === 2) return 'bronze';
            if (index < 10) return 'light-green';
            if (index < 15) return 'light-red';
            if (index >= 15) return 'heavy-red';
            return '';
        };

        totalRow.childNodes.forEach((cell, i) => {
            if (i > 0) { // Skip the first cell (tranche key)
                cell.classList.add(getClassForValue(cellValues[i - 1]));
            }
        });

        tbody.appendChild(totalRow);
    }

    table.appendChild(thead);
    table.appendChild(tbody);
    return table;
}

// Function to update file selector
function updateFileSelector(files) {
    fileSelector.innerHTML = ''; // Clear previous options
    files.forEach(file => {
        fileSelector.appendChild(new Option(file.display_name, file.path));
    });
}

// Function to update tranche selector
function updateTrancheSelector(data) {
    trancheSelector.innerHTML = ''; // Clear previous options
    trancheSelector.appendChild(new Option('Show All', 'show-all'));
    if (data) {
        Object.keys(data).forEach(key => {
            if (key !== 'Total') {
                trancheSelector.appendChild(new Option(key, key));
            }
        });
        trancheSelector.appendChild(new Option('Total', 'total'));
    }
}

// Function to load files
async function loadFiles() {
    try {
        // Update file selector with predefined options
        const files = [
            { path: './ogrest/08-2024.json', display_name: '08-2024 (Ogrest)' },
            { path: './rubilax/08-2024.json', display_name: '08-2024 (Rubilax)' },
            { path: './pandora/08-2024.json', display_name: '08-2024 (Pandora)' }
        ];

        updateFileSelector(files);
        fileSelector.value = files[0].path;

        // Load initial file
        await loadFileContent(files[0].path);
    } catch (error) {
        console.error('Error loading files:', error);
    }
}

// Function to load file content
async function loadFileContent(filePath) {
    const previousTranche = trancheSelector.value;
    const data = await fetchData(filePath);
    updateTrancheSelector(data);

    // Set tranche selector to 'Show All' and display the data
    trancheSelector.value = 'show-all';
    displayJson(data, true);

    // Restore the previous tranche after a delay to ensure 'Show All' is applied
    setTimeout(() => {
        trancheSelector.value = selectedTranches[filePath] || 'show-all';
        displayJson(data, trancheSelector.value === 'show-all');
    }, 0);
}

// Function to display JSON data
function displayJson(data, includeTotal = false) {
    jsonContentDiv.innerHTML = ''; // Clear previous content
    const table = generateTable(data, includeTotal);
    jsonContentDiv.appendChild(table);
}

// Handle file selector change
fileSelector.addEventListener('change', function() {
    loadFileContent(this.value);
});

// Handle tranche selector change
trancheSelector.addEventListener('change', function() {
    const selectedTranche = this.value;
    const filePath = fileSelector.value;

    // Save the selected tranche for the current file
    selectedTranches[filePath] = selectedTranche;

    fetchData(filePath).then(data => {
        if (selectedTranche === 'show-all') {
            const totalData = Object.values(data).reduce((acc, tranche) => {
                Object.keys(tranche).forEach(key => {
                    acc[key] = (acc[key] || 0) + tranche[key];
                });
                return acc;
            }, {});

            displayJson({ ...data, 'Total': totalData }, true);
        } else if (selectedTranche === 'total') {
            const totalData = Object.values(data).reduce((acc, tranche) => {
                Object.keys(tranche).forEach(key => {
                    acc[key] = (acc[key] || 0) + tranche[key];
                });
                return acc;
            }, {});

            displayJson({ 'Total': totalData }, false);
        } else {
            displayJson({ [selectedTranche]: data[selectedTranche] });
        }
    });
});

// Initialize
loadFiles();
