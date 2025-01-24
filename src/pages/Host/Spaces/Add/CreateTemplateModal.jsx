import { LoadingButton } from "@/components/frontend";
import { daysMapping, hourlySlots } from "@/utils/date-time-utils";
import MkdSDK from "@/utils/MkdSDK";
import { Dialog, Transition } from "@headlessui/react";
import React, { Fragment, useState } from "react";
import { Controller, useFieldArray, useForm } from "react-hook-form";

export default function CreateTemplateModal({ modalOpen, closeModal, onSuccess }) {
  const [loading, setLoading] = useState(false);

  const { handleSubmit, control, register, reset, formState, watch, setValue } = useForm({
    defaultValues: { template_time: [{ from: "12:00 am", to: "01:00 am" }], template_name: "", selectedDays: [] },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "template_time",
  });

  const times = watch("template_time");

  async function onSubmit(data) {
    const sdk = new MkdSDK();
    setLoading(true);
    const host_id = localStorage.getItem("user");

    const body = {
      host_id,
      template_name: data.template_name,
    };

    if (Array.isArray(data.selectedDays)) {
      daysMapping.forEach((day) => {
        body[day] = data.selectedDays.includes(day) ? 1 : 0;
      });
    } else {
      daysMapping.forEach((day) => {
        body[day] = 0;
      });
    }

    body["slots"] = JSON.stringify(data.template_time.map((time) => ({ start: new Date(`01/01/2001 ${time.from}`).toISOString(), end: new Date(`01/01/2001 ${time.to}`).toISOString() })));
    sdk.setTable("schedule_template");
    try {
      await sdk.callRestAPI(body, "POST");
      onSuccess();
      reset();
      closeModal();
    } catch (err) {
      console.log("er", err);
      globalDispatch({
        type: "SHOW_ERROR",
        payload: {
          heading: "Operation failed",
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
          <div className="flex min-h-full items-center justify-center p-4 text-center">
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
                className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all"
                as="form"
                onSubmit={handleSubmit(onSubmit)}
              >
                <div className="mb-[18px] flex items-center justify-between">
                  <Dialog.Title className="text-2xl font-semibold">Create new template</Dialog.Title>
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
                            {...register(`template_time.${index}.from`, {
                              onChange: () => { },
                            })}
                          >
                            {hourlySlots.slice(0, hourlySlots.length - 1).map((hr) => (
                              <option
                                key={hr}
                              // disabled={times.some((tm) => {
                              //   if (tm.from == "" || tm.to == "") return false;
                              //   var toTime = new Date(`01/01/2001 ${tm.to}`);
                              //   var slotTime = new Date(`01/01/2001 ${hr}`);
                              //   return toTime >= slotTime;
                              // })}
                              >
                                {hr}
                              </option>
                            ))}
                          </select>
                          <select
                            className="flex-grow cursor-pointer border bg-white px-4 py-2 focus:outline-primary"
                            {...register(`template_time.${index}.to`, {
                              onChange: () => { },
                            })}
                          >
                            {hourlySlots
                              .filter((hr) => {
                                // remove hours that are < from time
                                return new Date(`01/01/2001 ${hr}`) > new Date(`01/01/2001 ${times[index].from}`);
                              })
                              .map((hr) => (
                                <option key={hr}>{hr}</option>
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
                      {...register("template_name", { required: "Template name field is required" })}
                      className={`"resize-none w-full rounded border py-2 px-3 leading-tight text-gray-700 focus:outline-primary`}
                    />
                    {Object.entries(formState.errors).length > 0 ? (
                      <p className="error-vibrate my-3 rounded-md border border-[#C42945] bg-white py-2 px-3 text-center text-sm normal-case text-[#C42945]">
                        {Object.values(formState.errors)[0].message}
                      </p>
                    ) : null}
                  </div>
                </div>
                <LoadingButton
                  loading={loading}
                  type="submit"
                  className={`login-btn-gradient rounded tracking-wide text-white outline-none focus:outline-none ${loading ? "py-1" : "py-2"} mt-4 w-full`}
                >
                  Create template
                </LoadingButton>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
