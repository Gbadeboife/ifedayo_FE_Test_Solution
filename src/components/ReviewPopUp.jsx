import React from "react";
import { GlobalContext, showToast } from "@/globalContext";
import { Link } from "react-router-dom";
import MkdSDK from "@/utils/MkdSDK";
import Icon from "./Icons";
import LoadingButton from "@/components/frontend/LoadingButton";

export default function ReviewPopUp({ showReview, review }) {
  const { dispatch: globalDispatch } = React.useContext(GlobalContext);
  const stars = Array(5).fill(0);
  const [hashtags, setHashtags] = React.useState([]);
  const [reason, setReason] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [acceptLoading, setAcceptLoading] = React.useState(false);

  let sdk = new MkdSDK();

  async function acceptReview(id) {
    sdk.setTable("review");
    setAcceptLoading(true);
    try {
      const result = await sdk.callRestAPI({ id, status: 1 }, "PUT");
      if (!result.error) {
        showToast(globalDispatch, "Review accepted", 4000, "Success")
        globalDispatch({
          type: "SHOW_REVIEW",
          payload: {
            showReview: false,
            review: "",
          },
        })
      }
    } catch (err) {
      globalDispatch({
        type: "SHOW_ERROR",
        payload: {
          heading: "Operation failed",
          message: err.message,
        },
      });
    }
    setAcceptLoading(false)
  }

  async function declineReview(review) {
    if (reason.length < 1) {
      showToast(globalDispatch, "Please add a reason for declining review", 4000, "ERROR")
    } else {
      sdk.setTable("review");
      setLoading(true);
      try {
        const result = await sdk.callRestAPI({ "id": review.id, status: 2 }, "PUT");
        if (!result.error) {
          showToast(globalDispatch, "Review declined", 4000, "Error")
          globalDispatch({
            type: "SHOW_REVIEW",
            payload: {
              showReview: false,
              review: "",
            },
          })
          sendEmailAlert(review.given_by === "host" ? review.host_id : review.customer_id, review?.property_name ?? "property_name")
        }
      } catch (err) {
        globalDispatch({
          type: "SHOW_ERROR",
          payload: {
            heading: "Operation failed",
            message: err.message,
          },
        });
      }
      setLoading(false);
    }

  }

  async function sendEmailAlert(to, property_name) {
    try {
      // get receiver preferences
      const result = await sdk.callRawAPI("/v2/api/custom/ergo/get-user", { id: to }, "POST");
      if (!result.error) {
        const tmpl = await sdk.getEmailTemplate("customer-review-declined");
        const body = tmpl.html
          ?.replace(new RegExp("{{{reason}}}", "g"), reason)
          .replace(new RegExp("{{{property_name}}}"), property_name)

        // send email
        await sdk.sendEmail(result.email, tmpl.subject, body);
      }

    } catch (err) {
      console.log("ERROR", err);
    }
  }



  async function getHashtags() {
    try {
      const result = await sdk.callRawAPI(
        "/v2/api/custom/ergo/review/get-hashtag",
        {
          where: [`review_id=${review?.id}`],
        },
        "POST",
      );
      if (!result.error && result?.list) {
        setHashtags(result.list);
      }
    } catch (error) { }
  }

  React.useEffect(() => {
    getHashtags();
  }, [review?.id]);

  return (
    <>
      {showReview ? (
        <>
          <div
            className="justify-center items-center flex overflow-x-hidden overflow-y-auto fixed inset-0 z-50 outline-none focus:outline-none"
          >
            <div className="relative my-6 mx-auto w-[510px] max-w-[510px]">
              {/*content*/}
              <div className="border-0 rounded-lg  shadow-lg relative flex flex-col bg-white outline-none focus:outline-none">
                {/*header*/}
                <div className="flex w-11/12 mx-auto  items-center justify-between pt-6 border-solid border-slate-200 rounded-t">
                  <h3 className="text-md font-bold">Review details</h3>
                  <button
                    className="ml-auto bg-transparent border-0 text-black text-3xl leading-none font-semibold outline-none focus:outline-none"
                    onClick={() =>
                      globalDispatch({
                        type: "SHOW_REVIEW",
                        payload: {
                          showReview: false,
                          review: "",
                        },
                      })
                    }
                  >
                    <span className="bg-transparent text-black h-6 w-6 text-2xl block outline-none focus:outline-none">×</span>
                  </button>
                </div>
                <div className=" w-11/12 my-3 mx-auto bg-gray-200 h-[1px]"></div>
                {/*body*/}
                <div className="relative px-6 py-2 flex-auto">
                  {review?.type === "received" && <p className="text-[#475467] mb-[2px] text-sm font-medium">Reviewed By: {review?.given_by}</p>}
                  <p className="text-[#475467] my-[2px] text-sm font-medium">Review posted on: {review?.create_at}</p>
                  <p className="text-[#475467] my-[2px] text-sm font-medium">Space name: {review?.category}</p>
                  <p className="text-[#475467] my-[2px] text-sm font-medium">
                    Booking: #{review?.booking_id}
                    <Link
                      className="underline ml-1"
                      to={`/admin/view-booking/${review?.booking_id}`}
                      onClick={() =>
                        globalDispatch({
                          type: "SHOW_REVIEW",
                          payload: {
                            showReview: false,
                            review: "",
                          },
                        })
                      }
                    >
                      (view details)
                    </Link>
                  </p>

                  <p className="text-lg font-bold mt-[14px]">Rating</p>
                  <p className="flex w-1/3 justify-between py-2">
                    {stars.map((_, index) => (
                      <Icon
                        type="star"
                        key={index}
                        className={review?.rating > index ? "stroke-[#FEC84B] fill-[#FEC84B]" : "stroke-[#98A2B3]"}
                      />
                    ))}
                  </p>

                  <p className="text-lg font-bold mt-[14px]">Hashtags</p>
                  <div className="flex py-2">
                    {hashtags.map((hashtag) => (
                      <span
                        key={hashtag.id}
                        className="py-2 px-3 mr-2 rounded bg-[#EAECF0]"
                      >
                        {hashtag.name}
                      </span>
                    ))}
                  </div>

                  <p className="text-lg font-bold mt-[14px]">Comment</p>
                  <p className="mt-[2px] text-sm text-[#475467]">{review?.comment}</p>
                  <div className="grid mt-3">
                    <label className="font-bold">Reason (optional for declining)</label>
                    <input type="text" maxLength={50} value={reason} onChange={(e) => setReason(e.target.value)} required className=" border mt-2 rounded-lg mt-1 p-2 max-w-xs h-[200px]" />
                  </div>
                </div>
                <div className="text-center my-8 flex px-6 gap-4">
                  {/* <button
                    type="button"
                    className="tracking-wide outline-none focus:outline-none rounded py-2 border-2 border-[#98A2B3] mt-4 flex-grow"
                    onClick={(e) => {
                      acceptReview(review?.id);
                    }}
                  >
                    Accept
                  </button> */}
                  <LoadingButton
                    type="button"
                    loading={acceptLoading}
                    className="border-[#98A2B3] border-2 text-black tracking-wide outline-none focus:outline-none rounded py-2  mt-4 flex-grow"
                    onClick={(e) => {
                      acceptReview(review?.id);
                    }}
                  >
                    Accept
                  </LoadingButton>
                  <LoadingButton
                    type="button"
                    loading={loading}
                    className="bg-[#D92D20] text-white tracking-wide outline-none focus:outline-none rounded py-2  mt-4 flex-grow"
                    onClick={(e) => {
                      declineReview(review);
                    }}
                  >
                    Decline
                  </LoadingButton>
                </div>
                {/*footer*/}
                <div className="flex  px-6 pb-6 border-solid border-slate-200 rounded-b">
                  <button
                    className="text-[#667085] background-transparent font-semibold flex-1 px-6 py-2 text-sm outline-none focus:outline-none mr-1 mb-1 border border-[##98A2B3] rounded"
                    type="button"
                    onClick={() => {
                      globalDispatch({
                        type: "SHOW_REVIEW",
                        payload: {
                          showReview: false,
                          review: "",
                        },
                      });
                    }}
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
          <div className="opacity-25 fixed inset-0 z-40 bg-black"></div>
        </>
      ) : null}
    </>
  );
}
