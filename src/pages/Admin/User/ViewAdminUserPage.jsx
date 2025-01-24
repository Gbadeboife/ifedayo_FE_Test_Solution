import React, { useState } from "react";
import MkdSDK from "@/utils/MkdSDK";
import { useNavigate, useParams } from "react-router-dom";
import { GlobalContext, showToast } from "@/globalContext";
import ViewAdminPageLayout from "@/layouts/ViewAdminPageLayout";
import Icon from "@/components/Icons";
import { AuthContext, tokenExpireError } from "@/authContext";
import { callCustomAPI } from "@/utils/callCustomAPI";
import moment from "moment";

let sdk = new MkdSDK();

const ViewAdminUserPage = () => {
  const status = ["Inactive", "Active", "Suspend"];
  const verified = ["No", "Yes"];
  const id_verified = ["Pending", "Yes", "No"];
  const [userInfo, setUserInfo] = useState({});
  const { dispatch: globalDispatch } = React.useContext(GlobalContext);
  const { dispatch, state: authState } = React.useContext(AuthContext);
  const params = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  async function fetchUser() {
    try {
      sdk.setTable("user");
      const result = await sdk.callRestAPI({ id: Number(params?.id) }, "GET");

      sdk.setTable("profile");
      const {
        list: [resultDob],
      } = await sdk.callRestAPI(
        { payload: { user_id: result.model.id } }, // Note: Should be user_id
        "GETALL",
      );

      sdk.setTable("id_verification");
      const {
        list: [resultIdVerification],
      } = await sdk.callRestAPI(
        { payload: { user_id: result.model.id } }, // Note: Should be user_id
        "GETALL",
      );
      setUserInfo({ ...result.model, dob: resultDob?.dob, id_verified: resultIdVerification?.status });
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
        path: "user",
      },
    });

    fetchUser();
  }, []);

  return (
    <ViewAdminPageLayout
      title={"User"}
      backTo={"user"}
      table1={"user"}
      table2={"profile"}
      deleteMessage="Are you sure you want to delete this User?"
      id={params?.id}
      showDelete={authState.originalRole == "superadmin" || userInfo.role != "superadmin"}
    >
      <div className="py-5">
        <div className="w-full max-w-xl">
          <div className="mb-5 flex px-5">
            <p className="w-[15rem] text-base font-bold">Profile Details</p>
            {!(authState.role != "superadmin" && userInfo.role == "superadmin") && (
              <div className="flex-1">
                <button
                  className="flex items-center text-[#33D4B7]"
                  onClick={() => navigate(`/admin/edit-user/${params?.id}`)}
                >
                  <Icon
                    type="pencil"
                    className="stroke-[#33D4B7]"
                  />
                  <span className="ml-2">Edit</span>
                </button>
              </div>
            )}
          </div>
          <div className="flex py-2">
            <p className="mr-10 w-[9rem] px-5 text-right">ID</p>
            <p className="flex-1">{userInfo.id}</p>
          </div>
          <div className="flex py-2">
            <p className="mr-10 w-[9rem] px-5 text-right">First Name</p>
            <p className="flex-1">{userInfo.first_name}</p>
          </div>
          <div className="flex py-2">
            <p className="mr-10 w-[9rem] px-5 text-right">Last Name</p>
            <p className="flex-1">{userInfo.last_name}</p>
          </div>
          <div className="flex py-2">
            <p className="mr-10 w-[9rem] px-5 text-right">Email</p>
            <p className="flex-1 normal-case">{userInfo.email}</p>
          </div>
          <div className="flex py-2">
            <p className="mr-10 w-[9rem] px-5 text-right">Date of Birth</p>
            <p className="flex-1">{userInfo.dob == null ? "N/A" : moment(userInfo.dob).format("MM/DD/yyyy")}</p>
          </div>
          <div className="flex py-2">
            <p className="mr-10 w-[9rem] px-5 text-right">Role</p>
            <p className="flex-1">{userInfo.role}</p>
          </div>
          <div className="flex py-2">
            <p className="mr-10 w-[9rem] px-5 text-right">Status</p>
            <p className="flex-1">{status[userInfo.status]}</p>
          </div>
          <div className="flex py-2">
            <p className="mr-10 w-[9rem] px-5 text-right">Email Verified</p>
            <p className="flex-1">{verified[userInfo.verify]}</p>
          </div>
          <div className="flex py-2">
            <p className="mr-10 w-[9rem] px-5 text-right">ID Verified</p>
            <p className="flex-1">{id_verified[userInfo.id_verified] ?? "N/A"}</p>
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
    </ViewAdminPageLayout>
  );
};

export default ViewAdminUserPage;
