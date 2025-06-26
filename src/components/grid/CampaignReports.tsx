import React, { useEffect, useState } from "react";
import axios from "axios";
import * as XLSX from "xlsx";
import { Card, CardContent } from "../../components/ui/card";
import useApiBaseUrl from "../../hooks/useApiBaseUrl";

type CampaignMessage = {
    mobilenumbers: string;
    message: string;
    sms_status: string;
};

type GroupedCampaign = {
    campaignName: string;
    messages: CampaignMessage[];
};

const CampaignReports = () => {
    const [clients, setClients] = useState([]);
    const [selectedClient, setSelectedClient] = useState("");
    const [campaignLogs, setCampaignLogs] = useState<GroupedCampaign[]>([]);
    const [selectedCampaigns, setSelectedCampaigns] = useState<string[]>([]);
    const { apiBaseUrl } = useApiBaseUrl();
    const [loadingCampaigns, setLoadingCampaigns] = useState(false);

    useEffect(() => {
        const fetchClients = async () => {
            try {
                const token = localStorage.getItem("token");
                const response = await axios.get(`${apiBaseUrl}/api/smslogs/get-clients`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                setClients(response.data);
            } catch (err) {
                console.error("Error fetching clients:", err);
            }
        };
        fetchClients();
    }, [apiBaseUrl]);

    const fetchLogs = async () => {
        setLoadingCampaigns(true);
        try {
            const token = localStorage.getItem("token");
            const response = await axios.get(`${apiBaseUrl}/api/smslogs/get-campaign-logs`, {
                headers: { Authorization: `Bearer ${token}` },
                params: { userId: selectedClient },
            });
            setCampaignLogs(response.data);
            setSelectedCampaigns([]);
        } catch (err) {
            console.error("Error fetching campaign logs:", err);
        } finally {
            setLoadingCampaigns(false);
        }
    };

    const toggleCampaignSelection = (campaignName: string) => {
        setSelectedCampaigns((prev) =>
            prev.includes(campaignName)
                ? prev.filter((c) => c !== campaignName)
                : [...prev, campaignName]
        );
    };

    const isChecked = (campaignName: string) => selectedCampaigns.includes(campaignName);

    const exportToXLSX = () => {
        const filtered = campaignLogs.filter((log) =>
            selectedCampaigns.includes(log.campaignName)
        );

        const flatData = filtered.flatMap((campaign) =>
            campaign.messages.map((msg) => ({
                campaignName: campaign.campaignName,
                mobilenumbers: msg.mobilenumbers,
                message: msg.message,
                sms_status: msg.sms_status,
            }))
        );

        if (flatData.length === 0) return;

        const worksheet = XLSX.utils.json_to_sheet(flatData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Campaign Logs");

        const today = new Date().toISOString().split("T")[0];
        const fileName =
            selectedCampaigns.length === 1
                ? `${selectedCampaigns[0]}.xlsx`
                : `all_campaigns_${today}.xlsx`;

        XLSX.writeFile(workbook, fileName);
    };

    const [userRole, setUserRole] = useState<"admin" | "client" | null>(null);

    useEffect(() => {
        const fetchUserInfo = async () => {
            try {
                const token = localStorage.getItem("token");
                const response = await axios.get(`${apiBaseUrl}/api/users/me`, {
                    headers: { Authorization: `Bearer ${token}` },
                });

                setUserRole(response.data.role);
            } catch (err) {
                console.error("Failed to fetch user info", err);
            }
        };

        fetchUserInfo();
    }, [apiBaseUrl]);

    return (
        <Card>
            <CardContent>
                <h2 className="text-lg font-semibold mb-4">📊 Campaign Reports</h2>

                <div className="flex items-center gap-4 mb-4">
                    <select
                        value={selectedClient}
                        onChange={(e) => setSelectedClient(e.target.value)}
                        className="border p-2 rounded"
                    >
                        <option value="">Select Client</option>
                        {clients.map((client) => (
                            <option key={client.id} value={client.id}>
                                {client.fname} {client.lname}
                            </option>
                        ))}
                    </select>

                    <button
                        onClick={fetchLogs}
                        disabled={!selectedClient}
                        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                    >
                        Fetch Campaigns
                    </button>

                    <button
                        onClick={exportToXLSX}
                        disabled={selectedCampaigns.length === 0}
                        className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
                    >
                        Export Selected to XLSX
                    </button>
                </div>

                <table className="min-w-full text-sm border">
                    <thead className="bg-gray-100 font-semibold">
                        <tr>
                            <th className="p-2 border">✅</th>
                            <th className="p-2 border">📁 Campaign</th>
                            <th className="p-2 border">📱 Mobile Numbers</th>
                            <th className="p-2 border">💬 Message</th>
                            <th className="p-2 border">📌 SMS Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loadingCampaigns ? (
                            <tr>
                                <td colSpan={5} className="p-4 text-center">
                                    <div className="flex justify-center items-center gap-2">
                                        <svg className="animate-spin h-5 w-5 text-gray-600" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 11-8 8z" />
                                        </svg>
                                        <span>Loading campaigns...</span>
                                    </div>
                                </td>
                            </tr>
                        ) : campaignLogs.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="p-4 text-center text-gray-500">
                                    No campaign data found.
                                </td>
                            </tr>
                        ) : (
                            campaignLogs.map((campaign, index) => (
                                <React.Fragment key={index}>
                                    {/* Campaign Name Row */}
                                    <tr className="bg-gray-200 font-semibold">
                                        <td className="p-2 border text-center">
                                            <input
                                                type="checkbox"
                                                checked={isChecked(campaign.campaignName)}
                                                onChange={() => toggleCampaignSelection(campaign.campaignName)}
                                            />
                                        </td>
                                        <td className="p-2 border" colSpan={4}>
                                            {campaign.campaignName}
                                        </td>
                                    </tr>

                                    {/* Messages for the Campaign */}
                                    {campaign.messages.map((msg, i) => (
                                        <tr key={i} className="border">
                                            <td className="p-2 border"></td>
                                            <td className="p-2 border"></td>
                                            <td className="p-2 border">{msg.mobilenumbers}</td>
                                            <td className="p-2 border">{msg.message}</td>
                                            <td className="p-2 border">{msg.sms_status}</td>
                                        </tr>
                                    ))}
                                </React.Fragment>
                            ))
                        )}
                    </tbody>
                </table>
            </CardContent>
        </Card>
    );
};

export default CampaignReports;
