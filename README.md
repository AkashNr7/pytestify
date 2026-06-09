# Postman Collection → Pytest Migrator (AI Architecture)

This application converts a standard Postman Collection JSON, complete with embedded JavaScript-based assertions (using Postman's `pm.*` API and Chai assertion styles), into a clean, modern, and executable Python `pytest` suite.

## 🚀 Architecture Overview

```
┌─────────────────────────────────┐
│     Collection Source Input     │
│  (Upload JSON / Postman API)    │
└────────────────┬────────────────┘
                 │
                 ▼
┌─────────────────────────────────┐
│   Collection Parser Service     │
│ (Extract request specs & code)   │
└────────────────┬────────────────┘
                 │
                 ▼
┌─────────────────────────────────┐
│  AI Engine (Gemini-3.5-Flash)   │
│ (Translate JS assert to Pytest) │
└────────────────┬────────────────┘
                 │
                 ▼
┌─────────────────────────────────┐
│     Pytest Code Generator       │
│ (Build single file/modular ZIP) │
└────────────────┬────────────────┘
                 │
                 ▼
┌─────────────────────────────────┐
│   Failure Analysis loop agent   │
│ (Execute code & explain errors) │
└─────────────────────────────────┘
```

## 🛠️ Step-by-Step Flow

1. **Importing Collections**: Two modes are available:
   - **Manual Upload**: Upload a standard Postman Collection `.json` (V2 or V2.1 schema formats supported).
   - **Postman API Integration**: Input your Postman API key. The application fetches available workspace entities and queries collection resources directly.
2. **Parsing Schema Objects**: The backend walks the hierarchical collection trees to extract name, HTTP client parameters (URLs with variable interpolation like `{{buyerAccessToken}}`), authorization headers, payloads, and JavaScript code sequences inside test events.
3. **Gemini assertion translation pipeline**: Uses the modern `@google/genai` TypeScript SDK to target `gemini-3.5-flash` model which parses JS syntax and Chai assertions (`pm.test()`, `pm.expect()`) mapping them to robust python equivalents:
   - `pm.response.to.have.status(200)` $\rightarrow$ `assert response.status_code == 200`
   - Chai variable checks `pm.expect(obj.id).to.be.a('number')` $\rightarrow$ `assert isinstance(obj.get('id'), (int, float))`
   - Environment parameters setting `pm.environment.set(...)` are converted to Class-level dynamic context dictionary lookups inside Python.
4. **Pytest File Output**: Produces `test_all_apis.py` (consolidated) and optionally packages individual test suites (e.g. `test_auth.py`, `test_products.py`) into a downloadable `.zip` file using `adm-zip`.
5. **Execution & Failure Analysis Agent**: Executes simulated or live API environments to capture stdout reports. If assertion errors or contract breaks are encountered, the *AI Agent loop* takes the terminal diagnostics logs and generates clear, natural language recommendations.

## 📋 Run Instructions

To execute the generated Python `pytest` scripts on your local system:

1. **Install python requirements**:
   ```bash
   pip install pytest requests httpx pytest-asyncio
   ```
2. **Executing the test suite**:
   - Running all tests:
     ```bash
     pytest test_all_apis.py -v
     ```
   - Running individual files:
     ```bash
     pytest test_login.py -v
     ```

## 🧠 Core Assumptions & Flight Path Limitations

- **State Propagation**: This tool presumes that values passed via `pm.environment.set` map cleanly to session variables. It represents this via modular state structures in python.
- **Javascript Specific libraries**: Pure javascript constructs imported manually in Postman scripts (like specific npm crypto-js packages) are flagged with comments inside Python requiring human translation or custom python cryptography adjustments.
