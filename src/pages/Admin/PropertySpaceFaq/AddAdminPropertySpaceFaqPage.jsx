import React from "react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import MkdSDK from "@/utils/MkdSDK";
import { useNavigate } from "react-router-dom";
import { tokenExpireError, AuthContext } from "@/authContext";
import { GlobalContext, showToast } from "@/globalContext";
import AddAdminPageLayout from "@/layouts/AddAdminPageLayout";

import SunEditor, { buttonList } from "suneditor-react";
import "suneditor/dist/css/suneditor.min.css";
import { useState } from "react";

const AddAdminPropertySpaceFaqPage = () => {
  const { dispatch: globalDispatch } = React.useContext(GlobalContext);
  const [answer, setAnswer] = useState("");

  const schema = yup
    .object({
      property_space_id: yup.number().positive().integer().typeError("Invalid ID").required(),
      question: yup.string().required("Question is required"),
      answer: yup.string(),
    })
    .required();

  const { dispatch } = React.useContext(AuthContext);
  const sdk = new MkdSDK();

  const navigate = useNavigate();
  const {
    register,
    handleSubmit,
    setError,
    clearErrors,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(schema),
  });

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

  const onSubmit = async (data) => {
    if (answer == "") {
      setError("answer", {
        type: "manual",
        message: "Answer is required",
      });
      return;
    }
    let sdk = new MkdSDK();

    try {
      sdk.setTable("property_space_faq");

      const result = await sdk.callRestAPI(
        {
          property_space_id: data.property_space_id,
          question: data.question,
          answer,
        },
        "POST",
      );
      if (!result.error) {
        showToast(globalDispatch, "Added");
        console.log(result);
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
      tokenExpireError(dispatch, error.message);
    }
  };

  const onError = () => {
    setError("answer", {
      type: "manual",
      message: "Answer is required",
    });
  };

  React.useEffect(() => {
    globalDispatch({
      type: "SETPATH",
      payload: {
        path: "property_space_faq",
      },
    });
  }, []);

  return (
    <AddAdminPageLayout
      title={"Property Space FAQ"}
      backTo={"property_spaces_faq"}
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
            Property space ID
          </label>
          <input
            placeholder="Property space id"
            {...register("property_space_id")}
            className={`"shadow   border  rounded w-full py-2 px-3 text-gray-700 mb-3 leading-tight focus:outline-none focus:shadow-outline ${
              errors.property_space_id?.message ? "border-red-500" : ""
            }`}
            onChange={(e) => confirmPropertySpaceId(e.target.value)}
          />
          <p className="text-red-500 text-xs italic normal-case">{errors.property_space_id?.message}</p>
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
          <p className="text-red-500 text-xs italic normal-case">{errors.question?.message}</p>
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
            placeholder="Add your answer here"
            setOptions={{ buttonList: buttonList.complex }}
          />
          <p className="text-red-500 text-xs italic normal-case">{errors.answer?.message}</p>
        </div>

        <div className="flex justify-between">
          <button
            onClick={() => navigate("/admin/faq")}
            className="!bg-gradient-to-r flex-1 text-[#667085] font-semibold border border-[#667085] px-6 py-2 text-sm outline-none focus:outline-none mb-1 rounded"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="!bg-gradient-to-r flex-1 from-[#33D4B7] to-[#0D9895] font-semibold text-white  px-6 py-2 text-sm outline-none focus:outline-none ml-5 mb-1 rounded"
          >
            Save
          </button>
        </div>
      </form>
    </AddAdminPageLayout>
  );
};

export default AddAdminPropertySpaceFaqPage;
