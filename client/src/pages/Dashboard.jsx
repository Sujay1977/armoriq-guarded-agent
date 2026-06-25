import React, { useState, useEffect, useCallback } from 'react';
import { Shield, Wrench, RefreshCw, ToggleLeft, ToggleRight, AlertTriangle, CheckCircle2, BrainCircuit, Activity, Menu } from 'lucide-react';
import { chatService } from '../services/chatService.js';
import { Sidebar } from '../components/chat/Sidebar.jsx';

const typeIcon = {
  prompt: <Shield className="w-4 h-4 text-red-500" />,
  tool:   <Wrench className="w-4 h-4 text-orange-500" />,
  policy: <AlertTriangle className="w-4 h-4 text-yellow-500" />,
  output: <BrainCircuit className="w-4 h-4 text-purple-500" />,
};

const typeLabel = { prompt: 'Prompt Guard', tool: 'Tool Guard', policy: 'Policy Guard', output: 'Output Guard' };

export const Dashboard = () => {
  const [rules, setRules]     = useState([]);
  const [tools, setTools]     = useState([]);
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');
  const [saving, setSaving]   = useState(null); // id of rule being saved

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [r, t, m] = await Promise.all([
        chatService.getGuardrailRules().catch(() => []),
        chatService.getTools().catch(() => []),
        chatService.getMetrics().catch(() => null),
      ]);
      setRules(Array.isArray(r) ? r : []);
      setTools(Array.isArray(t) ? t : []);
      setMetrics(m);
    } catch (e) {
      setError('Failed to load dashboard data.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const toggleRule = async (rule) => {
    setSaving(rule.id);
    const updated = { enabled: !rule.enabled };
    try {
      await chatService.updateGuardrailRule(rule.id, updated);
      setRules(prev => prev.map(r => r.id === rule.id ? { ...r, ...updated } : r));
    } catch {
      setError(`Failed to update rule "${rule.name}". Changes did not persist.`);
    } finally {
      setSaving(null);
    }
  };

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const grouped = rules.reduce((acc, rule) => {
    if (!acc[rule.type]) acc[rule.type] = [];
    acc[rule.type].push(rule);
    return acc;
  }, {});

  return (
    <div className="flex h-screen bg-white overflow-hidden">
      <Sidebar
        conversations={[]}
        activeConversationId={null}
        onSelectConversation={() => {}}
        onNewChat={() => {}}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />

      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile header */}
        <header className="md:hidden flex items-center p-4 border-b border-[var(--color-border)] bg-white z-10">
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="p-2 -ml-2 text-gray-500 hover:bg-gray-100 rounded-md"
          >
            <Menu className="w-6 h-6" />
          </button>
          <span className="ml-2 font-semibold text-[var(--color-text-main)]">ArmorIQ Guardrails</span>
        </header>

    <div className="flex-1 overflow-y-auto bg-[var(--color-background)] p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--color-text-main)]">Guardrails Dashboard</h1>
          <p className="text-sm text-gray-500 mt-1">Rule changes take effect immediately — no server restart required.</p>
        </div>
        <button
          onClick={load}
          className="flex items-center gap-2 px-3 py-2 text-sm bg-white border border-[var(--color-border)] rounded-lg hover:bg-gray-50 transition-colors text-[var(--color-text-main)]"
        >
          <RefreshCw className="w-4 h-4" />

          Refresh
        </button>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">{error}</div>
      )}

      {/* Metrics */}
      {metrics && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Total Requests', value: metrics.totalRequests, color: 'text-blue-600' },
            { label: 'Blocked',        value: metrics.blockedRequests, color: 'text-red-600' },
            { label: 'Injections',     value: metrics.promptInjections, color: 'text-orange-600' },
            { label: 'Jailbreaks',     value: metrics.jailbreakAttempts, color: 'text-purple-600' },
          ].map(({ label, value, color }) => (
            <div key={label} className="bg-white border border-[var(--color-border)] rounded-xl p-4 shadow-sm">
              <div className={`text-2xl font-bold ${color}`}>{value ?? 0}</div>
              <div className="text-xs text-gray-500 mt-1 uppercase tracking-wide">{label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Guardrail Rules */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--color-primary)]"></div>
        </div>
      ) : (
        <div className="space-y-4">
          {Object.entries(grouped).map(([type, typeRules]) => (
            <div key={type} className="bg-white border border-[var(--color-border)] rounded-xl shadow-sm overflow-hidden">
              <div className="flex items-center gap-2 px-4 py-3 bg-gray-50 border-b border-[var(--color-border)]">
                {typeIcon[type] || <Shield className="w-4 h-4" />}
                <span className="font-semibold text-sm text-[var(--color-text-main)]">{typeLabel[type] || type}</span>
                <span className="ml-auto text-xs text-gray-400">{typeRules.filter(r => r.enabled).length}/{typeRules.length} enabled</span>
              </div>
              <div className="divide-y divide-[var(--color-border)]">
                {typeRules.map(rule => (
                  <div key={rule.id} className={`flex items-center gap-3 px-4 py-3 transition-colors ${rule.enabled ? '' : 'bg-gray-50 opacity-70'}`}>
                    {rule.enabled
                      ? <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
                      : <AlertTriangle className="w-4 h-4 text-gray-300 flex-shrink-0" />
                    }
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-[var(--color-text-main)]">{rule.name}</div>
                      {rule.description && (
                        <div className="text-xs text-gray-400 truncate">{rule.description}</div>
                      )}
                      {rule.pattern && (
                        <div className="text-xs font-mono text-gray-300 truncate mt-0.5">{rule.pattern}</div>
                      )}
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      rule.severity === 'high' ? 'bg-red-100 text-red-700' :
                      rule.severity === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-green-100 text-green-700'
                    }`}>{rule.severity}</span>
                    <button
                      onClick={() => toggleRule(rule)}
                      disabled={saving === rule.id}
                      className="flex-shrink-0 ml-2 disabled:opacity-50"
                      title={rule.enabled ? 'Disable rule' : 'Enable rule'}
                    >
                      {saving === rule.id
                        ? <RefreshCw className="w-5 h-5 text-gray-400 animate-spin" />
                        : rule.enabled
                          ? <ToggleRight className="w-6 h-6 text-[var(--color-primary)]" />
                          : <ToggleLeft className="w-6 h-6 text-gray-300" />
                      }
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* MCP Tools Discovery */}
      <div className="bg-white border border-[var(--color-border)] rounded-xl shadow-sm overflow-hidden">
        <div className="flex items-center gap-2 px-4 py-3 bg-gray-50 border-b border-[var(--color-border)]">
          <Activity className="w-4 h-4 text-blue-500" />
          <span className="font-semibold text-sm text-[var(--color-text-main)]">MCP Tool Registry</span>
          <span className="ml-auto text-xs text-gray-400">Discovered dynamically from MCP server</span>
        </div>
        {tools.length === 0 ? (
          <div className="p-4 text-sm text-gray-400 italic">No tools discovered yet. The server may still be initialising.</div>
        ) : (
          <div className="divide-y divide-[var(--color-border)]">
            {tools.map(tool => (
              <div key={tool.name} className="flex items-center gap-3 px-4 py-3">
                <Wrench className="w-4 h-4 text-orange-400 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-[var(--color-text-main)]">{tool.name}</div>
                  <div className="text-xs text-gray-400">{tool.description}</div>
                </div>
                <span className="text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 font-medium">MCP</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
      </div>
    </div>
  );
};
