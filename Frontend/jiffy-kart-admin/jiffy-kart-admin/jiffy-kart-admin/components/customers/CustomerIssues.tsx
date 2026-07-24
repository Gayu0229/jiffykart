
import React, { useState } from 'react';
import { AlertCircle, CheckCircle, MessageSquare, User, ArrowRight, Search } from 'lucide-react';
import { CustomerIssue } from '../../types';

const CustomerIssues: React.FC = () => {
  const [issues, setIssues] = useState<CustomerIssue[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  const handleResolve = async (id: string) => {
    if (window.confirm('Mark this issue as resolved?')) {
      try {
        // Mock API Call: POST /api/v1/customers/complaints/:id/resolve
        // await fetch(`/api/v1/customers/complaints/${id}/resolve`, { method: 'POST' });
        await new Promise(resolve => setTimeout(resolve, 500));

        setIssues(prev => prev.map(i => i.id === id ? { ...i, status: 'Resolved' } : i));
      } catch (error) {
        console.error("Failed to resolve issue", error);
        alert("Failed to resolve issue.");
      }
    }
  };

  const filteredIssues = issues.filter(issue =>
    issue.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    issue.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    issue.issueType.toLowerCase().includes(searchTerm.toLowerCase()) ||
    issue.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-800">Customer Complaints</h2>
          <p className="text-sm text-gray-500 mt-1">Track and resolve reported issues.</p>
        </div>
      </div>

      <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search complaints..."
            className="w-full pl-10 pr-4 py-2 bg-white text-gray-900 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Complaint ID</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Customer</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Issue Details</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Priority</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredIssues.map((issue) => (
                <tr key={issue.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-bold text-gray-900">{issue.id}</div>
                    <div className="text-xs text-gray-400">{issue.date}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="bg-gray-100 p-1.5 rounded-full mr-2 text-gray-500">
                        <User size={14} />
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-900">{issue.customerName}</div>
                        <div className="text-xs text-gray-500">Vendor: {issue.vendorName}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-bold text-gray-800">{issue.issueType}</div>
                    <p className="text-sm text-gray-600 truncate max-w-xs">{issue.description}</p>
                    {issue.orderId && (
                      <span className="text-xs text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded mt-1 inline-block">
                        Order: {issue.orderId}
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${issue.priority === 'High' ? 'bg-red-100 text-red-800' :
                        issue.priority === 'Medium' ? 'bg-orange-100 text-orange-800' :
                          'bg-blue-100 text-blue-800'
                      }`}>
                      {issue.priority}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${issue.status === 'Resolved' ? 'bg-green-100 text-green-800' :
                        issue.status === 'In Progress' ? 'bg-blue-100 text-blue-800' :
                          'bg-yellow-100 text-yellow-800'
                      }`}>
                      {issue.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    {issue.status !== 'Resolved' ? (
                      <button
                        onClick={() => handleResolve(issue.id)}
                        className="inline-flex items-center px-3 py-1.5 bg-green-50 text-green-700 rounded hover:bg-green-100 transition-colors text-xs font-medium"
                      >
                        <CheckCircle size={14} className="mr-1.5" />
                        Resolve
                      </button>
                    ) : (
                      <button className="text-gray-400 hover:text-gray-600 text-xs flex items-center justify-end w-full">
                        View Thread <ArrowRight size={12} className="ml-1" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {filteredIssues.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-gray-500">
                    No complaints found matching your search.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default CustomerIssues;
