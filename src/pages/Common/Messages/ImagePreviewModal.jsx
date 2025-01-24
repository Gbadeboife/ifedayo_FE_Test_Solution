import { LoadingButton } from "@/components/frontend";
import { BOOKING_STATUS } from "@/utils/constants";
import * as yup from "yup";
import { yupResolver } from "@hookform/resolvers/yup";
import React, { useContext } from "react";
import { useForm } from "react-hook-form";
import MkdSDK from "@/utils/MkdSDK";
import { useSearchParams } from "react-router-dom";
import { GlobalContext } from "@/globalContext";


const ImagePreviewModal = ({ activeRoom, getRooms, setMessages, state, setRooms, spaceId, setShowImagePreviewModal, activeBooking }) => {
  const [imageSrc, setImageSrc] = React.useState("");
  const [messageError, setMessageError] = React.useState("");
  const [uploadedFile, setUploadedFile] = React.useState();
  const [loading, setLoading] = React.useState(false);
  const [searchParams, setSearchParams] = useSearchParams();
  const { state: globalState, dispatch: globalDispatch } = useContext(GlobalContext);

  const sdk = new MkdSDK();

  const schema = yup
    .object({
        photo: yup.string()
    })
    .required();

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(schema),
  });

  function handleFilePreview(file){
    if (file) {
      setUploadedFile(file[0])
      setImageSrc(URL.createObjectURL(file[0]));
    }
  };

  async function sendImageMessage() {

    if (imageSrc === "") {
      setMessageError("Please select an Image");
      return;
      }
                    
      setLoading(true);
      const handleImageUpload = async (file) => {
        const formData = new FormData();
        formData.append("file", file);
        try {
          const upload = await sdk.uploadImage(formData);
          return upload;
        } catch (err) {
          console.log("err", err);
          return "";
        }
      };

      const upload = await handleImageUpload(uploadedFile);
      if (upload?.id) {    
      setLoading(false);
      }              
      try {
      let date = new Date().toISOString().split("T")[0];
      let date2 = new Date().toISOString().replace("T", " ").split(".")[0];
      // if its temporary chat then create new room before message
      let result = null;

      let is_temp_chat = activeRoom?.is_temp_chat;

      let room_id = searchParams.get("room_id");

      if (is_temp_chat && room_id === "temp") {
        sdk.setTable("room");
        result = await sdk.callRestAPI(
          {
            user_id: state.user,
            other_user_id: Number(activeRoom?.other_user_id),
            booking_id: activeRoom.booking_id === null ? null : Number(activeRoom?.booking_id),
            property_id: spaceId,
            user_update_at: date2,
            other_user_update_at: date2,
            chat_id: -1,
          },
          "POST",
        )
        setRooms((prev) => {
          const copy = [...prev];
          copy[prev.findIndex((rm) => rm?.is_temp_chat)].id = result?.message;
          return copy;
        })
        // setRooms((prev) => [...prev,r])
        setActiveRoom((prev) => ({ ...prev, id: result.message }));
      }

      await sdk.postMessage({
        room_id: room_id === "temp" ? result?.message : Number(room_id),
        user_id: state.user,
        message: upload.url,
        date,
        other_user_id: activeRoom.other_user_id,
      });
      let newMessageObj = {
        room_id: activeRoom.id,
        chat: {
          message: upload.url,
          user_id: state.user,
          // other_user_id: activeRoom.other_user_id,
          is_image: true,
          timestamp: new Date(),
        },
        unread: 1,
        create_at: new Date().toISOString(),
        update_at: new Date().toISOString(),
      };

      setMessages((prev) => {
        const copy = { ...prev };
        copy[room_id === "temp" ? result?.message : Number(room_id)] = [...copy[room_id === "temp" ? result?.message : Number(room_id)], newMessageObj];
        return copy;
      });
      // is_temp_chat = false;
      setLoading(false);
      setShowImagePreviewModal(false);
      getRooms()

      // send email alert
      // sendEmailAlert(activeRoom.other_user_id, activeBooking.property_name, message, activeRoom.id);

    } catch (err) {
      console.log(err)
      globalDispatch({
        type: "SHOW_ERROR",
        payload: {
          heading: "Sending image failed",
          message: err.message,
        },
      });
    }
    setLoading(false);
  }

  return (
    <>
      <div className="fixed inset-0 z-50 overflow-y-auto">
        <div
          className="fixed inset-0 w-full h-full bg-black opacity-40"
          onClick={()=>{setShowImagePreviewModal(false);setImageSrc("")}}
        ></div>
        
        <div className="flex items-center min-h-screen px-4 mt-4 py-8">
          <div className="relative w-full max-w-lg p-4 mx-auto bg-white rounded-md shadow-lg">
          <div className="flex mb-4">
          <h1 className="text-2xl">Please select an Image</h1>
        </div>
          <div className="flex mb-4 text-red-600">
      <span className="text-xs">{messageError}</span>
    </div>
          <label
            htmlFor="send-picture"
            className={`cursor-pointer border p-2.5 rounded-md`}>
                <input
                  className="hidden"
                  onChange={(e)=> handleFilePreview(e.target.files)}
                  id="send-picture"
                  type="file"
                  accept="image/png, image/gif, image/jpeg"
                  name="file"
                />
                {imageSrc === "" ? 
                "Select Image"
                :
                "Update Image"
                }
                </label>

            <div className="mt-3 sm:flex w-full">
              <form
                onSubmit={handleSubmit(sendImageMessage)}
                className="mt-2 text-center sm:text-left w-full">
                {imageSrc &&
                <img
              className="block object-cover w-full h-[200px] md:h-[300px]"
            src={imageSrc}
          />
          }
                <div className="items-center w-full mt-3 flex">
                  <button
                    className="flex-1 rounded border border-[#667085] hover:bg-gray-200 !bg-gradient-to-r px-6 py-[10px] text-sm font-semibold text-[#667085] outline-none focus:outline-none"
                    onClick={()=>{setShowImagePreviewModal(false);setImageSrc("")}}
                  >
                    Cancel
                  </button>


                  {uploadedFile &&
                  <LoadingButton
                  loading={loading}
                  type="submit"
                  className={`ml-5 flex-1 block rounded !bg-gradient-to-r from-[#33D4B7]  to-[#0D9895] px-4 py-[10px] text-sm font-semibold text-white outline-none focus:outline-none w-[150px] ${loading ? "py-[5px]" : "py[12px]"}`}>
                    Send
                  </LoadingButton>
                  }
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default ImagePreviewModal;
