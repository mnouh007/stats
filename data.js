export const state = {
    fileName: null,
    rawData: [],
    parsedData: [],
    headers: [],
    columnTypes: {}, // { columnName: 'numeric' | 'categorical' }
    analysisLog: [], // To store text summaries of actions
};

/**
 * Parses a CSV file and updates the application state.
 * @param {File} file - The CSV file to parse.
 */
export function parseCSV(file) {
    return new Promise((resolve, reject) => {
        state.fileName = file.name;
        const reader = new FileReader();

        reader.onload = (event) => {
            try {
                const text = event.target.result;
                const rows = text.split(/\r?\n/).filter(row => row.trim() !== '');
                
                state.rawData = rows;
                state.headers = rows[0].split(',').map(h => h.trim());
                state.parsedData = rows.slice(1).map(row => {
                    const values = row.split(',');
                    let obj = {};
                    state.headers.forEach((header, i) => {
                        obj[header] = values[i] ? values[i].trim() : null;
                    });
                    return obj;
                });
                
                inferColumnTypes();
                calculateBasicStats();
                state.analysisLog = [`Dataset "${state.fileName}" loaded.`];
                resolve();
            } catch (error) {
                console.error("Error parsing CSV:", error);
                reject(new Error("Failed to parse the CSV file. Please ensure it is correctly formatted."));
            }
        };

        reader.onerror = (error) => {
            console.error("FileReader error:", error);
            reject(new Error("Failed to read the file."));
        };

        reader.readAsText(file);
    });
}

/**
 * Infers column types (numeric or categorical) based on content.
 */
function inferColumnTypes() {
    state.columnTypes = {};
    state.headers.forEach(header => {
        let isNumeric = true;
        let uniqueValues = new Set();
        
        for (const row of state.parsedData) {
            const value = row[header];
            if (value !== null && value !== "") {
                 uniqueValues.add(value);
                if (isNaN(Number(value))) {
                    isNumeric = false;
                }
            }
        }
        
        // Heuristic: If more than half are numbers and unique values are not too few, it's numeric.
        // A column with very few unique numbers might be a category (e.g., rating 1-5).
        if (isNumeric && uniqueValues.size > 10) {
             state.columnTypes[header] = 'numeric';
        } else {
            state.columnTypes[header] = 'categorical';
        }
    });
}

/**
 * Calculates basic summary statistics for each column.
 */
function calculateBasicStats() {
    state.basicStats = {};
    state.headers.forEach(header => {
        const values = state.parsedData.map(row => row[header]).filter(v => v !== null && v !== '');
        const stats = {
            count: values.length,
            missing: state.parsedData.length - values.length,
        };

        if (state.columnTypes[header] === 'numeric') {
            const numericValues = values.map(Number);
            stats.mean = ss.mean(numericValues).toFixed(2);
            stats.median = ss.median(numericValues).toFixed(2);
            stats.stdDev = ss.standardDeviation(numericValues).toFixed(2);
            stats.min = ss.min(numericValues);
            stats.max = ss.max(numericValues);
        } else {
            const frequencies = ss.frequency(values);
            stats.unique = Object.keys(frequencies).length;
            stats.top = Object.keys(frequencies).reduce((a, b) => frequencies[a] > frequencies[b] ? a : b);
        }
        state.basicStats[header] = stats;
    });
}

/**
 * Logs an analysis step for the final report.
 * @param {string} entry - The analysis summary to log.
 */
export function logAnalysis(entry) {
    state.analysisLog.push(entry);
}