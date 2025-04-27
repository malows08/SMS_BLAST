import { apiConfig } from "../../settings"; // Importing the centralized API config
import { useSmsProvider } from "../../context/SmsProviderContext";

export const fetchReportSummary = async (startDate: string, endDate: string, provider: string) => {
  const isKizuna = provider === "kizuna-sms";

  const apiKey = isKizuna ? apiConfig.newApiKey : apiConfig.apiKey;
  const clientId = isKizuna ? apiConfig.newClientId : apiConfig.clientId;

  const url = `https://app.brandtxt.io/api/v2/ReportSummary?ApiKey=${encodeURIComponent(apiKey)}&ClientId=${clientId}&start=0&length=100&fromdate=${startDate}&enddate=${endDate}`;

  const response = await fetch(url);
  const result = await response.json();
  console.log(result)


  return result.Data || []; //return the actual array
};
