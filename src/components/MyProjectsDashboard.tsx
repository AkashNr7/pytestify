import React, { useState, useEffect } from "react";
import { 
  Folder, 
  Search, 
  Plus, 
  Trash2, 
  Copy, 
  ExternalLink, 
  ArrowRight, 
  Calendar, 
  Database, 
  Terminal, 
  Settings, 
  Sparkles, 
  Check, 
  CheckCircle2, 
  AlertTriangle 
} from "lucide-react";

interface Project {
  id: string;
  project_name: string;
  collection_name: string;
  collection_items: any[];
  library: "requests" | "httpx" | "async_httpx";
  base_url: string;
  inject_fixture: boolean;
  add_comments: boolean;
  created_at: string;
  updated_at: string;
}

interface MyProjectsDashboardProps {
  isDarkMode: boolean;
  authToken: string;
  activeProjectId: string | null;
  onSelectProject: (projectId: string) => void;
  onProjectDeselect: () => void;
  onCreateNewProject: (name: string) => void;
}

const SQL_SETUP_SCRIPT = `-- SUPABASE POSTGRESQL PYTESTIFY BOOTSTRAP SCRIPT
-- Paste this into your Supabase database dynamic Query Editor

CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    project_name TEXT NOT NULL,
    collection_name TEXT,
    collection_items JSONB DEFAULT '[]'::jsonb,
    library TEXT DEFAULT 'requests',
    base_url TEXT DEFAULT '',
    inject_fixture BOOLEAN DEFAULT true,
    add_comments BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.generated_files (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
    file_name TEXT NOT NULL,
    file_content TEXT NOT NULL,
    generated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.execution_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
    passed_count INTEGER NOT NULL,
    failed_count INTEGER NOT NULL,
    execution_time NUMERIC NOT NULL,
    report_json TEXT NOT NULL,
    executed_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.ai_analysis (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
    error_message TEXT NOT NULL,
    diagnosis TEXT NOT NULL,
    recommendation TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ENABLE ROW LEVEL SECURITY (RLS) FOR ABSOLUTE ISOLATION
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.generated_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.execution_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_analysis ENABLE ROW LEVEL SECURITY;

-- SPECIFY POLICIES FOR AUTHTOKEN IDENTITY MATRICES
CREATE POLICY "Allow public read users" ON public.users FOR SELECT USING (true);
CREATE POLICY "Allow user inserts" ON public.users FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Allow owner edits" ON public.users FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Projects owned" ON public.projects FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Generated files owned" ON public.generated_files FOR ALL 
USING (EXISTS (SELECT 1 FROM public.projects WHERE projects.id = generated_files.project_id AND projects.user_id = auth.uid()));

CREATE POLICY "Execution outputs owned" ON public.execution_results FOR ALL 
USING (EXISTS (SELECT 1 FROM public.projects WHERE projects.id = execution_results.project_id AND projects.user_id = auth.uid()));

CREATE POLICY "AI diagnostics owned" ON public.ai_analysis FOR ALL 
USING (EXISTS (SELECT 1 FROM public.projects WHERE projects.id = ai_analysis.project_id AND projects.user_id = auth.uid()));
`;

export default function MyProjectsDashboard({
  isDarkMode,
  authToken,
  activeProjectId,
  onSelectProject,
  onProjectDeselect,
  onCreateNewProject
}: MyProjectsDashboardProps) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [search, setSearch] = useState("");
  const [order, setOrder] = useState<"desc" | "asc">("desc");
  const [loading, setLoading] = useState(false);
  const [newProjName, setNewProjName] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [copiedSql, setCopiedSql] = useState(false);
  const [schemaStatusAlert, setSchemaStatusAlert] = useState(false);

  useEffect(() => {
    fetchProjects();
  }, [authToken]);

  const fetchProjects = async () => {
    if (!authToken) return;
    setLoading(true);
    setSchemaStatusAlert(false);
    try {
      const res = await fetch("/api/projects", {
        headers: {
          "Authorization": `Bearer ${authToken}`
        }
      });
      const data = await res.json();
      if (data.needSchema) {
        setSchemaStatusAlert(true);
      }
      setProjects(data.projects || []);
    } catch (e) {
      console.error("Dashboard list failure:", e);
    } finally {
      setLoading(false);
    }
  };

  const createProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjName.trim()) return;
    setIsCreating(true);
    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${authToken}`
        },
        body: JSON.stringify({
          projectName: newProjName,
          collectionName: "Empty repository",
          collectionItems: []
        })
      });
      const data = await res.json();
      if (res.ok && data.project) {
        setNewProjName("");
        await fetchProjects();
        onCreateNewProject(data.project.id);
      } else {
        alert(data.error || "Failed blueprint creation.");
      }
    } catch (err: any) {
      alert("Creation exception encountered: " + err.message);
    } finally {
      setIsCreating(false);
    }
  };

  const handleDuplicate = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!confirm("Duplicate this project metadata, testing scripts, and reporting logs?")) return;
    try {
      const res = await fetch(`/api/projects/${id}/duplicate`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${authToken}`
        }
      });
      if (res.ok) {
        await fetchProjects();
      } else {
        const d = await res.json();
        alert(d.error || "Duplication failed.");
      }
    } catch (e: any) {
      alert("Duplication exception: " + e.message);
    }
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!confirm("Permanently erase this cloud project and all associated storage files? This is irreversible.")) return;
    try {
      const res = await fetch(`/api/projects/${id}`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${authToken}`
        }
      });
      if (res.ok) {
        if (activeProjectId === id) {
          onProjectDeselect();
        }
        await fetchProjects();
      } else {
        alert("Erase transaction failed.");
      }
    } catch (e: any) {
      alert("Exclusion exception: " + e.message);
    }
  };

  const copySqlToClipboard = () => {
    navigator.clipboard.writeText(SQL_SETUP_SCRIPT);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 3000);
  };

  // Search and Sort projects client-side
  const filtered = projects.filter(p => 
    p.project_name.toLowerCase().includes(search.toLowerCase()) ||
    (p.collection_name?.toLowerCase() || "").includes(search.toLowerCase())
  ).sort((a, b) => {
    const d1 = new Date(a.created_at).getTime();
    const d2 = new Date(b.created_at).getTime();
    return order === "desc" ? d2 - d1 : d1 - d2;
  });

  const borderCol = isDarkMode ? "border-neutral-800" : "border-neutral-200";
  const bgCard = isDarkMode ? "bg-[#141518]" : "bg-white";
  const bgItem = isDarkMode ? "bg-[#1c1d22]/80 hover:bg-[#1c1d22]" : "bg-neutral-50 hover:bg-neutral-100/70";

  return (
    <div className="flex flex-col gap-6 select-none animate-fade-in py-1">
      
      {/* Header Panel */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <span className="text-[10px] uppercase font-mono tracking-widest text-indigo-500 font-extrabold flex items-center gap-1">
            <Database className="h-3.5 w-3.5" />
            Active Cloud Persistency Dashboard
          </span>
          <h2 className={`text-base font-display font-bold mt-0.5 ${isDarkMode ? "text-neutral-200" : "text-neutral-800"}`}>
            My Cloud Workspace Projects
          </h2>
        </div>

        {/* Database SQL Setup Guide companion toggle */}
        <button
          onClick={() => setSchemaStatusAlert(!schemaStatusAlert)}
          className={`px-3 py-1.5 text-xs font-mono font-bold rounded-lg border flex items-center gap-1.5 transition-all ${
            schemaStatusAlert
              ? "bg-amber-500/10 border-amber-500/40 text-amber-500"
              : isDarkMode ? "text-neutral-300 border-neutral-700 hover:bg-neutral-800" : "text-neutral-600 border-neutral-300 hover:bg-neutral-100"
          }`}
        >
          <Settings className="h-3.5 w-3.5" />
          Setup SQL Guide
        </button>
      </div>

      {/* SQL Script companion */}
      {schemaStatusAlert && (
        <div className={`border rounded-xl p-5 bg-amber-500/5 ${isDarkMode ? "border-amber-500/20" : "border-amber-400/30"} flex flex-col gap-3 animate-fade-in`}>
          <div className="flex items-start gap-2.5">
            <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-bold text-amber-500 font-display">Supabase Database Tables Initialization Guide</p>
              <p className={`text-[11px] ${isDarkMode ? "text-neutral-400" : "text-neutral-600"} mt-0.5`}>
                If your project is reporting missing relational tables or if this is the first execution under your personal Supabase cluster, paste the SQL script below in your **Supabase SQL Editor** and click Run. This sets up all security indexes, tables, foreign constraints, and row level isolation policies.
              </p>
            </div>
          </div>

          <div className="relative rounded-lg overflow-hidden border border-neutral-800/80 bg-neutral-950 font-mono text-[10px] text-neutral-300 p-4 max-h-[160px] overflow-y-auto">
            <pre className="whitespace-pre">{SQL_SETUP_SCRIPT}</pre>
            <button
              onClick={copySqlToClipboard}
              className="absolute right-3 top-3 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-[10px] font-bold transition flex items-center gap-1 shadow-sm"
            >
              {copiedSql ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
              {copiedSql ? "Copied" : "Copy SQL Code"}
            </button>
          </div>
        </div>
      )}

      {/* Grid Dashboard Control Bar */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
        
        {/* Search */}
        <div className="md:col-span-6 relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-neutral-400" />
          <input
            type="text"
            placeholder="Search cloud projects or collection references..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={`w-full text-xs pl-9 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono ${
              isDarkMode ? "bg-neutral-900 border-neutral-800 text-neutral-100 placeholder-neutral-500" : "bg-white border-neutral-300 text-neutral-800 placeholder-neutral-400"
            }`}
          />
        </div>

        {/* Sort selector */}
        <div className="md:col-span-3 flex items-center gap-2">
          <label className="text-[10px] font-mono uppercase tracking-wider text-neutral-400 shrink-0">ORDER:</label>
          <select
            value={order}
            onChange={(e) => setOrder(e.target.value as "desc" | "asc")}
            className={`w-full text-xs px-2.5 py-2 border rounded-lg focus:outline-none font-mono ${
              isDarkMode ? "bg-neutral-900 border-neutral-800 text-neutral-200" : "bg-white border-neutral-300 text-neutral-800"
            }`}
          >
            <option value="desc">NEWEST CREATIONS</option>
            <option value="asc">OLDEST HISTORICAL</option>
          </select>
        </div>

        {/* Quick Create Form */}
        <form onSubmit={createProject} className="md:col-span-3 flex gap-2">
          <input
            type="text"
            required
            placeholder="New Project Name"
            value={newProjName}
            onChange={(e) => setNewProjName(e.target.value)}
            className={`w-full text-xs px-2.5 py-1.5 border rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono ${
              isDarkMode ? "bg-neutral-900 border-neutral-800 text-neutral-100 placeholder-neutral-600" : "bg-white border-neutral-300 text-neutral-800"
            }`}
          />
          <button
            type="submit"
            disabled={isCreating}
            className="px-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-mono font-bold transition flex items-center justify-center shrink-0 shadow-sm"
          >
            <Plus className="h-4 w-4" />
          </button>
        </form>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-16 gap-3">
          <div className="w-6 h-6 border-2 border-indigo-500/80 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-xs font-mono text-neutral-500">Querying project matrices from cloud storage database...</span>
        </div>
      ) : filtered.length === 0 ? (
        <div className={`border border-dashed rounded-xl p-12 text-center flex flex-col items-center justify-center gap-3 ${borderCol}`}>
          <div className={`p-3 rounded-full ${isDarkMode ? "bg-neutral-900" : "bg-neutral-100"} text-indigo-500`}>
            <Folder className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-semibold">No active projects found</p>
            <p className="text-[11px] text-neutral-400 mt-0.5">Create your first database project above, or save a translated collection files.</p>
          </div>
          <button
            onClick={fetchProjects}
            className={`px-3 py-1.5 text-xs font-mono border rounded-lg transition-all ${
              isDarkMode ? "border-neutral-700 hover:bg-neutral-800 text-neutral-300" : "border-neutral-300 hover:bg-neutral-50 text-neutral-600"
            }`}
          >
            Refresh Database List
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((proj) => {
            const isCurrent = activeProjectId === proj.id;
            return (
              <div
                key={proj.id}
                onClick={() => onSelectProject(proj.id)}
                className={`relative border rounded-xl p-4 cursor-pointer transition-all flex flex-col gap-3 group select-none ${bgItem} ${
                  isCurrent 
                    ? "border-indigo-500 ring-1 ring-indigo-500/50" 
                    : borderCol
                }`}
              >
                {/* Active Tag */}
                {isCurrent && (
                  <span className="absolute right-4 top-4 px-1.5 py-0.5 text-[8px] uppercase tracking-wider font-mono font-bold bg-indigo-600 text-white rounded">
                    CURRENTLY ACTIVE
                  </span>
                )}

                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-lg shrink-0 ${
                    isCurrent 
                      ? "bg-indigo-600 text-white" 
                      : isDarkMode ? "bg-neutral-800 text-neutral-400 group-hover:text-neutral-200" : "bg-neutral-100 text-neutral-500"
                  }`}>
                    <Folder className="h-4.5 w-4.5" />
                  </div>
                  <div className="overflow-hidden pr-20">
                    <p className={`text-xs font-bold leading-none truncate ${
                      isDarkMode ? "text-neutral-200 group-hover:text-white" : "text-neutral-800"
                    }`}>
                      {proj.project_name}
                    </p>
                    <p className="text-[10px] text-neutral-400 mt-1 truncate">
                      Source Collection: {proj.collection_name || "Unassociated Link"}
                    </p>
                  </div>
                </div>

                {/* Meta details footer */}
                <div className="flex items-center justify-between text-[9px] font-mono text-neutral-500 border-t border-dashed border-neutral-800/20 pt-2.5 mt-1">
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    Sync: {new Date(proj.updated_at).toLocaleDateString()}
                  </span>
                  <span className="uppercase text-indigo-500/90 font-bold">
                    {proj.library || "requests"} mode
                  </span>
                </div>

                {/* Operations Hover Grid overlay */}
                <div className="absolute right-4 bottom-4 flex items-center gap-1.5 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    title="Duplicate project state"
                    onClick={(e) => handleDuplicate(e, proj.id)}
                    className={`p-1.5 rounded-md border ${borderCol} ${isDarkMode ? "bg-neutral-900 hover:bg-neutral-800 text-neutral-400 hover:text-white" : "bg-white hover:bg-neutral-100 text-neutral-600"} transition`}
                  >
                    <Copy className="h-3 w-3" />
                  </button>
                  <button
                    title="Permanently remove project files"
                    onClick={(e) => handleDelete(e, proj.id)}
                    className={`p-1.5 rounded-md border border-red-500/20 bg-red-500/5 hover:bg-red-500/10 text-red-400 transition`}
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                  <div className="p-1 px-2.5 rounded-md bg-indigo-600 text-white text-[10px] font-bold flex items-center gap-0.5">
                    Open
                    <ArrowRight className="h-3 w-3" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
