import React, { useState } from "react";
import MkdSDK from "@/utils/MkdSDK";
import { useNavigate, useParams } from "react-router-dom";
import { GlobalContext, showToast } from "@/globalContext";
import ViewAdminPageLayout from "@/layouts/ViewAdminPageLayout";
import History from "@/components/History";
import Payment from "@/components/Payment";
import Icon from "@/components/Icons";
import EditAdminHostPage from "./EditAdminHostPage";
import { ID_PREFIX } from "@/utils/constants";
import { AuthContext, tokenExpireError } from "@/authContext";
import moment from "moment";

let sdk = new MkdSDK();

const ViewAdminHostPage = ({ page }) => {
  const [userInfo, setUserInfo] = useState({});
  const { dispatch: globalDispatch } = React.useContext(GlobalContext);
  const { dispatch } = React.useContext(AuthContext);
  const params = useParams();
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(false);

  const tabs = [
    {
      key: 0,
      name: "Profile Details",
      component:
        page === "view" ? (
          <ProfileDetails
            userInfo={userInfo}
            loading={loading}
            sendPasswordReset={sendPasswordReset}
            sendEmailVerification={sendEmailVerification}
          />
        ) : (
          <EditAdminHostPage />
        ),
    },
    {
      key: 1,
      name: "History",
      component: (
        <History
          id={params?.id}
          table="host"
        />
      ),
    },
    {
      key: 2,
      name: "Payment",
      component: (
        <Payment
          id={params?.id}
          table="host"
        />
      ),
    },
  ];

  async function fetchUser() {
    try {
      sdk.setTable("user");
      const result = await sdk.callRawAPI(
        "/v2/api/custom/ergo/user/PAGINATEHOST",
        {
          where: [params?.id ? `${params?.id ? `ergo_user.id = ${Number(params?.id)}` : "1"} ` : "role = 'host'"],
          page: 1,
          limit: 1,
        },
        "POST",
      );

      sdk.setTable("profile");
      const {
        list: [resultDob],
      } = await sdk.callRestAPI(
        { payload: { user_id: result.list[0].id } }, // Note: Should be user_id
        "GETALL",
      );

      sdk.setTable("id_verification");
      const {
        list: [resultIdVerification],
      } = await sdk.callRestAPI(
        { payload: { user_id: result.list[0].id } }, // Note: Should be user_id
        "GETALL",
      );
      setUserInfo({ ...result.list[0], dob: resultDob?.dob, id_verified: resultIdVerification?.status });
    } catch (err) {
      tokenExpireError(dispatch, err.message);
      showToast(globalDispatch, err.message, 4000, "ERROR");
    }
  }

  async function sendPasswordReset() {
    setLoading(true);
    try {
      await sdk.forgot(userInfo.email, userInfo.role);
      showToast(globalDispatch, "Email Sent");
    } catch (err) {
      tokenExpireError(dispatch, err.message);
      showToast(globalDispatch, err.message, 4000, "ERROR");
    }
    setLoading(false);
  }

  async function sendEmailVerification() {
    try {
      await sdk.callRawAPI("/v2/api/custom/ergo/resend-verification-email", { email: userInfo.email }, "POST");
      showToast(globalDispatch, "Email Sent");
    } catch (err) {
      tokenExpireError(dispatch, err.message);
      showToast(globalDispatch, err.message, 4000, "ERROR");
    }
  }

  React.useEffect(() => {
    globalDispatch({
      type: "SETPATH",
      payload: {
        path: "host",
      },
    });
    fetchUser();
  }, []);

  return (
    <ViewAdminPageLayout
      title={`Host`}
      name={`${userInfo ? `${userInfo?.first_name} ${userInfo?.last_name}` : ""}`}
      backTo={"host"}
      table1={"user"}
      table2={"profile"}
      deleteMessage="Are you sure you want to delete this Host?"
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

const ProfileDetails = ({ userInfo, loading, sendPasswordReset, sendEmailVerification }) => {
  const status = ["Inactive", "Active", "Suspend"];
  const verified = ["No", "Yes"];
  const id_verified = ["Pending", "Yes", "No"];
  const params = useParams();
  const navigate = useNavigate();

  return (
    <>
      <div className="p-5">
        <div className="w-full max-w-xl">
          <div className="mb-5 flex px-5">
            <p className="w-[15rem] text-base font-bold">Profile Details</p>
            <div className="flex-1">
              <button
                className="flex items-center text-[#33D4B7]"
                onClick={() => navigate(`/admin/edit-host/${params?.id}`)}
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
            <p className="mr-10 w-[9rem] px-5 text-right">ID</p>
            <p className="flex-1">{ID_PREFIX.HOST + userInfo?.id}</p>
          </div>
          <div className="flex py-2">
            <p className="mr-10 w-[9rem] px-5 text-right">First Name</p>
            <p className="flex-1">{userInfo?.first_name}</p>
          </div>
          <div className="flex py-2">
            <p className="mr-10 w-[9rem] px-5 text-right">Last Name</p>
            <p className="flex-1">{userInfo?.last_name}</p>
          </div>
          <div className="flex py-2">
            <p className="mr-10 w-[9rem] px-5 text-right ">Email</p>
            <p className="flex-1 normal-case">{userInfo?.email}</p>
          </div>
          <div className="flex py-2">
            <p className="mr-10 w-[9rem] px-5 text-right">Date of Birth</p>
            <p className="flex-1">{userInfo.dob == null ? "N/A" : moment(userInfo.dob).format("MM/DD/yyyy")}</p>
          </div>
          <div className="flex py-2">
            <p className="mr-10 w-[9rem] px-5 text-right">Properties</p>
            <p className="flex-1 ">
              {userInfo?.num_properties}
              <button
                className="ml-2 border-gray-200 font-bold underline"
                onClick={() => {
                  navigate(`/admin/property?email=${userInfo?.email ?? ""}`);
                }}
              >
                ( View )
              </button>
            </p>
          </div>
          <div className="flex py-2">
            <p className="mr-10 w-[9rem] px-5 text-right">Status</p>
            <p className="flex-1">{status[userInfo?.status]}</p>
          </div>
          <div className="flex py-2">
            <p className="mr-10 w-[9rem] px-5 text-right">Email Verified</p>
            <p className="flex-1">{verified[userInfo?.verify]}</p>
          </div>
          <div className="flex py-2">
            <p className="mr-10 w-[9rem] px-5 text-right">ID Verified</p>
            <p className="flex-1">{id_verified[userInfo?.id_verified] ?? "N/A"}</p>
          </div>
          <div className="flex py-2">
            <p className="mr-10 w-[9rem] px-5 text-right">Actions</p>
            <button
              disabled={loading}
              onClick={sendPasswordReset}
              className="mr-4 text-sm text-[#33D4B7] underline disabled:text-gray-500"
            >
              Send A Password Reset Link
            </button>
            <button
              disabled={loading}
              onClick={sendEmailVerification}
              className="mr-4 text-sm text-[#33D4B7] underline disabled:text-gray-500"
            >
              Resend Email Verification
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default ViewAdminHostPage;
