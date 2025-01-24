import React, { useState } from "react";
import MkdSDK from "@/utils/MkdSDK";
import { GlobalContext, showToast } from "@/globalContext";
import { AuthContext, tokenExpireError } from "@/authContext";
import SunEditor, { buttonList } from "suneditor-react";
import "suneditor/dist/css/suneditor.min.css"; // Import Sun Editor's CSS File
import { LoadingButton } from "@/components/frontend";

let sdk = new MkdSDK();

export default function AdminCancellationPolicyPage() {
  const { dispatch } = React.useContext(AuthContext);
  const { dispatch: globalDispatch } = React.useContext(GlobalContext);
  const [id, setId] = useState(0);
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);

  async function fetchCancellationPolicy() {
    sdk.setTable("cms");
    try {
      const result = await sdk.callRestAPI({ payload: { content_key: "cancellation_policy" }, limit: 1, page: 1 }, "PAGINATE");

      if (Array.isArray(result.list) && result.list.length > 0) {
        setId(result.list[0].id);
        setContent(result.list[0].content_value);
      }
    } catch (err) {
      tokenExpireError(dispatch, err.message);
      showToast(globalDispatch, err.message, 4000, "ERROR");
    }
  }

  const onSubmit = async (e) => {
    setLoading(true);
    e.preventDefault();
    try {
      const result = await sdk.callRestAPI(
        {
          id,
          content_value: content,
        },
        "PUT",
      );
      showToast(globalDispatch, "Saved", 3000);
    } catch (err) {
      tokenExpireError(dispatch, err.message);
      showToast(globalDispatch, err.message, 4000, "ERROR");
    }
    setLoading(false);
  };
  React.useEffect(() => {
    globalDispatch({
      type: "SETPATH",
      payload: {
        path: "cancellation_policy",
      },
    });
    fetchCancellationPolicy();
  }, []);

  return (
    <div className="shadow-md rounded mx-auto p-5">
      <h4 className="text-2xl font-medium mb-16">Cancellation policy</h4>
      <form
        className="w-full"
        onSubmit={onSubmit}
      >
        <div className="mb-4">
          <SunEditor
            width="600px"
            height="304px"
            onChange={(content) => setContent(content)}
            setContents={content}
            name="content"
            setOptions={{ buttonList: buttonList.complex }}
          />
        </div>
        <div className="flex gap-2">
          <LoadingButton
            loading={loading}
            loadingEl={<>Submitting</>}
            type="submit"
            className="login-btn-gradient text-white py-2 px-4 rounded focus:outline-none focus:shadow-outline"
            disabled={loading}
          >
            Submit
          </LoadingButton>
        </div>
      </form>
    </div>
  );
}
