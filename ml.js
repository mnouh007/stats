import { getPairedNumericData } from './utils.js';

/**
 * Performs a simple linear regression.
 * @param {string} independentVar (X)
 * @param {string} dependentVar (Y)
 * @returns {object} Model results and visualization config.
 */
export function runLinearRegression(independentVar, dependentVar) {
    const { values1: x, values2: y } = getPairedNumericData(independentVar, dependentVar);

    if (x.length < 2) {
        throw new Error("Not enough data to perform regression. At least 2 paired data points are required.");
    }

    const regressionLine = ss.linearRegressionLine(ss.linearRegression(x.map((val, i) => [val, y[i]])));
    const rSquared = ss.rSquared(x.map((val, i) => [val, y[i]]), regressionLine);

    const predictedY = x.map(regressionLine);
    const residuals = y.map((val, i) => val - predictedY[i]);
    const mse = ss.mean(residuals.map(r => r * r));
    const rmse = Math.sqrt(mse);
    
    let summary = `Simple Linear Regression Results\n`;
    summary += `------------------------------------\n`;
    summary += `Dependent Variable (Y): ${dependentVar}\n`;
    summary += `Independent Variable (X): ${independentVar}\n\n`;
    summary += `Equation: Y = ${regressionLine.m.toFixed(4)} * X + ${regressionLine.b.toFixed(4)}\n\n`;
    summary += `R-squared (R²): ${rSquared.toFixed(4)}\n`;
    summary += `Mean Squared Error (MSE): ${mse.toFixed(4)}\n`;
    summary += `Root Mean Squared Error (RMSE): ${rmse.toFixed(4)}\n\n`;
    summary += `Interpretation:\n`;
    summary += `The R-squared value indicates that ${Math.round(rSquared * 100)}% of the variance in '${dependentVar}' can be explained by '${independentVar}'.\n`;
    summary += `For every one-unit increase in '${independentVar}', '${dependentVar}' is predicted to ${regressionLine.m > 0 ? 'increase' : 'decrease'} by ${Math.abs(regressionLine.m).toFixed(4)} units.`;
    
    // Create points for the regression line visualization
    const minX = ss.min(x);
    const maxX = ss.max(x);
    const linePoints = [
        { x: minX, y: regressionLine(minX) },
        { x: maxX, y: regressionLine(maxX) }
    ];

    const scatterPoints = x.map((val, i) => ({ x: val, y: y[i] }));
    
    const visualization = {
        type: 'scatter',
        data: {
            datasets: [{
                label: 'Data Points',
                data: scatterPoints,
                backgroundColor: 'rgba(0, 123, 255, 0.6)',
                type: 'scatter'
            }, {
                label: 'Regression Line',
                data: linePoints,
                borderColor: 'rgba(220, 53, 69, 1)',
                backgroundColor: 'rgba(220, 53, 69, 1)',
                type: 'line',
                fill: false,
                borderWidth: 2,
                pointRadius: 0
            }]
        },
        options: {
            scales: {
                x: { title: { display: true, text: independentVar } },
                y: { title: { display: true, text: dependentVar } }
            }
        }
    };
    
    return { summary, visualization };
}