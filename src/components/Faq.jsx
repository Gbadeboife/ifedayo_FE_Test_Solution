import React, { useState, useContext } from "react";
import { GlobalContext } from "@/globalContext";
import { useNavigate } from "react-router-dom";
import Icon from "./Icons";
import "suneditor/dist/css/suneditor.min.css";

const Faq = ({ data }) => {
  const [showAnswer, setShowAnswer] = useState(false);
  const { dispatch } = useContext(GlobalContext);
  const navigate = useNavigate();

  return (
    <div className="w-full p-1">
      <div className="flex justify-between">
        <div></div>
        <div>
          <button
            className="pr-2 bg-gradient-to-r from-[#33D4B7] to-[#0D9895] bg-clip-text text-transparent font-bold border-r border-gray-200"
            onClick={() => {
              navigate(`/admin/edit-faq/${data.id}`, {
                state: data,
              });
            }}
          >
            Edit
          </button>
          <button
            className="font-semibold text-sm py-2.5 text-center inline-flex items-center mr-2 mb-2"
            onClick={() => {
              dispatch({
                type: "SHOWMODAL",
                payload: {
                  showModal: true,
                  modalShowMessage: "Are you sure you want to delete this question?",
                  modalShowTitle: "Confirm Changes",
                  type: "BaasDelete",
                  modalBtnText: "Yes, Delete",
                  itemId: data.id,
                  table1: "faq",
                  backTo: "/admin/faq",
                },
              });
            }}
          >
            <span className="ml-2"> Delete</span>
          </button>
        </div>
      </div>
      <div className="py-2 px-4 bg-white bg-opacity-60 border-[1px] border-gray-200">
        <div className="flex flex-wrap justify-between">
          <div className="flex-1 p-2">
            <div className={`${showAnswer ? " mb-4" : ""}`}>
              <h4 className="text-lg font-semibold leading-normal">{data.question}</h4>
            </div>
            {showAnswer && (
              <p
                className="text-gray-600 font-medium sun-editor-editable"
                dangerouslySetInnerHTML={{ __html: data.answer }}
              ></p>
            )}
          </div>
          <div className="w-auto p-2">
            {showAnswer ? (
              <Icon
                type="minus"
                className="h-4 w-4 cursor-pointer"
                onClick={() => setShowAnswer(!showAnswer)}
              />
            ) : (
              <Icon
                type="plus"
                className="h-4 w-4 cursor-pointer"
                onClick={() => setShowAnswer(!showAnswer)}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Faq;
