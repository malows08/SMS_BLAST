import { useEffect, useState } from "react";
import { apiConfig } from "../../settings";
import { useRefresh } from "../../context/RefreshContext";
import { useSmsProvider } from "../../context/SmsProviderContext";
import { motion, AnimatePresence } from "framer-motion";
import { jwtDecode } from "jwt-decode";


const CreditsPage: React.FC = () => {
  const { refreshKey, refresh } = useRefresh();
  const { provider } = useSmsProvider();
  const [credits, setCredits] = useState<number | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [showTopUpModal, setShowTopUpModal] = useState(false);

  const [fname, setFname] = useState<string | null>(null);
  const [userCredit, setUserCredit] = useState<number>(0);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      const decoded: any = jwtDecode(token);
      setFname(decoded.fname); // Extract fname from JWT
      //setUserCredit(decoded.credit ?? 0);// Extract credit from JWT
    }
    fetchCredits();
  }, []);

  const fetchCredits = async () => {
    setLoading(true);
    setError(null);

    const token = localStorage.getItem("token");
    if (!token) {
      setError("No token found");
      setLoading(false);
      return;
    }

    try {
      const response = await fetch("http://localhost:4000/api/credits", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error("Failed to fetch credits");

      const data = await response.json();
      setUserCredit(data.credit); // 👈 Update the state with fetched credit
    } catch (error: any) {
      console.error(error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  // const fetchCredits = async () => {
  //   setLoading(true);
  //   setError(null);

  //   const apiKeyToUse = provider === "kizuna-sms" ? apiConfig.newEncodedApiKey : apiConfig.encodedApiKey;
  //   const clientIdToUse = provider === "kizuna-sms" ? apiConfig.newClientId : apiConfig.clientId;

  //   try {
  //     const response = await fetch(
  //       `https://app.brandtxt.io/api/v2/Balance?ApiKey=${apiKeyToUse}&ClientId=${clientIdToUse}`
  //     );
  //     if (!response.ok) throw new Error("Failed to fetch credits");

  //     const data = await response.json();
  //     setCredits(data.Data[0]?.Credits ?? 0);
  //   } catch (error: any) {
  //     console.error(error);
  //     setError(error.message);
  //   } finally {
  //     setTimeout(() => setLoading(false), 300);
  //   }
  // };

  // useEffect(() => {
  //   if (provider) fetchCredits();
  // }, [provider, refreshKey]);

  // ✅ Call refresh() only after payment (or after manual Top Up)
  const handleTopUp = () => {
    alert('✅ Payment via GCash successful!');
    setShowTopUpModal(false);
    refresh(); // ✅ Trigger refresh ONLY here, after user Top-Up
  };

  return (
    <div className="p-4">
      <AnimatePresence mode="wait">
        {loading ? (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="text-lg text-gray-600 dark:text-gray-300"
          >
            🔄 Loading credits...
          </motion.div>
        ) : error ? (
          <motion.div
            key="error"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="text-red-600 dark:text-red-400"
          >
            ⚠️ Error: {error}
          </motion.div>
        ) : (
          <motion.div
            key="credit"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.5 }}
            className="flex items-center justify-between gap-8 bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md"
          >
            <div>
              <h2 className="text-lg font-bold dark:text-white">
                💰 Account Credit:
                <span className="text-blue-600 dark:text-blue-400">
                  {userCredit}
                </span>
              </h2>
              {/* {fname && (
                <h2 className="text-lg font-bold dark:text-white">
                  👋 Welcome, <span className="font-bold">{fname}</span>!
                </h2>
              )} */}
              {/* <p className="text-sm text-gray-500 dark:text-gray-400">
                💰 Your Account Credit: <span className="font-semibold">{userCredit}</span>
              </p> */}
            </div>

            <button
              onClick={() => setShowTopUpModal(true)}
              className="bg-gradient-to-r from-indigo-500 to-cyan-500 hover:from-cyan-500 hover:to-indigo-500 text-white font-semibold py-2 px-5 rounded-full shadow-md transition-all"
            >
              ➕ Top Up
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Top Up Modal */}
      <AnimatePresence>
        {showTopUpModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50"
          >
            <motion.div
              initial={{ scale: 0.7 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.7 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
              className="bg-white dark:bg-gray-900 p-6 rounded-xl shadow-2xl w-full max-w-md relative"
            >
              <h3 className="text-xl font-semibold mb-4 dark:text-white">💳 Top Up Credits</h3>
              <p className="mb-6 text-gray-600 dark:text-gray-400">
                This is a dummy payment form for demo purposes.
              </p>

              <div className="flex flex-col gap-4">
                <button
                  onClick={handleTopUp} // ✅ Correct place to trigger refresh
                  className="bg-green-500 hover:bg-green-600 text-white py-2 rounded-lg font-medium"
                >
                  Pay with GCash
                </button>

                <button
                  onClick={() => setShowTopUpModal(false)}
                  className="text-gray-500 dark:text-gray-400 underline text-sm hover:text-gray-700 dark:hover:text-gray-300"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CreditsPage;
