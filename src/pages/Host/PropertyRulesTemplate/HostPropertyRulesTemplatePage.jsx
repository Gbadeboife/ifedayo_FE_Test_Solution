import { AuthContext, tokenExpireError } from "@/authContext";
import { LoadingButton } from "@/components/frontend";
import ThreeDotsMenu from "@/components/frontend/ThreeDotsMenu";
import { GlobalContext } from "@/globalContext";
import TreeSDK from "@/utils/TreeSDK";
import { parseJsonSafely } from "@/utils/utils";
import { Dialog, Disclosure, Transition } from "@headlessui/react";
import { ArrowLeftIcon, ChevronDownIcon, PencilIcon, PlusCircleIcon, TrashIcon } from "@heroicons/react/24/outline";
import React, { Fragment, useContext, useEffect, useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";

export default function HostPropertyRulesTemplatePage() {
  const [templates, setTemplates] = useState([]);
  const [fetching, setFetching] = useState(false);
  const { dispatch: authDispatch, state: authState } = useContext(AuthContext);
  const { dispatch: globalDispatch } = useContext(GlobalContext);
  const navigate = useNavigate();
  const [deleteTemplate, setDeleteTemplate] = useState({});
  const [loading, setLoading] = useState(false);

  async function fetchTemplates() {
    setLoading(true);
    globalDispatch({ type: "START_LOADING" });
    try {
      const treeSdk = new TreeSDK();
      const result = await treeSdk.getList("property_space_rule_template", { join: [], filter: [`deleted_at,is`, `host_id,eq,${authState.user}`] });
      if (Array.isArray(result.list)) {
        setTemplates(result.list);
      }
    setLoading(false);
    } catch (err) {
    setLoading(false);
      tokenExpireError(authDispatch, err.message);
    globalDispatch({ type: "SHOW_ERROR", payload: { heading: "Operation failed", message: err.message } });
      }
    globalDispatch({ type: "STOP_LOADING" });
  }

  async function handleDeleteTemplate() {
    setLoading(true);
    try {
      const treeSdk = new TreeSDK();
      await treeSdk.delete("property_space_rule_template", deleteTemplate.id);
      setDeleteTemplate({});
      fetchTemplates();
    } catch (err) {
      tokenExpireError(authDispatch, err.message);
      globalDispatch({ type: "SHOW_ERROR", payload: { heading: "Operation failed", message: err.message } });
    }
    setLoading(false);
  }

  useEffect(() => {
    fetchTemplates();
  }, []);

  return (
    <div className="container mx-auto min-h-screen px-4 pt-40 normal-case 2xl:px-32">
      <div className="cursor-pointer">
        <Link
          to={"/account/profile"}
          className="mr-2 mb-2 inline-flex items-center pr-5 text-center text-sm font-semibold"
        >
          <ArrowLeftIcon className="h-4 w-6" />
          <span className="ml-2">Back</span>
        </Link>
      </div>


      {(!loading && templates.length == 0) && 
      <span className="text-xl md:text-3xl text-center block w-full">No Rules Templates Yet</span>
      }

      <div className="mt-8 block pb-16 overflow-auto hidden-scrollbar space-y-6">
        {templates.map((t) => (
          <Disclosure
            as={"div"}
            key={t.id}
            className={`rounded-xl border border-gray-300 py-3 px-4`}
          >
            <Disclosure.Button className="flex w-full items-center justify-between gap-3 py-2 font-medium">
              <div className="flex items-center gap-3 font-semibold">
                <ChevronDownIcon className="h-6 w-6 text-gray-700 ui-open:rotate-0 ui-not-open:-rotate-90" />
                {t.template_name}
              </div>
              <ThreeDotsMenu
                direction={"vert"}
                items={[
                  {
                    label: "Edit",
                    icon: <PencilIcon className="h-5 w-5" />,
                    onClick: () => navigate(`/account/profile/edit-rules-templates/${t.id}`),
                  },
                  {
                    label: "Delete",
                    icon: <TrashIcon className="h-5 w-5" />,
                    onClick: () => setDeleteTemplate(t),
                  },
                ]}
              />
            </Disclosure.Button>

            <Transition
              as={Fragment}
              enter="transition-all ease duration-500"
              enterFrom="h-0"
              enterTo="h-auto"
              leave="transition-all ease duration-500"
              leaveFrom="h-auto"
              leaveTo="h-0"
            >
              <Disclosure.Panel className="overflow-hidden text-sm text-gray-500 duration-500">{parseJsonSafely(t.template, {}).paragraph}</Disclosure.Panel>
            </Transition>
          </Disclosure>
        ))}
      </div>
      <Transition
        appear
        show={deleteTemplate.id != undefined}
        as={Fragment}
      >
        <Dialog
          as="div"
          className="relative z-10"
          onClose={() => setDeleteTemplate({})}
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
                <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                  <Dialog.Title
                    as="h3"
                    className="text-lg font-medium leading-6 text-gray-900"
                  >
                    Are you sure
                  </Dialog.Title>
                  <div className="mt-2">
                    <p className="text-sm text-gray-500">
                      Are you sure you want to delete <b className="font-medium text-gray-900">{deleteTemplate.template_name}</b>?
                    </p>
                  </div>

                  <div className="mt-4 flex justify-end gap-4">
                    <button
                      type="button"
                      className="inline-flex justify-center rounded-md border px-4 py-2 text-sm font-medium focus:outline-none"
                      onClick={() => setDeleteTemplate({})}
                    >
                      Cancel
                    </button>
                    <LoadingButton
                      loading={loading}
                      type="button"
                      className={`inline-flex justify-center rounded-md ${loading ? "py-1 px-6" : "py-2 px-4"} login-btn-gradient text-sm font-medium text-white`}
                      onClick={handleDeleteTemplate}
                    >
                      Proceed
                    </LoadingButton>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>
    </div>
  );
}
