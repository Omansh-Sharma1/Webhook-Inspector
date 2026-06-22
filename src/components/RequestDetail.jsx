function Section({ title, children }) {
  return (
    <div className="detail-section" style={{ marginBottom: 24 }}>
      <div
        style={{
          fontSize: 12,
          fontWeight: 600,
          color: 'var(--text-tertiary)',
          textTransform: 'uppercase',
          letterSpacing: '0.04em',
          marginBottom: 8
        }}
      >
        {title}
      </div>
      {children}
    </div>
  );
}

function KeyValueTable({ data }) {
  const entries = Object.entries(data || {});
  if (entries.length === 0) {
    return <div style={{ color: 'var(--text-tertiary)', fontSize: 13 }}>None</div>;
  }
  return (
    <div style={{ fontFamily: 'var(--font-mono)', fontSize: 13 }}>
      {entries.map(([key, value]) => (
        <div key={key} style={{ display: 'flex', gap: 12, padding: '4px 0', borderBottom: '1px solid var(--border)' }}>
          <span style={{ color: '#58a6ff', minWidth: 160, flexShrink: 0 }}>{key}</span>
          <span style={{ color: 'var(--text-primary)', wordBreak: 'break-all' }}>{String(value)}</span>
        </div>
      ))}
    </div>
  );
}

function BodyView({ request }) {
  if (!request.rawBody) {
    return <div style={{ color: 'var(--text-tertiary)', fontSize: 13 }}>Empty body</div>;
  }

  const display = request.parsedBody
    ? JSON.stringify(request.parsedBody, null, 2)
    : request.rawBody;

  return (
    <pre className="body-pre">
      {display}
    </pre>
  );
}

export default function RequestDetail({ request }) {
  if (!request) {
    return (
      <div style={{ padding: 32, color: 'var(--text-tertiary)', fontSize: 14, textAlign: 'center' }}>
        Select a request on the left to inspect it.
      </div>
    );
  }

  return (
    <div key={request._id} style={{ padding: '20px 24px' }}>
      <div className="detail-section" style={{ marginBottom: 20 }}>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 18, fontWeight: 600 }}>
          {request.method} request
        </div>
        <div style={{ color: 'var(--text-tertiary)', fontSize: 13, marginTop: 2 }}>
          {new Date(request.receivedAt).toLocaleString()} · from {request.ip}
        </div>
      </div>

      <Section title="Query parameters">
        <KeyValueTable data={request.query} />
      </Section>

      <Section title="Headers">
        <KeyValueTable data={request.headers} />
      </Section>

      <Section title="Body">
        <BodyView request={request} />
      </Section>
    </div>
  );
}
