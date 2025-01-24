import { GlobalContext } from "@/globalContext";
import { callCustomAPI } from "@/utils/callCustomAPI";
import MkdSDK from "@/utils/MkdSDK";
import React, { useState } from "react";
import { useContext } from "react";
import { useEffect } from "react";

export default function CancellationPolicyPage() {
  const [content, setContent] = useState("");
  const { dispatch: globalDispatch } = useContext(GlobalContext);

  async function fetchCancellationPolicy() {
    globalDispatch({ type: "START_LOADING" });
    const sdk = new MkdSDK();
    sdk.setTable("cms");
    try {
      const result = await callCustomAPI("cms", "post", { payload: { content_key: "cancellation_policy" }, limit: 1000, page: 1 }, "PAGINATE");

      if (Array.isArray(result.list) && result.list.length > 0) {
        setContent(result.list.find((stg) => stg.content_key == "cancellation_policy")?.content_value);
      }
    } catch (err) {
      globalDispatch({
        type: "SHOW_ERROR",
        payload: {
          heading: "Cannot get Cancellation policy",
          message: err.message,
        },
      });
    }
    globalDispatch({ type: "STOP_LOADING" });
  }

  useEffect(() => {
    fetchCancellationPolicy();
  }, []);

  return (
    <div className="mt-[120px] min-h-screen normal-case text-sm">
      <div className="container mx-auto 2xl:px-32 px-4">
        <article
          className="sun-editor-editable"
          dangerouslySetInnerHTML={{ __html: content }}
        ></article>
      </div>
    </div>
  );
}
