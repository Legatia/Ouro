import Link from 'next/link';
import { readFile } from 'fs/promises';
import { join } from 'path';
import { MarkdownRenderer } from './MarkdownRenderer';

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
        <MarkdownRenderer markdown={markdown} />
      </div>
    </div>
  );
}
