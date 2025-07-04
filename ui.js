// Add this new function to your ui.js file
import { state } from './data.js';
import { getColumn } from './utils.js';
// ... (keep all other existing functions in ui.js)

/**
 * Creates dynamic input fields for the Chi-Squared Goodness-of-Fit test.
 * @param {string} categoricalVar - The selected categorical variable.
 */
export function createGoFInputs(categoricalVar) {
    const container = document.getElementById('gof-proportions-inputs');
    container.innerHTML = ''; // Clear previous inputs
    if (!categoricalVar) return;

    const data = getColumn(categoricalVar);
    const categories = [...new Set(data.filter(v => v))];
    const defaultProp = (1 / categories.length).toFixed(4);

    categories.forEach(cat => {
        const inputGroup = document.createElement('div');
        const label = document.createElement('label');
        label.setAttribute('for', `gof-prop-${cat}`);
        label.textContent = cat;

        const input = document.createElement('input');
        input.type = 'number';
        input.id = `gof-prop-${cat}`;
        input.dataset.category = cat;
        input.className = 'gof-input';
        input.value = defaultProp;
        input.step = "0.01";
        input.min = "0";
        input.max = "1";

        inputGroup.appendChild(label);
        inputGroup.appendChild(input);
        container.appendChild(inputGroup);
    });
}