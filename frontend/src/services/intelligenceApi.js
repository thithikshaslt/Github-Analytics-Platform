const API_BASE = 'http://localhost:5000';

export async function checkIntelligenceHealth() {
  const res = await fetch(`${API_BASE}/intelligence/health`);
  return res.json();
}

export async function analyzeCodebaseStream(payload, onEvent, signal) {
  const response = await fetch(`${API_BASE}/intelligence/analyze`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
    signal
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Server error (${response.status}): ${errorText || response.statusText}`);
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder('utf-8');
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop(); // Keep unfinished line in buffer

    for (const line of lines) {
      if (line.trim()) {
        try {
          const parsed = JSON.parse(line.trim());
          onEvent(parsed);
        } catch (e) {
          console.warn('Failed to parse stream chunk:', line);
        }
      }
    }
  }

  if (buffer.trim()) {
    try {
      const parsed = JSON.parse(buffer.trim());
      onEvent(parsed);
    } catch (e) {
      // Ignored
    }
  }
}