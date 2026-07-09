import React, { useState } from 'react';
import { Sparkles, RefreshCw } from 'lucide-react';
import { DashboardStats, Vendor } from '../types';
import { generateDashboardInsights } from '../services/geminiService';
import ReactMarkdown from 'react-markdown'; // Assuming markdown support is wanted, but sticking to basic rendering for standard html if pkg unavailable. 
// Actually, standard strategy is just rendering formatted text. I will use simple whitespace formatting or assume standard HTML rendering for paragraphs.

interface AIInsightsPanelProps {
  stats: DashboardStats;
  topVendors: Vendor[];
}

const AIInsightsPanel: React.FC<AIInsightsPanelProps> = ({ stats, topVendors }) => {
  const [insight, setInsight] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleGenerateInsights = async () => {
    setLoading(true);
    try {
      const result = await generateDashboardInsights(stats, topVendors);
      setInsight(result);
    } catch (e) {
      setInsight("Could not load insights.");
    } finally {
      setLoading(false);
    }
  };

  // Formatting helper since we might receive markdown
  const formatText = (text: string) => {
    return text.split('\n').map((line, i) => (
      <p key={i} className={`mb-2 ${line.startsWith('#') ? 'font-bold text-indigo-900 mt-4' : 'text-gray-700'}`}>
        {line.replace(/#/g, '').replace(/\*\*/g, '')} 
      </p>
    ));
  };

  return (
    <div className="bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-100 rounded-xl p-6 mb-8 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-200 rounded-full opacity-20 -mr-32 -mt-32 blur-3xl pointer-events-none"></div>
      
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 relative z-10">
        <div className="flex items-center gap-2 mb-4 md:mb-0">
          <div className="bg-white p-2 rounded-full shadow-sm text-indigo-600">
            <Sparkles size={20} />
          </div>
          <div>
            <h2 className="text-lg font-bold text-indigo-900">AI Business Intelligence</h2>
            <p className="text-sm text-indigo-600/80">Powered by Gemini 2.5 Flash</p>
          </div>
        </div>
        
        <button 
          onClick={handleGenerateInsights}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-white hover:bg-indigo-50 text-indigo-700 text-sm font-medium rounded-lg border border-indigo-200 shadow-sm transition-all active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {loading ? <RefreshCw className="animate-spin w-4 h-4" /> : <Sparkles className="w-4 h-4" />}
          {loading ? 'Analyzing Data...' : (insight ? 'Refresh Insights' : 'Generate Insights')}
        </button>
      </div>

      {insight && (
        <div className="bg-white/80 backdrop-blur-sm rounded-lg p-5 border border-indigo-100 shadow-sm animate-in fade-in slide-in-from-bottom-2 duration-500">
           <div className="prose prose-sm max-w-none text-gray-700 leading-relaxed">
             {formatText(insight)}
           </div>
        </div>
      )}
      
      {!insight && !loading && (
        <div className="text-center py-4 text-gray-400 text-sm">
          Click "Generate Insights" to analyze today's performance metrics and uncover actionable opportunities.
        </div>
      )}
    </div>
  );
};

export default AIInsightsPanel;