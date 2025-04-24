import { useEffect, useState } from "react";
import { apiConfig } from "../../settings"; // Importing the centralized API config
import { useRefresh } from "../utils/RefreshContext";// Import the context
import { useSmsProvider } from "../../context/SmsProviderContext";

const CreditsPage: React.FC = () => {
  const { refreshKey } = useRefresh(); // Get the refresh key
  const [credits, setCredits] = useState<number | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const { provider } = useSmsProvider();


  const fetchCredits = async () => {
    const apiKeyToUse =
      provider === "kizuna-sms" ? apiConfig.newEncodedApiKey : apiConfig.encodedApiKey;
    const clientIdToUse =
      provider === "kizuna-sms" ? apiConfig.newClientId : apiConfig.clientId;
  
    try {
      const response = await fetch(
        `https://app.brandtxt.io/api/v2/Balance?ApiKey=${apiKeyToUse}&ClientId=${clientIdToUse}`
      );
      console.log(response)
      if (!response.ok) {
        throw new Error("Failed to fetch credits");
      }
  
      const data = await response.json();
      setCredits(data.Data[0].Credits); // Assuming 'Credits' is the correct field
      //console.log(data.Data[0].Credits)
    } catch (error: any) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  // Fetch credits on mount
  useEffect(() => {
    fetchCredits();

    // Set up polling to refresh credits every 30 seconds
    const intervalId = setInterval(fetchCredits, 30000); // 30 seconds interval

    // Clean up the interval on component unmount
    return () => clearInterval(intervalId);
  }, [provider]); // Add refreshKey as a dependency

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <div className="p-4">
      {/* <h1 className="text-2xl font-semibold dark:text-white">Credits</h1> */}
      <p className="text-lg dark:text-white">
        Your current credits: {credits}
      </p>
    </div>
  );
};

export default CreditsPage;
