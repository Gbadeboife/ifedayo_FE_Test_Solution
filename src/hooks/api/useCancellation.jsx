import { callCustomAPI } from "@/utils/callCustomAPI";
import MkdSDK from "@/utils/MkdSDK";
import { useEffect } from "react";
import { useState } from "react";

const sdk = new MkdSDK();

export default function useCancellation() {
  const [content, setContent] = useState("");

  async function fetchCancellationPolicy() {
    const sdk = new MkdSDK();
    sdk.setTable("cms");
    const result = await callCustomAPI("cms", "post", { payload: { content_key: "cancellation_policy" }, limit: 1000, page: 1 }, "PAGINATE");

    if (Array.isArray(result.list) && result.list.length > 0) {
      setContent(result.list.find((stg) => stg.content_key == "cancellation_policy")?.content_value);
      return
    }
  }

  useEffect(() => {
    fetchCancellationPolicy();
  }, []);

  return content;
}
