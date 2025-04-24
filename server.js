import express from "express";
import cors from "cors";
import fetch from "node-fetch";

const app = express();
app.use(cors());
app.use(express.json());

app.post("/proxy/send-sms", async (req, res) => {
  try {
    const response = await fetch("https://app.brandtxt.io/api/v2/SendSMS", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(req.body),
    });

    const result = await response.json();
    res.status(200).json(result);
  } catch (err) {
    console.error("Proxy error:", err);
    res.status(500).json({ error: "Something went wrong." });
  }
});
//for bulk sms
app.post("/proxy/send-bulk-sms", async (req, res) => {
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
});

const PORT = 5000;
app.listen(PORT, () => {
  console.log(`🚀 Proxy server running at http://localhost:${PORT}`);
});
