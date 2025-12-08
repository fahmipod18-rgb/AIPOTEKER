import React, { useState, useEffect } from 'react';
import { ShieldCheck, ExternalLink, Info, Filter, PackageCheck, Layers } from 'lucide-react';

interface ResponseCardProps {
  title: string;
  content: string;
  groundingChunks?: any[];
  isLoading: boolean;
}

// --- SUB-COMPONENT: INTERACTIVE TABLE WITH FILTERS ---
const InteractiveTable: React.FC<{
  headers: string[];
  rows: string[];
  parseContent: (text: string) => React.ReactNode;
}> = ({ headers, rows, parseContent }) => {
  const [filterStock, setFilterStock] = useState(false);
  const [filterCategory, setFilterCategory] = useState<'ALL' | 'DOWA' | 'BEBAS'>('ALL');

  // Detect Column Indices
  const nameColIndex = headers.findIndex(h => h.toLowerCase().includes('nama obat'));
  const categoryColIndex = headers.findIndex(h => h.toLowerCase().includes('kategori'));
  const isDrugTable = nameColIndex !== -1;
  const hasCategory = categoryColIndex !== -1;

  // Check if any row actually has stock info to decide if we show the filter
  const hasStockData = rows.some(row => row.includes('[TERSEDIA DI STOK]'));

  // Filtering Logic
  const filteredRows = rows.filter(row => {
    const cells = row.split('|').filter((_, i, arr) => i > 0 && i < arr.length - 1).map(c => c.trim());
    
    // Filter 1: Stock Availability
    if (filterStock && isDrugTable) {
      // Check if the name column contains the stock tag
      if (!cells[nameColIndex]?.includes('[TERSEDIA DI STOK]')) {
        return false;
      }
    }

    // Filter 2: Category (DOWA vs Bebas)
    if (filterCategory !== 'ALL' && hasCategory) {
      const catText = cells[categoryColIndex]?.toLowerCase() || '';
      if (filterCategory === 'DOWA') {
        if (!catText.includes('dowa') && !catText.includes('keras')) return false;
      } else if (filterCategory === 'BEBAS') {
        if (!catText.includes('bebas') && !catText.includes('hijau') && !catText.includes('biru')) return false;
      }
    }

    return true;
  });

  return (
    <div className="my-6 w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/50 shadow-sm overflow-hidden">
      {/* FILTER TOOLBAR (Only show if it looks like a recommendation table) */}
      {(isDrugTable) && (
        <div className="px-4 py-3 bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
            <Filter size={14} /> Filter Rekomendasi:
          </div>

          {/* STOCK FILTER */}
          {hasStockData && (
            <button
              onClick={() => setFilterStock(!filterStock)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all border ${
                filterStock
                  ? 'bg-green-100 border-green-200 text-green-700 dark:bg-green-900/30 dark:border-green-800 dark:text-green-400'
                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100 dark:bg-slate-700 dark:border-slate-600 dark:text-slate-300'
              }`}
            >
              <PackageCheck size={14} />
              {filterStock ? 'Hanya Stok Tersedia' : 'Tampilkan Semua Stok'}
            </button>
          )}

          {/* CATEGORY FILTER */}
          {hasCategory && (
            <div className="flex items-center gap-2">
              <Layers size={14} className="text-slate-400" />
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value as any)}
                className="bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-200 text-xs rounded-lg px-2 py-1.5 outline-none focus:ring-2 focus:ring-primary/20"
              >
                <option value="ALL">Semua Kategori</option>
                <option value="BEBAS">Obat Bebas / Bebas Terbatas</option>
                <option value="DOWA">Obat Keras (DOWA)</option>
              </select>
            </div>
          )}
        </div>
      )}

      {/* TABLE */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left border-collapse">
          <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 uppercase text-xs font-semibold tracking-wider">
            <tr>
              {headers.map((h, i) => (
                <th key={i} className="px-4 py-3 border-b border-slate-200 dark:border-slate-700 whitespace-nowrap">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
            {filteredRows.length > 0 ? (
              filteredRows.map((row, rIdx) => {
                const cells = row.split('|').filter((_, i, arr) => i > 0 && i < arr.length - 1).map(c => c.trim());
                return (
                  <tr key={rIdx} className="hover:bg-slate-50/50 dark:hover:bg-slate-700/30 transition-colors group">
                    {cells.map((cell, cIdx) => (
                      <td key={cIdx} className="px-4 py-3 text-slate-600 dark:text-slate-400 align-top group-hover:text-slate-900 dark:group-hover:text-slate-200">
                        {parseContent(cell)}
                      </td>
                    ))}
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={headers.length} className="px-4 py-8 text-center text-slate-400 italic">
                  Tidak ada data yang sesuai dengan filter.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};


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

  // Helper to parse custom color tags {{COLOR:Text}}
  const parseColors = (text: string) => {
    const colorRegex = /\{\{(RED|GREEN|BLUE|YELLOW|PURPLE):(.*?)\}\}/g;
    const parts = text.split(colorRegex);
    
    if (parts.length === 1) return text;

    const nodes: React.ReactNode[] = [];
    let i = 0;
    
    // If text doesn't start with a tag, the first part is plain text
    if (!text.match(/^\{\{(RED|GREEN|BLUE|YELLOW|PURPLE):/)) {
      nodes.push(<span key={`text-${i}`}>{parts[0]}</span>);
      i++;
    }

    while (i < parts.length) {
      // The split logic with capturing groups puts the Color and Content in the array
      // But dealing with split regex behavior is tricky. Let's use matchAll for safety or a simpler replacement approach for React.
      // Simpler approach: Map segments.
      break; 
    }
    
    // Robust React Parsing for Regex Groups
    const elements: (string | React.ReactNode)[] = [];
    let lastIndex = 0;
    text.replace(colorRegex, (match, color, content, offset) => {
      // Push text before match
      if (offset > lastIndex) {
        elements.push(text.slice(lastIndex, offset));
      }
      
      // Push styled element
      let bgClass = "bg-slate-100 text-slate-700";
      if (color === 'RED') bgClass = "bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800";
      if (color === 'GREEN') bgClass = "bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800";
      if (color === 'BLUE') bgClass = "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800";
      if (color === 'YELLOW') bgClass = "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800";
      
      elements.push(
        <span key={offset} className={`inline-block px-1.5 py-0.5 rounded text-xs font-bold border ${bgClass} mx-0.5`}>
          {content}
        </span>
      );
      
      lastIndex = offset + match.length;
      return match;
    });
    
    if (lastIndex < text.length) {
      elements.push(text.slice(lastIndex));
    }
    
    return elements;
  };

  // Helper to parse bold syntax **text** within strings
  const parseBold = (textNode: React.ReactNode): React.ReactNode => {
    if (typeof textNode !== 'string') return textNode;
    
    const parts = textNode.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, index) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={index} className="font-bold text-slate-900 dark:text-white">{part.slice(2, -2)}</strong>;
      }
      return part;
    });
  };

  // Helper to parse citations [n]
  const parseCitations = (nodes: React.ReactNode[]): React.ReactNode[] => {
    return nodes.map((node, i) => {
      if (typeof node !== 'string') return node;

      const parts = node.split(/(\[\d+\])/g);
      return (
        <React.Fragment key={i}>
          {parts.map((part, index) => {
            const citationMatch = part.match(/^\[(\d+)\]$/);
            if (citationMatch) {
              const num = parseInt(citationMatch[1], 10);
              // Smart re-mapping logic could go here if we were deduping in the UI, 
              // but currently we rely on the deduplicated list logic below.
              
              // We just link to the anchor at the bottom
              return (
                 <a 
                   key={index}
                   href={`#ref-${num}`}
                   className="inline-flex items-center justify-center min-w-[16px] h-4 px-1 rounded bg-slate-200 dark:bg-slate-700 text-[9px] font-bold text-slate-600 dark:text-slate-300 hover:bg-primary hover:text-white transition-colors align-super ml-0.5"
                   title="Lihat Referensi"
                 >
                   {num}
                 </a>
              );
            }
            return parseBold(part);
          })}
        </React.Fragment>
      );
    });
  };

  // Master Parser
  const parseContent = (text: string) => {
    // 1. Parse Colors first (returns array of strings/elements)
    const colorParsed = parseColors(text);
    
    // 2. Parse Citations & Bold on the resulting array
    if (Array.isArray(colorParsed)) {
      return (
        <>
          {colorParsed.map((item, idx) => (
             <React.Fragment key={idx}>
               {parseCitations([item])}
             </React.Fragment>
          ))}
        </>
      );
    }
    
    return parseCitations([colorParsed]);
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
          // Render the Interactive Table
          const dataRows = tableBuffer.filter(row => !row.includes('---')); // Remove separator
          if (dataRows.length > 0) {
            const headers = dataRows[0].split('|').filter(c => c.trim()).map(c => c.trim());
            const bodyRows = dataRows.slice(1);
            nodes.push(
              <InteractiveTable 
                key={`table-${i}`} 
                headers={headers} 
                rows={bodyRows} 
                parseContent={parseContent} 
              />
            );
          }
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
      const dataRows = tableBuffer.filter(row => !row.includes('---'));
      if (dataRows.length > 0) {
        const headers = dataRows[0].split('|').filter(c => c.trim()).map(c => c.trim());
        const bodyRows = dataRows.slice(1);
        nodes.push(
          <InteractiveTable 
            key={`table-end`} 
            headers={headers} 
            rows={bodyRows} 
            parseContent={parseContent} 
          />
        );
      }
    }

    return nodes;
  };

  // --- REFERENCE DEDUPLICATION LOGIC ---
  // Create a map of Unique URI -> List Index
  // Then re-map text citations [n] to the new unique index
  const uniqueReferences: { title: string; uri: string; originalIndex: number }[] = [];
  const uriToIndexMap = new Map<string, number>();

  if (groundingChunks) {
    groundingChunks.forEach((chunk, i) => {
      const uri = chunk.web?.uri;
      if (uri && !uriToIndexMap.has(uri)) {
        // Strip generic branding for cleaner title
        let cleanTitle = chunk.web.title || "Sumber Referensi";
        const hostname = new URL(uri).hostname.replace('www.', '');
        cleanTitle = cleanTitle.replace(/ - .*/, ''); // Remove trailing branding " - WebMD"
        cleanTitle = cleanTitle.replace(/ \| .*/, ''); // Remove pipe branding " | Drugs.com"
        
        // Add to unique list
        uniqueReferences.push({
          title: `${hostname} (${cleanTitle})`,
          uri: uri,
          originalIndex: i + 1
        });
        uriToIndexMap.set(uri, uniqueReferences.length); // 1-based index
      }
    });
  }

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
          
          {uniqueReferences.length > 0 ? (
            <div className="bg-slate-50/50 dark:bg-slate-800/50 rounded-xl p-4 border border-slate-100 dark:border-slate-700">
              <ol className="space-y-3">
                {uniqueReferences.map((ref, idx) => (
                    <li id={`ref-${idx + 1}`} key={idx} className="flex gap-3 items-start group">
                       <span className="flex-shrink-0 flex items-center justify-center w-6 h-6 rounded-full bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-500 dark:text-slate-300 text-[10px] font-bold mt-0.5 shadow-sm group-hover:border-primary group-hover:text-primary transition-colors">
                         {idx + 1}
                       </span>
                       <a 
                        href={ref.uri} 
                        target="_blank" 
                        rel="noreferrer"
                        className="flex-1 flex flex-col group-hover:bg-white dark:group-hover:bg-slate-700 rounded-lg transition-colors p-1 -m-1"
                       >
                         <span className="font-medium text-blue-700 dark:text-blue-400 text-sm hover:underline decoration-blue-700/30 dark:decoration-blue-400/30 underline-offset-2 break-all">
                           {ref.title}
                         </span>
                         <span className="text-xs text-slate-400 dark:text-slate-500 font-mono flex items-center gap-1 mt-0.5">
                           <ExternalLink size={10} />
                           {new URL(ref.uri).hostname}
                         </span>
                       </a>
                    </li>
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