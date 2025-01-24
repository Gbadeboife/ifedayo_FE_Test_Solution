import React from "react";
import { Navigate } from "react-router";
import { useSearchParams } from "react-router-dom";

const ResetRedirect = ({ role }) => {
  const [searchParams] = useSearchParams();
  return <Navigate to={`/reset-password?token=${searchParams.get("token")}&role=${role}`} />;
};

export default ResetRedirect;
