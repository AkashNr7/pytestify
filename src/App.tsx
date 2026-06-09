import React, { useState, useEffect, useRef } from "react";
import {
  UploadCloud,
  Key,
  RefreshCw,
  FileText,
  Sparkles,
  Terminal,
  Check,
  Copy,
  Download,
  AlertTriangle,
  Server,
  Settings,
  Database,
  Search,
  BookOpen,
  ChevronRight,
  Code,
  FileCode,
  Info,
  Activity,
  Play,
  Layers,
  Cpu,
  Compass,
  ArrowRight,
  ExternalLink,
  ShieldCheck,
  Sun,
  Moon,
  Folder,
  Send,
  Sliders,
  Zap,
  CheckCircle2,
  HelpCircle
} from "lucide-react";

interface HeaderItem {
  key: string;
  value: string;
}

interface RequestItem {
  name: string;
  request: {
    method: string;
    url: string;
    headers: HeaderItem[];
    body: string | null;
  };
  event?: Array<{
    listen: string;
    script: {
      exec: string[];
    };
  }>;
}

interface MigrationItem {
  requestName: string;
  method: string;
  url: string;
  status: string;
  originalAssertions: string[];
  migratedAssertions: string[];
}

interface ModularFile {
  filename: string;
  content: string;
}

interface ExecutionFailure {
  test_name: string;
  error_message: string;
  probable_cause: string;
  recommendations: string;
  code_patch: string;
}

interface ExecutionResult {
  total: number;
  passed: number;
  failed: number;
  execution_time: number;
  output_log: string;
  failures: ExecutionFailure[];
}

export default function App() {
  // Dark/Light Theme Switcher State
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    const stored = localStorage.getItem("pytestify_theme");
    return stored ? stored === "dark" : true; // Default to dark mode for professional dev experience
  });

  const [collectionSource, setCollectionSource] = useState<"upload" | "postman" | "sample" | "settings">("upload");
  const [collectionName, setCollectionName] = useState<string>("");
  const [collectionDescription, setCollectionDescription] = useState<string>("");
  const [collectionItems, setCollectionItems] = useState<RequestItem[]>([]);
  
  // Custom API Settings
  const [library, setLibrary] = useState<"requests" | "httpx" | "async_httpx">("requests");
  const [baseUrlEnv, setBaseUrlEnv] = useState<string>("https://api.example.com");
  const [injectBaseUrlFixture, setInjectBaseUrlFixture] = useState<boolean>(true);
  const [addComments, setAddComments] = useState<boolean>(true);

  // Postman Account API Integration States
  const [postmanApiKey, setPostmanApiKey] = useState<string>("");
  const [isPostmanKeyLoading, setIsPostmanKeyLoading] = useState<boolean>(false);
  const [workspaces, setWorkspaces] = useState<Array<{ id: string; name: string; type: string }>>([]);
  const [selectedWorkspace, setSelectedWorkspace] = useState<string>("");
  const [collections, setCollections] = useState<Array<{ id: string; name: string; uid: string }>>([]);
  const [selectedCollectionUid, setSelectedCollectionUid] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [isCollectionsLoading, setIsCollectionsLoading] = useState<boolean>(false);

  // Migration Response Results
  const [isMigrating, setIsMigrating] = useState<boolean>(false);
  const [pytestCode, setPytestCode] = useState<string>("");
  const [migrations, setMigrations] = useState<MigrationItem[]>([]);
  const [modularFiles, setModularFiles] = useState<ModularFile[]>([]);
  const [aiPromptMeta, setAiPromptMeta] = useState<any>(null);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [sampleCollections, setSampleCollections] = useState<any[]>([]);

  // Custom Gemini API Key override to handle running out of tokens / quota errors gracefully
  const [customApiKey, setCustomApiKey] = useState<string>(() => {
    return localStorage.getItem("pytestify_custom_gemini_key") || "";
  });

  // Sync customApiKey with localStorage
  useEffect(() => {
    localStorage.setItem("pytestify_custom_gemini_key", customApiKey);
  }, [customApiKey]);

  // Selected single request index for Postman-like deep inspect view
  const [selectedRequestIndex, setSelectedRequestIndex] = useState<number>(0);
  const [reqActiveTab, setReqActiveTab] = useState<"headers" | "body" | "chai">("chai");

  // Pytest Simulation States
  const [simulationMode, setSimulationMode] = useState<"success" | "offline" | "drift_auth" | "drift_schema">("success");
  const [isExecuting, setIsExecuting] = useState<boolean>(false);
  const [execResult, setExecResult] = useState<ExecutionResult | null>(null);

  // Left Rail Navigation active view
  const [activeRailTab, setActiveRailTab] = useState<"explorer" | "settings">("explorer");

  // UI Navigation / Interaction states
  const [activeTab, setActiveTab] = useState<"consolidated" | "modular" | "run" | "mcp">("consolidated");

  // MCP Related States
  const [mcpTools, setMcpTools] = useState<any[]>([]);
  const [mcpLogs, setMcpLogs] = useState<any[]>([]);
  const [mcpSelectedTool, setMcpSelectedTool] = useState<string>("generate_pytest");
  const [mcpToolArgs, setMcpToolArgs] = useState<string>(() => {
    return JSON.stringify({
      collection: {
        info: { name: "Sample API" },
        items: [
          { name: "Auth Check", request: { method: "POST", url: "https://api.example.com/v1/login" } }
        ]
      }
    }, null, 2);
  });
  const [mcpRawResponse, setMcpRawResponse] = useState<string>("");
  const [mcpIsCallingTool, setMcpIsCallingTool] = useState<boolean>(false);
  
  // Agent Chat States
  const [mcpAgentInput, setMcpAgentInput] = useState<string>("");
  const [agentChats, setAgentChats] = useState<any[]>([
    {
      sender: "agent",
      thought: "Initialized QA helper agent. Ready to handle collection migrations and failures diagnoses.",
      finalResponse: "Hello! I am your AI Agent integrated with local MCP tools. Ask me to fetch collections, translate them to pytest, execute tests, or analyze mock failures!",
      timestamp: new Date().toISOString()
    }
  ]);
  const [mcpIsAgentThinking, setMcpIsAgentThinking] = useState<boolean>(false);

  const fetchMcpTools = async () => {
    try {
      const res = await fetch("/api/mcp/tools");
      if (res.ok) {
        const data = await res.json();
        setMcpTools(data.tools || []);
      }
    } catch (e) {
      console.error("Failed to load schema tools", e);
    }
  };

  const fetchMcpLogs = async () => {
    try {
      const res = await fetch("/api/mcp/logs");
      if (res.ok) {
        const data = await res.json();
        setMcpLogs(data.logs || []);
      }
    } catch (e) {
      console.error("Failed to load mcp query logs", e);
    }
  };

  useEffect(() => {
    if (activeTab === "mcp") {
      fetchMcpTools();
      fetchMcpLogs();
      const interval = setInterval(() => {
        fetchMcpTools();
        fetchMcpLogs();
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [activeTab]);

  useEffect(() => {
    if (mcpSelectedTool === "fetch_postman_collection") {
      setMcpToolArgs(JSON.stringify({ collection_id: "user-api" }, null, 2));
    } else if (mcpSelectedTool === "generate_pytest") {
      setMcpToolArgs(JSON.stringify({
        collection: {
          info: { name: "User Service" },
          items: [
            {
              name: "Health status Check",
              request: { method: "GET", url: "https://api.example.com/v1/health" }
            }
          ]
        }
      }, null, 2));
    } else if (mcpSelectedTool === "run_pytest") {
      setMcpToolArgs(JSON.stringify({ file_path: "test_all_apis.py" }, null, 2));
    } else if (mcpSelectedTool === "analyze_failure") {
      const errorLogText = execResult?.failures?.[0]?.error_message || "AssertionError: Expected 201 Response code but got 401 Unauthorized status.";
      setMcpToolArgs(JSON.stringify({ error_log: errorLogText }, null, 2));
    }
  }, [mcpSelectedTool, execResult]);

  const handleInvokeMcpToolRaw = async () => {
    setMcpIsCallingTool(true);
    setMcpRawResponse("");
    try {
      let parsedArgs = {};
      try {
        parsedArgs = JSON.parse(mcpToolArgs);
      } catch (jsonErrString) {
        setMcpRawResponse(`// JSON-RPC Error: Invalid JSON input parameters.\n${jsonErrString}`);
        setMcpIsCallingTool(false);
        return;
      }

      const jsonRpcPayload = {
        jsonrpc: "2.0",
        method: "tools/call",
        params: {
          name: mcpSelectedTool,
          arguments: parsedArgs
        },
        id: Date.now()
      };

      const res = await fetch("/api/mcp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(jsonRpcPayload)
      });

      if (!res.ok) {
        const txt = await res.text();
        setMcpRawResponse(`// Http Error Block: ${res.status} ${res.statusText}\n${txt}`);
      } else {
        const data = await res.json();
        setMcpRawResponse(JSON.stringify(data, null, 2));
        fetchMcpTools();
        fetchMcpLogs();
      }
    } catch (e: any) {
      setMcpRawResponse(`// Client Exception raised on Fetch Request:\n${e.message || String(e)}`);
    } finally {
      setMcpIsCallingTool(false);
    }
  };

  const handleAgentChatSubmit = async (customPrompt?: string) => {
    const activePrompt = customPrompt || mcpAgentInput;
    if (!activePrompt.trim()) return;

    const newUserMsg = {
      sender: "user",
      text: activePrompt,
      timestamp: new Date().toISOString()
    };

    setAgentChats(prev => [...prev, newUserMsg]);
    if (!customPrompt) {
      setMcpAgentInput("");
    }
    setMcpIsAgentThinking(true);

    try {
      const errorDetails = execResult?.failures?.map(f => `${f.test_name}: ${f.error_message}`).join("\n") || "";

      const res = await fetch("/api/mcp/agent-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: activePrompt,
          customApiKey,
          contextState: {
            errorDetails
          }
        })
      });

      if (!res.ok) {
        const errorText = await res.text();
        setAgentChats(prev => [...prev, {
          sender: "agent",
          finalResponse: `Agent failed to execute successfully. Status ${res.status}: ${errorText}`,
          timestamp: new Date().toISOString()
        }]);
      } else {
        const data = await res.json();
        setAgentChats(prev => [...prev, {
          sender: "agent",
          thought: data.thought,
          toolCalled: data.toolCalled,
          toolArguments: data.toolArguments,
          toolResult: data.toolResult,
          finalResponse: data.finalResponse,
          timestamp: new Date().toISOString()
        }]);
        fetchMcpTools();
        fetchMcpLogs();
      }
    } catch (err: any) {
      setAgentChats(prev => [...prev, {
        sender: "agent",
        finalResponse: `Network error connecting to Agent Server: ${err.message}`,
        timestamp: new Date().toISOString()
      }]);
    } finally {
      setMcpIsAgentThinking(false);
    }
  };

  const [copiedStates, setCopiedStates] = useState<Record<string, boolean>>({});
  const [dragOver, setDragOver] = useState<boolean>(false);
  const [selectedFileIndex, setSelectedFileIndex] = useState<number>(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync theme with localstorage
  useEffect(() => {
    localStorage.setItem("pytestify_theme", isDarkMode ? "dark" : "light");
  }, [isDarkMode]);

  // Load Built-in Examples initially
  useEffect(() => {
    fetchSampleExamples();
  }, []);

  // Update selected request index when collection items load
  useEffect(() => {
    if (collectionItems.length > 0) {
      setSelectedRequestIndex(0);
    }
  }, [collectionItems]);

  const fetchSampleExamples = async () => {
    try {
      const response = await fetch("/api/examples");
      if (response.ok) {
        const data = await response.json();
        setSampleCollections(data || []);
        if (data.length > 0) {
          handleSelectSample(data[0]);
        }
      }
    } catch (e) {
      console.error("Failed to load sample collections", e);
    }
  };

  const handleSelectSample = (sample: any) => {
    setCollectionName(sample.name);
    setCollectionDescription(sample.description || "Interactive quick-start API example.");
    setCollectionItems(sample.items || []);
    setCollectionSource("sample");
    resetEngineState();
  };

  const resetEngineState = () => {
    setPytestCode("");
    setMigrations([]);
    setModularFiles([]);
    setExecResult(null);
    setErrorMessage("");
    setActiveTab("consolidated");
  };

  // Drag and drop JSON file handling
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => {
    setDragOver(false);
  };

  const parseCollectionAndPopulate = (jsonText: string) => {
    try {
      const parsed = JSON.parse(jsonText);
      let name = "Custom Collection";
      let desc = "";
      let items: any[] = [];

      if (parsed.info) {
        name = parsed.info.name || name;
        desc = parsed.info.description || desc;
      }
      
      if (parsed.item && Array.isArray(parsed.item)) {
        items = parsed.item;
      } else if (Array.isArray(parsed)) {
        items = parsed;
      }

      const list: any[] = [];
      const recurse = (arr: any[]) => {
        for (const item of arr) {
          if (!item) continue;
          if (item.item && Array.isArray(item.item)) {
            recurse(item.item);
          } else if (item.request) {
            let testLines: string[] = [];
            if (item.event && Array.isArray(item.event)) {
              const testAct = item.event.find((e: any) => e.listen === "test");
              if (testAct && testAct.script && Array.isArray(testAct.script.exec)) {
                testLines = testAct.script.exec;
              } else if (testAct && testAct.script && typeof testAct.script.exec === "string") {
                testLines = [testAct.script.exec];
              }
            }

            let bodyContent = null;
            if (item.request.body) {
              if (item.request.body.mode === "raw" && item.request.body.raw) {
                bodyContent = item.request.body.raw;
              } else if (item.request.body.raw) {
                bodyContent = item.request.body.raw;
              }
            }

            const urlStr = typeof item.request.url === "string" 
              ? item.request.url 
              : (item.request.url?.raw || "");

            const headers = Array.isArray(item.request.header)
              ? item.request.header.map((h: any) => ({ key: h.key || "", value: h.value || "" }))
              : [];

            list.push({
              name: item.name || "Request Flow",
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
                    exec: testLines
                  }
                }
              ]
            });
          }
        }
      };

      recurse(items);

      if (list.length === 0) {
        setErrorMessage("Valid collection data uploaded, but no active HTTP requests found.");
        return;
      }

      setCollectionName(name);
      setCollectionDescription(desc);
      setCollectionItems(list);
      setErrorMessage("");
      resetEngineState();
    } catch (e: any) {
      setErrorMessage(`Failed to parse file as valid JSON: ${e.message}`);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      const file = files[0];
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          parseCollectionAndPopulate(event.target.result as string);
        }
      };
      reader.readAsText(file);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          parseCollectionAndPopulate(event.target.result as string);
        }
      };
      reader.readAsText(file);
    }
  };

  // Connect to Postman Actions
  const handleConnectPostman = async () => {
    if (!postmanApiKey.trim()) {
      alert("Please enter a valid Postman API key first.");
      return;
    }
    setIsPostmanKeyLoading(true);
    setErrorMessage("");
    try {
      const res = await fetch("/api/postman/workspaces", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ apiKey: postmanApiKey })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to fetch workspaces.");
      }
      setWorkspaces(data.workspaces || []);
      if (data.workspaces?.length > 0) {
        setSelectedWorkspace(data.workspaces[0].id);
        fetchWorkspaceCollections(postmanApiKey, data.workspaces[0].id);
      } else {
        setCollections([]);
      }
    } catch (err: any) {
      setErrorMessage(`Postman Connection Error: ${err.message}`);
    } finally {
      setIsPostmanKeyLoading(false);
    }
  };

  const fetchWorkspaceCollections = async (key: string, wId: string) => {
    setIsCollectionsLoading(true);
    try {
      const res = await fetch("/api/postman/collections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ apiKey: key, workspaceId: wId })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load collections");
      setCollections(data.collections || []);
    } catch (err: any) {
      setErrorMessage(`Failed to fetch collections: ${err.message}`);
    } finally {
      setIsCollectionsLoading(false);
    }
  };

  const handleWorkspaceChange = (wId: string) => {
    setSelectedWorkspace(wId);
    fetchWorkspaceCollections(postmanApiKey, wId);
  };

  const handleSelectPostmanCollection = async (uid: string) => {
    setSelectedCollectionUid(uid);
    setIsCollectionsLoading(true);
    setErrorMessage("");
    try {
      const res = await fetch("/api/postman/fetch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ apiKey: postmanApiKey, collectionUid: uid })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to fetch collection detail.");
      
      setCollectionName(data.name);
      setCollectionDescription(data.description || "Directly loaded from Postman Cloud Account.");
      setCollectionItems(data.items || []);
      resetEngineState();
    } catch (err: any) {
      setErrorMessage(`Collection Load Error: ${err.message}`);
    } finally {
      setIsCollectionsLoading(false);
    }
  };

  // Convert Collection Action
  const handleMigrate = async () => {
    if (collectionItems.length === 0) {
      alert("Please select or upload a Postman Collection first.");
      return;
    }
    setIsMigrating(true);
    setErrorMessage("");
    try {
      const res = await fetch("/api/migrate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: collectionItems,
          options: {
            library,
            baseUrl: baseUrlEnv,
            injectBaseUrlFixture,
            addComments
          },
          customApiKey
        })
      });
      const data = await res.json();
      if (res.status === 449) {
        throw new Error("Missing Gemini API Key. Please add your GEMINI_API_KEY in the Settings > Secrets section of AI Studio build room.");
      }
      if (!res.ok) {
        throw new Error(data.error || "Failed to complete migration mapping.");
      }

      setPytestCode(data.pytest_code || "");
      setMigrations(data.migrations || []);
      setModularFiles(data.modular_files || []);
      setAiPromptMeta(data.ai_prompt_meta || null);
      setActiveTab("consolidated");
      setSelectedFileIndex(0);
    } catch (err: any) {
      setErrorMessage(err.message);
    } finally {
      setIsMigrating(false);
    }
  };

  // Run Simulated Pytest Logic & Failure Agent loop
  const handleExecuteTests = async () => {
    if (!pytestCode) {
      alert("Please convert the collection into Pytest code first.");
      return;
    }
    setIsExecuting(true);
    try {
      const res = await fetch("/api/execute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pytest_code: pytestCode,
          simulationMode,
          customApiKey
        })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Simulation engine returned invalid feedback.");
      }
      setExecResult(data);
      setActiveTab("run");
    } catch (err: any) {
      alert(`Execution simulation error: ${err.message}`);
    } finally {
      setIsExecuting(false);
    }
  };

  // Handle Clipboard Copy
  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedStates((prev) => ({ ...prev, [key]: true }));
    setTimeout(() => {
      setCopiedStates((prev) => ({ ...prev, [key]: false }));
    }, 2000);
  };

  // Download test_all_apis.py
  const handleDownloadSingle = () => {
    if (!pytestCode) return;
    const blob = new Blob([pytestCode], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "test_all_apis.py";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Download ZIP
  const handleDownloadZip = async () => {
    if (!pytestCode) return;
    try {
      const response = await fetch("/api/download-zip", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pytest_code: pytestCode,
          modular_files: modularFiles
        })
      });
      if (!response.ok) throw new Error("Server failed to compile ZIP data stream.");
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "generated_pytest_suite.zip";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (e: any) {
      alert("ZIP compilation failed: " + e.message);
    }
  };

  const filteredCollections = collections.filter((c) =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Simple token highlighter component to make postman assertion view look professional
  function HighlightJsExpression({ code }: { code: string }) {
    if (!code) return <span className="text-neutral-500 italic">No assertions written for this step</span>;
    const parts = code.split(/(".*?"|'.*?'|\/\/.*|\bexpect\b|\bpm\b|\btest\b|\bfunction\b)/);
    return (
      <span className={`font-mono text-xs select-all ${isDarkMode ? "text-neutral-300" : "text-neutral-700"}`}>
        {parts.map((part, i) => {
          if (part.startsWith('"') || part.startsWith("'")) {
            return <span key={i} className={isDarkMode ? "text-amber-400 font-medium" : "text-amber-700 font-medium"}>{part}</span>;
          }
          if (part.startsWith('//')) {
            return <span key={i} className="text-neutral-500 italic">{part}</span>;
          }
          if (part === 'expect' || part === 'test') {
            return <span key={i} className={isDarkMode ? "text-orange-400 font-semibold" : "text-orange-600 font-semibold"}>{part}</span>;
          }
          if (part === 'function') {
            return <span key={i} className={isDarkMode ? "text-purple-400 font-medium" : "text-[#8c29b3] font-medium"}>{part}</span>;
          }
          if (part === 'pm') {
            return <span key={i} className={isDarkMode ? "text-blue-400 font-bold" : "text-blue-700 font-bold"}>{part}</span>;
          }
          return <span key={i}>{part}</span>;
        })}
      </span>
    );
  }

  const selectedRequest = collectionItems[selectedRequestIndex];

  // Professional style coloring configurations based on state
  const bgMain = isDarkMode ? "bg-[#0c0d0f] text-neutral-200" : "bg-[#fcfcfb] text-neutral-800";
  const bgSide = isDarkMode ? "bg-[#141518]" : "bg-[#f1f1ed]";
  const bgAccent = isDarkMode ? "bg-[#1a1b1f]" : "bg-[#fafafa]";
  const borderCol = isDarkMode ? "border-neutral-800/80" : "border-neutral-200";
  const textTitle = isDarkMode ? "text-neutral-100" : "text-neutral-900";
  const textMuted = isDarkMode ? "text-neutral-400" : "text-neutral-500";
  const bgCard = isDarkMode ? "bg-[#1d1f23]" : "bg-white";
  const selectStyle = isDarkMode 
    ? "bg-[#151619] border-neutral-700 text-neutral-200" 
    : "bg-white border-neutral-300 text-neutral-800";

  return (
    <div className={`min-h-screen flex flex-col font-sans transition-colors duration-200 antialiased selection:bg-[#ef5b25]/20 selection:text-orange-500 ${bgMain}`}>
      
      {/* Top Editorial System Bar (Highly Technical and Sleek) */}
      <div className={`${isDarkMode ? "bg-[#0b241d] text-[#beebd8]" : "bg-[#0c3127] text-[#dfebd5]"} text-[11px] font-mono py-1 px-4 tracking-wider flex justify-between items-center z-50 transition-colors`}>
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-[#ef5b25] animate-pulse"></span>
          <span>POSTMAN-TO-PYTEST AUTO-MIGRATOR COMPREHENSIVE SUITE</span>
        </div>
        <div className="hidden md:flex items-center gap-6">
          <span>ACTIVE INSTANCE: EXPRESS/VITE PRO</span>
          <span>THEME: {isDarkMode ? "OBSIDIAN DEEP" : "ALABASTER MOCK-UP"}</span>
          <span>UTC {new Date().toISOString().replace('T', ' ').substring(0, 19)}</span>
        </div>
      </div>

      {/* Main Header navigation and Workspace context */}
      <header className={`border-b ${borderCol} ${isDarkMode ? "bg-[#111215]" : "bg-[#fbfbfa]"} py-3 px-6 sticky top-0 z-40 transition-colors shadow-xs`}>
        <div className="max-w-8xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#ef5b25] rounded-lg text-white shadow-sm flex items-center justify-center">
              <Zap className="h-5 w-5 fill-white/10" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className={`text-base font-display font-bold ${textTitle} tracking-tight`}>
                  Pytestify Studio
                </h1>
                <span className="px-1.5 py-0.5 text-[8px] uppercase font-mono tracking-wider rounded bg-neutral-800 border border-neutral-700 text-amber-500 font-bold">
                  v3.6 WORKSPACE
                </span>
              </div>
              <p className="text-xs text-neutral-500 mt-0.5 font-light">
                Professional API engine translating Chai JS dynamic actions to idiomatic pytest modules.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 w-full md:w-auto justify-end">
            {/* Quick Dark Mode toggle in the top Bar */}
            <button
              onClick={() => setIsDarkMode(!isDarkMode)}
              className={`p-2 rounded-lg border ${borderCol} ${isDarkMode ? "hover:bg-neutral-800 text-yellow-400" : "hover:bg-neutral-100 text-[#ef5b25]"} transition-all duration-200`}
              title={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
            >
              {isDarkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>

            <button
              id="reset-samples-btn-header"
              onClick={fetchSampleExamples}
              className={`px-3 py-2 text-xs font-mono font-medium rounded-lg border ${borderCol} ${isDarkMode ? "text-neutral-300 hover:bg-neutral-800" : "text-neutral-600 hover:bg-neutral-100"} transition flex items-center gap-1.5`}
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Reset Samples
            </button>

            <a
              href="https://ai.studio/build"
              target="_blank"
              rel="noopener noreferrer"
              className="px-3.5 py-2 bg-[#ef5b25] text-white rounded-lg text-xs font-mono font-bold hover:bg-[#d84e1b] transition duration-200 flex items-center gap-1.5 shadow-sm"
            >
              AI Build Studio
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        </div>
      </header>

      {/* Primary Triple-Pane Workspace Layout mirroring advanced API tools */}
      <div className="flex-1 flex flex-col xl:flex-row items-stretch">
        
        {/* Left Side Icon Navigation Rail (VS Code / Postman Style) */}
        <section className={`w-14 items-center flex xl:flex-col justify-start border-r ${borderCol} ${bgSide} py-4 px-2 gap-5 text-center shrink-0`}>
          <button
            onClick={() => { setActiveRailTab("explorer"); if (collectionSource === "settings") setCollectionSource("upload"); }}
            className={`p-2.5 rounded-xl transition ${activeRailTab === "explorer" ? "bg-[#ef5b25] text-white shadow-md" : isDarkMode ? "text-neutral-400 hover:text-white hover:bg-neutral-800" : "text-neutral-600 hover:bg-neutral-200"}`}
            title="Collection Explorer"
          >
            <Folder className="h-5 w-5" />
          </button>
          
          <button
            onClick={() => { setActiveRailTab("settings"); setCollectionSource("settings"); }}
            className={`p-2.5 rounded-xl transition ${activeRailTab === "settings" ? "bg-[#ef5b25] text-white shadow-md" : isDarkMode ? "text-neutral-400 hover:text-white hover:bg-neutral-800" : "text-neutral-600 hover:bg-neutral-200"}`}
            title="Pytest Configurations"
          >
            <Sliders className="h-5 w-5" />
          </button>



          <div className="flex-1 hidden xl:block"></div>

          {/* Theme switcher on Rail bottom */}
          <button
            onClick={() => setIsDarkMode(!isDarkMode)}
            className={`p-2.5 rounded-xl transition hidden xl:block ${isDarkMode ? "text-yellow-400 hover:bg-neutral-800" : "text-neutral-600 hover:bg-neutral-200"}`}
          >
            {isDarkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </button>
        </section>

        {/* Triple Pane Split Grid */}
        <main className="flex-1 grid grid-cols-1 lg:grid-cols-12 items-stretch divide-y lg:divide-y-0 lg:divide-x divide-neutral-800/20">
          
          {/* PANE 1: SOURCE MANAGEMENT & TREE TREE DIRECTORY (col-span-4) */}
          <div className="lg:col-span-4 flex flex-col p-4 md:p-5 gap-5">
            
            {/* Source Tab Header */}
            <div>
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-mono uppercase tracking-widest text-orange-500 font-bold">PANE 1 • CLIENT INTAKE</span>
                <span className="text-[10px] font-mono text-neutral-400">SELECT IMPORT SOURCE</span>
              </div>
              <h2 className={`text-sm font-display font-bold ${textTitle} mt-0.5`}>
                Source API Repository
              </h2>
            </div>

            {/* Selector Grid for Imports */}
            <div className={`grid grid-cols-3 p-1 ${isDarkMode ? "bg-neutral-900 border-neutral-800" : "bg-neutral-100 border-neutral-200"} rounded-lg border font-mono`}>
              <button
                type="button"
                onClick={() => { setCollectionSource("upload"); setActiveRailTab("explorer"); }}
                className={`py-1.5 text-[10px] sm:text-xs font-medium rounded-md transition-all ${
                  collectionSource === "upload"
                    ? "bg-[#ef5b25] text-white shadow-sm"
                    : isDarkMode ? "text-neutral-400 hover:text-neutral-200" : "text-neutral-500 hover:text-neutral-800"
                }`}
              >
                Upload File
              </button>
              <button
                type="button"
                onClick={() => { setCollectionSource("postman"); setActiveRailTab("explorer"); }}
                className={`py-1.5 text-[10px] sm:text-xs font-medium rounded-md transition-all ${
                  collectionSource === "postman"
                    ? "bg-[#ef5b25] text-white shadow-sm"
                    : isDarkMode ? "text-neutral-400 hover:text-neutral-200" : "text-neutral-500 hover:text-neutral-800"
                }`}
              >
                Postman Cloud
              </button>
              <button
                type="button"
                onClick={() => { setCollectionSource("sample"); setActiveRailTab("explorer"); }}
                className={`py-1.5 text-[10px] sm:text-xs font-medium rounded-md transition-all ${
                  collectionSource === "sample"
                    ? "bg-[#ef5b25] text-white shadow-sm"
                    : isDarkMode ? "text-neutral-400 hover:text-neutral-200" : "text-neutral-500 hover:text-neutral-800"
                }`}
              >
                Built-in Market
              </button>
            </div>

            {/* RENDER ACTIVE IMPORT SOURCE CARD */}
            <div className={`border ${borderCol} rounded-xl p-4 ${bgAccent}`}>
              {/* FILE UPLOAD DISPLAY */}
              {collectionSource === "upload" && (
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border border-dashed rounded-lg p-5 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-2 group ${
                    dragOver
                      ? "border-[#ef5b25] bg-[#ef5b25]/5"
                      : isDarkMode 
                      ? "border-neutral-700 bg-neutral-900/40 hover:bg-neutral-900/80" 
                      : "border-neutral-300 bg-white hover:bg-neutral-50"
                  }`}
                >
                  <input
                    type="file"
                    accept=".json"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <div className={`p-2 rounded-full ${isDarkMode ? "bg-neutral-800" : "bg-neutral-100"} text-[#ef5b25] group-hover:scale-105 transition-transform duration-200`}>
                    <UploadCloud className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold">Drop Postman v2.1 export here</p>
                    <p className="text-[10px] text-neutral-400 mt-0.5">or click to browse local files</p>
                  </div>
                </div>
              )}

              {/* POSTMAN CLOUD INTEGRATION */}
              {collectionSource === "postman" && (
                <div className="flex flex-col gap-3">
                  <div className="flex flex-col gap-1">
                    <label className="text-[9px] font-mono font-bold text-neutral-400 uppercase tracking-widest flex items-center gap-1">
                      <Key className="h-3 w-3" />
                      Postman API Key
                    </label>
                    <div className="relative">
                      <input
                        type="password"
                        placeholder="PMAK-xxxxxx-xxxx-xxxx"
                        value={postmanApiKey}
                        onChange={(e) => setPostmanApiKey(e.target.value)}
                        className={`w-full text-xs pl-3 pr-20 py-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-[#ef5b25] font-mono ${selectStyle}`}
                      />
                      <button
                        onClick={handleConnectPostman}
                        disabled={isPostmanKeyLoading}
                        className="absolute right-1 top-1 bottom-1 px-2.5 bg-[#ef5b25] hover:bg-[#d84e1b] text-white rounded text-[9px] font-mono font-bold transition flex items-center"
                      >
                        {isPostmanKeyLoading ? "Sync..." : "Fetch"}
                      </button>
                    </div>
                  </div>

                  {workspaces.length > 0 && (
                    <div className="grid grid-cols-1 gap-2 pt-2 border-t border-neutral-800/40">
                      <div className="flex flex-col gap-0.5">
                        <label className="text-[9px] font-mono font-bold text-neutral-400 uppercase">Workspaces</label>
                        <select
                          value={selectedWorkspace}
                          onChange={(e) => handleWorkspaceChange(e.target.value)}
                          className={`py-1 px-2 border rounded-md text-xs font-medium ${selectStyle}`}
                        >
                          {workspaces.map((w) => (
                            <option key={w.id} value={w.id}>{w.name}</option>
                          ))}
                        </select>
                      </div>

                      <div className="flex flex-col gap-0.5">
                        <label className="text-[9px] font-mono font-bold text-neutral-400 uppercase">Search Collections</label>
                        <div className="relative">
                          <input
                            type="text"
                            placeholder="Type to filter..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className={`w-full py-1.5 pl-7 pr-2.5 border rounded-md text-xs ${selectStyle}`}
                          />
                          <Search className="absolute left-2.5 top-2.5 h-3 w-3 text-neutral-500" />
                        </div>
                      </div>
                    </div>
                  )}

                  {collections.length > 0 && (
                    <div className="flex flex-col gap-1 pt-2 border-t border-neutral-800/20">
                      <div className="text-[9px] font-mono text-neutral-400 uppercase flex justify-between items-center">
                        <span>Collections ({filteredCollections.length})</span>
                        {isCollectionsLoading && <RefreshCw className="h-2.5 w-2.5 animate-spin text-[#ef5b25]" />}
                      </div>
                      <div className="max-h-36 overflow-y-auto border border-neutral-800/40 rounded-lg divide-y divide-neutral-800/45 bg-[#0f1011]">
                        {filteredCollections.map((col) => (
                          <button
                            key={col.id}
                            onClick={() => handleSelectPostmanCollection(col.uid)}
                            className={`w-full text-left p-2 transition flex justify-between items-center text-[11px] ${
                              selectedCollectionUid === col.uid
                                ? "bg-[#ef5b25]/10 text-orange-400 font-semibold"
                                : "hover:bg-neutral-800 text-neutral-400"
                            }`}
                          >
                            <span className="truncate pr-1">{col.name}</span>
                            <span className="text-[8px] font-mono px-1.5 py-0.5 bg-[#ef5b25] text-white rounded">Import</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* BUILT-IN DEMO MARKET */}
              {collectionSource === "sample" && (
                <div className="flex flex-col gap-2.5">
                  <div className="text-[11px] text-neutral-400 leading-relaxed">
                    Instantly inject developer verified specimen folders with robust custom validation assertions and environments:
                  </div>
                  <div className="flex flex-col gap-2">
                    {sampleCollections.map((sample) => (
                      <button
                        key={sample.id || sample.name}
                        onClick={() => handleSelectSample(sample)}
                        className={`text-left p-2 border rounded-lg transition duration-200 hover:border-orange-500 hover:bg-[#ef5b25]/5 group ${
                          collectionName === sample.name
                            ? "border-[#ef5b25] bg-[#ef5b25]/10 text-orange-500"
                            : isDarkMode 
                              ? "border-neutral-700/80 bg-neutral-900/30" 
                              : "border-neutral-200 bg-white"
                        }`}
                      >
                        <h4 className={`text-xs font-bold ${isDarkMode ? "text-neutral-200" : "text-neutral-800"} group-hover:text-[#ef5b25]`}>{sample.name}</h4>
                        <span className="text-[9px] text-[#ef5b25]/90 font-mono inline-block mt-1">Load specimen endpoints →</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* PANE 1 SYSTEM CONFIGS TAB (SETTINGS DIRECT VIEW) */}
              {collectionSource === "settings" && (
                <div className="flex flex-col gap-3">
                  <div className="text-[9.5px] font-mono text-neutral-400 uppercase tracking-widest flex items-center gap-1.5 pb-1 border-b border-neutral-800/20">
                    <Sliders className="h-3.5 w-3.5 text-neutral-400" />
                    Tuning Variables
                  </div>
                  <div className="flex flex-col gap-2.5">
                    <div className="flex flex-col gap-0.5">
                      <span className="text-[9px] font-mono text-neutral-400 uppercase">Pytest driver framework</span>
                      <select
                        value={library}
                        onChange={(e) => setLibrary(e.target.value as any)}
                        className={`py-1 px-2 border rounded text-xs select-none ${selectStyle}`}
                      >
                        <option value="requests">requests (Sync)</option>
                        <option value="httpx">httpx (Modern Sync)</option>
                        <option value="async_httpx">httpx (Asyncio Concurrency)</option>
                      </select>
                    </div>

                    <div className="flex flex-col gap-0.5">
                      <span className="text-[9px] font-mono text-neutral-400 uppercase">Override target hostname</span>
                      <input
                        type="text"
                        placeholder="https://api.yourdomain.com"
                        value={baseUrlEnv}
                        onChange={(e) => setBaseUrlEnv(e.target.value)}
                        className={`py-1 px-2 border rounded text-xs font-mono ${selectStyle}`}
                      />
                    </div>

                    <div className="flex flex-col gap-2 pt-2 border-t border-neutral-800/10">
                      <label className="flex items-start gap-2.5 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={injectBaseUrlFixture}
                          onChange={(e) => setInjectBaseUrlFixture(e.target.checked)}
                          className="rounded border-neutral-700 text-[#ef5b25] focus:ring-[#ef5b25] h-3.5 w-3.5 mt-0.5"
                        />
                        <div className={`text-[11px] leading-tight ${isDarkMode ? "text-neutral-400" : "text-neutral-600"}`}>
                          <span className={`font-semibold block ${isDarkMode ? "text-neutral-200" : "text-neutral-850"}`}>Synthesize conftest.py</span>
                          Include general base URL fixtures in distribution.
                        </div>
                      </label>

                      <label className="flex items-start gap-2.5 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={addComments}
                          onChange={(e) => setAddComments(e.target.checked)}
                          className="rounded border-neutral-700 text-[#ef5b25] focus:ring-[#ef5b25] h-3.5 w-3.5 mt-0.5"
                        />
                        <div className={`text-[11px] leading-tight ${isDarkMode ? "text-neutral-400" : "text-neutral-600"}`}>
                          <span className={`font-semibold block ${isDarkMode ? "text-neutral-200" : "text-neutral-850"}`}>Include source line commentary</span>
                          Comment active assertions with original Chai.js equivalents.
                        </div>
                      </label>
                    </div>

                    <div className="flex flex-col gap-1.5 pt-2.5 border-t border-neutral-800/10">
                      <span className="text-[9px] font-mono text-amber-500 uppercase font-bold flex items-center gap-1">
                        <Key className="h-3 w-3" />
                        Fallback Gemini API Key (Optional)
                      </span>
                      <p className={`${isDarkMode ? "text-neutral-500" : "text-neutral-400"} text-[9.5px]/snug font-light`}>
                        If the app's default token limits run out or get busy, supply your own key to secure immediate translation tasks.
                      </p>
                      <input
                        type="password"
                        placeholder="AIzaSy..."
                        value={customApiKey}
                        onChange={(e) => setCustomApiKey(e.target.value)}
                        className={`py-1.5 px-2 border rounded text-xs font-mono placeholder:text-neutral-600 ${selectStyle}`}
                      />
                      {customApiKey && (
                        <div className="flex justify-between items-center text-[9px] font-mono text-emerald-500 bg-emerald-500/5 px-2 py-0.5 rounded border border-emerald-500/10 mt-0.5">
                          <span>✓ Active local key override</span>
                          <button
                            onClick={() => setCustomApiKey("")}
                            className="hover:underline text-neutral-400 text-[8px]"
                          >
                            Clear
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* ERROR DISPLAY AREA */}
            {errorMessage && (
              <div className="p-3 bg-red-950/20 border border-red-900/50 rounded-xl text-red-400 text-xs flex items-start gap-2.5 animate-pulse">
                <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5 text-red-500" />
                <div className="flex-1">
                  <span className="font-bold block text-[9px] tracking-wider uppercase font-mono">Assertion Error</span>
                  <p className="mt-0.5 text-[10px] font-mono break-all leading-normal">{errorMessage}</p>
                </div>
              </div>
            )}

            {/* ENDPOINT EXPLORER TREE VIEW - SIMILAR TO POSTMAN SIDEBAR */}
            {collectionName && (
              <div className={`border ${borderCol} rounded-xl overflow-hidden ${bgAccent} flex-1 flex flex-col min-h-[190px]`}>
                <div className={`px-4 py-2 border-b ${borderCol} ${isDarkMode ? "bg-neutral-900" : "bg-neutral-50"} text-[9px] font-mono uppercase tracking-widest text-neutral-400 flex justify-between items-center`}>
                  <div className="flex items-center gap-1">
                    <Database className="h-3.5 w-3.5 text-orange-500" />
                    <span>Tree Explorer</span>
                  </div>
                  <span>{collectionItems.length} Requests</span>
                </div>
                
                <div className="flex-grow p-2.5 overflow-y-auto max-h-[350px] divide-y divide-neutral-800/10 flex flex-col gap-1 text-xs">
                  {collectionItems.map((item, index) => {
                    const isSelected = selectedRequestIndex === index;
                    const method = item.request.method || "GET";
                    
                    let badgeColor = "bg-emerald-500/10 text-emerald-500 border-emerald-500/20";
                    if (method === "POST") badgeColor = "bg-amber-500/10 text-amber-500 border-amber-500/20";
                    if (method === "PUT") badgeColor = "bg-blue-500/10 text-blue-500 border-blue-500/20";
                    if (method === "DELETE") badgeColor = "bg-rose-500/10 text-rose-500 border-rose-500/20";

                    return (
                      <button
                        key={index}
                        onClick={() => setSelectedRequestIndex(index)}
                        className={`w-full text-left p-2 rounded-lg flex items-center justify-between gap-2.5 border transition ${
                          isSelected 
                            ? isDarkMode
                              ? "bg-neutral-800/50 border-[#ef5b25]/60 text-white shadow-xs"
                              : "bg-neutral-100 border-[#ef5b25]/60 text-neutral-950 font-medium"
                            : "border-transparent hover:bg-neutral-800/10"
                        }`}
                      >
                        <div className="truncate flex-1">
                          <span className="font-semibold block truncate leading-normal">{item.name}</span>
                          <span className="text-[10px] font-mono text-neutral-500 block truncate mt-0.5">{item.request.url}</span>
                        </div>
                        <span className={`px-1.5 py-0.5 text-[8px] font-mono font-bold rounded border ${badgeColor}`}>
                          {method}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Stage Action Core CTA */}
            <button
              onClick={handleMigrate}
              disabled={isMigrating || collectionItems.length === 0}
              className={`w-full py-3.5 rounded-xl font-mono font-bold text-xs uppercase tracking-wider text-white transition transform flex items-center justify-center gap-2 ${
                collectionItems.length === 0
                  ? "bg-neutral-800 text-neutral-500 cursor-not-allowed border border-neutral-700/50"
                  : "bg-gradient-to-r from-[#ef5b25] to-[#f27447] hover:from-[#e04e18] hover:to-[#ef5b25] active:scale-98 shadow-md"
              }`}
            >
              {isMigrating ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin text-white" />
                  Compiling AST mapping...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 text-yellow-300 animate-pulse fill-yellow-300/20" />
                  Compile Pytest Suite
                </>
              )}
            </button>
          </div>

          {/* PANE 2: POSTMAN REQUEST SPEC TAB INTERFACE (col-span-8 - Left nested) AND DETAILED CODE WRITER */}
          <div className="lg:col-span-8 flex flex-col p-4 md:p-6 gap-6 overflow-hidden">
            
            {/* Top Workspace Section 2 Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-widest text-[#ef5b25] font-bold block">PANE 2 • DEVELOPER SPECIFICATION TAB</span>
                <h2 className={`text-base font-display font-medium ${textTitle} mt-0.5`}>
                  {collectionName || "Empty Workspace Instance"}
                </h2>
              </div>
              
              <div className="flex border-b border-neutral-800/40 text-xs overflow-x-auto gap-1 self-stretch sm:self-auto font-mono py-1">
                <button
                  onClick={() => setActiveTab("consolidated")}
                  className={`py-1.5 px-3 border-b-2 transition whitespace-nowrap flex items-center gap-1.5 ${
                    activeTab === "consolidated"
                      ? "border-orange-500 text-orange-500 font-bold"
                      : `border-transparent text-neutral-500 ${isDarkMode ? "hover:text-neutral-300" : "hover:text-neutral-800"}`
                  }`}
                >
                  <Code className="h-4 w-4" />
                  Consolidated Suite
                </button>
                <button
                  onClick={() => setActiveTab("modular")}
                  className={`py-1.5 px-3 border-b-2 transition whitespace-nowrap flex items-center gap-1.5 ${
                    activeTab === "modular"
                      ? "border-orange-500 text-orange-500 font-bold"
                      : `border-transparent text-neutral-500 ${isDarkMode ? "hover:text-neutral-300" : "hover:text-neutral-800"}`
                  }`}
                >
                  <Layers className="h-4 w-4" />
                  Modular Code Files
                </button>
                <button
                  onClick={() => setActiveTab("run")}
                  className={`py-1.5 px-3 border-b-2 transition whitespace-nowrap flex items-center gap-1.5 ${
                    activeTab === "run"
                      ? "border-orange-500 text-orange-500 font-bold"
                      : `border-transparent text-neutral-500 ${isDarkMode ? "hover:text-neutral-300" : "hover:text-neutral-800"}`
                  }`}
                >
                  <Activity className="h-4 w-4" />
                  Live Runner
                </button>
                <button
                  onClick={() => setActiveTab("mcp")}
                  className={`py-1.5 px-3 border-b-2 transition whitespace-nowrap flex items-center gap-1.5 ${
                    activeTab === "mcp"
                      ? "border-orange-500 text-orange-500 font-bold"
                      : `border-transparent text-neutral-500 ${isDarkMode ? "hover:text-neutral-300" : "hover:text-neutral-800"}`
                  }`}
                >
                  <Cpu className="h-4 w-4 text-emerald-500 animate-pulse" />
                  MCP Hub
                </button>

              </div>
            </div>

            {/* IN-DEPTH POSTMAN WORKSPACE REPRESENTATION */}
            {selectedRequest ? (
              <div className={`border ${borderCol} rounded-2xl overflow-hidden ${bgAccent} flex flex-col text-xs shadow-md`}>
                
                {/* Method Badged Request Bar */}
                <div className={`p-4 bg-neutral-900/30 border-b ${borderCol} flex flex-col md:flex-row items-stretch md:items-center gap-3`}>
                  <div className="flex items-stretch gap-2 flex-grow">
                    <span className={`px-3.5 py-2 font-mono font-bold uppercase rounded-lg border text-sm flex items-center shrink-0 ${
                      selectedRequest.request.method === "POST" 
                        ? "bg-amber-500/10 text-amber-500 border-amber-500/20" 
                        : selectedRequest.request.method === "DELETE"
                        ? "bg-rose-500/10 text-rose-500 border-rose-500/20"
                        : selectedRequest.request.method === "PUT"
                        ? "bg-blue-500/10 text-blue-500 border-blue-500/20"
                        : "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                    }`}>
                      {selectedRequest.request.method || "GET"}
                    </span>
                    <div className={`${isDarkMode ? "bg-[#121314] text-[#79c0ff] border-neutral-700/50" : "bg-neutral-100 text-blue-600 border-neutral-200"} font-mono px-3 py-2 rounded-lg border select-all flex-grow truncate flex items-center justify-between`}>
                      <span className="truncate">{selectedRequest.request.url || "https://api.example.com"}</span>
                      <span className={`text-[9px] uppercase ${isDarkMode ? "text-neutral-500" : "text-neutral-400"} px-1 font-mono tracking-widest shrink-0 self-center`}>Chai JS Source</span>
                    </div>
                  </div>
                  <button
                    onClick={handleMigrate}
                    className="bg-[#ef5b25]/10 hover:bg-[#ef5b25]/15 text-[#ef5b25] border border-[#ef5b25]/30 font-mono font-semibold py-2 px-4 rounded-lg flex items-center justify-center gap-2 tracking-wide text-xs"
                  >
                    <Send className="h-3 w-3 translate-x-px" />
                    Convert
                  </button>
                </div>

                {/* Postman Mock Tabs Selector */}
                <div className={`border-b ${borderCol} flex px-4 ${isDarkMode ? "bg-neutral-900/10" : "bg-neutral-100"} overflow-x-auto text-xs gap-4 font-mono`}>
                  <button
                    onClick={() => setReqActiveTab("chai")}
                    className={`py-2 px-1 border-b-2 transition whitespace-nowrap flex items-center gap-1.5 ${
                      reqActiveTab === "chai"
                        ? `border-[#ef5b25] ${isDarkMode ? "text-white" : "text-neutral-900"} font-bold`
                        : `border-transparent text-neutral-500 ${isDarkMode ? "hover:text-[#ef5b25]" : "hover:text-black"}`
                    }`}
                  >
                    Workspace Tests ({selectedRequest.event?.[0]?.script?.exec?.length || 0})
                  </button>
                  <button
                    onClick={() => setReqActiveTab("headers")}
                    className={`py-2 px-1 border-b-2 transition whitespace-nowrap flex items-center gap-1.5 ${
                      reqActiveTab === "headers"
                        ? `border-[#ef5b25] ${isDarkMode ? "text-white" : "text-neutral-900"} font-bold`
                        : `border-transparent text-neutral-500 ${isDarkMode ? "hover:text-[#ef5b25]" : "hover:text-black"}`
                    }`}
                  >
                    Headers ({selectedRequest.request.headers?.length || 0})
                  </button>
                  <button
                    onClick={() => setReqActiveTab("body")}
                    className={`py-2 px-1 border-b-2 transition whitespace-nowrap flex items-center gap-1.5 ${
                      reqActiveTab === "body"
                        ? `border-[#ef5b25] ${isDarkMode ? "text-white" : "text-neutral-900"} font-bold`
                        : `border-transparent text-neutral-500 ${isDarkMode ? "hover:text-[#ef5b25]" : "hover:text-black"}`
                    }`}
                  >
                    JSON Body Setup
                  </button>
                </div>

                {/* Postman Mock Tabs Content */}
                <div className={`p-4 ${isDarkMode ? "bg-[#121314]" : "bg-neutral-50"} overflow-x-auto text-[11px] leading-relaxed select-all`}>
                  
                  {/* TAB 1: ORIGINAL JS ASSERTIONS */}
                  {reqActiveTab === "chai" && (
                    <div className="flex flex-col gap-1 min-h-[120px] max-h-[220px] overflow-y-auto">
                      {(selectedRequest.event?.[0]?.script?.exec && selectedRequest.event[0].script.exec.length > 0) ? (
                        selectedRequest.event[0].script.exec.map((line, idx) => (
                          <div key={idx} className={`flex gap-4 ${isDarkMode ? "hover:bg-neutral-800/30" : "hover:bg-neutral-200/50"} whitespace-pre`}>
                            <span className="text-neutral-500 block w-6 select-none shrink-0 text-right">{idx+1}</span>
                            <HighlightJsExpression code={line} />
                          </div>
                        ))
                      ) : (
                        <div className="text-neutral-500 italic p-4 text-center">
                          No pre-written JavaScript asserts found in this step. Pytestify will synthesize standard response code 200 checks.
                        </div>
                      )}
                    </div>
                  )}

                  {/* TAB 2: HEADERS LIST */}
                  {reqActiveTab === "headers" && (
                    <div className="min-h-[120px] max-h-[220px] overflow-y-auto">
                      {selectedRequest.request.headers && selectedRequest.request.headers.length > 0 ? (
                        <table className="w-full border-collapse font-mono text-[10.5px]">
                          <thead>
                            <tr className={`border-b ${isDarkMode ? "border-neutral-800 text-neutral-500" : "border-neutral-200 text-neutral-500"}`}>
                              <th className="text-left py-1 text-[9px] uppercase tracking-wider">Key Header</th>
                              <th className="text-left py-1 text-[9px] uppercase tracking-wider">Value</th>
                            </tr>
                          </thead>
                          <tbody className={`divide-y ${isDarkMode ? "divide-neutral-800/40 text-neutral-300" : "divide-neutral-200 text-neutral-700"}`}>
                            {selectedRequest.request.headers.map((h, i) => (
                              <tr key={i} className={isDarkMode ? "hover:bg-neutral-800/20" : "hover:bg-neutral-200/40"}>
                                <td className={`py-1.5 pr-4 ${isDarkMode ? "text-orange-400" : "text-orange-600"} select-all`}>{h.key}</td>
                                <td className="py-1.5 select-all text-neutral-500">{h.value}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      ) : (
                        <div className="text-neutral-500 italic p-4 text-center font-mono">
                          No HTTP headers configured. Standard Content-Type: application/json will be assumed.
                        </div>
                      )}
                    </div>
                  )}

                  {/* TAB 3: BODY LAYOUT */}
                  {reqActiveTab === "body" && (
                    <div className="min-h-[120px] max-h-[220px] overflow-y-auto">
                      {selectedRequest.request.body ? (
                        <pre className={`${isDarkMode ? "text-neutral-300" : "text-neutral-700"} font-mono text-[10.5px] leading-relaxed max-w-full select-all`}>
                          <code>{selectedRequest.request.body}</code>
                        </pre>
                      ) : (
                        <div className="text-neutral-500 italic p-4 text-center font-mono">
                          No raw payload body for this request format (GET/DELETE etc).
                        </div>
                      )}
                    </div>
                  )}

                </div>
              </div>
            ) : (
              <div className={`p-8 border border-dashed ${borderCol} rounded-xl text-center text-neutral-500 text-xs`}>
                Provide an API collection file above to explore detailed endpoint specifications.
              </div>
            )}

            {/* TAB AREA 1: CONSOLIDATED CODE SUITE (With realistic IDE look) */}
            {activeTab === "consolidated" && (
              <div className="flex flex-col gap-5">
                {!pytestCode ? (
                  <div className={`rounded-2xl border ${borderCol} ${bgAccent} p-12 text-center flex flex-col items-center justify-center gap-4 shadow-sm`}>
                    <div className="p-3 bg-[#ef5b25]/10 rounded-full text-[#ef5b25] border border-[#ef5b25]/20 animate-pulse">
                      <Code className="h-7 w-7" />
                    </div>
                    <div>
                      <h3 className="text-xs font-semibold">No Compiled Code</h3>
                      <p className="text-[11px] text-neutral-500 max-w-xs mx-auto mt-1 leading-normal">
                        Click the "Compile Pytest Suite" button to trigger the AST assertion mapping system.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col gap-4">
                    
                    {/* Action buttons bar */}
                    <div className={`flex flex-wrap justify-between items-center gap-2.5 p-3 rounded-xl border ${borderCol} ${bgAccent}`}>
                      <div className="text-[10px] text-neutral-400 font-mono">
                        PYTHON: {pytestCode.split("\n").length} Lines • {pytestCode.length} Bytes
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => copyToClipboard(pytestCode, "consolidatedCode")}
                          className={`px-3 py-1.5 border ${borderCol} hover:bg-neutral-800/10 rounded-lg text-[11px] font-mono font-semibold transition flex items-center gap-1.5`}
                        >
                          {copiedStates["consolidatedCode"] ? (
                            <>
                              <Check className="h-3.5 w-3.5 text-emerald-500" />
                              Copied!
                            </>
                          ) : (
                            <>
                              <Copy className="h-3 w-3" />
                              Copy
                            </>
                          )}
                        </button>
                        <button
                          onClick={handleDownloadSingle}
                          className={`px-3 py-1.5 border ${borderCol} hover:bg-neutral-800/10 rounded-lg text-[11px] font-mono font-semibold transition flex items-center gap-1.5`}
                        >
                          <Download className="h-3 w-3" />
                          Download Single
                        </button>
                        <button
                          onClick={handleDownloadZip}
                          className="px-3.5 py-1.5 bg-[#ef5b25] hover:bg-[#d84e1b] rounded-lg text-[11px] font-mono font-bold text-white transition flex items-center gap-1.5 shadow-sm"
                        >
                          <Download className="h-3 w-3" />
                          Download Suite (ZIP)
                        </button>
                      </div>
                    </div>

                    {/* IDE look view with sidebar file hierarchy */}
                    <div className={`border ${isDarkMode ? "border-neutral-700/80 bg-[#121314]" : "border-neutral-300 bg-neutral-50"} rounded-xl overflow-hidden flex shadow-lg`}>
                      {/* Tiny Sidebar simulating folder layouts */}
                      <div className={`hidden sm:flex flex-col w-[170px] ${isDarkMode ? "bg-[#1a1b1d] border-r border-[#2d2e30]/40 text-[#9da5b4]" : "bg-neutral-100 border-r border-neutral-200 text-neutral-600"} shrink-0 font-mono text-[10px] p-3 text-left`}>
                        <div className={`text-[9px] uppercase tracking-wider ${isDarkMode ? "text-neutral-500" : "text-neutral-400"} font-bold mb-3.5`}>EXPLORER</div>
                        <div className="flex flex-col gap-2">
                          <div className={`font-medium flex items-center gap-1 ${isDarkMode ? "text-white" : "text-neutral-800"}`}>
                            <span className="text-amber-500 text-[8px]">▼</span> pytest_suite/
                          </div>
                          <button className={`pl-4 ${isDarkMode ? "text-emerald-400" : "text-emerald-600"} font-bold flex items-center gap-1.5 border-l ${isDarkMode ? "border-neutral-700" : "border-neutral-300"} ml-1.5 text-left py-0.5`}>
                            <FileCode className={`h-3.5 w-3.5 ${isDarkMode ? "text-emerald-400" : "text-emerald-600"}`} />
                            test_all_apis.py
                          </button>
                          {modularFiles.map((file, i) => (
                            <button
                              key={i}
                              onClick={() => { setActiveTab("modular"); setSelectedFileIndex(i); }}
                              className={`pl-4 flex items-center gap-1.5 border-l ${isDarkMode ? "border-neutral-700/30 hover:border-neutral-500 hover:text-white text-[#9da5b4]" : "border-neutral-200 hover:border-neutral-400 hover:text-neutral-900 text-neutral-500"} ml-1.5 text-left py-0.5`}
                            >
                              <FileCode className="h-3.5 w-3.5 text-neutral-400" />
                              {file.filename}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* True code viewer body */}
                      <div className="flex-1 flex flex-col min-w-0">
                        <div className={`${isDarkMode ? "bg-[#18191b] border-b border-[#2d2e30]/30 text-neutral-400" : "bg-neutral-100/60 border-b border-neutral-200 text-neutral-600"} py-2 px-4 flex justify-between items-center text-[9px] font-mono`}>
                          <span className="flex items-center gap-2">
                            <span className={`w-1.5 h-1.5 rounded-full ${isDarkMode ? "bg-emerald-500" : "bg-emerald-600"}`}></span>
                            test_all_apis.py (Generated Python Pytest Layout)
                          </span>
                          <span>Python3 / UTF-8</span>
                        </div>
                        <div className="overflow-x-auto max-h-[340px] overflow-y-auto">
                          <table className="w-full border-collapse">
                            <tbody>
                              {pytestCode.split("\n").map((line, index) => (
                                <tr key={index} className={`font-mono text-[11px] leading-normal ${isDarkMode ? "hover:bg-neutral-800/10" : "hover:bg-neutral-250/20"}`}>
                                  <td className={`w-9 pr-3 text-right select-none ${isDarkMode ? "bg-[#161718] border-[#2d2e30]/30 text-neutral-600" : "bg-neutral-100 border-neutral-200 text-neutral-500"} border-r text-[9px] font-mono text-center`}>
                                    {index + 1}
                                  </td>
                                  <td className={`pl-4 ${isDarkMode ? "text-neutral-200" : "text-neutral-800"} select-all whitespace-pre`}>
                                    {line || " "}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>

                    {/* Assertion mapping explanations to see the mechanics */}
                    {migrations.length > 0 && (
                      <div className={`p-4 border ${borderCol} rounded-xl ${bgCard} flex flex-col gap-4 mt-2`}>
                        <h3 className="text-xs font-mono uppercase tracking-widest text-[#ef5b25] font-bold flex items-center gap-2">
                          <ShieldCheck className="h-4.5 w-4.5" />
                          Assertion Traceability Map
                        </h3>
                        <div className="grid grid-cols-1 gap-3.5 max-h-[300px] overflow-y-auto">
                          {migrations.map((mig, key) => (
                            <div key={key} className={`border ${borderCol} rounded-lg p-3 ${bgAccent} flex flex-col gap-2.5 text-xs`}>
                              <div className="flex justify-between items-center px-2 py-1 rounded bg-[#ef5b25]/5 border border-[#ef5b25]/10">
                                <div className="flex items-center gap-2 font-mono">
                                  <span className="font-bold text-[11px]">{mig.requestName}</span>
                                  <span className="px-1 py-0.5 rounded text-[8px] text-white uppercase bg-[#ef5b25]">
                                    {mig.method}
                                  </span>
                                </div>
                                <span className="text-[10px] font-mono text-neutral-400 truncate max-w-[200px]">{mig.url}</span>
                              </div>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                <div className="flex flex-col gap-1">
                                  <span className={`text-[9px] font-mono ${isDarkMode ? "text-neutral-400" : "text-neutral-550"} uppercase`}>JavaScript Source Assert</span>
                                  <div className={`p-2 rounded font-mono text-[10px] border ${
                                    isDarkMode 
                                      ? "bg-neutral-900 text-neutral-400 border-neutral-800" 
                                      : "bg-neutral-50 text-neutral-700 border-neutral-200"
                                  }`}>
                                    {mig.originalAssertions.map((as, i) => (
                                      <div key={i} className="truncate select-all">{as}</div>
                                    ))}
                                  </div>
                                </div>
                                <div className="flex flex-col gap-1">
                                  <span className="text-[9px] font-mono text-[#ef5b25] uppercase font-bold">Generated Pytest Assert</span>
                                  <div className={`p-2 rounded font-mono text-[10px] border ${
                                    isDarkMode 
                                      ? "bg-neutral-900 border-neutral-800" 
                                      : "bg-emerald-50/50 border-emerald-100"
                                  }`}>
                                    {mig.migratedAssertions.map((as, i) => (
                                      <div key={i} className={`truncate select-all font-semibold font-mono text-[10px] ${isDarkMode ? "text-emerald-400" : "text-emerald-700"}`}>{as}</div>
                                    ))}
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* TAB AREA 2: MODULAR FILES GRID LAYOUT */}
            {activeTab === "modular" && (
              <div className="flex flex-col gap-5">
                {!pytestCode || modularFiles.length === 0 ? (
                  <div className={`rounded-xl border ${borderCol} ${bgAccent} p-12 text-center flex flex-col items-center justify-center gap-4`}>
                    <div className="p-3 bg-[#ef5b25]/10 rounded-full text-[#ef5b25] border border-[#ef5b25]/20">
                      <Layers className="h-6 w-6" />
                    </div>
                    <div>
                      <h3 className="text-xs font-semibold">No Modular Distribution Configured</h3>
                      <p className="text-[11px] text-neutral-400 max-w-xs mx-auto mt-1 leading-normal">
                        Generate compile sequences first using the sidebar action triggers.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col gap-4">
                    <div className={`flex flex-col sm:flex-row justify-between sm:items-center gap-3 bg-[#1d1f23] p-4 rounded-xl border ${borderCol}`}>
                      <div>
                        <h3 className="text-xs font-bold font-mono uppercase tracking-wide text-[#ef5b25]">
                          PRO DISTRIBUTION FILE LIST
                        </h3>
                        <p className="text-[11px] text-neutral-400 mt-0.5 leading-tight">
                          Modular layout including custom conftest environments and categorized request suites.
                        </p>
                      </div>
                      <button
                        onClick={handleDownloadZip}
                        className="px-3.5 py-1.5 bg-[#ef5b25] hover:bg-[#d84e1b] text-white font-mono rounded-lg text-xs font-bold flex items-center gap-1.5 transition shadow"
                      >
                        <Download className="h-3.5 w-3.5" />
                        Download ZIP
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-start">
                      
                      {/* directory sidebar */}
                      <div className={`md:col-span-4 ${isDarkMode ? "bg-neutral-900/40 border-neutral-800" : "bg-neutral-100 border-neutral-200"} rounded-xl border p-2.5 flex flex-col gap-1`}>
                        <span className={`text-[9px] font-mono uppercase tracking-widest ${isDarkMode ? "text-neutral-500" : "text-neutral-400"} px-2 py-1`}>SUITE SEGMENTS</span>
                        {modularFiles.map((file, idx) => (
                          <button
                            key={idx}
                            onClick={() => setSelectedFileIndex(idx)}
                            className={`w-full text-left p-2 rounded font-mono text-[10.5px] transition flex justify-between items-center ${
                              selectedFileIndex === idx
                                ? "bg-[#ef5b25]/10 text-orange-600 font-bold border-l-2 border-[#ef5b25] pl-1.5"
                                : `${isDarkMode ? "hover:bg-neutral-800/55 text-neutral-400" : "hover:bg-neutral-200 text-neutral-600"}`
                            }`}
                          >
                            <span className="truncate">{file.filename}</span>
                          </button>
                        ))}
                      </div>

                      {/* Integrated file content panel */}
                      <div className={`md:col-span-8 flex flex-col ${isDarkMode ? "bg-[#121314] border-neutral-800" : "bg-neutral-50 border-neutral-200"} rounded-xl border shadow-sm overflow-hidden text-xs`}>
                        <div className={`border-b ${isDarkMode ? "bg-neutral-900/60 border-neutral-800 text-neutral-300" : "bg-neutral-100 border-neutral-200 text-neutral-700"} px-4 py-2.5 flex justify-between items-center font-mono`}>
                          <span className="font-semibold flex items-center gap-2">
                            <FileCode className="h-3.5 w-3.5 text-[#ef5b25]" />
                            {modularFiles[selectedFileIndex]?.filename || "conftest.py"}
                          </span>
                          <button
                            onClick={() => copyToClipboard(modularFiles[selectedFileIndex]?.content, `mod_${selectedFileIndex}`)}
                            className={`px-2 py-0.5 border rounded text-[9px] font-mono font-bold ${
                              isDarkMode 
                                ? "border-neutral-800 bg-neutral-950 text-neutral-400 hover:text-white" 
                                : "border-neutral-300 bg-white text-neutral-600 hover:text-neutral-950"
                            }`}
                          >
                            {copiedStates[`mod_${selectedFileIndex}`] ? "Copied" : "Copy Source"}
                          </button>
                        </div>
                        <pre className={`p-4 text-[11px] leading-relaxed font-mono ${isDarkMode ? "text-neutral-300 bg-neutral-950" : "text-neutral-800 bg-white"} max-h-80 overflow-y-auto overflow-x-auto select-all`}>
                          <code>{modularFiles[selectedFileIndex]?.content || ""}</code>
                        </pre>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* TAB AREA 3: LIVE RE-EXECUTION CONSOLE */}
            {activeTab === "run" && (
              <div className="flex flex-col gap-5">
                {!pytestCode ? (
                  <div className={`rounded-2xl border ${borderCol} ${bgAccent} p-12 text-center flex flex-col items-center justify-center gap-4`}>
                    <div className="p-3 bg-[#ef5b25]/10 rounded-full text-[#ef5b25] border border-[#ef5b25]/20">
                      <Terminal className="h-6 w-6" />
                    </div>
                    <div>
                      <h3 className="text-xs font-semibold">Test Runner Unconfigured</h3>
                      <p className="text-[11px] text-neutral-500 max-w-xs mx-auto mt-1 leading-normal">
                        Please compile the Postman specifications to Pytest first to unleash live re-run mock evaluations.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col gap-4">
                    
                    {/* Select Execution health profile */}
                    <div className={`p-4 border ${borderCol} rounded-xl ${bgAccent} flex flex-col gap-4`}>
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] font-mono text-orange-500 uppercase font-bold">PANE 3 • TARGET VM SIMULATOR</span>
                        <div className="flex items-center gap-1.5 text-[10px] font-mono text-neutral-400">
                          <Server className="h-3.5 w-3.5" />
                          Status: Active Sandbox
                        </div>
                      </div>

                      <div className={`flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 ${isDarkMode ? "bg-[#0d0d10] border-neutral-800" : "bg-neutral-50 border-neutral-200"} p-3 rounded-lg border`}>
                        <div className="max-w-md text-xs leading-normal">
                          <span className="text-[10px] font-mono font-bold text-[#ef5b25] block uppercase">Network drift simulator settings</span>
                          <p className={`${isDarkMode ? "text-neutral-400" : "text-neutral-600"} text-[11px] shrink font-light mt-0.5`}>
                            Synthesize simulated response values payload mismatches, expired tokens 401 drift, and bad socket 503 errors to see how failures report.
                          </p>
                        </div>
                        
                        <select
                          value={simulationMode}
                          onChange={(e) => setSimulationMode(e.target.value as any)}
                          className={`py-1.5 px-3 border rounded-md text-xs focus:ring-1 focus:ring-orange-500 font-mono ${selectStyle}`}
                        >
                          <option value="success">Normal Run (100% Passed)</option>
                          <option value="offline">Server Offline (503 Service Temp Error)</option>
                          <option value="drift_auth">Token Expired (401 Bad Credentials)</option>
                          <option value="drift_schema">Contract Mismatch (Chai Fail Assert)</option>
                        </select>
                      </div>

                      <button
                        onClick={handleExecuteTests}
                        disabled={isExecuting}
                        className={`w-full py-2.5 ${isDarkMode ? "bg-neutral-900 border-neutral-800 text-white" : "bg-neutral-100 border-neutral-300 text-neutral-800"} hover:bg-[#ef5b25] hover:text-white hover:border-[#ef5b25] rounded-xl font-mono font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition`}
                      >
                        {isExecuting ? (
                          <>
                            <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                            Executing virtual testing suite on backend pipeline...
                          </>
                        ) : (
                          <>
                            <Play className="h-3.5 w-3.5 text-emerald-400 fill-emerald-400/20" />
                            Run pytest automated suite
                          </>
                        )}
                      </button>
                    </div>

                    {/* EXECUTION RESULTS COMPONENT */}
                    {execResult && (
                      <div className="flex flex-col gap-4">
                        
                        {/* Metric Dashboard */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                          <div className={`p-3 text-center border ${borderCol} rounded-lg ${bgCard}`}>
                            <span className="text-[9px] font-mono text-neutral-400 uppercase tracking-widest block">Core target tests</span>
                            <p className={`text-xl font-display font-semibold ${textTitle} mt-0.5`}>{execResult.total}</p>
                          </div>
                          <div className={`p-3 text-center border ${borderCol} rounded-lg ${bgCard}`}>
                            <span className="text-[9px] font-mono text-emerald-500 uppercase tracking-widest font-bold block">checks passed</span>
                            <p className="text-xl font-display font-semibold text-emerald-500 mt-0.5">{execResult.passed}</p>
                          </div>
                          <div className={`p-3 text-center border ${borderCol} rounded-lg ${bgCard}`}>
                            <span className="text-[9px] font-mono text-rose-500 uppercase tracking-widest font-bold block">failed metrics</span>
                            <p className={`text-xl font-display font-semibold mt-0.5 ${execResult.failed > 0 ? "text-rose-500 animate-pulse" : textTitle}`}>{execResult.failed}</p>
                          </div>
                          <div className={`p-3 text-center border ${borderCol} rounded-lg ${bgCard}`}>
                            <span className="text-[9px] font-mono text-neutral-400 uppercase tracking-widest block">execution duration</span>
                            <p className={`text-xl font-display font-semibold ${textTitle} mt-0.5`}>{execResult.execution_time.toFixed(2)}s</p>
                          </div>
                        </div>

                        {/* Black Terminal Output Logs */}
                        <div className={`${isDarkMode ? "bg-[#121314] border-neutral-800" : "bg-neutral-100 border-neutral-200"} rounded-xl border p-4 flex flex-col overflow-hidden shadow`}>
                          <div className={`flex justify-between items-center text-[10px] ${isDarkMode ? "text-neutral-500 border-neutral-800/80" : "text-neutral-600 border-neutral-250"} pb-2 mt-0.5 border-b mb-3`}>
                            <span className={`flex items-center gap-1.5 uppercase font-bold tracking-wider ${isDarkMode ? "text-neutral-300" : "text-neutral-800"}`}>
                              <Terminal className="h-4 w-4 text-emerald-500" />
                              Pytest terminal trace logs
                            </span>
                            <button
                              onClick={() => copyToClipboard(execResult.output_log, "pytestTerminal")}
                              className={`text-[9px] px-2 py-0.5 rounded font-mono font-bold ${
                                isDarkMode 
                                  ? "text-[#ef5b25] bg-[#1a1b1d] border-neutral-700/60 hover:text-white" 
                                  : "text-white bg-[#ef5b25] hover:bg-[#d84e1b]"
                              }`}
                            >
                              {copiedStates["pytestTerminal"] ? "Copied" : "Copy terminal logs"}
                            </button>
                          </div>
                          <pre className={`font-mono text-[10px] leading-relaxed overflow-x-auto max-h-48 whitespace-pre select-all p-3.5 rounded-lg border ${
                            isDarkMode 
                              ? "text-[#c9d1d9] bg-neutral-950 border-neutral-800" 
                              : "text-neutral-800 bg-white border-neutral-200"
                          }`}>
                            <code>{execResult.output_log}</code>
                          </pre>
                        </div>

                        {/* AUTOMATED DIAGNOSTIC LOGS REPORT SECTION */}
                        {execResult.failures.length > 0 && (
                          <div className={`p-4 border ${borderCol} rounded-xl ${bgCard} flex flex-col gap-4`}>
                            <div className="flex items-start gap-2.5">
                              <div className="p-1.5 bg-rose-500/10 rounded-lg text-rose-500 border border-rose-500/25 shrink-0">
                                <AlertTriangle className="h-4 w-4" />
                              </div>
                              <div>
                                <span className="text-[9px] font-mono uppercase font-bold text-neutral-400 tracking-wider">MIGRATOR AGENT BOT</span>
                                <h3 className="text-xs font-bold font-display text-rose-500 uppercase tracking-tight">Isolated anomalous diagnostic fault report</h3>
                              </div>
                            </div>

                            <div className="flex flex-col gap-4 divide-y divide-neutral-800/20 max-h-[300px] overflow-y-auto pr-1">
                              {execResult.failures.map((fail, index) => (
                                <div key={index} className="pt-3.5 first:pt-0 flex flex-col gap-2.5 text-xs">
                                  <div className="font-mono font-bold flex items-center gap-1 text-xs">
                                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0"></span>
                                    <span>Failed step:</span>
                                    <span className={`${isDarkMode ? "bg-neutral-800 border-neutral-700 text-neutral-300" : "bg-neutral-100 border-neutral-200 text-neutral-750"} px-1.5 py-0.5 rounded text-[10px] font-mono font-normal`}>{fail.test_name}</span>
                                  </div>

                                  <div className="p-2.5 bg-rose-950/20 rounded-md font-mono text-[9px] leading-relaxed border border-rose-900/40 text-rose-400">
                                    {fail.error_message}
                                  </div>

                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 leading-relaxed text-[11px] font-light">
                                    <div className={`${isDarkMode ? "bg-neutral-900/35 border-neutral-800" : "bg-neutral-100/50 border-neutral-200"} p-2 rounded-lg border flex flex-col`}>
                                      <span className="font-mono font-semibold text-[9px] text-[#ef5b25] uppercase tracking-wider">PROBABLE ROOT CAUSE</span>
                                      <p className={`mt-1 font-light leading-relaxed ${isDarkMode ? "text-neutral-300" : "text-neutral-700"}`}>{fail.probable_cause}</p>
                                    </div>
                                    <div className="bg-[#ef5b25]/5 p-2 rounded-lg border border-[#ef5b25]/15 flex flex-col">
                                      <span className="font-mono font-bold text-[9px] text-[#ef5b25] uppercase tracking-wider">SUGGESTED CORRECTION ACTION</span>
                                      <p className="mt-1 font-medium leading-relaxed">{fail.recommendations}</p>
                                    </div>
                                  </div>

                                  {fail.code_patch && (
                                    <div className={`${isDarkMode ? "bg-neutral-950 border-neutral-800" : "bg-white border-neutral-200"} rounded-lg p-3 border text-[10px] font-mono flex flex-col`}>
                                      <div className={`flex justify-between items-center text-[8px] ${isDarkMode ? "text-neutral-500 border-neutral-900" : "text-neutral-400 border-neutral-200"} uppercase tracking-widest pb-1.5 mb-2 border-b`}>
                                        <span>Correction mapping snippet</span>
                                        <button
                                          onClick={() => copyToClipboard(fail.code_patch, `patch_${index}`)}
                                          className={`font-semibold ${isDarkMode ? "text-neutral-400 hover:text-white" : "text-neutral-600 hover:text-neutral-950"}`}
                                        >
                                          {copiedStates[`patch_${index}`] ? "Copied" : "Copy replacement"}
                                        </button>
                                      </div>
                                      <pre className={`leading-normal max-h-24 overflow-y-auto whitespace-pre ${isDarkMode ? "text-neutral-300" : "text-neutral-800"}`}>
                                        <code>{fail.code_patch}</code>
                                      </pre>
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* TAB AREA 4: MODEL CONTEXT PROTOCOL (MCP) INTERACTIVE SANDBOX HUB */}
            {activeTab === "mcp" && (
              <div className="flex flex-col gap-6 animate-fadeIn pb-6">
                
                {/* Protocol Health Card */}
                <div className={`p-4 md:p-5 border ${borderCol} rounded-2xl ${bgAccent} flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shadow-sm pb-5`}>
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-emerald-500/10 rounded-xl border border-emerald-500/20 text-emerald-500 animate-pulse">
                      <Server className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className={`text-xs font-bold font-mono uppercase tracking-wider ${isDarkMode ? "text-neutral-100" : "text-neutral-900"}`}>
                          Model Context Protocol Server
                        </h3>
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 tracking-wider font-mono">
                          ● LIVE
                        </span>
                      </div>
                      <p className="text-[10px] text-neutral-500 font-mono mt-0.5 select-all">
                        Active Ingress: http://localhost:3000/api/mcp (JSON-RPC 2.0 Web Protocol)
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-3">
                    <button
                      onClick={() => { fetchMcpTools(); fetchMcpLogs(); }}
                      className={`py-1.5 px-3 rounded-lg border ${borderCol} text-[10px] font-mono hover:bg-neutral-500/5 transition flex items-center gap-1.5 font-bold uppercase cursor-pointer`}
                    >
                      <RefreshCw className="h-3.5 w-3.5 text-[#ef5b25]" />
                      Sync Registry
                    </button>
                    <a
                      href="/api/mcp/tools"
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`py-1.5 px-3 rounded-lg border ${borderCol} text-[10px] font-mono hover:bg-neutral-500/5 transition flex items-center gap-1.5 font-bold uppercase`}
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                      View JSON Schema
                    </a>
                  </div>
                </div>

                {/* Main Two-Column Panel Splitter */}
                <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
                  
                  {/* Left Column: Registered Tools & Raw Sandbox (xl:col-span-7) */}
                  <div className="xl:col-span-7 flex flex-col gap-6">
                    
                    <div className={`p-5 md:p-6 border ${borderCol} rounded-2xl ${bgAccent} flex flex-col gap-4 shadow-sm`}>
                      <div>
                        <h4 className="text-xs font-bold font-mono tracking-wider uppercase text-orange-500 flex items-center gap-2">
                          <Cpu className="h-4.5 w-4.5" />
                          MCP Server Tools Dashboard
                        </h4>
                        <p className="text-[11px] text-neutral-400 mt-1 leading-normal font-light">
                          These tools are automatically registered with the protocol server and are fully discoverable by domestic and external model context protocols.
                        </p>
                      </div>

                      {/* Tool Deck Cards */}
                      <div className="flex flex-col gap-3">
                        {mcpTools.length === 0 ? (
                          <div className="text-center py-6 text-xs text-neutral-500 font-mono">No tools registered in schema. Reloading server...</div>
                        ) : (
                          mcpTools.map((tool) => (
                            <div
                              key={tool.name}
                              className={`p-3.5 rounded-xl border ${mcpSelectedTool === tool.name ? "border-[#ef5b25]/50 bg-[#ef5b25]/5" : isDarkMode ? "border-neutral-800 bg-neutral-900/10 hover:bg-neutral-900/30" : "border-neutral-200 bg-neutral-50 hover:bg-neutral-100/50"} transition flex flex-col md:flex-row md:items-center justify-between gap-3 cursor-pointer`}
                              onClick={() => setMcpSelectedTool(tool.name)}
                            >
                              <div className="flex-1 min-w-0 font-sans">
                                <div className="flex items-center gap-2 font-mono">
                                  <span className={`text-[12px] font-bold ${mcpSelectedTool === tool.name ? "text-[#ef5b25]" : isDarkMode ? "text-white" : "text-neutral-900"}`}>
                                    {tool.name}
                                  </span>
                                  <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded uppercase tracking-widest ${tool.status === "active" ? "text-emerald-500 bg-emerald-500/10 border border-emerald-500/20" : "text-amber-500 bg-amber-500/10"}`}>
                                    {tool.status}
                                  </span>
                                </div>
                                <p className={`text-[10px]/relaxed ${isDarkMode ? "text-neutral-400" : "text-neutral-600"} font-light mt-1`}>
                                  {tool.description}
                                </p>
                                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2 text-[9px] font-mono text-neutral-500">
                                  <span>Required Keys: <strong className="font-bold">{tool.inputSchema?.required?.join(", ") || "None"}</strong></span>
                                  <span>•</span>
                                  <span>Last Run: <strong className="font-bold text-neutral-500">{tool.lastInvocationTime ? new Date(tool.lastInvocationTime).toLocaleTimeString() : "Never"}</strong></span>
                                </div>
                              </div>
                              <div className="shrink-0 flex items-center justify-end">
                                <ChevronRight className={`h-4.5 w-4.5 transition ${mcpSelectedTool === tool.name ? "text-[#ef5b25] translate-x-1" : "text-neutral-600"}`} />
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>

                    {/* Collapsible API Tester Workbench */}
                    {mcpSelectedTool && (
                      <div className={`p-5 md:p-6 border ${borderCol} rounded-2xl ${bgAccent} flex flex-col gap-4 shadow-sm animate-fadeIn`}>
                        <div className="flex justify-between items-center border-b border-neutral-800/20 pb-2.5">
                          <div>
                            <span className="text-[10px] font-mono text-[#ef5b25] uppercase font-bold tracking-wider">RAW TOOL WORKBENCH</span>
                            <h4 className={`text-xs font-bold font-mono text-neutral-300 mt-0.5`}>
                              RPC Method Call: <span className="text-[#ef5b25] select-all">{mcpSelectedTool}</span>
                            </h4>
                          </div>
                          <span className="text-[9px] font-mono text-neutral-500 uppercase tracking-widest">JSON-RPC 2.0</span>
                        </div>

                        {/* Split pane for Raw tool input/output */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          
                          {/* Input argument editor */}
                          <div className="flex flex-col gap-1.5 text-xs">
                            <span className="text-[10px] font-mono text-neutral-400 flex items-center gap-1.5 font-bold uppercase">
                              <Settings className="h-3.5 w-3.5" />
                              Call Arguments (JSON)
                            </span>
                            <textarea
                              value={mcpToolArgs}
                              onChange={(e) => setMcpToolArgs(e.target.value)}
                              rows={10}
                              className={`w-full py-2 px-3 border rounded-xl text-xs font-mono placeholder:text-neutral-700 bg-black/40 ${isDarkMode ? "bg-[#0d0d10] border-neutral-800 text-neutral-200 focus:border-orange-500" : "bg-neutral-50 border-neutral-200 text-neutral-900 focus:border-orange-500"}`}
                              placeholder="{}"
                            />
                            <button
                              onClick={handleInvokeMcpToolRaw}
                              disabled={mcpIsCallingTool}
                              className="mt-1 bg-orange-600/10 hover:bg-orange-600/25 text-[#ef5b25] border border-orange-500/20 hover:border-orange-500/50 transition font-mono font-bold py-2 rounded-xl flex items-center justify-center gap-2 text-xs cursor-pointer"
                            >
                              {mcpIsCallingTool ? (
                                <>
                                  <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                                  Triggering internal pipeline...
                                </>
                              ) : (
                                <>
                                  <Send className="h-3.5 w-3.5" />
                                  Call 'tools/call' RPC
                                </>
                              )}
                            </button>
                          </div>

                          {/* Raw RPC Console Output */}
                          <div className="flex flex-col gap-1.5 text-xs">
                            <span className="text-[10px] font-mono text-neutral-400 flex items-center gap-1.5 font-bold uppercase">
                              <Terminal className="h-3.5 w-3.5" />
                              Server JSON-RPC Response JSON
                            </span>
                            <div className={`w-full h-[264px] border rounded-xl p-3 font-mono text-[10.5px]/relaxed overflow-auto select-all max-h-72 align-top ${isDarkMode ? "bg-[#09090b] text-[#55ea46] border-neutral-800" : "bg-neutral-50 border-neutral-200 text-[#ef5b25]"}`}>
                              {mcpRawResponse ? (
                                <pre className="whitespace-pre">{mcpRawResponse}</pre>
                              ) : (
                                <span className="text-neutral-500 text-[10px] italic font-light">// Invoke the RPC method call above to trace structured JSON records here...</span>
                              )}
                            </div>
                          </div>

                        </div>
                      </div>
                    )}

                  </div>

                  {/* Right Column: AI Agent Sandbox & Protocol Logs (xl:col-span-5) */}
                  <div className="xl:col-span-5 flex flex-col gap-6">
                    
                    {/* conversational agent client */}
                    <div className={`p-5 md:p-6 border ${borderCol} rounded-2xl ${bgAccent} flex flex-col gap-4 shadow-sm`}>
                      <div>
                        <h4 className="text-xs font-bold font-mono tracking-wider uppercase text-emerald-500 flex items-center gap-2">
                          <Sparkles className="h-4.5 w-4.5 animate-pulse text-emerald-500" />
                          MCP AI Agent Sandbox
                        </h4>
                        <p className="text-[11px] text-neutral-400 mt-1 leading-normal font-light font-sans">
                          Our AI Agent operates autonomously on top of our live environment. Describe what you want, and the agent will dynamically select and invoke the best tool.
                        </p>
                      </div>

                      {/* Suggestions list */}
                      <div className="flex flex-col gap-1.5 border-b border-neutral-800/10 pb-3">
                        <span className="text-[9px] font-mono text-neutral-500 uppercase font-bold">Suggested Agentic Prompts:</span>
                        <div className="flex flex-wrap gap-1.5">
                          <button
                            onClick={() => handleAgentChatSubmit("Fetch user-api from postman store")}
                            className={`py-1.5 px-2 rounded-lg border text-[9.5px] font-mono font-medium transition cursor-pointer ${isDarkMode ? "bg-neutral-900/50 border-neutral-800 text-neutral-300 hover:bg-neutral-800" : "bg-white border-neutral-200 text-neutral-700 hover:bg-neutral-100"}`}
                          >
                            "Fetch collection user-api"
                          </button>
                          <button
                            onClick={() => handleAgentChatSubmit("Generate the Python pytest script for me please")}
                            className={`py-1.5 px-2 rounded-lg border text-[9.5px] font-mono font-medium transition cursor-pointer ${isDarkMode ? "bg-neutral-900/50 border-neutral-800 text-neutral-300 hover:bg-neutral-800" : "bg-white border-neutral-200 text-neutral-700 hover:bg-neutral-100"}`}
                          >
                            "Translate user-api to pytest"
                          </button>
                          <button
                            onClick={() => handleAgentChatSubmit("Explain why my tests failed and recommend fixes")}
                            className={`py-1.5 px-2 rounded-lg border text-[9.5px] font-mono font-medium transition cursor-pointer ${isDarkMode ? "bg-neutral-900/50 border-neutral-800 text-neutral-300 hover:bg-neutral-800" : "bg-white border-neutral-200 text-neutral-700 hover:bg-neutral-100"}`}
                          >
                            "Analyze run failure log"
                          </button>
                        </div>
                      </div>

                      {/* Conversation log stream */}
                      <div className={`h-80 border ${borderCol} rounded-xl p-3 overflow-y-auto flex flex-col gap-3 max-h-[380px] bg-black/10`}>
                        {agentChats.map((chat, idx) => (
                          <div
                            key={idx}
                            className={`flex flex-col gap-1 max-w-[90%] ${chat.sender === "user" ? "self-end items-end" : "self-start items-start"}`}
                          >
                            <span className="text-[9px] font-mono text-neutral-500">
                              {chat.sender === "user" ? "User" : "MCP AI QA Agent"} • {new Date(chat.timestamp || Date.now()).toLocaleTimeString()}
                            </span>
                            <div className={`px-3 py-2 rounded-xl text-[11px] leading-relaxed ${chat.sender === "user" ? "bg-[#ef5b25]/15 text-[#ef5b25] border border-orange-500/20 font-medium font-mono" : isDarkMode ? "bg-neutral-900/60 text-neutral-100 border border-neutral-800" : "bg-white text-neutral-800 border border-neutral-200"}`}>
                              
                              {/* Direct user text or response */}
                              {chat.text && <p className="whitespace-pre-wrap">{chat.text}</p>}
                              {chat.finalResponse && <p className="whitespace-pre-wrap font-sans">{chat.finalResponse}</p>}

                              {/* Telemetry traces nested inside Agent Responses to expose exact tool-calling choices */}
                              {chat.toolCalled && (
                                <div className="mt-2.5 p-2 bg-neutral-950/80 rounded-lg border border-neutral-800/80 text-[10px] font-mono text-neutral-300 flex flex-col gap-1.5 leading-normal">
                                  <div className="flex items-center gap-1.5 text-orange-500 font-bold text-[9px] uppercase tracking-wider">
                                    <Cpu className="h-3 w-3 text-orange-500 animate-pulse" />
                                    Agent Tool Execution Log
                                  </div>
                                  <div>
                                    <span className="text-neutral-500 text-[9px]">Decision Thought:</span>
                                    <p className="text-neutral-300 text-[10px] italic font-light mt-0.5">"{chat.thought}"</p>
                                  </div>
                                  <div>
                                    <span className="text-neutral-500 text-[9px]">Tool Selected:</span> <strong className="text-orange-500">{chat.toolCalled}</strong>
                                  </div>
                                  <div>
                                    <span className="text-neutral-500 text-[9px]">Resolved Args:</span>
                                    <pre className="text-[9px] text-[#55ea46] mt-0.5 bg-black/40 p-1 rounded overflow-x-auto">{JSON.stringify(chat.toolArguments, null, 2)}</pre>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}

                        {mcpIsAgentThinking && (
                          <div className="self-start flex flex-col gap-1.5">
                            <span className="text-[9px] font-mono text-neutral-500 flex items-center gap-1">
                              <RefreshCw className="h-2.5 w-2.5 animate-spin text-emerald-500" />
                              Agent thinking and selecting tools...
                            </span>
                            <div className={`px-4 py-2 bg-neutral-900/30 border border-neutral-800 rounded-xl max-w-[80%] flex items-center gap-2`}>
                              <div className="flex gap-1">
                                <span className="h-1.5 w-1.5 bg-emerald-500 rounded-full animate-bounce"></span>
                                <span className="h-1.5 w-1.5 bg-emerald-500 rounded-full animate-bounce delay-150"></span>
                                <span className="h-1.5 w-1.5 bg-emerald-500 rounded-full animate-bounce delay-300"></span>
                              </div>
                              <span className="text-[10px] font-mono text-neutral-400">Consulting local MCP schema registry...</span>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Chat chat bar */}
                      <form
                        onSubmit={(e) => { e.preventDefault(); handleAgentChatSubmit(); }}
                        className="flex gap-2"
                      >
                        <input
                          type="text"
                          value={mcpAgentInput}
                          onChange={(e) => setMcpAgentInput(e.target.value)}
                          placeholder="Ask Agent to call 'analyze_failure'..."
                          className={`flex-grow py-2 px-3 border rounded-xl text-xs font-mono placeholder:text-neutral-600 focus:outline-none focus:ring-1 focus:ring-[#ef5b25] ${selectStyle}`}
                        />
                        <button
                          type="submit"
                          disabled={mcpIsAgentThinking || !mcpAgentInput.trim()}
                          className="bg-[#ef5b25] hover:bg-orange-600 font-bold font-mono px-4 py-2 text-white rounded-xl text-xs flex items-center gap-1.5 transition uppercase cursor-pointer"
                        >
                          <Send className="h-3 w-3" />
                          Send
                        </button>
                      </form>

                    </div>

                    {/* Protocol Server Log Stream */}
                    <div className={`p-5 md:p-6 border ${borderCol} rounded-2xl ${bgAccent} flex flex-col gap-4 shadow-sm`}>
                      <div className="flex justify-between items-center border-b border-neutral-800/20 pb-2.5">
                        <div>
                          <h4 className="text-xs font-bold font-mono tracking-wider uppercase text-[#ef5b25] flex items-center gap-1.5">
                            <Activity className="h-4 w-4" />
                            Live Invocations logs
                          </h4>
                          <p className="text-[10px] text-neutral-500 font-light mt-0.5 leading-normal font-sans">
                            Chronological history of JSON-RPC schema calls intercepted by the server.
                          </p>
                        </div>
                        <span className="text-[9px] text-[#ef5b25] bg-[#ef5b25]/10 px-2 py-0.5 rounded font-mono font-black uppercase">Intercepting</span>
                      </div>

                      <div className="flex flex-col gap-2 max-h-56 overflow-y-auto">
                        {mcpLogs.length === 0 ? (
                          <div className="text-center py-6 text-neutral-500 font-mono text-[9px] italic">No active server invocations logged yet. Execute a sandbox tool to monitor live triggers!</div>
                        ) : (
                          mcpLogs.map((log) => (
                            <div
                              key={log.id}
                              className={`p-2.5 rounded-lg border font-mono text-[9.5px]/relaxed leading-normal ${log.status === "error" ? "bg-rose-500/5 border-rose-500/10 text-rose-400" : isDarkMode ? "bg-neutral-900/40 border-neutral-800 text-neutral-300" : "bg-white border-neutral-200 text-neutral-700"}`}
                            >
                              <div className="flex justify-between items-center border-b border-neutral-800/10 pb-1 mb-1.5 text-[8.5px]">
                                <span className={`font-bold uppercase ${log.status === "error" ? "text-rose-500" : "text-emerald-500"}`}>
                                  {log.status === "error" ? "✗ RPC Error" : "✓ RPC Success"}
                                </span>
                                <span className="text-neutral-500">
                                  {new Date(log.timestamp).toLocaleTimeString()}
                                </span>
                              </div>
                              <div>
                                <span className="text-neutral-500">Method called:</span> <strong className={isDarkMode ? "text-neutral-100" : "text-neutral-900"}>{log.toolName}</strong>
                              </div>
                              <details className="mt-1">
                                <summary className="cursor-pointer text-[8.5px] text-[#ef5b25] font-semibold hover:underline">Show log transaction envelope</summary>
                                <pre className="text-[8.5px] text-neutral-400 mt-1.5 bg-black/35 p-1 rounded max-h-16 overflow-y-auto select-all whitespace-pre-wrap">{JSON.stringify({ arguments: log.arguments, response: log.response }, null, 2)}</pre>
                              </details>
                            </div>
                          ))
                        )}
                      </div>
                    </div>

                  </div>

                </div>
              </div>
            )}


            {/* AI Prompts and Pipeline Logs Metadata (Trace logs at bottom) */}
            {aiPromptMeta && activeTab === "consolidated" && (
              <div className={`${isDarkMode ? "bg-[#121314] text-[#a9b2c3] border-neutral-800/80" : "bg-neutral-100 text-neutral-600 border-neutral-200"} rounded-xl p-4.5 text-[10px] leading-relaxed font-mono border mt-1`}>
                <div className={`font-bold uppercase ${isDarkMode ? "text-neutral-100" : "text-neutral-800"} tracking-wider mb-2 flex items-center gap-2`}>
                  <Activity className="h-4 w-4 text-emerald-500" />
                  AST Conversion Telemetry logs
                </div>
                <div className={`grid grid-cols-1 md:grid-cols-2 gap-2 border-b ${isDarkMode ? "border-neutral-800 pb-2.5 mb-2.5 text-neutral-500" : "border-neutral-200 pb-2.5 mb-2.5 text-neutral-500"}`}>
                  <div>LLM Engine: <span className={isDarkMode ? "text-neutral-300" : "text-neutral-700"}>gemini-3.5-flash-pro</span></div>
                  <div>Timestamp: <span className={isDarkMode ? "text-neutral-300" : "text-neutral-700"}>{aiPromptMeta.timestamp}</span></div>
                </div>
                <details className="cursor-pointer">
                  <summary className="text-[#ef5b25] font-semibold hover:underline">View Mapping System Directives</summary>
                  <pre className={`mt-2 text-[9px] p-2 rounded max-h-24 overflow-y-auto border whitespace-pre-wrap ${
                    isDarkMode 
                      ? "bg-neutral-950 text-neutral-500 border-neutral-900" 
                      : "bg-white text-neutral-600 border-neutral-200"
                  }`}>
                    {aiPromptMeta.systemInstruction}
                  </pre>
                </details>
              </div>
            )}

          </div>
        </main>
      </div>

      {/* Modern Compact Fine-Type Footer */}
      <footer className={`border-t ${borderCol} ${isDarkMode ? "bg-[#111215]" : "bg-[#fbfbfa]"} py-4 px-6 text-center text-xs text-neutral-500 font-light mt-auto transition-colors`}>
        <div className="max-w-8xl mx-auto flex flex-col md:flex-row justify-between items-center gap-3.5">
          <p>© 2026 Pytestify Studio Inc. Designed in alignment with premium API product specifications.</p>
          <div className="flex items-center gap-4 font-mono text-[10px] text-neutral-600">
            <span>PLATFORM: PORT 3000 DEV_INGRESS</span>
            <span className="hidden md:inline">|</span>
            <span>PRO_MIGRATOR STATUS: ONLINE</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
