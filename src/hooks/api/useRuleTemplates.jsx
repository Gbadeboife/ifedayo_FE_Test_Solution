import { AuthContext, tokenExpireError } from "@/authContext";
import { GlobalContext } from "@/globalContext";
import MkdSDK from "@/utils/MkdSDK";
import TreeSDK from "@/utils/TreeSDK";
import { useContext, useEffect, useState } from "react";

const ctrl = new AbortController();
export default function useRuleTemplates(host_id) {
  const [rules, setRules] = useState([]);
  const { dispatch: authDispatch } = useContext(AuthContext);
  const { dispatch: globalDispatch } = useContext(GlobalContext);

  async function fetchRules() {
    let treeSdk = new TreeSDK();
    try {
      let filter = ["deleted_at,is"];
      if (host_id) {
        filter.push(`host_id,eq,${host_id}`);
      }
      const result = await treeSdk.getList("property_space_rule_template", { filter, join: [] });
      if (!result.error) {
        setRules(result.list);
      }
    } catch (err) {
      tokenExpireError(authDispatch, err.message);
      if (err.name == "AbortError") return;
      globalDispatch({
        type: "SHOW_ERROR",
        payload: {
          heading: "Operation failed",
          message: err.message,
        },
      });
    }
  }

  useEffect(() => {
    fetchRules();
  }, [host_id]);

  return rules;
}
