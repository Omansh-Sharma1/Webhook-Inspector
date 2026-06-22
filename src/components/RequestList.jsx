function methodColor(method) {
  switch (method) {
    case 'GET':
      return '#58a6ff';
    case 'POST':
      return 'var(--accent)';
    case 'PUT':
    case 'PATCH':
      return '#d29922';
    case 'DELETE':
      return 'var(--danger)';
    default:
      return 'var(--text-secondary)';
  }
}

function timeAgo(dateString) {
  const seconds = Math.floor((Date.now() - new Date(dateString).getTime()) / 1000);
  if (seconds < 5) return 'just now';
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  return `${hours}h ago`;
}

export default function RequestList({ requests, selectedId, onSelect, freshIds }) {
  if (requests.length === 0) {
    return (
      <div style={{ padding: 32, color: 'var(--text-tertiary)', fontSize: 14, textAlign: 'center' }}>
        <div className="live-dot" style={{ marginBottom: 12 }} />
        <div>Waiting for the first request…</div>
      </div>
    );
  }

  return (
    <div style={{ overflowY: 'auto', flex: 1 }}>
      {requests.map((req) => (
        <div
          key={req._id}
          onClick={() => onSelect(req._id)}
          className={`request-row ${freshIds.has(req._id) ? 'request-row--new' : ''}`}
          style={{
            padding: '12px 16px',
            borderBottom: '1px solid var(--border)',
            cursor: 'pointer',
            background: selectedId === req._id ? 'var(--bg-hover)' : 'transparent'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <span
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 12,
                fontWeight: 600,
                color: methodColor(req.method)
              }}
            >
              {req.method}
            </span>
            <span style={{ fontSize: 12, color: 'var(--text-tertiary)', marginLeft: 'auto' }}>
              {timeAgo(req.receivedAt)}
            </span>
          </div>
          <div
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 12,
              color: 'var(--text-secondary)',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis'
            }}
          >
            from {req.ip}
          </div>
        </div>
      ))}
    </div>
  );
}
