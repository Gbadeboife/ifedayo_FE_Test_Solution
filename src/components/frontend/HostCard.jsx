
import { IMAGE_STATUS } from "@/utils/constants";
import React, { useEffect } from "react";
import Skeleton from "react-loading-skeleton";
import StarIcon from "./icons/StarIcon";
import { useState } from "react";
import MkdSDK from "@/utils/MkdSDK";

const HostCard = ({ data }) => {
  let sdk = new MkdSDK();

  const [user, setUser] = useState()

  const fetchUser = async () => {
    sdk.setTable("user")
    const users = await sdk.getAllUsers()
    console.log(users.list)
    let host_user = users?.list.find(user => user.id == data.id)
    setUser(host_user)
  }
  
  useEffect(() => {
    if (localStorage.getItem("token")) {
      fetchUser()
    }
  }, [])
  
  return (
    <div className="flex items-start w-[400px] md:text-base text-sm remove-select">
      <img
        src={data.is_photo_approved == IMAGE_STATUS.APPROVED ? data.photo ?? "/default.png" : "/default.png"}
        alt={data.first_name}
        className="rounded-full cursor-pointer md:w-[80px] md:h-[80px] w-[60px] h-[60px] object-cover"
      />
      <div className="px-[12px]">
        <h4 className="text-lg font-semibold md:text-2xl">
          {data.first_name || <Skeleton />} {data.last_name}
        </h4>
        <div className="flex items-center">
          <p className="text-gray-500 mb-[6px]">{data?.city && data?.city}</p>
          <p className="text-gray-500 mb-[6px]">{data?.country &&  ", " + data?.country}</p>
        </div>
        <div className="flex items-end justify-between lowercase">
          <p className="flex items-center gap-2">
            <StarIcon />
            <span>
              {(Number(data.avg_host_rating) || 0).toFixed(1)}
              {(typeof data?.rating_count === "number" && data?.rating_count > 0) &&
                <span>
                  {" "}({data.rating_count})
                </span>
              }
            </span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default HostCard;
