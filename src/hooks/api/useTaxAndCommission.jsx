import { GlobalContext } from "@/globalContext";
import MkdSDK from "@/utils/MkdSDK";
import React from "react";
import { useContext } from "react";
import { useEffect } from "react";
import { useState } from "react";

export default function useTaxAndCommission() {
  const [tax, setTax] = useState(null);
  const [commission, setCommission] = useState(null);
  const sdk = new MkdSDK();
  const { dispatch: globalDispatch } = useContext(GlobalContext);

  async function fetchSettings() {
    sdk.setTable("settings");
    try {
      const result = await sdk.callRestAPI({ page: 1, limit: 2, payload: {} }, "PAGINATE");
      if (Array.isArray(result.list) && result.list.length > 0) {
        setTax(result.list.find((x) => x.key_name == "tax")?.key_value);
        setCommission(result.list.find((x) => x.key_name == "commission")?.key_value);
      }
    } catch (err) {
      globalDispatch({
        type: "SHOW_ERROR",
        payload: {
          heading: "Unable to determine tax amount",
          message: err.message,
        },
      });
    }
  }

  useEffect(() => {
    fetchSettings();
  }, []);

  return { tax, commission };
}
