"use client";

import { useState, useEffect } from "react";
import { Home, Briefcase, CreditCard, Star, BookOpen, Settings, LogOut, Filter } from "lucide-react";
import RequesterProfile from "../components/RequesterProfile";

export default function DashboardPage() {
  const [profileType, setProfileType] = useState<'requester' | 'provider'>('requester');
  const [jobQueue] = useState([
    { title: "Aaa", type: "3D Rendering", price: "$10", status: "Completed" },
    { title: "Bbb", type: "ML", price: "$20", status: "Active" },
    { title: "Ccc", type: "ML", price: "$30", status: "Pending" },
  ]);

  const [history] = useState([
    { name: "A", avatar: "https://via.placeholder.com/30" },
    { name: "B", avatar: "https://via.placeholder.com/30" },
    { name: "C", avatar: "https://via.placeholder.com/30" },
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
    if (profileType !== 'provider') return;
    setLoading(true);
    try {
      const response = await fetch('/api/nodes/specs');
      if (!response.ok) throw new Error('Network response was not ok');
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

  useEffect(() => {
    fetchNodeSpecs();
  }, [profileType]);

  const SettingsMenu = ({ rowIndex }: { rowIndex: number }) => (
    <div className="relative">
      <button
        onClick={() => setOpenMenu(openMenu === rowIndex ? null : rowIndex)}
        className="p-1 hover:bg-gray-200 hover:bg-opacity-50 rounded"
      >
        <svg className="w-4 h-4 text-gray-700" fill="currentColor" viewBox="0 0 20 20">
          <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
        </svg>
      </button>
      {openMenu === rowIndex && (
        <div className="absolute right-0 mt-1 w-32 bg-white border rounded shadow-lg z-10">
          <button 
            onClick={() => {
              setShowDetails(rowIndex);
              setOpenMenu(null);
              fetchNodeSpecs();
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
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="w-56 bg-white border-r flex flex-col justify-between p-4">
        <div>
          <h1 className="text-lg font-semibold mb-6 text-blue-600">OPENGPU</h1>
          <nav className="space-y-3">
            <SidebarItem icon={<Home size={16} />} text="Dashboard" active />
            <SidebarItem icon={<Briefcase size={16} />} text="Jobs" />
            <SidebarItem icon={<CreditCard size={16} />} text="Billing" />
            <SidebarItem icon={<Star size={16} />} text="Reviews" />
            <SidebarItem icon={<BookOpen size={16} />} text="Knowledge Base" />
          </nav>
        </div>

        <div className="space-y-3">
          <SidebarItem icon={<Settings size={16} />} text="Settings" />
          <SidebarItem icon={<LogOut size={16} />} text="Logout" red />
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-6 space-y-6">
        {/* Top bar */}
        <div className="flex items-center gap-4">
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="Search GPUs here"
              className="w-full border-2 border-gray-300 rounded-full pl-4 pr-10 py-2 text-sm text-gray-900 focus:ring-2 focus:ring-blue-400 focus:border-blue-400"
            />
            <Filter className="absolute right-3 top-2.5 text-gray-400" size={16} />
          </div>
          <button className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700 transition whitespace-nowrap">
            {profileType === 'provider' ? 'Download Desktop Client' : 'Request a Job'}
          </button>
        </div>

        {/* Profile */}
        <div className="flex flex-col items-center">
          <div className="w-24 h-24 rounded-full bg-blue-100 flex items-center justify-center text-5xl">👥</div>
          <h2 className="mt-3 font-semibold text-gray-700">Tanish Shah</h2>
        </div>

        {/* Job Queue */}
        <div>
          <h3 className="font-semibold text-gray-800 mb-2">Job Queue</h3>
          <div className="bg-blue-100 rounded-lg p-4">
            <table className="w-full text-sm text-gray-700 table-fixed">
              <thead>
                <tr className="text-left border-b border-gray-300">
                  <th className="pb-1 w-1/4">Title</th>
                  <th className="w-1/4">Type</th>
                  <th className="w-1/4">Price</th>
                  <th className="w-1/4">Status</th>
                  {profileType === 'provider' && <th className="w-16"></th>}
                </tr>
              </thead>
              <tbody>
                {jobQueue.map((job, idx) => (
                  <tr key={idx} className="border-t border-gray-200">
                    <td className="py-2">{job.title}</td>
                    <td>{job.type}</td>
                    <td>{job.price}</td>
                    <td>
                      <span
                        className={`px-2 py-1 rounded text-xs ${
                          job.status === "Completed"
                            ? "bg-green-100 text-green-700"
                            : job.status === "Active"
                            ? "bg-yellow-100 text-yellow-700"
                            : "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {job.status}
                      </span>
                    </td>
                    {profileType === 'provider' && (
                      <td>
                        <SettingsMenu rowIndex={idx + 1} />
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Other Sections */}
        <Section title="Payment Methods">A<br />B</Section>
        <Section title="Favorite Providers">A<br />B</Section>
        <Section title="Storage">A</Section>

        <div className="flex space-x-4">
          <button className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition">Save</button>
          <button className="flex-1 bg-white border py-2 rounded-lg hover:bg-gray-50 transition">Cancel</button>
        </div>
      </main>

      {/* Right Sidebar */}
      <RequesterProfile onProfileChange={setProfileType} />
    </div>
  );
}

function SidebarItem({ icon, text, active = false, red = false }: any) {
  return (
    <button
      className={`flex items-center space-x-2 text-sm w-full py-2 px-3 rounded-lg ${
        red
          ? "text-red-600 hover:bg-red-50"
          : active
          ? "bg-blue-50 text-blue-600 font-medium"
          : "text-gray-600 hover:bg-gray-50"
      }`}
    >
      {icon}
      <span>{text}</span>
    </button>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="font-semibold text-gray-800 mb-2">{title}</h3>
      <div className="bg-blue-100 rounded-lg p-4 text-sm text-gray-700">{children}</div>
    </div>
  );
}
