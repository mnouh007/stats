# AI-Assisted Statistical Analysis & ML Web Application

This is a comprehensive, bilingual (English/Arabic) web application for data analysis, built entirely with HTML, CSS, and vanilla JavaScript. It leverages the Google Gemini API for AI-powered assistance and the `simple-statistics` library for calculations.

## Features

- **Data Ingestion**: Upload CSV files.
- **Data Preprocessing**: Preview data, view basic stats.
- **Exploratory Data Analysis (EDA)**: Generate plots like histograms, bar charts, scatter plots, and box plots.
- **Comprehensive Statistical Analysis**: Perform T-Tests, ANOVA, Chi-Squared, Mann-Whitney U, Kruskal-Wallis, and more.
- **Machine Learning**: Basic Simple Linear Regression with visualization.
- **AI Assistant**: A contextual chat interface to ask questions, get interpretations, and receive recommendations.
- **Bilingual Support**: Fully functional in both English and Arabic with a dynamic RTL layout.
- **Report Generation**: AI-powered summary of the entire analysis.

## Setup and Running the Application

### Prerequisites

1.  A modern web browser (Chrome, Firefox, Edge).
2.  A local web server (required due to JavaScript module usage).

### Steps

1.  **Create Project Files:**
    - Create the file structure and files as specified in the project documentation.
    - Copy the code for each file from the provided source.

2.  **Add Your API Key:**
    - Open the file `js/ai.js`.
    - Find the line `const API_KEY = 'YOUR_GEMINI_API_KEY_HERE';`.
    - Replace `'YOUR_GEMINI_API_KEY_HERE'` with your actual Google Gemini API key.
    - **SECURITY WARNING**: Do not commit your API key to a public repository. This client-side implementation is for demonstration purposes. In a production environment, API calls should be routed through a secure backend server to protect your key.

3.  **Run the Local Server:**
    - **Using VS Code**: Install the "Live Server" extension, right-click on `index.html` and select "Open with Live Server".
    - **Using Python**: Navigate to the project's root directory in your terminal and run:
      ```bash
      python -m http.server
      ```
      Then open your browser and go to `http://localhost:8000`.

4.  **Use the Application:**
    - The application will load in your browser. You can switch languages, upload a CSV file, and begin your analysis. For the best experience, use a sample dataset like the "Titanic" or "Iris" datasets in CSV format.