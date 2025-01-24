import React from "react";
import { Link } from "react-router-dom";
import { DRAFT_STATUS } from "@/utils/constants";

const DraftProgress = ({ data, scheduleTemplate }) => {
  return (
    <div className="flex relative mx-auto md:max-w-lg max-w-[300px] items-center justify-between mb-40 normal-case">
      <div className="absolute left-0 absolute-middle bg-gray-300 right-0 flex">
        <div className={`${data.draft_status >= DRAFT_STATUS.IMAGES ? "login-btn-gradient" : ""} h-full flex-grow`}></div>
        <div className={`${data.draft_status > DRAFT_STATUS.SCHEDULING ? "login-btn-gradient" : ""} h-full flex-grow`}></div>
      </div>
      <div className="relative z-10">
        <Link
          to={`/account/my-spaces/${data.id}/edit-${data.draft_status >= DRAFT_STATUS.PROPERTY_SPACE ? "property-space?mode=edit" : "property-space?mode=create"}`}
          className={`draft-stage ${data.draft_status >= DRAFT_STATUS.PROPERTY_SPACE ? "complete" : ""}`}
          state={data}
        >
          1
        </Link>
        <p className="absolute -left-6">About location</p>
      </div>
      <div className="relative z-10">
        <Link
          to={`/account/my-spaces/${data.id}/edit-${data.draft_status >= DRAFT_STATUS.IMAGES ? "images?mode=edit" : "images?mode=create"}`}
          className={`draft-stage ${data.draft_status >= DRAFT_STATUS.IMAGES ? "complete" : ""}`}
          state={data}
        >
          2
        </Link>
        <p className="absolute md:w-[unset] -left-4 !w-[60px]">Images, Addons, FAQs etc</p>
      </div>
      <div className="relative z-10">
        <Link
          to={`/account/my-spaces/${data.id}/edit-${scheduleTemplate.id ? "scheduling?mode=edit" : "scheduling?mode=create"}`}
          className={`draft-stage ${data.draft_status > DRAFT_STATUS.SCHEDULING ? "complete" : ""}`}
          state={scheduleTemplate}
        >
          3
        </Link>
        <p className="absolute -left-8 md:!w-[unset] !w-[50px]">Templates & Scheduling</p>
      </div>
    </div>
  );
};

export default DraftProgress;
