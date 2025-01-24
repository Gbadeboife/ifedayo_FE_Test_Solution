import { Dialog, Transition } from "@headlessui/react";
import { Fragment } from "react";
import { useOutletContext } from "react-router";
import { useSpaceContext } from "./spaceContext";

export default function EditAddonsModal({ modalOpen, closeModal }) {
  const { spaceData, dispatch } = useSpaceContext();
  const { spaceCategories, addons } = useOutletContext();

  function isCatOthers(){
    const cat = spaceCategories.find((cat) => Number(cat.id) == Number(spaceData.category))
    if (cat?.category === "Others") {
      return true
    } else return false
  }

  function addOrRemoveAmenity(addonId) {
    let copy = [...spaceData.addons];
    if (copy.includes(addonId)) {
      const index = copy.indexOf(addonId);
      if (index > -1) {
        copy.splice(index, 1);
      }
    } else {
      copy.push(addonId);
    }
    dispatch({ type: "SET_ADDONS", payload: copy });
  }

  return (
    <>
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
                  as="div"
                  className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all"
                >
                  <Dialog.Title
                    as="h3"
                    className="text-lg mb-8 font-medium leading-6 text-gray-900 flex w-full justify-between items-center"
                  >
                    {" "}
                    {" "}
                    <span>Addons</span>
                    <button
                      type="button"
                      onClick={closeModal}
                      className="py-2 border hover:bg-gray-200 active:bg-gray-300 duration-100 px-3 text-2xl font-normal rounded-full flex justify-end"
                    >
                      &#x2715;
                    </button>
                  </Dialog.Title> 
                  {isCatOthers() ?
              addons.sort((a, b) => (a.creator_id !== 1 ? -1 : 1) - (b.creator_id !== 1 ? -1 : 1)).map((ad) => (
                  <div
                    key={ad.id}
                    className="checkbox-container mb-4"
                  >
                    <input
                          type="checkbox"
                          name="addons"
                          id={"addon" + ad.id}
                          value={ad.id}
                          checked={spaceData.addons.includes(String(ad.id))}
                          onChange={() => addOrRemoveAmenity(String(ad.id))}
                        />
                        <label htmlFor={"addon" + ad.id}>{ad.name}</label>
                  </div>
                ))
              :
              addons.filter((ad) => (ad.space_id === Number(spaceData.category)) || ad.creator_id === Number(localStorage.getItem("user"))).sort((a, b) => (a.creator_id !== 1 ? -1 : 1) - (b.creator_id !== 1 ? -1 : 1)).map((ad) => (
                <div
                  key={ad.id}
                  className="checkbox-container mb-4"
                >
                  <input
                    type="checkbox"
                    name="addons"
                    id={"addon" + ad.id}
                    value={ad.id}
                    checked={spaceData.addons.includes(String(ad.id))}
                    onChange={() => addOrRemoveAmenity(String(ad.id))}
                  />
                  <label htmlFor={"addon" + ad.id}>{ad.name}</label>
                </div>
              ))
              }
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>
    </>
  );
}
