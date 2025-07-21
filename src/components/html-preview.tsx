'use client';

import React, { useMemo } from 'react';

interface HTMLPreviewProps {
  htmlContent: string;
}

export const HTMLPreview: React.FC<HTMLPreviewProps> = ({ htmlContent }) => {
  const iframeContent = useMemo(() => {
    return `
      <html>
        <head>
          <style>
            body { 
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
              padding: 1rem;
              color: #333;
              line-height: 1.6;
            }
            img { max-width: 100%; height: auto; border-radius: 0.25rem; }
            h1, h2, h3 { line-height: 1.2; }
            a { color: #007bff; text-decoration: none; }
            a:hover { text-decoration: underline; }
            ul, ol { padding-left: 1.5rem; }
            code {
              padding: 0.2em 0.4em;
              margin: 0;
              font-size: 85%;
              background-color: rgba(27,31,35,0.05);
              border-radius: 3px;
            }
          </style>
        </head>
        <body>
          ${htmlContent}
        </body>
      </html>
    `;
  }, [htmlContent]);

  return (
    <iframe
      title="HTML Preview"
      srcDoc={iframeContent}
      className="w-full h-full border-0"
      sandbox="allow-scripts allow-same-origin"
    />
  );
};
