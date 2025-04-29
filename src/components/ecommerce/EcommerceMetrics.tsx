import { useEffect, useState } from "react";
import axios from "axios";
import { motion } from "framer-motion";
import { MessageCircle, CheckCircle } from "lucide-react";
import { apiConfig } from "../../settings"; // Importing the centralized API config
import { useSmsProvider } from "../../context/SmsProviderContext";

export default function EcommerceMetrics() {
    const [stats, setStats] = useState({
        totalSent: 0,
        totalDelivered: 0,
        sentYesterday: 0,
        deliveredYesterday: 0,
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const today = new Date();
    const formattedToday = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
    const [endDate] = useState(formattedToday);
    const { provider } = useSmsProvider(); //provider switching

    useEffect(() => {
        const fetchSMSStats = async () => {
            setLoading(true);
            setError("");
            try {
                const isKizuna = provider === "kizuna-sms";
                const apiKeyToUse = isKizuna ? apiConfig.newApiKey : apiConfig.apiKey;
                const clientIdToUse = isKizuna ? apiConfig.newClientId : apiConfig.clientId;

                const response = await axios.get(
                    `https://app.brandtxt.io/api/v2/ReportSummary?ApiKey=${apiKeyToUse}&ClientId=${clientIdToUse}&start=0&length=100&fromdate=${endDate}&enddate=${endDate}`
                );

                const data = response.data;
                console.log(data)
                setStats({
                    totalSent: data.Data[0]?.TOTALCOUNT ?? 0,
                    totalDelivered: data.Data[0]?.DELIVRD ?? 0,
                    sentYesterday: data.Data[0]?.SUBMITTED ?? 0,
                    deliveredYesterday: data.Data[0]?.ACCEPTD ?? 0,
                });
            } catch (err) {
                console.error("Failed to fetch SMS stats", err);
                setError("Failed to load SMS stats. Please try again later.");
            } finally {
                setLoading(false);
            }
        };

        if (provider) {
            fetchSMSStats();
        }
    }, [provider]);

    return (
        <div className="flex flex-col gap-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {loading ? (
                    <div className="col-span-2 flex justify-center items-center p-8">
                        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                ) : error ? (
                    <div className="col-span-2 bg-red-100 text-red-600 p-4 rounded-lg shadow text-center">
                        {error}
                    </div>
                ) : (
                    <>
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5 }}
                            className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow flex items-center gap-4"
                        >
                            <div className="bg-blue-100 text-blue-600 p-2 rounded-full">
                                <MessageCircle className="w-6 h-6" />
                            </div>
                            <div>
                                <h3 className="text-sm text-gray-500 dark:text-gray-400">SMS SENT TODAY</h3>
                                <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">{stats.totalSent}</p>
                            </div>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: 0.2 }}
                            className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow flex items-center gap-4"
                        >
                            <div className="bg-green-100 text-green-600 p-2 rounded-full">
                                <CheckCircle className="w-6 h-6" />
                            </div>
                            <div>
                                <h3 className="text-sm text-gray-500 dark:text-gray-400">DELIVERED TODAY</h3>
                                <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">{stats.totalDelivered}</p>
                            </div>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: 0.2 }}
                            className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow flex items-center gap-4"
                        >
                            <div className="bg-green-100 text-green-600 p-2 rounded-full">
                                <CheckCircle className="w-6 h-6" />
                            </div>
                            <div>
                                <h3 className="text-sm text-gray-500 dark:text-gray-400">SMS SENT YESTERDAY</h3>
                                <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">{stats.sentYesterday}</p>
                            </div>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: 0.2 }}
                            className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow flex items-center gap-4"
                        >
                            <div className="bg-green-100 text-green-600 p-2 rounded-full">
                                <CheckCircle className="w-6 h-6" />
                            </div>
                            <div>
                                <h3 className="text-sm text-gray-500 dark:text-gray-400">DELIVERED YESTERDAY</h3>
                                <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">{stats.deliveredYesterday}</p>
                            </div>
                        </motion.div>
                    </>
                )}
            </div>
        </div>
    );
}
