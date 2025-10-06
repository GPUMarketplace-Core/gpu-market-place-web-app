'use client';

import { useState } from 'react';

export default function RoleToggle() {
  const [role, setRole] = useState<'customer' | 'provider'>('customer');

  return (
    <div className="flex flex-col items-center gap-4 p-8">
      <h2 className="text-2xl font-bold text-green-600">GPU Marketplace</h2>
      
      <div className="flex items-center gap-4">
        <span className={`font-medium ${role === 'customer' ? 'text-green-600' : 'text-gray-400'}`}>
          Customer
        </span>
        
        <button
          onClick={() => setRole(role === 'customer' ? 'provider' : 'customer')}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
            role === 'provider' ? 'bg-green-600' : 'bg-gray-300'
          }`}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
              role === 'provider' ? 'translate-x-6' : 'translate-x-1'
            }`}
          />
        </button>
        
        <span className={`font-medium ${role === 'provider' ? 'text-green-600' : 'text-gray-400'}`}>
          Provider
        </span>
      </div>
      
      <div className="mt-4 p-4 bg-gray-100 rounded-lg">
        <p className="text-lg font-semibold">Current Role: {role.charAt(0).toUpperCase() + role.slice(1)}</p>
        <p className="text-sm text-gray-600 mt-2">
          {role === 'customer' 
            ? 'Browse and rent GPU resources from providers' 
            : 'List your GPU resources for customers to rent'
          }
        </p>
      </div>
    </div>
  );
}