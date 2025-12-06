import React from 'react';
import { ShieldCheck, ExternalLink, Info } from 'lucide-react';

interface ResponseCardProps {
  title: string;
  content: string;
  groundingChunks?: any[];
  isLoading: boolean;
}

export const ResponseCard: React.FC<ResponseCardProps> = ({ title, content, groundingChunks, isLoading }) => {
  if (isLoading) {
    return (
      <div className="w-full p-8 glass-panel rounded-2xl animate-pulse">
        <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/4 mb-4"></div>
        <div className="space-y-3">
          <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded w-full"></div>
          <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded w-5/6"></div>
          <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded w-4/6"></div>
        </div>
      </div>
    );
  }

  if (!content) return null;

  // Helper to parse bold syntax **text** within strings
  const parseBold = (text: string) => {
    const parts = text.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, index) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={index} className="font-bold text-slate-900 dark:text-white">{part.slice(2, -2)}</strong>;
      }
      return part;
    });
  };

  // Helper to parse citations [n] and bold text
  const parseContent = (text: string) => {
    // Split by citation pattern [n]
    const parts = text.split(/(\[\d+\])/g);
    
    return parts.map((part, index) => {
      // Check if it's a citation like [1]
      const citationMatch = part.match(/^\[(\d+)\]$/);
      if (citationMatch) {
        const num = parseInt(citationMatch[1], 10);
        const chunk = groundingChunks?.[num - 1];
        
        if (chunk?.web?.uri) {
          return (
            <a 
              key={index}
              href={chunk.web.uri}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:text-blue-700 dark:hover:text-blue-400 hover:underline font-bold text-xs ml-0.5 align-super cursor-pointer transition-colors"
              title={`Buka sumber: ${chunk.web.title}`}
              aria-label={`Sitasi ${num}: ${chunk.web.title}`}
            >
              {part}
            </a>
          );
        }
        return <span key={index} className="text-slate-400 dark:text-slate-500 text-xs ml-0.5 align-super">{part}</span>;
      }
      return <React.Fragment key={index}>{parseBold(part)}</React.Fragment>;
    });
  };

  // Render a Markdown Table
  const renderTable = (rows: string[], keyPrefix: string) => {
    // Filter out divider rows (e.g., |---|---|)
    const dataRows = rows.filter(row => !row.includes('---'));
    
    if (dataRows.length === 0) return null;

    const headers = dataRows[0].split('|').filter(c => c.trim()).map(c => c.trim());
    const bodyRows = dataRows.slice(1);

    return (
      <div key={keyPrefix} className="my-6 w-full overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm">
        <table className="w-full text-sm text-left border-collapse bg-white dark:bg-slate-800/50">
          <thead className="bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 uppercase text-xs font-semibold tracking-wider">
            <tr>
              {headers.map((h, i) => (
                <th key={i} className="px-4 py-3 border-b border-slate-200 dark:border-slate-700 whitespace-nowrap">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
            {bodyRows.map((row, rIdx) => {
              const cells = row.split('|').filter((_, i, arr) => i > 0 && i < arr.length - 1).map(c => c.trim());
              return (
                <tr key={rIdx} className="hover:bg-slate-50/50 dark:hover:bg-slate-700/30 transition-colors">
                  {cells.map((cell, cIdx) => (
                    <td key={cIdx} className="px-4 py-3 text-slate-600 dark:text-slate-400 align-top">
                      {parseContent(cell)}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  };

  // Main processing loop
  const processContent = () => {
    const lines = content.split('\n');
    const nodes: React.ReactNode[] = [];
    let tableBuffer: string[] = [];
    let isInsideTable = false;

    lines.forEach((line, i) => {
      const trimmed = line.trim();

      // Check for Table Syntax (starts and ends with |)
      if (trimmed.startsWith('|') && trimmed.endsWith('|')) {
        isInsideTable = true;
        tableBuffer.push(trimmed);
      } else {
        // If we were in a table and now aren't, render the buffered table
        if (isInsideTable) {
          nodes.push(renderTable(tableBuffer, `table-${i}`));
          tableBuffer = [];
          isInsideTable = false;
        }

        // Standard rendering for non-table lines
        if (!trimmed) return;

        if (line.startsWith('## ')) {
          nodes.push(
            <h2 key={i} className="text-xl font-bold text-slate-800 dark:text-slate-100 mt-8 mb-4 pb-2 border-b border-slate-100 dark:border-slate-700/50 flex items-center gap-2">
              {line.replace('## ', '')}
            </h2>
          );
        } else if (line.startsWith('### ')) {
          nodes.push(
            <h3 key={i} className="text-lg font-semibold text-slate-800 dark:text-slate-200 mt-5 mb-2">
              {line.replace('### ', '')}
            </h3>
          );
        } else if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
          nodes.push(
            <li key={i} className="ml-4 list-disc text-slate-700 dark:text-slate-300 mb-2 pl-2 leading-relaxed marker:text-slate-400 dark:marker:text-slate-600">
              {parseContent(trimmed.replace(/^[-*]\s/, ''))}
            </li>
          );
        } else if (trimmed.match(/^\d+\./)) {
           nodes.push(
             <li key={i} className="ml-4 list-decimal text-slate-700 dark:text-slate-300 mb-2 pl-2 leading-relaxed marker:text-slate-400 dark:marker:text-slate-600">
               {parseContent(trimmed.replace(/^\d+\.\s/, ''))}
             </li>
           );
        } else {
          nodes.push(
            <p key={i} className="text-slate-700 dark:text-slate-300 leading-relaxed mb-3">
              {parseContent(line)}
            </p>
          );
        }
      }
    });

    // Flush remaining table if exists at end of content
    if (isInsideTable && tableBuffer.length > 0) {
      nodes.push(renderTable(tableBuffer, `table-end`));
    }

    return nodes;
  };

  return (
    <div className="w-full glass-panel rounded-2xl overflow-hidden shadow-sm transition-all duration-500 fade-in">
      <div className="bg-gradient-to-r from-slate-50 to-white dark:from-slate-800 dark:to-slate-800 border-b border-slate-100 dark:border-slate-700 px-6 py-4 flex justify-between items-center">
        <h3 className="font-semibold text-slate-800 dark:text-slate-100 flex items-center gap-2">
          {title}
        </h3>
        <span className="text-[10px] font-mono font-medium text-primary bg-primary/5 dark:bg-primary/20 px-2 py-1 rounded border border-primary/10 dark:border-primary/20">
          AI GENERATED
        </span>
      </div>

      <div className="p-6 text-sm">
        <div className="space-y-1">
          {processContent()}
        </div>
        
        <div className="mt-8 pt-5 border-t border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-2 mb-4 text-slate-500 dark:text-slate-400">
            <ShieldCheck size={16} className="text-green-600 dark:text-green-500" />
            <h4 className="text-xs font-bold uppercase tracking-wider">Validasi Referensi (Sitasi)</h4>
          </div>
          
          {groundingChunks && groundingChunks.length > 0 ? (
            <div className="bg-slate-50/50 dark:bg-slate-800/50 rounded-xl p-4 border border-slate-100 dark:border-slate-700">
              <ol className="space-y-3">
                {groundingChunks.map((chunk, idx) => (
                  chunk.web?.uri ? (
                    <li key={idx} className="flex gap-3 items-start group">
                       <span className="flex-shrink-0 flex items-center justify-center w-6 h-6 rounded-full bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-500 dark:text-slate-300 text-[10px] font-bold mt-0.5 shadow-sm group-hover:border-primary group-hover:text-primary transition-colors">
                         {idx + 1}
                       </span>
                       <a 
                        href={chunk.web.uri} 
                        target="_blank" 
                        rel="noreferrer"
                        className="flex-1 flex flex-col group-hover:bg-white dark:group-hover:bg-slate-700 rounded-lg transition-colors p-1 -m-1"
                       >
                         <span className="font-medium text-blue-700 dark:text-blue-400 text-sm hover:underline decoration-blue-700/30 dark:decoration-blue-400/30 underline-offset-2 break-all">
                           {chunk.web.title || "Sumber Referensi Medis"}
                         </span>
                         <span className="text-xs text-slate-400 dark:text-slate-500 font-mono flex items-center gap-1 mt-0.5">
                           <ExternalLink size={10} />
                           {new URL(chunk.web.uri).hostname}
                         </span>
                       </a>
                    </li>
                  ) : null
                ))}
              </ol>
            </div>
          ) : (
            <div className="flex items-center gap-2 p-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 rounded-lg text-slate-500 dark:text-slate-400 text-xs italic">
              <Info size={14} />
              <span>Tidak ada link eksternal spesifik yang ditemukan untuk kueri ini. Pastikan untuk memverifikasi dengan pedoman resmi.</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
