import ThreeDotsMenu from "@/components/frontend/ThreeDotsMenu";
import { ARCHIVE_STATUS } from "@/utils/constants";
import moment from "moment";
import React, { useEffect, useState } from "react";
import Skeleton from "react-loading-skeleton";
import MkdSDK from "@/utils/MkdSDK";
import { useSearchParams } from "react-router-dom";


const formatDate = (time) => {
  let currentTime = moment(new Date());
  let messageDate = moment(time);
  if (currentTime.diff(messageDate, "days") > 1) {
    return moment(messageDate).format("Do MMM");
  } else {
    return moment(messageDate).format("hh:mm A");
  }
};

export default function ChatTile({ markMessagesAsRead, first, virtual, last, room, rooms, activeRoomId, setActiveRoom, setActiveBooking, setActiveProperty, setMobileChatSection, messages, deleteRoom, archiveRoom, unArchiveRoom }) {
  const ctrl = new AbortController();
  let sdk = new MkdSDK();
  const [photo, setPhoto] = useState()
  const [roomUnreadCounter, setRoomUnreadCounter] = useState([])
  const [searchParams, setSearchParams] = useSearchParams();
  const params = searchParams.get("room_id")

  async function getOtherUser() {
    await sdk.setTable("user")
    const payload = { id: room?.other_user_id }
    const result = await sdk.callRestAPI(payload, "GET");
    setPhoto(result?.model?.is_photo_approved !== 1 ? null : result?.model?.photo)
    return "yes"
  }

  async function getMessages(room_id) {
    const result = await sdk.getChats(room_id);
    const unread = result.model.filter((msg) => msg.unread === 1 && msg.chat.user_id !== Number(localStorage.getItem("user"))).map((msg) => msg.id);
    markMessagesAsRead(room.id, unread);
    return result.model
  }
  async function getAllMessages(room_id) {
    const result = await sdk.getChats(room_id);
    const unread = result.model.filter((msg) => msg.unread === 1 && msg.chat.user_id !== Number(localStorage.getItem("user")));
    setRoomUnreadCounter(unread)
  }

  async function markMessagesAsRead(room_id, arr) {
    sdk.setTable("chat");
    await Promise.all(arr.map((id) => sdk.callRestAPI({ id, unread: 0 }, "PUT")));
    setRoomUnreadCounter((prev) => (arr.length > prev ? 0 : prev - arr.length));
  }

  async function getBookingDetails() {
    setActiveProperty({});
    setActiveBooking({});
    if (room?.booking_id !== null) {
      await sdk.setTable("booking")
      const payload = { id: room?.booking_id }
      const result = await sdk.callRestAPI(payload, "GET");
      setActiveBooking(result.model)
      setActiveProperty({});
    } else {
      const user_id = localStorage.getItem("user");
      const where = [`ergo_property_spaces.id = ${Number(room?.property_id)} AND ergo_property_spaces.deleted_at IS NULL`];
      const result = await sdk.callRawAPI("/v2/api/custom/ergo/popular/PAGINATE", { page: 1, limit: 1, user_id: Number(user_id), where, all: true }, "POST", ctrl.signal);
      if (Array.isArray(result.list) && result.list.length > 0) {
        setActiveProperty(result.list[0]);
        setActiveBooking({})
      } else setActiveProperty({})
    }
  }
  
  useEffect(() => {
    getOtherUser()

  }, [])

  useEffect(() => {
    if (room?.id === "temp") return;
    getAllMessages(room.id)
  }, [room]);



  return (
    <div
      className={`${room.id && activeRoomId == room.id ? "chat-active " : ""} lg:flex w-full justify-between items-center border-b p-3`}
      id={`chat-tile-btn-${room.id}`}
    >
      <div
      onClick={() => {
        setActiveRoom(room);
        setMobileChatSection(true);
        getMessages(room.id)
        getBookingDetails()
      }}
      className="flex gap-2 mr-2 cursor-pointer items-center justify-between">
        <img
          src={photo ?? "/default.png"}
          alt=""
          className="h-[48px] w-[48px] rounded-full border-2 border-[#D0D5DD] object-cover"
        />
        <div className="flex flex-col items-start w-fit">
          <h5 className="text-sm font-semibold capitalize">
            {first || <Skeleton width={100} />} {last}
          </h5>
          <p className="text-xs font-light">{" " || <Skeleton width={80} />}</p>
        </div>
      </div>
      <div className="flex gap- items-center justify-end relative">
      {room?.id !== "temp" && roomUnreadCounter.length > 0 && <span className="bg-my-gradient h-[20px] w-[20px] rounded-full text-center text-xs leading-[1.7] text-white flex items-center justify-center">{roomUnreadCounter.length}</span>}
        <span style={{ fontSize: "10px" }} className="font-light w-[50px] block text-center">{formatDate(room.update_at)}</span>
        <div className="block">
        <ThreeDotsMenu
          direction="vert"
          items={[
            {
              label: "Delete chat",
              icon: null,
              onClick: () => deleteRoom(room.id),
            },
            {
              label: "Archive chat",
              icon: <></>,
              onClick: () => archiveRoom(room.id),
              notShow: room.is_archive == ARCHIVE_STATUS.IS_ARCHIVE,
            },
            {
              label: "Unarchive chat",
              icon: <></>,
              onClick: () => unArchiveRoom(room.id),
              notShow: room.is_archive == ARCHIVE_STATUS.NOT_ARCHIVE,
            },
          ]}
        />
        </div>
      </div>
    </div>
  );
}
