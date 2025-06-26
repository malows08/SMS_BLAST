import PageBreadcrumb from "../components/common/PageBreadCrumb";
import UserMetaCard from "../components/UserProfile/UserMetaCard";
import UserInfoCard from "../components/UserProfile/UserInfoCard";
import UserAddressCard from "../components/UserProfile/UserAddressCard";
import PageMeta from "../components/common/PageMeta";
import { useSenderId } from "../context/SenderIdContext";

export default function UserProfiles() {
  const { senderId } = useSenderId(); // 👈 access the global SenderId
  return (
    <>
      <PageMeta
        title="SMS 2.0"
        description="This is SMS Profile Dashboard page for Kizuna - SMS Tailwind CSS Admin Dashboard Template"
      />
      <PageBreadcrumb pageTitle="Profile" />
      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] lg:p-6">
        <h3 className="mb-5 text-lg font-semibold text-gray-800 dark:text-white/90 lg:mb-7">
          User Info
        </h3>
        {/* <p className="mt-4 text-lg text-gray-700">
        Sender ID: <span className="font-mono">{senderId}</span>
      </p> */}
        <div className="space-y-6">
          <UserMetaCard />
          <UserInfoCard />
          <UserAddressCard />
        </div>
      </div>
    </>
  );
}
