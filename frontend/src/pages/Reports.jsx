import { useState, useEffect } from 'react';
import { FileText, Download, Eye, FolderOpen, ChevronRight, RefreshCw } from 'lucide-react';
import api from '../utils/api';

export default function Reports() {
  const [reports, setReports] = useState({ years: [] });
  const [expandedYears, setExpandedYears] = useState({});
  const [expandedMonths, setExpandedMonths] = useState({});
  const [selectedReport, setSelectedReport] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const data = await api('/api/reports/list');
      setReports(data);
    } catch (err) {
      console.error('Failed to fetch reports:', err);
    } finally {
      setLoading(false);
    }
  };

  const toggleYear = (year) => {
    setExpandedYears(prev => ({ ...prev, [year]: !prev[year] }));
  };

  const toggleMonth = (year, month) => {
    setExpandedMonths(prev => ({ ...prev, [`${year}-${month}`]: !prev[`${year}-${month}`] }));
  };

  const viewReport = async (filePath) => {
    try {
      const path = filePath.replace(/\\/g, '/');
      const response = await fetch(`/api/reports/file?path=${encodeURIComponent(path)}`);
      
      if (!response.ok) throw new Error('Failed to load report');
      
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      
      setSelectedReport({
        url,
        name: filePath.split('/').pop()
      });
    } catch (err) {
      console.error('Failed to view report:', err);
      alert('Failed to load report');
    }
  };

  const downloadReport = async (filePath) => {
    try {
      const path = filePath.replace(/\\/g, '/');
      const response = await fetch(`/api/reports/file/${encodeURIComponent(path)}`);
      
      if (!response.ok) throw new Error('Failed to load report');
      
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = filePath.split('/').pop();
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to download report:', err);
    }
  };

  const generateDailyReport = async (date) => {
    try {
      await fetch(`/api/reports/generate-daily/${date}`, { method: 'POST' });
      fetchReports();
    } catch (err) {
      console.error('Failed to generate report:', err);
    }
  };

  const generateMonthlyReport = async (year, month) => {
    try {
      await fetch(`/api/reports/generate-monthly/${year}/${month}`, { method: 'POST' });
      fetchReports();
    } catch (err) {
      console.error('Failed to generate report:', err);
    }
  };

  const formatMonthName = (monthStr) => {
    const monthNum = parseInt(monthStr.split('-')[0]);
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'];
    return monthNames[monthNum - 1];
  };

  const getTodayStr = () => {
    const today = new Date();
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6 h-full flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Reports</h1>
        <button
          onClick={fetchReports}
          className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
        >
          <RefreshCw size={18} />
          Refresh
        </button>
      </div>

      <div className="flex-1 flex gap-6 overflow-hidden">
        <div className="w-80 bg-white rounded-lg border overflow-auto">
          <div className="p-4 border-b">
            <h2 className="font-semibold text-gray-700">Report Folders</h2>
          </div>
          
          <div className="p-2">
            {reports.years.length === 0 ? (
              <p className="text-center text-gray-500 py-8">No reports available</p>
            ) : (
              reports.years.map(year => (
                <div key={year.name} className="mb-1">
                  <button
                    onClick={() => toggleYear(year.name)}
                    className="w-full flex items-center gap-2 px-3 py-2 hover:bg-gray-50 rounded-lg text-left"
                  >
                    <ChevronRight
                      size={18}
                      className={`text-gray-400 transition-transform ${expandedYears[year.name] ? 'rotate-90' : ''}`}
                    />
                    <FolderOpen size={18} className="text-yellow-500" />
                    <span className="font-medium">{year.name}</span>
                  </button>
                  
                  {expandedYears[year.name] && (
                    <div className="ml-6">
                      {year.months.map(month => (
                        <div key={month.name} className="mb-1">
                          <button
                            onClick={() => toggleMonth(year.name, month.name)}
                            className="w-full flex items-center gap-2 px-3 py-2 hover:bg-gray-50 rounded-lg text-left"
                          >
                            <ChevronRight
                              size={18}
                              className={`text-gray-400 transition-transform ${expandedMonths[`${year.name}-${month.name}`] ? 'rotate-90' : ''}`}
                            />
                            <FolderOpen size={18} className="text-yellow-500" />
                            <span className="text-sm">{formatMonthName(month.name)}</span>
                          </button>
                          
                          {expandedMonths[`${year.name}-${month.name}`] && (
                            <div className="ml-6">
                              {month.dailyReports.length > 0 && (
                                <div className="py-1">
                                  <p className="text-xs text-gray-500 px-3 py-1">Daily Reports</p>
                                  {month.dailyReports.map(report => (
                                    <button
                                      key={report.path}
                                      onClick={() => viewReport(report.path)}
                                      className="w-full flex items-center gap-2 px-3 py-2 hover:bg-gray-50 rounded-lg text-left text-sm"
                                    >
                                      <FileText size={16} className="text-red-500" />
                                      <span className="truncate">{report.name.replace('.pdf', '')}</span>
                                    </button>
                                  ))}
                                </div>
                              )}
                              
                              {month.monthlyReport && (
                                <div className="py-1">
                                  <p className="text-xs text-gray-500 px-3 py-1">Monthly Report</p>
                                  <button
                                    onClick={() => viewReport(month.monthlyReport.path)}
                                    className="w-full flex items-center gap-2 px-3 py-2 hover:bg-gray-50 rounded-lg text-left text-sm"
                                  >
                                    <FileText size={16} className="text-blue-500" />
                                    <span className="truncate">Monthly Report</span>
                                  </button>
                                </div>
                              )}

                              {!month.monthlyReport && (
                                <button
                                  onClick={() => generateMonthlyReport(year.name, month.name.split('-')[0])}
                                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-primary-600 hover:bg-primary-50 rounded-lg"
                                >
                                  <RefreshCw size={14} />
                                  Generate Monthly Report
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        <div className="flex-1 bg-white rounded-lg border overflow-hidden">
          {selectedReport ? (
            <div className="h-full flex flex-col">
              <div className="p-4 border-b flex items-center justify-between">
                <h3 className="font-semibold">{selectedReport.name}</h3>
                <div className="flex gap-2">
                  <button
                    onClick={() => downloadReport(selectedReport.name)}
                    className="flex items-center gap-2 px-3 py-1.5 border rounded-lg hover:bg-gray-50 text-sm"
                  >
                    <Download size={16} />
                    Download
                  </button>
                  <button
                    onClick={() => {
                      URL.revokeObjectURL(selectedReport.url);
                      setSelectedReport(null);
                    }}
                    className="px-3 py-1.5 border rounded-lg hover:bg-gray-50 text-sm"
                  >
                    Close
                  </button>
                </div>
              </div>
              <div className="flex-1 overflow-auto">
                <iframe
                  src={selectedReport.url}
                  className="w-full h-full"
                  title="Report Viewer"
                />
              </div>
            </div>
          ) : (
            <div className="h-full flex items-center justify-center text-gray-500">
              <div className="text-center">
                <FileText size={48} className="mx-auto mb-4 text-gray-300" />
                <p>Select a report to view</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
