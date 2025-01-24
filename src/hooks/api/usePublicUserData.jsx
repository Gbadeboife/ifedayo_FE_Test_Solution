import { AuthContext, tokenExpireError } from "@/authContext";
import { GlobalContext } from "@/globalContext";
import MkdSDK from "@/utils/MkdSDK";
import { callCustomAPI } from "@/utils/callCustomAPI";
import { IMAGE_STATUS } from "@/utils/constants";
import { useContext, useState } from "react";
import { useEffect } from "react";
const ctrl = new AbortController();
const sdk = new MkdSDK();
export default function usePublicUserData(user_id) {
  const [user, setUser] = useState({});
  const { dispatch: globalDispatch } = useContext(GlobalContext);
  const { dispatch } = useContext(AuthContext);

  async function fetchUserData() {
    try {
      const result = await sdk.callRawAPI("/v2/api/custom/ergo/get-user", { id: user_id }, "POST", ctrl.signal);
      setUser({ ...result, photo: result.is_photo_approved == IMAGE_STATUS.APPROVED ? result.photo : null });
    } catch (err) {
      tokenExpireError(dispatch, err.message);
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
    if (isNaN(user_id)) return;
    fetchUserData();
  }, [user_id]);
  return user;
}
