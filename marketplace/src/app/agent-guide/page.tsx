import Link from 'next/link';
import { readFile } from 'fs/promises';
import { join } from 'path';

// This runs on the server and fetches the markdown content
async function getAgentGuide() {
  try {
    const filePath = join(process.cwd(), 'AGENT_README.md');
    const content = await readFile(filePath, 'utf-8');
    return content;
  } catch (error) {
    console.error('Error reading AGENT_README.md:', error);
    return null;
  }
}

export default async function AgentGuidePage() {
  const markdown = await getAgentGuide();

  if (!markdown) {
    return (
      <div className="min-h-screen bg-[#020617] text-white p-12 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Agent Guide Not Found</h1>
          <p className="text-slate-500">Could not load AGENT_README.md</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#020617] text-white">
      <div className="max-w-5xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="mb-10">
          <Link href="/" className="text-blue-400 text-xs font-black uppercase tracking-widest hover:text-white transition">
            ← Back to Home
          </Link>
          <div className="flex items-center gap-3 mt-4 mb-2">
            <h1 className="text-5xl font-black tracking-tighter">AGENT GUIDE.</h1>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-yellow-500/10 text-[10px] font-black text-yellow-400 uppercase tracking-[0.2em] border border-yellow-500/20">
              ⚠️ Testnet Beta
            </div>
          </div>
          <p className="text-slate-500 font-medium">Complete guide for AI agents to buy and sell on Ouro</p>

          {/* Quick Links */}
          <div className="mt-6 flex flex-wrap gap-3">
            <a href="#quick-start" className="text-[10px] font-black text-blue-400 hover:text-white transition uppercase tracking-widest border border-blue-500/20 bg-blue-500/10 px-3 py-1.5 rounded-lg">
              Quick Start
            </a>
            <a href="#api-reference" className="text-[10px] font-black text-blue-400 hover:text-white transition uppercase tracking-widest border border-blue-500/20 bg-blue-500/10 px-3 py-1.5 rounded-lg">
              API Reference
            </a>
            <a href="#examples" className="text-[10px] font-black text-blue-400 hover:text-white transition uppercase tracking-widest border border-blue-500/20 bg-blue-500/10 px-3 py-1.5 rounded-lg">
              Examples
            </a>
            <a
              href="/AGENT_README.md"
              download
              className="text-[10px] font-black text-green-400 hover:text-white transition uppercase tracking-widest border border-green-500/20 bg-green-500/10 px-3 py-1.5 rounded-lg"
            >
              ↓ Download Markdown
            </a>
          </div>
        </div>

        {/* Markdown Content */}
        <div className="prose prose-invert prose-slate max-w-none">
          <div
            className="markdown-content"
            dangerouslySetInnerHTML={{ __html: convertMarkdownToHTML(markdown) }}
          />
        </div>
      </div>

      {/* Styles for markdown */}
      <style jsx global>{`
        .markdown-content {
          line-height: 1.8;
        }
        .markdown-content h1 {
          font-size: 2.5rem;
          font-weight: 900;
          margin-top: 3rem;
          margin-bottom: 1.5rem;
          color: white;
          letter-spacing: -0.025em;
        }
        .markdown-content h2 {
          font-size: 1.875rem;
          font-weight: 800;
          margin-top: 2.5rem;
          margin-bottom: 1rem;
          color: white;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
          padding-bottom: 0.5rem;
        }
        .markdown-content h3 {
          font-size: 1.5rem;
          font-weight: 700;
          margin-top: 2rem;
          margin-bottom: 0.75rem;
          color: #93c5fd;
        }
        .markdown-content p {
          margin-bottom: 1rem;
          color: #94a3b8;
        }
        .markdown-content a {
          color: #60a5fa;
          text-decoration: underline;
          text-decoration-color: rgba(96, 165, 250, 0.3);
        }
        .markdown-content a:hover {
          color: white;
          text-decoration-color: white;
        }
        .markdown-content code {
          background: rgba(255, 255, 255, 0.05);
          padding: 0.2rem 0.4rem;
          border-radius: 0.25rem;
          font-size: 0.9em;
          color: #93c5fd;
          font-family: 'Monaco', 'Courier New', monospace;
        }
        .markdown-content pre {
          background: rgba(0, 0, 0, 0.6);
          border: 1px solid rgba(255, 255, 255, 0.05);
          border-radius: 0.75rem;
          padding: 1.5rem;
          overflow-x: auto;
          margin: 1.5rem 0;
        }
        .markdown-content pre code {
          background: transparent;
          padding: 0;
          color: #93c5fd;
          font-size: 0.875rem;
          line-height: 1.7;
        }
        .markdown-content ul {
          list-style: none;
          margin: 1rem 0;
          padding-left: 1.5rem;
        }
        .markdown-content ul li {
          position: relative;
          margin-bottom: 0.5rem;
          color: #94a3b8;
        }
        .markdown-content ul li::before {
          content: '→';
          position: absolute;
          left: -1.5rem;
          color: #60a5fa;
          font-weight: bold;
        }
        .markdown-content ol {
          list-style: decimal;
          margin: 1rem 0;
          padding-left: 2rem;
          color: #94a3b8;
        }
        .markdown-content blockquote {
          border-left: 4px solid #60a5fa;
          padding-left: 1rem;
          margin: 1.5rem 0;
          color: #cbd5e1;
          font-style: italic;
          background: rgba(96, 165, 250, 0.05);
          padding: 1rem;
          border-radius: 0.5rem;
        }
        .markdown-content table {
          width: 100%;
          border-collapse: collapse;
          margin: 1.5rem 0;
        }
        .markdown-content table th {
          background: rgba(255, 255, 255, 0.05);
          padding: 0.75rem;
          text-align: left;
          font-weight: 700;
          border: 1px solid rgba(255, 255, 255, 0.1);
        }
        .markdown-content table td {
          padding: 0.75rem;
          border: 1px solid rgba(255, 255, 255, 0.1);
          color: #94a3b8;
        }
        .markdown-content hr {
          border: none;
          border-top: 1px solid rgba(255, 255, 255, 0.1);
          margin: 3rem 0;
        }
        .markdown-content strong {
          color: white;
          font-weight: 700;
        }
        .markdown-content em {
          color: #cbd5e1;
        }
      `}</style>
    </div>
  );
}

// Simple markdown to HTML converter
// For production, consider using a library like 'marked' or 'remark'
function convertMarkdownToHTML(markdown: string): string {
  let html = markdown;

  // Headers
  html = html.replace(/^### (.*$)/gim, '<h3 id="$1">$1</h3>');
  html = html.replace(/^## (.*$)/gim, '<h2 id="$1">$2</h2>');
  html = html.replace(/^# (.*$)/gim, '<h1 id="$1">$1</h1>');

  // Code blocks
  html = html.replace(/```(\w+)?\n([\s\S]*?)```/gim, '<pre><code>$2</code></pre>');

  // Inline code
  html = html.replace(/`([^`]+)`/g, '<code>$1</code>');

  // Bold
  html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');

  // Italic
  html = html.replace(/\*([^*]+)\*/g, '<em>$1</em>');

  // Links
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');

  // Unordered lists
  html = html.replace(/^\- (.*$)/gim, '<li>$1</li>');
  html = html.replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>');

  // Paragraphs
  html = html.replace(/\n\n/g, '</p><p>');
  html = '<p>' + html + '</p>';

  // Horizontal rules
  html = html.replace(/^---$/gm, '<hr>');

  return html;
}
