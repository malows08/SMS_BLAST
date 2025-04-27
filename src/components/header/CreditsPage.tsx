import { useEffect, useState } from "react";
import { apiConfig } from "../../settings";
import { useRefresh } from "../../context/RefreshContext";
import { useSmsProvider } from "../../context/SmsProviderContext";
import { motion, AnimatePresence } from "framer-motion";

const CreditsPage: React.FC = () => {
  const { refreshKey } = useRefresh();
  const { provider } = useSmsProvider();
  const [credits, setCredits] = useState<number | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCredits = async () => {
    setLoading(true);
    setError(null);

    const apiKeyToUse = provider === "kizuna-sms" ? apiConfig.newEncodedApiKey : apiConfig.encodedApiKey;
    const clientIdToUse = provider === "kizuna-sms" ? apiConfig.newClientId : apiConfig.clientId;

    try {
      const response = await fetch(
        `https://app.brandtxt.io/api/v2/Balance?ApiKey=${apiKeyToUse}&ClientId=${clientIdToUse}`
      );
      if (!response.ok) {
        throw new Error("Failed to fetch credits");
      }

      const data = await response.json();
      setCredits(data.Data[0]?.Credits ?? 0);
      console.log("Fetched credits for", provider, ":", data.Data[0]?.Credits);
    } catch (error: any) {
      console.error(error);
      setError(error.message);
    } finally {
      // 🕒 Ensure loading spinner stays visible for at least 300ms
      setTimeout(() => {
        setLoading(false);
      }, 300);
    }
  };

  // 🟰 Fetch credits whenever provider is ready
  useEffect(() => {
    if (provider) {
      console.log("Provider is now:", provider);
      fetchCredits(); // Fetch credits ONLY after provider is correct
    }
  }, [provider, refreshKey]);

  return (
    <div className="p-4">
      <AnimatePresence mode="wait">
        {loading ? (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="text-lg text-gray-600"
          >
            🔄 Loading credits...
          </motion.div>
        ) : error ? (
          <motion.div
            key="error"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="text-red-600"
          >
            ⚠️ Error: {error}
          </motion.div>
        ) : (
          <motion.div
            key="credits"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.5 }}
            className="text-lg dark:text-white"
          >
            🎯 Your current credits: <strong>{credits}</strong>

            {/* Small badge */}
            <div className="mt-2 text-sm text-gray-500">
              Active Provider: {provider === "kizuna-sms" ? "🔵 KizunaSMS" : "🟢 Default"}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CreditsPage;
