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

const EditAdminPropertySpaceFaqPage = () => {
  const { dispatch } = React.useContext(AuthContext);
  const [answer, setAnswer] = useState("");
  const schema = yup
    .object({
      property_space_id: yup.number().positive().integer().typeError("Invalid ID").required(),
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
    clearErrors,
    setValue,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(schema),
  });

  const params = useParams();

  const confirmPropertySpaceId = async (id) => {
    if (id == "") {
      clearErrors("property_space_id");
      return;
    }
    try {
      const result = await sdk.callRawAPI(
        "/v2/api/custom/ergo/property-spaces/PAGINATE",
        {
          where: [`ergo_property_spaces.id = ${id}`],
          page: 1,
          limit: 1,
        },
        "POST",
      );
      if (result.error || !result.list || result.list.length < 1) throw new Error();
      clearErrors("property_space_id");
    } catch (error) {
      console.log("ERROR", error);
      setError("property_space_id", {
        type: "manual",
        message: "Property Space with this ID does not exist",
      });
    }
  };

  useEffect(function () {
    (async function () {
      try {
        sdk.setTable("property_space_faq");
        const result = await sdk.callRestAPI({ id: Number(params?.id) }, "GET");
        console.log(result);
        if (!result.error) {
          setValue("property_space_id", result.model.property_space_id);
          setValue("question", result.model.question);
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
          property_space_id: data.property_space_id,
        },
        "PUT",
      );

      if (!result.error) {
        showToast(globalDispatch, "Updated");
        navigate("/admin/property_spaces_faq");
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
        path: "property_space_faq",
      },
    });
  }, []);

  return (
    <EditAdminPageLayout
      title="Property Space FAQ"
      backTo="property_spaces_faq"
      table1="property_space_faq"
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
            htmlFor="property_space_id"
          >
            Property Space ID
          </label>
          <input
            placeholder="Property Space ID"
            {...register("property_space_id")}
            className={`"shadow   border  rounded w-full py-2 px-3 text-gray-700 mb-3 leading-tight focus:outline-none focus:shadow-outline ${
              errors.property_space_id?.message ? "border-red-500" : ""
            }`}
            onChange={(e) => confirmPropertySpaceId(e.target.value)}
          />
          <p className="text-red-500 text-xs italic">{errors.property_space_id?.message}</p>
        </div>
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

export default EditAdminPropertySpaceFaqPage;
