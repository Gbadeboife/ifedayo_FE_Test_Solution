import React, { useContext, useState, useEffect } from "react";
import MkdSDK from "@/utils/MkdSDK";
import { AuthContext, tokenExpireError } from "@/authContext";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import SmileIcon from "@/components/frontend/icons/SmileIcon";
import PictureIcon from "@/components/frontend/icons/PictureIcon";
import EmojiPicker from "emoji-picker-react";
import badWords from "./badWords.json";
import * as linkify from "linkifyjs";
import { formatAMPM, monthsMapping } from "@/utils/date-time-utils";
import CircleCheckIcon from "@/components/frontend/icons/CircleCheckIcon";
import { GlobalContext, showToast } from "@/globalContext";
import FavoriteButton from "@/components/frontend/FavoriteButton";
import ChatTile from "./ChatTile";
import MessagesContainer from "./MessagesContainer";
import { ARCHIVE_STATUS, BOOKING_STATUS } from "@/utils/constants";
import { parseJsonSafely } from "@/utils/utils";
import { ArrowLeftIcon, PaperAirplaneIcon } from "@heroicons/react/24/outline";
import TreeSDK from "@/utils/TreeSDK";
import StarIcon from "@/components/frontend/icons/StarIcon";
import PersonIcon from "@/components/frontend/icons/PersonIcon";
import PropertySpaceMapImage from "@/components/frontend/PropertySpaceMapImage";
import ImagePreviewModal from "./ImagePreviewModal";


let sdk = new MkdSDK();
let treeSdk = new TreeSDK();
const ctrl = new AbortController();

const MessagesPage = () => {
  const { state, dispatch } = useContext(AuthContext);
  const [rooms, setRooms] = useState(Array(4).fill({}));
  const [roomUnread, setRoomUnread] = useState([]);
  const { state: globalState, dispatch: globalDispatch } = useContext(GlobalContext);
  const [message, setMessage] = useState("");

  const [searchParams, setSearchParams] = useSearchParams();
  const [activeRoom, setActiveRoom] = useState({});
  const [activeBooking, setActiveBooking] = useState({});
  const [activeProperty, setActiveProperty] = useState({});
  const [spaceId, setSpaceId] = useState();
  const [messageErr, setMessageErr] = useState("");
  const [showMap, setShowMap] = useState(false);
  const [virtual, setVirtual] = useState(false);

  const [showEmoji, setShowEmoji] = useState(false);
  const [unReadCount, setUnreadCount] = useState(globalState.unreadMessages);
  const [archivedCount, setArchivedAccount] = useState(0);
  const [mobileChatSection, setMobileChatSection] = useState(false);
  const [mobilePreviewOpen, setMobilePreviewOpen] = useState(false);

  const [favoriteId, setFavoriteId] = useState(null);
  const [render, forceRender] = useState(false);
  const [fetchingExtra, setFetchingExtra] = useState(true);
  const navigate = useNavigate();

  const [messages, setMessages] = useState({});
  const [sending, setSending] = useState(false);
  const [roomsFetched, setRoomsFetched] = useState(false);

  const [showImagePreviewModal, setShowImagePreviewModal] = useState(false)

  const formatAmenities = (propertyAmenities) => {
    var amenities = (propertyAmenities ?? "").split(",");
    amenities = Array.from(new Set(amenities));
    return amenities
  }

  const bookingExpired = activeBooking.booking_start_time && activeBooking.status < BOOKING_STATUS.ONGOING ? new Date(activeBooking.booking_end_time) < Date.now() : false;

  async function getRooms() {
    try {
      // const result2 = await treeSdk.getList("room", { join: ["user|other_user_id", "booking"], filter: [`user_id,eq,${state.user}`] });
      const result = await sdk.getMyRoom();
      if (Array.isArray(result.messages)) {
        setUnreadCount(
          result.messages.filter((msg) => {
            const messageSenderId = JSON.parse(msg.chat).user_id;
            return Number(messageSenderId) != Number(state.user);
          }).length,
        );
        globalDispatch({
          type: "SET_UNREAD_MESSAGES_COUNT",
          payload: result.messages.filter((msg) => {
            const messageSenderId = JSON.parse(msg.chat).user_id;
            return Number(messageSenderId) != Number(state.user);
          }).length,
        });
      }
      setRooms(result?.list);
      setRoomUnread(result?.messages)

      setRoomsFetched(true);
      globalDispatch({ type: "STOP_LOADING" });

    } catch (err) {
      tokenExpireError(dispatch, err.message);
      globalDispatch({
        type: "SHOW_ERROR",
        payload: {
          heading: "Operation failed getting rooms",
          message: err.message,
        },
      });
    }
  }

  async function getArchivedRooms() {
    try {
      const result = await treeSdk.getList("room", { join: ["user|other_user_id", "booking"], filter: [`user_id,eq,${state.user}`] });
      setArchivedAccount((result?.list.filter((item) => item.is_archive == 1)).length)
      setRooms(result.list.filter((item) => item.is_archive == 1));

      console.log((result?.list.filter((item) => item.is_archive == 1)).length)
      globalDispatch({ type: "STOP_LOADING" });

    } catch (err) {
      tokenExpireError(dispatch, err.message);
      globalDispatch({
        type: "SHOW_ERROR",
        payload: {
          heading: "Operation failed getting rooms",
          message: err.message,
        },
      });
    }
  }


  async function getMessages(room_id) {
    try {
      const result = await sdk.getChats(room_id);
      if (Array.isArray(result.model)) {
        setMessages((prev) => {
          const copy = { ...prev };
          copy[room_id] = result.model.sort(sortByUpdateAt);
          return copy;
        });
      }
      return result.model
    } catch (err) {
      tokenExpireError(dispatch, err.message);
      globalDispatch({
        type: "SHOW_ERROR",
        payload: {
          heading: "Operation failed getting messages " + room_id,
          message: err.message,
        },
      });
    }
  }

  async function sendMessage() {
    if (message == "") return;

    setShowEmoji(false);
    
    //Add checks to validate message based on active booking
    
    setSending(true);

    try {
      let date = new Date().toISOString().split("T")[0];
      let date2 = new Date().toISOString().replace("T", " ").split(".")[0];
      // if its temporary chat then create new room before message
      let result = null;

      let is_temp_chat = activeRoom.is_temp_chat;

      let room_id = searchParams.get("room_id");

      if (is_temp_chat && room_id === "temp") {
        sdk.setTable("room");
        result = await sdk.callRestAPI(
          {
            user_id: state.user,
            other_user_id: Number(activeRoom.other_user_id),
            booking_id: activeRoom.booking_id === null ? null : Number(activeRoom.booking_id),
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
        message,
        date,
        other_user_id: activeRoom.other_user_id,
      });
      let newMessageObj = {
        room_id: activeRoom.id,
        chat: {
          message: message,
          user_id: state.user,
          // other_user_id: activeRoom.other_user_id,
          is_image: false,
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
      getRooms()

      // send email alert
      sendEmailAlert(activeRoom.other_user_id, activeBooking.property_name, message, activeRoom.id);
      setMessage("");

      // TODO: scroll to bottom
    } catch (err) {
      console.log(err)
      globalDispatch({
        type: "SHOW_ERROR",
        payload: {
          heading: "Sending message failed",
          message: err.message,
        },
      });
    }
    setSending(false);
  }

  async function sendEmailAlert(to, property_name, message, room_id) {
    try {
      // get receiver preferences
      const result = await sdk.callRawAPI("/v2/api/custom/ergo/get-user", { id: to }, "POST");

      if (parseJsonSafely(result.settings, {}).email_on_new_chat_message == true) {
        let sender_name = globalState.user.first_name + " " + globalState.user.last_name;
        // get email template
        const tmpl = await sdk.getEmailTemplate("chat-message-alert");
        const body = tmpl.html
          ?.replace(new RegExp("{{{sender_name}}}", "g"), sender_name)
          .replace(new RegExp("{{{property_name}}}", "g"), property_name)
          .replace(new RegExp("{{{message}}}", "g"), message)
          .replace(new RegExp("{{{room_id}}}", "g"), room_id);

        // send email
        await sdk.sendEmail(result.email, tmpl.subject, body);
      }
    } catch (err) {
      console.log("ERROR", err);
    }
  }

  async function fetchFavoriteStatus(property_spaces_id, user_id) {
    const payload = { property_spaces_id, user_id };
    sdk.setTable("user_property_spaces");
    try {
      const result = await sdk.callRestAPI({ payload }, "GETALL");

      if (Array.isArray(result.list) && result.list.length > 0) {
        setFavoriteId(result.list[0].id);
      } else {
        throw new Error("");
      }
    } catch (err) {
      setFavoriteId(null);
    }
    globalDispatch({ type: "STOP_LOADING" });
  }

  async function deleteRoom(id) {
    sdk.setTable("room");
    try {
      const result = await sdk.callRestAPI({ id }, "DELETE");
      if (!result.error) {
        getRooms()
        setActiveRoom({})
        setActiveBooking({})
        setActiveProperty({})
        showToast(globalDispatch, result.message, 5000)
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
  }

  async function archiveRoom(id) {
    sdk.setTable("room");
    // call API - callRestAPI (You can see callRestAPI implementation in other functions) here to archive room chat. Method is PUT
    // update archived state of selected room chat without refreshing the page and toast a success message
    //Also switch to the archive tab on success of the API, with the archived room chat showing under there
  }

  async function unArchiveRoom(id) {
    sdk.setTable("room");
    // call API - callRestAPI (You can see callRestAPI implementation in other functions) here to unarchive room chat. Method is PUT
    // update unarchived state of selected room chat without refreshing the page and toast a success message
    //Also switch to the inbox tab on success of the API, with the unarchived room chat showing under there
  }

  async function fetchExtraBookingDetails() {
    if (activeBooking?.extrasFetched) return;
    setFetchingExtra(true);
    try {
      const result = await sdk.callRawAPI(`/v2/api/custom/ergo/booking/details`, { where: [`ergo_booking.id = ${activeRoom.booking_id} AND (ergo_booking.deleted_at IS NULL AND ergo_booking.status = ${BOOKING_STATUS.ONGOING} OR ergo_booking.status = ${BOOKING_STATUS.UPCOMING})`] }, "POST");
      if (result.list.id && new Date(new Date(result.list.booking_end_time).setDate(new Date(result.list.booking_end_time).getDate() + 1)) > new Date()) {
        const fullBooking = {
          ...result.list,
          ...activeBooking,
          add_ons: result.list.add_ons,
          property_name: result.list.property_name,
          image: result.list.image_url,
          address_line_1: result.list.address_line_1,
          address_line_2: result.list.address_line_2,
          extrasFetched: true,
        };
        setRooms((prev) => {
          const copy = [...prev];
          const pos = copy.findIndex((r) => r.id == activeRoom.id);
          if (pos != -1) {
            copy[pos].booking = fullBooking;
          }
          return copy;
        });
        setActiveRoom((prev) => {
          const copy = { ...prev };
          copy.booking = fullBooking;
          return copy;
        });
      }

      setTimeout(() => {
        setFetchingExtra(false);
      }, 500);
    } catch (err) {
      tokenExpireError(dispatch, err.message);
      globalDispatch({ type: "SHOW_ERROR", payload: { heading: "Error fetching booking details", message: err.message } });
    }
  }

  async function markMessagesAsRead(room_id, arr) {
    try {
      sdk.setTable("chat");
      await Promise.all(arr.map((id) => sdk.callRestAPI({ id, unread: 0 }, "PUT")));
      setMessages((prev) => {
        const copy = { ...prev };
        copy[room_id] = (copy[room_id] ?? []).map((msg) => ({ ...msg, unread: 0 }));
        return copy;
      });
      setUnreadCount((prev) => {
        const newCount = arr.length > prev ? 0 : prev - arr.length;
        globalDispatch({
          type: "SET_UNREAD_MESSAGES_COUNT",
          payload: newCount,
        });
        return newCount;
      });
    } catch (err) {
      tokenExpireError(dispatch, err.message);
      globalDispatch({
        type: "SHOW_ERROR",
        payload: {
          heading: "Error marking messages as read",
          message: err.message,
        },
      });
    }
  }

  async function getPropertyDetails(id) {
    const user_id = localStorage.getItem("user");
    const where = [`ergo_property_spaces.id = ${id} AND ergo_property_spaces.deleted_at IS NULL`];
    try {
      const result = await sdk.callRawAPI("/v2/api/custom/ergo/popular/PAGINATE", { page: 1, limit: 1, user_id: Number(user_id), where, all: true }, "POST", ctrl.signal);
      if (Array.isArray(result.list) && result.list.length > 0) {
        setActiveProperty(result.list[0]);
        fetchFavoriteStatus(Number(result.list[0].id), Number(user_id))
      } else setActiveProperty({})
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
    globalDispatch({ type: "STOP_LOADING" });
  }

  async function createVirtualRoom(other_user_id, booking_id, new_booking_id) {
    setSpaceId(Number(new_booking_id))
    try {
      const result = await treeSdk.getOne("user", other_user_id, { join: [] });
      const room = {
        id: "temp",
        is_temp_chat: true,
        user_id: state.user,
        other_user_id,
        booking_id,
        is_archive: 0,
        property_id: new_booking_id,
        create_at: new Date(),
        update_at: new Date(),
        user_update_at: new Date(),
        other_user_update_at: new Date(),
        deleted_at: null,
        user: {
          id: other_user_id,
          first_name: result.model.deleted_at == null ? result.model.first_name : "[Deleted User]",
          last_name: result.model.deleted_at == null ? result.model.last_name : "",
          photo: result.model.deleted_at == null ? result.model.photo : null,
        },
        booking: {
          id: booking_id === null ? null : booking_id,
        },
      };

      setRooms((prev) => [...prev, room]);
      setVirtual(true)
      setActiveRoom(room);
    } catch (err) {
      tokenExpireError(dispatch, err.message);
      globalDispatch({ type: "SHOW_ERROR", payload: { heading: "Failed to fetch other user data", message: err.message } });
    }
  }

  async function getBookingDetails() {
      setFetchingExtra(true);
    const room_id = searchParams.get("room_id");
    const booking_id = searchParams.get("booking");
    setActiveProperty({});
    setActiveBooking({});
    if (room_id === "temp" || room_id === null) return;
    sdk.setTable("room")
    const data = await sdk.callRestAPI({ id: Number(room_id) }, "GET")

    await sdk.setTable("booking")
    const bookings = await sdk.callRestAPI({}, "GETALL");
    const fetched_booking = bookings.list.reverse().find((item) => 
      (item.host_id === data.model?.user_id || item.host_id === data.model?.other_user_id) && 
      (item.customer_id === data.model?.user_id || item.customer_id === data.model?.other_user_id) &&
      (item.property_space_id === data?.model?.property_id) &&
      (item.status === BOOKING_STATUS.UPCOMING || item.status === BOOKING_STATUS.ONGOING)
    )
    if (data.model?.booking_id !== null || booking_id !== null || (fetched_booking !== undefined && fetched_booking !== null) ) {
      if (fetched_booking) {
        setActiveBooking(fetched_booking)
        return;
        }
      await sdk.setTable("booking")
      const payload = { id: data.model?.booking_id ?? (booking_id ?? fetched_booking?.id) }
      const result = await sdk.callRestAPI(payload, "GET");
      setActiveBooking((result?.model?.status === BOOKING_STATUS.ONGOING || result?.model?.status === BOOKING_STATUS.UPCOMING) ? result.model : {})
    } else {
      const user_id = localStorage.getItem("user");
      const where = [`ergo_property_spaces.id = ${Number(data.model?.property_id)} AND ergo_property_spaces.deleted_at IS NULL`];
      const result = await sdk.callRawAPI("/v2/api/custom/ergo/popular/PAGINATE", { page: 1, limit: 1, user_id: Number(user_id), where, all: true }, "POST", ctrl.signal);
      if (Array.isArray(result.list) && result.list.length > 0) {
        setActiveProperty(result.list[0]);
        setActiveBooking({})
      } else setActiveProperty({})
    }
    setTimeout(() => {
      setFetchingExtra(false);
    }, 500);
  }

  useEffect(() => {
    getBookingDetails()
  }, [searchParams.get("room_id")]);
  
  useEffect(() => {
    getRooms();
  }, []);

  useEffect(() => {
    if (!roomsFetched) return;
    const room_id = searchParams.get("room_id");
    const property_space_id = searchParams.get("space");
    setActiveProperty({});
    setActiveBooking({});
    let room = rooms.find((rm) => rm.id == room_id);
    if (room) {
      setActiveRoom(room);
      return;
    }
    const other_user_id = searchParams.get("other_user_id");
    if (!other_user_id) return;
    const booking_id = searchParams.get("booking");
    room = rooms.find((rm) => ((rm.booking_id === booking_id && rm.other_user_id === other_user_id) || rm.property_id === Number(property_space_id)));
    if (room) {
      setActiveRoom(room);
    } else {
      getPropertyDetails(property_space_id)
      createVirtualRoom(other_user_id, booking_id, property_space_id)

    }
  }, [roomsFetched]);

  useEffect(() => {

    const controller = new AbortController();
    const pollMessages = async () => {
      const abortController = new AbortController();
      try {
        const poll = await sdk.startPolling(localStorage.getItem("user"), abortController.signal)
        if (poll.message) {
          // Do whatever you want here
          let room = searchParams.get("room_id");
          if (room === "temp") return;
          getRooms()
          if (Number(searchParams.get("room_id"))) {
            getMessages(Number(searchParams.get("room_id"))).then((res) => {
              const unread = res.filter((msg) => msg.unread === 1 && msg.chat.user_id !== state.user).map((msg) => msg.id);
              markMessagesAsRead(Number(searchParams.get("room_id")), unread);
            }
            );
          }
        }
      } catch (error) {
        console.log(error)
      }
      finally {
        if (!abortController.signal.aborted) {
          pollMessages()
        }
      }
    }

    return () => {
      clearInterval(5000);
      controller.abort();
    };
  }, []);

  function showImageModal(){
    setShowImagePreviewModal(true)
  }


  useEffect(() => {
    setFetchingExtra(true);
    globalDispatch({ type: "START_LOADING" });
    setActiveProperty({});
    setActiveBooking({});
    if (!activeRoom.id) return;
    searchParams.set("room_id", activeRoom.id);
    searchParams.set("booking", activeRoom.booking_id);
    if (!searchParams.get("booking")) {
      searchParams.delete("booking");
    }
    searchParams.delete("space");
    searchParams.delete("other_user_id");
    setSearchParams(searchParams);
    setMessage("");
    getMessages(activeRoom.id).then((res) => {
      const unread = res.filter((msg) => msg.unread === 1 && msg.chat.user_id !== state.user).map((msg) => msg.id);
      markMessagesAsRead(activeRoom.id, unread);
    });
    if (activeRoom.booking_id !== null) {
      fetchExtraBookingDetails();
    }
    if (activeRoom.id) {
      getPropertyDetails(activeRoom.property_id)
    }
    setTimeout(() => {
      setFetchingExtra(false);
    }, 500);
    globalDispatch({ type: "STOP_LOADING" });

  }, [activeRoom.id, render]);

  function sortByUpdateAt(a, b) {
    return new Date(a.update_at) - new Date(b.update_at);
  }

  return (
    <>
      <div
        className="relative -mx-4 flex h-[var(--messages-page-height)] border border-t-0 normal-case md:mx-0"
        onClick={() => setShowEmoji(false)}
      >
        <div className="w-full md:w-[26%]">
          <div className="flex h-full flex-col">
            <div className="flex border-b border-t nineteen-step">
              <button
                className={`${searchParams.get("message_tab") != "archive" ? "border-b-2 border-black font-semibold text-black" : ""} flex-grow px-[] py-[12px] text-[]`}
                onClick={() => {
                  searchParams.set("message_tab", "inbox");
                  setSearchParams(searchParams);
                }}
              >
                Inbox ({unReadCount})
              </button>
              <button
                className={`${searchParams.get("message_tab") == "archive" ? "border-b-2 border-black font-semibold text-black" : ""} flex-grow px-[] py-[12px] text-[]`}
                onClick={() => {
                  searchParams.set("message_tab", "archive");
                  setSearchParams(searchParams);
                }}
              >
                Archive
              </button>
            </div>
            {roomsFetched &&
              <div className="tiny-scroll bg-white md:bg-[#f9fafb] flex-grow overflow-y-auto">
                {searchParams.get("message_tab") != "archive" &&
                  rooms &&
                  rooms
                    .filter((rm) => rm.is_archive == ARCHIVE_STATUS.NOT_ARCHIVE)
                    .sort((a, b) => new Date(b.update_at) - new Date(a.update_at))
                    .map((room, idx) => {
                      return (
                        <ChatTile
                          key={idx}
                          room={room}
                          rooms={rooms}
                          virtual={virtual}
                          roomUnread={roomUnread}
                          activeRoomId={activeRoom.id}
                          setActiveRoom={setActiveRoom}
                          setActiveBooking={setActiveBooking}
                          setActiveProperty={setActiveProperty}
                          activeBooking={activeBooking}
                          first={room.first_name ? room.first_name : room.user.first_name}
                          last={room.last_name ? room.last_name : room.user.last_name}
                          setMobileChatSection={setMobileChatSection}
                          markMessagesAsRead={() => markMessagesAsRead}
                          messages={messages}
                          deleteRoom={deleteRoom}
                          archiveRoom={archiveRoom}
                          unArchiveRoom={unArchiveRoom}
                        />
                      );
                    })}
                {searchParams.get("message_tab") == "archive" &&
                  rooms &&
                  rooms
                    .filter((rm) => rm.is_archive == ARCHIVE_STATUS.IS_ARCHIVE)
                    .sort((a, b) => new Date(b.update_at) - new Date(a.update_at))
                    .map((room, idx) => {
                      return (
                        <ChatTile
                          key={idx}
                          room={room}
                          roomUnread={roomUnread}
                          activeRoomId={activeRoom.id}
                          setActiveRoom={setActiveRoom}
                          setActiveBooking={setActiveBooking}
                          setActiveProperty={setActiveProperty}
                          activeBooking={activeBooking}
                          first={room.first_name ? room.first_name : room.user.first_name}
                          last={room.last_name ? room.last_name : room.user.last_name}
                          setMobileChatSection={setMobileChatSection}
                          messages={messages}
                          deleteRoom={deleteRoom}
                          archiveRoom={archiveRoom}
                          unArchiveRoom={unArchiveRoom}
                        />
                      );
                    })}
              </div>
            }
          </div>
        </div>
        
        <div className={`${(mobilePreviewOpen && messages[activeRoom.id].length > 0 && !fetchingExtra) ? "block" : "hidden"} absolute top-0 right-0 -left-0 overflow-y-hidden bg-white md:static md:block md:max-h-[unset] md:w-[48%]`}>
          <div className="flex h-full flex-col border-t">
            {activeRoom?.id ? (
              <>
                <div className={`${mobileChatSection ? "md:hidden" : "hidden"} pl-2`}>
                  <button
                    type="button"
                    onClick={() => {
                      setMobileChatSection(false);
                      setMobilePreviewOpen(false);
                    }}
                    className="mr-2 mb-2 inline-flex items-center py-2.5 pr-5 text-center text-sm font-semibold"
                  >
                    <ArrowLeftIcon className="h-6 w-6" />
                    <span className="ml-2">Back</span>
                  </button>
                </div>
                <div className="flex justify-between border-b py-[13px] px-2 md:px-4">
                  <h3 className="md:text-lg text-base font-semibold">Chat with {activeRoom?.first_name === undefined ? rooms[0]?.user?.first_name : activeRoom?.first_name + " " + activeRoom?.last_name === undefined ? rooms[0]?.user?.last_name : activeRoom?.last_name}</h3>
                  {mobileChatSection && activeRoom.booking_id && (
                    <button
                      onClick={() => setMobilePreviewOpen(true)}
                      className="inline whitespace-nowrap bg-gradient-to-r from-primary to-primary-dark bg-clip-text text-xs font-bold text-transparent md:hidden"
                    >
                      Preview booking
                    </button>
                  )}
                </div>

              <div className="h-full w-full overflow-x-hidden relative hidden-scrollbar">
                <div className="h-[90%] z-10 pb-12 md:pb-0 overflow-auto">
                <MessagesContainer
                  messageErr={messageErr}
                  messages={messages[activeRoom.id] ?? []}
                />
                </div>

                <div className="fixed z- md:absolute bottom-0 w-full overflow-hidden flex h-fit bottom-0 justify-start items-center gap-4 border border-r-0 border-l-0 bg-white px-[20px] py-[12px]">
                    <div className="flex flex-gro items-center gap-2">
                      <label
                      onClick={()=>{([BOOKING_STATUS.PENDING, BOOKING_STATUS.COMPLETED, BOOKING_STATUS.DELETED, BOOKING_STATUS.DECLINED, BOOKING_STATUS.CANCELLED].includes(activeBooking.status) || !activeBooking.status) ? showToast(globalDispatch, "Without a booking, you can’t send images or emojis.", 4000, "ERROR") : showImageModal()}}
                      className={`cursor-pointer ${activeBooking?.status != BOOKING_STATUS.COMPLETED ? "strike-opacity-50 pointer-events-non opacity-50" : ""}`}
                      >
                        <PictureIcon />
                      </label>
                      
                      <button
                        onClick={(e) => {
                          ([BOOKING_STATUS.PENDING, BOOKING_STATUS.COMPLETED, BOOKING_STATUS.DELETED, BOOKING_STATUS.DECLINED, BOOKING_STATUS.CANCELLED].includes(activeBooking.status) || !activeBooking.status) ? showToast(globalDispatch, "Without a booking, you can’t send images or emojis.", 4000, "ERROR") :
                          e.stopPropagation();
                          setShowEmoji(!showEmoji);
                        }}
                        className="strike-opacity-50 relative disabled:opacity-50"
                      >
                        <SmileIcon />
                      </button>
                    </div>
                    
                    <form
                      className="relative w-full rounded-md border-[#E5E5EA]"
                      onSubmit={(e) => {
                        e.preventDefault();
                        sendMessage();
                      }}
                    >
                      <input
                        name="message"
                        className="border w-full bg-[#F9FAFB] py-1 pl-2 pr-16 text-sm outline-none"
                        rows="1"
                        placeholder="Type a message..."
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        autoComplete="off"
                      />
                      <button
                        type="submit"
                        className={message ? "absolute right-0 top-0 p-1 px-4 text-gray-900 duration-75 hover:text-primary" : "hidden"}
                      >
                        {sending ? (
                          <svg
                            className="inline h-4 w-4 animate-spin text-primary"
                            fill="none"
                            viewBox="0 0 24 24"
                          >
                            <circle
                              className="opacity-25"
                              cx="12"
                              cy="12"
                              r="10"
                              stroke="currentColor"
                              strokeWidth="4"
                            ></circle>
                            <path
                              className="opacity-75"
                              fill="currentColor"
                              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                            ></path>
                          </svg>
                        ) : (
                          <PaperAirplaneIcon className="h-5 w-5 -rotate-45" />
                        )}
                      </button>
                    </form>
                </div>
              </div>

              </>
            ) : (
              <div className="flex flex-grow items-center justify-center text-4xl text-gray-700 ">Select a chat to view</div>
            )}
          </div>
        </div>

        <div className={`${(mobilePreviewOpen && messages[activeRoom.id].length > 0 && !fetchingExtra ) ? "block" : "hidden"} lg:block absolute top-0 right-0 -left-0 overflow-y-auto max-h-[var(--messages-page-height)] bg-white md:static md:block md:max-h-[unset] w-full md:w-[26%]`}>
          <div className="flex h-full max-h-[var(--messages-page-height)] flex-col border">
            <div className="flex justify-between py-[12px] px-4">

              {(activeRoom?.booking_id && activeRoom?.booking?.id) &&
                <h3 className="text-lg font-semibold">Booking Preview</h3> 
              }

              {(activeRoom?.booking_id && !activeRoom?.booking?.id) &&
                <h3 className="text-lg font-semibold">Property Preview</h3>
              }
              {mobilePreviewOpen && (
                <button
                  type="button"
                  onClick={() => setMobilePreviewOpen(false)}
                  className="inline rounded-full border p-1 px-3 text-2xl font-normal duration-100 hover:bg-gray-200 active:bg-gray-300 md:hidden"
                >
                  &#x2715;
                </button>
              )}
            </div>
            <div className="tiny-scroll flex-grow overflow-y-auto">
              <div className="min-h-[500px] px-[20px] py-4">
                {activeRoom.id && !activeRoom?.booking?.id ? (
                  <div className="">
                    <div
                      className="mb-[8px] rounded-lg bg-cover bg-center bg-no-repeat px-[8px] pb-[13px] relative"
                      style={{ backgroundImage: `url(${(activeProperty?.url) ?? "/default-property.jpg"})`, height: 150 }}
                    >
                      <FavoriteButton
                        space_id={activeProperty?.id}
                        user_property_spaces_id={favoriteId || activeProperty?.favourite}
                        withLoader={true}
                        reRender={forceRender}
                        className="flex flex-grow justify-end w-fit float-right pt-2"
                      />
                      <span className="absolute mt-3 px-2 py-1 text-white bg-black font-bold rounded-lg text-xs self-start">{activeProperty?.category || "N/A"}</span>
                    </div>
                    <div className="py-6 block justify-between lg:items-start items-end lg:pl-0 w-full">
                      <div className="">
                        <h2 className="text-[18px] font-semibold mb-[6px] whitespace-normal md:whitespace-nowrap">{activeProperty?.name}</h2>
                        <p className="text-[#475467] tracking-wider md:truncate mb-1">{activeProperty?.city}</p>
                        <p className="text-[#475467] tracking-wider md:truncate">{activeProperty?.country} </p>
                        <div className="lg:mt-[21px] mt-[6px] flex justify-between">
                          <p className="mr-[31px]">
                            from: <span className="font-bold">${activeProperty?.rate}</span>/<span className="">hour</span>
                          </p>
                          <div className="flex items-center gap-2">
                            <PersonIcon />
                            <span>{activeProperty?.max_capacity}</span>
                          </div>
                        </div>
                      </div>
                      <div className="grid items-start">
                        <div className="flex items-center justify-between lg:mb-[9px] mt-3">
                          <p className="flex gap-2 items-center ">
                            <StarIcon />
                            <strong className="font-semibold">
                              {(Number(activeProperty?.average_space_rating) || 0).toFixed(1)}
                              <span className="font-normal">({activeProperty?.space_rating_count})</span>
                            </strong>
                          </p>
                          <button
                            className="text-sm underline whitespace-nowrap"
                            target="_blank"
                            onClick={(e) => {
                              e.stopPropagation();
                              e.preventDefault();
                              setShowMap(true);
                            }}
                          >
                            (view on map)
                          </button>
                        </div>
                        <div className="mt-6 lg:mt-[50px] flex flex-wrap gap-[12px] whitespace-nowrap">
                          {formatAmenities(activeProperty?.amenities).slice(0, 3).map((am, idx) => (
                            <span
                              className="text-[14px] bg-[#F2F4F7] rounded-[3px] pt-[2px] px-[8px] pb-[3px] text-[#667085]"
                              key={idx}
                            >
                              {am}
                            </span>
                          ))}
                          {formatAmenities(activeProperty?.amenities).length > 3 ? <span className="text-[14px] bg-[#F2F4F7] rounded-[3px] pt-[2px] px-[8px] pb-[3px] text-[#667085]">+{formatAmenities(activeProperty?.amenities).length - 3} more</span> : null}
                        </div>
                      </div>
                    </div>
                    <hr className="my-4" />
                  </div>
                ) : null}

                {(activeRoom?.booking_id && activeRoom?.booking?.id) ? (
                  <>
                    <div
                      className="mb-[8px] rounded-lg bg-cover bg-center bg-no-repeat px-[8px] pb-[13px]"
                      style={{ backgroundImage: `url(${(activeRoom.booking?.image_url) ?? "/default-property.jpg"})`, height: 150 }}
                    >
                      <span className="px-2 py-1 mt-3 inline-flex text-white bg-black font-bold rounded-lg text-xs self-start">{activeRoom?.booking?.space_category ? activeRoom?.booking?.space_category : "N/A"}</span>
                    </div>
                    <div className="">
                      <div className="mb-6 flex justify-between">
                        <p>Date</p>
                        <p className="font-semibold">
                          {" "}
                          {monthsMapping[new Date(activeRoom?.booking?.booking_start_time).getMonth()] +
                            " " +
                            new Date(activeRoom?.booking?.booking_start_time).getDate() +
                            "/" +
                            new Date(activeRoom?.booking?.booking_start_time).getFullYear()}
                        </p>
                      </div>
                      <div className="mb-6 flex justify-between">
                        <p>Time</p>
                        <p className="font-semibold">
                          {formatAMPM(activeRoom.booking?.booking_start_time)} - {formatAMPM(activeRoom?.booking?.booking_end_time)}
                        </p>
                      </div>
                      <div className="flex justify-between">
                        <p>Duration</p>
                        <p className="font-semibold">{activeRoom?.booking?.duration / 3600} hours</p>
                      </div>
                    </div>
                    <hr className="my-4" />
                    <h4 className="mb-6 text-xl font-semibold">Add-ons:</h4>
                    <div className="">
                      {activeRoom?.booking?.add_ons?.map((addon, idx) => (
                        <div
                          className="mb-4 flex gap-[14px]"
                          key={idx}
                        >
                          <CircleCheckIcon />
                          <p>{addon.name}</p>
                        </div>
                      ))}
                    </div>
                    <hr className="my-4" />
                  </>
                ) : null}
                <div className="text-center">
                  {(activeRoom?.booking_id && activeRoom?.booking?.id) &&
                    <Link
                      to={"/account/my-bookings/" + activeRoom.booking?.id}
                      className="my-text-gradient text-xs font-semibold uppercase tracking-wider"
                    >
                      View booking
                    </Link>}

                  {activeRoom.id && !activeRoom?.booking?.id &&
                    <Link
                      to={"/property/" + activeProperty?.id}
                      className="my-text-gradient text-xs font-semibold uppercase tracking-wider"
                    >
                      View property
                    </Link>
                  }
                </div>
              </div>
            </div>
          </div>
        </div>

        {showEmoji && (
                          <div className="absolute w-full h-full left-0 right-0">
                          <div style={{"left":"50px !important"}} className="emoji-picker flex w-full h-full items-center justify-center">
                            <EmojiPicker
                            className="absolute -top-10 md:top-10 z-[1000] bottom-0 left-0 right-0"
                              onEmojiClick={(em) => {
                                setMessage((prev) => prev + em.emoji);
                                setShowEmoji(false);
                              }}
                              searchDisabled
                            />
                          </div>
                          </div>
                        )}

        {showImagePreviewModal && 
        <ImagePreviewModal activeRoom={activeRoom} getRooms={()=>getRooms()} state={state} setMessages={setMessages} setActiveRoom={setActiveRoom} setRooms={setRooms} spaceId={spaceId} activeBooking={activeBooking} setShowImagePreviewModal={setShowImagePreviewModal}/>
        }

        {activeRoom?.booking_id === null &&
          <PropertySpaceMapImage
            modalImage={`https://maps.googleapis.com/maps/api/staticmap?center=${activeProperty.address_line_1 || ""}, ${activeProperty.address_line_2 || ""}, ${activeProperty.city || ""}, ${activeProperty.country || ""
              }&zoom=15&size=600x400&maptype=roadmap&markers=color:red|${activeProperty.address_line_1 || ""}, ${activeProperty.address_line_2 || ""}
      &key=${import.meta.env.VITE_GOOGLE_API_KEY}`}
            modalOpen={showMap}
            closeModal={() => setShowMap(false)}
          />
        }
      </div>
    </>
  );
};

export default MessagesPage;