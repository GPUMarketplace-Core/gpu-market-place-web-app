"use client";

import { useState, useEffect } from "react";

const DEFAULT_NODE_ID = '1819a3d6-2748-4a35-816c-c2b9b4475eff';

export default function Dashboard() {
    const [openMenu, setOpenMenu] = useState<number | null>(null);
    const [showDetails, setShowDetails] = useState<number | null>(null);
    const [nodeSpecs, setNodeSpecs] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [newPrice, setNewPrice] = useState('');
    const [updating, setUpdating] = useState(false);

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
        fetchNodeSpecs();
    }, []);

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
                onClick={() =>
                    setOpenMenu(openMenu === rowIndex ? null : rowIndex)
                }
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
        <div
            className="min-h-screen bg-contain bg-center bg-no-repeat relative"
            style={{ backgroundImage: "url('/Untitled design.png')" }}
        >
            <div className="absolute top-[45%] right-[29%]">
                <SettingsMenu rowIndex={1} />
            </div>
            <div className="absolute top-[49%] right-[29%]">
                <SettingsMenu rowIndex={2} />
            </div>
            <div className="absolute top-[53%] right-[29%]">
                <SettingsMenu rowIndex={3} />
            </div>
        </div>
    );
}
