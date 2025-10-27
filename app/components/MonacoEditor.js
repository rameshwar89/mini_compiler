'use client';
import { useState } from 'react';
import Editor from '@monaco-editor/react';
import { Compiler } from '@/lib/compiler';

const defaultCode = `// Mini Compiler Example
// Supports: variables, arithmetic, conditionals, loops, print

let x = 10;
let y = 20;
let sum = x + y;
print(sum);

let i = 1;
while (i <= 5) {
  print(i * i);
  i = i + 1;
}

if (sum > 25) {
  print("Sum is greater than 25");
} else {
  print("Sum is 25 or less");
}
`;

export default function MonacoEditor() {
    const [code, setCode] = useState(defaultCode);
    const [selectedStage, setSelectedStage] = useState('execute');
    const [result, setResult] = useState(null);
    const [showAllStages, setShowAllStages] = useState(false);
    const [activeTab, setActiveTab] = useState('tokens');

    const handleCompile = () => {
        const compiler = new Compiler();

        if (showAllStages) {
            const allResults = compiler.compileAllStages(code);
            setResult(allResults);
        } else {
            const options = {
                tokens: selectedStage === 'tokens',
                ast: selectedStage === 'ast',
                ir: selectedStage === 'ir',
                execute: selectedStage === 'execute',
                generateAssembly: selectedStage === 'assembly',
                generateJavaScript: selectedStage === 'javascript',
            };

            const compileResult = compiler.compile(code, options);
            setResult(compileResult);
        }
    };

    const renderOutput = () => {
        if (!result) return null;

        if (showAllStages && result.success && result.formatted) {
            const tabs = [
                { id: 'tokens', label: 'Tokens', content: result.formatted.tokens },
                { id: 'ast', label: 'AST', content: result.formatted.ast },
                { id: 'ir', label: 'Intermediate Code', content: result.formatted.ir },
                { id: 'output', label: 'Output', content: result.formatted.output }
            ];

            return (
                <div className="flex flex-col h-full p-4">
                    {/* Tab Headers */}
                    <div className="flex border-b border-gray-700 mb-4 shrink-0">
                        {tabs.map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`px-4 py-2 font-medium transition-colors ${activeTab === tab.id
                                        ? 'text-blue-400 border-b-2 border-blue-400'
                                        : 'text-gray-400 hover:text-gray-300'
                                    }`}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>

                    {/* Tab Content */}
                    <div className="flex-1 overflow-hidden min-h-0">
                        {tabs.map((tab) => (
                            <div
                                key={tab.id}
                                className={`h-full overflow-auto ${activeTab === tab.id ? 'block' : 'hidden'}`}
                            >
                                <div className="bg-gray-700/50 p-4 rounded">
                                    <pre className="text-sm text-gray-300 whitespace-pre-wrap">
                                        {tab.content}
                                    </pre>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            );
        }

        if (result.success) {
            const stageTitles = {
                tokens: 'Tokens',
                ast: 'Abstract Syntax Tree',
                ir: 'Intermediate Representation',
                execute: 'Program Output',
                assembly: 'Assembly Code',
                javascript: 'JavaScript Code'
            };

            return (
                <div className="h-full flex flex-col p-4">
                    <h3 className="text-lg font-semibold text-green-400 mb-3 shrink-0">
                        ✓ {stageTitles[result.stage] || 'Output'}
                    </h3>
                    <div className="flex-1 overflow-auto bg-gray-700/50 p-4 rounded min-h-0">
                        <pre className="text-sm text-gray-300 whitespace-pre-wrap">
                            {result.output}
                        </pre>
                    </div>
                </div>
            );
        } else {
            return (
                <div className="h-full flex flex-col p-4">
                    <h3 className="text-lg font-semibold text-red-400 mb-3 shrink-0">✗ Compilation Error</h3>
                    <div className="flex-1 overflow-auto bg-red-900/30 border border-red-500 p-4 rounded min-h-0">
                        <pre className="text-sm text-red-300 whitespace-pre-wrap">{result.error || result.output}</pre>
                    </div>
                </div>
            );
        }
    };

    return (
        <div className="flex flex-col h-screen bg-gray-900 text-white p-4">
            <div className="mb-4">
                <h1 className="text-3xl font-bold mb-2">Mini Compiler</h1>
                <p className="text-gray-400">
                    Tokenization → Parsing → Intermediate Code → Output
                </p>
            </div>

            <div className="flex gap-4 mb-4 flex-wrap">
                <div className="flex items-center gap-2">
                    <label className="text-sm font-medium">Compilation Stage:</label>
                    <select
                        value={selectedStage}
                        onChange={(e) => {
                            setSelectedStage(e.target.value);
                            setShowAllStages(false);
                        }}
                        disabled={showAllStages}
                        className="bg-gray-800 border border-gray-700 rounded px-3 py-1 text-sm disabled:opacity-50"
                    >
                        <option value="tokens">Tokens</option>
                        <option value="ast">AST</option>
                        <option value="ir">Intermediate Code</option>
                        <option value="execute">Execute</option>
                        <option value="assembly">Assembly</option>
                        <option value="javascript">JavaScript</option>
                    </select>
                </div>

                <div className="flex items-center gap-2">
                    <input
                        type="checkbox"
                        id="showAll"
                        checked={showAllStages}
                        onChange={(e) => setShowAllStages(e.target.checked)}
                        className="w-4 h-4"
                    />
                    <label htmlFor="showAll" className="text-sm font-medium">
                        Show All Stages
                    </label>
                </div>

                <button
                    onClick={handleCompile}
                    className="bg-blue-600 hover:bg-blue-700 px-6 py-2 rounded font-medium transition-colors"
                >
                    Compile
                </button>
            </div>

            <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-4 overflow-hidden">
                <div className="flex flex-col">
                    <h2 className="text-xl font-semibold mb-2">Source Code</h2>
                    <div className="flex-1 border border-gray-700 rounded overflow-hidden">
                        <Editor
                            height="100%"
                            defaultLanguage="javascript"
                            theme="vs-dark"
                            value={code}
                            onChange={(value) => setCode(value || '')}
                            options={{
                                minimap: { enabled: false },
                                fontSize: 14,
                                lineNumbers: 'on',
                                scrollBeyondLastLine: false,
                                automaticLayout: true,
                            }}
                        />
                    </div>
                </div>

                <div className="flex flex-col overflow-hidden">
                    <h2 className="text-xl font-semibold mb-2">Output</h2>
                    <div className="flex-1 border border-gray-700 rounded overflow-hidden bg-gray-800">
                        {result ? (
                            renderOutput()
                        ) : (
                            <p className="text-gray-500 p-4">Click "Compile" to see results</p>
                        )}
                    </div>
                </div>
            </div>

            <div className="mt-4 text-sm text-gray-500">
                <p>Supported features: variables (let), arithmetic (+,-,*,/,%), comparisons (==,!=,&lt;,&gt;,&lt;=,&gt;=), if/else, while loops, print()</p>
            </div>
        </div>
    );
}
