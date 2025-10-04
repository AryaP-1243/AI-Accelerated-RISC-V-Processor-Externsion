
import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { Section } from './Section';
import { SignalIcon } from './icons/SignalIcon';
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, CartesianGrid, LabelList, LineChart, Line, AreaChart, Area } from 'recharts';

type Status = 'disconnected' | 'connecting' | 'connected' | 'error';

type Board = {
  id: string;
  name: string;
  ip: string;
};

type BenchmarkResults = {
  hw_latency_ms: number;
  sw_latency_ms: number;
  hw_energy_mj: number;
  sw_energy_mj: number;
  speedup: number;
  energy_efficiency: number;
  hw_power_w?: number[];
};

type HistoryEntry = BenchmarkResults & {
    boardName: string;
    timestamp: string;
};

type SortKey = 'timestamp' | 'speedup' | 'energy_efficiency' | 'hw_latency_ms';

const LoadingSpinner: React.FC = () => (
    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-slate-100"></div>
);

const Step: React.FC<{ number: number, title: string, children: React.ReactNode, active: boolean }> = ({ number, title, children, active }) => (
    <div className={`p-6 rounded-lg border transition-all duration-500 ${active ? 'bg-slate-800/50 border-slate-700' : 'bg-slate-800/20 border-transparent'}`}>
        <h3 className={`flex items-center text-xl font-bold mb-4 ${active ? 'text-cyan-400' : 'text-slate-500'}`}>
            <span className={`flex items-center justify-center w-8 h-8 rounded-full mr-4 text-slate-900 font-bold transition-colors ${active ? 'bg-cyan-400' : 'bg-slate-600'}`}>
                {number}
            </span>
            {title}
        </h3>
        {active && <div className="pl-12">{children}</div>}
    </div>
);

const ManageBoardsModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    boards: Board[];
    addBoard: (name: string, ip: string) => void;
    deleteBoard: (id: string) => void;
}> = ({ isOpen, onClose, boards, addBoard, deleteBoard }) => {
    const [newName, setNewName] = useState('');
    const [newIp, setNewIp] = useState('');

    const handleAdd = () => {
        if(newName && newIp) {
            addBoard(newName, newIp);
            setNewName('');
            setNewIp('');
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in" style={{animationDuration: '0.2s'}}>
            <div className="bg-slate-800 border border-slate-700 rounded-lg shadow-xl w-full max-w-2xl p-6 m-4">
                <h2 className="text-2xl font-bold text-slate-100 mb-4">Manage PYNQ Boards</h2>
                
                <div className="mb-6 bg-slate-900/50 p-4 rounded-lg">
                    <h3 className="text-lg font-semibold text-cyan-400 mb-3">Add New Board</h3>
                    <div className="flex items-center space-x-4">
                        <input type="text" value={newName} onChange={e => setNewName(e.target.value)} placeholder="Board Name (e.g., PYNQ-Lab-01)" className="flex-grow p-2 bg-slate-900 text-slate-100 rounded-md border border-slate-600 focus:outline-none focus:ring-2 focus:ring-cyan-500"/>
                        <input type="text" value={newIp} onChange={e => setNewIp(e.target.value)} placeholder="IP Address (e.g., 192.168.2.99)" className="flex-grow p-2 bg-slate-900 text-slate-100 rounded-md border border-slate-600 focus:outline-none focus:ring-2 focus:ring-cyan-500"/>
                        <button onClick={handleAdd} className="bg-cyan-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-cyan-700 disabled:bg-slate-600" disabled={!newName || !newIp}>Add</button>
                    </div>
                </div>

                <div className="max-h-64 overflow-y-auto pr-2">
                    {boards.length > 0 ? (
                        <table className="w-full text-left">
                            <thead>
                                <tr className="border-b border-slate-700">
                                    <th className="p-2 text-slate-300">Name</th>
                                    <th className="p-2 text-slate-300">IP Address</th>
                                    <th className="p-2"></th>
                                </tr>
                            </thead>
                            <tbody>
                                {boards.map(board => (
                                    <tr key={board.id} className="border-b border-slate-700/50">
                                        <td className="p-2 text-slate-100">{board.name}</td>
                                        <td className="p-2 text-slate-400 font-mono">{board.ip}</td>
                                        <td className="p-2 text-right">
                                            <button onClick={() => deleteBoard(board.id)} className="text-red-400 hover:text-red-300 text-sm">Delete</button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    ) : <p className="text-slate-500 text-center py-4">No boards configured yet.</p>}
                </div>

                <div className="mt-6 text-right">
                    <button onClick={onClose} className="bg-slate-600 text-white font-bold py-2 px-6 rounded-lg hover:bg-slate-700">Close</button>
                </div>
            </div>
        </div>
    );
};

const ResultChart: React.FC<{data: any[], dataKeys: {key: string, color: string}[], unit: string}> = ({data, dataKeys, unit}) => (
    <div className="bg-slate-800/50 p-4 rounded-lg border border-slate-700 h-64">
        <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} layout="vertical" margin={{ top: 20, right: 60, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis type="number" stroke="#94a3b8" domain={[0, 'dataMax + 10']} />
                <YAxis type="category" dataKey="name" stroke="#94a3b8" width={80} axisLine={false} tickLine={false} />
                <Tooltip
                    contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '0.5rem' }}
                    cursor={{ fill: 'rgba(100, 116, 139, 0.1)' }}
                    formatter={(value: number) => `${value.toFixed(2)} ${unit}`}
                />
                <Legend />
                {dataKeys.map(dk => (
                    <Bar key={dk.key} dataKey={dk.key} fill={dk.color} radius={[0, 4, 4, 0]} barSize={25}>
                        <LabelList dataKey={dk.key} position="right" style={{ fill: '#f1f5f9' }} formatter={(v: number) => v.toFixed(2)} />
                    </Bar>
                ))}
            </BarChart>
        </ResponsiveContainer>
    </div>
);

const PowerChart: React.FC<{powerData?: number[]}> = ({ powerData }) => {
    const data = useMemo(() => 
        powerData?.map((p, i) => ({ name: i, Watts: p })) || [], 
        [powerData]
    );

    return (
        <div className="bg-slate-800/50 p-4 rounded-lg border border-slate-700 h-64">
            <h4 className="text-sm font-semibold text-slate-400 mb-2">FPGA Power Consumption (PL Rail)</h4>
            <ResponsiveContainer width="100%" height="85%">
                <AreaChart data={data} margin={{ top: 5, right: 20, left: -10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis dataKey="name" stroke="#94a3b8" tick={false} label={{ value: 'Time', position: 'insideBottom', offset: -5, fill: '#94a3b8' }} />
                    <YAxis stroke="#94a3b8" unit="W" domain={['dataMin - 0.2', 'dataMax + 0.2']} />
                    <Tooltip
                        contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '0.5rem' }}
                        formatter={(value: number) => `${value.toFixed(3)} W`}
                    />
                    <Area type="monotone" dataKey="Watts" stroke="#22d3ee" fill="url(#colorUv)" />
                     <defs>
                        <linearGradient id="colorUv" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#22d3ee" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#22d3ee" stopOpacity={0}/>
                        </linearGradient>
                    </defs>
                </AreaChart>
            </ResponsiveContainer>
        </div>
    );
};


export const LiveBenchmarking: React.FC = () => {
    const [boards, setBoards] = useState<Board[]>([]);
    const [selectedBoardId, setSelectedBoardId] = useState<string>('');
    const [isManageModalOpen, setIsManageModalOpen] = useState(false);
    const [status, setStatus] = useState<Status>('disconnected');
    const [statusMessage, setStatusMessage] = useState('Select a board and connect.');
    const [bitFile, setBitFile] = useState<File | null>(null);
    const [binFile, setBinFile] = useState<File | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [results, setResults] = useState<BenchmarkResults | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [history, setHistory] = useState<HistoryEntry[]>([]);
    const [historyFilter, setHistoryFilter] = useState<string>('all');
    const [historySort, setHistorySort] = useState<{key: SortKey, direction: 'asc' | 'desc'}>({key: 'timestamp', direction: 'desc'});


    useEffect(() => {
        const savedBoards = JSON.parse(localStorage.getItem('pynq_boards') || '[]');
        const savedHistory = JSON.parse(localStorage.getItem('pynq_benchmark_history') || '[]');
        setBoards(savedBoards);
        setHistory(savedHistory);
        if (savedBoards.length > 0 && !selectedBoardId) {
            setSelectedBoardId(savedBoards[0].id);
        }
    }, [selectedBoardId]);

    const selectedBoard = useMemo(() => boards.find(b => b.id === selectedBoardId), [boards, selectedBoardId]);

    const handleConnect = useCallback(async () => {
        if (!selectedBoard) {
            setStatus('error');
            setStatusMessage('Please add and select a board to connect.');
            return;
        }
        setStatus('connecting');
        setStatusMessage(`Connecting to ${selectedBoard.name}...`);
        setError(null);
        try {
            const response = await fetch(`http://${selectedBoard.ip}:5000/status`);
            if (!response.ok) throw new Error('Server did not respond correctly.');
            const data = await response.json();
            if (data.status === 'PYNQ server is running') {
                setStatus('connected');
                setStatusMessage(`Successfully connected to ${selectedBoard.name}.`);
            } else {
                throw new Error('Unexpected server response.');
            }
        } catch (err) {
            setStatus('error');
            setStatusMessage(`Connection failed. Ensure the server is running on ${selectedBoard.name} (${selectedBoard.ip}).`);
            console.error(err);
        }
    }, [selectedBoard]);

    const handleRunBenchmark = useCallback(async () => {
        if (!bitFile || !binFile || status !== 'connected' || !selectedBoard) {
            setError("Please ensure you are connected to a board and have selected both a .bit and .bin file.");
            return;
        }
        setIsLoading(true);
        setError(null);
        setResults(null);

        const formData = new FormData();
        formData.append('bitfile', bitFile);
        formData.append('binfile', binFile);

        try {
            const response = await fetch(`http://${selectedBoard.ip}:5000/run_benchmark`, {
                method: 'POST',
                body: formData,
            });
            const data = await response.json();
            if (!response.ok || data.error) {
                throw new Error(data.error || 'An unknown error occurred during benchmarking.');
            }
            setResults(data);
        } catch (err: any) {
            setError(`Benchmark failed: ${err.message}`);
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    }, [selectedBoard, bitFile, binFile, status]);
    
    const addBoard = (name: string, ip: string) => {
        const newBoard: Board = { id: Date.now().toString(), name, ip };
        const updatedBoards = [...boards, newBoard];
        setBoards(updatedBoards);
        setSelectedBoardId(newBoard.id);
        localStorage.setItem('pynq_boards', JSON.stringify(updatedBoards));
    };

    const deleteBoard = (id: string) => {
        const updatedBoards = boards.filter(b => b.id !== id);
        setBoards(updatedBoards);
        localStorage.setItem('pynq_boards', JSON.stringify(updatedBoards));
        if (selectedBoardId === id) {
            setSelectedBoardId(updatedBoards.length > 0 ? updatedBoards[0].id : '');
            setStatus('disconnected');
            setStatusMessage('Select a board and connect.');
        }
    };
    
    const saveResultToHistory = () => {
        if (!results || !selectedBoard) return;
        const newEntry: HistoryEntry = {
            ...results,
            boardName: selectedBoard.name,
            timestamp: new Date().toISOString(),
        };
        const updatedHistory = [newEntry, ...history];
        setHistory(updatedHistory);
        localStorage.setItem('pynq_benchmark_history', JSON.stringify(updatedHistory));
        setResults(null);
    };

    const latencyData = useMemo(() => results ? [
        { name: 'Latency', 'Software (ARM)': results.sw_latency_ms, 'Hardware (Custom ISA)': results.hw_latency_ms }
    ] : [], [results]);

    const energyData = useMemo(() => results ? [
        { name: 'Energy', 'Software (ARM)': results.sw_energy_mj, 'Hardware (Custom ISA)': results.hw_energy_mj }
    ] : [], [results]);
    
    const sortedAndFilteredHistory = useMemo(() => {
        return history
            .filter(entry => historyFilter === 'all' || entry.boardName === historyFilter)
            .sort((a, b) => {
                const aVal = historySort.key === 'timestamp' ? new Date(a.timestamp).getTime() : a[historySort.key] || 0;
                const bVal = historySort.key === 'timestamp' ? new Date(b.timestamp).getTime() : b[historySort.key] || 0;
                if (historySort.direction === 'asc') {
                    return aVal - bVal;
                }
                return bVal - aVal;
            });
    }, [history, historyFilter, historySort]);

    const handleSort = (key: SortKey) => {
        if (historySort.key === key) {
            setHistorySort({ key, direction: historySort.direction === 'asc' ? 'desc' : 'asc' });
        } else {
            setHistorySort({ key, direction: 'desc' });
        }
    };


    const isStep1Active = true;
    const isStep2Active = status === 'connected';
    const isStep3Active = status === 'connected' && !!bitFile && !!binFile;

    return (
        <Section title="Live Hardware Benchmarking" icon={<SignalIcon />}>
            <ManageBoardsModal isOpen={isManageModalOpen} onClose={() => setIsManageModalOpen(false)} boards={boards} addBoard={addBoard} deleteBoard={deleteBoard} />
            
            <p className="text-slate-400 mb-8 max-w-4xl">
                This dashboard allows you to manage and interact with multiple PYNQ-Z2 FPGAs. Follow the steps below to upload your hardware bitstream, run them on physical hardware, and visualize the real-time metrics.
            </p>

            <div className="space-y-6">
                <Step number={1} title="Connect to PYNQ Board" active={isStep1Active}>
                    <div className="flex items-center space-x-4">
                        <select
                            value={selectedBoardId}
                            onChange={(e) => {
                                setSelectedBoardId(e.target.value);
                                setStatus('disconnected');
                                setStatusMessage('Select a board and connect.');
                            }}
                            className="flex-grow p-3 bg-slate-900 text-slate-100 rounded-md border border-slate-600 focus:outline-none focus:ring-2 focus:ring-cyan-500 disabled:opacity-50"
                            disabled={status === 'connecting'}
                        >
                            {boards.length === 0 ? (
                                <option value="">Please add a board</option>
                            ) : (
                                boards.map(board => <option key={board.id} value={board.id}>{board.name} ({board.ip})</option>)
                            )}
                        </select>
                         <button onClick={() => setIsManageModalOpen(true)} className="bg-slate-700 text-slate-200 font-bold py-3 px-6 rounded-lg hover:bg-slate-600">Manage Boards</button>
                        <button
                            onClick={handleConnect}
                            disabled={!selectedBoardId || status === 'connected' || status === 'connecting'}
                            className="bg-cyan-600 text-white font-bold py-3 px-6 rounded-lg hover:bg-cyan-700 disabled:bg-slate-600 disabled:cursor-not-allowed flex items-center space-x-2"
                        >
                            {status === 'connecting' && <LoadingSpinner />}
                            <span>{status === 'connected' ? 'Connected' : 'Connect'}</span>
                        </button>
                    </div>
                     <p className={`mt-3 text-sm ${status === 'error' ? 'text-red-400' : status === 'connected' ? 'text-green-400' : 'text-slate-500'}`}>
                        {statusMessage}
                    </p>
                </Step>
                
                <Step number={2} title="Upload Hardware Files" active={isStep2Active}>
                     <div className="grid md:grid-cols-2 gap-6">
                         <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">FPGA Bitstream (`.bit`)</label>
                            <input type="file" accept=".bit" onChange={e => setBitFile(e.target.files ? e.target.files[0] : null)} className="w-full text-sm text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-slate-700 file:text-slate-200 hover:file:bg-slate-600"/>
                        </div>
                        <div>
                             <label className="block text-sm font-medium text-slate-300 mb-2">RISC-V Program (`.bin`)</label>
                            <input type="file" accept=".bin" onChange={e => setBinFile(e.target.files ? e.target.files[0] : null)} className="w-full text-sm text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-slate-700 file:text-slate-200 hover:file:bg-slate-600"/>
                        </div>
                    </div>
                </Step>

                <Step number={3} title="Deploy and Run Benchmark" active={isStep3Active}>
                     <button
                        onClick={handleRunBenchmark}
                        disabled={isLoading}
                        className="bg-cyan-600 text-white font-bold py-3 px-8 rounded-lg text-lg hover:bg-cyan-700 disabled:bg-slate-600 disabled:cursor-not-allowed transition-all duration-300 hover:scale-105 disabled:scale-100 flex items-center space-x-3"
                    >
                        {isLoading && <LoadingSpinner />}
                        <span>{isLoading ? 'Running on Hardware...' : 'Run Benchmark'}</span>
                    </button>
                </Step>
            </div>
            
            {error && 
                <div className="mt-8 bg-red-900/50 border border-red-500 text-red-300 px-4 py-3 rounded-lg" role="alert">
                    <strong className="font-bold">Error: </strong>
                    <span className="block sm:inline">{error}</span>
                </div>
            }

            {results && !isLoading &&
                <div className="mt-12 animate-fade-in">
                    <div className="flex justify-between items-center mb-8">
                         <h3 className="text-3xl font-bold text-slate-100">Benchmark Results for <span className="text-cyan-400">{selectedBoard?.name}</span></h3>
                         <button onClick={saveResultToHistory} className="bg-cyan-600 text-white font-bold py-2 px-6 rounded-lg hover:bg-cyan-700">Save to History</button>
                    </div>
                    <div className="grid lg:grid-cols-3 gap-6 text-center">
                        <div className="bg-slate-800/50 p-6 rounded-lg border border-slate-700">
                             <h4 className="text-lg font-semibold text-slate-400 mb-1">Performance Speedup</h4>
                             <p className="text-5xl font-bold text-cyan-400">{results.speedup.toFixed(2)}x</p>
                             <p className="text-slate-500">(Hardware vs. Software)</p>
                        </div>
                         <div className="bg-slate-800/50 p-6 rounded-lg border border-slate-700">
                             <h4 className="text-lg font-semibold text-slate-400 mb-1">Energy Efficiency Gain</h4>
                             <p className="text-5xl font-bold text-cyan-400">{results.energy_efficiency.toFixed(2)}x</p>
                             <p className="text-slate-500">(Hardware vs. Software)</p>
                        </div>
                        <div className="bg-slate-800/50 p-6 rounded-lg border border-slate-700">
                             <h4 className="text-lg font-semibold text-slate-400 mb-1">HW Latency</h4>
                             <p className="text-5xl font-bold text-cyan-400">{results.hw_latency_ms.toFixed(2)}</p>
                              <p className="text-slate-500">(milliseconds)</p>
                        </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-8 mt-8">
                        <ResultChart 
                            data={latencyData} 
                            dataKeys={[
                                { key: 'Software (ARM)', color: '#64748b'},
                                { key: 'Hardware (Custom ISA)', color: '#22d3ee'}
                            ]}
                            unit="ms"
                        />
                        <ResultChart 
                            data={energyData} 
                            dataKeys={[
                                { key: 'Software (ARM)', color: '#64748b'},
                                { key: 'Hardware (Custom ISA)', color: '#22d3ee'}
                            ]}
                            unit="mJ"
                        />
                    </div>
                    {results.hw_power_w && results.hw_power_w.length > 0 &&
                        <div className="mt-8">
                            <PowerChart powerData={results.hw_power_w} />
                        </div>
                    }
                </div>
            }

            <div className="mt-12">
                 <div className="flex justify-between items-center mb-6">
                    <h3 className="text-3xl font-bold text-slate-100">Benchmark History</h3>
                    <div className="flex items-center space-x-4">
                        <select
                            value={historyFilter}
                            onChange={e => setHistoryFilter(e.target.value)}
                            className="p-2 bg-slate-700 text-slate-100 rounded-md border border-slate-600 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                        >
                            <option value="all">All Boards</option>
                            {boards.map(b => <option key={b.id} value={b.name}>{b.name}</option>)}
                        </select>
                    </div>
                 </div>
                 <div className="bg-slate-800/50 rounded-lg border border-slate-700 overflow-hidden">
                    <div className="max-h-96 overflow-y-auto">
                        {sortedAndFilteredHistory.length > 0 ? (
                            <table className="w-full text-left">
                                <thead className="bg-slate-900/50 sticky top-0">
                                    <tr className="border-b border-slate-700">
                                        <th className="p-3 text-slate-300">Board Name</th>
                                        <th className="p-3 text-slate-300"><button onClick={() => handleSort('timestamp')}>Timestamp</button></th>
                                        <th className="p-3 text-slate-300"><button onClick={() => handleSort('speedup')}>Speedup</button></th>
                                        <th className="p-3 text-slate-300"><button onClick={() => handleSort('energy_efficiency')}>Energy Gain</button></th>
                                        <th className="p-3 text-slate-300"><button onClick={() => handleSort('hw_latency_ms')}>HW Latency (ms)</button></th>
                                        <th className="p-3 text-slate-300">SW Latency (ms)</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-700/50">
                                    {sortedAndFilteredHistory.map((entry, index) => (
                                        <tr key={index} className="hover:bg-slate-700/20">
                                            <td className="p-3 text-slate-100">{entry.boardName}</td>
                                            <td className="p-3 text-slate-400">{new Date(entry.timestamp).toLocaleString()}</td>
                                            <td className="p-3 text-cyan-400 font-semibold">{entry.speedup.toFixed(2)}x</td>
                                            <td className="p-3 text-cyan-400 font-semibold">{entry.energy_efficiency.toFixed(2)}x</td>
                                            <td className="p-3 text-slate-300">{entry.hw_latency_ms.toFixed(2)}</td>
                                            <td className="p-3 text-slate-300">{entry.sw_latency_ms.toFixed(2)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        ) : <p className="text-slate-500 text-center p-8">No saved benchmark results yet.</p>}
                    </div>
                 </div>
            </div>
        </Section>
    );
};
