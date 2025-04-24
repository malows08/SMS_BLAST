import EcommerceMetrics from "../../components/ecommerce/EcommerceMetrics";
//import MonthlySalesChart from "../../components/ecommerce/MonthlySalesChart";
import StatisticsChart from "../../components/ecommerce/StatisticsChart";
//import MonthlyTarget from "../../components/ecommerce/MonthlyTarget";
import RecentOrders from "../../components/ecommerce/RecentOrders";
//import DemographicCard from "../../components/ecommerce/DemographicCard";
import PageMeta from "../../components/common/PageMeta";
import SMSLogsGrid from "../../components/grid/SMSLogsGrid"; // Import grid for SMS logs

export default function Home() {
  return (
    <>
    
      <PageMeta
        title="SMS 2.0"
        description="SMS 2.0"
      />
      
      <div className="grid grid-cols-12 gap-4 md:gap-6">
        <div className="col-span-50 xl:col-span-50">
          <EcommerceMetrics />

          {/* <MonthlySalesChart /> */}
        </div>

        {/* <div className="col-span-12 xl:col-span-5">
          <MonthlyTarget />
        </div> */}

        <div className="col-span-50">
          <StatisticsChart />
        </div>

        {/* <div className="col-span-12 xl:col-span-5">
          <DemographicCard />
        </div> */}

        <div className="col-span-50">
        <SMSLogsGrid/>
        </div>

      </div>
    </>
  );
}
