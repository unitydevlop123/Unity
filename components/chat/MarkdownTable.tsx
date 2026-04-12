
import React from 'react';
import './MarkdownTable.css';

interface TableProps {
  markdown: string;
}

const MarkdownTable: React.FC<TableProps> = ({ markdown }) => {
  // Parse markdown table into HTML
  const parseTable = (md: string) => {
    // Split by newline and filter empty lines, but ensure we keep lines that might be part of the table structure
    const lines = md.split('\n').filter(l => l.trim());
    
    if (lines.length < 2) return null;

    // Helper to split a row string by | but ignore escaped pipes if necessary (simple version)
    const splitRow = (row: string) => {
      // Remove leading/trailing pipes if they exist to avoid empty strings at ends
      const trimmed = row.trim().replace(/^\||\|$/g, '');
      return trimmed.split('|').map(c => c.trim());
    };

    const headers = splitRow(lines[0]);
    
    // The second line is usually the separator |---|---|
    // We skip it for data but could use it for alignment
    const rows = lines.slice(2).map(line => splitRow(line));

    return { headers, rows };
  };

  const table = parseTable(markdown);
  if (!table) return <pre className="whitespace-pre-wrap">{markdown}</pre>;

  return (
    <div className="table-wrapper">
      <table className="ai-table">
        <thead>
          <tr>
            {table.headers.map((h, i) => (
              <th key={i}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {table.rows.map((row, i) => (
            <tr key={i}>
              {row.map((cell, j) => (
                <td key={j}>{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default MarkdownTable;
