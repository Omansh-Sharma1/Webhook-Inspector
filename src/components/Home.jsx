import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';

const RECENTS_KEY = 'webhook-inspector:recents';

// Konami Code sequence normalized to lowercase keys
const KONAMI = ['arrowup','arrowup','arrowdown','arrowdown','arrowleft','arrowright','arrowleft','arrowright','b','a'];

function loadRecents() {
  try {
    return JSON.parse(localStorage.getItem(RECENTS_KEY)) || [];
  } catch {
    return [];
  }
}

function saveRecent(slug) {
  const recents = loadRecents();
  const updated = [slug, ...recents.filter((s) => s !== slug)].slice(0, 5);
  localStorage.setItem(RECENTS_KEY, JSON.stringify(updated));
  return updated;
}

// Matrix rain characters — mix of katakana, latin, and symbols
const MATRIX_CHARS = 'アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン0123456789ABCDEF{}[]/<>';

function MatrixRain() {
  const columns = Array.from({ length: 30 }, (_, i) => {
    const chars = Array.from({ length: 12 + Math.floor(Math.random() * 10) }, () =>
      MATRIX_CHARS[Math.floor(Math.random() * MATRIX_CHARS.length)]
    ).join('');
    const left = (i / 30) * 100 + Math.random() * 3;
    const duration = 2 + Math.random() * 3;
    const delay = Math.random() * 2;
    return (
      <div
        key={i}
        className="matrix-column"
        style={{
          left: `${left}%`,
          animationDuration: `${duration}s`,
          animationDelay: `${delay}s`,
          fontSize: `${10 + Math.floor(Math.random() * 8)}px`,
          opacity: 0.3 + Math.random() * 0.5
        }}
      >
        {chars}
      </div>
    );
  });

  return <div className="matrix-rain">{columns}</div>;
}

function EasterToast({ message }) {
  return <div className="easter-toast">{message}</div>;
}

export default function Home() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [recents, setRecents] = useState([]);
  const [showMatrix, setShowMatrix] = useState(false);
  const [toastMsg, setToastMsg] = useState(null);
  const konamiIndex = useRef(0);
  const navigate = useNavigate();

  useEffect(() => {
    setRecents(loadRecents());
  }, []);

  // Strict Konami code listener with case insensitivity built-in
  useEffect(() => {
    function handleKey(e) {
      const key = e.key.toLowerCase();
      if (key === KONAMI[konamiIndex.current]) {
        konamiIndex.current++;
        if (konamiIndex.current === KONAMI.length) {
          konamiIndex.current = 0;
          setShowMatrix(true);
          setToastMsg('🎮 Welcome to the Matrix, developer');
          setTimeout(() => {
            setShowMatrix(false);
            setToastMsg(null);
          }, 4000);
        }
      } else {
        // Reset chain if a wrong key sequence is input
        konamiIndex.current = 0;
      }
    }
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, []);

  async function handleGenerate() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/generate', { method: 'POST' });
      if (!res.ok) throw new Error('Could not create an inspector right now.');
      const data = await res.json();
      saveRecent(data.slug);
      navigate(`/i/${data.slug}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
        textAlign: 'center',
        position: 'relative'
      }}
    >
      {/* Animated dot grid background */}
      <div className="dot-grid-bg" />

      {/* Content sits above the grid */}
      <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
        <div
          className="fade-up"
          style={{
            fontFamily: 'var(--font-mono)',
            color: 'var(--text-tertiary)',
            marginBottom: 16,
            fontSize: 13,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '6px'
          }}
        >
          <span className="typing-text">$ webhook-inspector</span>
          <span 
            style={{ 
              fontSize: '11px', 
              color: 'var(--accent)', 
              opacity: 0.5, 
              letterSpacing: '0.5px',
              cursor: 'help'
            }} 
            title="Press: ↑ ↑ ↓ ↓ ← → ← → B A"
          >
            # hint: type the historic gamer code sequence... 🎮
          </span>
        </div>

        <h1
          className="fade-up fade-up-delay-1"
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 28,
            fontWeight: 500,
            margin: '0 0 12px'
          }}
        >
          See exactly what a webhook sends
        </h1>
        <p
          className="fade-up fade-up-delay-2"
          style={{
            color: 'var(--text-secondary)',
            maxWidth: 440,
            lineHeight: 1.6,
            margin: '0 auto 32px'
          }}
        >
          Generate a disposable URL, drop it into any webhook config, and watch the
          raw request — headers, body, everything — land here in real time.
        </p>

        <div className="fade-up fade-up-delay-3">
          <button
            onClick={handleGenerate}
            disabled={loading}
            className="glow-btn"
            style={{
              background: 'var(--accent)',
              color: '#04140a',
              border: 'none',
              borderRadius: 8,
              padding: '14px 28px',
              fontSize: 15,
              fontWeight: 600,
              opacity: loading ? 0.7 : 1
            }}
          >
            {loading ? 'Generating…' : 'Generate inspector URL'}
          </button>
        </div>

        {error && (
          <p style={{ color: 'var(--danger)', marginTop: 16, fontSize: 14 }}>{error}</p>
        )}

        {recents.length > 0 && (
          <div className="fade-up fade-up-delay-4" style={{ marginTop: 56, width: '100%', maxWidth: 420, display: 'flex', flexDirection: 'column', alignItems: 'stretch' }}>
            <div style={{ color: 'var(--text-tertiary)', fontSize: 13, marginBottom: 8, textAlign: 'center' }}>
              Your recent inspectors
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {recents.map((slug) => (
                <Link
                  key={slug}
                  to={`/i/${slug}`}
                  className="recent-link"
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: 13,
                    color: 'var(--text-secondary)',
                    background: 'var(--bg-elevated)',
                    border: '1px solid var(--border)',
                    borderRadius: 6,
                    padding: '10px 14px',
                    textDecoration: 'none',
                    textAlign: 'left'
                  }}
                >
                  /i/{slug}
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Easter egg overlays */}
      {showMatrix && <MatrixRain />}
      {toastMsg && <EasterToast message={toastMsg} />}
    </div>
  );
}