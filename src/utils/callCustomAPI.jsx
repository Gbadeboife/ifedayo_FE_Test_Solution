import axios from "axios";

export async function callCustomAPI(endpoint, method, payload, action = "NONE", token, version) {
  try {
    const result = await axios({
      method,
      url: `https://ergo.mkdlabs.com/${version ?? "v2"}/api/custom/ergo/${endpoint}/${action}`,
      data: payload,
      headers: {
        "X-Project": "ZXJnbzprNWdvNGw1NDhjaDRxazU5MTh4MnVsanV2OHJxcXAyYXM=",
        Authorization: `Bearer ${token ?? localStorage.getItem("token")}`,
        uid: localStorage.getItem("device-uid"),
      },
    });
    if (result.data?.error) {
      throw new Error(result.data.error || "An Error Occurred");
    } else {
      switch (action) {
        case "PAGINATE":
          return result.data;
        default:
          return result.data;
      }
    }
  } catch (err) {
    console.log(`CUSTOM ERROR(${endpoint}): `, err);
    if (err.response?.data?.message === "TOKEN_EXPIRED") {
      localStorage.clear();
      location.href = "/login";
    }
    // if (err.code == "ERR_NETWORK") throw new Error("Please make sure you have an active internet connection");
    throw new Error(err.response?.data?.message || "An Error Occurred");
  }
}

export async function oauthLoginApi(type, role) {
  return axios.get(`https://ergo.mkdlabs.com/v2/api/lambda/${type}/login?role=${role}`, { headers: { "x-project": "ZXJnbzprNWdvNGw1NDhjaDRxazU5MTh4MnVsanV2OHJxcXAyYXM" } });
}
