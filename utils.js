import { state } from './data.js';

/**
 * Retrieves a column's data from the parsed dataset.
 * @param {string} columnName - The header name of the column.
 * @param {string} type - 'numeric' to convert values to numbers, otherwise 'string'.
 * @returns {Array} - An array of values from the column.
 */
export function getColumn(columnName, type = 'string') {
    const data = state.parsedData.map(row => row[columnName]);
    if (type === 'numeric') {
        return data.map(Number).filter(n => !isNaN(n));
    }
    return data.filter(v => v !== null && v !== undefined);
}

/**
 * Retrieves data for two columns, excluding rows where either value is missing.
 * This is crucial for correlation and regression.
 * @param {string} colName1 
 * @param {string} colName2 
 * @returns {{values1: number[], values2: number[]}}
 */
export function getPairedNumericData(colName1, colName2) {
    const values1 = [];
    const values2 = [];

    state.parsedData.forEach(row => {
        const val1 = Number(row[colName1]);
        const val2 = Number(row[colName2]);

        if (!isNaN(val1) && !isNaN(val2)) {
            values1.push(val1);
            values2.push(val2);
        }
    });

    return { values1, values2 };
}