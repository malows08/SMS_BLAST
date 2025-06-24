import React, { useEffect, useState } from "react";
import axios from "axios";
import * as XLSX from "xlsx";
import toast from "react-hot-toast";
import { useRefresh } from "../../context/RefreshContext";
import useApiBaseUrl from "../../hooks/useApiBaseUrl";
import { jwtDecode } from "jwt-decode";
import { Card, CardContent } from "../../components/ui/card";

const campaignNameMap: Record<string, string> = {
  "Camp_18-06-2025_10:32 AM": "Project A",
  "Camp_20-06-2025_12:34 PM": "Project B",
  // Add more mappings as needed
};

interface DecodedToken {
  id: string;
  role?: string;
}

const SMSLogsGrid = () => {
  const { refreshKey } = useRefresh();
  const [campaignLogs, setCampaignLogs] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const [successCount, setSuccessCount] = useState(0);
  const { apiBaseUrl } = useApiBaseUrl();
  const [userRole, setUserRole] = useState<string | null>(null);

  const itemsPerPage = 10;

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      if (!token) throw new Error("No token found");

      const decoded: DecodedToken = jwtDecode(token);
      const userId = decoded.id;
      setUserRole(decoded.role || null);

      const response = await axios.get(`${apiBaseUrl}/api/smslogs/get-db-sms-logs`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { userId },
      });

      const data = response.data || [];

      setCampaignLogs(data);

      const pending = data.reduce((acc: number, c: any) => acc + (c.pending || 0), 0);
      const success = data.reduce((acc: number, c: any) => acc + (c.success || 0), 0);

      setPendingCount(pending);
      setSuccessCount(success);

      toast.success("✅ Campaign logs refreshed", { position: "top-center" });
    } catch (error) {
      console.error("Error fetching campaign logs:", error);
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

  const filteredLogs = campaignLogs.filter((log: any) => {
    const mappedName = campaignNameMap[log.campaignName] || log.campaignName;
    return mappedName.toLowerCase().includes(search.toLowerCase());
  });


  const paginatedLogs = filteredLogs.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const totalPages = Math.ceil(filteredLogs.length / itemsPerPage);

  const exportToExcel = () => {
    const dataWithNames = campaignLogs.map((log) => ({
      ...log,
      campaignName: campaignNameMap[log.campaignName] || log.campaignName,
    }));
    const ws = XLSX.utils.json_to_sheet(dataWithNames);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "CampaignLogs");
    XLSX.writeFile(wb, "Campaign_Logs.xlsx");
  };

  return (
    <Card>
      <CardContent>
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
            placeholder="Search by campaign"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(1);
            }}
            className="border p-2 rounded w-[240px]"
          />

          {userRole !== "client" && (
            <button
              onClick={exportToExcel}
              className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
            >
              📥 Export
            </button>
          )}
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
          <>
            <div className="mb-4 text-sm text-gray-600 flex gap-6 items-center">
              <span><span className="text-green-600 font-semibold">✅ Success:</span> {successCount}</span>
              <span><span className="text-yellow-600 font-semibold">⏳ Pending:</span> {pendingCount}</span>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full text-sm text-left border">
                <thead className="bg-gray-100 font-semibold">
                  <tr>
                    <th className="p-2 border">📁 Campaign</th>
                    <th className="p-2 border">📡 Provider</th>
                    <th className="p-2 border">📨 Total SMS</th>
                    <th className="p-2 border">✅ Success</th>
                    <th className="p-2 border">⏳ Pending</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedLogs.map((log, index) => (
                    <tr key={index} className="border">
                      <td className="p-2 border font-medium">
                        {campaignNameMap[log.campaignName] || log.campaignName}
                      </td>
                      <td className="p-2 border">{log.provider}</td>
                      <td className="p-2 border">{log.totalSMS.toLocaleString()}</td>
                      <td className="p-2 border text-green-600">{log.success.toLocaleString()}</td>
                      <td className="p-2 border text-yellow-600">{log.pending.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {!loading && filteredLogs.length > 0 && (
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
      </CardContent>
    </Card>
  );
};

export default SMSLogsGrid;
