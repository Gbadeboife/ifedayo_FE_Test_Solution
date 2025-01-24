import { LoadingButton } from "@/components/frontend";
import { GlobalContext } from "@/globalContext";
import { daysMapping, formatAMPM, hourlySlots } from "@/utils/date-time-utils";
import MkdSDK from "@/utils/MkdSDK";
import { parseJsonSafely } from "@/utils/utils";
import { Dialog, Transition } from "@headlessui/react";
import React, { Fragment, useContext, useState } from "react";
import { Controller, useFieldArray, useForm } from "react-hook-form";
import { useNavigate } from "react-router";

export default function EditTemplateModal({ forceRender, selectedTemplate, setSelectedTemplate, data, modalOpen, closeModal, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const { dispatch: globalDispatch } = useContext(GlobalContext);

  const parsedSlots = parseJsonSafely(data.slots, []);
  const { handleSubmit, control, register, reset, formState, watch } = useForm({
    defaultValues: {
      template_time: parsedSlots.map((slot) => ({ from: formatAMPM(slot.start), to: formatAMPM(slot.end) })),
      template_name: data.template_name,
      selectedDays: daysMapping.filter((day) => data[day] == 1).map((day) => day),
    },
  });

  const navigate = useNavigate();

  const { fields, append, remove } = useFieldArray({
    control,
    name: "template_time",
  });

  const times = watch("template_time");

  async function onSubmit(formData) {
    setLoading(true);
    const sdk = new MkdSDK();
    const body = {
      id: data.id,
      template_name: formData.template_name,
    };
    if (Array.isArray(formData.selectedDays)) {
      daysMapping.forEach((day) => {
        body[day] = formData.selectedDays.includes(day) ? 1 : 0;
      });
    } else {
      daysMapping.forEach((day) => {
        body[day] = 0;
      });
    }
    body["slots"] = JSON.stringify(
      formData.template_time
        .filter((time) => time.from != "" && time.to != "")
        .map((time, idx) => ({
          start: new Date(`01/01/2001 ${time.from}`).toISOString(),
          end: new Date(`01/01/2001 ${time.to}`).toISOString(),
        })),
    );
    console.log("result")
    sdk.setTable("schedule_template");
    try {
      const result = await sdk.callRestAPI(body, "PUT");
      console.log(result)
      if ((data?.template_name === selectedTemplate?.template_name)) {
        setSelectedTemplate(body)
      }
      onSuccess();
      closeModal();
    } catch (err) {
      globalDispatch({
        type: "SHOW_ERROR",
        payload: {
          heading: "Operation faile",
          message: err.message,
        },
      });
    }
    setLoading(false);
  }

  return (
    <Transition
      appear
      show={modalOpen}
      as={Fragment}
    >
      <Dialog
        as="div"
        className="relative z-10"
        onClose={closeModal}
      >
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black bg-opacity-25" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-screen items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel
                className="w-full max-w-md mt-16 transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all"
                as="form"
                onSubmit={handleSubmit(onSubmit)}
              >
                <div className="mb-[18px] flex items-center justify-between">
                  <Dialog.Title className="text-2xl font-semibold">Edit template</Dialog.Title>
                  <button
                    type="button"
                    onClick={closeModal}
                    className="rounded-circle border p-1 px-3 text-2xl font-normal duration-300 hover:bg-gray-200"
                  >
                    &#x2715;
                  </button>
                </div>
                <div>
                  <p className="mb-[19px] pt-[10px] text-sm">Set hours for: </p>
                  <div className="mb-[16px] flex flex-wrap gap-4">
                    {daysMapping.map((day) => (
                      <div
                        className="checkbox-container mb-[12px]"
                        key={day}
                      >
                        <Controller
                          control={control}
                          name="selectedDays"
                          render={({ field }) => (
                            <input
                              type="checkbox"
                              style={{"accentColor":"white !important"}}
                              className="accent-[#0D9895]"
                              id={day}
                              value={day}
                              checked={field.value.includes(day)}
                              onChange={() => {
                                let copy = [...field.value];
                                if (field.value.includes(day)) {
                                  copy = field.value.filter((v) => v != day);
                                } else {
                                  copy.push(day);
                                }
                                field.onChange(copy);
                              }}
                              onBlur={field.onBlur}
                            />
                          )}
                        />

                        <label
                          htmlFor={day}
                          className="capitalize"
                        >
                          {day}
                        </label>
                      </div>
                    ))}
                  </div>
                  <div className="tiny-scroll max-h-[200px] min-h-[200px] overflow-y-auto">
                    {fields.map((field, index) => (
                      <div
                        className="mb-[32px] flex gap-6"
                        key={field.id}
                      >
                        <div className="flex flex-grow justify-between gap-2 text-sm">
                          <select
                            className="flex-grow cursor-pointer border bg-white px-4 py-2 focus:outline-primary"
                            {...register(`template_time.${index}.from`)}
                          >
                            {hourlySlots.slice(0, hourlySlots.length - 1).map((hr) => (
                              <option
                                key={hr}
                                disabled={times.some((tm) => {
                                  if (tm.from == "") return false;
                                  var fromTime = new Date(`01/01/2001 ${tm.from}`);
                                  var toTime = new Date(`01/01/2001 ${tm.to}`);
                                  var slotTime = new Date(`01/01/2001 ${hr}`);
                                  return fromTime <= slotTime && toTime >= slotTime;
                                })}
                              >
                                {hr}
                              </option>
                            ))}
                          </select>
                          <select
                            className="flex-grow cursor-pointer border bg-white px-4 py-2 focus:outline-primary"
                            {...register(`template_time.${index}.to`)}
                          >
                            {hourlySlots
                              .filter((hr) => {
                                // remove hours that are < from time
                                return new Date(`01/01/2001 ${hr}`) > new Date(`01/01/2001 ${times[index].from}`);
                              })
                              .map((hr) => (
                                <option
                                  key={hr}
                                // disabled={times.some((tm) => {
                                //   var fromTime = new Date(`01/01/2001 ${tm.from}`);
                                //   var toTime = new Date(`01/01/2001 ${tm.to}`);
                                //   var slotTime = new Date(`01/01/2001 ${hr}`);
                                //   return fromTime <= slotTime && toTime >= slotTime;
                                // })}
                                >
                                  {hr}
                                </option>
                              ))}
                          </select>
                        </div>
                        <button
                          type="button"
                          onClick={() => remove(index)}
                        >
                          &#x2715;
                        </button>
                      </div>
                    ))}
                  </div>

                  <button
                    type="button"
                    className="mb-[32px] text-sm font-semibold text-[#1570EF]"
                    onClick={() => append({ from: "", to: "" })}
                  >
                    + Add another time slot
                  </button>
                  <div className="mb-4 ">
                    <label
                      className="mb-2 block"
                      htmlFor="template_name"
                    >
                      * Name template
                    </label>
                    <input
                      autoComplete="off"
                      id="template_name"
                      type="text"
                      {...register("template_name", { required: "This field is required" })}
                      className={`"resize-none w-full rounded border py-2 px-3 leading-tight text-gray-700 focus:outline-primary`}
                    />
                    <p className="text-sm italic text-red-500">{formState.errors.template_name?.message}</p>
                  </div>
                </div>
                <LoadingButton
                  loading={loading}
                  onClick={forceRender}
                  type="submit"
                  className={`login-btn-gradient rounded tracking-wide text-white outline-none focus:outline-none ${loading ? "py-1" : "py-2"} mt-4 w-full`}
                >
                  Edit template
                </LoadingButton>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
