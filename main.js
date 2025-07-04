import { state, parseCSV, logAnalysis } from './data.js';
import * as ui from './ui.js';
import * as eda from './eda.js';
import * as stats from './stats.js';
import * as ml from './ml.js';
import * as ai from './ai.js';
// ... (keep initialize() and setupEventListeners())

// Replace the handleTestTypeChange function with this new version
function handleTestTypeChange() {
    const testType = document.getElementById('stats-test-type').value;
    const var1Select = document.getElementById('stats-var1');
    const var2Select = document.getElementById('stats-var2');
    const oneSampleControls = document.getElementById('one-sample-t-test-controls');
    const gofControls = document.getElementById('chi-squared-gof-controls');
    
    // Hide all special controls first
    var2Select.style.display = 'inline-block';
    oneSampleControls.style.display = 'none';
    gofControls.style.display = 'none';
    document.getElementById('gof-proportions-inputs').innerHTML = '';

    const numeric = (h, t) => t === 'numeric';
    const categorical = (h, t) => t === 'categorical';
    const cat2groups = (h, t) => t === 'categorical' && new Set(state.parsedData.map(r => r[h])).size === 2;
    const cat3plusgroups = (h, t) => t === 'categorical' && new Set(state.parsedData.map(r => r[h])).size >= 3;

    switch (testType) {
        case 'one-sample-t-test':
            ui.populateSelects(['stats-var1'], numeric);
            var2Select.style.display = 'none';
            oneSampleControls.style.display = 'block';
            break;
        case 'chi-squared-gof':
            ui.populateSelects(['stats-var1'], categorical);
            var2Select.style.display = 'none';
            gofControls.style.display = 'block';
            // Dynamically create inputs when the variable changes
            var1Select.onchange = () => ui.createGoFInputs(var1Select.value);
            ui.createGoFInputs(var1Select.value); // Initial call
            break;
        case 'independent-t-test':
        case 'mann-whitney-u':
            ui.populateSelects(['stats-var1'], numeric);
            ui.populateSelects(['stats-var2'], cat2groups);
            break;
        case 'one-way-anova':
        case 'kruskal-wallis':
            ui.populateSelects(['stats-var1'], numeric);
            ui.populateSelects(['stats-var2'], cat3plusgroups);
            break;
        case 'chi-squared':
            ui.populateSelects(['stats-var1', 'stats-var2'], categorical);
            break;
        case 'pearson-correlation':
        case 'paired-t-test':
        case 'wilcoxon-signed-rank':
             ui.populateSelects(['stats-var1', 'stats-var2'], numeric);
            break;
        default:
             ui.populateSelects(['stats-var1', 'stats-var2'], () => true);
    }
    if (testType !== 'chi-squared-gof') {
        var1Select.onchange = null; // Remove the specific onchange handler
    }
}

// Replace the handleRunTest function with this new version
function handleRunTest() {
    const testType = document.getElementById('stats-test-type').value;
    const var1 = document.getElementById('stats-var1').value;
    const var2 = document.getElementById('stats-var2').value;

    if (!testType || !var1) {
        alert("Please select a test and at least the first variable.");
        return;
    }
    
    try {
        let results;
        switch (testType) {
            case 'one-sample-t-test':
                const hypoMean = parseFloat(document.getElementById('hypo-mean').value);
                if (isNaN(hypoMean)) { alert("Hypothesized mean must be a number."); return; }
                results = stats.performOneSampleTTest(var1, hypoMean);
                break;
            case 'chi-squared-gof':
                const propInputs = document.querySelectorAll('.gof-input');
                const expectedProportions = {};
                let totalProp = 0;
                propInputs.forEach(input => {
                    const prop = parseFloat(input.value);
                    if (isNaN(prop)) throw new Error(`Proportion for ${input.dataset.category} is not a valid number.`);
                    expectedProportions[input.dataset.category] = prop;
                    totalProp += prop;
                });
                if (Math.abs(totalProp - 1.0) > 0.001) {
                    alert(`Expected proportions must sum to 1. They currently sum to ${totalProp.toFixed(4)}.`);
                    return;
                }
                results = stats.performChiSquaredGoodnessOfFit(var1, expectedProportions);
                break;
            // The rest of the cases remain the same
            case 'independent-t-test': results = stats.performIndependentTTest(var1, var2); break;
            case 'chi-squared': results = stats.performChiSquaredTest(var1, var2); break;
            case 'one-way-anova': results = stats.performAnova(var1, var2); break;
            case 'pearson-correlation': results = stats.performPearsonCorrelation(var1, var2); break;
            case 'mann-whitney-u': results = stats.performMannWhitneyUTest(var1, var2); break;
            case 'kruskal-wallis': results = stats.performKruskalWallisTest(var1, var2); break;
            case 'paired-t-test': results = stats.performPairedTTest(var1, var2); break;
            case 'wilcoxon-signed-rank': results = stats.performWilcoxonSignedRankTest(var1, var2); break;
        }

        if (results) {
            ui.displayTestResults(results);
            logAnalysis(`Performed ${results.testName}. Result Summary: ${results.summary.split('\n\n').pop()}`);
            ui.clearContextualPrompts();
            const prompt = ai.generateTestResultsContextPrompt(results);
            ui.addContextualPrompt("Explain these results in simple terms", `${prompt}\nCan you explain what these results mean in simple, non-technical terms?`);
            ui.addContextualPrompt("What are the assumptions?", `${prompt}\nWhat are the assumptions for this statistical test?`);
        }
    } catch (error) {
        alert(`Error running test: ${error.message}`);
    }
}

// Ensure you keep all other functions in main.js unchanged.
// (initialize, setupEventListeners, handleFileUpload, etc.)