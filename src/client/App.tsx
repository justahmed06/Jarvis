import React, { useState, useEffect, useRef } from 'react';
import {
  PlanResponse,
  PlanStep,
  SessionState,
  LocalTask,
  WorkNote,
  LedgerEntry,
} from '../shared/types.js';
import { sampleScreenshots, SampleScreenshot, renderSvgToPng } from './sampleScreenshots.js';

interface HealthInfo {
  status: string;
  geminiConfigured: boolean;
  model: string;
}

/**
 * Robust JSON fetch wrapper that gracefully handles non-JSON, empty, or error responses.
 */
async function safeFetchJson<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, options);
  const text = await res.text();

  let data: any = {};
  if (text && text.trim().length > 0) {
    try {
      data = JSON.parse(text);
    } catch {
      throw new Error(`Server returned non-JSON response (${res.status} ${res.statusText}): ${text.slice(0, 180)}`);
    }
  }

  if (!res.ok) {
    const errorDetail = data?.message || data?.error || (data?.details ? data.details.join('; ') : '');
    throw new Error(errorDetail || `Request failed with status ${res.status} (${res.statusText})`);
  }

  return data as T;
}

export function App() {
  // Server and System State
  const [health, setHealth] = useState<HealthInfo | null>(null);
  const [session, setSession] = useState<SessionState>({
    tasks: [],
    notes: [],
    ledger: [],
  });

  // User Inputs
  const [image, setImage] = useState<{
    base64: string;
    mimeType: string;
    previewUrl: string;
    name: string;
  } | null>(null);
  const [goal, setGoal] = useState<string>(
    'Analyze this error and organize the steps I need to take next.'
  );

  // Workflow State
  const [isGenerating, setIsGenerating] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);
  const [currentPlan, setCurrentPlan] = useState<PlanResponse | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [statusNotice, setStatusNotice] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'workspace' | 'ledger'>('workspace');

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch initial health & session
  useEffect(() => {
    fetchHealth();
    fetchSession();
  }, []);

  // Listen for global clipboard paste (Ctrl+V)
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        if (items[i].type.startsWith('image/')) {
          const file = items[i].getAsFile();
          if (file) {
            handleImageFile(file);
            break;
          }
        }
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, []);

  const fetchHealth = async () => {
    try {
      const data = await safeFetchJson<HealthInfo>('/api/health');
      setHealth(data);
    } catch {
      setHealth({
        status: 'offline',
        geminiConfigured: false,
        model: 'gemini-3.8-flash',
      });
    }
  };

  const fetchSession = async () => {
    try {
      const data = await safeFetchJson<SessionState>('/api/session');
      setSession(data);
    } catch {
      // Resilience
    }
  };

  const handleImageFile = async (file: File) => {
    setErrorMsg(null);
    if (!file.type.startsWith('image/')) {
      setErrorMsg('Please select a valid image file (PNG, JPEG, WEBP, GIF)');
      return;
    }

    // If user uploaded an SVG directly, convert to high-res PNG for Gemini compatibility
    if (file.type === 'image/svg+xml') {
      try {
        const svgText = await file.text();
        const { dataUrl, mimeType } = await renderSvgToPng(svgText);
        const base64Data = dataUrl.includes(';base64,') ? dataUrl.split(';base64,')[1] : dataUrl;
        setImage({
          base64: base64Data,
          mimeType,
          previewUrl: dataUrl,
          name: file.name,
        });
        setStatusNotice(`Screenshot "${file.name}" converted and ready for analysis.`);
        return;
      } catch (err) {
        console.warn('SVG conversion fallback:', err);
      }
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const base64Data = result.includes(';base64,')
        ? result.split(';base64,')[1]
        : result;

      setImage({
        base64: base64Data,
        mimeType: file.type || 'image/png',
        previewUrl: result,
        name: file.name,
      });
      setStatusNotice(`Screenshot "${file.name}" loaded ready for analysis.`);
    };
    reader.readAsDataURL(file);
  };

  const selectSample = async (sample: SampleScreenshot) => {
    setErrorMsg(null);
    try {
      const { dataUrl, mimeType } = await renderSvgToPng(sample.getSvg());
      const base64Data = dataUrl.includes(';base64,')
        ? dataUrl.split(';base64,')[1]
        : dataUrl;

      setImage({
        base64: base64Data,
        mimeType,
        previewUrl: dataUrl,
        name: sample.name,
      });
      setGoal(sample.suggestedGoal);
      setStatusNotice(`Loaded sample: "${sample.name}"`);
    } catch (err) {
      setErrorMsg('Failed to render sample preset: ' + String(err));
    }
  };

  const handleGeneratePlan = async () => {
    if (!image) {
      setErrorMsg('Please upload a screenshot or choose a sample screenshot first.');
      return;
    }
    if (!goal.trim()) {
      setErrorMsg('Please enter a goal description.');
      return;
    }

    setIsGenerating(true);
    setErrorMsg(null);
    setStatusNotice(null);

    try {
      const plan = await safeFetchJson<PlanResponse>('/api/plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: image.base64,
          mimeType: image.mimeType,
          goal: goal.trim(),
        }),
      });

      setCurrentPlan(plan);
      setStatusNotice(
        `Gemini generated a ${plan.steps.length}-step bounded plan. Review and grant approval before execution.`
      );
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : String(err));
    } finally {
      setIsGenerating(false);
    }
  };

  const handleApproveAll = async () => {
    if (!currentPlan || currentPlan.steps.length === 0) return;

    setIsExecuting(true);
    setErrorMsg(null);

    try {
      const data = await safeFetchJson<{ state: SessionState; results: any[] }>('/api/execute-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ steps: currentPlan.steps }),
      });

      setSession(data.state);
      setCurrentPlan(null);
      setStatusNotice(
        `Plan successfully executed! ${data.results.length} action(s) recorded in session.`
      );
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : String(err));
      fetchSession();
    } finally {
      setIsExecuting(false);
    }
  };

  const handleApproveStep = async (step: PlanStep) => {
    setIsExecuting(true);
    setErrorMsg(null);

    try {
      const data = await safeFetchJson<{ state: SessionState; result: any }>('/api/execute-step', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ step }),
      });

      setSession(data.state);

      // Remove executed step from pending plan
      if (currentPlan) {
        const remaining = currentPlan.steps.filter((s) => s.id !== step.id);
        setCurrentPlan(remaining.length > 0 ? { ...currentPlan, steps: remaining } : null);
      }

      setStatusNotice(`Executed step "${step.tool}" successfully.`);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : String(err));
      fetchSession();
    } finally {
      setIsExecuting(false);
    }
  };

  const handleRejectPlan = async () => {
    if (!currentPlan) return;

    try {
      const data = await safeFetchJson<{ state: SessionState }>('/api/reject-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          steps: currentPlan.steps,
          reason: 'User explicitly declined proposed action plan',
        }),
      });

      setSession(data.state);
      setCurrentPlan(null);
      setStatusNotice('Plan rejected by user. Zero local actions were executed.');
    } catch (err) {
      setErrorMsg('Failed to record rejection: ' + String(err));
    }
  };

  const handleCompleteTask = async (taskId: string) => {
    try {
      const data = await safeFetchJson<{ state: SessionState }>('/api/execute-step', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          step: {
            id: `manual_${Date.now()}`,
            tool: 'mark_task_complete',
            args: { taskId },
            rationale: 'Marked complete by user via UI checkmark',
          },
        }),
      });
      setSession(data.state);
    } catch (err) {
      setErrorMsg('Failed to mark task complete: ' + String(err));
    }
  };

  const handleResetSession = async () => {
    if (!confirm('Reset current session (clears active tasks, notes, and ledger)?')) return;
    try {
      const data = await safeFetchJson<{ state: SessionState }>('/api/session/reset', { method: 'POST' });
      setSession(data.state);
      setCurrentPlan(null);
      setStatusNotice('Session reset to clean initial state.');
    } catch (err) {
      setErrorMsg('Failed to reset session: ' + String(err));
    }
  };

  const handleTestGemini = async () => {
    setStatusNotice('Testing Gemini API connectivity...');
    setErrorMsg(null);
    try {
      const data = await safeFetchJson<{ ok: boolean; model: string; error?: string }>('/api/test-gemini', {
        method: 'POST',
      });
      if (data.ok) {
        setStatusNotice(`Gemini API connection verified! Model: ${data.model}`);
        fetchHealth();
      } else {
        setErrorMsg(`Gemini test failed: ${data.error}`);
      }
    } catch (err) {
      setErrorMsg('Gemini test ping failed: ' + String(err));
    }
  };

  return (
    <div style={{ maxWidth: 1400, margin: '0 auto', padding: '1.5rem 1rem' }}>
      {/* Header */}
      <header
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem',
          paddingBottom: '1.25rem',
          marginBottom: '1.5rem',
          borderBottom: '1px solid var(--border-color)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
          <div
            style={{
              width: 42,
              height: 42,
              borderRadius: 10,
              background: 'linear-gradient(135deg, #06b6d4, #4f46e5)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.4rem',
              boxShadow: '0 4px 14px rgba(6, 182, 212, 0.35)',
            }}
          >
            ⚡
          </div>
          <div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 800, letterSpacing: '-0.025em' }}>
              <span className="gradient-text">Jarvis</span>{' '}
              <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                v1.0 (MLH Hack Day)
              </span>
            </h1>
            <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
              Supervised Agentic Workspace Companion powered by Google Gemini
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          {/* Gemini Health Status Pill */}
          <div
            className={`badge ${health?.geminiConfigured ? 'badge-green' : 'badge-amber'}`}
            style={{ padding: '0.35rem 0.75rem', cursor: 'pointer' }}
            title="Click to test Gemini API connection"
            onClick={handleTestGemini}
          >
            <span
              style={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                backgroundColor: health?.geminiConfigured ? '#10b981' : '#f59e0b',
                display: 'inline-block',
              }}
            />
            {health?.geminiConfigured
              ? `Gemini Connected (${health.model})`
              : 'Gemini Key Missing (.env)'}
          </div>

          <button
            className="btn btn-secondary"
            onClick={handleResetSession}
            style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem' }}
          >
            Clear Session
          </button>
        </div>
      </header>

      {/* Notifications and Alerts */}
      {errorMsg && (
        <div
          className="card"
          style={{
            padding: '0.85rem 1.25rem',
            marginBottom: '1.25rem',
            borderColor: 'rgba(239, 68, 68, 0.5)',
            backgroundColor: 'rgba(239, 68, 68, 0.1)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <span style={{ fontSize: '1.2rem' }}>⚠️</span>
            <div>
              <strong style={{ color: '#fca5a5', fontSize: '0.875rem' }}>Notice / Error:</strong>{' '}
              <span style={{ color: '#fecaca', fontSize: '0.875rem' }}>{errorMsg}</span>
            </div>
          </div>
          <button
            onClick={() => setErrorMsg(null)}
            style={{
              background: 'none',
              border: 'none',
              color: '#f87171',
              cursor: 'pointer',
              fontWeight: 700,
            }}
          >
            ✕
          </button>
        </div>
      )}

      {statusNotice && !errorMsg && (
        <div
          className="card"
          style={{
            padding: '0.75rem 1.25rem',
            marginBottom: '1.25rem',
            borderColor: 'rgba(16, 185, 129, 0.4)',
            backgroundColor: 'rgba(16, 185, 129, 0.08)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <span style={{ fontSize: '1.1rem' }}>✓</span>
            <span style={{ color: '#6ee7b7', fontSize: '0.875rem' }}>{statusNotice}</span>
          </div>
          <button
            onClick={() => setStatusNotice(null)}
            style={{
              background: 'none',
              border: 'none',
              color: '#34d399',
              cursor: 'pointer',
              fontWeight: 700,
            }}
          >
            ✕
          </button>
        </div>
      )}

      {/* Main Grid Layout */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(320px, 460px) 1fr',
          gap: '1.5rem',
          alignItems: 'start',
        }}
      >
        {/* Left Column: Input and Screenshot Selection */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Screenshot Input Card */}
          <div className="card" style={{ padding: '1.25rem' }}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '0.75rem',
              }}
            >
              <h2 style={{ fontSize: '1rem', fontWeight: 700 }}>1. Screen Context</h2>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Ctrl+V to paste screenshot
              </span>
            </div>

            {/* Quick Sample Selector */}
            <div style={{ marginBottom: '1rem' }}>
              <label
                style={{
                  display: 'block',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  color: 'var(--text-secondary)',
                  marginBottom: '0.4rem',
                }}
              >
                Quick Demo Presets:
              </label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                {sampleScreenshots.map((sample) => (
                  <button
                    key={sample.id}
                    className="btn btn-secondary"
                    onClick={() => selectSample(sample)}
                    style={{
                      fontSize: '0.75rem',
                      padding: '0.3rem 0.6rem',
                      borderColor:
                        image?.name === sample.name ? 'var(--accent-blue)' : undefined,
                      backgroundColor:
                        image?.name === sample.name
                          ? 'rgba(59, 130, 246, 0.15)'
                          : undefined,
                    }}
                  >
                    {sample.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Image Upload Box */}
            <div
              onClick={() => fileInputRef.current?.click()}
              style={{
                border: '2px dashed var(--border-color)',
                borderRadius: 8,
                padding: '1.25rem',
                textAlign: 'center',
                cursor: 'pointer',
                backgroundColor: 'rgba(17, 24, 39, 0.5)',
                transition: 'border-color 0.15s ease',
              }}
              onDragOver={(e) => {
                e.preventDefault();
                e.currentTarget.style.borderColor = 'var(--accent-blue)';
              }}
              onDragLeave={(e) => {
                e.currentTarget.style.borderColor = 'var(--border-color)';
              }}
              onDrop={(e) => {
                e.preventDefault();
                e.currentTarget.style.borderColor = 'var(--border-color)';
                if (e.dataTransfer.files?.[0]) {
                  handleImageFile(e.dataTransfer.files[0]);
                }
              }}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={(e) => {
                  if (e.target.files?.[0]) {
                    handleImageFile(e.target.files[0]);
                  }
                }}
              />
              {image ? (
                <div>
                  <img
                    src={image.previewUrl}
                    alt="Screenshot Preview"
                    style={{
                      maxWidth: '100%',
                      maxHeight: 220,
                      borderRadius: 6,
                      border: '1px solid var(--border-color)',
                      marginBottom: '0.5rem',
                      objectFit: 'contain',
                    }}
                  />
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      fontSize: '0.75rem',
                      color: 'var(--text-secondary)',
                    }}
                  >
                    <span
                      style={{
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        maxWidth: 240,
                      }}
                    >
                      {image.name}
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setImage(null);
                      }}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: 'var(--status-danger)',
                        cursor: 'pointer',
                        fontWeight: 600,
                      }}
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ) : (
                <div style={{ color: 'var(--text-secondary)' }}>
                  <div style={{ fontSize: '2rem', marginBottom: '0.35rem' }}>📸</div>
                  <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>
                    Click or Drag Screenshot Here
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    Supports PNG, JPEG, WEBP, GIF, or SVG
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Goal Input Card */}
          <div className="card" style={{ padding: '1.25rem' }}>
            <h2 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '0.75rem' }}>
              2. Describe Your Goal
            </h2>
            <textarea
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
              placeholder="e.g. Understand the TypeScript error and organize actionable steps to resolve it."
              rows={3}
              style={{
                width: '100%',
                backgroundColor: 'var(--bg-secondary)',
                border: '1px solid var(--border-color)',
                borderRadius: 8,
                padding: '0.75rem',
                color: 'var(--text-primary)',
                fontFamily: 'var(--font-sans)',
                fontSize: '0.875rem',
                resize: 'vertical',
                outline: 'none',
                marginBottom: '1rem',
              }}
            />

            <button
              className="btn btn-primary"
              onClick={handleGeneratePlan}
              disabled={isGenerating || !image || !goal.trim()}
              style={{ width: '100%', padding: '0.75rem' }}
            >
              {isGenerating ? (
                <>
                  <span style={{ animation: 'spin 1s linear infinite' }}>⏳</span>
                  Interpreting Screen & Planning...
                </>
              ) : (
                <>
                  <span>✨</span> Generate Structured Plan
                </>
              )}
            </button>
          </div>

          {/* Safety & Sandbox Ledger Notice */}
          <div
            className="card"
            style={{
              padding: '1rem',
              backgroundColor: 'rgba(31, 41, 55, 0.4)',
              fontSize: '0.75rem',
              color: 'var(--text-muted)',
              lineHeight: 1.4,
            }}
          >
            <div
              style={{
                fontWeight: 700,
                color: 'var(--text-secondary)',
                marginBottom: '0.35rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
              }}
            >
              <span>🛡️</span> Supervised Safety Sandbox
            </div>
            Jarvis executes only deterministic, allowlisted in-app tools (
            <code>create_local_task</code> and <code>append_work_note</code>). No arbitrary OS,
            shell commands, or unapproved file system actions are ever executed.
          </div>
        </div>

        {/* Right Column: Grounded Observations, Action Plan, Workspace & Ledger */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Grounded Observation & Plan View */}
          {currentPlan ? (
            <div
              className="card"
              style={{
                padding: '1.25rem',
                borderColor: 'var(--accent-indigo)',
                boxShadow: '0 4px 20px rgba(99, 102, 241, 0.15)',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '1rem',
                  flexWrap: 'wrap',
                  gap: '0.5rem',
                }}
              >
                <div>
                  <h2 style={{ fontSize: '1.125rem', fontWeight: 800 }}>
                    Proposed Action Plan ({currentPlan.steps.length} Steps)
                  </h2>
                  <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                    Requires explicit user approval before any local action is executed.
                  </p>
                </div>
                <div className="badge badge-purple">
                  Confidence: {currentPlan.confidence || 'high'}
                </div>
              </div>

              {/* Visual Observation */}
              <div
                style={{
                  backgroundColor: 'rgba(17, 24, 39, 0.7)',
                  borderRadius: 8,
                  padding: '0.85rem 1rem',
                  marginBottom: '0.75rem',
                  borderLeft: '3px solid var(--accent-cyan)',
                }}
              >
                <div
                  style={{
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    color: 'var(--accent-cyan)',
                    textTransform: 'uppercase',
                    marginBottom: '0.25rem',
                  }}
                >
                  👁️ Grounded Visual Observation
                </div>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-primary)' }}>
                  {currentPlan.observation}
                </p>
              </div>

              {/* Goal Interpretation */}
              <div
                style={{
                  backgroundColor: 'rgba(17, 24, 39, 0.7)',
                  borderRadius: 8,
                  padding: '0.85rem 1rem',
                  marginBottom: '1.25rem',
                  borderLeft: '3px solid var(--accent-indigo)',
                }}
              >
                <div
                  style={{
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    color: '#a5b4fc',
                    textTransform: 'uppercase',
                    marginBottom: '0.25rem',
                  }}
                >
                  🎯 Goal Interpretation
                </div>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-primary)' }}>
                  {currentPlan.goalInterpretation}
                </p>
              </div>

              {/* Bounded Steps List */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.25rem' }}>
                {currentPlan.steps.map((step, idx) => (
                  <div
                    key={step.id}
                    style={{
                      border: '1px solid var(--border-color)',
                      borderRadius: 8,
                      padding: '0.85rem 1rem',
                      backgroundColor: 'var(--bg-secondary)',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      gap: '1rem',
                      flexWrap: 'wrap',
                    }}
                  >
                    <div style={{ flex: 1, minWidth: 260 }}>
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem',
                          marginBottom: '0.35rem',
                        }}
                      >
                        <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>
                          Step {idx + 1} ({step.id}):
                        </span>
                        <span className="badge badge-blue">{step.tool}</span>
                      </div>
                      <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                        {step.rationale}
                      </div>
                      <div
                        style={{
                          fontSize: '0.75rem',
                          color: 'var(--text-secondary)',
                          marginTop: '0.35rem',
                          fontFamily: 'var(--font-mono)',
                          backgroundColor: 'rgba(0,0,0,0.3)',
                          padding: '0.3rem 0.5rem',
                          borderRadius: 4,
                          display: 'inline-block',
                        }}
                      >
                        {JSON.stringify(step.args)}
                      </div>
                    </div>

                    <button
                      className="btn btn-secondary"
                      onClick={() => handleApproveStep(step)}
                      disabled={isExecuting}
                      style={{ fontSize: '0.75rem', padding: '0.4rem 0.75rem' }}
                    >
                      Approve This Step
                    </button>
                  </div>
                ))}
              </div>

              {/* Approval Controls */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: '1rem',
                  paddingTop: '0.75rem',
                  borderTop: '1px solid var(--border-color)',
                  flexWrap: 'wrap',
                }}
              >
                <button
                  className="btn btn-danger"
                  onClick={handleRejectPlan}
                  disabled={isExecuting}
                >
                  ✕ Reject Plan (Zero Side Effects)
                </button>

                <button
                  className="btn btn-success"
                  onClick={handleApproveAll}
                  disabled={isExecuting}
                  style={{ padding: '0.6rem 1.25rem', fontSize: '0.9rem' }}
                >
                  {isExecuting ? 'Executing Approved Actions...' : '✓ Approve & Execute All Steps'}
                </button>
              </div>
            </div>
          ) : (
            <div
              className="card"
              style={{
                padding: '2rem',
                textAlign: 'center',
                color: 'var(--text-secondary)',
                borderStyle: 'dashed',
              }}
            >
              <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>💡</div>
              <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text-primary)' }}>
                No Pending Plan
              </div>
              <p style={{ fontSize: '0.875rem', maxWidth: 450, margin: '0.5rem auto' }}>
                Upload a screenshot or click a preset on the left, then click{' '}
                <strong style={{ color: 'var(--text-primary)' }}>"Generate Structured Plan"</strong> to
                have Jarvis analyze the visual evidence and propose safe local steps.
              </p>
            </div>
          )}

          {/* Workspace Tabs: Local Tasks & Notes vs. Execution Ledger */}
          <div className="card" style={{ padding: '1.25rem' }}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                borderBottom: '1px solid var(--border-color)',
                paddingBottom: '0.75rem',
                marginBottom: '1rem',
              }}
            >
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                  className={`btn ${activeTab === 'workspace' ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => setActiveTab('workspace')}
                  style={{ fontSize: '0.8125rem', padding: '0.4rem 0.85rem' }}
                >
                  Active Workspace ({session.tasks.length} tasks, {session.notes.length} notes)
                </button>
                <button
                  className={`btn ${activeTab === 'ledger' ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => setActiveTab('ledger')}
                  style={{ fontSize: '0.8125rem', padding: '0.4rem 0.85rem' }}
                >
                  Execution Ledger ({session.ledger.length} events)
                </button>
              </div>

              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Verified in-memory session state
              </span>
            </div>

            {/* TAB 1: WORKSPACE */}
            {activeTab === 'workspace' && (
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                  gap: '1rem',
                }}
              >
                {/* Active Local Tasks Column */}
                <div>
                  <h3
                    style={{
                      fontSize: '0.875rem',
                      fontWeight: 700,
                      color: 'var(--accent-blue)',
                      marginBottom: '0.75rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                    }}
                  >
                    <span>📋</span> Local Tasks ({session.tasks.length})
                  </h3>

                  {session.tasks.length === 0 ? (
                    <div
                      style={{
                        padding: '1.5rem',
                        textAlign: 'center',
                        fontSize: '0.8125rem',
                        color: 'var(--text-muted)',
                        backgroundColor: 'rgba(17, 24, 39, 0.4)',
                        borderRadius: 8,
                      }}
                    >
                      No tasks created yet.
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      {session.tasks.map((task: LocalTask) => (
                        <div
                          key={task.id}
                          style={{
                            padding: '0.75rem',
                            borderRadius: 8,
                            backgroundColor: 'var(--bg-secondary)',
                            border: '1px solid var(--border-color)',
                            display: 'flex',
                            alignItems: 'flex-start',
                            gap: '0.65rem',
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={task.status === 'completed'}
                            onChange={() => handleCompleteTask(task.id)}
                            style={{ marginTop: '0.2rem', cursor: 'pointer' }}
                          />
                          <div style={{ flex: 1 }}>
                            <div
                              style={{
                                fontSize: '0.875rem',
                                fontWeight: 600,
                                textDecoration:
                                  task.status === 'completed' ? 'line-through' : 'none',
                                color:
                                  task.status === 'completed'
                                    ? 'var(--text-muted)'
                                    : 'var(--text-primary)',
                              }}
                            >
                              {task.title}
                            </div>
                            {task.description && (
                              <div
                                style={{
                                  fontSize: '0.75rem',
                                  color: 'var(--text-secondary)',
                                  marginTop: '0.2rem',
                                }}
                              >
                                {task.description}
                              </div>
                            )}
                            <div
                              style={{
                                fontSize: '0.6875rem',
                                color: 'var(--text-muted)',
                                marginTop: '0.35rem',
                                fontFamily: 'var(--font-mono)',
                              }}
                            >
                              ID: {task.id} • {new Date(task.createdAt).toLocaleTimeString()}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Work Notes Column */}
                <div>
                  <h3
                    style={{
                      fontSize: '0.875rem',
                      fontWeight: 700,
                      color: 'var(--accent-purple)',
                      marginBottom: '0.75rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                    }}
                  >
                    <span>📝</span> Work Notes ({session.notes.length})
                  </h3>

                  {session.notes.length === 0 ? (
                    <div
                      style={{
                        padding: '1.5rem',
                        textAlign: 'center',
                        fontSize: '0.8125rem',
                        color: 'var(--text-muted)',
                        backgroundColor: 'rgba(17, 24, 39, 0.4)',
                        borderRadius: 8,
                      }}
                    >
                      No work notes recorded yet.
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      {session.notes.map((note: WorkNote) => (
                        <div
                          key={note.id}
                          style={{
                            padding: '0.75rem',
                            borderRadius: 8,
                            backgroundColor: 'var(--bg-secondary)',
                            border: '1px solid var(--border-color)',
                          }}
                        >
                          <div
                            style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              marginBottom: '0.35rem',
                            }}
                          >
                            <span className="badge badge-purple">{note.category}</span>
                            <span
                              style={{
                                fontSize: '0.6875rem',
                                color: 'var(--text-muted)',
                                fontFamily: 'var(--font-mono)',
                              }}
                            >
                              {new Date(note.createdAt).toLocaleTimeString()}
                            </span>
                          </div>
                          <div
                            style={{
                              fontSize: '0.8125rem',
                              color: 'var(--text-primary)',
                              whiteSpace: 'pre-wrap',
                            }}
                          >
                            {note.text}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TAB 2: EXECUTION LEDGER */}
            {activeTab === 'ledger' && (
              <div>
                {session.ledger.length === 0 ? (
                  <div
                    style={{
                      padding: '2rem',
                      textAlign: 'center',
                      fontSize: '0.875rem',
                      color: 'var(--text-muted)',
                    }}
                  >
                    Ledger is currently empty. Executed actions or rejections will be recorded here.
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                    {session.ledger.map((entry: LedgerEntry, idx: number) => {
                      const isSuccess = entry.status === 'succeeded';
                      const isRejected = entry.status === 'rejected';
                      const isFailed = entry.status === 'failed';

                      return (
                        <div
                          key={`${entry.stepId}-${idx}`}
                          style={{
                            border: '1px solid var(--border-color)',
                            borderRadius: 8,
                            padding: '0.75rem 1rem',
                            backgroundColor: 'var(--bg-secondary)',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            flexWrap: 'wrap',
                            gap: '0.75rem',
                          }}
                        >
                          <div>
                            <div
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem',
                                marginBottom: '0.25rem',
                              }}
                            >
                              <span
                                className={`badge ${
                                  isSuccess
                                    ? 'badge-green'
                                    : isRejected
                                    ? 'badge-amber'
                                    : isFailed
                                    ? 'badge-red'
                                    : 'badge-blue'
                                }`}
                              >
                                {entry.status.toUpperCase()}
                              </span>
                              <span
                                style={{
                                  fontSize: '0.8125rem',
                                  fontFamily: 'var(--font-mono)',
                                  fontWeight: 600,
                                }}
                              >
                                {entry.tool}
                              </span>
                              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                ({entry.stepId})
                              </span>
                            </div>

                            {entry.result && (
                              <div
                                style={{
                                  fontSize: '0.75rem',
                                  fontFamily: 'var(--font-mono)',
                                  color: '#34d399',
                                  marginTop: '0.2rem',
                                }}
                              >
                                Result: {JSON.stringify(entry.result)}
                              </div>
                            )}

                            {entry.error && (
                              <div
                                style={{
                                  fontSize: '0.75rem',
                                  color: '#f87171',
                                  marginTop: '0.2rem',
                                }}
                              >
                                Detail: {entry.error}
                              </div>
                            )}
                          </div>

                          <div
                            style={{
                              fontSize: '0.6875rem',
                              color: 'var(--text-muted)',
                              fontFamily: 'var(--font-mono)',
                              textAlign: 'right',
                            }}
                          >
                            <div>{new Date(entry.timestamp).toLocaleTimeString()}</div>
                            {entry.durationMs !== undefined && <div>{entry.durationMs}ms</div>}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
export default App;
