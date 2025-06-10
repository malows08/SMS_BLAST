import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import ComponentCard from "../../components/common/ComponentCard";
import PageMeta from "../../components/common/PageMeta";
import BasicTableOne from "../../components/tables/BasicTables/BasicTableOne";

export default function RoleTables() {
  return (
    <>
      <PageMeta
        title="SMS 2.0"
        description="This is SMS Basic Tables Dashboard page for Kizuna - SMS Tailwind CSS Admin Dashboard Template"
      />
      <PageBreadcrumb pageTitle="User Roles" />
      <div className="space-y-6">
        <ComponentCard title="Role Assignment">
          <BasicTableOne />
        </ComponentCard>
      </div>
    </>
  );
}
