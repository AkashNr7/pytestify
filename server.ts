import express from "express";
import path from "path";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import AdmZip from "adm-zip";

dotenv.config();

const app = express();
const PORT = 3000;

// Body parser
app.use(express.json({ limit: "50mb" }));

// Lazy initializer for Gemini Client
let aiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI {
  if (!aiClient) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      throw new Error("GEMINI_API_KEY environment variable is required. Please set it in Settings > Secrets.");
    }
    aiClient = new GoogleGenAI({
      apiKey: key,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiClient;
}

// Helper to perform content generation with automatic retry and model fallback in case of high demand (503 UNAVAILABLE)
async function generateContentWithRetryAndFallback(
  client: GoogleGenAI,
  params: any
) {
  const primaryModel = params.model || "gemini-3.5-flash";
  const fallbackModels = ["gemini-3.5-flash", "gemini-3.1-flash-lite", "gemini-flash-latest"];
  const modelsToTry = Array.from(new Set([primaryModel, ...fallbackModels]));

  let lastError: any = null;

  for (const model of modelsToTry) {
    const attempts = 2;
    for (let attempt = 1; attempt <= attempts; attempt++) {
      try {
        console.log(`[Gemini API] Attempting generateContent with model: ${model} (attempt ${attempt}/${attempts})`);
        const response = await client.models.generateContent({
          ...params,
          model,
        });
        console.log(`[Gemini API] Success with model: ${model} (attempt ${attempt}/${attempts})`);
        return response;
      } catch (err: any) {
        lastError = err;
        const errStr = (String(err?.message || "") + " " + JSON.stringify(err)).toLowerCase();
        const isTemporary = errStr.includes("503") || errStr.includes("502") || errStr.includes("unavailable") || errStr.includes("high demand") || errStr.includes("429");

        console.warn(`[Gemini API] Failed with model ${model} (attempt ${attempt}/${attempts}). Error: ${err?.message || err}`);

        if (isTemporary) {
          if (attempt < attempts) {
            const waitMs = Math.round(1000 * Math.pow(2, attempt - 1));
            console.log(`[Gemini API] Retrying in ${waitMs}ms due to transient error...`);
            await new Promise((resolve) => setTimeout(resolve, waitMs));
            continue;
          }
        } else {
          break;
        }
      }
    }
  }

  throw lastError || new Error("Failed to generate content from Gemini after trying fallback models.");
}

// Built-in Examples to let the user play with immediately
const SAMPLE_COLLECTIONS = [
  {
    id: "user-api",
    name: "User Management Service",
    description: "Sample Postman collection testing authentication, fetching user profile, and creating a new user with status and field assertions.",
    items: [
      {
        name: "User Authentication",
        request: {
          method: "POST",
          url: "https://api.example.com/v1/auth/login",
          headers: [
            { key: "Content-Type", value: "application/json" }
          ],
          body: JSON.stringify({
            username: "admin_user",
            password: "super_secret_password"
          }, null, 2)
        },
        event: [
          {
            listen: "test",
            script: {
              exec: [
                "pm.test(\"Status code is 200\", function () {",
                "    pm.response.to.have.status(200);",
                "});",
                "",
                "pm.test(\"Token is returned in response\", function () {",
                "    var jsonData = pm.response.json();",
                "    pm.expect(jsonData.token).to.not.be.undefined;",
                "    pm.expect(jsonData.expires_in).to.eql(3600);",
                "    // Store token",
                "    pm.environment.set(\"authToken\", jsonData.token);",
                "});"
              ]
            }
          }
        ]
      },
      {
        name: "Get User Profile",
        request: {
          method: "GET",
          url: "https://api.example.com/v1/users/me",
          headers: [
            { key: "Authorization", value: "Bearer {{authToken}}" }
          ],
          body: null
        },
        event: [
          {
            listen: "test",
            script: {
              exec: [
                "pm.test(\"Successful profile retrieval\", function () {",
                "    pm.response.to.have.status(200);",
                "    var profile = pm.response.json();",
                "    pm.expect(profile.username).to.eql(\"admin_user\");",
                "    pm.expect(profile.role).to.eql(\"administrator\");",
                "    pm.expect(profile.active).to.be.true;",
                "});",
                "",
                "pm.test(\"Response headers check\", function () {",
                "    pm.response.to.have.header(\"Content-Type\", \"application/json; charset=utf-8\");",
                "});"
              ]
            }
          }
        ]
      },
      {
        name: "Create User Entity",
        request: {
          method: "POST",
          url: "https://api.example.com/v1/users",
          headers: [
            { key: "Authorization", value: "Bearer {{authToken}}" },
            { key: "Content-Type", value: "application/json" }
          ],
          body: JSON.stringify({
            username: "new_developer",
            email: "dev@example.com",
            role: "editor"
          }, null, 2)
        },
        event: [
          {
            listen: "test",
            script: {
              exec: [
                "pm.test(\"Status code is 201 Created\", function () {",
                "    pm.response.to.have.status(201);",
                "});",
                "",
                "pm.test(\"Created entity matches request\", function () {",
                "    var responseData = pm.response.json();",
                "    pm.expect(responseData.id).to.be.a('number');",
                "    pm.expect(responseData.username).to.eql(\"new_developer\");",
                "    pm.expect(responseData.email).to.eql(\"dev@example.com\");",
                "});"
              ]
            }
          }
        ]
      }
    ]
  },
  {
    id: "ecommerce-api",
    name: "E-Commerce Checkout Flow",
    description: "Multi-step complex API collection testing catalog search, adding products to cart, and checking out.",
    items: [
      {
        name: "List Products",
        request: {
          method: "GET",
          url: "https://api.example.com/products?category=electronics&limit=5",
          headers: [
            { key: "Accept", value: "application/json" }
          ],
          body: null
        },
        event: [
          {
            listen: "test",
            script: {
              exec: [
                "pm.test(\"Status is OK\", function () {",
                "    pm.response.to.have.status(200);",
                "});",
                "",
                "pm.test(\"Data is non-empty array\", function () {",
                "    var body = pm.response.json();",
                "    pm.expect(body.products).to.be.an('array');",
                "    pm.expect(body.products.length).to.be.above(0);",
                "    ",
                "    // Save id of first product",
                "    var targetProductId = body.products[0].id;",
                "    pm.environment.set(\"productId\", targetProductId);",
                "    pm.environment.set(\"productPrice\", body.products[0].price);",
                "});"
              ]
            }
          }
        ]
      },
      {
        name: "Add Product to Shopping Cart",
        request: {
          method: "POST",
          url: "https://api.example.com/cart/items",
          headers: [
            { key: "Content-Type", value: "application/json" }
          ],
          body: JSON.stringify({
            productId: "{{productId}}",
            quantity: 2
          }, null, 2)
        },
        event: [
          {
            listen: "test",
            script: {
              exec: [
                "pm.test(\"Item added successfully\", function () {",
                "    pm.response.to.have.status(200);",
                "    var checkoutCart = pm.response.json();",
                "    pm.expect(checkoutCart.items.length).to.be.at.least(1);",
                "    ",
                "    var matchesItem = checkoutCart.items.some(item => item.product_id === pm.environment.get(\"productId\"));",
                "    pm.expect(matchesItem).to.be.true;",
                "});"
              ]
            }
          }
        ]
      },
      {
        name: "Process Payment Error Check",
        request: {
          method: "POST",
          url: "https://api.example.com/cart/checkout",
          headers: [
            { key: "Content-Type", value: "application/json" }
          ],
          body: JSON.stringify({
            paymentMethod: "invalid_card",
            cartAmount: "{{productPrice}}"
          }, null, 2)
        },
        event: [
          {
            listen: "test",
            script: {
              exec: [
                "pm.test(\"Status code is 400 Bad Request\", function () {",
                "    pm.response.to.have.status(400);",
                "});",
                "",
                "pm.test(\"Has card authorization error message\", function () {",
                "    var errors = pm.response.json();",
                "    pm.expect(errors.error_code).to.eql(\"PAYMENT_VALIDATION_FAILED\");",
                "    pm.expect(errors.message).to.include(\"card is declined\");",
                "});"
              ]
            }
          }
        ]
      }
    ]
  }
];

// Helper recursive parser to extract request info from any folders
function extractRequests(itemsCount: any[]): any[] {
  const resultList: any[] = [];
  function recurse(arr: any[]) {
    for (const item of arr) {
      if (!item) continue;
      if (item.item && Array.isArray(item.item)) {
        recurse(item.item);
      } else if (item.request) {
        // Extract tests
        let testScriptLines: string[] = [];
        if (item.event && Array.isArray(item.event)) {
          const testEvent = item.event.find((e: any) => e.listen === "test");
          if (testEvent && testEvent.script && Array.isArray(testEvent.script.exec)) {
            testScriptLines = testEvent.script.exec;
          } else if (testEvent && testEvent.script && typeof testEvent.script.exec === "string") {
            testScriptLines = [testEvent.script.exec];
          }
        }

        // Parse body
        let bodyContent = null;
        if (item.request.body) {
          if (item.request.body.mode === "raw" && item.request.body.raw) {
            bodyContent = item.request.body.raw;
          } else if (item.request.body.raw) {
            bodyContent = item.request.body.raw;
          } else if (item.request.body.mode === "formdata" && Array.isArray(item.request.body.formdata)) {
            const fdObj: Record<string, string> = {};
            item.request.body.formdata.forEach((f: any) => {
              fdObj[f.key] = f.value || "";
            });
            bodyContent = JSON.stringify(fdObj, null, 2);
          }
        }

        // Headers
        const headers = Array.isArray(item.request.header)
          ? item.request.header.map((h: any) => ({ key: h.key || "", value: h.value || "" }))
          : [];

        // URL
        let urlStr = "";
        if (typeof item.request.url === "string") {
          urlStr = item.request.url;
        } else if (item.request.url && typeof item.request.url === "object") {
          urlStr = item.request.url.raw || "";
        }

        resultList.push({
          name: item.name || "Unnamed Request",
          request: {
            method: item.request.method || "GET",
            url: urlStr,
            headers: headers,
            body: bodyContent
          },
          event: [
            {
              listen: "test",
              script: {
                exec: testScriptLines
              }
            }
          ]
        });
      }
    }
  }
  recurse(itemsCount);
  return resultList;
}

// Endpoint: Fetch sample collections in JSON
app.get("/api/examples", (req, res) => {
  res.json(SAMPLE_COLLECTIONS);
});

// Endpoint: Fetch Postman Workspaces
app.post("/api/postman/workspaces", async (req, res) => {
  try {
    const { apiKey } = req.body;
    if (!apiKey) {
      return res.status(400).json({ error: "Postman API Key is required." });
    }

    const response = await fetch("https://api.getpostman.com/workspaces", {
      headers: { "X-Api-Key": apiKey }
    });

    if (!response.ok) {
      const errText = await response.text();
      return res.status(response.status).json({
        error: `Postman API failure callback: ${response.statusText}`,
        details: errText
      });
    }

    const data = await response.json();
    return res.json({ workspaces: data.workspaces || [] });
  } catch (err: any) {
    console.error("Postman workspaces fetch error:", err);
    return res.status(500).json({ error: "Failed to connect to Postman API.", details: err.message });
  }
});

// Endpoint: Fetch Postman Collections in a Workspace
app.post("/api/postman/collections", async (req, res) => {
  try {
    const { apiKey, workspaceId } = req.body;
    if (!apiKey) {
      return res.status(400).json({ error: "Postman API Key is required." });
    }

    let url = "https://api.getpostman.com/collections";
    if (workspaceId) {
      url += `?workspace=${workspaceId}`;
    }

    const response = await fetch(url, {
      headers: { "X-Api-Key": apiKey }
    });

    if (!response.ok) {
      const errText = await response.text();
      return res.status(response.status).json({
        error: `Postman API collections retrieve failure: ${response.statusText}`,
        details: errText
      });
    }

    const data = await response.json();
    return res.json({ collections: data.collections || [] });
  } catch (err: any) {
    console.error("Postman collections fetch error:", err);
    return res.status(500).json({ error: "Failed to load collections from Postman.", details: err.message });
  }
});

// Endpoint: Fetch and Parse Postman Collection Detail
app.post("/api/postman/fetch", async (req, res) => {
  try {
    const { apiKey, collectionUid } = req.body;
    if (!apiKey || !collectionUid) {
      return res.status(400).json({ error: "API Key and Collection UID are required parameters." });
    }

    const response = await fetch(`https://api.getpostman.com/collections/${collectionUid}`, {
      headers: { "X-Api-Key": apiKey }
    });

    if (!response.ok) {
      const errText = await response.text();
      return res.status(response.status).json({
        error: `Postman Collection Fetch Error: ${response.statusText}`,
        details: errText
      });
    }

    const data = await response.json();
    if (!data.collection) {
      return res.status(400).json({ error: "Collection body was null or invalid." });
    }

    const folderItems = data.collection.item || [];
    const flattenedRequests = extractRequests(folderItems);

    return res.json({
      name: data.collection.info?.name || "Postman Imported Collection",
      description: data.collection.info?.description || "",
      items: flattenedRequests
    });
  } catch (err: any) {
    console.error("Postman Collection fetch details error:", err);
    return res.status(500).json({ error: "Failed to download collection details.", details: err.message });
  }
});

// Endpoint: Migrate Postman requests into Pytest (Consolidated + Modular + Logging prompt)
app.post("/api/migrate", async (req, res) => {
  try {
    const { items, options } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: "Missing or empty requests array 'items'." });
    }

    const {
      library = "requests",           // "requests", "httpx", "async_httpx"
      baseUrl = "https://api.example.com",
      injectBaseUrlFixture = true,
      addComments = true,
      generateFixtures = true,
    } = options || {};

    let clientInstance;
    try {
      clientInstance = getGeminiClient();
    } catch (e: any) {
      return res.status(449).json({
        error: "Missing API Key",
        details: e.message || "Please configure the Gemini API Key in Settings > Secrets."
      });
    }

    const systemInstruction = `You are an expert Python Test Automation Architect and QA Engineer.
Your task is to take a set of API requests and their corresponding Postman test rules (written in Javascript Chai syntax), and translate them into a perfectly formatted, clean, standard Python pytest script using a designated HTTP library: "${library}".

Adhere strictly to these patterns and translation rules:

1. Target Python Libraries:
   - If library is "requests" ("requests"): Include "requests".
   - If library is "httpx" ("httpx"): Include "httpx".
   - If library is "async_httpx" ("async_httpx"): Async routines, include "httpx" and "@pytest.mark.asyncio".

2. Structure / State Transitions Tracker:
   - Implement dynamic state passing! E.g. create a global dictionary thread-locked structure, or define a dedicated dynamic state fixture in pytest such as "app_state = {}" or share attributes via a pytest class structure, which allows writing variables into context via "app_state['authToken'] = jsonData['token']" and reading them on subsequent endpoint flows.
   - If a request is parameterized with dynamic brackets like {{variable}}, map it safely to python formatted strings fetching keys from the shared context state (e.g. app_state.get('authToken')).

3. Assertion Translations:
   - pm.test("...", function() { pm.response.to.have.status(200); }) -> assert response.status_code == 200
   - pm.expect(jsonData.token).to.not.be.undefined -> assert "token" in json_data and json_data["token"] is not None
   - pm.expect(jsonData.expires_in).to.eql(3600) -> assert json_data["expires_in"] == 3600

4. Output Schema:
   You MUST return a JSON object containing:
   - "pytest_code": The entire executable pytest file named "test_all_apis.py", including base_url fixture, state sharing dictionary, and test methods.
   - "migrations": List of the evaluated requests with original assertions mapped to migrated assertions.
   - "modular_files": An array of individual modular test scripts representing logic groupings (e.g. for sign in, files like "test_auth.py", "test_products.py", or "test_orders.py"). Each has a unique "filename" and "content" fields. Ensure they import necessary items and map code.

Return ONLY JSON matching the requested schema.`;

    const instructionsText = `Translate the following Postman request items into a consolidated python pytest script and separate modular scripts.
The selected base URL is: "${baseUrl}".
Whether to inject base_url fixture: ${injectBaseUrlFixture}.
Whether to add mapping comments: ${addComments}.
Target Python HTTP client library: "${library}".

Input Items for Migration:
${JSON.stringify(items, null, 2)}`;

    const response = await generateContentWithRetryAndFallback(clientInstance, {
      model: "gemini-3.5-flash",
      contents: instructionsText,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          required: ["pytest_code", "migrations", "modular_files"],
          properties: {
            pytest_code: {
              type: Type.STRING,
              description: "The complete integrated Python test_all_apis.py code file.",
            },
            migrations: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                required: ["requestName", "method", "url", "status", "originalAssertions", "migratedAssertions"],
                properties: {
                  requestName: { type: Type.STRING },
                  method: { type: Type.STRING },
                  url: { type: Type.STRING },
                  status: { type: Type.STRING },
                  originalAssertions: { type: Type.ARRAY, items: { type: Type.STRING } },
                  migratedAssertions: { type: Type.ARRAY, items: { type: Type.STRING } },
                }
              }
            },
            modular_files: {
              type: Type.ARRAY,
              description: "Separated, dynamic modular pytest module files for high-level groupings (e.g. test_login.py, test_users.py).",
              items: {
                type: Type.OBJECT,
                required: ["filename", "content"],
                properties: {
                  filename: { type: Type.STRING, description: "Name of the file (e.g., test_login.py)" },
                  content: { type: Type.STRING, description: "Complete content of this standalone modular test file." }
                }
              }
            }
          }
        },
      },
    });

    const responseText = response.text;
    if (!responseText) {
      throw new Error("Received an empty response from Gemini migration model.");
    }

    const migrationResult = JSON.parse(responseText.trim());
    
    // Log the prompt in a global object or structure so we satisfy requirement "Log prompts used for conversion"
    // We can return the systemInstructions and prompts directly in the API call metadata too!
    migrationResult.ai_prompt_meta = {
      model: "gemini-3.5-flash",
      systemInstruction: systemInstruction,
      promptText: instructionsText,
      timestamp: new Date().toISOString()
    };

    return res.json(migrationResult);

  } catch (error: any) {
    console.error("Migration Error:", error);
    return res.status(500).json({
      error: "Migration execution failed.",
      details: error.message || String(error),
    });
  }
});

// Endpoint: AI-Augmented Pytest Execution & Failure Analysis Loop Agent
app.post("/api/execute", async (req, res) => {
  try {
    const { pytest_code, simulationMode = "success" } = req.body;

    if (!pytest_code) {
      return res.status(400).json({ error: "Missing required 'pytest_code' parameter." });
    }

    let clientInstance;
    try {
      clientInstance = getGeminiClient();
    } catch (e: any) {
      return res.status(449).json({
        error: "Missing API Key",
        details: e.message || "Please configure the Gemini API Key in Settings > Secrets."
      });
    }

    const systemInstruction = `You are a Python Pytest Sandbox Runner and AI QA Diagnostic Agent.
Your task is to analyze the provided pytest_code and simulate a real-world execution report based on the requested environment scenario: "${simulationMode}".

Scenarios instructions:
1. "success": All tests in the script pass cleanly. Standard execution log has PASSED indicators and 100% success.
2. "offline": Simulate target API cluster completely down. Create ConnectionError/Timeout errors with tracebacks.
3. "drift_auth": Injects a 401 Unauthorized response traceback on authentication checking step.
4. "drift_schema": Injects a schema drift failure (e.g., KeyError or AssertionError due to a field mismatch like "token" vs "accessToken").

You MUST return a JSON object matching this schema:
- "total": The total number of test functions found in the user's pytest script.
- "passed": Number of passed tests.
- "failed": Number of failed tests.
- "execution_time": Random/simulated time duration between 0.3 and 1.8 seconds.
- "output_log": Standard-looking text output logs of pytest command with ANSI coloring descriptors (e.g. "==== test session starts ====", "test_all_apis.py::test_login PASSED").
- "failures": An array of failure structures. If scenario is "success", this is empty. Otherwise, include detailed agent recommendations:
   - "test_name": Name of the test class / function that failed.
   - "error_message": Pytest assertion exception trace snippet.
   - "probable_cause": Explain precisely in plain language what likely caused the issue based on the scenario. E.g. contract drift or networking anomalies.
   - "recommendations": Clear steps to mitigate (e.g., Refresh tokens, ping endpoint, check mock contracts).
   - "code_patch": Corrective Python pytest code block to resolve or gracefully handle the issue.

Let the output log feel incredibly authentic, complete with timestamps and Python environment details.`;

    const response = await generateContentWithRetryAndFallback(clientInstance, {
      model: "gemini-3.5-flash",
      contents: `Simulate compilation and run results for the following Python script:\n\n${pytest_code}\n\nUnder target mode: "${simulationMode}"`,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          required: ["total", "passed", "failed", "execution_time", "output_log", "failures"],
          properties: {
            total: { type: Type.INTEGER },
            passed: { type: Type.INTEGER },
            failed: { type: Type.INTEGER },
            execution_time: { type: Type.NUMBER },
            output_log: { type: Type.STRING },
            failures: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                required: ["test_name", "error_message", "probable_cause", "recommendations", "code_patch"],
                properties: {
                  test_name: { type: Type.STRING },
                  error_message: { type: Type.STRING },
                  probable_cause: { type: Type.STRING },
                  recommendations: { type: Type.STRING },
                  code_patch: { type: Type.STRING, description: "Actionable Python modification suggestion" }
                }
              }
            }
          }
        }
      }
    });

    const responseText = response.text;
    if (!responseText) {
      throw new Error("Received an empty response from simulation runner agent.");
    }

    const testResults = JSON.parse(responseText.trim());
    return res.json(testResults);

  } catch (error: any) {
    console.error("Test execution simulator error:", error);
    return res.status(500).json({
      error: "Simulator failed to evaluate code.",
      details: error.message || String(error)
    });
  }
});

// Endpoint: Dynamic ZIP Bundler
app.post("/api/download-zip", (req, res) => {
  try {
    const { pytest_code, modular_files } = req.body;
    const zip = new AdmZip();

    // 1. Add complete consolidated python file
    zip.addFile("test_all_apis.py", Buffer.from(pytest_code || ""));

    // 2. Add individual modular files if present
    if (Array.isArray(modular_files)) {
      modular_files.forEach((file: any) => {
        if (file.filename && file.content) {
          zip.addFile(file.filename, Buffer.from(file.content));
        }
      });
    }

    // 3. Add auto-generated documentation setup
    const readMeText = `# Translated Pytest Test Suite\n\nAutomatically migrated from Postman Collection using Gemini AI.\n\n## Structure\n- \`test_all_apis.py\`: Combined consolidated execution suite.\n- Modular tests split by request category.\n\n## Running Tests\n\`\`\`bash\npip install pytest requests httpx\npytest -v\n\`\`\`\n`;
    zip.addFile("README.md", Buffer.from(readMeText));

    const zipBuffer = zip.toBuffer();

    res.setHeader("Content-Type", "application/zip");
    res.setHeader("Content-Disposition", "attachment; filename=pytest_suite_payload.zip");
    res.send(zipBuffer);

  } catch (err: any) {
    console.error("Zip bundle creation error:", err);
    res.status(500).send("Failed to bundle scripts into ZIP: " + err.message);
  }
});

// Setup dev server or static paths
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
