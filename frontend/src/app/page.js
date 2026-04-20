'use client';

import { useState } from 'react';
import CodeEditor from '@/components/CodeEditor';
import ParseTreeViewer from '@/components/ParseTreeViewer';
import LR1TableViewer from '@/components/LR1TableViewer';

const defaultCode = `// Mini Compiler Example
let x = 10;
let y = 20;
let sum = x + y;

if (sum > 25) {
  print(sum);
} else {
  print(0);
}

let i = 0;
while (i < 3) {
  print(i);
  let i = i + 1;
}`;

export default function Home() {
  const [code, setCode] = useState(defaultCode);
  const [compileResult, setCompileResult] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  // UI State
  const [selectedTab, setSelectedTab] = useState('parseTree'); // active tab in single mode
  const [tokenView, setTokenView] = useState('all'); // 'all', 'keywords', 'operators', 'identifiers', 'literals'
  const [outputView, setOutputView] = useState('programOutput'); // 'programOutput', 'variables'

  const handleCompile = async () => {
    setLoading(true);
    setError('');
    
    try {
      const response = await fetch('http://localhost:5000/api/compile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ code }),
      });

      const data = await response.json();

      if (!data.success) {
        setError(data.error || 'Compilation failed');
        setCompileResult(null);
      } else {
        setCompileResult(data);
        setError('');
      }
    } catch (err) {
      setError('Failed to connect to backend server. Make sure Flask is running on port 5000.');
    } finally {
      setLoading(false);
    }
  };

  // Get tokens from compile result
  const tokens = compileResult?.tokens || [];
  const parseTree = compileResult?.ast || null;
  const intermediateCode = compileResult?.intermediate || [];
  const outputData = compileResult?.output || {};

  // Classify tokens by category
  const classifyTokens = (category = tokenView) => {
    const keywords = tokens.filter(t => ['LET', 'IF', 'ELSE', 'WHILE', 'PRINT', 'AND'].includes(t.type));
    const operators = tokens.filter(t => ['PLUS', 'MINUS', 'TIMES', 'DIVIDE', 'MODULO', 'ASSIGN', 'EQ', 'NE', 'LT', 'GT', 'LE', 'GE'].includes(t.type));
    const identifiers = tokens.filter(t => t.type === 'ID');
    const literals = tokens.filter(t => t.type === 'NUMBER');
    const delimiters = tokens.filter(t => ['LPAREN', 'RPAREN', 'LBRACE', 'RBRACE', 'SEMICOLON'].includes(t.type));

    const categories = {
      all: tokens,
      keywords,
      operators,
      identifiers,
      literals,
      delimiters
    };

    return category === 'count' ? {
      all: tokens.length,
      keywords: keywords.length,
      operators: operators.length,
      identifiers: identifiers.length,
      literals: literals.length,
      delimiters: delimiters.length
    } : categories[category] || tokens;
  };

  const tabs = [
    { id: 'parseTree', label: 'Parse Tree', icon: '🌳' },
    { id: 'tokens', label: 'Tokens', icon: '🔤' },
    { id: 'lr1', label: 'LR(1) Table', icon: '📊' },
    { id: 'intermediate', label: 'Intermediate Code', icon: '⚙️' },
    { id: 'output', label: 'Output', icon: '📤' },
  ];

  const tokenCounts = classifyTokens('count');
  const tokenTabs = [
    { id: 'all', label: 'All', count: tokenCounts.all },
    { id: 'keywords', label: 'Keywords', count: tokenCounts.keywords },
    { id: 'operators', label: 'Operators', count: tokenCounts.operators },
    { id: 'identifiers', label: 'Identifiers', count: tokenCounts.identifiers },
    { id: 'literals', label: 'Literals', count: tokenCounts.literals },
    { id: 'delimiters', label: 'Delimiters', count: tokenCounts.delimiters },
  ];

  const renderTokens = () => {
    const filteredTokens = classifyTokens();
    
    return (
      <div className="h-full flex flex-col">
        {/* Token Classification Tabs */}
        <div className="flex gap-2 mb-4 flex-wrap flex-shrink-0">
          {tokenTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setTokenView(tab.id)}
              className={`px-3 py-1 rounded text-sm font-medium transition-all ${
                tokenView === tab.id
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              {tab.label} <span className="text-xs opacity-75">({tab.count})</span>
            </button>
          ))}
        </div>

        {/* Token List */}
        {filteredTokens.length > 0 ? (
          <div className="space-y-2 flex-1 overflow-y-auto pr-2">
            {filteredTokens.map((token, index) => (
              <div key={index} className="flex gap-4 p-3 bg-gray-700 rounded-lg text-sm hover:bg-gray-600 transition-colors">
                <span className="text-blue-400 font-mono font-semibold min-w-[140px]">{token.type}</span>
                <span className="text-green-400 font-mono flex-1">{token.value}</span>
                <span className="text-gray-400 text-xs self-center">Line {token.line}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-400 text-center py-8">No {tokenView === 'all' ? 'tokens' : tokenView} available.</p>
        )}
      </div>
    );
  };

  const renderSingleOutput = () => {
    switch (selectedTab) {
      case 'parseTree':
        return parseTree ? (
          <div className="h-full overflow-y-auto pr-2">
            <ParseTreeViewer ast={parseTree} />
          </div>
        ) : (
          <p className="text-gray-400 text-center py-8">No parse tree available. Click "Compile & Run".</p>
        );
      
      case 'tokens':
        return tokens.length > 0 ? renderTokens() : (
          <p className="text-gray-400 text-center py-8">No tokens available. Click "Compile & Run".</p>
        );
      
      case 'lr1':
        return <LR1TableViewer />;
      
      case 'intermediate':
        return intermediateCode && intermediateCode.length > 0 ? (
          <div className="h-full overflow-y-auto p-4 bg-gray-900 rounded-lg space-y-1">
            {intermediateCode.map((line, index) => (
              <div key={index} className="text-sm text-gray-300 font-mono">
                {line}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-400 text-center py-8">No intermediate code available. Click "Compile & Run".</p>
        );
      
      case 'output':
        return outputData && outputData.output ? (
          <div className="h-full flex flex-col">
            {/* Output Sub-tabs */}
            <div className="flex gap-2 mb-4 flex-wrap flex-shrink-0">
              
              <button
                onClick={() => setOutputView('programOutput')}
                className={`px-3 py-1 rounded text-sm font-medium transition-all ${
                  outputView === 'programOutput'
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                📤 Program Output <span className="text-xs opacity-75">({outputData.output.length})</span>
              </button>

              <button
                onClick={() => setOutputView('variables')}
                className={`px-3 py-1 rounded text-sm font-medium transition-all ${
                  outputView === 'variables'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                💾 Variables <span className="text-xs opacity-75">({outputData.variables ? Object.keys(outputData.variables).length : 0})</span>
              </button>

            </div>

            {/* Output Content */}
            <div className="flex-1 overflow-y-auto p-4 bg-gray-900 rounded-lg">
              {outputView === 'programOutput' ? (
                <div className="space-y-1">
                  {outputData.output.map((line, index) => (
                    <div key={index} className="text-sm text-green-400 font-mono bg-green-900/20 px-3 py-1 rounded">
                      {line}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-1">
                  {outputData.variables && Object.keys(outputData.variables).length > 0 ? (
                    Object.entries(outputData.variables).map(([key, value]) => (
                      <div key={key} className="text-sm font-mono text-blue-400 bg-blue-900/20 px-3 py-1 rounded">
                        {key} = {String(value)}
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-400 text-center py-8">No variables available.</p>
                  )}
                </div>
              )}
            </div>
          </div>
        ) : (
          <p className="text-gray-400 text-center py-8">No output available. Click "Compile & Run".</p>
        );
      
      default:
        return null;
    }
  };

  return (
    <main className="min-h-screen bg-gray-900 text-white p-4">
      {/* Header */}
      <div className="max-w-[1800px] mx-auto mb-4">
        <h1 className="text-3xl font-bold mb-1 bg-gradient-to-r from-blue-400 to-purple-500 text-transparent bg-clip-text">
          Mini Compiler
        </h1>
        <p className="text-gray-400 text-sm">Python Backend (PLY) + Next.js Frontend</p>
      </div>

      {/* Controls */}
      <div className="max-w-[1800px] mx-auto mb-4 flex gap-4 items-center flex-wrap">
        <button
          onClick={handleCompile}
          disabled={loading}
          className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 disabled:from-gray-600 disabled:to-gray-700 text-white px-6 py-2 rounded-lg font-semibold transition-all shadow-lg"
        >
          {loading ? 'Compiling...' : '▶ Compile & Run'}
        </button>
      </div>

      {/* Error Display */}
      {error && (
        <div className="max-w-[1800px] mx-auto mb-4 bg-red-900/20 border border-red-500 text-red-400 p-3 rounded-lg text-sm">
          <strong>Error:</strong> {error}
        </div>
      )}

      {/* Main Content */}
      <div className="max-w-[1800px] mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 h-[calc(100vh-200px)]">
          {/* Left Column - Code Editor */}
          <div className="flex flex-col h-full">
            <div className="bg-gray-800 rounded-lg p-4 shadow-xl border border-gray-700 flex-1 flex flex-col">
              <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
                💻 Source Code
              </h2>
              <div className="flex-1 min-h-0">
                <CodeEditor value={code} onChange={setCode} />
              </div>
            </div>
          </div>

          {/* Right Column - Output */}
          <div className="bg-gray-800 rounded-lg p-4 shadow-xl border border-gray-700 flex flex-col h-full overflow-hidden">
            {/* Main Tabs */}
            <div className="flex gap-1 mb-4 border-b border-gray-700 overflow-x-auto pb-2">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setSelectedTab(tab.id)}
                  className={`px-4 py-2 font-medium transition-all whitespace-nowrap text-sm ${
                    selectedTab === tab.id
                      ? 'text-blue-400 border-b-2 border-blue-400 -mb-[2px]'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  {tab.icon} {tab.label}
                </button>
              ))}
            </div>

            {/* Output Content */}
            <div className="flex-1 overflow-hidden">
              {renderSingleOutput()}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
