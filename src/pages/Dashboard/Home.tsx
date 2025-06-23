import EcommerceMetrics from "../../components/ecommerce/EcommerceMetrics";
import StatisticsChart from "../../components/ecommerce/StatisticsChart";
import RecentOrders from "../../components/ecommerce/RecentOrders";
import PageMeta from "../../components/common/PageMeta";
import SMSLogsGrid from "../../components/grid/SMSLogsGrid";

export default function Home() {
  return (
    <>
      <PageMeta title="SMS 2.0" description="SMS 2.0" />

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-6 p-4">
        {/* Ecommerce Metrics - Full width on mobile, half on md, 1/3 on xl */}
        <div className="col-span-1 xl:col-span-3">
          <EcommerceMetrics />
        </div>

        {/* Statistics Chart */}
        <div className="col-span-1 xl:col-span-3">
          <StatisticsChart />
        </div>

        {/* SMS Logs Grid */}
        <div className="col-span-1 xl:col-span-3">
          <SMSLogsGrid />
        </div>
      </div>
    </>
  );
}
