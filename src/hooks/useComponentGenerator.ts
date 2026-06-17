import { useState, useCallback, useEffect } from 'react';
import type { GeneratedComponent, Provider } from '../types';

const STORAGE_KEY = 'rcg_components';

function loadFromStorage(): GeneratedComponent[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as (Omit<GeneratedComponent, 'createdAt'> & { createdAt: string })[];
    return parsed.map((c) => ({ ...c, createdAt: new Date(c.createdAt) }));
  } catch {
    return [];
  }
}

function saveToStorage(components: GeneratedComponent[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(components));
  } catch {
    // localStorage 용량 초과 또는 사용 불가
  }
}

function stripCodeFences(text: string): string {
  return text
    .replace(/^```(?:jsx|tsx|javascript|typescript)?\n?/gm, '')
    .replace(/```$/gm, '')
    .trim();
}

function ensureRenderCall(code: string): string {
  if (/\brender\s*\(/.test(code)) return code;
  const match = code.match(/(?:const|function)\s+([A-Z]\w+)/);
  if (match) return `${code}\n\nrender(<${match[1]} />);`;
  return code;
}

interface UseComponentGeneratorReturn {
  components: GeneratedComponent[];
  isLoading: boolean;
  streamingCode: string | null;
  error: string | null;
  generate: (prompt: string, apiKey: string | undefined, provider: Provider) => Promise<void>;
  removeComponent: (id: string) => void;
  clearAll: () => void;
}

export function useComponentGenerator(): UseComponentGeneratorReturn {
  const [components, setComponents] = useState<GeneratedComponent[]>(loadFromStorage);
  const [isLoading, setIsLoading] = useState(false);
  const [streamingCode, setStreamingCode] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    saveToStorage(components);
  }, [components]);

  const generate = useCallback(async (prompt: string, apiKey: string | undefined, provider: Provider) => {
    setIsLoading(true);
    setError(null);
    setStreamingCode('');

    try {
      const res = await fetch('/api/generate/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, ...(apiKey && { apiKey }), provider }),
      });

      if (!res.ok) {
        const data = await res.json() as { error?: string };
        throw new Error(data.error || 'Failed to generate component');
      }

      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let accumulatedCode = '';

      outer: while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() ?? '';

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const data = line.slice(6);

          if (data === '[DONE]') break outer;

          try {
            const parsed = JSON.parse(data) as { chunk?: string; error?: string };
            if (parsed.error) throw new Error(parsed.error);
            if (parsed.chunk) {
              accumulatedCode += parsed.chunk;
              setStreamingCode(accumulatedCode);
            }
          } catch (e) {
            if (!(e instanceof SyntaxError)) throw e;
          }
        }
      }

      const code = ensureRenderCall(stripCodeFences(accumulatedCode));

      setComponents((prev) => [
        {
          id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          prompt,
          code,
          createdAt: new Date(),
        },
        ...prev,
      ]);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setError(message);
    } finally {
      setIsLoading(false);
      setStreamingCode(null);
    }
  }, []);

  const removeComponent = useCallback((id: string) => {
    setComponents((prev) => prev.filter((c) => c.id !== id));
  }, []);

  const clearAll = useCallback(() => {
    setComponents([]);
  }, []);

  return { components, isLoading, streamingCode, error, generate, removeComponent, clearAll };
}
