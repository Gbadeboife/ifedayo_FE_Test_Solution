import { IMAGE_STATUS } from "@/utils/constants";
import moment from "moment";
import React from "react";
import StarIcon from "./icons/StarIcon";

const ReviewCard = ({ data }) => {
  const role = localStorage.getItem("role") ?? "customer";
  return (
    <div className="flex md:gap-[24px] gap-[16px] text-[#667085] mb-[32px]">
      <img
        src={data.customer_photo_approved == IMAGE_STATUS.APPROVED ? data.photo ?? "/default.png" : "/default.png"}
        className="md:w-[40px] md:h-[40px] w-[30px] h-[30px] object-cover rounded-full"
      />
      <div className="flex-grow">
        <div className="flex justify-start items-center mb-[8px]">
          <p>Posted by -&nbsp;</p>
          <p className="flex gap-2 items-center">
            <span className="text-black font-semibold">{data?.customer_last_name}{" "}{data?.customer_first_name}</span>
          </p>
        </div>
        <div className="flex justify-between items-center mb-[8px]">
          <p>{moment(data.post_date).format("MM/DD/YY")}</p>
          <p className="flex gap-2 items-center">
            <StarIcon />
            <span className="text-black font-semibold">{(Number(data.space_rating) || 0).toFixed(1)}</span>
          </p>
        </div>
        <p className="mb-[16px] md:text-base text-sm">{data.comment}</p>
        <div className="flex gap-[8px] flex-wrap">
          {data.hashtags != null &&
            data.hashtags.split(",").map((tag, i) => (
              <span
                key={i}
                className="text-[14px] bg-[#F2F4F7] rounded-[3px] pt-[2px] px-[8px] pb-[3px] whitespace-nowrap"
              >
                {tag}
              </span>
            ))}
        </div>
      </div>
    </div>
  );
};

export default ReviewCard;
