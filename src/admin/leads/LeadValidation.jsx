// ─── LeadValidation.js ───────────────────────────────────────────────────────
// All lead score normalization, phone/email verification display,
// hot/warm/cold classification, and AI qualification badge rendering.
// Import and call these in ViewLeads, LeadDrawer wherever needed.
// Backend is NOT changed — this is pure frontend normalization.
// ─────────────────────────────────────────────────────────────────────────────

// ─── 1. Score Normalizer ─────────────────────────────────────────────────────
export const normalizeLeadScores = (l) => {
  const bestScore =
    l.authenticityScore > 0
      ? l.authenticityScore
      : l.score || 0;

  const phoneVerified =
    l.phoneVerified === true
      ? true
      : l.phoneValidation?.isValid === true
      ? true
      : false;

  const emailVerified =
    l.emailVerified === true
      ? true
      : l.emailValidation?.isValid === true
      ? true
      : false;

  const priorityTag =
    l.priorityTag ||
    (bestScore >= 75
      ? "Hot Lead"
      : bestScore >= 50
      ? "Warm Lead"
      : "Cold Lead");

  const leadTemperature =
    l.leadTemperature ||
    (priorityTag === "Hot Lead"
      ? "Hot"
      : priorityTag === "Warm Lead"
      ? "Warm"
      : "Cold");

  const scoreBreakdown = l.scoreBreakdown || {
    sourceScore: 0,
    billScore: 0,
    completenessScore: 0,
    engagementScore: 0,
    aiIntent: 0,
    emailTrust: 0,
    phoneTrust: 0,
    duplicateRisk: 0,
    engagement: 0,
  };

  return {
    ...l,
    authenticityScore: bestScore,
    score: l.score || bestScore,
    phoneVerified,
    emailVerified,
    priorityTag,
    leadTemperature,
    scoreBreakdown,
    intent: l.intent || l.intentLevel || "Low",
    buyingStage: l.buyingStage || "Researching",
    conversionProbability: l.conversionProbability || 0,
    summary: l.summary || l.aiQualification?.summary || "",
    nextBestAction: l.nextBestAction || l.aiQualification?.nextBestAction || "",
    painPoints: l.painPoints || l.aiQualification?.painPoints || [],
    tags: l.tags || l.aiQualification?.tags || [],
    duplicateRisk: l.duplicateRisk || l.aiQualification?.duplicateRisk || 0,
    validationFlags: l.validationFlags || l.aiQualification?.validationFlags || [],
    isSpam: l.isSpam || false,
    isFake: l.isFake || false,
  };
};


// ─── 2. Priority Tag Config ───────────────────────────────────────────────────
// Returns light-theme color styles for a priorityTag string.

export const getPriorityConfig = (priorityTag) => {
  switch (priorityTag) {
    case "Hot Lead":
      return {
        badge: "bg-red-50 text-red-600 border border-red-200",
        row: "hover:bg-red-50/40",
        dot: "bg-red-500",
      };
    case "Warm Lead":
      return {
        badge: "bg-amber-50 text-amber-600 border border-amber-200",
        row: "hover:bg-amber-50/40",
        dot: "bg-amber-500",
      };
    default:
      return {
        badge: "bg-blue-50 text-blue-600 border border-blue-200",
        row: "hover:bg-blue-50/30",
        dot: "bg-blue-500",
      };
  }
};


// ─── 3. Validation Badge Row ──────────────────────────────────────────────────

export const ValidationBadges = ({ lead }) => (
  <div style={{ display: "flex", alignItems: "center", gap: "4px", flexWrap: "wrap", marginTop: "4px" }}>
    {lead.phoneVerified && (
      <span style={{
        fontSize: "9px", padding: "1px 6px", borderRadius: "4px",
        background: "#f0fdf4", color: "#16a34a", border: "1px solid #bbf7d0", fontWeight: 600,
      }}>
        ✓ Phone
      </span>
    )}
    {!lead.phoneVerified && (
      <span style={{
        fontSize: "9px", padding: "1px 6px", borderRadius: "4px",
        background: "#fef2f2", color: "#dc2626", border: "1px solid #fecaca", fontWeight: 600,
      }}>
        ✗ Phone
      </span>
    )}
    {lead.email && lead.emailVerified && (
      <span style={{
        fontSize: "9px", padding: "1px 6px", borderRadius: "4px",
        background: "#eff6ff", color: "#2563eb", border: "1px solid #bfdbfe", fontWeight: 600,
      }}>
        ✓ Email
      </span>
    )}
    {lead.email && !lead.emailVerified && (
      <span style={{
        fontSize: "9px", padding: "1px 6px", borderRadius: "4px",
        background: "#fff7ed", color: "#ea580c", border: "1px solid #fed7aa", fontWeight: 600,
      }}>
        ✗ Email
      </span>
    )}
    {lead.isSpam && (
      <span style={{
        fontSize: "9px", padding: "1px 6px", borderRadius: "4px",
        background: "#fef2f2", color: "#dc2626", border: "1px solid #fecaca", fontWeight: 800,
      }}>
        SPAM
      </span>
    )}
    {lead.isFake && (
      <span style={{
        fontSize: "9px", padding: "1px 6px", borderRadius: "4px",
        background: "#fff7ed", color: "#ea580c", border: "1px solid #fed7aa", fontWeight: 800,
      }}>
        FAKE
      </span>
    )}
  </div>
);


// ─── 4. AI Qualification Panel ────────────────────────────────────────────────

export const AIQualificationPanel = ({ lead }) => {
  const score = lead.authenticityScore || 0;

  const tempConfig = {
    Hot: {
      color: "#dc2626",
      bgGradient: "linear-gradient(135deg, #fff5f5 0%, #fff7ed 100%)",
      border: "#fecaca",
      barGradient: "linear-gradient(90deg, #ef4444, #f97316)",
    },
    Warm: {
      color: "#d97706",
      bgGradient: "linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)",
      border: "#fde68a",
      barGradient: "linear-gradient(90deg, #f59e0b, #fbbf24)",
    },
    Cold: {
      color: "#2563eb",
      bgGradient: "linear-gradient(135deg, #eff6ff 0%, #f0f9ff 100%)",
      border: "#bfdbfe",
      barGradient: "linear-gradient(90deg, #3b82f6, #64748b)",
    },
  };
  const tc = tempConfig[lead.leadTemperature] || tempConfig.Cold;

  const breakdownEntries = lead.scoreBreakdown
    ? Object.entries(lead.scoreBreakdown).filter(
        ([key, val]) => typeof val === "number" && key !== "_id"
      )
    : [];

  const labelMap = {
    sourceScore:       "Source Score",
    billScore:         "Bill Score",
    completenessScore: "Completeness",
    engagementScore:   "Engagement",
    aiIntent:          "AI Intent",
    emailTrust:        "Email Trust",
    phoneTrust:        "Phone Trust",
    duplicateRisk:     "Duplicate Risk",
    engagement:        "Engagement (AI)",
  };

  const card = {
    background: "#fff",
    border: "1px solid #e5e7eb",
    borderRadius: "14px",
    padding: "16px",
    boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
  };

  const label = {
    fontSize: "10px",
    textTransform: "uppercase",
    letterSpacing: "0.06em",
    color: "#9ca3af",
    marginBottom: "4px",
    fontWeight: 600,
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>

      {/* ── Overview Card ── */}
      <div style={{
        background: tc.bgGradient,
        border: `1px solid ${tc.border}`,
        borderRadius: "16px",
        padding: "20px",
      }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "14px" }}>
          <div>
            <p style={{ ...label, color: "#9ca3af", margin: "0 0 4px 0" }}>AI Qualification</p>
            <h3 style={{ fontSize: "24px", fontWeight: 800, color: tc.color, margin: 0 }}>
              {lead.leadTemperature || "Cold"}
            </h3>
          </div>
          <div style={{ textAlign: "right" }}>
            <p style={{ ...label, margin: "0 0 4px 0" }}>Conversion Probability</p>
            <p style={{ fontSize: "24px", fontWeight: 800, color: "#16a34a", margin: 0 }}>
              {lead.conversionProbability || 0}%
            </p>
          </div>
        </div>

        {/* Score bar */}
        <div style={{ marginBottom: "12px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
            <span style={{ fontSize: "10px", color: "#9ca3af", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em" }}>
              Authenticity Score
            </span>
            <span style={{ fontSize: "12px", fontWeight: 800, color: tc.color }}>{score}/100</span>
          </div>
          <div style={{ height: "8px", borderRadius: "8px", background: "rgba(0,0,0,0.06)", overflow: "hidden" }}>
            <div style={{
              height: "100%",
              borderRadius: "8px",
              background: tc.barGradient,
              width: `${score}%`,
              transition: "width 0.7s ease",
            }} />
          </div>
        </div>

        {/* Summary */}
        {lead.summary && lead.summary !== "AI unavailable" && (
          <p style={{
            fontSize: "12px",
            lineHeight: 1.6,
            color: "#374151",
            borderTop: `1px solid ${tc.border}`,
            paddingTop: "12px",
            margin: 0,
          }}>
            {lead.summary}
          </p>
        )}
      </div>

      {/* ── Validation Grid ── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
        <div style={card}>
          <p style={label}>Phone</p>
          <p style={{ fontSize: "14px", fontWeight: 700, color: lead.phoneVerified ? "#16a34a" : "#dc2626", margin: 0 }}>
            {lead.phoneVerified ? "✓ Verified" : "✗ Invalid"}
          </p>
        </div>
        <div style={card}>
          <p style={label}>Email</p>
          <p style={{ fontSize: "14px", fontWeight: 700, color: lead.emailVerified ? "#16a34a" : "#ea580c", margin: 0 }}>
            {lead.email
              ? lead.emailVerified ? "✓ Verified" : "✗ Suspicious"
              : "—"}
          </p>
        </div>
      </div>

      {/* ── Intent + Buying Stage ── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
        <div style={card}>
          <p style={label}>Intent</p>
          <p style={{
            fontSize: "14px",
            fontWeight: 700,
            margin: 0,
            color: lead.intent === "High" ? "#16a34a" : lead.intent === "Medium" ? "#d97706" : "#6b7280",
          }}>
            {lead.intent || "Low"}
          </p>
        </div>
        <div style={card}>
          <p style={label}>Buying Stage</p>
          <p style={{ fontSize: "14px", fontWeight: 700, color: "#111827", margin: 0 }}>
            {lead.buyingStage || "Researching"}
          </p>
        </div>
      </div>

      {/* ── Spam / Fake warning ── */}
      {(lead.isSpam || lead.isFake) && (
        <div style={{
          background: "#fef2f2",
          border: "1px solid #fecaca",
          borderRadius: "14px",
          padding: "16px",
        }}>
          <p style={{ fontSize: "11px", fontWeight: 700, color: "#dc2626", textTransform: "uppercase", letterSpacing: "0.06em", margin: "0 0 8px 0" }}>
            ⚠ Warning
          </p>
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
            {lead.isSpam && (
              <span style={{ padding: "2px 10px", borderRadius: "20px", background: "#fee2e2", color: "#b91c1c", fontSize: "11px", fontWeight: 700 }}>
                Spam Detected
              </span>
            )}
            {lead.isFake && (
              <span style={{ padding: "2px 10px", borderRadius: "20px", background: "#fff7ed", color: "#c2410c", fontSize: "11px", fontWeight: 700 }}>
                Fake Lead
              </span>
            )}
          </div>
        </div>
      )}

      {/* ── Next Best Action ── */}
      {lead.nextBestAction && lead.nextBestAction !== "Manual review required" ? (
        <div style={{
          background: "#f0fdf4",
          border: "1px solid #bbf7d0",
          borderRadius: "14px",
          padding: "16px",
        }}>
          <p style={{ fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.06em", color: "#16a34a", fontWeight: 600, margin: "0 0 8px 0" }}>
            Recommended Action
          </p>
          <p style={{ fontSize: "13px", color: "#374151", lineHeight: 1.6, margin: 0 }}>
            {lead.nextBestAction}
          </p>
        </div>
      ) : (
        <div style={{
          background: "#f9fafb",
          border: "1px solid #e5e7eb",
          borderRadius: "14px",
          padding: "16px",
        }}>
          <p style={{ fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.06em", color: "#9ca3af", fontWeight: 600, margin: "0 0 8px 0" }}>
            Recommended Action
          </p>
          <p style={{ fontSize: "13px", color: "#9ca3af", margin: 0 }}>Manual review required</p>
        </div>
      )}

      {/* ── Pain Points ── */}
      {lead.painPoints?.length > 0 && (
        <div>
          <p style={{ fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.06em", color: "#9ca3af", fontWeight: 600, margin: "0 0 8px 0" }}>
            Pain Points
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
            {lead.painPoints.map((p, i) => (
              <span key={i} style={{
                padding: "4px 12px", borderRadius: "20px",
                background: "#fef2f2", border: "1px solid #fecaca",
                fontSize: "11px", color: "#dc2626",
              }}>
                {p}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* ── AI Tags ── */}
      {lead.tags?.length > 0 && (
        <div>
          <p style={{ fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.06em", color: "#9ca3af", fontWeight: 600, margin: "0 0 8px 0" }}>
            AI Tags
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
            {lead.tags.map((tag, i) => (
              <span key={i} style={{
                padding: "4px 12px", borderRadius: "20px",
                background: "#eff6ff", border: "1px solid #bfdbfe",
                fontSize: "11px", color: "#2563eb",
              }}>
                #{tag}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* ── Score Breakdown ── */}
      {breakdownEntries.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          <p style={{ fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.06em", color: "#9ca3af", fontWeight: 600, margin: 0 }}>
            Score Breakdown
          </p>
          {breakdownEntries.map(([key, value]) => (
            <div key={key}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                <span style={{ fontSize: "11px", color: "#6b7280" }}>
                  {labelMap[key] || key}
                </span>
                <span style={{ fontSize: "11px", fontWeight: 700, color: "#16a34a" }}>
                  {value}
                </span>
              </div>
              <div style={{ height: "6px", borderRadius: "6px", background: "#f3f4f6", overflow: "hidden" }}>
                <div style={{
                  height: "100%",
                  borderRadius: "6px",
                  background: "#16a34a",
                  width: `${Math.min(value, 100)}%`,
                  transition: "width 0.5s ease",
                }} />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Duplicate Risk ── */}
      <div>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
          <p style={{ fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.06em", color: "#9ca3af", fontWeight: 600, margin: 0 }}>
            Duplicate Risk
          </p>
          <span style={{
            fontSize: "12px",
            fontWeight: 700,
            color: (lead.duplicateRisk || 0) > 60 ? "#dc2626"
              : (lead.duplicateRisk || 0) > 30 ? "#ea580c"
              : "#9ca3af",
          }}>
            {lead.duplicateRisk || 0}%
          </span>
        </div>
        <div style={{ height: "8px", borderRadius: "8px", background: "#f3f4f6", overflow: "hidden" }}>
          <div style={{
            height: "100%",
            borderRadius: "8px",
            background: (lead.duplicateRisk || 0) > 60 ? "#ef4444"
              : (lead.duplicateRisk || 0) > 30 ? "#f97316"
              : "#d1d5db",
            width: `${lead.duplicateRisk || 0}%`,
            transition: "width 0.5s ease",
          }} />
        </div>
      </div>

      {/* ── Validation Flags ── */}
      {lead.validationFlags?.length > 0 && (
        <div>
          <p style={{ fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.06em", color: "#9ca3af", fontWeight: 600, margin: "0 0 8px 0" }}>
            Validation Flags
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
            {lead.validationFlags.map((flag, i) => (
              <span key={i} style={{
                padding: "4px 12px", borderRadius: "20px",
                background: "#fff7ed", border: "1px solid #fed7aa",
                fontSize: "11px", color: "#ea580c",
              }}>
                {flag}
              </span>
            ))}
          </div>
        </div>
      )}

    </div>
  );
};


// ─── 5. Time Range Resolver ───────────────────────────────────────────────────
// Converts a time range key to { startDate, endDate } query params.

export const resolveTimeRange = (range) => {
  const now = new Date();
  const pad = (d) => d.toISOString().split("T")[0];

  switch (range) {
    case "24h": {
      const d = new Date(now - 24 * 60 * 60 * 1000);
      return { startDate: d.toISOString(), endDate: now.toISOString() };
    }
    case "7d": {
      const d = new Date(now - 7 * 24 * 60 * 60 * 1000);
      return { startDate: pad(d), endDate: pad(now) };
    }
    case "15d": {
      const d = new Date(now - 15 * 24 * 60 * 60 * 1000);
      return { startDate: pad(d), endDate: pad(now) };
    }
    case "30d": {
      const d = new Date(now - 30 * 24 * 60 * 60 * 1000);
      return { startDate: pad(d), endDate: pad(now) };
    }
    default:
      return {};
  }
};