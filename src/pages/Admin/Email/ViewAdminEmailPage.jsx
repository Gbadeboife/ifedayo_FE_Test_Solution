import React, { useState } from "react";
import MkdSDK from "@/utils/MkdSDK";
import { useNavigate, useParams } from "react-router-dom";
import { GlobalContext } from "@/globalContext";
import ViewAdminPageLayout from "@/layouts/ViewAdminPageLayout";
import { AuthContext, tokenExpireError } from "@/authContext";

let sdk = new MkdSDK();

const ViewAdminEmailPage = () => {
  const [emailInfo, setEmailInfo] = useState({});
  const { dispatch } = React.useContext(AuthContext);
  const { dispatch: globalDispatch } = React.useContext(GlobalContext);
  const params = useParams();
  const navigate = useNavigate();

  React.useEffect(() => {
    globalDispatch({
      type: "SETPATH",
      payload: {
        path: "email",
      },
    });

    (async function () {
      try {
        sdk.setTable("email");
        const result = await sdk.callRestAPI({ id: Number(params?.id) }, "GET");

        setEmailInfo(result.model || {});
        console.log(result.model);
      } catch (error) {
        console.log("ERROR", error);
        tokenExpireError(dispatch, error.message);
      }
    })();
  }, []);

  return (
    <ViewAdminPageLayout
      title={"Email"}
      backTo={"email"}
      table1={"email"}
      deleteMessage="Are you sure you want to delete this Email?"
      id={params?.id}
    >
      <div className="py-5">
        <div className="w-full max-w-[413px]">
          <div className="flex mb-5 px-5">
            <p className="w-[15rem] font-bold text-base">Email Details</p>
            <div className="flex-1"></div>
          </div>
          <div className="flex py-2">
            <p className="w-[9rem] px-5 text-right mr-10">ID</p>
            <p className="flex-1">{emailInfo.id}</p>
          </div>
          <div className="flex py-2">
            <p className="w-[9rem] px-5 text-right mr-10">Type</p>
            <p className="flex-1">{emailInfo.slug}</p>
          </div>
          <div className="flex py-2">
            <p className="w-[9rem] px-5 text-right mr-10">Subject</p>
            <p className="flex-1">{emailInfo.subject}</p>
          </div>
          <div className="flex py-2">
            <p className="w-[9rem] px-5 text-right mr-10">Tags</p>
            <p className="flex-1 normal-case">{emailInfo.tag}</p>
          </div>
        </div>
      </div>
    </ViewAdminPageLayout>
  );
};

export default ViewAdminEmailPage;
