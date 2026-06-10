import React, { useState, useEffect } from "react";
import { Users, FileSpreadsheet, History, BarChart3, ShieldAlert, Check, X, RefreshCw, Lock, Unlock, UserCheck, Cpu, ArrowUpRight, UserPlus, Key, Trash2 } from "lucide-react";

interface AdminPortalProps {
  session: any;
  isDarkMode: boolean;
  overrideTab?: "users" | "audit" | "login" | "mcp";
  hideStats?: boolean;
}

export default function AdminPortal({ session, isDarkMode, overrideTab, hideStats }: AdminPortalProps) {
  const [activeSubTab, setActiveSubTab] = useState<"users" | "audit" | "login" | "mcp">(overrideTab || "users");
  
  // Keep tab state synchronized with the prop if it changes
  useEffect(() => {
    if (overrideTab) {
      setActiveSubTab(overrideTab);
    }
  }, [overrideTab]);
  const [loading, setLoading] = useState<boolean>(false);
  const [errorText, setErrorText] = useState<string>("");
  const [successText, setSuccessText] = useState<string>("");
  const [dateFilter, setDateFilter] = useState<"all" | "week" | "today">("week"); // Default to 'week' (Past 7 days)

  // Date-based Filtering Helpers
  const filterByDateRange = (itemDateStr: string) => {
    if (dateFilter === "all") return true;
    const itemTime = new Date(itemDateStr).getTime();
    if (isNaN(itemTime)) return true;
    const nowTime = new Date().getTime();
    const msDiff = nowTime - itemTime;
    if (dateFilter === "today") {
      return msDiff <= 24 * 60 * 60 * 1000;
    }
    if (dateFilter === "week") {
      return msDiff <= 7 * 24 * 60 * 60 * 1000;
    }
    return true;
  };

  // Export CSV Table Helper
  const handleExportCSV = (type: "audit" | "login" | "mcp") => {
    let headers: string[] = [];
    let rows: string[][] = [];
    let filename = "";

    if (type === "audit") {
      headers = ["Timestamp", "Compliance Action", "Operator Name", "Operator Email", "Scope Target", "Details", "Status", "IP Address"];
      rows = filteredAuditLogs.map(log => {
        const timestamp = log.created_at || log.timestamp;
        const operatorName = log.users?.fullName || log.user_fullname || "Operator System";
        const operatorEmail = log.users?.email || log.user_email || "internal@company.com";
        const targetTable = log.target_table || log.resource_type || "system";
        const details = log.details || "";
        const status = log.status || "Success";
        const ip = log.ip_address || "";
        return [
          new Date(timestamp).toISOString(),
          log.action || "API_CALL",
          operatorName,
          operatorEmail,
          targetTable,
          details,
          status,
          ip
        ];
      });
      filename = `security_audit_logs_export.csv`;
    } else if (type === "login") {
      headers = ["Attempt Timestamp", "Authentication Entity (Email)", "Terminal Node IP", "Device Agent", "Outcome Status", "Trace Details"];
      rows = filteredLoginHistory.map(lh => {
        const email = lh.user_email || lh.email || lh.users?.email || "guest@company.com";
        const device = lh.user_agent || lh.device_information || "Corporate Workgroup Client";
        const status = lh.status || lh.login_status || "Success";
        const details = lh.details || "Corporate Security Handshake Complete";
        return [
          new Date(lh.login_time).toISOString(),
          email,
          lh.ip_address || "0.0.0.0",
          device,
          status,
          details
        ];
      });
      filename = `ldap_login_history_export.csv`;
    } else if (type === "mcp") {
      headers = ["Timestamp", "MCP Tool Name", "Invoker Employee", "Invoker Email", "Status", "Elapsed Weight (Seconds)", "Arguments", "Response Summary"];
      rows = filteredMcpLogs.map(ml => {
        const timestamp = ml.created_at || ml.timestamp;
        const fullname = ml.users?.fullName || ml.user_fullname || "System Administrator";
        const email = ml.users?.email || ml.user_email || "mcp_runner@company.com";
        const status = ml.status || ml.execution_status || "Success";
        const elapsed = String(ml.elapsed_seconds ?? ml.execution_time ?? 0.5);
        const args = typeof ml.arguments === "object" ? JSON.stringify(ml.arguments) : String(ml.arguments || "");
        const response = typeof ml.response === "object" ? JSON.stringify(ml.response) : String(ml.response || "");
        return [
          new Date(timestamp).toISOString(),
          ml.tool_name || "",
          fullname,
          email,
          status,
          elapsed,
          args,
          response
        ];
      });
      filename = `mcp_activity_logs_export.csv`;
    }

    const csvContent = [
      headers.join(","),
      ...rows.map(row => 
        row.map(value => {
          const stringified = String(value ?? "");
          if (stringified.includes(",") || stringified.includes('"') || stringified.includes("\n") || stringified.includes("\r")) {
            return `"${stringified.replace(/"/g, '""')}"`;
          }
          return stringified;
        }).join(",")
      )
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // DB Data stores
  const [users, setUsers] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [loginHistory, setLoginHistory] = useState<any[]>([]);
  const [mcpLogs, setMcpLogs] = useState<any[]>([]);

  const filteredAuditLogs = auditLogs.filter(log => {
    const timestamp = log.created_at || log.timestamp;
    return filterByDateRange(timestamp);
  });

  const filteredLoginHistory = loginHistory.filter(lh => {
    return filterByDateRange(lh.login_time);
  });

  const filteredMcpLogs = mcpLogs.filter(ml => {
    const timestamp = ml.created_at || ml.timestamp;
    return filterByDateRange(timestamp);
  });

  const [stats, setStats] = useState<any>({
    totalUsers: 0,
    activeSubscribers: 0,
    totalProjects: 0,
    averageExecutionTime: 0,
    activeDeployments: 1
  });

  // State for updating a user's role
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [selectedRole, setSelectedRole] = useState<string>("Staff");

  // State for Admin Adding a Member (Creation)
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const [addUsername, setAddUsername] = useState("");
  const [addEmail, setAddEmail] = useState("");
  const [addPassword, setAddPassword] = useState("");
  const [addEmployeeId, setAddEmployeeId] = useState("");
  const [addDepartment, setAddDepartment] = useState("");
  const [addDesignation, setAddDesignation] = useState("");
  const [addRole, setAddRole] = useState("Staff");

  // State for Admin Overriding Password
  const [targetPasswordUserId, setTargetPasswordUserId] = useState<string | null>(null);
  const [targetPasswordUserEmail, setTargetPasswordUserEmail] = useState("");
  const [targetPasswordNewPass, setTargetPasswordNewPass] = useState("");

  // Style classes
  const borderCol = isDarkMode ? "border-neutral-800" : "border-neutral-200";
  const bgAccent = isDarkMode ? "bg-neutral-900/40" : "bg-neutral-50";
  const textTitle = isDarkMode ? "text-neutral-100" : "text-neutral-900";
  const textMuted = isDarkMode ? "text-neutral-400" : "text-neutral-500";
  const selectStyle = isDarkMode 
    ? "bg-[#151619] border-neutral-700 text-neutral-200" 
    : "bg-white border-neutral-300 text-neutral-800";

  // Data Loading Trigger
  const loadPortalData = async () => {
    if (!session?.access_token) return;
    setLoading(true);
    setErrorText("");
    
    try {
      const headers = {
        "Authorization": `Bearer ${session.access_token}`,
        "Content-Type": "application/json"
      };

      // Load System Stats first
      const statsRes = await fetch("/api/admin/stats", { headers });
      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData.stats || stats);
      }

      // Check subTab to view specific table
      if (activeSubTab === "users") {
        const res = await fetch("/api/admin/users", { headers });
        if (res.status === 403) {
          throw new Error("ACCESS_DENIED");
        }
        if (!res.ok) throw new Error(await res.text());
        const data = await res.json();
        setUsers(data.users || []);
      } else if (activeSubTab === "audit") {
        const res = await fetch("/api/admin/audit-logs", { headers });
        if (res.status === 403) throw new Error("ACCESS_DENIED");
        if (!res.ok) throw new Error(await res.text());
        const data = await res.json();
        setAuditLogs(data.logs || []);
      } else if (activeSubTab === "login") {
        const res = await fetch("/api/admin/login-history", { headers });
        if (res.status === 403) throw new Error("ACCESS_DENIED");
        if (!res.ok) throw new Error(await res.text());
        const data = await res.json();
        // Server returns payload in "logs"
        setLoginHistory(data.logs || data.history || []);
      } else if (activeSubTab === "mcp") {
        const res = await fetch("/api/admin/mcp-activity", { headers });
        if (res.status === 403) throw new Error("ACCESS_DENIED");
        if (!res.ok) throw new Error(await res.text());
        const data = await res.json();
        setMcpLogs(data.logs || []);
      }
    } catch (err: any) {
      console.error("Failed to sync Admin control records", err);
      if (err.message === "ACCESS_DENIED") {
        setErrorText("CLEARANCE_ERR");
      } else {
        setErrorText(err.message || "Failed to load database. Check Supabase connection.");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPortalData();
  }, [session, activeSubTab]);

  // Handler to lock/unlock standard user status
  const handleToggleStatus = async (userId: string, currentStatus: string) => {
    if (!session?.access_token) return;
    try {
      setErrorText("");
      setSuccessText("");
      const targetStatus = currentStatus === "Locked" ? "Active" : "Locked";
      
      const res = await fetch("/api/admin/users/toggle-status", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${session.access_token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ userId, status: targetStatus })
      });

      if (!res.ok) throw new Error(await res.text());
      setSuccessText("Teammate clearance settings updated successfully.");
      loadPortalData();
    } catch (e: any) {
      setErrorText(e.message || "Failed to update profile locks.");
    }
  };

  // Handler to change user role state
  const handleUpdateRole = async (userId: string) => {
    if (!session?.access_token) return;
    try {
      setErrorText("");
      setSuccessText("");
      
      const res = await fetch("/api/admin/users/update", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${session.access_token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ userId, targetRole: selectedRole })
      });

      if (!res.ok) throw new Error(await res.text());
      setSuccessText("Assigned organizational security role updated successfully.");
      setEditingUserId(null);
      loadPortalData();
    } catch (e: any) {
      setErrorText(e.message || "Failed to save role update.");
    }
  };

  // Handler to manually register a new employee (Admin exclusively)
  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session?.access_token) return;
    setErrorText("");
    setSuccessText("");
    try {
      if (!addUsername || !addPassword) {
        throw new Error("Teammate Username and Password keys are required.");
      }
      
      const res = await fetch("/api/admin/users/create", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${session.access_token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          username: addUsername,
          email: addEmail,
          password: addPassword,
          employeeId: addEmployeeId,
          department: addDepartment,
          designation: addDesignation,
          role: addRole
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to register new teammate.");
      }

      setSuccessText(`Teammate account details for "${addUsername}" registered successfully!`);
      setIsAddUserOpen(false);
      // Reset variables
      setAddUsername("");
      setAddEmail("");
      setAddPassword("");
      setAddEmployeeId("");
      setAddDepartment("");
      setAddDesignation("");
      setAddRole("Staff");
      loadPortalData();
    } catch (err: any) {
      setErrorText(err.message || "Teammate registration has failed.");
    }
  };

  // Handler to perform security key reset on behalf of staff user
  const handleAdminChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session?.access_token || !targetPasswordUserId) return;
    setErrorText("");
    setSuccessText("");
    try {
      if (!targetPasswordNewPass) {
        throw new Error("Corporate staff security key is required.");
      }

      const res = await fetch("/api/admin/users/change-password", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${session.access_token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          userId: targetPasswordUserId,
          newPassword: targetPasswordNewPass
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed override attempt.");
      }

      setSuccessText(`Access password for teammate ${targetPasswordUserEmail} successfully reset.`);
      setTargetPasswordUserId(null);
      setTargetPasswordUserEmail("");
      setTargetPasswordNewPass("");
      loadPortalData();
    } catch (err: any) {
      setErrorText(err.message || "Teammate reset key failed.");
    }
  };

  // Handler to permanently remove teammate account
  const handleDeleteUser = async (userId: string, userEmail: string) => {
    if (!session?.access_token) return;
    if (!window.confirm(`Are you absolutely sure you want to permanently delete user account: ${userEmail}? This will wipe metadata traces and is completely irreversible.`)) {
      return;
    }

    setErrorText("");
    setSuccessText("");
    try {
      const res = await fetch("/api/admin/users/delete", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${session.access_token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ userId })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Removal transaction rejected.");
      }

      setSuccessText(`Staff profile associated with ${userEmail} was hard-deleted from workspace directory.`);
      loadPortalData();
    } catch (err: any) {
      setErrorText(err.message || "Teammate removal procedure failed.");
    }
  };

  // If role is denied access (Staff trying to look at global directories)
  if (errorText === "CLEARANCE_ERR") {
    return (
      <div className={`p-6 border ${borderCol} rounded-2xl ${bgAccent} shadow-xs flex flex-col items-center justify-center text-center max-w-2xl mx-auto my-12`}>
        <div className="p-3 bg-amber-500/10 border border-amber-500/20 text-amber-500 rounded-2xl mb-4">
          <ShieldAlert className="h-10 w-10 shrink-0" />
        </div>
        <h3 className="text-lg font-bold tracking-tight text-white mb-2">
          Elevated Operational Clearance Required
        </h3>
        <p className="text-xs text-neutral-400 font-light max-w-md leading-relaxed mb-6">
          Your current security enrollment is registered as a restricted corporate profile (Staff role). Global teammate directories, centralized security audits, and LDAP system logs are restricted to members with active **Admin** credentials.
        </p>
        <div className="grid grid-cols-2 gap-3 text-left w-full max-w-sm text-[11px] font-mono bg-neutral-900/60 p-4 border border-neutral-800 rounded-lg mb-6">
          <div className="text-neutral-500">CLEARANCE NODE:</div>
          <div className="text-rose-400 font-bold">403 UNAUTHORIZED</div>
          <div className="text-neutral-500">YOUR PROFILE EMAIL:</div>
          <div className="text-neutral-300 truncate">{session.user?.email}</div>
          <div className="text-neutral-500">REQUIRED ROLE:</div>
          <div className="text-amber-500 font-bold">ADMIN</div>
        </div>
        <p className="text-[10px] text-neutral-500">
          Try registering a new account and select the **Admin** role mapping dropdown to inspect this view!
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      
      {/* Enterprise Statistics Cards Row */}
      {!hideStats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
          <div className={`p-4 rounded-xl border ${borderCol} ${bgAccent} flex flex-col`}>
            <span className="text-[10px] font-mono text-neutral-500 uppercase tracking-wider font-semibold">Teammates</span>
            <span className={`text-2xl font-extrabold font-mono mt-1 ${textTitle}`}>{stats.totalUsers}</span>
            <span className="text-[9px] text-emerald-400 font-mono mt-1 flex items-center gap-0.5">
              <ArrowUpRight className="h-3 w-3" /> Sync Active
            </span>
          </div>
          
          <div className={`p-4 rounded-xl border ${borderCol} ${bgAccent} flex flex-col`}>
            <span className="text-[10px] font-mono text-neutral-500 uppercase tracking-wider font-semibold">Active Sessions</span>
            <span className={`text-2xl font-extrabold font-mono mt-1 ${textTitle}`}>{stats.activeSubscribers}</span>
            <span className="text-[9px] text-indigo-400 font-mono mt-1 flex items-center gap-0.5">
              ● Realtime Connection
            </span>
          </div>

          <div className={`p-4 rounded-xl border ${borderCol} ${bgAccent} flex flex-col`}>
            <span className="text-[10px] font-mono text-neutral-500 uppercase tracking-wider font-semibold">Project Indexes</span>
            <span className={`text-2xl font-extrabold font-mono mt-1 ${textTitle}`}>{stats.totalProjects}</span>
            <span className="text-[9px] text-neutral-400 font-mono mt-1">Stored Stably</span>
          </div>

          <div className={`p-4 rounded-xl border ${borderCol} ${bgAccent} flex flex-col`}>
            <span className="text-[10px] font-mono text-neutral-500 uppercase tracking-wider font-semibold">Avg Gen Delay</span>
            <span className={`text-2xl font-extrabold font-mono mt-1 text-emerald-400`}>{stats.averageExecutionTime ? `${stats.averageExecutionTime}s` : "0.5s"}</span>
            <span className="text-[9px] text-neutral-400 font-mono mt-1">LLM Fallback Armed</span>
          </div>
        </div>
      )}

      {/* Admin Module Subtabs (Only visible when no overrideTab is specified) */}
      {!overrideTab && (
        <div className="flex border-b border-neutral-800/40 text-xs overflow-x-auto gap-2 font-mono py-1">
          <button
            onClick={() => setActiveSubTab("users")}
            className={`py-2 px-3 border-b-2 transition whitespace-nowrap flex items-center gap-1.5 ${
              activeSubTab === "users" ? "border-indigo-500 text-indigo-400 font-bold" : "border-transparent text-neutral-500 hover:text-neutral-300"
            }`}
          >
            <Users className="h-4 w-4" />
            Teammate Directory ({users.length})
          </button>

          <button
            onClick={() => setActiveSubTab("audit")}
            className={`py-2 px-3 border-b-2 transition whitespace-nowrap flex items-center gap-1.5 ${
              activeSubTab === "audit" ? "border-indigo-500 text-indigo-400 font-bold" : "border-transparent text-neutral-500 hover:text-neutral-300"
            }`}
          >
            <FileSpreadsheet className="h-4 w-4" />
            Security Audit Trail ({auditLogs.length})
          </button>

          <button
            onClick={() => setActiveSubTab("login")}
            className={`py-2 px-3 border-b-2 transition whitespace-nowrap flex items-center gap-1.5 ${
              activeSubTab === "login" ? "border-indigo-500 text-indigo-400 font-bold" : "border-transparent text-neutral-500 hover:text-neutral-300"
            }`}
          >
            <History className="h-4 w-4" />
            LDAP Login History ({loginHistory.length})
          </button>

          <button
            onClick={() => setActiveSubTab("mcp")}
            className={`py-2 px-3 border-b-2 transition whitespace-nowrap flex items-center gap-1.5 ${
              activeSubTab === "mcp" ? "border-indigo-500 text-indigo-400 font-bold" : "border-transparent text-neutral-500 hover:text-neutral-300"
            }`}
          >
            <Cpu className="h-4 w-4" />
            MCP Tool activity ({mcpLogs.length})
          </button>

          <button
            onClick={loadPortalData}
            disabled={loading}
            className="ml-auto py-1.5 px-3 rounded-lg border border-neutral-800 text-neutral-400 hover:bg-neutral-900 transition flex items-center gap-1 text-[11px]"
            title="Force Sync Directory"
          >
            <RefreshCw className={`h-3 w-3 ${loading ? "animate-spin" : ""}`} />
            Sync
          </button>
        </div>
      )}

      {/* Filters and Utilities Bar */}
      {(activeSubTab === "audit" || activeSubTab === "login" || activeSubTab === "mcp") && (
        <div className={`p-3 rounded-xl border ${borderCol} ${bgAccent} flex flex-col sm:flex-row items-center justify-between gap-3 text-xs font-mono`}>
          <div className="flex items-center gap-3">
            <span className="text-neutral-400 font-bold">Trace Date Range:</span>
            <div className="flex rounded-lg bg-neutral-950/40 p-0.5 border border-neutral-800">
              <button
                onClick={() => setDateFilter("week")}
                id="filter-btn-past-week"
                className={`px-3 py-1 rounded text-[10.5px] transition cursor-pointer ${
                  dateFilter === "week" ? "bg-emerald-500/10 text-emerald-400 font-bold border border-emerald-500/20" : "text-neutral-400 border border-transparent hover:text-neutral-200"
                }`}
              >
                Past Week (7 Days)
              </button>
              <button
                onClick={() => setDateFilter("today")}
                id="filter-btn-today"
                className={`px-3 py-1 rounded text-[10.5px] transition cursor-pointer ${
                  dateFilter === "today" ? "bg-emerald-500/10 text-emerald-400 font-bold border border-emerald-500/20" : "text-neutral-400 border border-transparent hover:text-neutral-200"
                }`}
              >
                Today Only
              </button>
              <button
                onClick={() => setDateFilter("all")}
                id="filter-btn-all-time"
                className={`px-3 py-1 rounded text-[10.5px] transition cursor-pointer ${
                  dateFilter === "all" ? "bg-neutral-800 text-neutral-200 border border-neutral-700/50" : "text-neutral-400 border border-transparent hover:text-neutral-200"
                }`}
              >
                All Historical
              </button>
            </div>
          </div>

          <button
            onClick={() => handleExportCSV(activeSubTab)}
            id={`btn-csv-export-${activeSubTab}`}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-[#beebd8]/10 hover:bg-[#beebd8]/25 text-[#beebd8] rounded-lg border border-[#beebd8]/20 transition cursor-pointer font-bold font-mono tracking-wide shadow-xs shrink-0 self-stretch sm:self-auto justify-center"
          >
            <FileSpreadsheet className="h-4 w-4 text-emerald-400 animate-pulse" />
            <span>Export Table (.CSV)</span>
          </button>
        </div>
      )}

      {/* FEEDBACK FEED */}
      {errorText && errorText !== "CLEARANCE_ERR" && (
        <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-xs flex gap-2">
          <ShieldAlert className="h-4 w-4" />
          <span>{errorText}</span>
        </div>
      )}

      {successText && (
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-emerald-400 text-xs flex gap-2">
          <Check className="h-4 w-4" />
          <span>{successText}</span>
        </div>
      )}

      {/* Subtab Render Module */}
      <div className={`border ${borderCol} rounded-xl overflow-hidden ${bgAccent} p-1 text-xs`}>
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center text-neutral-500 gap-2">
            <span className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></span>
            <span className="font-mono text-[11px]">Syncing secure corporate logs...</span>
          </div>
        ) : (
          <div>
            {/* SUBTAB: TEAMMATE DIRECTORY */}
            {activeSubTab === "users" && (
              <div className="p-3">
                {/* Header Actions */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-4 pb-3 border-b border-neutral-800/15">
                  <div className="flex flex-col">
                    <h4 className="text-sm font-bold text-neutral-200">System Employee Directory</h4>
                    <p className="text-[10px] text-neutral-400">Manage user profile access, roles, enterprise credentials, and security enrollment logs.</p>
                  </div>
                  <button
                    onClick={() => setIsAddUserOpen(true)}
                    className="py-1.5 px-3 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-[11px] font-mono font-bold tracking-wide transition flex items-center justify-center gap-1.5 cursor-pointer self-start md:self-auto shrink-0"
                  >
                    <UserPlus className="h-3.5 w-3.5" />
                    Add Teammate
                  </button>
                </div>

                {/* USER CREATION POPUP MODAL */}
                {isAddUserOpen && (
                  <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
                    <div className="w-full max-w-md bg-[#18191c] text-neutral-100 border border-neutral-850 rounded-xl p-5 shadow-2xl text-left">
                      <div className="flex justify-between items-center mb-4 pb-2 border-b border-neutral-800">
                        <div className="flex items-center gap-2">
                          <UserPlus className="h-4 w-4 text-indigo-400 animate-pulse" />
                          <span className="font-mono text-xs font-bold uppercase tracking-wider">Register Corporate Profile</span>
                        </div>
                        <button onClick={() => setIsAddUserOpen(false)} className="p-1 hover:bg-neutral-800 rounded text-neutral-400 cursor-pointer">
                          <X className="h-4 w-4" />
                        </button>
                      </div>

                      <form onSubmit={handleCreateUser} className="flex flex-col gap-3 font-sans">
                        <div className="grid grid-cols-2 gap-2.5">
                          <div className="flex flex-col gap-1 col-span-2">
                            <label className="text-[9.5px] uppercase font-mono tracking-wider font-bold text-neutral-400">USERNAME *</label>
                            <input 
                              type="text" 
                              required 
                              placeholder="e.g. janesmith"
                              value={addUsername} 
                              onChange={e => setAddUsername(e.target.value)}
                              className="w-full text-xs px-2.5 py-1.5 bg-[#101113] border border-neutral-850 text-white rounded focus:outline-none focus:border-indigo-500 font-mono"
                            />
                          </div>

                          <div className="flex flex-col gap-1 col-span-2">
                            <label className="text-[9.5px] uppercase font-mono tracking-wider font-bold text-neutral-400">CORPORATE EMAIL (OPTIONAL)</label>
                            <input 
                              type="email" 
                              placeholder="e.g. jane.smith@organization.com"
                              value={addEmail} 
                              onChange={e => setAddEmail(e.target.value)}
                              className="w-full text-xs px-2.5 py-1.5 bg-[#101113] border border-neutral-850 text-white rounded focus:outline-none focus:border-indigo-500 font-mono"
                            />
                          </div>

                          <div className="flex flex-col gap-1 col-span-2">
                            <label className="text-[9.5px] uppercase font-mono tracking-wider font-bold text-neutral-400">PASSWORD ACCESS KEY *</label>
                            <input 
                              type="password" 
                              required 
                              minLength={4}
                              placeholder="Minimum 4 characters"
                              value={addPassword} 
                              onChange={e => setAddPassword(e.target.value)}
                              className="w-full text-xs px-2.5 py-1.5 bg-[#101113] border border-neutral-850 text-white rounded focus:outline-none focus:border-indigo-500 font-mono"
                            />
                          </div>

                          <div className="flex flex-col gap-1">
                            <label className="text-[9.5px] uppercase font-mono tracking-wider font-bold text-neutral-400">EMPLOYEE ID</label>
                            <input 
                              type="text" 
                              placeholder="EMP-8241"
                              value={addEmployeeId} 
                              onChange={e => setAddEmployeeId(e.target.value)}
                              className="w-full text-xs px-2.5 py-1.5 bg-[#101113] border border-neutral-850 text-white rounded focus:outline-none focus:border-indigo-500 font-mono"
                            />
                          </div>

                          <div className="flex flex-col gap-1">
                            <label className="text-[9.5px] uppercase font-mono tracking-wider font-bold text-neutral-400">ASSIGNED ROLE</label>
                            <select 
                              value={addRole} 
                              onChange={e => setAddRole(e.target.value)}
                              className="w-full text-xs px-2 py-1.5 bg-[#101113] border border-neutral-850 text-white rounded focus:outline-none focus:border-indigo-500 font-mono"
                            >
                              <option value="Staff">Staff</option>
                              <option value="Admin">Admin</option>
                            </select>
                          </div>

                          <div className="flex flex-col gap-1">
                            <label className="text-[9.5px] uppercase font-mono tracking-wider font-bold text-neutral-400">CORPORATE DEPT</label>
                            <input 
                              type="text" 
                              placeholder="e.g. Engineering"
                              value={addDepartment} 
                              onChange={e => setAddDepartment(e.target.value)}
                              className="w-full text-xs px-2.5 py-1.5 bg-[#101113] border border-neutral-850 text-white rounded focus:outline-none focus:border-indigo-500 font-mono"
                            />
                          </div>

                          <div className="flex flex-col gap-1">
                            <label className="text-[9.5px] uppercase font-mono tracking-wider font-bold text-neutral-400">DESIGNATION</label>
                            <input 
                              type="text" 
                              placeholder="e.g. Staff Engineer"
                              value={addDesignation} 
                              onChange={e => setAddDesignation(e.target.value)}
                              className="w-full text-xs px-2.5 py-1.5 bg-[#101113] border border-neutral-850 text-white rounded focus:outline-none focus:border-indigo-500 font-mono"
                            />
                          </div>
                        </div>

                        <button
                          type="submit"
                          className="w-full py-2 bg-blue-600 hover:bg-blue-500 text-white font-mono text-xs font-bold rounded tracking-wider uppercase transition mt-3 cursor-pointer"
                        >
                          PROVISION PROFILE
                        </button>
                      </form>
                    </div>
                  </div>
                )}

                {/* USER PASSWORD OVERRIDE MODAL */}
                {targetPasswordUserId && (
                  <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
                    <div className="w-full max-w-sm bg-[#18191c] text-neutral-100 border border-neutral-850 rounded-xl p-5 shadow-2xl text-left">
                      <div className="flex justify-between items-center mb-4 pb-2 border-b border-neutral-800">
                        <div className="flex items-center gap-2">
                          <Key className="h-4 w-4 text-emerald-400 animate-pulse" />
                          <span className="font-mono text-xs font-bold uppercase tracking-wider">RESET STAFF KEY</span>
                        </div>
                        <button onClick={() => setTargetPasswordUserId(null)} className="p-1 hover:bg-neutral-800 rounded text-neutral-400 cursor-pointer">
                          <X className="h-4 w-4" />
                        </button>
                      </div>

                      <p className="text-[10px] text-neutral-400 mb-3 font-mono">
                        Overriding security credentials of teammate: <span className="text-[#beebd8]">{targetPasswordUserEmail}</span>. The employee will immediately require this key to authenticate.
                      </p>

                      <form onSubmit={handleAdminChangePassword} className="flex flex-col gap-3 font-sans">
                        <div className="flex flex-col gap-1">
                          <label className="text-[9.5px] uppercase font-mono tracking-wider font-bold text-neutral-400">NEW ENROLLMENT KEY *</label>
                          <input 
                            type="password" 
                            required 
                            minLength={4}
                            placeholder="Min 4 symbols password"
                            value={targetPasswordNewPass} 
                            onChange={e => setTargetPasswordNewPass(e.target.value)}
                            className="w-full text-xs px-2.5 py-1.5 bg-[#101113] border border-neutral-850 text-white rounded focus:outline-none focus:border-indigo-500 font-mono"
                          />
                        </div>

                        <button
                          type="submit"
                          className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-mono text-xs font-bold rounded tracking-wider uppercase transition mt-1 cursor-pointer"
                        >
                          MUTATE SECURITY ENTRY
                        </button>
                      </form>
                    </div>
                  </div>
                )}

                <div className="overflow-x-auto w-full">
                  <table className="w-full text-left font-sans">
                    <thead className="bg-[#151619] text-[#beebd8] text-[9.5px] font-mono uppercase tracking-wider border-b border-neutral-800">
                      <tr>
                        <th className="p-3">Teammate Info</th>
                        <th className="p-3">Employee ID</th>
                        <th className="p-3">Department</th>
                        <th className="p-3">Assigned Role</th>
                        <th className="p-3">Account Status</th>
                        <th className="p-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-800/60">
                      {users.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="p-8 text-center text-neutral-500 font-mono">No teammates active in tenant dashboard.</td>
                        </tr>
                      ) : (
                        users.map((u) => {
                          const fullName = u.fullName || u.full_name || u.username || "Unregistered Guest";
                          const employeeId = u.employeeId || u.employee_id || "N/A";
                          const status = u.status || u.account_status || "Active";
                          const isLocked = status === "Locked" || status === "Disabled";
                          return (
                            <tr key={u.id} className="hover:bg-neutral-900/40 transition">
                              <td className="p-3">
                                <div className="font-bold text-neutral-200">{fullName}</div>
                                <div className="text-[10px] text-neutral-500 font-mono truncate max-w-[180px]">{u.email || `${u.username}@org.com`}</div>
                              </td>
                              <td className="p-3 font-mono text-[10.5px] text-neutral-300">{employeeId}</td>
                              <td className="p-3 text-neutral-300">
                                <div>{u.department || "Engineering"}</div>
                                <div className="text-[10px] text-neutral-500">{u.designation || "Staff Engineer"}</div>
                              </td>
                              <td className="p-3 font-mono">
                                {editingUserId === u.id ? (
                                  <div className="flex items-center gap-1">
                                    <select
                                      value={selectedRole}
                                      onChange={e => setSelectedRole(e.target.value)}
                                      className="text-xs p-1 rounded border-neutral-700 bg-neutral-900 text-white"
                                    >
                                      <option value="Staff">Staff</option>
                                      <option value="Admin">Admin</option>
                                    </select>
                                    <button
                                      onClick={() => handleUpdateRole(u.id)}
                                      className="p-1 bg-indigo-600 rounded text-white hover:bg-indigo-700 cursor-pointer"
                                      title="Save Role"
                                    >
                                      <Check className="h-3.5 w-3.5" />
                                    </button>
                                    <button
                                      onClick={() => setEditingUserId(null)}
                                      className="p-1 bg-neutral-800 rounded text-neutral-400 hover:bg-neutral-700 cursor-pointer"
                                    >
                                      <X className="h-3.5 w-3.5" />
                                    </button>
                                  </div>
                                ) : (
                                  <div className="flex items-center gap-1.5">
                                    <span className={`px-2 py-0.5 rounded font-bold text-[9.5px] tracking-wider ${
                                      u.role === "Admin" ? "bg-amber-500/10 text-amber-500 border border-amber-500/20" :
                                      "bg-indigo-500/5 text-neutral-300 border border-neutral-800"
                                    }`}>
                                      {u.role || "Staff"}
                                    </span>
                                    <button
                                      onClick={() => { setEditingUserId(u.id); setSelectedRole(u.role || "Staff"); }}
                                      className="text-[10px] text-indigo-400 hover:underline cursor-pointer"
                                    >
                                      Edit
                                    </button>
                                  </div>
                                )}
                              </td>
                              <td className="p-3">
                                <span className={`px-2 py-0.5 rounded-full text-[9.5px] font-bold font-mono ${isLocked ? "bg-red-500/10 text-red-500 border border-red-500/20 animate-pulse" : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"}`}>
                                  {status}
                                </span>
                              </td>
                              <td className="p-3 text-right">
                                <div className="flex items-center justify-end gap-1.5 ml-auto">
                                  {/* Overwrite Password key */}
                                  <button
                                    onClick={() => {
                                      setTargetPasswordUserId(u.id);
                                      setTargetPasswordUserEmail(u.email || u.username);
                                      setTargetPasswordNewPass("");
                                    }}
                                    className="p-1 px-2 rounded font-mono text-[9.5px] border border-neutral-700 hover:bg-indigo-500/15 text-indigo-400 flex items-center gap-1 cursor-pointer"
                                    title="Reset password of teammate"
                                  >
                                    <Key className="h-3 w-3" />
                                    <span>Pass</span>
                                  </button>

                                  {/* Toggle Locks */}
                                  <button
                                    onClick={() => handleToggleStatus(u.id, status)}
                                    disabled={u.email === session.user?.email}
                                    className={`px-2 py-1 rounded text-[9.5px] font-mono font-semibold transition flex items-center gap-1 cursor-pointer ${
                                      isLocked 
                                        ? "bg-emerald-700 hover:bg-emerald-600 text-white" 
                                        : "bg-neutral-800 hover:bg-neutral-750 text-neutral-300"
                                    } disabled:opacity-40 disabled:cursor-not-allowed`}
                                  >
                                    {isLocked ? "Unlock" : "Lock"}
                                  </button>

                                  {/* Hard Delete */}
                                  <button
                                    onClick={() => handleDeleteUser(u.id, u.email || u.username)}
                                    disabled={u.email === session.user?.email || u.id === "00000000-0000-0000-0000-000000000022"}
                                    className="p-1 px-1.5 rounded border border-red-500/20 text-red-400 hover:bg-red-500/10 flex items-center gap-1 cursor-pointer disabled:opacity-45"
                                    title="Permanently remove teammate account"
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* SUBTAB: SECURITY AUDIT TRAIL */}
            {activeSubTab === "audit" && (
              <div className="overflow-x-auto w-full">
                <table className="w-full text-left font-mono text-[10.5px]">
                  <thead className="bg-[#151619] text-[#beebd8] text-[9.5px] uppercase tracking-wider border-b border-neutral-800">
                    <tr>
                      <th className="p-3">Timestamp / Node</th>
                      <th className="p-3">Compliance Action</th>
                      <th className="p-3">Operator</th>
                      <th className="p-3">Scope Target</th>
                      <th className="p-3">Status</th>
                      <th className="p-3">Raw audit index</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-800/60 leading-relaxed font-mono">
                    {filteredAuditLogs.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="p-8 text-center text-neutral-500">No organizational administrative compliance records logged in chosen date range.</td>
                      </tr>
                    ) : (
                      filteredAuditLogs.map((log) => {
                        const timestamp = log.created_at || log.timestamp;
                        const operatorName = log.users?.fullName || log.user_fullname || "Operator System";
                        const operatorEmail = log.users?.email || log.user_email || "internal@company.com";
                        const targetTable = log.target_table || log.resource_type || "system";
                        const userAgent = log.user_agent || log.device_information || "Chrome";
                        return (
                          <tr key={log.id} className="hover:bg-neutral-900/40 transition">
                            <td className="p-3 whitespace-nowrap">
                              <div className="text-neutral-300">{new Date(timestamp).toLocaleDateString()} {new Date(timestamp).toLocaleTimeString()}</div>
                              <div className="text-[9px] text-neutral-500">NODE: {log.ip_address || "3000"} | {userAgent ? userAgent.substring(0, 20) + "..." : "Chrome"}</div>
                            </td>
                            <td className="p-3">
                              <strong className="text-indigo-400">{log.action || "API_CALL"}</strong>
                            </td>
                            <td className="p-3 text-neutral-200">
                              <div>{operatorName}</div>
                              <div className="text-[9.5px] text-neutral-500">{operatorEmail}</div>
                            </td>
                            <td className="p-3 text-neutral-300">
                              <div>TABLE_EVENT: <span className="font-bold text-yellow-400">{targetTable}</span></div>
                              <div className="text-[9.5px] text-neutral-400">{log.details ? log.details.substring(0, 40) : "N/A"}</div>
                            </td>
                          <td className="p-3">
                            <span className={`px-1.5 py-0.5 rounded font-bold text-[9px] ${log.status === "Success" ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400 animate-pulse"}`}>
                              {log.status || "Success"}
                            </span>
                          </td>
                          <td className="p-3">
                            <details className="cursor-pointer">
                              <summary className="text-indigo-500 text-[9px] font-semibold hover:underline">Show Envelope</summary>
                              <pre className="text-[8px] text-neutral-400 mt-1 bg-black/40 p-1 rounded max-w-[200px] max-h-16 overflow-y-auto whitespace-pre-wrap">{JSON.stringify(log, null, 2)}</pre>
                            </details>
                          </td>
                        </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {/* SUBTAB: CONNECT HISTORY */}
            {activeSubTab === "login" && (
              <div className="overflow-x-auto w-full">
                <table className="w-full text-left font-mono text-[10.5px]">
                  <thead className="bg-[#151619] text-[#beebd8] text-[9.5px] uppercase tracking-wider border-b border-neutral-800">
                    <tr>
                      <th className="p-3">Attempt Timestamp</th>
                      <th className="p-3">Authentication Entity (Email)</th>
                      <th className="p-3">Terminal Node IP / Agent</th>
                      <th className="p-3">Outcome Status</th>
                      <th className="p-3">Trace Records</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-800/60 leading-relaxed font-mono">
                    {filteredLoginHistory.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="p-8 text-center text-neutral-500">No LDAP login connection metadata tracks returned in chosen date range.</td>
                      </tr>
                    ) : (
                      filteredLoginHistory.map((lh) => {
                        const email = lh.user_email || lh.email || lh.users?.email || "guest@company.com";
                        const device = lh.user_agent || lh.device_information || "Corporate Workgroup Client";
                        const status = lh.status || lh.login_status || "Success";
                        return (
                          <tr key={lh.id} className="hover:bg-neutral-900/40 transition">
                            <td className="p-3 whitespace-nowrap text-neutral-300">
                              {new Date(lh.login_time).toLocaleString()}
                            </td>
                            <td className="p-3 text-indigo-400 font-bold">
                              {email}
                            </td>
                            <td className="p-3 text-neutral-300">
                              <div className="font-mono text-[11px]">{lh.ip_address || "0.0.0.0"}</div>
                              <div className="text-[9px] text-neutral-500 truncate max-w-[220px]" title={device}>{device}</div>
                            </td>
                            <td className="p-3">
                              <span className={`px-2 py-0.5 rounded-full font-bold text-[9.5px] ${status === "Success" ? "bg-emerald-500/10 text-emerald-400" : "bg-rose-500/10 text-rose-400"}`}>
                                {status}
                              </span>
                            </td>
                            <td className="p-3 text-neutral-500 text-[10px]">
                              {lh.details || "Corporate Security Handshake Complete"}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {/* SUBTAB: MCP ACTIVITY */}
            {activeSubTab === "mcp" && (
              <div className="overflow-x-auto w-full">
                <table className="w-full text-left font-mono text-[10.5px]">
                  <thead className="bg-[#151619] text-[#beebd8] text-[9.5px] uppercase tracking-wider border-b border-neutral-800">
                    <tr>
                      <th className="p-3">Timestamp</th>
                      <th className="p-3">MCP Tool Name</th>
                      <th className="p-3">Invoker Employee</th>
                      <th className="p-3">Status</th>
                      <th className="p-3 text-right">Elapsed Weight</th>
                      <th className="p-3">Raw parameters trace / Response payload</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-800/60 leading-relaxed font-mono">
                    {filteredMcpLogs.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="p-8 text-center text-neutral-500">No active server invocations logged in chosen date range.</td>
                      </tr>
                    ) : (
                      filteredMcpLogs.map((ml) => {
                        const timestamp = ml.created_at || ml.timestamp;
                        const fullname = ml.users?.fullName || ml.user_fullname || "System Administrator";
                        const email = ml.users?.email || ml.user_email || "mcp_runner@company.com";
                        const status = ml.status || ml.execution_status || "Success";
                        const elapsed = ml.elapsed_seconds ?? ml.execution_time ?? 0.5;
                        const args = ml.arguments || ml.request_payload;
                        const response = ml.response || ml.response_summary;
                        return (
                          <tr key={ml.id} className="hover:bg-neutral-900/40 transition">
                            <td className="p-3 text-neutral-400 whitespace-nowrap">{new Date(timestamp).toLocaleString()}</td>
                            <td className="p-3 text-indigo-400 font-bold flex items-center gap-1.5 uppercase">
                              <Cpu className="h-3.5 w-3.5 shrink-0 text-emerald-400 animate-pulse" />
                              {ml.tool_name}
                            </td>
                            <td className="p-3 text-neutral-200">
                              <div>{fullname}</div>
                              <div className="text-[9px] text-neutral-500">{email}</div>
                            </td>
                            <td className="p-3">
                              <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${status === "Success" ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-500 animate-pulse"}`}>
                                {status}
                              </span>
                            </td>
                            <td className="p-3 text-right text-neutral-400 font-bold text-[10.5px]">{elapsed}s</td>
                            <td className="p-3">
                              <details className="cursor-pointer">
                                <summary className="text-indigo-400 text-[9.5px] hover:underline">Show payload envelope</summary>
                                <div className="mt-1 flex flex-col gap-1 text-[8.5px] bg-black/40 p-2 rounded max-h-32 overflow-y-auto max-w-[300px]">
                                  <span className="text-neutral-500">ARGS:</span> 
                                  <span className="text-neutral-300 select-all whitespace-pre-wrap">{typeof args === "object" ? JSON.stringify(args) : String(args)}</span>
                                  <span className="text-neutral-500">RESPONSE SUMMARY:</span> 
                                  <span className="text-neutral-400 select-all whitespace-pre-wrap">{typeof response === "object" ? JSON.stringify(response) : String(response)}</span>
                                </div>
                              </details>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
