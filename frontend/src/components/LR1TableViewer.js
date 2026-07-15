'use client';

import { useState, useEffect } from 'react';

export default function LR1TableViewer() {
  const [lr1Data, setLr1Data] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedState, setSelectedState] = useState(0);
  const [viewMode, setViewMode] = useState('summary'); // 'summary', 'states', 'table', 'conflicts'

  useEffect(() => {
    const fetchLR1Table = async () => {
      try {
        setLoading(true);
        const response = await fetch('http://localhost:5000/api/lr1-table');
        const data = await response.json();

        if (data.success) {
          setLr1Data(data.lr1);
          setError('');
        } else {
          setError(data.error || 'Failed to fetch SLR(1) table');
        }
      } catch (err) {
        setError(`Failed to connect to backend: ${err.message}`);
      } finally {
        setLoading(false);
      }
    };

    fetchLR1Table();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-gray-400">Loading SLR(1) parsing table...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-red-400">{error}</div>
      </div>
    );
  }

  if (!lr1Data) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-gray-400">No SLR(1) data available</div>
      </div>
    );
  }

  const { grammar, productions, states, summary, conflicts, first_sets, follow_sets } = lr1Data;

  const renderFirstFollow = () => (
    <div className="h-full overflow-y-auto space-y-4">
      {/* Grammar Info */}
      <div className="bg-gray-700 rounded-lg p-4">
        <h3 className="font-semibold text-blue-400 mb-3">FIRST/FOLLOW and Grammar</h3>
        <div className="space-y-2 text-sm">
          <div>
            <span className="text-gray-400">Start Symbol:</span>
            <span className="text-green-400 ml-2 font-mono">{grammar.start_symbol}</span>
          </div>
          <div>
            <span className="text-gray-400">Augmented Start:</span>
            <span className="text-green-400 ml-2 font-mono">{grammar.augmented_start}</span>
          </div>
          <div>
            <span className="text-gray-400">Terminals:</span>
            <span className="text-yellow-400 ml-2">{grammar.terminals.length}</span>
          </div>
          <div>
            <span className="text-gray-400">Non-terminals:</span>
            <span className="text-yellow-400 ml-2">{grammar.nonterminals.length}</span>
          </div>
          <div className="pt-2 border-t border-gray-600 text-gray-400 text-xs">
            FIRST and FOLLOW sets are used to build SLR(1) ACTION/GOTO entries.
          </div>
        </div>
      </div>

      {/* FIRST Sets */}
      <div className="bg-gray-700 rounded-lg p-4">
        <h3 className="font-semibold text-blue-400 mb-3">FIRST Sets</h3>
        <div className="space-y-1 max-h-56 overflow-y-auto text-xs font-mono">
          {Object.entries(first_sets || {})
            .sort(([left], [right]) => left.localeCompare(right))
            .map(([symbol, values]) => (
              <div key={`first-${symbol}`} className="text-gray-300">
                <span className="text-cyan-300">FIRST({symbol})</span> = {'{ ' + values.join(', ') + ' }'}
              </div>
            ))}
        </div>
      </div>

      {/* FOLLOW Sets */}
      <div className="bg-gray-700 rounded-lg p-4">
        <h3 className="font-semibold text-blue-400 mb-3">FOLLOW Sets</h3>
        <div className="space-y-1 max-h-56 overflow-y-auto text-xs font-mono">
          {Object.entries(follow_sets || {})
            .sort(([left], [right]) => left.localeCompare(right))
            .map(([symbol, values]) => (
              <div key={`follow-${symbol}`} className="text-gray-300">
                <span className="text-emerald-300">FOLLOW({symbol})</span> = {'{ ' + values.join(', ') + ' }'}
              </div>
            ))}
        </div>
      </div>

      {/* Summary Stats */}
      <div className="bg-gray-700 rounded-lg p-4">
        <h3 className="font-semibold text-blue-400 mb-3">GOTO and Items Summary</h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-400">Total States:</span>
            <span className="text-green-400 font-mono font-semibold">{summary.states}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Total Productions:</span>
            <span className="text-green-400 font-mono font-semibold">{summary.productions}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Total Conflicts:</span>
            <span className={`font-mono font-semibold ${summary.conflict_count > 0 ? 'text-red-400' : 'text-green-400'}`}>
              {summary.conflict_count}
            </span>
          </div>
          <div className="flex justify-between border-t border-gray-600 pt-2">
            <span className="text-gray-400">SLR(1) Grammar:</span>
            <span className={summary.is_lr1 ? 'text-green-400 font-semibold' : 'text-red-400 font-semibold'}>
              {summary.is_lr1 ? 'Yes' : 'No'}
            </span>
          </div>
        </div>
      </div>

      {/* Productions List */}
      <div className="bg-gray-700 rounded-lg p-4">
        <h3 className="font-semibold text-blue-400 mb-3">Productions ({productions.length})</h3>
        <div className="space-y-1 max-h-48 overflow-y-auto text-xs">
          {productions.map((prod) => (
            <div key={prod.id} className="font-mono text-gray-300">
              <span className="text-yellow-400">[{prod.id}]</span> {prod.display}
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderGotoItems = () => (
    <div className="h-full flex flex-col gap-4">
      {/* State Selector */}
      <div className="flex gap-2 flex-wrap">
        <select
          value={selectedState}
          onChange={(e) => setSelectedState(parseInt(e.target.value))}
          className="bg-gray-700 text-gray-200 px-3 py-2 rounded text-sm border border-gray-600"
        >
          {states.map((state) => (
            <option key={state.id} value={state.id}>
              State {state.id}
            </option>
          ))}
        </select>
        <span className="text-gray-400 text-sm self-center">
          {states[selectedState]?.items.length || 0} items
        </span>
      </div>

      {/* Selected State Details */}
      <div className="flex-1 overflow-y-auto bg-gray-700 rounded-lg p-4">
        {states[selectedState] && (
          <>
            <h3 className="font-semibold text-blue-400 mb-3">State {selectedState} - LR(0) Items and GOTO</h3>
            <div className="space-y-2 text-xs">
              {states[selectedState].items.map((item, idx) => (
                <div
                  key={idx}
                  className="font-mono bg-gray-800 p-2 rounded border border-gray-600 hover:border-blue-400 transition-colors"
                >
                  <div className="text-yellow-400">{item.item}</div>
                  <div className="text-gray-400 mt-1">
                    Production: {item.production}, Lookahead: {item.lookahead}
                  </div>
                </div>
              ))}
            </div>

            {/* Transitions */}
            {Object.keys(states[selectedState].transitions).length > 0 && (
              <div className="mt-4 pt-4 border-t border-gray-600">
                <h4 className="font-semibold text-green-400 mb-2">GOTO Transitions</h4>
                <div className="space-y-1 text-xs">
                  {Object.entries(states[selectedState].transitions).map(([symbol, target]) => (
                    <div key={symbol} className="font-mono text-gray-300">
                      <span className="text-blue-400">{symbol}</span> → State{' '}
                      <span className="text-yellow-400">{target}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );

  const renderParseTable = () => (
    <div className="h-full overflow-x-auto overflow-y-auto">
      <table className="text-xs border-collapse bg-gray-700 rounded-lg overflow-hidden">
        <thead className="bg-gray-800 sticky top-0">
          <tr>
            <th className="border border-gray-600 px-2 py-1 text-left text-yellow-400 font-mono">
              State
            </th>
            {grammar.terminals.map((term) => (
              <th
                key={`act-${term}`}
                className="border border-gray-600 px-2 py-1 text-left text-blue-400 font-mono bg-blue-900/20"
              >
                {term}
              </th>
            ))}
            {grammar.nonterminals.map((nt) => (
              <th
                key={`goto-${nt}`}
                className="border border-gray-600 px-2 py-1 text-left text-green-400 font-mono bg-green-900/20"
              >
                {nt}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {lr1Data.table_rows.map((row) => (
            <tr key={row.state} className="hover:bg-gray-600 transition-colors">
              <td className="border border-gray-600 px-2 py-1 font-mono text-yellow-400 font-semibold">
                {row.state}
              </td>
              {grammar.terminals.map((term) => (
                <td
                  key={`act-${row.state}-${term}`}
                  className="border border-gray-600 px-2 py-1 font-mono text-gray-300 bg-blue-900/10"
                >
                  {row.action[term] || '-'}
                </td>
              ))}
              {grammar.nonterminals.map((nt) => (
                <td
                  key={`goto-${row.state}-${nt}`}
                  className="border border-gray-600 px-2 py-1 font-mono text-gray-300 bg-green-900/10"
                >
                  {row.goto[nt] || '-'}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  const renderItemConflicts = () => (
    <div className="h-full overflow-y-auto space-y-4">
      {conflicts.length === 0 ? (
        <div className="flex items-center justify-center h-full">
          <div className="text-green-400 text-center">
            <div>No conflicts! Grammar is LR(1)</div>
          </div>
        </div>
      ) : (
        <>
          <div className="bg-red-900/20 border border-red-500 rounded-lg p-4">
            <h3 className="font-semibold text-red-400 mb-2">Conflicts Found ({conflicts.length})</h3>
            <p className="text-xs text-gray-400 mb-4">
              The grammar has conflicts that make it not strictly SLR(1).
            </p>
          </div>

          <div className="space-y-2">
            {conflicts.map((conflict, idx) => (
              <div
                key={idx}
                className="bg-gray-700 rounded-lg p-3 text-sm border-l-4 border-red-500"
              >
                <div className="flex justify-between items-start gap-2">
                  <div>
                    <div className="text-gray-400">
                      <span className="font-mono">State {conflict.state}</span> on{' '}
                      <span className="font-mono text-yellow-400">{conflict.symbol}</span>
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      Existing: {JSON.stringify(conflict.existing).substring(0, 50)}...
                    </div>
                    <div className="text-xs text-gray-500">
                      Candidate: {JSON.stringify(conflict.candidate).substring(0, 50)}...
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );

  return (
    <div className="h-full flex flex-col">
      {/* View Mode Tabs */}
      <div className="flex gap-1 mb-4 border-b border-gray-700 overflow-x-auto pb-2 flex-shrink-0">
        {[
          { id: 'summary', label: 'FIRST/FOLLOW' },
          { id: 'states', label: 'GOTO Items' },
          { id: 'table', label: 'Parse Table' },
          { id: 'conflicts', label: 'Conflicts' },
        ].map((mode) => (
          <button
            key={mode.id}
            onClick={() => setViewMode(mode.id)}
            className={`px-4 py-2 font-medium transition-all whitespace-nowrap text-sm ${
              viewMode === mode.id
                ? 'text-blue-400 border-b-2 border-blue-400 -mb-[2px]'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            {mode.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        {viewMode === 'summary' && renderFirstFollow()}
        {viewMode === 'states' && renderGotoItems()}
        {viewMode === 'table' && renderParseTable()}
        {viewMode === 'conflicts' && renderItemConflicts()}
      </div>
    </div>
  );
}
