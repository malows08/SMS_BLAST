import { apiConfig } from "../../settings";

export const fetchReportSummary = async (provider: string) => {
  const isKizuna = provider === "kizuna-sms";

  const apiKey = isKizuna ? apiConfig.newEncodedApiKey : apiConfig.encodedApiKey; // ✅ ENCODED API KEY
  const clientId = isKizuna ? apiConfig.newClientId : apiConfig.clientId;

  // 🔥 Correctly calculate dates (always last 3 days including today)
  const today = new Date();
  const pastDate = new Date();
  pastDate.setDate(today.getDate() - 2); // ⬅️ minus 2 days

  const formatDate = (date: Date) => 
    `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;

  const startDate = formatDate(pastDate); // 2 days ago
  const endDate = formatDate(today);      // today

  const url = `https://app.brandtxt.io/api/v2/ReportSummary?ApiKey=${apiKey}&ClientId=${clientId}&start=0&length=100&fromdate=${startDate}&enddate=${endDate}`;

  console.log("Fetching Report Summary with URL:", url);

  const response = await fetch(url);
  const result = await response.json();
  
  console.log("Fetched Report Summary Data:", result);

  return result.Data || [];
};
