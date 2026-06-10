import React from "react";
import MyProjectsDashboard from "./MyProjectsDashboard";
import AdminPortal from "./AdminPortal";
import { 
  UploadCloud, Play, Code, Database, Layers, Cpu, ShieldCheck, 
  Settings, Check, Copy, Download, AlertTriangle, ExternalLink, RefreshCw, Send, Terminal 
} from "lucide-react";

interface DashboardPanelProps {
  isDarkMode: boolean;
  borderCol: string;
  bgAccent: string;
  textTitle: string;
  session: any;
  collectionName: string;
  execResult: any;
  mcpTools: any[];
  activeCloudProjectId: string | null;
  handleSelectProject: (id: string) => void;
  setActiveCloudProjectId: (id: string | null) => void;
  setActiveTabId: (id: string) => void;
}

export function DashboardPanel({
  isDarkMode,
  borderCol,
  bgAccent,
  textTitle,
  session,
  collectionName,
  execResult,
  mcpTools,
  activeCloudProjectId,
  handleSelectProject,
  setActiveCloudProjectId,
  setActiveTabId
}: DashboardPanelProps) {
  return (
    <div className="space-y-5 animate-fadeIn pb-10">
      {/* Enterprise Workspace Pitch */}
      <div className={`p-4 rounded-xl border ${borderCol} ${isDarkMode ? "bg-gradient-to-r from-neutral-900 to-neutral-950" : "bg-white"} shadow-xs`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b pb-2.5 mb-3 border-neutral-800/10 dark:border-neutral-800/60">
          <div>
            <span className="text-[9px] font-mono text-indigo-500 font-bold uppercase tracking-widest">Active Namespace Control</span>
            <h2 className={`text-sm font-bold font-display ${textTitle} tracking-tight mt-0.5`}>Welcome to Pytestify Workspace Dashboard</h2>
          </div>
          {session && (
            <div className="text-[10px] font-mono text-neutral-500 mt-1 sm:mt-0">
              Corporate Clearance: <strong className="text-indigo-400 uppercase">{session.user?.user_metadata?.role || "Staff"}</strong>
            </div>
          )}
        </div>
        <p className="text-[11px]/relaxed text-neutral-400 select-text leading-normal max-w-3xl">
          An automated enterprise toolkit for converting legacy Postman Chai dynamic collections into pure, compliance-validated Python pytest modules. Manage and sync corporate workflows via Supabase security matrices, isolate diagnostic execution anomalies, and route integrations using standard JSON-RPC 2.0.
        </p>
      </div>

      {/* Corporate Metadata Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 bg-neutral-900/10 dark:bg-neutral-950/20 p-1 rounded-xl">
        <div className={`p-3 rounded-lg border ${borderCol} ${bgAccent}`}>
          <span className="text-[9px] font-mono text-neutral-500 uppercase tracking-wider block">Repository Scope</span>
          <p className={`text-xs font-bold ${textTitle} mt-0.5 truncate`}>{collectionName || "Empty Registry"}</p>
        </div>
        <div className={`p-3 rounded-lg border ${borderCol} ${bgAccent}`}>
          <span className="text-[9px] font-mono text-neutral-500 uppercase tracking-wider block">Simulated VM Checks</span>
          <p className="text-xs font-bold text-emerald-500 mt-0.5">
            {execResult ? `${execResult.passed} passed / ${execResult.total} total` : "Unavailable"}
          </p>
        </div>
        <div className={`p-3 rounded-lg border ${borderCol} ${bgAccent}`}>
          <span className="text-[9px] font-mono text-neutral-500 uppercase tracking-wider block">Registry Tools</span>
          <p className={`text-xs font-bold text-indigo-400 mt-0.5`}>{mcpTools.length || "0"} Registered</p>
        </div>
        <div className={`p-3 rounded-lg border ${borderCol} ${bgAccent}`}>
          <span className="text-[9px] font-mono text-neutral-500 uppercase tracking-wider block font-bold">Trace Gateway</span>
          <p className={`text-xs font-mono text-neutral-400 mt-0.5`}>http://localhost:3000</p>
        </div>
      </div>

      {/* Quick Launchpad Shortcuts */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div
          onClick={() => setActiveTabId("collections")}
          className={`p-3.5 rounded-lg border ${borderCol} ${bgAccent} hover:border-indigo-500/50 transition cursor-pointer flex flex-col gap-1.5`}
        >
          <UploadCloud className="h-4.5 w-4.5 text-indigo-400" />
          <h4 className={`font-bold text-xs ${textTitle}`}>1. Setup Collections</h4>
          <p className="text-[10px] text-neutral-500 leading-normal">Import mock endpoints as JSON, configure environment Base URL tokens, and sync attributes.</p>
        </div>
        <div
          onClick={() => setActiveTabId("pytest_consolidated")}
          className={`p-3.5 rounded-lg border ${borderCol} ${bgAccent} hover:border-indigo-500/50 transition cursor-pointer flex flex-col gap-1.5`}
        >
          <Code className="h-4.5 w-4.5 text-indigo-400 animate-pulse" />
          <h4 className={`font-bold text-xs ${textTitle}`}>2. Compile Pytest</h4>
          <p className="text-[10px] text-neutral-500 leading-normal">Instantly map dynamic JS assertions to pure, testable, fully verified Python methods.</p>
        </div>
        <div
          onClick={() => setActiveTabId("runner")}
          className={`p-3.5 rounded-lg border ${borderCol} ${bgAccent} hover:border-emerald-500/50 transition cursor-pointer flex flex-col gap-1.5`}
        >
          <Play className="h-4.5 w-4.5 text-emerald-400" />
          <h4 className={`font-bold text-xs ${textTitle}`}>3. Execute Trials</h4>
          <p className="text-[10px] text-neutral-500 leading-normal">Simulate test environments, monitor black terminals, and fetch failure logs immediately.</p>
        </div>
      </div>

      {/* Supabase projects sub-deck */}
      <div className={`p-4 rounded-xl border ${borderCol} ${bgAccent} space-y-3`}>
        <div className="flex justify-between items-center border-b border-neutral-800/10 dark:border-neutral-800/40 pb-2 mb-1">
          <div>
            <span className="text-[8px] font-mono text-indigo-500 font-bold uppercase tracking-widest">Active Workspace Database</span>
            <h3 className={`text-xs font-bold ${textTitle}`}>Team Projects Dashboard</h3>
          </div>
          {!session && (
            <span className="text-[9px] font-mono text-amber-500 uppercase bg-amber-500/10 px-2 py-0.5 rounded font-black">Authorized Only</span>
          )}
        </div>

        {session ? (
          <MyProjectsDashboard
            isDarkMode={isDarkMode}
            authToken={session?.access_token || ""}
            activeProjectId={activeCloudProjectId}
            onSelectProject={handleSelectProject}
            onProjectDeselect={() => setActiveCloudProjectId(null)}
            onCreateNewProject={(pId) => {
              setActiveCloudProjectId(pId);
              setActiveTabId("collections");
            }}
          />
        ) : (
          <div className="text-center py-6">
            <p className="text-[11px] text-neutral-500 leading-relaxed max-w-sm mx-auto">
              You are currently browsing under unauthenticated guest restrictions. Sign in with team credentials to view and select synchronized projects.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

interface CollectionsPanelProps {
  isDarkMode: boolean;
  borderCol: string;
  bgAccent: string;
  textTitle: string;
  textMuted: string;
  collectionSource: string;
  setCollectionSource: (val: any) => void;
  // File upload / Drag
  dragOver: boolean;
  handleDragOver: (e: any) => void;
  handleDragLeave: () => void;
  handleDrop: (e: any) => void;
  handleFileChange: (e: any) => void;
  fileInputRef: any;
  // Postman key actions
  postmanApiKey: string;
  setPostmanApiKey: (val: string) => void;
  isPostmanKeyLoading: boolean;
  handleConnectPostman: () => void;
  workspaces: any[];
  selectedWorkspace: string;
  handleWorkspaceChange: (val: string) => void;
  collections: any[];
  searchQuery: string;
  setSearchQuery: (val: string) => void;
  isCollectionsLoading: boolean;
  selectedCollectionUid: string;
  handleSelectPostmanCollection: (val: string) => void;
  // Sample collections
  sampleCollections: any[];
  handleSelectSample: (val: any) => void;
  // Tree request selection
  collectionItems: any[];
  selectedRequestIndex: number;
  setSelectedRequestIndex: (val: number) => void;
  reqActiveTab: "headers" | "body" | "chai";
  setReqActiveTab: (val: "headers" | "body" | "chai") => void;
  HighlightJsExpression: React.ComponentType<{ code: string }>;
  // Convert
  handleMigrate: () => void;
  isMigrating: boolean;
}

export function CollectionsPanel({
  isDarkMode,
  borderCol,
  bgAccent,
  textTitle,
  textMuted,
  collectionSource,
  setCollectionSource,
  dragOver,
  handleDragOver,
  handleDragLeave,
  handleDrop,
  handleFileChange,
  fileInputRef,
  postmanApiKey,
  setPostmanApiKey,
  isPostmanKeyLoading,
  handleConnectPostman,
  workspaces,
  selectedWorkspace,
  handleWorkspaceChange,
  collections,
  searchQuery,
  setSearchQuery,
  isCollectionsLoading,
  selectedCollectionUid,
  handleSelectPostmanCollection,
  sampleCollections,
  handleSelectSample,
  collectionItems,
  selectedRequestIndex,
  setSelectedRequestIndex,
  reqActiveTab,
  setReqActiveTab,
  HighlightJsExpression,
  handleMigrate,
  isMigrating
}: CollectionsPanelProps) {
  const selectedRequest = collectionItems[selectedRequestIndex];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 animate-fadeIn pb-10 items-start">
      {/* Sidebar configuration (5 cols) */}
      <div className="lg:col-span-5 flex flex-col gap-4">
        {/* Source Tab Toggle Buttons */}
        <div className={`p-1 ${isDarkMode ? "bg-neutral-900 border-neutral-800" : "bg-neutral-100 border-neutral-200"} rounded-lg border font-mono flex`}>
          {["upload", "postman", "sample"].map((src) => (
            <button
              key={src}
              type="button"
              onClick={() => setCollectionSource(src)}
              className={`flex-1 py-1.5 text-[10px] text-center font-bold uppercase rounded-md transition-all ${
                collectionSource === src
                  ? "bg-indigo-600 text-white shadow-xs"
                  : isDarkMode ? "text-neutral-500 hover:text-neutral-300" : "text-neutral-500 hover:text-neutral-800"
              }`}
            >
              {src === "upload" ? "JSON Upload" : src === "postman" ? "Postman Cloud" : "Samples"}
            </button>
          ))}
        </div>

        {/* Source Inputs */}
        <div className={`p-4 rounded-xl border ${borderCol} ${bgAccent}`}>
          {collectionSource === "upload" && (
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition ${dragOver ? "border-indigo-500 bg-indigo-500/5" : isDarkMode ? "border-neutral-800/80 hover:border-neutral-700 hover:bg-neutral-900/5 bg-[#090a0c]/40" : "border-neutral-300 hover:border-neutral-400 hover:bg-neutral-100/50 bg-neutral-50"}`}
            >
              <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept=".json" />
              <UploadCloud className="h-7 w-7 text-indigo-500 mx-auto animate-bounce mb-2" />
              <div className={`font-mono text-[10px] font-bold uppercase tracking-wider ${isDarkMode ? "text-neutral-300" : "text-neutral-700"}`}>Drag & Drop Suite .JSON</div>
              <p className={`text-[9px] mt-1 ${isDarkMode ? "text-neutral-500" : "text-neutral-600 font-medium"}`}>supports Postman v2 or v2.1 collection standards</p>
            </div>
          )}

          {collectionSource === "postman" && (
            <div className="space-y-3 font-mono">
              <div className="flex flex-col gap-1">
                <label className="text-[9px] text-neutral-500 font-bold uppercase tracking-wider">Postman API Key *</label>
                <div className="flex gap-1.5">
                  <input
                    type="password"
                    value={postmanApiKey}
                    onChange={(e) => setPostmanApiKey(e.target.value)}
                    placeholder="PMAK-xxx..."
                    className={`flex-1 py-1.5 px-2.5 rounded text-[11px] placeholder:text-neutral-500 border ${isDarkMode ? "bg-black/40 border-neutral-800 text-neutral-200" : "bg-white border-neutral-300 text-neutral-850"}`}
                  />
                  <button
                    onClick={handleConnectPostman}
                    disabled={isPostmanKeyLoading}
                    className="px-3 bg-indigo-600 font-bold hover:bg-indigo-700 text-white rounded text-[10px] uppercase transition cursor-pointer"
                  >
                    Connect
                  </button>
                </div>
              </div>

              {workspaces.length > 0 && (
                <div className="grid grid-cols-2 gap-2 text-[10px]">
                  <div className="flex flex-col gap-1">
                    <label className="text-[8px] text-neutral-500">Workspace</label>
                    <select
                      value={selectedWorkspace}
                      onChange={(e) => handleWorkspaceChange(e.target.value)}
                      className={`w-full p-1.5 rounded border text-[10px] ${isDarkMode ? "bg-neutral-950 border-neutral-800 text-neutral-300" : "bg-white border-neutral-300 text-neutral-800"}`}
                    >
                      {workspaces.map((w) => (
                        <option key={w.id} value={w.id}>{w.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[8px] text-neutral-500">Collection</label>
                    <select
                      value={selectedCollectionUid}
                      onChange={(e) => handleSelectPostmanCollection(e.target.value)}
                      className={`w-full p-1.5 rounded border text-[10px] ${isDarkMode ? "bg-neutral-950 border-neutral-800 text-neutral-300" : "bg-white border-neutral-300 text-neutral-800"}`}
                    >
                      <option value="">-- Choose --</option>
                      {collections.map((c) => (
                        <option key={c.uid} value={c.uid}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
              )}
            </div>
          )}

          {collectionSource === "sample" && (
            <div className="space-y-2 font-mono">
              <span className="text-[9px] text-neutral-500 block uppercase font-bold tracking-wider mb-1">Predefined Sandbox Schemata</span>
              <div className="flex flex-col gap-1.5">
                {sampleCollections.map((sample, i) => (
                  <button
                    key={i}
                    onClick={() => handleSelectSample(sample)}
                    className={`w-full text-left p-2 rounded-lg border transition flex items-center justify-between text-[11.5px] cursor-pointer ${isDarkMode ? "border-neutral-800 bg-neutral-950/40 hover:bg-neutral-900 text-neutral-200" : "border-neutral-200 bg-white hover:bg-neutral-50 text-neutral-800"}`}
                  >
                    <div className="flex items-center gap-1.5">
                      <Database className="h-3.5 w-3.5 text-indigo-500 text-indigo-400" />
                      <span className="font-sans font-bold">{sample.name}</span>
                    </div>
                    <span className={`text-[9px] px-1.5 py-0.5 rounded font-mono ${isDarkMode ? "bg-neutral-800 text-neutral-400" : "bg-neutral-100 text-neutral-600 font-bold"}`}>{sample.items?.length || 0} calls</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Dynamic Client Explorer request nodes lists */}
        <div className={`p-4 rounded-xl border ${borderCol} ${bgAccent} flex flex-col gap-2`}>
          <div className="flex justify-between items-center pb-2 border-b border-neutral-800/10 dark:border-neutral-800/40">
            <span className="text-[9px] font-mono font-bold text-neutral-500 uppercase tracking-widest">Collection Nodes Directory</span>
            <span className={`text-[10px] font-mono ${isDarkMode ? "text-neutral-400" : "text-neutral-700 font-bold"}`}>{collectionItems.length} active requests</span>
          </div>

          <div className="divide-y divide-neutral-800/40 max-h-72 overflow-y-auto pr-1">
            {collectionItems.length === 0 ? (
              <div className="text-center py-8 text-neutral-500 font-mono text-[10px] italic">// Import collections load indicators...</div>
            ) : (
              collectionItems.map((item, idx) => {
                const isActive = selectedRequestIndex === idx;
                const method = item.request?.method || "GET";
                const isGet = method === "GET";
                const isPost = method === "POST";
                return (
                  <div
                    key={idx}
                    onClick={() => setSelectedRequestIndex(idx)}
                    className={`py-2 px-2.5 flex items-center justify-between gap-1 transition cursor-pointer text-[12px] ${isActive ? "bg-indigo-500/10 hover:bg-indigo-500/15 border-l-2 border-l-indigo-500" : "hover:bg-neutral-500/5"}`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <span className={`text-[9px] font-mono font-bold w-10 text-center rounded px-1 py-0.5 shrink-0 ${
                        isGet 
                          ? (isDarkMode ? "text-emerald-400 bg-emerald-500/10 border border-emerald-500/20" : "text-emerald-700 bg-emerald-50 border border-emerald-200") 
                          : isPost 
                            ? (isDarkMode ? "text-blue-400 bg-blue-500/10 border border-blue-500/20" : "text-blue-700 bg-blue-50 border border-blue-200") 
                            : (isDarkMode ? "text-amber-400 bg-amber-500/10 border border-amber-500/10" : "text-amber-700 bg-amber-50 border border-amber-200")
                      }`}>
                        {method}
                      </span>
                      <span className={`truncate font-sans font-medium ${isDarkMode ? "text-neutral-300" : "text-neutral-800"}`}>{item.name || "API Endpoint"}</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Compile Translate Core Command Button */}
        <button
          onClick={handleMigrate}
          disabled={isMigrating || collectionItems.length === 0}
          className="w-full bg-indigo-600 hover:bg-indigo-700 py-2 rounded-xl text-[11.5px] font-mono font-bold uppercase text-white shadow transition cursor-pointer flex items-center justify-center gap-2"
        >
          {isMigrating ? (
            <>
              <RefreshCw className="h-4 w-4 animate-spin text-white" />
              <span>Transpiling assertions trace...</span>
            </>
          ) : (
            <>
              <Code className="h-4 w-4" />
              <span>Compile collection to pytest</span>
            </>
          )}
        </button>
      </div>

      {/* Details inspector (7 cols) */}
      <div className="lg:col-span-7 flex flex-col gap-4">
        {selectedRequest ? (
          <div className={`p-4 md:p-5 rounded-xl border ${borderCol} ${bgAccent} flex flex-col gap-3.5 shadow-sm`}>
            {/* Req Header */}
            <div>
              <span className="text-[10px] font-mono text-neutral-500 uppercase font-bold tracking-wider">ENDPOINT SPECIFICATION</span>
              <h3 className={`text-sm font-bold font-display ${textTitle} mt-0.5 flex items-center gap-2`}>
                <span className="font-mono text-emerald-400 uppercase">[{selectedRequest.request?.method || "GET"}]</span>
                <span>{selectedRequest.name || "API Request"}</span>
              </h3>
              <p className={`text-[11px] font-mono select-all tracking-tight mt-1.5 p-1.5 rounded truncate border ${isDarkMode ? "bg-black/40 border-neutral-800 text-neutral-400" : "bg-neutral-100 border-neutral-200 text-neutral-700 font-medium"}`}>
                {selectedRequest.request?.url || "https://api.example.com"}
              </p>
            </div>

            {/* Inspections sub tabs togglers */}
            <div className={`flex border-b text-[10.5px] font-mono gap-4 ${isDarkMode ? "border-neutral-800" : "border-neutral-200"}`}>
              {["chai", "headers", "body"].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setReqActiveTab(tab as any)}
                  className={`py-1.5 border-b-2 transition uppercase font-bold cursor-pointer ${reqActiveTab === tab ? (isDarkMode ? "border-indigo-500 text-indigo-400 font-extrabold" : "border-indigo-650 text-indigo-700 font-extrabold") : (isDarkMode ? "border-transparent text-neutral-500 hover:text-neutral-300" : "border-transparent text-neutral-550 hover:text-neutral-800")}`}
                >
                  {tab === "chai" ? "JS Assertion scripts" : tab === "headers" ? "Request headers" : "Request payload body"}
                </button>
              ))}
            </div>

            {/* Inspections contents */}
            <div className="min-h-48 pt-1 leading-normal select-text">
              {reqActiveTab === "chai" && (
                <div className="space-y-3 font-mono">
                  <div className={`p-3 rounded-lg border max-h-56 overflow-y-auto text-[11px] ${isDarkMode ? "bg-neutral-950/80 border-neutral-800 text-neutral-300" : "bg-neutral-50 border-neutral-200 text-neutral-850"}`}>
                    {selectedRequest.event?.[0]?.script?.exec && selectedRequest.event[0].script.exec.length > 0 ? (
                      <HighlightJsExpression code={selectedRequest.event[0].script.exec.join("\n")} />
                    ) : (
                      <span className="text-neutral-600 italic">// No assertion code scripts saved in source files.</span>
                    )}
                  </div>
                </div>
              )}

              {reqActiveTab === "headers" && (
                <div className="space-y-2">
                  {selectedRequest.request?.headers && selectedRequest.request.headers.length > 0 ? (
                    <table className="w-full text-left font-mono text-[10.5px]">
                      <thead>
                        <tr className={`border-b text-neutral-550 font-bold uppercase ${isDarkMode ? "border-neutral-800" : "border-neutral-200"}`}>
                          <th className="pb-1">Header Matrix Key</th>
                          <th className="pb-1">Mapped Variable Value</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedRequest.request.headers.map((h: any, idx: number) => (
                          <tr key={idx} className={`border-b last:border-b-0 ${isDarkMode ? "border-neutral-900" : "border-neutral-100"}`}>
                            <td className={`py-1.5 select-all ${isDarkMode ? "text-neutral-300" : "text-neutral-800 font-semibold"}`}>{h.key}</td>
                            <td className={`py-1.5 truncate max-w-[200px] ${isDarkMode ? "text-neutral-500" : "text-neutral-600"}`} title={h.value}>{h.value}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <div className="text-neutral-500 italic font-mono text-[10px]">// Empty headers payload defined.</div>
                  )}
                </div>
              )}

              {reqActiveTab === "body" && (
                <div className="font-mono text-[11px]">
                  {selectedRequest.request?.body ? (
                    <pre className={`p-3 rounded-lg border max-h-56 overflow-y-auto text-xs whitespace-pre select-all ${isDarkMode ? "bg-neutral-950/80 border-neutral-805 text-neutral-300" : "bg-neutral-50 border-neutral-200 text-neutral-800"}`}>
                      <code>{selectedRequest.request.body}</code>
                    </pre>
                  ) : (
                    <div className="text-neutral-500 italic text-[10px]">// Empty raw payload input body matrix.</div>
                  )}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="text-center py-24 text-neutral-500 font-mono italic text-[10px]">
            // Select collection endpoint on left list tab to inspect source details...
          </div>
        )}
      </div>
    </div>
  );
}

interface PytestConsolidatedPanelProps {
  isDarkMode: boolean;
  borderCol: string;
  bgAccent: string;
  textTitle: string;
  pytestCode: string;
  migrations: any[];
  copyToClipboard: (txt: string, key: string) => void;
  copiedStates: Record<string, boolean>;
  handleDownloadSingle: () => void;
  bgCard: string;
}

export function PytestConsolidatedPanel({
  isDarkMode,
  borderCol,
  bgAccent,
  textTitle,
  pytestCode,
  migrations,
  copyToClipboard,
  copiedStates,
  handleDownloadSingle,
  bgCard
}: PytestConsolidatedPanelProps) {
  return (
    <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 animate-fadeIn pb-10 items-start">
      {/* Code Editor simulation (col-span-7) */}
      <div className="xl:col-span-7 flex flex-col gap-3">
        <div className={`p-4 rounded-xl border ${borderCol} ${bgAccent}`}>
          <div className="flex justify-between items-center pb-2.5 border-b border-neutral-800/10 dark:border-neutral-800/40 mb-3.5">
            <div>
              <span className="text-[9px] font-mono text-[#6366f1] uppercase font-black">Compiled Code Node</span>
              <h4 className={`text-xs font-bold ${textTitle} leading-none mt-0.5`}>test_all_apis.py</h4>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => copyToClipboard(pytestCode, "consolidatedCopy")}
                className="px-2.5 py-1 rounded bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 font-mono text-[9px] font-bold border border-indigo-500/20"
              >
                {copiedStates["consolidatedCopy"] ? "Copied" : "Copy Suite"}
              </button>
              <button
                onClick={handleDownloadSingle}
                className={`px-2.5 py-1 rounded font-mono text-[9px] font-bold border transition ${isDarkMode ? "bg-neutral-800 hover:bg-neutral-700 text-neutral-300 border-neutral-700" : "bg-neutral-100 hover:bg-neutral-200 text-neutral-800 border-neutral-300"}`}
              >
                <Download className="h-3 w-3 inline mr-1" />
                Download
              </button>
            </div>
          </div>

          <pre className="p-4 bg-[#0a0a0c] border border-neutral-850 rounded-lg text-[10.5px]/relaxed leading-relaxed overflow-auto max-h-[460px] text-neutral-300 font-mono whitespace-pre select-all">
            <code>{pytestCode || "# Transpile an API collection from Pane 1 to read compiled Python scripts."}</code>
          </pre>
        </div>
      </div>

      {/* Assertion trace check table (col-span-5) */}
      <div className="xl:col-span-5 flex flex-col gap-3">
        <div className={`p-4 rounded-xl border ${borderCol} ${bgAccent} flex flex-col gap-3`}>
          <div>
            <span className="text-[9px] font-mono text-indigo-400 uppercase font-bold block">AST Translate Matrices</span>
            <h4 className={`text-xs font-bold ${textTitle}`}>Assertions Trace Mapping Traceability</h4>
          </div>

          <div className="divide-y divide-neutral-800/40 max-h-[480px] overflow-y-auto pr-1">
            {migrations.length === 0 ? (
              <div className="text-center py-12 text-neutral-500 font-mono text-[10px] italic">
                // Compile collection on previous Collections tab to inspect assertion maps...
              </div>
            ) : (
              migrations.map((mig, idx) => (
                <div key={idx} className="py-3 first:pt-0 space-y-2">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[8px] font-mono font-bold bg-[#beebd8]/10 text-emerald-500 border border-emerald-500/20 px-1 rounded uppercase tracking-wider">MAPPED</span>
                    <strong className={`text-[11px] font-sans font-extrabold ${isDarkMode ? "text-neutral-300" : "text-neutral-800"}`}>{mig.requestName}</strong>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-[10px] font-mono leading-relaxed">
                    <div className={`p-2 rounded border ${isDarkMode ? "bg-neutral-950/60 border-neutral-900 text-rose-450/80 text-rose-400" : "bg-rose-50/50 border-rose-100 text-rose-800"}`}>
                      <span className={`text-[8px] block uppercase font-bold mb-1 ${isDarkMode ? "text-neutral-550 text-neutral-500" : "text-neutral-500"}`}>Legacy Chai assertions JS:</span>
                      <ul className="list-disc pl-3 text-[9px] space-y-0.5">
                        {mig.originalAssertions?.map((as: string, i: number) => <li key={i} className="truncate">{as}</li>) || <li className="italic">No asserts</li>}
                      </ul>
                    </div>

                    <div className={`p-2 rounded border ${isDarkMode ? "bg-indigo-500/5 border-indigo-505/10 text-indigo-400/85" : "bg-indigo-100/50 border-indigo-200 text-indigo-800 font-medium"}`}>
                      <span className={`text-[8px] block uppercase font-bold mb-1 ${isDarkMode ? "text-neutral-500" : "text-neutral-500"}`}>Migrated Python pytest assertions:</span>
                      <ul className="list-disc pl-3 text-[9px] space-y-0.5">
                        {mig.migratedAssertions?.map((as: string, i: number) => <li key={i} className="truncate">{as}</li>) || <li className="italic">No asserts</li>}
                      </ul>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

interface PytestModularPanelProps {
  borderCol: string;
  bgAccent: string;
  textTitle: string;
  modularFiles: any[];
  selectedFileIndex: number;
  setSelectedFileIndex: (val: number) => void;
  copyToClipboard: (txt: string, key: string) => void;
  copiedStates: Record<string, boolean>;
  handleDownloadZip: () => void;
  isDarkMode: boolean;
}

export function PytestModularPanel({
  borderCol,
  bgAccent,
  textTitle,
  modularFiles,
  selectedFileIndex,
  setSelectedFileIndex,
  copyToClipboard,
  copiedStates,
  handleDownloadZip,
  isDarkMode
}: PytestModularPanelProps) {
  const currentFile = modularFiles[selectedFileIndex];

  return (
    <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 animate-fadeIn pb-10 items-start">
      {/* Directory structure selector modules (col-span-4) */}
      <div className="xl:col-span-4 flex flex-col gap-3">
        <div className={`p-4 rounded-xl border ${borderCol} ${bgAccent} flex flex-col gap-3`}>
          <div className="flex justify-between items-center pb-2 border-b border-neutral-800/10 dark:border-neutral-800/40">
            <div>
              <span className="text-[9px] font-mono text-[#6366f1] uppercase font-bold block">Directory Modules</span>
              <h4 className={`text-xs font-bold ${textTitle}`}>Generated Pytest File Hierarchy</h4>
            </div>
          </div>

          <div className="space-y-1">
            {/* conftest block */}
            <div className={`p-2 rounded border text-[11px] font-mono flex items-center justify-between ${isDarkMode ? "bg-neutral-900/30 border-neutral-800 text-neutral-400" : "bg-neutral-100 border-neutral-200 text-neutral-700"}`}>
              <span className="flex items-center gap-1.5 font-bold">
                <Settings className={`h-3.5 w-3.5 ${isDarkMode ? "text-indigo-400" : "text-indigo-600"}`} />
                conftest.py (system test rig fixture config)
              </span>
              <span className={`text-[9px] px-1.5 rounded font-bold ${isDarkMode ? "bg-neutral-800 text-neutral-400" : "bg-neutral-200 text-neutral-600"}`}>AUTO</span>
            </div>

            {/* dynamic files */}
            <div className="flex flex-col gap-1 max-h-80 overflow-y-auto pt-2">
              {modularFiles.length === 0 ? (
                <div className="text-center py-10 text-neutral-500 font-mono text-[10px] italic">No modular outputs compiled...</div>
              ) : (
                modularFiles.map((f, idx) => {
                  const isActive = selectedFileIndex === idx;
                  return (
                    <button
                      key={idx}
                      onClick={() => setSelectedFileIndex(idx)}
                      className={`w-full text-left p-2 rounded-lg border text-[11.5px] font-mono transition flex items-center justify-between cursor-pointer ${isActive ? "bg-indigo-505/10 bg-indigo-500/15 border-indigo-500 text-indigo-400 font-extrabold" : "bg-neutral-950/40 border-neutral-800 hover:bg-neutral-900 text-neutral-300"}`}
                    >
                      <span className="flex items-center gap-1.5">
                        <Layers className="h-3.5 w-3.5" />
                        {f.filename}
                      </span>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          <button
            onClick={handleDownloadZip}
            disabled={modularFiles.length === 0}
            className="w-full bg-indigo-600/10 hover:bg-indigo-600/25 border border-indigo-500/20 hover:border-indigo-500/50 text-indigo-500 py-1.5 rounded-xl text-[10px] font-mono font-bold uppercase transition cursor-pointer flex items-center justify-center gap-1.5"
          >
            <Download className="h-4 w-4" />
            Download Modular suite (.ZIP)
          </button>
        </div>
      </div>

      {/* Split Code edit simulation visual panels */}
      <div className="xl:col-span-8 flex flex-col gap-3">
        {currentFile ? (
          <div className={`p-4 rounded-xl border ${borderCol} ${bgAccent}`}>
            <div className="flex justify-between items-center pb-2 border-b border-neutral-800/10 dark:border-neutral-800/40 mb-3 text-[11px]">
              <span className={`font-mono font-bold select-all leading-relaxed uppercase ${isDarkMode ? "text-neutral-300" : "text-neutral-800"}`}>{currentFile.filename}</span>
              <button
                onClick={() => copyToClipboard(currentFile.content, `modCopy_${selectedFileIndex}`)}
                className="px-2 py-0.5 rounded bg-indigo-500/10 hover:bg-indigo-500/25 text-indigo-400 font-mono text-[9px] font-bold tracking-tight border border-indigo-500/20 cursor-pointer"
              >
                {copiedStates[`modCopy_${selectedFileIndex}`] ? "Copied" : "Copy module"}
              </button>
            </div>

            <pre className="p-4 bg-[#090a0c]/80 border border-neutral-850 rounded-lg text-[10.5px]/relaxed leading-relaxed overflow-x-auto max-h-[380px] text-neutral-300 font-mono whitespace-pre select-all">
              <code>{currentFile.content}</code>
            </pre>
          </div>
        ) : (
          <div className="text-center py-24 text-neutral-500 font-mono italic text-[10.5px]">// Compile dynamic modular suites to inspect records...</div>
        )}
      </div>
    </div>
  );
}

interface VMRunnerPanelProps {
  borderCol: string;
  bgAccent: string;
  textTitle: string;
  simulationMode: "success" | "offline" | "drift_auth" | "drift_schema";
  setSimulationMode: (val: any) => void;
  handleExecuteTests: () => void;
  isExecuting: boolean;
  execResult: any;
  copiedStates: Record<string, boolean>;
  copyToClipboard: (txt: string, key: string) => void;
  isDarkMode: boolean;
}

export function VMRunnerPanel({
  borderCol,
  bgAccent,
  textTitle,
  simulationMode,
  setSimulationMode,
  handleExecuteTests,
  isExecuting,
  execResult,
  copiedStates,
  copyToClipboard,
  isDarkMode
}: VMRunnerPanelProps) {
  return (
    <div className="flex flex-col gap-5 animate-fadeIn pb-10">
      {/* Simulated parameters selector widgets */}
      <div className={`p-4 rounded-xl border ${borderCol} ${bgAccent} flex flex-col md:flex-row justify-between items-start md:items-center gap-4`}>
        <div className="space-y-1">
          <span className="text-[9px] font-mono text-indigo-400 uppercase font-black block">Live Virtual Rig settings</span>
          <h4 className={`text-xs font-bold ${textTitle}`}>Simulated Environment VM Conditions</h4>
          <p className="text-[10px] text-neutral-500 md:max-w-md">Toggle environment drift models or database constraints on mock simulation checks instances.</p>
        </div>

        <div className="flex flex-wrap items-center gap-2 font-mono text-[10.5px]">
          <select
            value={simulationMode}
            onChange={(e) => setSimulationMode(e.target.value as any)}
            className={`p-1.5 rounded-lg shrink-0 border ${isDarkMode ? "bg-neutral-950 border-neutral-800 text-neutral-300" : "bg-white border-neutral-305 text-neutral-800"}`}
          >
            <option value="success">Staging (Full 100% Success handshake)</option>
            <option value="drift_auth">Drift model: Session Token expired (401)</option>
            <option value="drift_schema">Drift model: JSON schema key altered (422)</option>
            <option value="offline">VM Status: Network interface offline</option>
          </select>

          <button
            onClick={handleExecuteTests}
            disabled={isExecuting}
            className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg uppercase transition-all shadow cursor-pointer text-[10px] shrink-0"
          >
            {isExecuting ? "Executing trials..." : "Run Simulated Suite"}
          </button>
        </div>
      </div>

      {/* Execution logs outputs indicators */}
      {execResult && (
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className={`p-3 text-center border ${borderCol} rounded-lg ${bgAccent}`}>
              <span className={`text-[9px] font-mono uppercase tracking-widest block ${isDarkMode ? "text-neutral-400" : "text-neutral-600 font-bold"}`}>Tests run</span>
              <p className={`text-xl font-display font-semibold ${textTitle} mt-0.5`}>{execResult.total}</p>
            </div>
            <div className={`p-3 text-center border ${borderCol} rounded-lg ${bgAccent}`}>
              <span className="text-[9px] font-mono text-emerald-500 uppercase tracking-widest block font-bold">Passed checks</span>
              <p className="text-xl font-display font-semibold text-emerald-500 mt-0.5">{execResult.passed}</p>
            </div>
            <div className={`p-3 text-center border ${borderCol} rounded-lg ${bgAccent}`}>
              <span className="text-[9px] font-mono text-rose-500 uppercase tracking-widest block font-bold">Failed fault metrics</span>
              <p className={`text-xl font-display font-semibold mt-0.5 ${execResult.failed > 0 ? "text-rose-500 animate-pulse" : textTitle}`}>{execResult.failed}</p>
            </div>
            <div className={`p-3 text-center border ${borderCol} rounded-lg ${bgAccent}`}>
              <span className={`text-[9px] font-mono uppercase tracking-widest block ${isDarkMode ? "text-neutral-400" : "text-neutral-600 font-bold"}`}>Duration speed</span>
              <p className={`text-xl font-display font-semibold ${textTitle} mt-0.5`}>{Number(execResult.execution_time).toFixed(2)}s</p>
            </div>
          </div>

          {/* Black console block */}
          <div className="p-4 bg-neutral-950 border border-neutral-900 rounded-xl flex flex-col max-h-72 overflow-hidden leading-snug">
            <div className="flex justify-between items-center text-[10px] text-neutral-500 border-b border-neutral-900 pb-2 mb-2">
              <span className="flex items-center gap-1 font-bold uppercase tracking-wider text-neutral-300">
                <Terminal className="h-3.5 w-3.5 text-emerald-500" />
                VM Pytest trace standard output
              </span>
              <button
                onClick={() => copyToClipboard(execResult.output_log, "vmlogcopy")}
                className="text-[9px] hover:text-white px-2 bg-neutral-900 border border-neutral-800 rounded py-0.5 font-bold cursor-pointer"
              >
                {copiedStates["vmlogcopy"] ? "Copied" : "Copy Trace"}
              </button>
            </div>

            <pre className="font-mono text-[10px] text-[#c9d1d9] leading-relaxed overflow-x-auto max-h-48 select-all p-2 bg-black rounded border border-neutral-950 whitespace-pre">
              <code>{execResult.output_log}</code>
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}

interface McpHubPanelProps {
  borderCol: string;
  bgAccent: string;
  textTitle: string;
  mcpTools: any[];
  fetchMcpTools: () => void;
  fetchMcpLogs: () => void;
  mcpSelectedTool: string;
  setMcpSelectedTool: (val: string) => void;
  mcpToolArgs: string;
  setMcpToolArgs: (val: string) => void;
  mcpIsCallingTool: boolean;
  handleInvokeMcpToolRaw: () => void;
  mcpRawResponse: string;
}

export function McpHubPanel({
  borderCol,
  bgAccent,
  textTitle,
  mcpTools,
  fetchMcpTools,
  fetchMcpLogs,
  mcpSelectedTool,
  setMcpSelectedTool,
  mcpToolArgs,
  setMcpToolArgs,
  mcpIsCallingTool,
  handleInvokeMcpToolRaw,
  mcpRawResponse
}: McpHubPanelProps) {
  return (
    <div className="flex flex-col gap-5 animate-fadeIn pb-10">
      {/* Protocol Health Row */}
      <div className={`p-4 rounded-xl border ${borderCol} ${bgAccent} flex flex-col md:flex-row justify-between items-start md:items-center gap-4`}>
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <h3 className={`text-xs font-bold font-mono tracking-wider text-neutral-300 uppercase`}>JSON-RPC MCP Ingress node</h3>
            <span className="px-1.5 py-0.2 rounded-full text-[8px] font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 tracking-wider">● RUNNING</span>
          </div>
          <p className="text-[10px] text-neutral-500 select-all font-mono">Gateway Influx Endpoint: http://localhost:3000/api/mcp</p>
        </div>

        <div className="flex items-center gap-2 font-mono text-[10px]/relaxed uppercase">
          <button
            onClick={() => { fetchMcpTools(); fetchMcpLogs(); }}
            className="py-1 px-2.5 rounded border border-neutral-800 bg-neutral-950 hover:bg-neutral-900 transition flex items-center gap-1 text-[9.5px]/relaxed font-bold cursor-pointer"
          >
            <RefreshCw className="h-3 w-3 text-indigo-400" />
            Sync Registry
          </button>
          <a
            href="/api/mcp/tools"
            target="_blank"
            className="py-1 px-2.5 rounded border border-neutral-800 bg-neutral-950 hover:bg-neutral-900 transition flex items-center gap-1 text-[9.5px]/relaxed font-bold"
          >
            <ExternalLink className="h-3 w-3" />
            JSON Schema
          </a>
        </div>
      </div>

      {/* Main split dashboard (col span-7 tools catalog, col span-5 sandbox testing) */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 items-start">
        
        {/* Tools catalog (7 cols) */}
        <div className="xl:col-span-7 flex flex-col gap-3">
          <div className={`p-4 rounded-xl border ${borderCol} ${bgAccent} space-y-3`}>
            <div>
              <span className="text-[8px] font-mono text-indigo-400 font-bold uppercase tracking-wider block">Local Registry Schema</span>
              <h4 className={`text-xs font-bold ${textTitle}`}>Available Workspace Tools</h4>
            </div>

            <div className="flex flex-col gap-2">
              {mcpTools.length === 0 ? (
                <div className="text-center py-6 text-[10px] text-neutral-500 font-mono italic">No metadata tools registered.</div>
              ) : (
                mcpTools.map((tool) => (
                  <div
                    key={tool.name}
                    onClick={() => setMcpSelectedTool(tool.name)}
                    className={`p-3 rounded-lg border text-left cursor-pointer transition flex flex-col gap-1.5 ${mcpSelectedTool === tool.name ? "bg-indigo-505/10 bg-indigo-500/10 border-indigo-500" : "bg-neutral-950 border-neutral-850 hover:bg-neutral-900"}`}
                  >
                    <div className="flex items-center gap-2 font-mono text-[10px] justify-between">
                      <strong className={`font-extrabold ${mcpSelectedTool === tool.name ? "text-indigo-400" : "text-neutral-300"}`}>{tool.name}</strong>
                      <span className="text-[8px] px-1 bg-neutral-800 rounded text-neutral-400 uppercase tracking-widest">{tool.status || "active"}</span>
                    </div>
                    <p className="text-[10px] font-sans leading-normal text-neutral-500 truncate">{tool.description}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* RPC Sandbox inputs / outputs console (5 cols) */}
        <div className="xl:col-span-5 flex flex-col gap-3 font-mono text-[11px]">
          {mcpSelectedTool && (
            <div className={`p-4 rounded-xl border ${borderCol} ${bgAccent} flex flex-col gap-3.5`}>
              <div className="border-b border-neutral-900 pb-2">
                <span className="text-[8px] text-neutral-500">Method Call: tools/call</span>
                <h4 className={`text-xs font-bold ${textTitle} text-indigo-400`}>{mcpSelectedTool}</h4>
              </div>

              <div className="flex flex-col gap-1">
                <span className="text-[8px] text-neutral-500 font-bold uppercase tracking-wider">Arguments input params (JSON)</span>
                <textarea
                  value={mcpToolArgs}
                  onChange={(e) => setMcpToolArgs(e.target.value)}
                  rows={6}
                  className="w-full bg-black/40 border border-neutral-855 rounded text-[11.5px] p-2 focus:outline-none focus:border-indigo-500 font-mono"
                />
              </div>

              <button
                onClick={handleInvokeMcpToolRaw}
                disabled={mcpIsCallingTool}
                className="w-full bg-indigo-500/10 hover:bg-indigo-500/15 border border-indigo-500/20 text-indigo-400 py-1.5 rounded-lg text-[10px] font-bold uppercase transition"
              >
                {mcpIsCallingTool ? "Resolving RPC..." : "Call tools/call method"}
              </button>

              <div className="flex flex-col gap-1">
                <span className="text-[8px] text-neutral-500 font-bold uppercase tracking-wider">Server Response JSON enveloppe</span>
                <div className="h-44 overflow-y-auto bg-black border border-neutral-900 rounded p-2 text-[9.5px]/relaxed leading-snug select-all text-neutral-400">
                  {mcpRawResponse ? <pre className="whitespace-pre-wrap">{mcpRawResponse}</pre> : <span className="text-neutral-700 italic">// Call RPC method...</span>}
                </div>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}

interface SettingsPanelProps {
  borderCol: string;
  bgAccent: string;
  textTitle: string;
  customApiKey: string;
  setCustomApiKey: (val: string) => void;
  library: "requests" | "httpx" | "async_httpx";
  setLibrary: (val: any) => void;
  baseUrlEnv: string;
  setBaseUrlEnv: (val: string) => void;
  injectBaseUrlFixture: boolean;
  setInjectBaseUrlFixture: (val: boolean) => void;
  addComments: boolean;
  setAddComments: (val: boolean) => void;
  isDarkMode: boolean;
}

export function SettingsPanel({
  borderCol,
  bgAccent,
  textTitle,
  customApiKey,
  setCustomApiKey,
  library,
  setLibrary,
  baseUrlEnv,
  setBaseUrlEnv,
  injectBaseUrlFixture,
  setInjectBaseUrlFixture,
  addComments,
  setAddComments,
  isDarkMode
}: SettingsPanelProps) {
  return (
    <div className={`p-4 md:p-5 rounded-xl border ${borderCol} ${bgAccent} space-y-4 max-w-2xl animate-fadeIn pb-10`}>
      <div>
        <span className="text-[8px] font-mono text-indigo-400 font-bold block uppercase tracking-widest">Environment Overrides</span>
        <h3 className={`text-xs font-bold font-sans ${textTitle}`}>General Variables & Compilation Profiles</h3>
      </div>

      <div className="space-y-3.5 font-mono text-[11px] leading-normal font-medium">
        <div className="flex flex-col gap-1">
          <label className="text-[9px] uppercase tracking-wider text-neutral-500 font-bold">GEMINI API KEY override</label>
          <input
            type="password"
            value={customApiKey}
            onChange={(e) => setCustomApiKey(e.target.value)}
            placeholder="AI Studio workspace server falls back to environment configuration parameters..."
            className="w-full bg-black/40 border border-[#1d1e22] text-neutral-300 rounded p-2 text-[10.5px]"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1">
            <label className="text-[9px] uppercase tracking-wider text-neutral-500 font-bold">Pytest Request Client library</label>
            <select
              value={library}
              onChange={(e) => setLibrary(e.target.value as any)}
              className="w-full bg-neutral-950 border border-neutral-850 rounded p-1.5 text-[10.5px] text-neutral-300"
            >
              <option value="requests">requests (Sync simple calls)</option>
              <option value="httpx">httpx (Sync corporate models)</option>
              <option value="async_httpx">httpx.AsyncClient (High concurrency async)</option>
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[9px] uppercase tracking-wider text-neutral-500 font-bold">Standard Base URL endpoint</label>
            <input
              type="text"
              value={baseUrlEnv}
              onChange={(e) => setBaseUrlEnv(e.target.value)}
              placeholder="https://api.company.com"
              className="w-full bg-black/40 border border-neutral-850 rounded p-2 text-[10.5px]"
            />
          </div>
        </div>

        <div className="space-y-2 pt-2 border-t border-neutral-800/10 dark:border-neutral-800 text-[11px] font-sans">
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="injectBaseUrlFixtureCheckbox"
              checked={injectBaseUrlFixture}
              onChange={(e) => setInjectBaseUrlFixture(e.target.checked)}
              className="rounded"
            />
            <label htmlFor="injectBaseUrlFixtureCheckbox" className="text-neutral-400 font-sans">Isolate target server Base URL as central pytest fixture injection model</label>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="addCommentsCheckbox"
              checked={addComments}
              onChange={(e) => setAddComments(e.target.checked)}
              className="rounded"
            />
            <label htmlFor="addCommentsCheckbox" className="text-neutral-400 font-sans">Emit corporate compliance trace headers and instruction comments inside compiler script</label>
          </div>
        </div>
      </div>
    </div>
  );
}
