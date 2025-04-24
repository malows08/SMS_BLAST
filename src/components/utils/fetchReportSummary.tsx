export const fetchReportSummary = async (startDate, endDate) => {
    const apiKey = "Qu+a14KExO3viOV21Ar6qbal9s6kq2zGTGqeOZ96DO0=";
    const clientId = "6005b6a1-5446-483a-83d0-b841d2e44b9a";
    const url = `https://app.brandtxt.io/api/v2/ReportSummary?ApiKey=${encodeURIComponent(apiKey)}&ClientId=${clientId}&start=0&length=100&fromdate=${startDate}&enddate=${endDate}`;
  
    const response = await fetch(url);
    const result = await response.json();
    //console.log(result)
  
    return result.data || []; // ✅ return the actual array
  };
  