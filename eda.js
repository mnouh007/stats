import { getColumn, getPairedNumericData } from './utils.js';
import { state } from './data.js';

/**
 * Generates configuration for a histogram.
 * @param {string} varName - The name of the numerical variable.
 * @returns {object} Chart.js config object.
 */
function generateHistogramConfig(varName) {
    const data = getColumn(varName, 'numeric');
    const min = ss.min(data);
    const max = ss.max(data);
    const numBins = Math.ceil(Math.sqrt(data.length));
    const binWidth = (max - min) / numBins;

    const bins = new Array(numBins).fill(0);
    const labels = new Array(numBins);

    for (let i = 0; i < numBins; i++) {
        labels[i] = `${(min + i * binWidth).toFixed(2)} - ${(min + (i + 1) * binWidth).toFixed(2)}`;
    }

    data.forEach(value => {
        let binIndex = Math.floor((value - min) / binWidth);
        if (binIndex === numBins) binIndex--; // Include max value in the last bin
        bins[binIndex]++;
    });

    return {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: `Frequency of ${varName}`,
                data: bins,
                backgroundColor: 'rgba(0, 123, 255, 0.5)',
                borderColor: 'rgba(0, 123, 255, 1)',
                borderWidth: 1
            }]
        },
        options: { scales: { y: { beginAtZero: true } } }
    };
}

/**
 * Generates configuration for a bar chart.
 * @param {string} varName - The name of the categorical variable.
 * @returns {object} Chart.js config object.
 */
function generateBarChartConfig(varName) {
    const data = getColumn(varName);
    const frequencies = ss.frequency(data);
    const labels = Object.keys(frequencies);
    const values = Object.values(frequencies);

    return {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: `Count of ${varName}`,
                data: values,
                backgroundColor: 'rgba(23, 162, 184, 0.5)',
                borderColor: 'rgba(23, 162, 184, 1)',
                borderWidth: 1
            }]
        },
        options: { scales: { y: { beginAtZero: true } } }
    };
}

/**
 * Generates configuration for a scatter plot.
 * @param {string} var1 - Independent variable (X).
 * @param {string} var2 - Dependent variable (Y).
 * @returns {object} Chart.js config object.
 */
function generateScatterPlotConfig(var1, var2) {
    const { values1, values2 } = getPairedNumericData(var1, var2);
    const points = values1.map((val, i) => ({ x: val, y: values2[i] }));
    
    return {
        type: 'scatter',
        data: {
            datasets: [{
                label: `${var1} vs. ${var2}`,
                data: points,
                backgroundColor: 'rgba(40, 167, 69, 0.7)'
            }]
        },
        options: {
            scales: {
                x: { title: { display: true, text: var1 } },
                y: { title: { display: true, text: var2 } }
            }
        }
    };
}

/**
 * Generates configuration for a box plot.
 * @param {string} varName - The numerical variable.
 * @returns {object} Chart.js config object.
 */
function generateBoxPlotConfig(varName) {
    const data = getColumn(varName, 'numeric').sort((a, b) => a - b);
    
    return {
        type: 'bar', // Chart.js v3+ uses bar for boxplot data
        data: {
            labels: [varName],
            datasets: [{
                label: `Distribution of ${varName}`,
                data: [{
                    min: ss.min(data),
                    q1: ss.quantile(data, 0.25),
                    median: ss.median(data),
                    q3: ss.quantile(data, 0.75),
                    max: ss.max(data)
                }],
                backgroundColor: 'rgba(255, 193, 7, 0.5)',
                borderColor: 'rgba(255, 193, 7, 1)',
                borderWidth: 1,
                // This makes it a boxplot
                parsing: {
                    "min-max": "minmax",
                    "quartiles": "quartiles",
                }
            }]
        },
        options: {
             indexAxis: 'y', // Horizontal boxplot
        }
    };
}

/**
 * Master function to generate any EDA plot.
 * @param {string} plotType 
 * @param {string} var1 
 * @param {string} var2 
 * @returns {object|null} Chart.js config or null on failure.
 */
export function generatePlot(plotType, var1, var2) {
    if (!var1) return null;

    switch (plotType) {
        case 'histogram':
            return generateHistogramConfig(var1);
        case 'bar':
            return generateBarChartConfig(var1);
        case 'scatter':
            if (!var2) return null;
            return generateScatterPlotConfig(var1, var2);
        case 'boxplot':
            return generateBoxPlotConfig(var1);
        default:
            return null;
    }
}