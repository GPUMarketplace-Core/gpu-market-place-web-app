"use client";

import { useState, useEffect } from "react";

type ProfileType = 'requester' | 'provider';

interface JobHistoryItem {
    id: string;
    title: string;
    avatar: string;
}

interface RequesterProfileProps {
    onProfileChange?: (type: ProfileType) => void;
}

export default function RequesterProfile({ onProfileChange }: RequesterProfileProps) {
    const [profileType, setProfileType] = useState<ProfileType>('requester');
    const [jobStats] = useState({
        pending: 2,
        processing: 1,
        completed: 8,
    });

    const [balance] = useState(50.0);
    const [rating] = useState(4.8);
    const [totalReviews] = useState(127);

    const [jobHistory] = useState<JobHistoryItem[]>([
        { id: "1", title: "GPU Training Job #1", avatar: "👤" },
        { id: "2", title: "Model Inference Task", avatar: "🤖" },
        { id: "3", title: "Data Processing", avatar: "📊" },
    ]);

    // Provider-specific state
    const [openMenu, setOpenMenu] = useState<number | null>(null);
    const [showDetails, setShowDetails] = useState<number | null>(null);
    const [nodeSpecs, setNodeSpecs] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [newPrice, setNewPrice] = useState('');
    const [updating, setUpdating] = useState(false);

    const DEFAULT_NODE_ID = '1819a3d6-2748-4a35-816c-c2b9b4475eff';

    const fetchNodeSpecs = async () => {
        setLoading(true);
        try {
            const response = await fetch('/api/nodes/specs');
            const data = await response.json();
            if (data.success) {
                setNodeSpecs(data.data);
            }
        } catch (error) {
            console.error('Failed to fetch node specs:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (profileType === 'provider') {
            fetchNodeSpecs();
        }
    }, [profileType]);

    const updateHourlyRate = async () => {
        if (!newPrice) return;
        setUpdating(true);
        try {
            const response = await fetch(`/api/nodes/${DEFAULT_NODE_ID}/pricing`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ hourly_price_cents: parseFloat(newPrice) * 100 })
            });
            const data = await response.json();
            if (data.success) {
                await fetchNodeSpecs();
                setNewPrice('');
            }
        } catch (error) {
            console.error('Failed to update price:', error);
        } finally {
            setUpdating(false);
        }
    };

    const SettingsMenu = ({ rowIndex }: { rowIndex: number }) => (
        <div className="relative">
            <button
                onClick={() => setOpenMenu(openMenu === rowIndex ? null : rowIndex)}
                className="p-2 hover:bg-gray-200 hover:bg-opacity-50 rounded"
            >
                <svg className="w-5 h-5 text-gray-700" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                </svg>
            </button>
            {openMenu === rowIndex && (
                <div className="absolute right-0 mt-1 w-32 bg-white border rounded shadow-lg z-10">
                    <button 
                        onClick={() => {
                            setShowDetails(rowIndex);
                            setOpenMenu(null);
                        }}
                        className="w-full px-3 py-2 text-left hover:bg-gray-100 text-black"
                    >
                        Settings
                    </button>
                </div>
            )}
            {showDetails === rowIndex && (
                <div className="absolute right-0 mt-1 w-64 bg-white border rounded shadow-lg z-20 p-4">
                    <h3 className="font-semibold mb-2 text-black">GPU Details</h3>
                    {loading ? (
                        <p className="text-black">Loading...</p>
                    ) : nodeSpecs.length > 0 ? (
                        <>
                            <p className="text-black"><strong>Model:</strong> {nodeSpecs[0].gpus?.[0]?.model || 'N/A'}</p>
                            <p className="text-black"><strong>VRAM:</strong> {nodeSpecs[0].gpus?.[0]?.vram_gb ? `${nodeSpecs[0].gpus[0].vram_gb}GB` : 'N/A'}</p>
                            <p className="text-black"><strong>Utilization:</strong> N/A</p>
                            <p className="text-black"><strong>Status:</strong> Available</p>
                            <p className="text-black"><strong>Price:</strong> {nodeSpecs[0].gpus?.[0]?.hourly_price_cents ? `$${(nodeSpecs[0].gpus[0].hourly_price_cents / 100).toFixed(2)}/hr` : 'N/A'}</p>
                            <div className="mt-3 border-t pt-3">
                                <label className="block text-sm font-medium text-black mb-1">Update Hourly Rate ($)</label>
                                <div className="flex gap-2">
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={newPrice}
                                        onChange={(e) => setNewPrice(e.target.value)}
                                        className="flex-1 px-2 py-1 border rounded text-sm text-black"
                                        placeholder=""
                                    />
                                    <button
                                        onClick={updateHourlyRate}
                                        disabled={updating || !newPrice}
                                        className="w-16 px-2 py-1 bg-blue-300 text-black rounded text-sm disabled:bg-gray-300"
                                    >
                                        {updating ? '...' : 'Update'}
                                    </button>
                                </div>
                            </div>
                        </>
                    ) : (
                        <p className="text-black">No data available</p>
                    )}
                    <button 
                        onClick={() => setShowDetails(null)}
                        className="mt-2 px-3 py-1 bg-blue-300 text-black rounded text-sm"
                    >
                        Close
                    </button>
                </div>
            )}
        </div>
    );

    return (
        <aside className="w-80 bg-gray-50 border-l p-5 space-y-5">
            {/* Profile Toggle */}
            <div className="flex bg-white rounded-lg p-1 border">
                <button
                    onClick={() => {
                        setProfileType('requester');
                        onProfileChange?.('requester');
                    }}
                    className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition ${
                        profileType === 'requester'
                            ? 'bg-blue-600 text-white'
                            : 'text-gray-600 hover:text-gray-900'
                    }`}
                >
                    Requester
                </button>
                <button
                    onClick={() => {
                        setProfileType('provider');
                        onProfileChange?.('provider');
                    }}
                    className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition ${
                        profileType === 'provider'
                            ? 'bg-blue-600 text-white'
                            : 'text-gray-600 hover:text-gray-900'
                    }`}
                >
                    Provider
                </button>
            </div>

            {/* Profile Card */}
            <div className="bg-white rounded-xl shadow-sm border p-5">
                <h3 className="text-sm font-semibold text-gray-800 mb-3">{profileType === 'requester' ? 'Requester Profile' : 'Provider Profile'}</h3>
                <div className="flex flex-col items-center">
                    <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center text-4xl">👥</div>
                    <h4 className="mt-2 font-semibold text-gray-700">Tanish Shah</h4>
                    {profileType === 'requester' ? (
                        <div className="text-xs text-gray-600 mt-2">
                            <div>Pending: <span className="text-blue-600 font-medium">{jobStats.pending}</span></div>
                            <div>Processing: <span className="text-orange-600 font-medium">{jobStats.processing}</span></div>
                            <div>Completed: <span className="text-green-600 font-medium">{jobStats.completed}</span></div>
                        </div>
                    ) : (
                        <div className="text-xs text-gray-600 mt-2">
                            <div>Active GPUs: <span className="text-green-600 font-medium">3</span></div>
                            <div>Total Revenue: <span className="text-blue-600 font-medium">$245.50</span></div>
                            <div>Uptime: <span className="text-orange-600 font-medium">98.5%</span></div>
                        </div>

                    )}
                    <button className="mt-3 p-2 rounded-full border hover:bg-gray-100">
                        <svg className="w-4 h-4 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z"/>
                        </svg>
                    </button>
                </div>
            </div>

            {/* Budget Balance / Reviews */}
            {profileType === 'requester' ? (
                <div className="bg-white rounded-xl shadow-sm border p-5 text-center">
                    <div className="flex items-center justify-center mb-2">
                        <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center text-lg">💚</div>
                    </div>
                    <h4 className="font-semibold text-gray-800 text-sm mb-1">Budget Balance</h4>
                    <div className="text-2xl font-bold text-gray-900 mb-3">${balance.toFixed(2)}</div>
                    <button className="bg-gray-100 text-gray-700 text-sm py-2 px-4 rounded-lg hover:bg-gray-200 transition">
                        Manage budget
                    </button>
                </div>
            ) : (
                <div className="bg-white rounded-xl shadow-sm border p-5 text-center">
                    <div className="flex items-center justify-center mb-2">
                        <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center text-lg">⭐</div>
                    </div>
                    <h4 className="font-semibold text-gray-800 text-sm mb-1">Reviews</h4>
                    <div className="text-2xl font-bold text-gray-900 mb-1">{rating}</div>
                    <div className="text-xs text-gray-600 mb-3">{totalReviews} reviews</div>
                    <button className="bg-gray-100 text-gray-700 text-sm py-2 px-4 rounded-lg hover:bg-gray-200 transition">
                        View Reviews
                    </button>
                </div>
            )}

            {/* History */}
            <div>
                <h4 className="font-semibold text-sm text-gray-800 mb-3">History</h4>
                <div className="space-y-3">
                    {jobHistory.map((job) => (
                        <div key={job.id} className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                                <div className="w-7 h-7 bg-gray-100 rounded-full flex items-center justify-center">
                                    <span className="text-xs">{job.avatar}</span>
                                </div>
                                <span className="text-sm text-gray-700">{job.title}</span>
                            </div>
                            <button className="text-blue-600 text-xs hover:text-blue-700">View</button>
                        </div>
                    ))}
                </div>
                <button className="mt-4 w-full text-blue-600 text-sm font-medium hover:text-blue-700">
                    See All
                </button>
            </div>
        </aside>
    );
}
