import React, { useEffect, useState, useRef } from "react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import MkdSDK from "@/utils/MkdSDK";
import { GlobalContext, showToast } from "@/globalContext";
import { useNavigate, useParams } from "react-router-dom";
import { AuthContext, tokenExpireError } from "@/authContext";
import EditAdminPageLayout from "@/layouts/EditAdminPageLayout";
import SunEditor, { buttonList } from "suneditor-react";
import "suneditor/dist/css/suneditor.min.css";

let sdk = new MkdSDK();

const EditAdminFaqPage = () => {
  const { dispatch } = React.useContext(AuthContext);
  const [answer, setAnswer] = useState("");
  const schema = yup
    .object({
      question: yup.string().required(),
      answer: yup.string(),
    })
    .required();
  const { dispatch: globalDispatch, state } = React.useContext(GlobalContext);
  const buttonRef = useRef(null);
  const navigate = useNavigate();
  const [id, setId] = useState(0);
  const {
    register,
    handleSubmit,
    setError,
    setValue,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(schema),
  });

  const params = useParams();

  useEffect(function () {
    (async function () {
      try {
        sdk.setTable("faq");
        const result = await sdk.callRestAPI({ id: Number(params?.id) }, "GET");
        console.log(result);
        if (!result.error) {
          setValue("question", result.model.question);
          setValue("status", result.model.status);
          setAnswer(result.model.answer);
          setId(result.model.id);
        }
      } catch (error) {
        console.log("error", error);
        tokenExpireError(dispatch, error.message);
      }
    })();
  }, []);

  const onError = () => {
    if (answer == "") {
      setError("answer", {
        type: "manual",
        message: "Answer is required",
      });
    }
  };

  const onSubmit = async (data) => {
    if (answer == "") {
      setError("answer", {
        type: "manual",
        message: "Answer is required",
      });
      return;
    }
    try {
      const result = await sdk.callRestAPI(
        {
          id: id,
          question: data.question,
          answer,
          status: data.status,
        },
        "PUT",
      );

      if (!result.error) {
        showToast(globalDispatch, "Updated");
        navigate("/admin/faq");
      } else {
        if (result.validation) {
          const keys = Object.keys(result.validation);
          for (let i = 0; i < keys.length; i++) {
            const field = keys[i];
            setError(field, {
              type: "manual",
              message: result.validation[field],
            });
          }
        }
      }
    } catch (error) {
      console.log("Error", error);
      setError("question", {
        type: "manual",
        message: error.message,
      });
    }
  };
  useEffect(() => {
    if (state.saveChanges) {
      buttonRef.current.click();
      globalDispatch({
        type: "SAVE_CHANGES",
        payload: {
          saveChanges: false,
        },
      });
    }
  }, [state.saveChanges]);

  useEffect(() => {
    globalDispatch({
      type: "SETPATH",
      payload: {
        path: "faq",
      },
    });
  }, []);

  return (
    <EditAdminPageLayout
      title="FAQ"
      backTo="faq"
      table1="faq"
      deleteMessage="Are you sure you want to delete this Question?"
      id={id}
    >
      <form
        className=" w-full max-w-lg"
        onSubmit={handleSubmit(onSubmit, onError)}
      >
        <div className="mb-4 ">
          <label
            className="block text-gray-700 text-sm font-bold mb-2"
            htmlFor="question"
          >
            Question
          </label>
          <textarea
            placeholder="Question"
            {...register("question")}
            className={`"shadow   border  rounded w-full py-2 px-3 text-gray-700 mb-3 leading-tight focus:outline-none focus:shadow-outline ${errors.question?.message ? "border-red-500" : ""}`}
            rows={15}
          ></textarea>
          <p className="text-red-500 text-xs italic">{errors.question?.message}</p>
        </div>

        <div className="mb-4 ">
          <label
            className="block text-gray-700 text-sm font-bold mb-2"
            htmlFor="status"
          >
            Status
          </label>
          <select
            className="border  rounded w-full py-2 px-3 text-gray-700 mb-3 leading-tight focus:outline-none"
            {...register("status")}
          >
            <option value="0">For customer</option>
            <option value="1">For hosts</option>
          </select>
        </div>

        <div className="mb-4 ">
          <label
            className="block text-gray-700 text-sm font-bold mb-2"
            htmlFor="answer"
          >
            Answer
          </label>
          <SunEditor
            width="100%"
            height="400px"
            onChange={(content) => setAnswer(content)}
            setContents={answer}
            name="answer"
            setOptions={{ buttonList: buttonList.complex }}
          />
          <p className="text-red-500 text-xs italic">{errors.answer?.message}</p>
        </div>

        <div className="flex justify-between">
          <button
            onClick={() => navigate("/admin/faq")}
            className="!bg-gradient-to-r flex-1 text-[#667085] font-semibold border border-[#667085] px-6 py-2 text-sm outline-none focus:outline-none mb-1 rounded"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() =>
              globalDispatch({
                type: "SHOWMODAL",
                payload: {
                  showModal: true,
                  modalShowTitle: "Confirm Changes",
                  type: "Edit",
                  modalShowMessage: `Are you sure you want to update this question?`,
                  modalBtnText: "Yes, save changes",
                },
              })
            }
            className="!bg-gradient-to-r flex-1 from-[#33D4B7] to-[#0D9895] font-semibold text-white  px-6 py-2 text-sm outline-none focus:outline-none ml-5 mb-1 rounded"
          >
            Save
          </button>
          <button
            ref={buttonRef}
            type="submit"
            className="hidden"
          ></button>
        </div>
      </form>
    </EditAdminPageLayout>
  );
};

export default EditAdminFaqPage;
