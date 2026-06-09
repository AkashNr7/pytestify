# AI Usage Note & Challenge Metrics

This document outlines the AI assistance logs, prompts, failures, and manual course corrections made during the prototyping phase of the **Postman to Pytest Migrator**. 

## 🤖 What AI Helped With

1. **JavaScript AST Assertion Parsing**: 
   - Gemini successfully interpreted complex Chai and Postman specific structures (e.g. nested callbacks, callback parameters, `pm.expect(x).to.be.an('array')` or `pm.response.to.have.header`) and mapped them cleanly to idiomatic Python equivalents.
2. **Contextual State-Passing Architectures**:
   - Designed a simple state manager in python using custom pytest fixtures or globally bound maps to capture parameters from prior requests and pass them to subsequent requests.
3. **Automated Error Logging & Remediation Strategy**:
   - Automated the creation of an interactive feedback loop which pipes pytest logs into Gemini, and then formats precise QA recommendations.

## ⚠️ What AI Got Wrong & Incompatibilities Detected

During early iterations:
* **JSON Structure Errors Parsing**: The model originally generated nested imports inside python function definitions rather than at the script level.
* **Typing for Async Frameworks**: In some options, it would insert `async def` without including `@pytest.mark.asyncio`, leading to bypassed checks in Python pytest runner.
* **Variable Reference Clashes**: In nested payloads, it would try to translate raw postman variables to direct python f-strings without declaring keys in the dictionary context first.

## 📝 Prime Prompts Used

### Postman to Pytest Translation Prompt Segment:
```text
You are an expert Python Test Automation Architect and QA Engineer.
Your task is to take a set of API requests and their corresponding Postman test rules (which are written in Javascript/Chai syntax using the `pm` global library), and translate them into a perfectly formatted, clean, standard Python pytest script using a designated HTTP library: "{library}".
Adhere strictly to:
1. Target python client import schemas.
2. Proper pytest assertion translation mappings.
3. State dictionaries to capture environment assignments like `pm.environment.set()`.
```

### AI Failure Analysis Agent Prompt Segment:
```text
You are a Staff QA Engineer analyzing a test suite execution log.
Compare the generated pytest test script code against the console tracebacks below.
Output an actionable failure analysis block containing:
1. "Root Cause": Explanation of the exact line or contract failure.
2. "Recommendations": Next steps (e.g. check environment settings, API drift updates).
3. "Actionable Patch": Code segment to fix the issue.
```

## 👩‍🔧 Human Corrections Made

1. **Unified Schema Enforcing**: Defined strict TypeScript interfaces on the server and client to guarantee the exchange of generated codes and result payloads.
2. **Interactive Simulation Mode**: Since direct python script execution on the container is restricted in sandboxed environments, we built an elegant Gemini-driven live sandbox simulator which executes custom network errors, API contract drifts, or offline scenarios dynamically!
