import React, { useContext } from "react";
import { useState } from "react";
import { Link } from "react-router-dom";
import NotVerifiedIcon from "@/components/frontend/icons/NotVerifiedIcon";
import PencilIcon from "@/components/frontend/icons/PencilIcon";
import { GlobalContext } from "@/globalContext";
import MkdSDK from "@/utils/MkdSDK";
import { callCustomAPI } from "@/utils/callCustomAPI";
import Skeleton from "react-loading-skeleton";
import { formatDate } from "@/utils/date-time-utils";
import { IMAGE_STATUS, NOTIFICATION_STATUS, NOTIFICATION_TYPE } from "@/utils/constants";
import SwitchBulkMode from "@/components/SwitchBulkMode";
import TwoFaDialog from "@/components/Profile/TwoFaDialog";
import EditProfileModal from "@/components/Profile/EditProfileModal";
import EditLocationModal from "@/components/Profile/EditLocationModal";
import EditPasswordModal from "@/components/Profile/EditPasswordModal";
import EditAboutModal from "@/components/Profile/EditAboutModal";
import { parseJsonSafely } from "@/utils/utils";
import EnableEmailDialog from "@/components/Profile/EnableEmailDialog";
import DeleteAccountModal from "@/components/Profile/DeleteAccountModal";

function getProfilePhotoMessage(image_status) {
  switch (image_status) {
    case IMAGE_STATUS.IN_REVIEW:
      return "We are currently reviewing your profile picture";
    case IMAGE_STATUS.APPROVED:
      return "This will be displayed on your profile";
    case IMAGE_STATUS.NOT_APPROVED:
      return "The image you uploaded was rejected after reviewing, please change it";
    default:
      return "Please upload a profile picture";
  }
}

export default function HostProfilePage() {
  const { dispatch: globalDispatch, state: globalState } = useContext(GlobalContext);
  const [loading, setLoading] = useState(false);
  const [twoFa, setTwoFa] = useState(false);
  const [twoFaDialog, setTwoFaDialog] = useState(false);
  const [enableEmailDialog, setEnableEmailDialog] = useState(false);

  const [updatePassword, setUpdatePassword] = useState(false);

  const [updateName, setUpdateName] = useState(false);

  const [updateAbout, setUpdateAbout] = useState(false);

  const [updateLocation, setUpdateLocation] = useState(false);

  const [deleteAccountModal, setDeleteAccountModal] = useState(false);

  let sdk = new MkdSDK();

  const changeProfilePic = async (e) => {
    globalDispatch({ type: "START_LOADING" });
    const file = e.target.files;
    const formData = new FormData();
    for (let i = 0; i < file.length; i++) {
      formData.append("file", file[i]);
    }
    try {
      const upload = await sdk.uploadImage(formData);
      console.log("upload", upload);
      sdk.setTable("user");
      const result = await callCustomAPI(
        "edit-self",
        "post",
        {
          user: {
            photo: upload.url,
            is_photo_approved: IMAGE_STATUS.IN_REVIEW,
          },
        },
        "",
      );
      globalDispatch({ type: "SET_USER_DATA", payload: { ...globalState.user, photo: upload.url, is_photo_approved: IMAGE_STATUS.IN_REVIEW } });
      // create notification
      sdk.setTable("notification");
      await sdk.callRestAPI(
        {
          user_id: globalState.user.id,
          actor_id: null,
          action_id: globalState.user.id,
          notification_time: new Date().toISOString().split(".")[0],
          message: "Profile Picture Edited",
          type: NOTIFICATION_TYPE.EDIT_USER_PICTURE,
          status: NOTIFICATION_STATUS.NOT_ADDRESSED,
        },
        "POST",
      );
    } catch (err) {
      globalDispatch({
        type: "SHOW_ERROR",
        payload: {
          heading: "Operation failed",
          message: err.message,
        },
      });
    }
    globalDispatch({ type: "STOP_LOADING" });
  };

  const removeProfilePic = async (e) => {
    try {
      sdk.setTable("user");
      await callCustomAPI(
        "edit-self",
        "post",
        {
          user: {
            photo: null,
            is_photo_approved: null,
          },
        },
        "",
      );
      globalDispatch({ type: "SET_USER_DATA", payload: { ...globalState.user, photo: null, is_photo_approved: null } });
    } catch (err) {
      globalDispatch({
        type: "SHOW_ERROR",
        payload: {
          heading: "Operation failed",
          message: err.message,
        },
      });
    }
  };

  async function changeTwoFa() {
    setLoading(true);
    try {
      await callCustomAPI(
        "edit-self",
        "post",
        {
          user: {
            two_factor_authentication: twoFa != 1 ? 1 : 0,
          },
        },
        "",
      );
      setTwoFaDialog(false);
      globalDispatch({
        type: "SHOW_CONFIRMATION",
        payload: {
          heading: "Success",
          message: `Two factor Authentication ${twoFa == 1 ? "disabled" : "enabled"}`,
          btn: "Ok got it",
        },
      });
      setTwoFa((prev) => (prev == 1 ? 0 : 1));
    } catch (err) {
      setTwoFaDialog(false);
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

  return (
    <div className="pt-[44px] pb-16 normal-case text-[#475467]">
      <div className="flex flex-wrap-reverse justify-between ">
        <div className="flex max-w-3xl flex-grow flex-col justify-between md:flex-row md:items-center">
          <div className="mb-[16px] flex flex-col">
            <h3 className="text-xl font-semibold">Your photo</h3>
            <small className="text-xs md:text-sm">{getProfilePhotoMessage(globalState.user.is_photo_approved)}</small>
          </div>
          <div
            data-tour="photo-step"
            className="flex items-center justify-between">
            <img
              src={globalState.user.photo ?? "/default.png"}
              alt=""
              className="h-[56px] w-[56px] rounded-full object-cover md:mr-[65px] md:h-[64px] md:w-[64px]"
            />
            <div>
              <label
                className="photo-step mr-3 cursor-pointer font-semibold underline"
                htmlFor="profilePic"
              >
                Update{" "}
                <input
                  type="file"
                  className="hidden"
                  id="profilePic"
                  onChange={changeProfilePic}
                />
              </label>
              <button
                className="underline"
                id="remove_profile_pic"
                onClick={removeProfilePic}
              >
                Remove
              </button>
            </div>
          </div>
        </div>
        <div className="mb-12 flex w-full justify-between md:mb-0 md:w-[unset] md:flex-col md:justify-start">
          <p className="mb-2 self-end">Profile status</p>
          <div data-tour="fourth-step" className="flex fourth-step">
            {![0, 1].includes(globalState.user.verificationStatus) && (
              <Link
                to="/account/verification"
                className="mr-3 font-semibold text-[#1570EF]"
              >
                Get verified
              </Link>
            )}

            <button
              className={
                `${globalState.user.verificationStatus == 1 ? "login-btn-gradient" : "bg-[#667085]"}` +
                " flex min-w-[103px] items-center gap-1 rounded-md p-1 px-2 text-xs uppercase tracking-wider text-white"
              }
            >
              {(() => {
                switch (globalState.user.verificationStatus) {
                  case 0:
                    return (
                      <>
                        <NotVerifiedIcon />
                        <span className="">Pending</span>
                      </>
                    );
                  case 1:
                    return (
                      <>
                        <NotVerifiedIcon />
                        <span className="">Verified</span>
                      </>
                    );
                  case 2:
                    return (
                      <>
                        <NotVerifiedIcon />
                        <span className="">Verification Declined</span>
                      </>
                    );
                  default:
                    return (
                      <>
                        <NotVerifiedIcon />
                        <span className="">Not verified</span>
                      </>
                    );
                }
              })()}
            </button>
          </div>
        </div>
      </div>
      
      <hr className="my-[37px]" />
      <div className="grid sm:flex flex-co items-start gap-4">
        <Link
          to={"/account/profile/rules-templates"}
          className="rounded-md border border-primary-dark px-4 py-2 text-sm text-black duration-200 hover:bg-primary-dark hover:text-white"
        >
          Manage Property Rules Template
        </Link>
        <Link
          to={"/account/profile/rules-templates/add"}
          className="rounded-md border border-primary-dark px-4 py-2 text-sm text-black duration-200 hover:bg-primary-dark hover:text-white"
        >
          Add Property Rules Template
        </Link>
      </div>
      <EditProfileModal
        closeModal={() => setUpdateName(false)}
        modalOpen={updateName}
      />
      <EditPasswordModal
        closeModal={() => setUpdatePassword(false)}
        modalOpen={updatePassword}
      />
      <EditAboutModal
        closeModal={() => setUpdateAbout(false)}
        modalOpen={updateAbout}
      />
      <EditLocationModal
        closeModal={() => setUpdateLocation(false)}
        modalOpen={updateLocation}
      />

      <TwoFaDialog
        isOpen={twoFaDialog}
        closeModal={() => setTwoFaDialog(false)}
        isEnabled={twoFa}
        onProceed={changeTwoFa}
        loading={loading}
      />
      <EnableEmailDialog
        isOpen={enableEmailDialog}
        closeModal={() => setEnableEmailDialog(false)}
      />
    </div>
  );
}
