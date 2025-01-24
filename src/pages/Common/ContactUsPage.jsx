import React from "react";
import { useContext } from "react";
import { useForm } from "react-hook-form";
import { Link } from "react-router-dom";
import { GlobalContext, showToast } from "@/globalContext";
import MkdSDK from "@/utils/MkdSDK";
import CustomSelect from "@/components/frontend/CustomSelect";

const ContactUsPage = () => {
  const { handleSubmit, register, reset, setValue } = useForm();
  let sdk = new MkdSDK();
  const { dispatch: globalDispatch } = useContext(GlobalContext);

  const onSubmit = async (data) => {
    console.log("submitting", data);
    globalDispatch({ type: "START_LOADING" });
    try {
      const tmpl = await sdk.getEmailTemplate("contact");
      const body = tmpl.html?.replace(new RegExp("{{{name}}}", "g"), data.name)?.replace(new RegExp("{{{email}}}", "g"), data.email)?.replace(new RegExp("{{{message}}}", "g"), data.message);

      await sdk.sendEmail(data.email, tmpl.subject, body);
      globalDispatch({
        type: "SHOW_CONFIRMATION",
        payload: {
          heading: "Email Sent",
          message: "Email has been sent, we will get back to you shortly",
          btn: "Ok got it",
        },
      });
    } catch (err) {
      showToast(globalDispatch, err.message, 4000, "ERROR");
    }
    reset();
    globalDispatch({ type: "STOP_LOADING" });
  };

  return (
    <>
      <section className="bg-black pb-[80px] md:pt-[120px] pt-[170px]">
        <h1 className="text-white md:text-7xl text-4xl font-semibold text-center">Contact Us</h1>
      </section>
      <section className="pt-[40px] container mx-auto 2xl:px-16 pb-[140px] normal-case">
        <p className="md:px-0 px-4 pb-8">We are here to help. Copy to be provided</p>
        <div className="flex md:flex-row flex-col justify-between px-16 items-end mb-24">
          <div className="mb-4">
            <small className="font-semibold text-2xl">FAQs - Frequently Asked Questions</small>
            <h3 className="text-xs">Read most common questions others have.</h3>
          </div>
          <Link
            to="/faq"
            className="px-6 py-2 md:w-[178px] w-full text-center rounded-md border border-[#33D4B7] my-text-gradient whitespace-nowrap"
          >
            Visit FAQs
          </Link>
        </div>
        <p className="mb-16 px-4 md:px-0">Feel free to reach out to our team. We usually reply within 24 hours.</p>
        <div className="flex items-center justify-center flex-wrap">
          <form
            className="flex flex-col gap-8 md:w-1/2 w-full p-8"
            onSubmit={handleSubmit(onSubmit)}
          >
            <input
              autoComplete="off"
              type="text"
              placeholder="Name"
              className="resize-none border p-2 focus:outline-none"
              {...register("name")}
            />
            <input
              autoComplete="off"
              type="text"
              placeholder="Email"
              className="resize-none border p-2 focus:outline-none"
              {...register("email")}
            />
            <CustomSelect
              options={["Inquiry", "Complaint", "General"]}
              name="type"
              register={register}
              setValue={setValue}
              formMode
              className="min-w-[200px]"
            />
            <textarea
              name=""
              id=""
              cols="30"
              rows="5"
              placeholder="Message"
              className="border p-2 focus:outline-none resize-none"
              {...register("message")}
            ></textarea>
            <button
              type="submit"
              className="!bg-gradient-to-r from-[#33D4B7] to-[#0D9895] text-white w-40 self-end tracking-wide outline-none focus:outline-none rounded py-2"
            >
              Submit
            </button>
          </form>
          <div className="md:pl-32 md:w-1/2 w-full">
            <img
              src="/contact.png"
              alt=""
            />
          </div>
        </div>
      </section>
    </>
  );
};

export default ContactUsPage;
