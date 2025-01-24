import { AuthContext } from "@/authContext";
import moment from "moment";
import React from "react";
import { useContext } from "react";

export default function MessagesContainer({ messages, messageErr }) {
  const { state } = useContext(AuthContext);
  return (
    <div className="">
      <div className="flex-grow flex-cols overflow-y-auto tiny-scroll normal-case">
        {messages && (
          <div className="py-2 relative">
            {messages.map((message, idx) => (
              <div
                key={idx}
                className="mb-4 flex"
              >
                <div className={`flex-1 px-2 ${message?.chat?.user_id === state.user && "text-right"}`}>
                  <div className="inline-block">
                    {message?.chat?.message.startsWith("https://s3.us-east-2.amazonaws.com") ? (
                      <div className={`${message?.chat?.user_id === state.user ? "" : "text-right"} border bg-[#F2F4F7] p-2 rounded-md`}>
                        <img
                          src={message?.chat.message}
                          className="min-h-30 w-[150px] object-cover"
                        />
                      </div>
                    ) : (
                      <p className={`${message?.chat?.user_id === state.user ? "border-[#F2F4F7] border to-chat" : "bg-[#15212A] text-white from-chat"} block text-start break-all rounded-xl  p-2 px-6`}>
                        {message?.chat?.message}
                      </p>
                    )}
                  </div>
                  <div className="pl-4 text-[#8E8E93] text-xs">
                    <small className="text-gray-500">{moment(message?.chat?.timestamp).format("DD-MM, hh:mm A")}</small>
                  </div>
                </div>
              </div>
            ))}
            {messageErr && (
              <div className="fixed bottom-[6rem] left-0 w-full flex justify-center z-70">
                <p className="border text-center border-green-500 bg-green-100 text-green-800 text-sm p-3 rounded-xl">{messageErr}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
