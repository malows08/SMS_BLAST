import React, { useEffect, useState } from "react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, CartesianGrid
} from "recharts";
import { fetchReportSummary } from "../utils/fetchReportSummary";
import moment from "moment";

const COLORS = {
  DELIVRD: "#00BFFF",
  SUBMITTED: "#1E90FF",
  REJECTD: "#DC143C",
  UNDELIV: "#9370DB",
  OTHERS: "#FFD700"
};

const StatisticsChart = () => {
  const today = moment().format("YYYY-MM-DD");
  const [startDate, setStartDate] = useState(moment().subtract(3, "days").format("YYYY-MM-DD"));
  const [endDate, setEndDate] = useState(today);
  const [chartData, setChartData] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      const start = moment(startDate);
      const end = moment(endDate);

      const dateRange = [];
      for (let m = moment(start); m.diff(end, "days") <= 0; m.add(1, "days")) {
        dateRange.push(moment(m));
      }

      const rawData = await fetchReportSummary(start.format("YYYY-MM-DD"), end.format("YYYY-MM-DD"));

      const grouped = dateRange.map(date => {
        const dateStr = date.format("YYYY-MM-DD");
        const entry = rawData.find(item => item.DATE === dateStr) || {};
    
        return {
          date: date.format("DD-MMM-YYYY"),
          DELIVRD: parseInt(entry.DELIVRD || 0),
          SUBMITTED: parseInt(entry.SUBMITTED || 0),
          REJECTD: parseInt(entry.REJECTD || 0),
          UNDELIV: parseInt(entry.UNDELIV || 0),
          OTHERS: parseInt(entry.OTHERS || 0),
          TOTALCOUNT: parseInt(entry.TOTALCOUNT || 0),
        };
      });

      setChartData(grouped);
    };

    fetchData();
  }, [startDate, endDate]);

  return (
    <div className="p-4 bg-white shadow rounded">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold">Traffic summary (Last 3 Days)</h2>
      </div>

      <div className="flex flex-wrap gap-4 mt-4 text-sm text-gray-700">
        <span>Total Sent: {chartData.reduce((sum, c) => sum + c.TOTALCOUNT, 0)}</span>
        <span className="text-blue-500">Delivered: {chartData.reduce((a, c) => a + c.DELIVRD, 0)}</span>
        <span className="text-blue-400">Submitted: {chartData.reduce((a, c) => a + c.SUBMITTED, 0)}</span>
        <span className="text-red-500">Rejected: {chartData.reduce((a, c) => a + c.REJECTD, 0)}</span>
        <span className="text-purple-500">Undelivered: {chartData.reduce((a, c) => a + c.UNDELIV, 0)}</span>
        <span className="text-yellow-500">Other: {chartData.reduce((a, c) => a + c.OTHERS, 0)}</span>
      </div>

      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={chartData} margin={{ top: 20, right: 30, left: 10, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" />
          <YAxis scale="log" domain={[1, 'dataMax']} />
          <Tooltip />
          <Legend />
          <Bar dataKey="DELIVRD" stackId="a" fill={COLORS.DELIVRD} name="Delivered" />
          <Bar dataKey="SUBMITTED" stackId="a" fill={COLORS.SUBMITTED} name="Submitted" />
          <Bar dataKey="REJECTD" stackId="a" fill={COLORS.REJECTD} name="Rejected" />
          <Bar dataKey="UNDELIV" stackId="a" fill={COLORS.UNDELIV} name="Undelivered" />
          <Bar dataKey="OTHERS" stackId="a" fill={COLORS.OTHERS} name="Other" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default StatisticsChart;
