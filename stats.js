import { getColumn, getPairedNumericData } from './utils.js';

function formatPValue(p) {
    return p < 0.001 ? "< 0.001" : p.toFixed(4);
}

function getTestSummary(results) {
    let summary = `Test: ${results.testName}\n`;
    summary += `------------------------------\n`;
    if (results.hypothesizedMean !== undefined) summary += `Hypothesized Mean: ${results.hypothesizedMean}\n`;
    if (results.statisticName) summary += `${results.statisticName}: ${results.statisticValue.toFixed(4)}\n`;
    if (results.df) summary += `Degrees of Freedom (df): ${results.df}\n`;
    if (results.pValue !== undefined) summary += `P-value: ${formatPValue(results.pValue)}\n\n`;
    else summary += `\n`;

    if (results.groupStats) {
        summary += "Group Statistics:\n";
        results.groupStats.forEach(g => {
            summary += `  - Group '${g.name}':\n`;
            if (g.n !== undefined) summary += `    - N: ${g.n}\n`;
            if (g.mean !== undefined) summary += `    - Mean: ${g.mean.toFixed(2)}\n`;
            if (g.median !== undefined) summary += `    - Median: ${g.median.toFixed(2)}\n`;
            if (g.stdDev !== undefined) summary += `    - Std Dev: ${g.stdDev.toFixed(2)}\n`;
        });
        summary += `\n`;
    }

    if (results.effectSize) {
        summary += `Effect Size:\n  - ${results.effectSize.name}: ${results.effectSize.value.toFixed(4)}\n\n`;
    }
    
    if (results.correlation) {
        summary += `Pearson's r: ${results.correlation.r.toFixed(4)}\n`;
        summary += `Sample Size (n): ${results.correlation.n}\n\n`;
    }
    
    if (results.contingencyTable) {
        summary += `Contingency Table (Observed):\n${JSON.stringify(results.contingencyTable.data)}\n\n`;
    }
    
    if (results.gofTable) {
        summary += `Goodness-of-Fit Frequencies:\n`;
        summary += `Category\tObserved\tExpected\n`;
        results.gofTable.forEach(row => {
            summary += `${row.category}\t\t${row.observed}\t\t${row.expected.toFixed(2)}\n`;
        });
        summary += `\n`;
    }

    if(results.pValue !== undefined) {
        summary += "Conclusion:\n";
        if (results.pValue < 0.05) {
            summary += `The p-value (${formatPValue(results.pValue)}) is less than 0.05, suggesting a statistically significant result. We reject the null hypothesis.`;
        } else {
            summary += `The p-value (${formatPValue(results.pValue)}) is >= 0.05, so we fail to reject the null hypothesis. There is not enough evidence to conclude a significant effect or association.`;
        }
    }
    return summary;
}

export function performOneSampleTTest(numericalVar, hypothesizedMean) {
    const data = getColumn(numericalVar, 'numeric');
    if (data.length < 2) throw new Error("At least 2 data points are required for a t-test.");

    const t_statistic = ss.tTest(data, hypothesizedMean);

    const results = {
        testName: "One-Sample T-Test",
        hypothesizedMean: hypothesizedMean,
        statisticName: "T-Statistic",
        statisticValue: t_statistic,
        df: data.length - 1,
        pValue: ss.tTest(data, hypothesizedMean, { 'alternative': 'two-sided' }).p,
        groupStats: [{
            name: numericalVar,
            n: data.length,
            mean: ss.mean(data),
            stdDev: ss.standardDeviation(data)
        }]
    };
    results.summary = getTestSummary(results);
    return results;
}

export function performIndependentTTest(numericalVar, categoricalVar) {
    const numericalData = getColumn(numericalVar, 'numeric');
    const categoricalData = getColumn(categoricalVar);

    const categories = [...new Set(categoricalData.filter(v => v))];
    if (categories.length !== 2) throw new Error("Categorical variable must have exactly two groups.");

    const group1 = numericalData.filter((_, i) => categoricalData[i] === categories[0]);
    const group2 = numericalData.filter((_, i) => categoricalData[i] === categories[1]);
    if (group1.length < 2 || group2.length < 2) throw new Error("Each group must have at least 2 data points.");
    
    const tTestResult = ss.tTestTwoSample(group1, group2);
    
    // Calculate Cohen's d for effect size
    const n1 = group1.length, n2 = group2.length;
    const stdDev1 = ss.standardDeviation(group1), stdDev2 = ss.standardDeviation(group2);
    const pooledStdDev = Math.sqrt(((n1 - 1) * stdDev1**2 + (n2 - 1) * stdDev2**2) / (n1 + n2 - 2));
    const cohensD = (ss.mean(group1) - ss.mean(group2)) / pooledStdDev;

    const results = {
        testName: "Independent Samples T-Test",
        statisticName: "T-Statistic",
        statisticValue: tTestResult,
        pValue: ss.tTestTwoSample(group1, group2, { 'alternative': 'two-sided' }).p,
        df: n1 + n2 - 2,
        groupStats: [
            { name: categories[0], n: n1, mean: ss.mean(group1), stdDev: stdDev1 },
            { name: categories[1], n: n2, mean: ss.mean(group2), stdDev: stdDev2 }
        ],
        effectSize: { name: "Cohen's d", value: cohensD },
    };
    results.summary = getTestSummary(results);
    return results;
}

export function performChiSquaredGoodnessOfFit(categoricalVar, expectedProportions) {
    const data = getColumn(categoricalVar);
    const observedFrequencies = ss.frequency(data);
    
    const categories = Object.keys(observedFrequencies);
    const observedCounts = Object.values(observedFrequencies);
    const totalCount = data.length;

    if (Object.keys(expectedProportions).length !== categories.length) {
        throw new Error("The number of expected proportions must match the number of categories in the data.");
    }
    
    const expectedCounts = categories.map(cat => totalCount * expectedProportions[cat]);
    const chiSquaredResult = ss.chiSquaredGoodnessOfFit(observedCounts, expectedCounts, categories.length - 1);

    const results = {
        testName: "Chi-Squared Goodness-of-Fit Test",
        statisticName: "Chi-Squared (χ²)",
        statisticValue: chiSquaredResult,
        df: categories.length - 1,
        // pValue: Library does not provide p-value for GoF.
        gofTable: categories.map((cat, i) => ({
            category: cat,
            observed: observedCounts[i],
            expected: expectedCounts[i]
        })),
        summary: ""
    };
    results.summary = getTestSummary(results) + "\nNote: The library does not calculate a p-value for this test. A larger Chi-Squared value suggests a poorer fit. Use the AI for interpretation.";
    return results;
}

// All other test functions (Paired T-Test, ANOVA, Pearson, Chi-Squared Independence, Mann-Whitney, Kruskal-Wallis)
// remain unchanged from the previous correct implementation, but will benefit from the updated getTestSummary formatter.
// Here they are for completeness:

export function performPairedTTest(var1, var2) {
    const { values1, values2 } = getPairedNumericData(var1, var2);
    if (values1.length < 2) throw new Error("Not enough paired data for test.");

    const differences = values1.map((val, i) => val - values2[i]);
    const t_statistic = ss.tTest(differences, 0);

    const results = {
        testName: "Paired Samples T-Test",
        statisticName: "T-Statistic",
        statisticValue: t_statistic,
        pValue: ss.tTest(differences, 0, { 'alternative': 'two-sided' }).p,
        df: differences.length - 1,
        groupStats: [{name: `Difference (${var1}-${var2})`, n: differences.length, mean: ss.mean(differences), stdDev: ss.standardDeviation(differences)}]
    };
    results.summary = getTestSummary(results);
    return results;
}

export function performChiSquaredTest(var1, var2) { /* Unchanged */ 
    const data1 = getColumn(var1);
    const data2 = getColumn(var2);

    const cats1 = [...new Set(data1.filter(v => v))];
    const cats2 = [...new Set(data2.filter(v => v))];

    const contingencyTable = cats1.map(c1 => 
        cats2.map(c2 => 
            data1.filter((d, i) => d === c1 && data2[i] === c2).length
        )
    );
    
    if (contingencyTable.flat().some(count => count < 5)) {
        console.warn("Warning: Some cells have counts < 5. Chi-Squared test may be inaccurate.");
    }

    const result = ss.chiSquaredTest(contingencyTable);
    
    const results = {
        testName: "Chi-Squared Test of Independence",
        statisticName: "Chi-Squared (χ²)",
        statisticValue: result.chiSquared,
        pValue: result.pValue,
        df: (cats1.length - 1) * (cats2.length - 1),
        contingencyTable: { rows: cats1, cols: cats2, data: contingencyTable },
    };
    results.summary = getTestSummary(results);
    return results;
}
export function performAnova(numericalVar, categoricalVar) { /* Unchanged */ 
    const numericalData = getColumn(numericalVar, 'numeric');
    const categoricalData = getColumn(categoricalVar);

    const groups = new Map();
    categoricalData.forEach((cat, i) => {
        if (!cat) return;
        if (!groups.has(cat)) groups.set(cat, []);
        groups.get(cat).push(numericalData[i]);
    });

    if (groups.size < 3) throw new Error("ANOVA requires a categorical variable with at least 3 groups.");

    const groupArray = Array.from(groups.values());
    const f_statistic = ss.oneWayAnova(groupArray);

    const results = {
        testName: "One-Way ANOVA",
        statisticName: "F-Statistic",
        statisticValue: f_statistic,
        df_between: groups.size - 1,
        df_within: numericalData.length - groups.size,
        groupStats: Array.from(groups.entries()).map(([name, data]) => ({
            name, n: data.length, mean: ss.mean(data), stdDev: ss.standardDeviation(data)
        })),
        summary: `Test: One-Way ANOVA\n------------------------------\nF-Statistic: ${f_statistic.toFixed(4)}\nDegrees of Freedom (between, within): ${groups.size - 1}, ${numericalData.length - groups.size}\n\nNote: A p-value cannot be calculated with this library. A higher F-value suggests a greater difference between group means. Use the AI to interpret the significance of this F-value.`
    };
    return results;
}
export function performPearsonCorrelation(var1, var2) { /* Unchanged */ 
    const { values1, values2 } = getPairedNumericData(var1, var2);
    if (values1.length < 2) throw new Error("Not enough paired data for correlation.");

    const r = ss.sampleCorrelation(values1, values2);
    
    const results = {
        testName: "Pearson Correlation",
        correlation: { r, n: values1.length },
        summary: `Test: Pearson Correlation\n------------------------------\nPearson's r: ${r.toFixed(4)}\nSample Size (n): ${values1.length}\n\nInterpretation:\n'r' measures the strength and direction of a linear relationship. Values near +1 or -1 indicate a strong relationship, while values near 0 indicate a weak one.\nA p-value cannot be calculated by this library; use the AI to assess significance based on 'r' and 'n'.`
    };
    return results;
}
export function performMannWhitneyUTest(numericalVar, categoricalVar) { /* Unchanged */ 
    const numericalData = getColumn(numericalVar, 'numeric');
    const categoricalData = getColumn(categoricalVar);

    const categories = [...new Set(categoricalData.filter(v => v))];
    if (categories.length !== 2) throw new Error("Categorical variable must have exactly two groups.");
    
    const group1 = numericalData.filter((_, i) => categoricalData[i] === categories[0]);
    const group2 = numericalData.filter((_, i) => categoricalData[i] === categories[1]);

    const result = ss.mannWhitneyUTest(group1, group2);

    const results = {
        testName: "Mann-Whitney U Test",
        statisticName: "U-Statistic",
        statisticValue: result.u,
        pValue: result.p,
        groupStats: [
            { name: categories[0], n: group1.length, median: ss.median(group1) },
            { name: categories[1], n: group2.length, median: ss.median(group2) }
        ]
    };
    results.summary = getTestSummary(results);
    return results;
}
export function performKruskalWallisTest(numericalVar, categoricalVar) { /* Unchanged */ 
    const numericalData = getColumn(numericalVar, 'numeric');
    const categoricalData = getColumn(categoricalVar);

    const groups = new Map();
    categoricalData.forEach((cat, i) => {
        if (!cat) return;
        if (!groups.has(cat)) groups.set(cat, []);
        groups.get(cat).push(numericalData[i]);
    });

    if (groups.size < 2) throw new Error("Kruskal-Wallis test requires at least 2 groups.");

    const groupArray = Array.from(groups.values());
    const result = ss.kruskalWallis(groupArray);

    const results = {
        testName: "Kruskal-Wallis H Test",
        statisticName: "H-Statistic",
        statisticValue: result.h,
        pValue: result.p,
        df: groups.size - 1,
        groupStats: Array.from(groups.entries()).map(([name, data]) => ({
            name, n: data.length, median: ss.median(data)
        }))
    };
    results.summary = getTestSummary(results);
    return results;
}
export function performWilcoxonSignedRankTest(var1, var2) { /* Unchanged */ 
    throw new Error("Wilcoxon Signed-Rank Test is not supported by the current statistics library. Please choose another test.");
}