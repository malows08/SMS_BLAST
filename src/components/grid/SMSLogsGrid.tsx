import React, { useEffect, useState } from "react";
import axios from "axios";
import * as XLSX from "xlsx";
import toast from "react-hot-toast";
import { useRefresh } from "../../context/RefreshContext";
// import { useSmsProvider } from "../../context/SmsProviderContext";
import useApiBaseUrl from "../../hooks/useApiBaseUrl";
import { jwtDecode } from "jwt-decode";

interface DecodedToken {
  userId: string;
  // Add other fields if needed
}

const SMSLogsGrid = () => {
  const { refreshKey } = useRefresh();
  const [logs, setLogs] = useState([]);
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const [successCount, setSuccessCount] = useState(0);
  const { apiBaseUrl } = useApiBaseUrl();

  const itemsPerPage = 10;

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      if (!token) throw new Error("No token found");

      const decoded = jwtDecode<{ id: string }>(token);
      const userId = decoded.id;

      const response = await axios.get(`${apiBaseUrl}/api/smslogs/get-db-sms-logs`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        params: {
          userId, // Pass userId to backend
        },
      });

      const data = response.data || [];

      setLogs(data);
      setPendingCount(data.filter((log: any) => log.sms_status === "pending").length);
      setSuccessCount(data.filter((log: any) => log.sms_status === "success").length);

      toast.success("✅ Logs refreshed (kizuna-sms)", { position: "top-center" });
    } catch (error) {
      console.error("Error fetching logs:", error);
      toast.error("❌ Failed to refresh logs.", { position: "top-center" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (apiBaseUrl) {
      fetchLogs();
    }
  }, [apiBaseUrl, refreshKey]);

  const filteredLogs = logs.filter((log: any) =>
    (log.mobilenumbers || "").includes(search) ||
    (log.sms_status || "").toLowerCase().includes(search.toLowerCase())
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
          <div className="mb-4 text-sm text-gray-600 flex gap-6 items-center">
            <span><span className="text-green-600 font-semibold">✅ Success:</span> {successCount}</span>
            <span><span className="text-yellow-600 font-semibold">⏳ Pending:</span> {pendingCount}</span>
          </div>

          <table className="min-w-full text-sm text-left border">
            <thead className="bg-gray-100 font-semibold">
              <tr>
                <th className="p-2 border">Mobile Number</th>
                <th className="p-2 border">Provider</th>
                <th className="p-2 border">Message</th>
                <th className="p-2 border">Submit Date</th>
                <th className="p-2 border">Status</th>
              </tr>
            </thead>
            <tbody>
              {paginatedLogs.map((log: any, index) => (
                <tr key={index} className="border">
                  <td className="p-2 border">{log.mobilenumbers}</td>
                  <td className="p-2 border">{log.provider}</td>
                  <td className="p-2 border truncate max-w-[250px]">{log.message}</td>
                  <td className="p-2 border">{new Date(log.createdAt).toLocaleString()}</td>
                  <td className="p-2 border">
                    {log.sms_status === "success" ? (
                      <span className="text-green-600 font-semibold">✅ Success</span>
                    ) : (
                      <span className="text-yellow-600 font-semibold">⏳ Pending</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

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
