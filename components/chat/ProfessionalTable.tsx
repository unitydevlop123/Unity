import React from 'react';
import './TableStyles.css';

interface TableProps {
  headers?: string[];
  rows?: string[][];
  children?: React.ReactNode;
  style?: 'minimal' | 'tech' | 'grid' | 'comparison' | 'corporate' | 'modern' | 'colorful' | 'dark' | 'gradient' | 'striped' | 'glass' | 'bento';
}

const ProfessionalTable: React.FC<TableProps> = ({ headers, rows, children, style = 'minimal' }) => {
  const getTableClass = () => {
    switch(style) {
      case 'minimal': return 'table-minimal';
      case 'tech': return 'table-tech';
      case 'grid': return 'table-grid';
      case 'comparison': return 'table-comparison';
      case 'corporate': return 'table-corporate';
      case 'modern': return 'table-modern';
      case 'colorful': return 'table-colorful';
      case 'dark': return 'table-dark';
      case 'gradient': return 'table-gradient';
      case 'striped': return 'table-striped';
      case 'glass': return 'table-glass';
      case 'bento': return 'table-bento';
      default: return 'table-minimal';
    }
  };

  // If children are provided (from react-markdown), use them directly
  if (children) {
    return (
      <div className={`professional-table ${getTableClass()}`}>
        <table>
          {children}
        </table>
      </div>
    );
  }

  // Fallback for manual usage
  return (
    <div className={`professional-table ${getTableClass()}`}>
      <table>
        <thead>
          <tr>{headers?.map((h, i) => <th key={i}>{h}</th>)}</tr>
        </thead>
        <tbody>
          {rows?.map((row, i) => (
            <tr key={i}>
              {row.map((cell, j) => <td key={j}>{cell}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ProfessionalTable;
