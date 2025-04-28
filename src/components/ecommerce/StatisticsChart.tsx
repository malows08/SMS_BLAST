import React, { useEffect, useState } from "react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, CartesianGrid
} from "recharts";
import { fetchReportSummary } from "../utils/fetchReportSummary";
import { useSmsProvider } from "../../context/SmsProviderContext";
import moment from "moment";

const COLORS = {
  DELIVRD: "#00BFFF",
  SUBMITTED: "#1E90FF",
  REJECTD: "#DC143C",
  UNDELIV: "#9370DB",
  OTHERS: "#FFD700"
};

const StatisticsChart = () => {
  const { provider } = useSmsProvider();
  const [chartData, setChartData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const today = moment();
        const threeDaysAgo = moment().subtract(2, "days");

        const start = threeDaysAgo;
        const end = today;

        const dateRange = [];
        for (let m = moment(start); m.diff(end, "days") <= 0; m.add(1, "days")) {
          dateRange.push(moment(m));
        }

        const rawData = await fetchReportSummary(
          start.format("YYYY-MM-DD"),
          end.format("YYYY-MM-DD"),
          provider
        );

        const grouped = dateRange.map(date => {
          const dateStr = date.format("DD-MMM-YYYY");
          const entry = rawData.find((item: any) => item.Date === dateStr) || {};
          
          return {
            date: date.format("DD-MMM-YYYY"),
            DELIVRD: Number(entry.DELIVRD || 0),
            SUBMITTED: Number(entry.SUBMITTED || 0),
            REJECTD: Number(entry.REJECTD || 0),
            UNDELIV: Number(entry.UNDELIV || 0),
            OTHERS: Number(entry.OTHERS || 0),
            TOTALCOUNT: Number(entry.TOTALCOUNT || 0),
          };
        });

        setChartData(grouped);
        console.log(grouped)
      } catch (error) {
        console.error("Failed to fetch chart data:", error);
      } finally {
        setLoading(false);
      }
    };

    if (provider) {
      fetchData();
    }
  }, [provider]);

  // Totals and percentages
  const totalSent = chartData.reduce((sum, c) => sum + c.TOTALCOUNT, 0);
  const delivered = chartData.reduce((sum, c) => sum + c.DELIVRD, 0);
  const submitted = chartData.reduce((sum, c) => sum + c.SUBMITTED, 0);
  const rejected = chartData.reduce((sum, c) => sum + c.REJECTD, 0);
  const undelivered = chartData.reduce((sum, c) => sum + c.UNDELIV, 0);
  const others = chartData.reduce((sum, c) => sum + c.OTHERS, 0);

  const percent = (count: number) => totalSent ? ((count / totalSent) * 100).toFixed(0) : "0";

  return (
    <div className="p-4 bg-white shadow rounded">
      <h2 className="text-lg font-semibold mb-2">Traffic Summary of last three days</h2>

      {loading ? (
        <div className="flex justify-center items-center h-[300px]">
          <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : (
        <>
          {/* Summary Counts */}
          <div className="flex flex-wrap gap-4 mb-2 text-sm text-gray-700 font-medium">
            <span>Total Sent ({totalSent})</span>
            <span className="text-blue-500">Delivered {delivered} ({percent(delivered)}%)</span>
            <span className="text-blue-400">Submitted {submitted} ({percent(submitted)}%)</span>
            <span className="text-red-500">Rejected {rejected} ({percent(rejected)}%)</span>
            <span className="text-purple-500">Undelivered {undelivered} ({percent(undelivered)}%)</span>
            <span className="text-yellow-500">Other {others} ({percent(others)}%)</span>
          </div>

          {/* Sent Message Details */}
          <h5 className="font-semibold text-md mt-4 mb-2">Sent Message Details</h5>

          <ResponsiveContainer width="100%" height={350}>
            <BarChart
              data={chartData}
              margin={{ top: 20, right: 120, left: 20, bottom: 50 }}
              barCategoryGap="15%" // thicker bars
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis
                type="number"
                domain={[0, 100000]}
                ticks={[0, 10, 1000, 10000]}
                tickFormatter={(value) => value.toLocaleString()}
                label={{
                  value: "Message Count",
                  angle: -90,
                  position: "insideLeft",
                  style: { textAnchor: "middle", fill: "black" },
                }}
              />
              <Tooltip formatter={(value: any) => value.toLocaleString()} />
              <Legend
                verticalAlign="middle"
                align="right"
                layout="vertical"
                iconSize={12}
              />
              <Bar dataKey="DELIVRD" fill={COLORS.DELIVRD} name="Delivered" />
              <Bar dataKey="SUBMITTED" fill={COLORS.SUBMITTED} name="Submitted" />
              <Bar dataKey="REJECTD" fill={COLORS.REJECTD} name="Rejected" />
              <Bar dataKey="UNDELIV" fill={COLORS.UNDELIV} name="Undelivered" />
              <Bar dataKey="OTHERS" fill={COLORS.OTHERS} name="Other" />
            </BarChart>
          </ResponsiveContainer>
        </>
      )}
    </div>
  );
};

export default StatisticsChart;
