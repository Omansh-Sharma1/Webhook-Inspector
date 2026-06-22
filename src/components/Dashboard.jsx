import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import RequestList from './RequestList.jsx';
import RequestDetail from './RequestDetail.jsx';

const POLL_INTERVAL_MS = 2500;
const DOT_CLICK_THRESHOLD = 7;

function DotBurst({ x, y }) {
  const particles = Array.from({ length: 16 }, (_, i) => {
    const angle = (i / 16) * Math.PI * 2;
    const dist = 30 + Math.random() * 50;
    const dx = Math.cos(angle) * dist;
    const dy = Math.sin(angle) * dist;
    return (
      <div
        key={i}
        className="dot-burst-particle"
        style={{
          left: x,
          top: y,
          '--dx': `${dx}px`,
          '--dy': `${dy}px`,
          animationDelay: `${Math.random() * 0.1}s`
        }}
      />
    );
  });
  return <>{particles}</>;
}

function EasterToast({ message }) {
  return <div className="easter-toast">{message}</div>;
}

export default function Dashboard() {
  const { slug } = useParams();
  const [requests, setRequests] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [copied, setCopied] = useState(false);
  const [freshIds, setFreshIds] = useState(new Set());
  const [error, setError] = useState(null);
  const [dotHovered, setDotHovered] = useState(false);

  // Easter egg state
  const [dotBurst, setDotBurst] = useState(null);
  const [toastMsg, setToastMsg] = useState(null);
  const dotClickCount = useRef(0);
  const dotClickTimer = useRef(null);

  const latestTimestamp = useRef(null);

  const inspectUrl = `${window.location.origin}/api/i/${slug}`;

  const isPollingRef = useRef(false);

  const poll = useCallback(async () => {
    if (isPollingRef.current) return;
    isPollingRef.current = true;

    try {
      const params = latestTimestamp.current ? `?since=${encodeURIComponent(latestTimestamp.current)}` : '';
      const res = await fetch(`/api/requests/${slug}${params}`);
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to load requests.');
      }
      const data = await res.json();

      if (data.requests.length > 0) {
        setRequests((prev) => {
          const existingIds = new Set(prev.map((r) => r._id));
          const newOnes = data.requests.filter((r) => !existingIds.has(r._id));
          if (newOnes.length === 0) return prev;

          const merged = [...newOnes, ...prev];
          merged.sort((a, b) => new Date(b.receivedAt) - new Date(a.receivedAt));
          return merged;
        });

        const newest = data.requests.reduce(
          (max, r) => (new Date(r.receivedAt) > new Date(max) ? r.receivedAt : max),
          data.requests[0].receivedAt
        );
        latestTimestamp.current = newest;

        const newIds = new Set(data.requests.map((r) => r._id));
        setFreshIds(newIds);
        setTimeout(() => setFreshIds(new Set()), 1500);
      }
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      isPollingRef.current = false;
    }
  }, [slug]);

  useEffect(() => {
    poll();
    const interval = setInterval(poll, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [poll]);

  function handleCopy() {
    navigator.clipboard.writeText(inspectUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  function handleDotClick(e) {
    dotClickCount.current++;
    clearTimeout(dotClickTimer.current);

    if (dotClickCount.current >= DOT_CLICK_THRESHOLD) {
      dotClickCount.current = 0;
      const rect = e.target.getBoundingClientRect();
      setDotBurst({ x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 });
      setToastMsg('🚀 Signal boosted! Webhook radar at full power');
      setTimeout(() => {
        setDotBurst(null);
        setToastMsg(null);
      }, 3000);
    } else {
      dotClickTimer.current = setTimeout(() => {
        dotClickCount.current = 0;
      }, 800);
    }
  }

  const selectedRequest = requests.find((r) => r._id === selectedId) || requests[0] || null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      {/* Top bar */}
      <div
        style={{
          padding: '14px 20px',
          borderBottom: '1px solid var(--border)',
          display: 'flex',
          alignItems: 'center',
          gap: 12
        }}
      >
        <div 
          style={{ display: 'flex', alignItems: 'center', gap: 8, position: 'relative' }}
          onMouseEnter={() => setDotHovered(true)}
          onMouseLeave={() => setDotHovered(false)}
        >
          <span
            className="live-dot"
            onClick={handleDotClick}
            style={{ cursor: 'pointer' }}
          />
          {dotHovered && (
            <span 
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '11px',
                color: 'var(--accent)',
                opacity: 1,
                whiteSpace: 'nowrap',
                pointerEvents: 'none',
                position: 'absolute',
                left: '16px',
                background: 'var(--bg)',
                padding: '2px 6px',
                borderRadius: '4px',
                border: '1px solid var(--border)',
                zIndex: 10
              }}
            >
              // click rapidly to boost radar 🚀
            </span>
          )}
        </div>

        <code
          style={{
            fontSize: 13,
            color: 'var(--text-primary)',
            background: 'var(--bg-elevated)',
            padding: '6px 10px',
            borderRadius: 6,
            border: '1px solid var(--border)'
          }}
        >
          {inspectUrl}
        </code>
        <button
          onClick={handleCopy}
          className={`copy-btn ${copied ? 'copy-btn--copied' : ''}`}
          style={{
            background: 'transparent',
            border: '1px solid var(--border)',
            color: 'var(--text-secondary)',
            borderRadius: 6,
            padding: '6px 12px',
            fontSize: 13
          }}
        >
          {copied ? '✓ Copied' : 'Copy'}
        </button>
        <span style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--text-tertiary)' }}>
          {requests.length} request{requests.length !== 1 ? 's' : ''} captured
        </span>
      </div>

      {error && (
        <div style={{ padding: '8px 20px', background: 'rgba(248,81,73,0.1)', color: 'var(--danger)', fontSize: 13 }}>
          {error}
        </div>
      )}

      {/* Two-pane layout */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        <div style={{ width: 320, borderRight: '1px solid var(--border)', display: 'flex', flexDirection: 'column' }}>
          <RequestList
            requests={requests}
            selectedId={selectedRequest?._id}
            onSelect={setSelectedId}
            freshIds={freshIds}
          />
        </div>
        <div style={{ flex: 1, overflowY: 'auto' }}>
          <RequestDetail request={selectedRequest} />
        </div>
      </div>

      {/* Easter egg overlays */}
      {dotBurst && <DotBurst x={dotBurst.x} y={dotBurst.y} />}
      {toastMsg && <EasterToast message={toastMsg} />}
    </div>
  );
}