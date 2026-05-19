import { useState } from 'react';
import { LiveProvider, LivePreview as ReactLivePreview, LiveError } from 'react-live';

type Viewport = 'mobile' | 'tablet' | 'desktop';

const VIEWPORTS: { key: Viewport; label: string; width: string }[] = [
  { key: 'mobile', label: '모바일', width: '375px' },
  { key: 'tablet', label: '태블릿', width: '768px' },
  { key: 'desktop', label: '데스크탑', width: '100%' },
];

interface LivePreviewProps {
  code: string;
}

export function LivePreview({ code }: LivePreviewProps) {
  const [viewport, setViewport] = useState<Viewport>('desktop');

  const current = VIEWPORTS.find((v) => v.key === viewport)!;

  return (
    <div className="preview-panel">
      <div className="panel-header">
        <h3>미리보기</h3>
        <div className="viewport-controls">
          {VIEWPORTS.map(({ key, label }) => (
            <button
              key={key}
              className={`btn-viewport ${viewport === key ? 'btn-viewport--active' : ''}`}
              onClick={() => setViewport(key)}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
      <div className="preview-content">
        <LiveProvider code={code} noInline>
          <div className="preview-viewport-wrapper">
            <div
              className="preview-render"
              style={{ width: current.width, maxWidth: '100%' }}
            >
              <ReactLivePreview />
            </div>
          </div>
          <LiveError className="preview-error" />
        </LiveProvider>
      </div>
    </div>
  );
}
