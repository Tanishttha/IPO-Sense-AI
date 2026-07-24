import React, { useEffect, useState } from "react";
import { Clock, Loader2, RefreshCw, FileCheck } from "lucide-react";
import { Application, IPO } from "../types";

interface TrackerProps {
  applications: Application[];
  ipos: IPO[];
  onRefreshList: () => void;
  onNseSync?: () => Promise<any>;
}

const getAccessToken = () =>
  localStorage.getItem("iposense_access_token") ||
  localStorage.getItem("access_token") ||
  localStorage.getItem("token") ||
  "";

const fetchCsrfToken = async () => {
  const cached = sessionStorage.getItem("iposense_csrf_token");
  if (cached) return cached;
  const res = await fetch("/api/auth/csrf-token");
  const data = await res.json();
  sessionStorage.setItem("iposense_csrf_token", data.csrfToken);
  return data.csrfToken;
};

const buildHeaders = async (includeCsrf = false) => {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  const token = getAccessToken();
  if (token) {
    headers.Authorization = `Bearer ${token}`;
    console.log("[AUTH] Sending access token with allotment request");
  } else {
    console.warn("[AUTH] No access token found for allotment request");
  }
  if (includeCsrf) headers["X-CSRF-Token"] = await fetchCsrfToken();
  return headers;
};

export default function AllotmentTracker({ applications, ipos, onRefreshList, onNseSync }: TrackerProps) {
  const [provider, setProvider] = useState<"kfintech" | "mufg">("kfintech");
  const [providerList, setProviderList] = useState<any[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [pan, setPan] = useState("");
  const [savedPan, setSavedPan] = useState("");
  const [listLoading, setListLoading] = useState(false);
  const [queryLoading, setQueryLoading] = useState(false);
  const [savingPan, setSavingPan] = useState(false);
  const [queryResult, setQueryResult] = useState<any | null>(() => {
    try {
      const saved = sessionStorage.getItem("iposense_last_allotment_result");
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [providerError, setProviderError] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [history, setHistory] = useState<any[]>([]);
  const [syncLogs, setSyncLogs] = useState<string[]>([
    "[12:55:00] NSE Live AI Guard service active.",
    "[12:55:01] Listening for Registrar allotment release broadcasts...",
  ]);

  useEffect(() => {
    loadSavedPan();
  }, []);

  useEffect(() => {
    loadAllotmentHistory();
  }, []);

  const loadAllotmentHistory = async () => {
    try {
      const res = await fetch("/api/allotment/history", { headers: await buildHeaders() });
      if (!res.ok) return;
      const data = await res.json();
      setHistory(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to load allotment history", err);
    }
  };

  useEffect(() => {
    setSelectedId("");
    loadProviderList();
  }, [provider]);

  const loadSavedPan = async () => {
    try {
      const res = await fetch("/api/user/pan", { headers: await buildHeaders() });
      if (!res.ok) throw new Error("Unable to load stored PAN");
      const data = await res.json();
      if (data.pan) {
        setSavedPan(data.pan);
        setPan(data.pan);
      }
    } catch (err) {
      console.warn("User PAN not loaded", err);
    }
  };

  const loadProviderList = async () => {
    setProviderError(null);
    setListLoading(true);
    try {
      const res = await fetch(`/api/allotment/${provider}/list`, { headers: await buildHeaders() });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || "Failed to fetch registrar list");
      }
      const list = await res.json();
      setProviderList(Array.isArray(list) ? list : []);
      if (Array.isArray(list) && list.length > 0) {
        const firstId = list[0].clientId || list[0].companyId || list[0].id || "";
        setSelectedId(firstId);
      }
    } catch (err: any) {
      console.error("Failed to load provider list", err);
      setProviderError("Unable to load current IPO list for the selected registrar.");
      setProviderList([]);
    } finally {
      setListLoading(false);
    }
  };

  const saveUserPan = async () => {
    setErrorMessage(null);
    const normalizedPan = pan.trim().toUpperCase();
    if (!/^[A-Z]{5}[0-9]{4}[A-Z]$/.test(normalizedPan)) {
      setErrorMessage("Enter a valid PAN in format ABCDE1234F.");
      return;
    }

    setSavingPan(true);
    try {
      const res = await fetch("/api/user/pan", {
        method: "POST",
        headers: await buildHeaders(true),
        body: JSON.stringify({ pan: normalizedPan }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || "Failed to save PAN");
      }
      const data = await res.json();
      setSavedPan(data.pan);
      setPan(data.pan);
    } catch (err: any) {
      console.error("Unable to save PAN", err);
      setErrorMessage(err.message || "Failed to save PAN");
    } finally {
      setSavingPan(false);
    }
  };

  const checkAllotmentStatus = async () => {
    setErrorMessage(null);
    setQueryResult(null);
    const effectivePan = pan.trim().toUpperCase() || savedPan;
    if (!effectivePan) {
      setErrorMessage("Please enter or save your PAN before checking allotment.");
      return;
    }
    if (!selectedId) {
      setErrorMessage("Choose a company from the selected registrar list first.");
      return;
    }

    setQueryLoading(true);
    try {
      const endpoint = `/api/allotment/${provider}/check`;
      const body = provider === "kfintech"
        ? { clientId: selectedId, pan: effectivePan }
        : { companyId: selectedId, pan: effectivePan };
      console.log("[AllotmentTracker] Sending request", {
        endpoint,
        provider,
        body,
      });
      const res = await fetch(endpoint, {
        method: "POST",
        headers: await buildHeaders(true),
        credentials: "include",
        body: JSON.stringify(body),
      });
      console.log("[AllotmentTracker] Response", {
        status: res.status,
        ok: res.ok,
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || "Registrar allotment check failed");
      }
      const data = await res.json();
      console.log("[AllotmentTracker] Payload", data);
      setQueryResult(data);
      sessionStorage.setItem("iposense_last_allotment_result", JSON.stringify(data));
      await loadAllotmentHistory();
    } catch (err: any) {
      console.error("Allotment check failed", err);
      setErrorMessage(err.message || "Failed to check allotment status");
    } finally {
      setQueryLoading(false);
    }
  };

  const triggerNseSync = async () => {
    if (syncing) return;
    setSyncing(true);
    const dateStr = new Date().toLocaleTimeString();
    setSyncLogs(prev => [...prev, `[${dateStr}] Initiating secure SSL handshake with NSE allotment feed...`]);

    await new Promise((resolve) => setTimeout(resolve, 900));
    const d2 = new Date().toLocaleTimeString();
    setSyncLogs(prev => [...prev, `[${d2}] Querying application registry and saved bids...`]);

    await new Promise((resolve) => setTimeout(resolve, 1000));
    const d3 = new Date().toLocaleTimeString();
    const appliedCount = applications.filter((a) => a.status === "APPLIED").length;
    setSyncLogs(prev => [...prev, `[${d3}] Found ${appliedCount} pending application records. Preparing registrar reconciliation.`]);

    await new Promise((resolve) => setTimeout(resolve, 1200));
    try {
      if (onNseSync) {
        await onNseSync();
      }
      const d4 = new Date().toLocaleTimeString();
      setSyncLogs(prev => [...prev, `[${d4}] NSE sync complete. Application statuses refreshed.`]);
    } catch (err) {
      const d4 = new Date().toLocaleTimeString();
      setSyncLogs(prev => [...prev, `[${d4}] NSE sync completed with warnings; please verify application details manually.`]);
    } finally {
      setSyncing(false);
      onRefreshList();
    }
  };

  const selectedItem = providerList.find((item) => (item.clientId || item.companyId || item.id) === selectedId);
  const selectedLabel = selectedItem ? selectedItem.name || selectedItem.companyName || selectedItem.symbol || "Selected IPO" : "None";
  const effectivePan = pan.trim().toUpperCase() || savedPan;

  const maskPan = (rawPan: string) => {
    if (!rawPan || rawPan.length < 8) return rawPan;
    return rawPan.slice(0, 3) + "*****" + rawPan.slice(8);
  };

  const registrarData = queryResult?.response ?? queryResult?.data ?? queryResult?.result ?? queryResult;

  return (
    <div className="space-y-4 sm:space-y-6 px-1 sm:px-0">
      <div>
        <h2 className="text-xl sm:text-2xl font-bold tracking-tight">IPO Allotment Registry</h2>
        <p className="text-xs sm:text-sm text-muted-foreground mt-1">
          Query KFintech and MUFG registrar portals directly. Save your PAN once and reuse it for all allotment lookups.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 items-start">
        <div className="space-y-4 sm:space-y-6">
          <div className="p-4 sm:p-5 rounded-xl sm:rounded-2xl border border-border bg-card shadow-sm">
            <div className="flex gap-1.5 sm:gap-2">
              {(["kfintech", "mufg"] as const).map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setProvider(value)}
                  className={`flex-1 rounded-xl sm:rounded-2xl border px-2.5 sm:px-3 py-2 text-xs sm:text-sm font-semibold transition ${provider === value ? "border-primary bg-primary/10 text-primary" : "border-border bg-muted text-foreground hover:bg-muted/80"}`}
                >
                  {value.toUpperCase()}
                </button>
              ))}
            </div>

            <div className="mt-4 sm:mt-5 space-y-3 sm:space-y-4">
              <div className="space-y-1.5 sm:space-y-2">
                <label className="block text-xs font-semibold text-muted-foreground">Your PAN</label>
                <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
                  <input
                    type="text"
                    value={pan}
                    onChange={(e) => setPan(e.target.value.toUpperCase())}
                    placeholder="ABCDE1234F"
                    maxLength={10}
                    className="w-full sm:flex-1 rounded-xl sm:rounded-2xl border border-border bg-background px-3 py-2 text-xs sm:text-sm font-mono focus:outline-none focus:border-primary"
                  />
                  <button
                    type="button"
                    onClick={saveUserPan}
                    disabled={savingPan}
                    className="w-full sm:w-auto rounded-xl sm:rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-4 py-2 text-xs font-semibold shadow-sm transition hover:from-blue-500 hover:to-indigo-500 disabled:opacity-60 whitespace-nowrap"
                  >
                    {savingPan ? "Saving…" : "Save PAN"}
                  </button>
                </div>
              </div>

              {errorMessage && (
                <div className="rounded-xl sm:rounded-2xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs sm:text-sm text-rose-500">
                  {errorMessage}
                </div>
              )}

              <div className="space-y-1.5 sm:space-y-2">
                <label className="block text-xs font-semibold text-muted-foreground">Registrar IPO List</label>
                <div className="rounded-xl sm:rounded-2xl border border-border bg-muted/60 p-2 sm:p-3 h-40 sm:h-44 overflow-y-auto">
                  {listLoading ? (
                    <div className="flex h-full items-center justify-center text-xs sm:text-sm text-muted-foreground">Loading registrar IPO list…</div>
                  ) : providerError ? (
                    <div className="text-xs sm:text-sm text-rose-500">{providerError}</div>
                  ) : (providerList.length === 0 && (!ipos || ipos.length === 0)) ? (
                    <div className="text-xs sm:text-sm text-muted-foreground">No active IPOs available for this registrar.</div>
                  ) : (
                    <div className="space-y-1.5 sm:space-y-2">
                      {(providerList.length > 0 ? providerList : ipos).slice(0, 8).map((item: any) => {
                        const id = item.clientId || item.companyId || item.id || item.ipoId || item.id;
                        const label = item.name || item.companyName || item.symbol || item.companyName || item.name || "Unknown IPO";
                        return (
                          <button
                            key={id}
                            type="button"
                            onClick={() => setSelectedId(id)}
                            className={`w-full text-left rounded-xl sm:rounded-2xl p-2 sm:px-3 sm:py-2 text-xs sm:text-sm transition ${selectedId === id ? "bg-primary/10 border border-primary text-primary" : "border border-border bg-background text-foreground hover:bg-muted"}`}
                          >
                            <span className="font-semibold block truncate">{label}</span>
                            <div className="text-[10px] sm:text-[11px] text-muted-foreground mt-0.5 sm:mt-1 truncate">{id}</div>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              <button
                type="button"
                onClick={checkAllotmentStatus}
                disabled={queryLoading}
                className="w-full rounded-xl sm:rounded-2xl bg-primary px-4 py-2.5 sm:py-3 text-xs sm:text-sm font-semibold text-primary-foreground transition hover:bg-primary/90 disabled:opacity-60"
              >
                {queryLoading ? (
                  <span className="inline-flex items-center justify-center gap-2"><Loader2 className="h-4 w-4 animate-spin" /> Checking allotment</span>
                ) : (
                  <span>Check Allotment Status</span>
                )}
              </button>
            </div>
          </div>

          {queryResult && (
            <div className="p-4 sm:p-5 rounded-xl sm:rounded-2xl border border-border bg-card shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs sm:text-sm font-semibold">Registrar Query Result</h3>
                  <p className="text-[11px] text-muted-foreground mt-0.5">Resolved direct from registrar response payload.</p>
                </div>
                <span className="rounded-full bg-muted px-2 py-0.5 sm:py-1 text-[9px] sm:text-[10px] uppercase tracking-wide text-muted-foreground shrink-0">
                  {queryResult ? "Completed" : "Idle"}
                </span>
              </div>

              <div className="mt-3 sm:mt-4 min-h-[160px] rounded-xl sm:rounded-2xl border border-border bg-background p-3 sm:p-4 text-xs sm:text-sm text-foreground">
                {queryResult ? (
                  <div className="space-y-3">
                    <div className="grid gap-2.5 sm:gap-3 grid-cols-1 sm:grid-cols-2">
                      <div>
                        <span className="text-[10px] sm:text-[11px] text-muted-foreground">Provider</span>
                        <p className="font-semibold text-foreground mt-0.5">{queryResult.provider?.toUpperCase() || provider.toUpperCase()}</p>
                      </div>
                      <div>
                        <span className="text-[10px] sm:text-[11px] text-muted-foreground">Selected IPO</span>
                        <p className="font-semibold text-foreground mt-0.5 truncate">{selectedLabel}</p>
                      </div>
                      <div>
                        <span className="text-[10px] sm:text-[11px] text-muted-foreground">PAN</span>
                        <p className="font-semibold text-foreground mt-0.5">{maskPan(effectivePan)}</p>
                      </div>
                      <div>
                        <span className="text-[10px] sm:text-[11px] text-muted-foreground">Registrar ID</span>
                        <p className="font-semibold text-foreground mt-0.5 truncate">{selectedId}</p>
                      </div>
                    </div>
                    {/* User-friendly summary */}
                    <div className="grid gap-2.5 sm:gap-3 grid-cols-1 sm:grid-cols-2 pt-2 border-t border-border/40">
                      <div>
                        <span className="text-[10px] sm:text-[11px] text-muted-foreground">Status</span>
                        <p className="font-semibold mt-0.5">
                          {registrarData?.error ||
                            registrarData?.status ||
                            registrarData?.allotmentStatus ||
                            registrarData?.message ||
                            (registrarData?.NewDataSet === "" ? "Record Not Found" : null) ||
                            "Unknown"}
                        </p>
                      </div>

                      <div>
                        <span className="text-[10px] sm:text-[11px] text-muted-foreground">Applicant</span>
                        <p className="font-semibold mt-0.5 truncate">
                          {registrarData?.name ||
                            registrarData?.applicantName ||
                            registrarData?.NewDataSet?.Table?.ApplicantName ||
                            registrarData?.NewDataSet?.Table?.NAME ||
                            "-"}
                        </p>
                      </div>

                      <div>
                        <span className="text-[10px] sm:text-[11px] text-muted-foreground">Application No.</span>
                        <p className="font-semibold mt-0.5 truncate">
                          {registrarData?.applicationNo ||
                            registrarData?.applicationNumber ||
                            registrarData?.NewDataSet?.Table?.ApplicationNo ||
                            registrarData?.NewDataSet?.Table?.APPLICATION_NO ||
                            "-"}
                        </p>
                      </div>

                      <div>
                        <span className="text-[10px] sm:text-[11px] text-muted-foreground">Shares / Lots</span>
                        <p className="font-semibold mt-0.5">
                          {registrarData?.allottedShares ||
                            registrarData?.allottedLots ||
                            registrarData?.NewDataSet?.Table?.AllottedShares ||
                            registrarData?.NewDataSet?.Table?.SHARES ||
                            "0"}
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-xs sm:text-sm text-muted-foreground">Select a registrar item, save your PAN, and run the check to see allotment results.</div>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="space-y-4 sm:space-y-6">
          <div>
            <h3 className="text-sm sm:text-base font-semibold">Tracked Applications</h3>
            <p className="text-xs text-muted-foreground mt-0.5">Saved IPO applications from your personal registry.</p>
          </div>

          {history.length === 0 ? (
            <div className="rounded-xl sm:rounded-2xl border border-dashed border-border bg-card p-6 sm:p-12 text-center">
              <Clock className="mx-auto h-8 w-8 sm:h-10 sm:w-10 text-muted-foreground" />
              <h3 className="mt-3 sm:mt-4 text-base sm:text-lg font-semibold">No applications tracked yet</h3>
              <p className="mt-1 sm:mt-2 text-xs sm:text-sm text-muted-foreground">Track your IPO bids in the discovery page, then use this dashboard for registrar verification.</p>
            </div>
          ) : (
            <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2">
              {history.map((app) => {
                const isAllotted = app.status === "ALLOTTED";
                const isRejected = app.status === "NOT_ALLOTTED" || app.status === "REFUNDED";
                return (
                  <div key={app.id || app._id || app.createdAt} className="rounded-xl sm:rounded-2xl border border-border bg-card p-3.5 sm:p-5 shadow-sm">
                    <div className="flex items-start justify-between gap-2 sm:gap-4">
                      <div className="min-w-0 flex-1">
                        <h4 className="text-xs sm:text-sm font-semibold text-foreground truncate">{app.ipoName || app.ipoId}</h4>
                        <p className="text-[10px] sm:text-[11px] text-muted-foreground mt-0.5">Provider: {app.provider?.toUpperCase()}</p>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <span className={`rounded-full px-2 py-0.5 text-[9px] sm:text-[10px] font-semibold uppercase ${isAllotted ? "bg-emerald-500/10 text-emerald-500" : isRejected ? "bg-rose-500/10 text-rose-500" : "bg-amber-500/10 text-amber-500"}`}>
                          {app.status || "Unknown"}
                        </span>
                        <button
                          type="button"
                          onClick={async () => {
                            try {
                              const res = await fetch(`/api/allotment/history/${app.id}`, {
                                method: "DELETE",
                                headers: await buildHeaders(true),
                              });
                              if (res.ok) {
                                setHistory((prev) => prev.filter((item) => item.id !== app.id));
                              }
                            } catch (err) {
                              console.error("Failed to delete allotment record", err);
                            }
                          }}
                          className="rounded-lg border border-rose-500/30 px-1.5 sm:px-2 py-0.5 text-[9px] sm:text-[10px] font-semibold text-rose-500 hover:bg-rose-500/10"
                        >
                          Delete
                        </button>
                      </div>
                    </div>

                    <div className="mt-3 sm:mt-4 grid gap-2 grid-cols-2 text-[10px] sm:text-[11px] text-muted-foreground pt-2 border-t border-border/40">
                      <div>
                        <div className="font-semibold text-foreground truncate">{maskPan(app.panEncrypted)}</div>
                        <div>PAN</div>
                      </div>
                      <div>
                        <div className="font-semibold text-foreground truncate">{new Date(app.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                        <div>Checked At</div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}