import { useEffect, useState } from "react";
import { apiConfig } from "../../settings"; // Importing the centralized API config
import { useRefresh } from "../utils/RefreshContext";// Import the context

const CreditsPage: React.FC = () => {
  const { refreshKey } = useRefresh(); // Get the refresh key
  const [credits, setCredits] = useState<number | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);


  const fetchCredits = async () => {
    try {
      const apiKeyToUse = apiConfig.encodedApiKey;
      const response = await fetch(
        `https://app.brandtxt.io/api/v2/Balance?ApiKey=${apiKeyToUse}&ClientId=${apiConfig.clientId}`
      );
      //console.log(response)
      if (!response.ok) {
        throw new Error("Failed to fetch credits");
      }
      const data = await response.json();
      setCredits(data.Data[0].Credits);// Assuming 'balance' is the key returned
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
  }, [refreshKey]); // Add refreshKey as a dependency

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
