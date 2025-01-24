import React, { useContext, useState } from "react";
import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import MkdSDK from "@/utils/MkdSDK";
import { callCustomAPI } from "@/utils/callCustomAPI";
import { GlobalContext, showToast } from "@/globalContext";

const VerifyEmailPage = () => {
  const [searchParams] = useSearchParams();
  const [pageText, setPageText] = useState("Verifying your email...");
  const navigate = useNavigate();
  const { dispatch: globalDispatch } = useContext(GlobalContext);

  let sdk = new MkdSDK();

  async function verifyEmail() {
    const token = searchParams.get("token");
    try {
      const result = await sdk.verifyEmail(token);

      if (searchParams.get("is_manual") != "true") {
        // only send signup confirmation email if email verification link was not triggered manually
        const user = await callCustomAPI("get-user", "post", { id: result.user_id }, "");
        const tmpl = await sdk.getEmailTemplate("signup-confirmation");
        const body = tmpl.html?.replace(new RegExp("{{{first_name}}}", "g"), user.first_name).replace(new RegExp("{{{last_name}}}", "g"), user.last_name);

        await sdk.sendEmail(user.email, tmpl.subject, body);
      }

      if (!result.error) {
        showToast(globalDispatch, "Email verified", 3000, "success");
      }

      setPageText("Your account has been verified, You will be redirected to login page shortly");

      setTimeout(() => {
        navigate(`/login`);
      }, 4000);
    } catch (err) {}
  }

  useEffect(() => {
    verifyEmail();
  }, []);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <h1 className="text-5xl">{pageText}</h1>
    </div>
  );
};

export default VerifyEmailPage;
