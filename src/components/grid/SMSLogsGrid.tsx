import React, { useEffect, useState } from "react";
import axios from "axios";
import * as XLSX from "xlsx";
import { format } from "date-fns";
import toast from "react-hot-toast";
import { apiConfig } from "../../settings"; // Importing the centralized API config

const SMSLogsGrid = () => {
  const [logs, setLogs] = useState([]);
  const [fromDate, setFromDate] = useState("2025-04-03");
  const today = new Date().toISOString().split("T")[0];
  const [endDate, setEndDate] = useState(today);
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [loading, setLoading] = useState(false);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const apiKeyToUse = apiConfig.apiKey;
      const response = await axios.get(
        `https://app.brandtxt.io/api/v2/GetSMS?ApiKey=${apiKeyToUse}&ClientId=${apiConfig.clientId}&start=0&length=100&fromdate=${endDate}&enddate=${endDate}`
      );
      setLogs(response.data.Data || []);
      toast.success("SMS logs refreshed.");
    } catch (error) {
      console.error("Error fetching logs:", error);
      toast.error("Failed to refresh logs.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const filteredLogs = logs.filter((log) =>
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

      <div className="flex flex-wrap gap-4 mb-4">
        {/* <input
          type="date"
          value={fromDate}
          onChange={(e) => setFromDate(e.target.value)}
          className="border p-2 rounded w-[150px]"
        />
        <input
          type="date"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
          className="border p-2 rounded w-[150px]"
        /> */}
        <button
          onClick={fetchLogs}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          🔄 Refresh
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
        <div className="text-center py-8 text-blue-600 font-semibold">🔄 Loading logs...</div>
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
                  <td
                    className={`p-2 border font-bold ${log.Status === "DELIVRD" ? "text-green-600" : "text-red-600"
                      }`}
                  >
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
      <div className="mt-4 flex justify-between items-center">
        <span className="text-sm">
          Page {currentPage} of {totalPages}
        </span>
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
    </div>
  );
};

export default SMSLogsGrid;
