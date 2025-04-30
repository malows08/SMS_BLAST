export default async function handler(req, res) {
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' });
    }
  
    try {
      const response = await fetch("https://app.brandtxt.io/api/v2/SendBulkSMS", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(req.body),
      });
  
      const result = await response.json();
      res.status(200).json(result);
    } catch (err) {
      console.error("Bulk proxy error:", err);
      res.status(500).json({ error: "Bulk SMS error" });
    }
  }
  