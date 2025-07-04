import { state } from './data.js';

// IMPORTANT: REPLACE WITH YOUR ACTUAL API KEY
const API_KEY = AIzaSyA6hnkMomVsFzgBV_JEe-ohtoydizHeA1M;
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${API_KEY}`;

let chatHistory = [];

/**
 * Sends a prompt to the Gemini API and returns the response.
 * @param {string} promptText - The user's prompt.
 * @returns {Promise<string>} - The AI's text response.
 */
export async function callGemini(promptText) {
    if (API_KEY === 'YOUR_GEMINI_API_KEY_HERE') {
        return "ERROR: Please add your Google Gemini API key in `js/ai.js` to enable AI features.";
    }

    // Add current prompt to history
    chatHistory.push({ role: "user", parts: [{ text: promptText }] });

    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ contents: chatHistory }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            console.error('API Error:', errorData);
            chatHistory.pop(); // Remove failed prompt from history
            return `API Error: ${errorData.error.message}`;
        }

        const data = await response.json();
        const aiResponseText = data.candidates[0].content.parts[0].text;
        
        // Add AI response to history
        chatHistory.push({ role: "model", parts: [{ text: aiResponseText }] });

        // Limit history to last 10 exchanges to manage token size
        if (chatHistory.length > 20) {
            chatHistory = chatHistory.slice(-20);
        }

        return aiResponseText;

    } catch (error) {
        console.error('Fetch Error:', error);
        chatHistory.pop(); // Remove failed prompt from history
        return 'Network error or failed to fetch from the API. Please check your connection and API key.';
    }
}

export function generateDatasetContextPrompt() {
    if (!state.parsedData.length) return "";
    
    const context = `
        Context: I am analyzing a dataset with the following characteristics:
        - Filename: ${state.fileName}
        - Number of rows: ${state.parsedData.length}
        - Columns and their inferred types:
        ${state.headers.map(h => `  - "${h}" (${state.columnTypes[h]})`).join('\n')}
        - A sample of the data looks like this (first 3 rows):
        ${state.headers.join(', ')}\n${state.rawData.slice(1, 4).join('\n')}
    `;
    return context;
}

export function generateTestResultsContextPrompt(testResults) {
    return `
        Context: I just performed a statistical test with the following results:
        ${testResults.summary}
        
        Based on this, please answer my next question.
    `;
}

export function generateFullReportPrompt() {
    return `
        Please act as a data analyst and write a comprehensive summary report based on the following analysis log.
        The report should be structured with clear headings in markdown (e.g., **Introduction**, **Data Overview**, **Key Findings**, **Statistical Analysis**, **Machine Learning Model**, **Conclusion and Recommendations**).
        Be insightful and explain the findings in a way that a business stakeholder could understand.
        
        Here is the log of my analysis:
        ---
        ${state.analysisLog.join('\n\n')}
        ---
        
        Now, please generate the full report.
    `;
}