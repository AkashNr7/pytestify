import React, { useState, useEffect, useRef } from "react";
import AuthModal from "./components/AuthModal";
import MyProjectsDashboard from "./components/MyProjectsDashboard";
import AdminPortal from "./components/AdminPortal";
import ChangePasswordModal from "./components/ChangePasswordModal";
import { 
  DashboardPanel, 
  CollectionsPanel, 
  PytestConsolidatedPanel, 
  PytestModularPanel, 
  VMRunnerPanel, 
  SettingsPanel 
} from "./components/WorkspaceTabPanels";
import { getSupabaseClient } from "./supabaseClient";
import { motion, AnimatePresence } from "motion/react";
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
  ChevronLeft,
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
  HelpCircle,
  LogIn,
  LogOut,
  LayoutDashboard,
  User,
  Users,
  History,
  FileSpreadsheet,
  Lock,
  Menu,
  ShieldAlert,
  HelpCircle as QuestionIcon
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

  // --- SUPABASE CLOUD STATES & ACTIONS ---
  const [session, setSession] = useState<any>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [isChangePasswordModalOpen, setIsChangePasswordModalOpen] = useState<boolean>(false);
  const [activeCloudProjectId, setActiveCloudProjectId] = useState<string | null>(null);

  // --- MULTI-PAGE NAVIGATION STATES ---
  const [currentPage, setCurrentPage] = useState<
    | "dashboard"
    | "projects"
    | "audit_center"
    | "login_history"
    | "user_management"
    | "profile"
    | "settings"
  >("dashboard");

  const [projectTab, setProjectTab] = useState<"collection" | "pytest" | "execution" | "ai" | "downloads">("collection");
  const [sidebarExpanded, setSidebarExpanded] = useState<boolean>(true);

  // --- STATE FOR STRUCTURED AI DIAGNOSTICS & EXPLANATIONS ---
  const [aiDiagnosticResult, setAiDiagnosticResult] = useState<string>("");
  const [aiDiagnosticIsLoading, setAiDiagnosticIsLoading] = useState<boolean>(false);
  const [aiExplanationResult, setAiExplanationResult] = useState<string>("");
  const [aiExplanationIsLoading, setAiExplanationIsLoading] = useState<boolean>(false);

  useEffect(() => {
    let active = true;
    const initAuth = async () => {
      const supabase = await getSupabaseClient();
      if (!supabase || !active) return;
      
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      if (active) {
        if (currentSession) {
          setSession(currentSession);
          fetch("/api/users/sync", {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${currentSession.access_token}`
            }
          })
          .then(res => res.json())
          .then(data => {
            if (active && data.user) {
              const updatedSession = {
                ...currentSession,
                user: {
                  ...currentSession.user,
                  role: data.user.role,
                  user_metadata: {
                    ...currentSession.user.user_metadata,
                    role: data.user.role
                  }
                }
              };
              setSession(updatedSession);
            }
          })
          .catch(err => console.warn("Silent profile sync err:", err));
        } else {
          setSession(null);
          setIsAuthModalOpen(true);
        }
      }

      // Keep session listener in sync
      const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, newSession) => {
        if (active) {
          if (newSession) {
            setSession(newSession);
            fetch("/api/users/sync", {
              method: "POST",
              headers: {
                "Authorization": `Bearer ${newSession.access_token}`
              }
            })
            .then(res => res.json())
            .then(data => {
              if (active && data.user) {
                const refreshedSession = {
                  ...newSession,
                  user: {
                    ...newSession.user,
                    role: data.user.role,
                    user_metadata: {
                      ...newSession.user.user_metadata,
                      role: data.user.role
                    }
                  }
                };
                setSession(refreshedSession);
              }
            })
            .catch(err => console.warn("Listener state sync err:", err));
          } else {
            setSession(null);
          }
        }
      });

      return () => {
        subscription.unsubscribe();
      };
    };
    initAuth();
    return () => {
      active = false;
    };
  }, []);

  const getOrCreateActiveProject = async (): Promise<string | null> => {
    if (!session) return null;
    if (activeCloudProjectId) return activeCloudProjectId;

    // Auto-create matching active collection name
    const projName = collectionName || "New Pytest Migration";
    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          projectName: projName,
          collectionName: collectionName || "Uploaded Collection",
          collectionItems,
          library,
          baseUrlEnv,
          injectBaseUrlFixture,
          addComments
        })
      });
      const data = await res.json();
      if (res.ok && data.project?.id) {
        setActiveCloudProjectId(data.project.id);
        return data.project.id;
      }
    } catch (e) {
      console.error("Silent creation failure:", e);
    }
    return null;
  };

  const handleSelectProject = async (projId: string) => {
    if (!session) return;
    try {
      const res = await fetch(`/api/projects/${projId}`, {
        headers: {
          "Authorization": `Bearer ${session.access_token}`
        }
      });
      const data = await res.json();
      if (res.ok && data.project) {
        setCollectionName(data.project.project_name);
        setCollectionDescription(data.project.collection_name || "");
        setCollectionItems(data.project.collection_items || []);
        setLibrary(data.project.library || "requests");
        setBaseUrlEnv(data.project.base_url || "");
        setInjectBaseUrlFixture(data.project.inject_fixture ?? true);
        setAddComments(data.project.add_comments ?? true);

        if (data.files && data.files.length > 0) {
          const mainFile = data.files.find((f: any) => f.file_name === "test_all_apis.py");
          if (mainFile) {
            setPytestCode(mainFile.file_content);
          }
          const modFiles = data.files.filter((f: any) => f.file_name !== "test_all_apis.py").map((f: any) => ({
            filename: f.file_name,
            content: f.file_content
          }));
          setModularFiles(modFiles);
        } else {
          setPytestCode("");
          setModularFiles([]);
        }

        if (data.results && data.results.length > 0) {
          const latestRes = data.results[0];
          let parsedFailures = [];
          try {
            const report = JSON.parse(latestRes.report_json);
            parsedFailures = report.failures || [];
          } catch (e) {}

          setExecResult({
            total: latestRes.passed_count + latestRes.failed_count,
            passed: latestRes.passed_count,
            failed: latestRes.failed_count,
            execution_time: Number(latestRes.execution_time),
            output_log: `Captured cloud execution results logged at: ${latestRes.executed_at}\n===================================`,
            failures: parsedFailures
          });
        } else {
          setExecResult(null);
        }

        setErrorMessage("");
        setActiveCloudProjectId(projId);
        setActiveRailTab("explorer");
      }
    } catch (err: any) {
      setErrorMessage("Failed to load project details: " + err.message);
    }
  };

  const createNewProjectWithData = async (name: string, desc: string, items: any[]) => {
    if (!session) return;
    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          projectName: name,
          collectionName: desc || "Uploaded Collection",
          collectionItems: items,
          library,
          baseUrlEnv,
          injectBaseUrlFixture,
          addComments
        })
      });
      const data = await res.json();
      if (res.ok && data.project?.id) {
        setActiveCloudProjectId(data.project.id);
        setCollectionName(data.project.project_name);
        setCollectionDescription(data.project.collection_name || "");
        setCollectionItems(data.project.collection_items || []);
        resetEngineState();
      }
    } catch (err: any) {
      console.error("Auto create failed:", err);
    }
  };

  // --- AUTOMATED WORKSPACE CONTEXT INITIALIZER ---
  useEffect(() => {
    let active = true;
    if (session?.access_token) {
      fetch("/api/projects", {
        headers: {
          "Authorization": `Bearer ${session.access_token}`
        }
      })
      .then(res => res.json())
      .then(data => {
        if (!active) return;
        if (data.projects && data.projects.length > 0) {
          // Auto-select the first project if no active project is already set
          if (!activeCloudProjectId) {
            handleSelectProject(data.projects[0].id);
          }
        } else if (!data.needSchema) {
          // Auto-create a default project so they have an out-of-the-box working workspace!
          fetch("/api/projects", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${session.access_token}`
            },
            body: JSON.stringify({
              projectName: "Default Workspace",
              collectionName: "Sample API collection",
              collectionItems: []
            })
          })
          .then(res => res.json())
          .then(createData => {
            if (active && createData.project?.id) {
              handleSelectProject(createData.project.id);
            }
          })
          .catch(err => console.warn("Auto-create default project failed:", err));
        }
      })
      .catch(err => console.warn("Failed to auto-load projects on startup:", err));
    }
    return () => {
      active = false;
    };
  }, [session]);

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
  const [activeTab, setActiveTab] = useState<"consolidated" | "modular" | "run" | "mcp" | "audit">("consolidated");

  // --- MULTI-TAB IDE WORKSPACE STATES ---
  const [openTabs, setOpenTabs] = useState<string[]>(["dashboard", "collections", "pytest_consolidated", "runner"]);
  const [activeTabId, setActiveTabId] = useState<string>("dashboard");
  const [isRightSidebarOpen, setIsRightSidebarOpen] = useState<boolean>(true);
  const [rightSidebarTab, setRightSidebarTab] = useState<"agent" | "diagnostics" | "activity">("agent");

  // Bidirectional Synchronization between legacy tabs state and new Multi-Tab IDE system
  useEffect(() => {
    let targetTab = "";
    if (activeTab === "consolidated") targetTab = "pytest_consolidated";
    else if (activeTab === "modular") targetTab = "pytest_modular";
    else if (activeTab === "run") targetTab = "runner";
    else if (activeTab === "mcp") targetTab = "mcp_hub";
    else if (activeTab === "audit") targetTab = "audit_logs";

    if (targetTab) {
      if (!openTabs.includes(targetTab)) {
        setOpenTabs(prev => [...prev, targetTab]);
      }
      setActiveTabId(targetTab);
    }
  }, [activeTab]);

  useEffect(() => {
    if (activeTabId === "pytest_consolidated" && activeTab !== "consolidated") {
      setActiveTab("consolidated");
    } else if (activeTabId === "pytest_modular" && activeTab !== "modular") {
      setActiveTab("modular");
    } else if (activeTabId === "runner" && activeTab !== "run") {
      setActiveTab("run");
    } else if (activeTabId === "mcp_hub" && activeTab !== "mcp") {
      setActiveTab("mcp");
    } else if (activeTabId === "audit_logs" && activeTab !== "audit") {
      setActiveTab("audit");
    }
  }, [activeTabId]);

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
      const headers: any = {};
      if (session?.access_token) {
        headers["Authorization"] = `Bearer ${session.access_token}`;
      }
      const res = await fetch("/api/mcp/tools", { headers });
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
      const headers: any = {};
      if (session?.access_token) {
        headers["Authorization"] = `Bearer ${session.access_token}`;
      }
      const res = await fetch("/api/mcp/logs", { headers });
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

      const headers: any = { "Content-Type": "application/json" };
      if (session?.access_token) {
        headers["Authorization"] = `Bearer ${session.access_token}`;
      }

      const res = await fetch("/api/mcp", {
        method: "POST",
        headers,
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

      const headers: any = { "Content-Type": "application/json" };
      if (session?.access_token) {
        headers["Authorization"] = `Bearer ${session.access_token}`;
      }

      const res = await fetch("/api/mcp/agent-chat", {
        method: "POST",
        headers,
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
    if (!activeCloudProjectId) {
      createNewProjectWithData(sample.name, sample.description || "Sample API collection", sample.items || []);
    }
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
      if (!activeCloudProjectId) {
        createNewProjectWithData(name, desc || "Uploaded Collection", list);
      }
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
      if (!activeCloudProjectId) {
        createNewProjectWithData(data.name, data.description || "Postman Cloud Collection", data.items || []);
      }
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

      // Auto save if user is logged in
      if (session) {
        setTimeout(async () => {
          const pId = await getOrCreateActiveProject();
          if (pId) {
            await fetch(`/api/projects/${pId}/save-files`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${session.access_token}`
              },
              body: JSON.stringify({
                pytestCode: data.pytest_code,
                modularFiles: data.modular_files
              })
            }).catch(e => console.warn("Auto-save files error:", e));
          }
        }, 50);
      }
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

      // Auto save if user is logged in
      if (session) {
        setTimeout(async () => {
          const pId = await getOrCreateActiveProject();
          if (pId) {
            await fetch(`/api/projects/${pId}/save-execution`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${session.access_token}`
              },
              body: JSON.stringify({
                passedCount: data.passed,
                failedCount: data.failed,
                executionTime: data.execution_time,
                reportJson: data,
                outputLog: data.output_log
              })
            }).catch(e => console.warn("Auto-save execution error:", e));

            if (data.failures && data.failures.length > 0) {
              for (const f of data.failures) {
                await fetch(`/api/projects/${pId}/save-analysis`, {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${session.access_token}`
                  },
                  body: JSON.stringify({
                    errorMessage: f.error_message || "",
                    diagnosis: f.probable_cause || "",
                    recommendation: f.recommendations || ""
                  })
                }).catch(e => console.warn("Auto-save analysis failure:", e));
              }
            }
          }
        }, 50);
      }
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
            return <span key={i} className={isDarkMode ? "text-indigo-400 font-semibold" : "text-indigo-600 font-semibold"}>{part}</span>;
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

  if (!session) {
    return (
      <div className={`min-h-screen flex flex-col items-center justify-center font-sans tracking-tight leading-normal ${isDarkMode ? "bg-[#0b0c0d] text-neutral-100" : "bg-neutral-50 text-neutral-800"}`}>
        <div className="absolute inset-x-0 top-0 h-1 bg-[#101112]"></div>

        <div className="w-full max-w-sm p-8 rounded-2xl border border-neutral-800/60 bg-[#111215]/80 backdrop-blur-md shadow-2xl relative overflow-hidden flex flex-col items-center text-center">
          <div className="absolute -top-16 -right-16 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl"></div>
          
          <div className="p-4 bg-indigo-600/10 border border-indigo-500/20 rounded-2xl mb-5 flex items-center justify-center text-indigo-400">
            <Zap className="h-10 w-10 animate-pulse text-indigo-505 fill-indigo-500/10" />
          </div>

          <span className="px-2.5 py-1 text-[9px] font-mono tracking-widest text-[#beebd8] bg-[#0b241d]/80 border border-indigo-500/20 rounded-md font-bold uppercase mb-4">
            Identity gatekeeper
          </span>

          <h2 className="text-xl font-extrabold font-display text-white tracking-tight mb-2">
            Pytestify Enterprise Workspace
          </h2>
          
          <p className="text-xs text-neutral-400 font-light max-w-xs leading-relaxed mb-6">
            Authorized single sign-on is mandatory for this tenant instance. All operations, executions, and file translations are audited and tracked under corporate compliance rules.
          </p>

          <div className="flex flex-col gap-3 w-full max-w-xs mb-3">
            <button
              id="workspace-entrance-signin-btn"
              onClick={() => setIsAuthModalOpen(true)}
              className="w-full py-2.5 bg-indigo-600 hover:bg-slate-700 text-white font-mono text-xs font-bold rounded-lg transition duration-200 cursor-pointer shadow-md flex items-center justify-center gap-1.5"
            >
              <LogIn className="h-4 w-4" />
              Sign In Workspace
            </button>
          </div>

          <div className="text-[9px] font-mono text-neutral-505 mt-2">
            PORT : 3000 | COMPLIANCE AGENT ACTIVE
          </div>
        </div>

        <AuthModal
          isOpen={isAuthModalOpen}
          onClose={() => setIsAuthModalOpen(false)}
          isDarkMode={isDarkMode}
          onAuthSuccess={(newSession) => setSession(newSession)}
        />
      </div>
    );
  }

  const userRole = session?.user?.user_metadata?.role || session?.user?.role || "Staff";
  const isAdmin = userRole === "Admin";

  const handleRunFailureDiagnostic = async () => {
    setAiDiagnosticIsLoading(true);
    setAiDiagnosticResult("");
    try {
      const errorDetails = execResult?.failures?.map((f: any) => `${f.test_name}: ${f.error_message}`).join("\n") || "No failures found.";
      const headers: any = { "Content-Type": "application/json" };
      if (session?.access_token) {
        headers["Authorization"] = `Bearer ${session.access_token}`;
      }
      const res = await fetch("/api/mcp/agent-chat", {
        method: "POST",
        headers,
        body: JSON.stringify({
          prompt: `Provide a detailed AI Failure Diagnosis and Remediation suggestion for the following test errors:\n\n${errorDetails}\n\nStrictly address what caused the error and supply a corrected python snippet or config fix.`,
          customApiKey,
          contextState: { errorDetails }
        })
      });
      if (res.ok) {
        const data = await res.json();
        setAiDiagnosticResult(data.direct_response || data.finalResponse || data.response || "No diagnostic results returned.");
      } else {
        const text = await res.text();
        setAiDiagnosticResult(`Error during diagnostics check: ${text}`);
      }
    } catch (err: any) {
      setAiDiagnosticResult(`Failed to execute diagnostics check: ${err.message}`);
    } finally {
      setAiDiagnosticIsLoading(false);
    }
  };

  const handleExplainPytestCode = async () => {
    if (!pytestCode) return;
    setAiExplanationIsLoading(true);
    setAiExplanationResult("");
    try {
      const headers: any = { "Content-Type": "application/json" };
      if (session?.access_token) {
        headers["Authorization"] = `Bearer ${session.access_token}`;
      }
      const res = await fetch("/api/mcp/agent-chat", {
        method: "POST",
        headers,
        body: JSON.stringify({
          prompt: `Explain the transpiled pytest code in detail. Focus on how the Javascript dynamic assertion triggers were parsed into standard Python assertion lines, the fixture mappings, and dynamic variables:\n\n${pytestCode}`,
          customApiKey
        })
      });
      if (res.ok) {
        const data = await res.json();
        setAiExplanationResult(data.direct_response || data.finalResponse || data.response || "No code explanation feedback returned.");
      } else {
        const text = await res.text();
        setAiExplanationResult(`Error during code explanation: ${text}`);
      }
    } catch (err: any) {
      setAiExplanationResult(`Failed to execute code explanation: ${err.message}`);
    } finally {
      setAiExplanationIsLoading(false);
    }
  };

  // Sidebar navigation lists grouped by domain
  const sidebarGroups = [
    {
      title: "Workspace",
      id: "workspace",
      items: [
        { id: "dashboard", label: "Dashboard", icon: LayoutDashboard, role: "any" },
        { id: "projects", label: "Projects", icon: Folder, role: "any" },
        { id: "collections", label: "Collections", icon: Layers, role: "any" },
      ]
    },
    {
      title: "Testing",
      id: "testing",
      items: [
        { id: "pytest_studio", label: "Pytest Studio", icon: Code, role: "any" },
        { id: "execution_center", label: "Execution Center", icon: Play, role: "any" },
      ]
    },
    ...(isAdmin ? [
      {
        title: "Administration",
        id: "admin",
        items: [
          { id: "user_management", label: "Users", icon: Users, role: "Admin" },
          { id: "audit_center", label: "Audit Logs", icon: ShieldCheck, role: "Admin" },
          { id: "login_history", label: "Login History", icon: History, role: "Admin" },
        ]
      }
    ] : []),
    {
      title: "Account",
      id: "account",
      items: [
        { id: "profile", label: "Profile", icon: User, role: "any" },
        { id: "settings", label: "Settings", icon: Sliders, role: "any" },
      ]
    }
  ];

  // Helper action to click items on the sidebar
  const handleSidebarClick = (pageId: string) => {
    if (pageId === "collections") {
      setCurrentPage("projects");
      setProjectTab("collection");
    } else if (pageId === "pytest_studio") {
      setCurrentPage("projects");
      setProjectTab("pytest");
    } else if (pageId === "execution_center") {
      setCurrentPage("projects");
      setProjectTab("execution");
    } else if (pageId === "ai_analysis") {
      setCurrentPage("projects");
      setProjectTab("ai");
    } else {
      setCurrentPage(pageId as any);
    }
  };

  return (
    <div className={`min-h-screen flex flex-row font-sans transition-colors duration-200 antialiased selection:bg-indigo-505/10 selection:text-indigo-505 ${bgMain}`}>
      
      {/* MOBILE NAV TOGGLE OVERLAY */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-12 border-b z-40 px-4 flex items-center justify-between bg-[#111215]/90 backdrop-blur-md border-neutral-800">
        <button 
          onClick={() => setSidebarExpanded(!sidebarExpanded)}
          className="p-1 text-neutral-400 hover:text-white"
        >
          <Menu className="h-5 w-5" />
        </button>
        <span className="text-xs uppercase font-mono tracking-widest text-indigo-400 font-bold">Pytestify Enterprise</span>
        <div className="flex items-center gap-1.5">
          <button onClick={() => setIsDarkMode(!isDarkMode)} className="p-1 text-neutral-400">
            {isDarkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {/* --- SIDEBAR CONTAINER --- */}
      <aside 
        className={`fixed md:sticky top-0 left-0 h-screen z-50 flex flex-col shrink-0 border-r ${borderCol} ${bgSide} transition-all duration-300 ${
          sidebarExpanded ? "w-64 translate-x-0" : "w-16 md:w-16 -translate-x-[150%] md:translate-x-0"
        } select-none`}
      >
        {/* Sidebar Header Brand block */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-neutral-800/20">
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="p-2 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-lg text-white shadow-md shadow-indigo-500/10 flex items-center justify-center font-black shrink-0 font-sans">
              <Zap className="h-4.5 w-4.5 fill-white/10" />
            </div>
            {sidebarExpanded && (
              <div className="flex flex-col text-left">
                <span className={`text-[13px] font-extrabold tracking-tight ${textTitle} truncate font-display`}>
                  Pytestify Studio
                </span>
                <span className="text-[9px] uppercase font-bold text-indigo-400 tracking-widest font-mono">
                  Enterprise
                </span>
              </div>
            )}
          </div>
          
          <button 
            onClick={() => setSidebarExpanded(!sidebarExpanded)}
            className="hidden md:flex p-1.5 hover:bg-neutral-800/10 dark:hover:bg-neutral-800/40 rounded-lg text-neutral-500 hover:text-neutral-300 transition shrink-0"
          >
            <ChevronLeft className={`h-4.5 w-4.5 transition duration-300 ${!sidebarExpanded ? "rotate-180" : ""}`} />
          </button>
        </div>

        {/* Scrollable Navigation section */}
        <div className="flex-grow overflow-y-auto px-3 py-4 space-y-5 scrollbar-thin">
          {sidebarGroups.map((group) => (
            <div key={group.id} className="space-y-1">
              {sidebarExpanded && (
                <span className="px-3 text-[9px] font-semibold tracking-wider text-neutral-500 uppercase font-mono block mb-1.5 text-left">
                  {group.title}
                </span>
              )}
              <div className="space-y-0.5">
                {group.items.map((item) => {
                  const isActive = 
                    (item.id === "dashboard" && currentPage === "dashboard") ||
                    (item.id === "projects" && currentPage === "projects" && (activeCloudProjectId === null || (projectTab !== "collection" && projectTab !== "pytest" && projectTab !== "execution"))) ||
                    (item.id === "collections" && currentPage === "projects" && activeCloudProjectId !== null && projectTab === "collection") ||
                    (item.id === "pytest_studio" && currentPage === "projects" && activeCloudProjectId !== null && projectTab === "pytest") ||
                    (item.id === "execution_center" && currentPage === "projects" && activeCloudProjectId !== null && projectTab === "execution") ||
                    (currentPage === item.id);

                  return (
                    <button
                      key={item.id}
                      onClick={() => handleSidebarClick(item.id)}
                      className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium font-sans border border-transparent transition cursor-pointer ${
                        isActive
                          ? "bg-indigo-600/10 text-indigo-400 border-indigo-500/15 font-semibold"
                          : "text-neutral-500 hover:text-neutral-250 hover:bg-neutral-800/5 dark:hover:bg-neutral-800/20"
                      }`}
                      title={item.label}
                    >
                      <item.icon className={`h-4.5 w-4.5 shrink-0 ${isActive ? "text-indigo-400" : "text-neutral-500"}`} />
                      {sidebarExpanded && <span className="truncate">{item.label}</span>}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* User context / system parameters at the bottom */}
        <div className="p-3 border-t border-neutral-800/20 flex flex-col gap-2.5">
          {session && (
            <div className="flex items-center gap-2 px-1 py-1">
              <div className="h-8 w-8 rounded-lg bg-neutral-800/80 border border-neutral-700/50 flex items-center justify-center text-xs font-mono font-bold text-neutral-300 tracking-wider shrink-0">
                {userRole === "Admin" ? "AD" : "ST"}
              </div>
              {sidebarExpanded && (
                <div className="flex flex-col text-left min-w-0 flex-1 font-sans">
                  <span className="text-xs font-bold text-neutral-305 truncate font-sans" title={session.user?.email}>
                    {session.user?.email?.split('@')[0]}
                  </span>
                  <span className="text-[10px] text-neutral-500 uppercase tracking-widest font-mono truncate">
                    {userRole}
                  </span>
                </div>
              )}
            </div>
          )}
          
          {sidebarExpanded && (
            <button
              onClick={async () => {
                const supabase = await getSupabaseClient();
                if (supabase) {
                  await supabase.auth.signOut();
                  setSession(null);
                }
              }}
              className="w-full py-1 px-3 border border-rose-500/15 hover:border-rose-500 bg-rose-600/10 hover:bg-rose-600 text-rose-500 hover:text-white font-mono text-[10.5px] font-bold rounded-lg transition duration-200 cursor-pointer flex items-center justify-center gap-1.5"
            >
              <LogOut className="h-3.5 w-3.5 animate-pulse" />
              Sign Out
            </button>
          )}
        </div>
      </aside>

      {/* --- CONTENT CONTAINER --- */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen relative md:mt-0 pt-12 md:pt-0">
        
        {/* Top Editorial System Bar (Highly Technical and Sleek) */}
        <div className={`${isDarkMode ? "bg-[#0b241d] text-[#beebd8]" : "bg-[#0c3127] text-[#dfebd5]"} text-[10px] font-mono py-1 px-5 tracking-wider flex justify-between items-center z-10 transition-colors`}>
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse"></span>
            <span>POSTMAN-TO-PYTEST AUTO-MIGRATOR COMPREHENSIVE SUITE</span>
          </div>
          <div className="hidden md:flex items-center gap-6">
            <span>ACTIVE INSTANCE: EXPRESS/VITE PRO</span>
            <span>CLEARANCE: <strong className="text-emerald-400 font-bold uppercase">{userRole}</strong></span>
            <span>THEME: {isDarkMode ? "OBSIDIAN DEEP" : "ALABASTER MOCK-UP"}</span>
            <span>UTC {new Date().toISOString().replace('T', ' ').substring(0, 19)}</span>
          </div>
        </div>

        {/* Content Header section */}
        <header className={`border-b ${borderCol} ${isDarkMode ? "bg-[#111215]" : "bg-[#fbfbfa]"} py-4 px-6 sticky top-0 z-10 transition-colors shadow-xs flex justify-between items-center z-20`}>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarExpanded(!sidebarExpanded)}
              className="p-1.5 rounded-lg border border-neutral-800 hover:bg-neutral-800 transition text-neutral-400 hover:text-white md:hidden"
            >
              <Menu className="h-4 w-4" />
            </button>
            <div className="text-left">
              <div className="flex items-center gap-2">
                <h1 className={`text-sm md:text-base font-display font-bold ${textTitle} tracking-tight mt-0`}>
                {currentPage === "dashboard" && "Dashboard Operations Center"}
                {currentPage === "projects" && (activeCloudProjectId ? "Project Workspace IDE" : "Workspace Projects Folder")}
                {currentPage === "audit_center" && "Enterprise Audit Center"}
                {currentPage === "login_history" && "LDAP Login Trail"}
                {currentPage === "user_management" && "Directory User list"}
                {currentPage === "profile" && "LDAP Security Profile"}
                {currentPage === "settings" && "General Workspace Settings"}
              </h1>
              <span className="hidden sm:inline px-1.5 py-0.5 text-[8.5px] uppercase font-mono tracking-widest rounded bg-neutral-800 border border-neutral-700/50 text-indigo-400 font-bold">
                {userRole === "Admin" ? "SECURE-NODE-ADMIN" : "NODE-STAFF"}
              </span>
            </div>
            <p className="text-[11px] text-neutral-400 mt-0.5 font-light font-sans leading-normal text-left">
              {currentPage === "dashboard" && "Centralized corporate launchpad displaying repository metrics, system status, and logins."}
              {currentPage === "projects" && (activeCloudProjectId ? `Workspace for managing endpoint compilation and simulated trials.` : "Create and select team-scoped Pytest migration sandboxes.")}
              {currentPage === "audit_center" && "Secured trails for corporate audit compliance logs."}
              {currentPage === "login_history" && "Active directory authentications and LDAP login sessions."}
              {currentPage === "user_management" && "Toggle teammate clearance credentials and add corporate users."}
              {currentPage === "profile" && "Your registered enterprise metadata and credentials."}
              {currentPage === "settings" && "Configure Python compiler targets, API credentials, and visual presets."}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsDarkMode(!isDarkMode)}
              className={`p-2 rounded-lg border ${borderCol} ${isDarkMode ? "hover:bg-neutral-805 bg-black/20 text-yellow-555" : "hover:bg-neutral-100 bg-neutral-50 text-indigo-505"} transition-all duration-200`}
              title={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
            >
              {isDarkMode ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />}
            </button>

            <button
              id="reset-samples-btn-header"
              onClick={fetchSampleExamples}
              className={`px-3 py-1.5 text-[11px] font-mono font-medium rounded-lg border ${borderCol} ${isDarkMode ? "text-neutral-300 hover:bg-neutral-800" : "text-neutral-600 hover:bg-neutral-100"} transition flex items-center gap-1.5`}
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Reset Samples
            </button>
          </div>
        </header>

        {/* View Frame Outer scrolling canvas */}
        <main className="flex-grow overflow-y-auto p-4 md:p-6 w-full max-w-7xl mx-auto flex flex-col gap-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentPage + (activeCloudProjectId ? `-${activeCloudProjectId}-${projectTab}` : "")}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="flex-grow flex flex-col"
            >
              {/* PAGE 1: DASHBOARD */}
              {currentPage === "dashboard" && (
                <div className="space-y-6">
                  <DashboardPanel
                    isDarkMode={isDarkMode}
                    borderCol={borderCol}
                    bgAccent={bgAccent}
                    textTitle={textTitle}
                    session={session}
                    collectionName={collectionName}
                    execResult={execResult}
                    mcpTools={mcpTools}
                    activeCloudProjectId={activeCloudProjectId}
                    handleSelectProject={handleSelectProject}
                    setActiveCloudProjectId={setActiveCloudProjectId}
                    setActiveTabId={(tabId) => {
                      setCurrentPage("projects");
                      if (tabId === "collections") setProjectTab("collection");
                      if (tabId === "pytest_consolidated") setProjectTab("pytest");
                      if (tabId === "runner") setProjectTab("execution");
                    }}
                  />

                  {/* ADMIN ONLY LANDING AREA OVERVIEW */}
                  {isAdmin && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 border-t border-neutral-800/20 pt-6">
                      <div className={`p-4 rounded-xl border ${borderCol} ${bgAccent} space-y-3`}>
                        <div className="flex justify-between items-center pb-2 border-b border-neutral-800/10 dark:border-neutral-800/40">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-400 font-mono flex items-center gap-1.5">
                            <History className="h-4 w-4" /> Recent LDAP Logins (Admin Only)
                          </span>
                          <button onClick={() => setCurrentPage("login_history")} className="text-[10.5px] text-indigo-400 hover:underline font-mono">
                            View All →
                          </button>
                        </div>
                        <AdminPortal session={session} isDarkMode={isDarkMode} overrideTab="login" hideStats={true} />
                      </div>

                      <div className={`p-4 rounded-xl border ${borderCol} ${bgAccent} space-y-3`}>
                        <div className="flex justify-between items-center pb-2 border-b border-neutral-800/10 dark:border-neutral-800/40">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-rose-500 font-mono flex items-center gap-1.5">
                            <ShieldCheck className="h-4 w-4" /> Recent Security Audits (Admin Only)
                          </span>
                          <button onClick={() => setCurrentPage("audit_center")} className="text-[10.5px] text-[#f43f5e] hover:underline font-mono">
                            View All →
                          </button>
                        </div>
                        <AdminPortal session={session} isDarkMode={isDarkMode} overrideTab="audit" hideStats={true} />
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* PAGE 2: PROJECTS VIEW */}
              {currentPage === "projects" && (
                <div className="flex-grow flex flex-col gap-4">
                  {activeCloudProjectId !== null ? (
                    /* PROJECT OPENED: IDE WORKSPACE WORKFLOW */
                    <div className="flex-grow flex flex-col gap-6">
                      
                      {/* IDE Tab Header Bar */}
                      <div className={`p-4 rounded-xl border ${borderCol} bg-neutral-900/5 dark:bg-neutral-950/20 flex flex-col md:flex-row justify-between items-start md:items-center gap-4`}>
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => setActiveCloudProjectId(null)}
                            className={`p-2 rounded-lg border ${borderCol} ${bgAccent} hover:bg-neutral-800 text-neutral-400 hover:text-white transition`}
                            title="Back to Projects Directory"
                          >
                            <ChevronLeft className="h-4 w-4" />
                          </button>
                          <div className="text-left">
                            <span className="text-[9px] font-mono tracking-widest text-indigo-500 font-bold uppercase block">Active Target Namespace</span>
                            <h3 className={`text-sm font-bold ${textTitle} flex items-center gap-1.5 mt-0.5`}>
                              <Folder className="h-4.5 w-4.5 text-indigo-505 fill-indigo-500/10" />
                              {collectionName || "Active Transpiler Workspace"}
                            </h3>
                          </div>
                        </div>

                        {/* IDE Tabs Selectors */}
                        <div className="flex rounded-lg bg-neutral-950/60 p-1 border border-neutral-800 w-full md:w-auto overflow-x-auto gap-0.5 font-mono">
                          {[
                            { key: "collection", id: "collection", label: "Collection Setup", icon: UploadCloud },
                            { key: "pytest", id: "pytest", label: "Generated Pytest", icon: Code },
                            { key: "execution", id: "execution", label: "Execution Results", icon: Play },
                            { key: "ai", id: "ai", label: "AI Analysis & Chat", icon: Sparkles },
                            { key: "downloads", id: "downloads", label: "Downloads Center", icon: Download }
                          ].map((t) => (
                            <button
                              key={t.id}
                              onClick={() => setProjectTab(t.key as any)}
                              className={`px-3 py-1.5 rounded-md text-[10.5px] transition font-bold cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                                projectTab === t.key
                                  ? "bg-indigo-600 text-white shadow-sm"
                                  : "text-neutral-400 hover:text-neutral-205"
                              }`}
                            >
                              <t.icon className="h-3.5 w-3.5" />
                              {t.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Render appropriate IDE Panel Depending on selected tab */}
                      <div className="flex-grow">
                        {projectTab === "collection" && (
                          <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 items-start">
                            {/* Library & Config column */}
                            <div className="xl:col-span-4 flex flex-col gap-4">
                              <div className={`p-4 rounded-xl border ${borderCol} ${bgAccent} space-y-4`}>
                                <div className="text-left">
                                  <span className="text-[9px] font-mono text-indigo-400 font-bold block uppercase tracking-widest">Compiler Targets</span>
                                  <h3 className={`text-xs font-bold font-sans ${textTitle} mt-0.5`}>Framework Profile</h3>
                                </div>
                                <div className="font-mono text-xs space-y-3">
                                  <div className="flex flex-col gap-1 text-left">
                                    <label className="text-[9px] uppercase tracking-wider text-neutral-400 font-bold">Python Target Library</label>
                                    <select
                                      value={library}
                                      onChange={(e) => setLibrary(e.target.value as any)}
                                      className={`py-1 px-2 border rounded font-mono text-xs ${selectStyle}`}
                                    >
                                      <option value="requests">requests (Standard sync)</option>
                                      <option value="httpx">httpx (Modern synchronous)</option>
                                      <option value="async_httpx">async_httpx (High velocity async)</option>
                                    </select>
                                  </div>

                                  <div className="flex flex-col gap-1 text-left">
                                    <label className="text-[9px] uppercase tracking-wider text-neutral-400 font-bold">Base URL Environment Token</label>
                                    <input
                                      type="text"
                                      value={baseUrlEnv}
                                      onChange={(e) => setBaseUrlEnv(e.target.value)}
                                      placeholder="e.g. {{baseUrl}}"
                                      className={`py-1.5 px-2 bg-black/40 border ${borderCol} rounded placeholder:text-neutral-700 text-xs`}
                                    />
                                  </div>

                                  <div className="flex items-center justify-between border-t border-neutral-800/40 pt-2.5 mt-2.5">
                                    <span className="text-[10px] text-neutral-405 font-bold">Inject Pytest Fixture URL</span>
                                    <input
                                      type="checkbox"
                                      checked={injectBaseUrlFixture}
                                      onChange={(e) => setInjectBaseUrlFixture(e.target.checked)}
                                      className="rounded text-indigo-505 bg-neutral-900 border-neutral-800"
                                    />
                                  </div>

                                  <div className="flex items-center justify-between">
                                    <span className="text-[10px] text-neutral-405 font-bold">Generate AST Code Comments</span>
                                    <input
                                      type="checkbox"
                                      checked={addComments}
                                      onChange={(e) => setAddComments(e.target.checked)}
                                      className="rounded text-indigo-505 bg-neutral-900 border-neutral-800"
                                    />
                                  </div>
                                </div>
                              </div>

                              <button
                                onClick={handleMigrate}
                                disabled={isMigrating || collectionItems.length === 0}
                                className="w-full bg-indigo-600 hover:bg-indigo-700 py-2.5 rounded-xl text-xs font-mono font-bold uppercase text-white shadow-md transition flex items-center justify-center gap-2 cursor-pointer"
                              >
                                {isMigrating ? (
                                  <>
                                    <RefreshCw className="h-3.5 w-3.5 animate-spin text-white" />
                                    <span>Compiler Transpiling...</span>
                                  </>
                                ) : (
                                  <>
                                    <Code className="h-3.5 w-3.5" />
                                    <span>Compile Pytest Suite</span>
                                  </>
                                )}
                              </button>
                            </div>

                            {/* Collections import and Endpoint registry tree map columns */}
                            <div className="xl:col-span-8">
                              <CollectionsPanel
                                isDarkMode={isDarkMode}
                                borderCol={borderCol}
                                bgAccent={bgAccent}
                                textTitle={textTitle}
                                textMuted={textMuted}
                                collectionSource={collectionSource}
                                setCollectionSource={setCollectionSource}
                                dragOver={dragOver}
                                handleDragOver={handleDragOver}
                                handleDragLeave={handleDragLeave}
                                handleDrop={handleDrop}
                                handleFileChange={handleFileChange}
                                fileInputRef={fileInputRef}
                                postmanApiKey={postmanApiKey}
                                setPostmanApiKey={setPostmanApiKey}
                                isPostmanKeyLoading={isPostmanKeyLoading}
                                handleConnectPostman={handleConnectPostman}
                                workspaces={workspaces}
                                selectedWorkspace={selectedWorkspace}
                                handleWorkspaceChange={handleWorkspaceChange}
                                collections={collections}
                                searchQuery={searchQuery}
                                setSearchQuery={setSearchQuery}
                                isCollectionsLoading={isCollectionsLoading}
                                selectedCollectionUid={selectedCollectionUid}
                                handleSelectPostmanCollection={handleSelectPostmanCollection}
                                sampleCollections={sampleCollections}
                                handleSelectSample={handleSelectSample}
                                collectionItems={collectionItems}
                                selectedRequestIndex={selectedRequestIndex}
                                setSelectedRequestIndex={setSelectedRequestIndex}
                                reqActiveTab={reqActiveTab}
                                setReqActiveTab={setReqActiveTab}
                                HighlightJsExpression={HighlightJsExpression}
                                handleMigrate={handleMigrate}
                                isMigrating={isMigrating}
                              />
                            </div>
                          </div>
                        )}

                        {projectTab === "pytest" && (
                          <div className="space-y-6">
                            {/* Layout selection: Consolidated vs Modular */}
                            <div className="flex border-b border-neutral-800/40 pb-1.5 text-xs font-mono gap-5">
                              {["consolidated", "modular"].map((subT) => (
                                <button
                                  key={subT}
                                  onClick={() => setActiveTab(subT as any)}
                                  className={`py-1 px-1 border-b-2 uppercase font-mono font-bold transition focus:outline-none cursor-pointer ${
                                    activeTab === subT
                                      ? "border-indigo-500 text-indigo-400"
                                      : "border-transparent text-neutral-400 hover:text-neutral-200"
                                  }`}
                                >
                                  {subT === "consolidated" ? "test_all_apis.py (Consolidated)" : "Modular Workspace Distribution"}
                                </button>
                              ))}
                            </div>

                            {activeTab === "consolidated" ? (
                              <div className="space-y-4">
                                <PytestConsolidatedPanel
                                  isDarkMode={isDarkMode}
                                  borderCol={borderCol}
                                  bgAccent={bgAccent}
                                  textTitle={textTitle}
                                  pytestCode={pytestCode}
                                  migrations={[]}
                                  copyToClipboard={copyToClipboard}
                                  copiedStates={copiedStates}
                                  handleDownloadSingle={handleDownloadSingle}
                                  bgCard={bgCard}
                                />
                                
                                {aiPromptMeta && (
                                  <div className={`${isDarkMode ? "bg-[#121314] text-[#a9b2c3] border-neutral-800" : "bg-neutral-100 text-neutral-600 border-neutral-200"} rounded-xl p-4 text-[10px] leading-relaxed font-mono border mt-1 text-left`}>
                                    <div className={`font-bold uppercase ${isDarkMode ? "text-neutral-100" : "text-neutral-800"} tracking-wider mb-2 flex items-center gap-2`}>
                                      <Activity className="h-4 w-4 text-emerald-500 animate-pulse" />
                                      AST Conversion Telemetry logs
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 border-b border-neutral-800 pb-2.5 mb-2.5 text-neutral-400">
                                      <div>LLM Engine: <span className={isDarkMode ? "text-neutral-300" : "text-neutral-700"}>gemini-2.5-flash-pro</span></div>
                                      <div>Timestamp: <span className={isDarkMode ? "text-neutral-300" : "text-neutral-700"}>{aiPromptMeta.timestamp}</span></div>
                                    </div>
                                    <details className="cursor-pointer">
                                      <summary className="text-indigo-400 font-semibold hover:underline text-left">View Mapping directives</summary>
                                      <pre className={`mt-2 text-[9px] p-2 rounded max-h-24 overflow-y-auto border whitespace-pre-wrap text-left ${isDarkMode ? "bg-neutral-950 text-neutral-400 border-neutral-900" : "bg-white text-neutral-600"}`}>
                                        {aiPromptMeta.systemInstruction}
                                      </pre>
                                    </details>
                                  </div>
                                )}
                              </div>
                            ) : (
                              <PytestModularPanel
                                borderCol={borderCol}
                                bgAccent={bgAccent}
                                textTitle={textTitle}
                                modularFiles={modularFiles}
                                selectedFileIndex={selectedFileIndex}
                                setSelectedFileIndex={setSelectedFileIndex}
                                copyToClipboard={copyToClipboard}
                                copiedStates={copiedStates}
                                handleDownloadZip={handleDownloadZip}
                                isDarkMode={isDarkMode}
                              />
                            )}
                          </div>
                        )}

                        {projectTab === "execution" && (
                          <VMRunnerPanel
                            borderCol={borderCol}
                            bgAccent={bgAccent}
                            textTitle={textTitle}
                            simulationMode={simulationMode}
                            setSimulationMode={setSimulationMode}
                            handleExecuteTests={handleExecuteTests}
                            isExecuting={isExecuting}
                            execResult={execResult}
                            copiedStates={copiedStates}
                            copyToClipboard={copyToClipboard}
                            isDarkMode={isDarkMode}
                          />
                        )}

                        {projectTab === "ai" && (
                          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 pb-10 items-start">
                            {/* Card A: Failure Diagnosis */}
                            <div className={`p-5 rounded-xl border ${borderCol} ${bgAccent} flex flex-col min-h-[480px] text-left`}>
                              <div className="pb-3 border-b border-neutral-800 flex items-center justify-between mb-4">
                                <div className="text-left animate-fadeIn">
                                  <span className="text-[8px] font-mono text-indigo-400 font-bold block uppercase tracking-widest">Failure Diagnostics Engine</span>
                                  <h3 className={`text-xs md:text-sm font-bold font-sans ${textTitle} mt-0.5`}>AI Failure Diagnostics & Remediation</h3>
                                </div>
                                <span className="px-2 py-0.5 text-[9px] font-mono bg-emerald-500/10 text-emerald-400 rounded-md font-bold uppercase shrink-0">
                                  Active Analysis
                                </span>
                              </div>

                              <div className="space-y-4 flex-grow flex flex-col justify-between">
                                <div className="space-y-3">
                                  <p className="text-[11px] text-neutral-400 leading-normal">
                                    Analyze active assertion failures and payload mismatch errors identified in the last Pytest VM execution.
                                  </p>

                                  <div className="p-3 bg-neutral-950/60 rounded border border-neutral-800 text-[10.5px] font-mono text-neutral-400 select-text">
                                    <div className="text-[8px] font-bold text-neutral-500 uppercase tracking-wider mb-1">Active VM Trace:</div>
                                    {execResult && execResult.failed > 0 ? (
                                      <div className="text-rose-400 leading-relaxed">
                                        ❌ Found {execResult.failed} failed assertions in the environment trial trace.
                                      </div>
                                    ) : (
                                      <div className="text-emerald-400 leading-relaxed">
                                        ✓ Last execution results was 100% compliant. No errors found.
                                      </div>
                                    )}
                                  </div>

                                  {aiDiagnosticResult ? (
                                    <div className="p-3.5 bg-neutral-950 border border-neutral-800 rounded-lg max-h-64 overflow-y-auto text-[11px]/relaxed leading-relaxed font-sans text-neutral-300 select-text whitespace-pre-wrap">
                                      {aiDiagnosticResult}
                                    </div>
                                  ) : (
                                    <div className="h-44 flex flex-col items-center justify-center p-4 border border-dashed border-neutral-800 rounded-lg text-center text-neutral-500 gap-1.5 font-mono text-[10px]">
                                      <Terminal className="h-6 w-6 text-neutral-700" />
                                      <span>Click button to initiate AI diagnostics analyzer...</span>
                                    </div>
                                  )}
                                </div>

                                <div className="pt-2">
                                  <button
                                    onClick={handleRunFailureDiagnostic}
                                    disabled={aiDiagnosticIsLoading || !execResult || execResult.failed === 0}
                                    className={`w-full py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-neutral-800 disabled:text-neutral-500 text-white font-mono font-bold rounded-lg text-xs uppercase cursor-pointer flex items-center justify-center gap-2`}
                                  >
                                    {aiDiagnosticIsLoading ? (
                                      <>
                                        <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                                        <span>Running Diagnostic Model...</span>
                                      </>
                                    ) : (
                                      <>
                                        <Sparkles className="h-3.5 w-3.5" />
                                        <span>Diagnose Trial Faults</span>
                                      </>
                                    )}
                                  </button>
                                </div>
                              </div>
                            </div>

                            {/* Card B: AST Code Explainer */}
                            <div className={`p-5 rounded-xl border ${borderCol} ${bgAccent} flex flex-col min-h-[480px] text-left`}>
                              <div className="pb-3 border-b border-neutral-800 flex items-center justify-between mb-4">
                                <div className="text-left animate-fadeIn">
                                  <span className="text-[8px] font-mono text-indigo-400 font-bold block uppercase tracking-widest">AST Compiler Insights</span>
                                  <h3 className={`text-xs md:text-sm font-bold font-sans ${textTitle} mt-0.5`}>AST Code Parser & Explainer</h3>
                                </div>
                                <span className="px-2 py-0.5 text-[9px] font-mono bg-[#6366f1]/10 text-indigo-400 rounded-md font-bold uppercase shrink-0">
                                  Code Parser
                                </span>
                              </div>

                              <div className="space-y-4 flex-grow flex flex-col justify-between">
                                <div className="space-y-3">
                                  <p className="text-[11px] text-neutral-400 leading-normal">
                                    Generates block-by-block structural explanations for transpiled assertions, system fixture environments, and client mappings inside <strong className="text-neutral-200">test_all_apis.py</strong>.
                                  </p>

                                  <div className="p-3 bg-neutral-950/60 rounded border border-neutral-800 text-[10.5px] font-mono text-neutral-400 select-text">
                                    <div className="text-[8px] font-bold text-neutral-500 uppercase tracking-wider mb-1">Target Module Codebase:</div>
                                    {pytestCode ? (
                                      <div className="text-[#a5b4fc] truncate">
                                        ✓ Loaded test_all_apis.py ({pytestCode.split("\n").length} statements compiled)
                                      </div>
                                    ) : (
                                      <div className="text-amber-500">
                                        ⚠ No python test code compiled. Convert collection first.
                                      </div>
                                    )}
                                  </div>

                                  {aiExplanationResult ? (
                                    <div className="p-3.5 bg-neutral-950 border border-neutral-800 rounded-lg max-h-64 overflow-y-auto text-[11px]/relaxed leading-relaxed font-sans text-neutral-300 select-text whitespace-pre-wrap">
                                      {aiExplanationResult}
                                    </div>
                                  ) : (
                                    <div className="h-44 flex flex-col items-center justify-center p-4 border border-dashed border-neutral-800 rounded-lg text-center text-neutral-500 gap-1.5 font-mono text-[10px]">
                                      <Terminal className="h-6 w-6 text-neutral-700" />
                                      <span>Click button to initiate AST code structure explainer...</span>
                                    </div>
                                  )}
                                </div>

                                <div className="pt-2">
                                  <button
                                    onClick={handleExplainPytestCode}
                                    disabled={aiExplanationIsLoading || !pytestCode}
                                    className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-neutral-800 disabled:text-neutral-500 text-white font-mono font-bold rounded-lg text-xs uppercase cursor-pointer flex items-center justify-center gap-2"
                                  >
                                    {aiExplanationIsLoading ? (
                                      <>
                                        <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                                        <span>Parsing compiled Abstract Syntax Trees...</span>
                                      </>
                                    ) : (
                                      <>
                                        <Sparkles className="h-3.5 w-3.5" />
                                        <span>Explain Compiled Pytest Code</span>
                                      </>
                                    )}
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}

                        {projectTab === "downloads" && (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-12">
                            <div className={`p-5 rounded-xl border ${borderCol} ${bgAccent} flex flex-col justify-between h-44 text-left`}>
                              <div className="space-y-1.5 flex flex-col text-left">
                                <FileCode className="h-6 w-6 text-indigo-405" />
                                <h4 className={`font-bold text-xs ${textTitle} mt-0`}>Consolidated Suite (Single File)</h4>
                                <p className="text-[10px] text-neutral-500 leading-normal">
                                  Standard standalone script contains custom request fixtures and parsed assertion calls. Perfect for rapid developer testing.
                                </p>
                              </div>
                              <button
                                onClick={handleDownloadSingle}
                                disabled={!pytestCode}
                                className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-mono text-xs font-bold rounded-lg transition cursor-pointer"
                              >
                                Download test_all_apis.py
                              </button>
                            </div>

                            <div className={`p-5 rounded-xl border ${borderCol} ${bgAccent} flex flex-col justify-between h-44 text-left`}>
                              <div className="space-y-1.5 flex flex-col text-left">
                                <Layers className="h-6 w-6 text-indigo-405" />
                                <h4 className={`font-bold text-xs ${textTitle} mt-0`}>Modular Suite (.ZIP Bundle)</h4>
                                <p className="text-[10px] text-neutral-500 leading-normal">
                                  An enterprise structure: features separate test files, configured conftest.py, and dynamic requirements registries. Matches standard CI pipelines.
                                </p>
                              </div>
                              <button
                                onClick={handleDownloadZip}
                                disabled={modularFiles.length === 0}
                                className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-mono text-xs font-bold rounded-lg transition cursor-pointer"
                              >
                                Download pytest_modular_suite.zip
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    /* DELEGATED: CORPORATE PROJECTS GRID DIRECTORY */
                    <div className="space-y-4">
                      {projectTab !== "collection" && projectTab !== "ai" && projectTab !== "pytest" && projectTab !== "execution" && (
                        <div className={`p-5 rounded-xl border ${borderCol} ${bgAccent} border-l-4 border-l-indigo-600 text-left`}>
                          <h4 className={`font-bold text-xs ${textTitle} mt-0`}>Team projects folder directory</h4>
                          <p className="text-[10.5px] text-neutral-500 mt-1 max-w-xl leading-relaxed font-sans">
                            We managed and synchronized all migration workspaces under Supabase corporate schemas. Select a workspace to configure endpoint structures and generate modules.
                          </p>
                        </div>
                      )}

                      {projectTab === "collection" && (
                        <div className="space-y-5 animate-fadeIn">
                          <div className="p-5 rounded-xl border border-indigo-500/20 bg-indigo-505/5 text-left flex gap-4">
                            <div className="p-3 bg-indigo-500/15 rounded-xl text-indigo-400 shrink-0 self-start animate-bounce">
                              <Sparkles className="h-5 w-5 animate-pulse" />
                            </div>
                            <div className="space-y-1 text-left">
                              <span className="text-[9px] font-mono font-bold tracking-widest text-indigo-450 uppercase">Pre-Sandbox Quick Importer</span>
                              <h4 className={`text-sm font-bold ${textTitle} mt-0.5`}>Quick Import &amp; Initialize Workspace</h4>
                              <p className="text-[11.5px] text-neutral-400 font-sans leading-relaxed">
                                Upload your Postman Collection <strong>.json</strong>, click a quick-start <strong>sample</strong>, or connect to <strong>Postman Cloud</strong> below. We will instantly set up a brand new workspace environment registry and load your API endpoints!
                              </p>
                            </div>
                          </div>

                          <div className={`p-6 rounded-xl border ${borderCol} ${bgAccent}`}>
                            <CollectionsPanel
                              isDarkMode={isDarkMode}
                              borderCol={borderCol}
                              bgAccent={bgAccent}
                              textTitle={textTitle}
                              textMuted={textMuted}
                              collectionSource={collectionSource}
                              setCollectionSource={setCollectionSource}
                              dragOver={dragOver}
                              handleDragOver={handleDragOver}
                              handleDragLeave={handleDragLeave}
                              handleDrop={handleDrop}
                              handleFileChange={handleFileChange}
                              fileInputRef={fileInputRef}
                              postmanApiKey={postmanApiKey}
                              setPostmanApiKey={setPostmanApiKey}
                              isPostmanKeyLoading={isPostmanKeyLoading}
                              handleConnectPostman={handleConnectPostman}
                              workspaces={workspaces}
                              selectedWorkspace={selectedWorkspace}
                              handleWorkspaceChange={handleWorkspaceChange}
                              collections={collections}
                              searchQuery={searchQuery}
                              setSearchQuery={setSearchQuery}
                              isCollectionsLoading={isCollectionsLoading}
                              selectedCollectionUid={selectedCollectionUid}
                              handleSelectPostmanCollection={handleSelectPostmanCollection}
                              sampleCollections={sampleCollections}
                              handleSelectSample={handleSelectSample}
                              collectionItems={collectionItems}
                              selectedRequestIndex={selectedRequestIndex}
                              setSelectedRequestIndex={setSelectedRequestIndex}
                              reqActiveTab={reqActiveTab}
                              setReqActiveTab={setReqActiveTab}
                              HighlightJsExpression={HighlightJsExpression}
                              handleMigrate={handleMigrate}
                              isMigrating={isMigrating}
                            />
                          </div>
                        </div>
                      )}

                      {projectTab === "ai" && (
                        <div className="p-5 rounded-xl border border-indigo-500/20 bg-indigo-500/5 text-left flex gap-4 animate-fadeIn">
                          <div className="p-3 bg-indigo-500/10 rounded-xl text-indigo-400 shrink-0 self-start animate-pulse">
                            <Sparkles className="h-5 w-5" />
                          </div>
                          <div className="space-y-1">
                            <span className="text-[9px] font-mono font-bold tracking-widest text-indigo-400 uppercase">AI Diagnostics Engine</span>
                            <h4 className={`text-sm font-bold ${textTitle} mt-0.5`}>Select a Workspace to Enable AI Failure Analysis</h4>
                            <p className="text-[11px] text-neutral-400 font-sans leading-relaxed">
                              The <strong>AI Analysis &amp; Chat Suite</strong> runs deep Abstract Syntax Tree (AST) parsing and assertion diagnostics on live test files. To proceed, please select an active workspace environment registry compiled below.
                            </p>
                          </div>
                        </div>
                      )}

                      {projectTab === "pytest" && (
                        <div className="p-5 rounded-xl border border-blue-500/20 bg-blue-500/5 text-left flex gap-4 animate-fadeIn">
                          <div className="p-3 bg-blue-500/10 rounded-xl text-blue-400 shrink-0 self-start">
                            <Code className="h-5 w-5" />
                          </div>
                          <div className="space-y-1">
                            <span className="text-[9px] font-mono font-bold tracking-widest text-blue-400 uppercase">Compiled Pytest Codes</span>
                            <h4 className={`text-sm font-bold ${textTitle} mt-0.5`}>Activate a Workspace to View Transpiled Test Code</h4>
                            <p className="text-[11px] text-neutral-400 font-sans leading-relaxed">
                              Choose a target automation workspace card below to view its translated pytest classes, assertion validations, and environment custom fixtures.
                            </p>
                          </div>
                        </div>
                      )}

                      {projectTab === "execution" && (
                        <div className="p-5 rounded-xl border border-emerald-500/20 bg-emerald-500/5 text-left flex gap-4 animate-fadeIn">
                          <div className="p-3 bg-emerald-500/10 rounded-xl text-emerald-400 shrink-0 self-start">
                            <Play className="h-5 w-5" />
                          </div>
                          <div className="space-y-1">
                            <span className="text-[9px] font-mono font-bold tracking-widest text-emerald-400 uppercase">Sandbox Pytest VM</span>
                            <h4 className={`text-sm font-bold ${textTitle} mt-0.5`}>Open a Workspace to Run Cloud Assertion Suites</h4>
                            <p className="text-[11px] text-neutral-400 font-sans leading-relaxed">
                              The <strong>Execution Center</strong> runs real python tests in a secure sandbox VM. To trigger test executes and receive live logs, select a workspace target listed below.
                            </p>
                          </div>
                        </div>
                      )}

                      <MyProjectsDashboard
                        isDarkMode={isDarkMode}
                        authToken={session?.access_token || ""}
                        activeProjectId={activeCloudProjectId}
                        onSelectProject={handleSelectProject}
                        onProjectDeselect={() => setActiveCloudProjectId(null)}
                        onCreateNewProject={(pId) => {
                          setActiveCloudProjectId(pId);
                          setProjectTab("collection");
                        }}
                      />
                    </div>
                  )}
                </div>
              )}



              {/* PAGE 5: AUDIT CENTER (ADMIN ONLY) */}
              {currentPage === "audit_center" && isAdmin && (
                <div className={`p-4 rounded-xl border ${borderCol} ${bgAccent} space-y-4 animate-fadeIn`}>
                  <div className="flex items-center gap-2.5 pb-2 border-b border-neutral-800/10 dark:border-neutral-800/40 text-left animate-fadeIn">
                    <div className="p-2 bg-rose-500/10 text-rose-500 rounded-lg shrink-0">
                      <ShieldCheck className="h-4.5 w-4.5" />
                    </div>
                    <div>
                      <h4 className={`font-bold ${textTitle} mt-0`}>Corporate compliance security log</h4>
                      <p className="text-[10.5px] text-neutral-500 mt-0.5 font-sans leading-normal">
                        Enables tracking of administrative actions, LDAP overrides, and compilation sequences.
                      </p>
                    </div>
                  </div>
                  <AdminPortal session={session} isDarkMode={isDarkMode} overrideTab="audit" hideStats={true} />
                </div>
              )}

              {/* PAGE 6: LOGIN HISTORY (ADMIN ONLY) */}
              {currentPage === "login_history" && isAdmin && (
                <div className={`p-4 rounded-xl border ${borderCol} ${bgAccent} space-y-4 animate-fadeIn`}>
                  <div className="flex items-center gap-2.5 pb-2 border-b border-neutral-800/10 dark:border-neutral-800/40 text-left">
                    <div className="p-2 bg-indigo-500/10 text-indigo-400 rounded-lg shrink-0">
                      <History className="h-4.5 w-4.5" />
                    </div>
                    <div>
                      <h4 className={`font-bold ${textTitle} mt-0`}>LDAP Team Login Sessions</h4>
                      <p className="text-[10.5px] text-neutral-505 mt-0.5 font-sans leading-normal">
                        Active directory logins, IP credentials, duration mappings, and corporate status logs.
                      </p>
                    </div>
                  </div>
                  <AdminPortal session={session} isDarkMode={isDarkMode} overrideTab="login" hideStats={true} />
                </div>
              )}

              {/* PAGE 7: USER MANAGEMENT (ADMIN ONLY) */}
              {currentPage === "user_management" && isAdmin && (
                <div className={`p-4 rounded-xl border ${borderCol} ${bgAccent} space-y-4 animate-fadeIn`}>
                  <div className="flex items-center gap-2.5 pb-2 border-b border-neutral-800/10 dark:border-neutral-800/40 text-left">
                    <div className="p-2 bg-emerald-500/10 text-emerald-450 rounded-lg shrink-0">
                      <Users className="h-4.5 w-4.5" />
                    </div>
                    <div>
                      <h4 className={`font-bold ${textTitle} mt-0`}>Employee and Teammate Directory</h4>
                      <p className="text-[10.5px] text-neutral-500 mt-0.5 font-sans leading-normal">
                        Edit security permissions, set roles, enable or disable LDAP corporate profiles.
                      </p>
                    </div>
                  </div>
                  <AdminPortal session={session} isDarkMode={isDarkMode} overrideTab="users" hideStats={true} />
                </div>
              )}



              {/* PAGE 9: PROFILE VIEW */}
              {currentPage === "profile" && (
                <div className="max-w-2xl mx-auto space-y-5 py-6 animate-fadeIn w-full">
                  <div className={`p-6 rounded-2xl border ${borderCol} ${bgAccent} text-left relative overflow-hidden flex flex-col gap-5`}>
                    <div className="absolute right-0 top-0 h-24 w-24 bg-indigo-500/10 blur-2xl rounded-full"></div>
                    <div className="flex items-center gap-3">
                      <div className="h-12 w-12 rounded-xl bg-indigo-600/10 border border-indigo-500/20 flex items-center justify-center text-lg font-bold font-mono text-indigo-400 shrink-0">
                        {userRole === "Admin" ? "AD" : "ST"}
                      </div>
                      <div className="text-left">
                        <h3 className={`text-base font-bold ${textTitle} mt-0`}>Enterprise Account profile</h3>
                        <p className="text-xs text-neutral-500 leading-normal">Corporate Single Sign-On synchronized directory account parameters.</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-xs font-mono border-t border-b border-neutral-800/10 dark:border-neutral-800/30 py-4 mt-2">
                      <div className="text-left">
                        <span className="text-[9px] uppercase tracking-wider text-neutral-500 block mb-0.5">Account email</span>
                        <span className="text-neutral-300 font-bold truncate block">{session?.user?.email}</span>
                      </div>
                      <div className="text-left">
                        <span className="text-[9px] uppercase tracking-wider text-neutral-500 block mb-0.5 text-left">Corporate Role Assignment</span>
                        <span className="px-2 py-0.5 rounded bg-indigo-600/10 text-indigo-400 text-[10px] w-fit font-bold uppercase border border-indigo-505/15 block" style={{width: 'fit-content'}}>
                          {userRole}
                        </span>
                      </div>
                      <div className="text-left">
                        <span className="text-[9px] uppercase tracking-wider text-neutral-500 block mb-0.5">Unique Employee ID</span>
                        <span className="text-neutral-300 block">EMP-{session?.user?.id?.substring(0, 8).toUpperCase() || "RESERVED"}</span>
                      </div>
                      <div className="text-left">
                        <span className="text-[9px] uppercase tracking-wider text-neutral-500 block mb-0.5 font-bold">LDAP Server gatekeeper</span>
                        <span className="text-emerald-500 block">✓ Active & compliant</span>
                      </div>
                    </div>

                    <div className="flex gap-2.5 pt-2">
                      <button
                        onClick={() => setIsChangePasswordModalOpen(true)}
                        className="py-2 px-4 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs font-mono uppercase cursor-pointer transition shadow animate-fadeIn"
                      >
                        Modify security credentials
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* PAGE 10: SETTINGS */}
              {currentPage === "settings" && (
                <div className="max-w-2xl mx-auto space-y-6 text-left py-6 w-full">
                  {/* Reuse SettingsPanel completely */}
                  <div className={`p-6 rounded-2xl border ${borderCol} ${bgAccent} space-y-4`}>
                    <div className="text-left">
                      <h3 className={`text-sm md:text-base font-bold ${textTitle} mt-0`}>General Workspace Settings</h3>
                      <p className="text-xs text-neutral-500 leading-normal font-sans text-left">Configure global Python compiler target directives, custom API secret overrides, and display modes.</p>
                    </div>

                    <SettingsPanel
                      borderCol={borderCol}
                      bgAccent={bgAccent}
                      textTitle={textTitle}
                      customApiKey={customApiKey}
                      setCustomApiKey={setCustomApiKey}
                      library={library}
                      setLibrary={setLibrary}
                      baseUrlEnv={baseUrlEnv}
                      setBaseUrlEnv={setBaseUrlEnv}
                      injectBaseUrlFixture={injectBaseUrlFixture}
                      setInjectBaseUrlFixture={setInjectBaseUrlFixture}
                      addComments={addComments}
                      setAddComments={setAddComments}
                      isDarkMode={isDarkMode}
                    />
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </main>

        {/* Compact Fine-Type Page Footer */}
        <footer className={`border-t ${borderCol} ${isDarkMode ? "bg-[#111215]" : "bg-[#fbfbfa]"} py-4.5 px-6 text-center text-xs text-neutral-500 font-light mt-auto transition-colors`}>
          <div className="max-w-8xl mx-auto flex flex-col md:flex-row justify-between items-center gap-3.5 animate-fadeIn">
            <p>© 2026 Pytestify Studio Inc. Designed in alignment with premium API product specifications.</p>
            <div className="flex items-center gap-4 font-mono text-[9px] text-neutral-600">
              <span>PLATFORM: PORT 3000 DEV_INGRESS</span>
              <span className="hidden md:inline">|</span>
              <span>PRO_MIGRATOR STATUS: ONLINE</span>
            </div>
          </div>
        </footer>
      </div>

      {/* --- Auth Modal Overlay --- */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        isDarkMode={isDarkMode}
        onAuthSuccess={(newSession) => setSession(newSession)}
      />

      {/* --- Change Password Modal Overlay --- */}
      <ChangePasswordModal
        isOpen={isChangePasswordModalOpen}
        onClose={() => setIsChangePasswordModalOpen(false)}
        session={session}
        isDarkMode={isDarkMode}
      />
    </div>
  );
}
