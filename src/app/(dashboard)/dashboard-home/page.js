"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";

import { ChartColumn, History, Plus, File } from 'lucide-react';

const dummyDocs = [
  { title: 'Partnership Agreement', expiresOn: '2025-04-10' },
  { title: 'NDA with Vendor A', expiresOn: '2025-04-12' },
  { title: 'Service Contract', expiresOn: '2025-04-15' },
];

function isExpiringSoon(dateStr) {
  const now = new Date();
  const expiry = new Date(dateStr);
  const diffDays = (expiry - now) / (1000 * 60 * 60 * 24);
  return diffDays <= 14; // within 14 days
}

export default function DashboardHome() {
  // Example: Fetch or mock data
  const [recentDocs, setRecentDocs] = useState([
    { name: "Lease Agreement", date: "2 days ago" },
    { name: "Freelance Contract", date: "last week" },
    { name: "Partnership Deed", date: "today" },
  ]);

  const totalDocs = 12;
  const pending = 3;

  const [soonExpiringDocs, setSoonExpiringDocs] = useState([]);

  useEffect(() => {
    const filtered = dummyDocs.filter(doc => isExpiringSoon(doc.expiresOn));
    setSoonExpiringDocs(filtered);
  }, []);

  return (
    <div className="min-h-screen h-screen w-full bg-[#f3f5ec] px-10 py-8">
      <h1 className="text-3xl font-bold text-[#181818] mb-2">
        Welcome back, Code Sid!
      </h1>

      {/* Quick Actions */}
      <div className="flex flex-col sm:flex-row gap-4 mb-8 mt-8 ">
        <motion.button
          whileHover={{ scale: 1.05 }}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-[#181818] text-white py-2 px-6 rounded-lg flex flex-row gap-3"
        >
          <Plus /> New Document
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.05 }}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-[#181818] text-white py-2 px-6 rounded-lg flex flex-row gap-3"
        >
          <File /> Browse Documents
        </motion.button>

      </div>

      <p className="text-gray-700 text-sm mb-8">
        Here's a quick overview of your workspace:
      </p>



      {/* Grid Layout */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* Stats */}
        <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6 }} 
        className="bg-transparent shadow rounded-2xl p-5 border-2 border-[#cfd490] px-4 py-4 rounded-3xl">
          <div className="flex flex-row gap-2 ">
            <ChartColumn />
            <h2 className="font-semibold text-lg mb-2"> Your Stats</h2>
          </div>

          <ul className="text-sm text-gray-800 space-y-1">
            <li>Total Documents: <strong>{totalDocs}</strong></li>
            <li>Pending Signatures: <strong>{pending}</strong></li>
            <li>Most Used Template: <strong>Service Agreement</strong></li>
          </ul>
        </motion.div>

        {/* Recent Activity */}
        <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6 }} 
        className="bg-transparent shadow rounded-2xl p-5 md:col-span-2 border-2 border-[#cfd490] px-4 py-4 rounded-3xl">
          <div className="flex flex-row gap-2">
            <History />
            <h2 className="font-semibold text-lg mb-2">Recent Activity</h2>
          </div>
          <ul className="text-sm text-gray-800 space-y-2">
            {recentDocs.map((doc, index) => (
              <li key={index} className="flex justify-between">
                <span>{doc.name}</span>
                <span className="text-gray-500 italic">{doc.date}</span>
              </li>
            ))}
          </ul>
        </motion.div>
      </div>



      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6 }}
        className="py-6 border-2 border-[#cfd490] px-4 shadow rounded-3xl"
      >
        <h2 className="text-2xl font-bold mb-8">Soon Expiring Documents</h2>

        {soonExpiringDocs.length > 0 ? (
          <div className="grid md:grid-cols-2  lg:grid-cols-3 gap-4">
            {soonExpiringDocs.map((doc, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="bg-[#fefefe] border-red-500 shadow p-4 py-10 rounded-lg hover:shadow-md transition"
              >
                <h3 className="text-lg font-semibold">{doc.title}</h3>
                <p className="text-sm text-gray-600">
                  Expires on: <span className="font-medium">{doc.expiresOn}</span>
                </p>
              </motion.div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 italic">No documents expiring soon.</p>
        )}
      </motion.div>

      {/* Tip / FAQ Box */}
      <div className="bg-[#fdfdfd] border-l-4 border-[#C5C69A] px-6 py-4 mt-10 rounded-xl shadow text-sm text-gray-700">
        💡 <strong>Tip:</strong> Use templates to save time. You can also create and save your own!
      </div>
    </div >
  );
}
