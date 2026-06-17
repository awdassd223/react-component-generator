import { useRef, useEffect } from 'react';

interface StreamingCardProps {
  prompt: string;
  code: string;
}

export function StreamingCard({ prompt, code }: StreamingCardProps) {
  const codeRef = useRef<HTMLPreElement>(null);

  useEffect(() => {
    if (codeRef.current) {
      codeRef.current.scrollTop = codeRef.current.scrollHeight;
    }
  }, [code]);

  return (
    <div className="component-card streaming-card">
      <div className="card-header">
        <div className="card-title-group">
          <span className="streaming-label">생성 중</span>
          <p className="card-prompt">{prompt}</p>
        </div>
        <div className="streaming-dots" aria-hidden="true">
          <span /><span /><span />
        </div>
      </div>
      <div className="card-content">
        <div className="code-panel">
          <div className="panel-header">
            <h3>코드</h3>
          </div>
          <pre ref={codeRef} className="code-block streaming-code-block">
            <code>{code}<span className="streaming-cursor" aria-hidden="true" /></code>
          </pre>
        </div>
      </div>
    </div>
  );
}
