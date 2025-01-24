import React, { useContext, useEffect } from "react";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { useForm } from "react-hook-form";
import { AuthContext, tokenExpireError } from "@/authContext";
import { GlobalContext } from "@/globalContext";
import { ArrowLeftIcon } from "@heroicons/react/24/outline";
import { Link, useNavigate, useParams } from "react-router-dom";
import MkdSDK from "@/utils/MkdSDK";
import TreeSDK from "@/utils/TreeSDK";
import { parseJsonSafely } from "@/utils/utils";

const sdk = new MkdSDK();

export default function EditPropertyRuleTemplatePage() {
  const { dispatch, state } = useContext(AuthContext);
  const { dispatch: globalDispatch } = useContext(GlobalContext);
  const navigate = useNavigate();
  const { id } = useParams();

  const schema = yup.object({
    template_name: yup.string().required("This field is required"),
    template: yup.string().required("This field is required"),
  });
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting, isValidating },
  } = useForm({
    resolver: yupResolver(schema),
    defaultValues: { template: "", template_name: "" },
    mode: "all",
  });

  async function onSubmit(data) {
    console.log("submitting", data);
    sdk.setTable("property_space_rule_template");
    try {
      await sdk.callRestAPI({ id, template_name: data.template_name, template: JSON.stringify({ paragraph: data.template }), host_id: state.user }, "PUT");
      globalDispatch({
        type: "SHOW_CONFIRMATION",
        payload: { heading: "Successful", message: "Template edited successfully", btn: "Go back", onClose: () => navigate("/account/profile/rules-templates") },
      });
    } catch (err) {
      tokenExpireError(dispatch, err.message);
      globalDispatch({ type: "SHOW_ERROR", payload: { heading: "Failed to edit template", message: err.message } });
    }
  }

  async function fetchTemplate() {
    try {
      const treeSdk = new TreeSDK();
      const result = await treeSdk.getOne("property_space_rule_template", id, { join: [] });
      setValue("template_name", result.model.template_name);
      setValue("template", parseJsonSafely(result.model.template, {}).paragraph);
    } catch (err) {
      tokenExpireError(dispatch, err.message);
      globalDispatch({ type: "SHOW_ERROR", payload: { heading: "Error fetching template", message: err.message } });
    }
  }

  useEffect(() => {
    fetchTemplate();
  }, []);

  return (
    <div className="container mx-auto min-h-screen px-4 pt-40 normal-case 2xl:px-32">
      <div>
        <Link
          to={"/account/profile"}
          className="mr-2 mb-2 inline-flex items-center py-2.5 pr-5 text-center text-sm font-semibold"
        >
          <ArrowLeftIcon className="h-4 w-6" />
          <span className="ml-2">Back</span>
        </Link>
      </div>
      <form
        className="text-sm md:max-w-lg"
        onSubmit={handleSubmit(onSubmit)}
        autoComplete="off"
      >
        <h1 className="mb-8 text-3xl font-bold md:text-4xl">Edit Rules Template</h1>
        <div className="mb-8">
          <label
            className="mb-2 block text-sm font-bold text-gray-700"
            htmlFor="template_name"
          >
            Name {errors.template_name?.message ? <span className="text-xs font-normal italic text-red-500">{errors.template_name?.message}</span> : ""}
          </label>
          <input
            autoComplete="off"
            placeholder=""
            {...register("template_name")}
            className={`w-full rounded border py-2 px-3 leading-tight text-gray-700 ${errors.template_name?.message ? "border-red-500 focus:outline-red-500" : "focus-within:outline-primary"}`}
          />
        </div>

        <div className="mb-8">
          <label
            className="mb-2 block text-sm font-bold text-gray-700"
            htmlFor="template"
          >
            Template {errors.template?.message ? <span className="text-xs font-normal italic text-red-500">{errors.template?.message}</span> : ""}
          </label>
          <textarea
            placeholder=""
            {...register("template")}
            className={`w-full resize-none rounded border py-2 px-3 leading-tight text-gray-700 ${errors.template?.message ? "border-red-500 focus:outline-red-500" : "focus-within:outline-primary"}`}
            rows={10}
          ></textarea>
        </div>
        <hr className="my-[48px]" />
        <button
          type="submit"
          disabled={isSubmitting || isValidating}
          className="login-btn-gradient rounded py-2 mb-10 px-4 tracking-wide text-white outline-none focus:outline-none"
        >
          Save
        </button>
      </form>
    </div>
  );
}
