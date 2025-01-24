import React, { useState } from "react";
import MkdSDK from "@/utils/MkdSDK";
import { Link, useNavigate, useParams } from "react-router-dom";
import { GlobalContext } from "@/globalContext";
import ViewAdminPageLayout from "@/layouts/ViewAdminPageLayout";
import History from "@/components/History";
import Icon from "@/components/Icons";
import EditAdminPropertyPage from "./EditAdminPropertyPage";

let sdk = new MkdSDK();

const ViewAdminPropertyPage = ({ page }) => {
  const [profileInfo, setProfileInfo] = useState();
  const { dispatch: globalDispatch } = React.useContext(GlobalContext);
  const params = useParams();
  const [activeTab, setActiveTab] = useState(0);

  const tabs = [
    {
      key: 0,
      name: "Profile Details",
      component: page === "view" ? <ProfileDetails profileInfo={profileInfo} /> : <EditAdminPropertyPage />,
    },
    {
      key: 1,
      name: "History",
      component: (
        <History
          id={params?.id}
          table="property"
        />
      ),
    },
    // {
    //   key: 2,
    //   name: "Spaces",
    //   component: <div></div>
    // },
    // {
    //   key: 3,
    //   name: "Addons",
    //   component: <div></div>
    // }
  ];

  React.useEffect(() => {
    globalDispatch({
      type: "SETPATH",
      payload: {
        path: "property",
      },
    });

    (async function () {
      const result = await sdk.callRawAPI(
        "/v2/api/custom/ergo/property/PAGINATE",
        {
          where: [params?.id ? `${params?.id ? `ergo_property.id = '${params?.id}'` : "1"}` : 1],
          page: 1,
          limit: 1,
        },
        "POST",
      );

      if (!result.error) {
        setProfileInfo(result.list[0]);
      }
    })();
  }, []);

  return (
    <ViewAdminPageLayout
      title={"Property"}
      name={`${profileInfo ? `${profileInfo?.name}` : ""}`}
      backTo={"property"}
      table1={"property"}
      deleteMessage="Are you sure you want to delete this Property?"
      id={params?.id}
    >
      <div className="border-b border-gray-200 text-center text-sm font-medium text-gray-500">
        <ul className="-mb-px flex flex-wrap">
          {tabs.map((tab) => (
            <li
              key={tab.key}
              className="mr-2"
            >
              <button
                onClick={() => setActiveTab(tab.key)}
                className={`inline-block p-4 ${
                  activeTab === tab.key ? "border-[#111827] font-bold text-[#111827]" : " border-transparent hover:border-gray-300 hover:text-gray-600"
                }  rounded-t-lg border-b-2 `}
              >
                {tab.name}
              </button>
            </li>
          ))}
        </ul>
      </div>

      {tabs[activeTab].component}
    </ViewAdminPageLayout>
  );
};

const ProfileDetails = ({ profileInfo }) => {
  const navigate = useNavigate();
  const params = useParams();
  const selectVerified = [
    { key: "0", value: "No" },
    { key: "1", value: "Yes" },
  ];

  const selectStatus = [
    {
      key: "0",
      value: "Inactive",
    },
    { key: "1", value: "Active" },
  ];

  return (
    <>
      <div className="p-5">
        <div className="w-full max-w-[413px]">
          <div className="mb-5 flex px-5">
            <p className="w-[15rem] text-base font-bold">Profile Details</p>
            <div className="flex-1">
              <button
                className="flex items-center text-[#33D4B7]"
                onClick={() => navigate(`/admin/edit-property/${params?.id}`)}
              >
                <Icon
                  type="pencil"
                  className="stroke-[#33D4B7]"
                />
                <span className="ml-2">Edit</span>
              </button>
            </div>
          </div>
          <div className="flex py-2">
            <p className="mr-10 w-[10rem] px-5 text-right">Host ID</p>
            <p className="flex-1">{profileInfo?.host_id}</p>
          </div>
          <div className="flex py-2">
            <p className="mr-10 w-[10rem] px-5 text-right">Host Email</p>
            <p className="flex-1 lowercase">{profileInfo?.email}</p>
          </div>
          <div className="flex py-2">
            <p className="mr-10 w-[10rem] px-5 text-right">Address</p>
            <p className="flex-1">
              {profileInfo?.address_line_1} {profileInfo?.address_line_2}
            </p>
          </div>
          <div className="flex py-2">
            <p className="mr-10 w-[10rem] px-5 text-right">City</p>
            <p className="flex-1">{profileInfo?.city}</p>
          </div>
          <div className="flex py-2">
            <p className="mr-10 w-[10rem] px-5 text-right">Zip Code</p>
            <p className="flex-1">{profileInfo?.zip}</p>
          </div>
          <div className="flex py-2">
            <p className="mr-10 w-[10rem] px-5 text-right">Country</p>
            <p className="flex-1">{profileInfo?.country}</p>
          </div>
          <div className="flex py-2">
            <p className="mr-10 w-[10rem] px-5 text-right">Verified</p>
            <p className="flex-1">{selectVerified[profileInfo?.verified]?.value}</p>
          </div>
          <div className="flex py-2">
            <p className="mr-10 w-[10rem] px-5 text-right normal-case">Num of Spaces</p>
            <p className="flex-1">{profileInfo?.spaces}</p>
          </div>
          <div className="flex py-2">
            <p className="mr-10 w-[10rem] px-5 text-right">Status</p>
            <p className="flex-1">{selectStatus[profileInfo?.status]?.value}</p>
          </div>
          <div className="flex py-2">
            <Link
              className="mr-10 w-[10rem] px-5 text-right font-semibold underline "
              to={`/admin/property_add_on?property_id=${profileInfo?.id}`}
              target={"_blank"}
            >
              View Addons
            </Link>
          </div>
        </div>
      </div>
    </>
  );
};

export default ViewAdminPropertyPage;
