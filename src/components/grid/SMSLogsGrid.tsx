import React, { useEffect, useState } from "react";
import axios from "axios";
import * as XLSX from "xlsx";
import toast from "react-hot-toast";
import { useRefresh } from "../../context/RefreshContext";
import { useSmsProvider } from "../../context/SmsProviderContext";
import { apiConfig } from "../../settings";

const SMSLogsGrid = () => {
  const { refreshKey } = useRefresh();
  const { provider } = useSmsProvider();

  const [logs, setLogs] = useState([]);
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(false);

  const itemsPerPage = 10;

  const fetchLogs = async () => {
    try {
      const isKizuna = provider === "kizuna-sms";
      const apiKeyToUse = isKizuna ? apiConfig.newApiKey : apiConfig.apiKey;
      const clientIdToUse = isKizuna ? apiConfig.newClientId : apiConfig.clientId;

      const today = new Date();
      const formattedToday = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

      const response = await axios.get(
        `https://app.brandtxt.io/api/v2/GetSMS?ApiKey=${apiKeyToUse}&ClientId=${clientIdToUse}&start=0&length=100&fromdate=${formattedToday}&enddate=${formattedToday}`
      );

      setLogs(response.data.Data || []);
      toast.success(`✅ Logs refreshed (${isKizuna ? "KizunaSMS" : "Default"})`, {
        position: 'top-center',
      });
    } catch (error) {
      console.error("Error fetching logs:", error);
      toast.error("❌ Failed to refresh logs.", {
        position: 'top-center',
      });
    }
  };

  useEffect(() => {
    const loadLogs = async () => {
      setLoading(true);
      setLogs([]); // Clear previous logs immediately
      await fetchLogs();
      setLoading(false);
    };

    if (provider) {
      loadLogs();
    }
  }, [provider, refreshKey]); // ✅ Refresh on provider or manual trigger

  const filteredLogs = logs.filter(log =>
    log.MobileNumber.includes(search) || log.Status.toLowerCase().includes(search.toLowerCase())
  );

  const paginatedLogs = filteredLogs.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const totalPages = Math.ceil(filteredLogs.length / itemsPerPage);

  const exportToExcel = () => {
    const ws = XLSX.utils.json_to_sheet(filteredLogs);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "SMSLogs");
    XLSX.writeFile(wb, "SMS_Logs.xlsx");
  };

  return (
    <div className="p-4 bg-white shadow rounded-md">
      <h2 className="text-lg font-semibold mb-4">📋 SMS Delivery Logs</h2>

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-4 mb-4">
        <button
          onClick={fetchLogs}
          disabled={loading}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? "🔄 Loading..." : "🔄 Refresh"}
        </button>

        <input
          type="text"
          placeholder="Search number or status"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setCurrentPage(1);
          }}
          className="border p-2 rounded w-[240px]"
        />

        <button
          onClick={exportToExcel}
          className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
        >
          📥 Export
        </button>
      </div>

      {/* Table */}
      {loading ? (
        <div className="text-center py-8 text-blue-600 font-semibold">
          <span className="flex items-center justify-center">
            <svg className="animate-spin h-6 w-6 mr-2 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 00-8 8h4z"></path>
            </svg>
            Loading Logs...
          </span>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm text-left border">
            <thead className="bg-gray-100 font-semibold">
              <tr>
                <th className="p-2 border">Mobile Number</th>
                <th className="p-2 border">Sender ID</th>
                <th className="p-2 border">Message</th>
                <th className="p-2 border">Submit Date</th>
                <th className="p-2 border">Done Date</th>
                <th className="p-2 border">Message ID</th>
                <th className="p-2 border">Status</th>
                <th className="p-2 border">Error Code</th>
              </tr>
            </thead>
            <tbody>
              {paginatedLogs.map((log, index) => (
                <tr key={index} className="border">
                  <td className="p-2 border">{log.MobileNumber}</td>
                  <td className="p-2 border">{log.SenderId}</td>
                  <td className="p-2 border truncate max-w-[250px]">{log.Message}</td>
                  <td className="p-2 border">{log.SubmitDate}</td>
                  <td className="p-2 border">{log.DoneDate}</td>
                  <td className="p-2 border">{log.MessageId}</td>
                  <td className={`p-2 border font-bold ${log.Status === "DELIVRD" ? "text-green-600" : "text-red-600"}`}>
                    {log.Status}
                  </td>
                  <td className="p-2 border">{log.ErrorCode}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {filteredLogs.length > 0 && (
        <div className="mt-4 flex justify-between items-center">
          <span className="text-sm">Page {currentPage} of {totalPages}</span>
          <div className="flex gap-2">
            <button
              onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1 border rounded disabled:opacity-50"
            >
              Prev
            </button>
            <button
              onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-1 border rounded disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default SMSLogsGrid;
