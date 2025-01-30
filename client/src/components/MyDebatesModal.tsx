import { Dialog } from '@headlessui/react';
import MyDebateCard from './MyDebateCard';

interface MyDebatesModalProps {
  isOpen: boolean;
  onClose: () => void;
  ownedDebates: Array<any>;
}

const MyDebatesModal = ({ isOpen, onClose, ownedDebates }: MyDebatesModalProps) => {
  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
      
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="mx-auto max-w-4xl w-full rounded-xl bg-gray-800 border border-yellowgreen-500/20">
          <div className="p-6">
            <div className="flex justify-between items-center mb-6">
              <Dialog.Title className="text-xl font-semibold text-yellowgreen-100">
                {"{ my debates }"}
              </Dialog.Title>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-yellowgreen-400"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="space-y-2 max-h-[60vh] overflow-y-auto">
              {ownedDebates.length === 0 ? (
                <p className="text-gray-400 text-center py-8">{"{ no debates found }"}</p>
              ) : (
                ownedDebates.map((debate) => (
                  <MyDebateCard key={debate._id} debate={debate} />
                ))
              )}
            </div>
          </div>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
};

export default MyDebatesModal; 