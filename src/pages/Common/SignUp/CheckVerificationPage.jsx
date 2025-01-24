import { AuthContext } from "@/authContext";
import React, { useContext, useEffect } from "react";
import { Navigate } from "react-router";

export default function CheckVerificationPage() {
  const { state: authState, dispatch: authDispatch } = useContext(AuthContext);

  useEffect(() => {
    let timeout;

    timeout = setTimeout(() => {
      authDispatch({ type: "DISALLOW_CHECK_VERIFICATION" });
    }, 10000);

    return () => clearTimeout(timeout);
  }, []);

  if (!authState.allowCheckVerification) return <Navigate to={"/login"} />;

  return (
    <div className="flex min-h-screen items-center justify-center normal-case">
      <div className="">
        <h1 className="text-4xl block text-center">Account Created successfully. Please check your email to verify your account</h1>
        <p className="text-center">You'll be redirected to login page shortly</p>
      </div>
    </div>
  );
}
