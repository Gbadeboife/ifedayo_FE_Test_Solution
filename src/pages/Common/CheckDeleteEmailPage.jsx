import React, { useEffect } from "react";

export default function CheckDeleteEmailPage() {

  useEffect(() => {
    localStorage.clear();
  }, [])

  return (
    <div className="flex items-center justify-center min-h-screen">
      <h1 className="text-4xl">You have requested to delete your account. Please check your email to confirm this operation</h1>
    </div>
  );
}
