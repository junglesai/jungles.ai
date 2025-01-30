import SlotCounter from 'react-slot-counter';

interface Props {
  currentCount: number;
  messageLimit: number;
}

const MessageCounter: React.FC<Props> = ({ currentCount, messageLimit }) => {
  return (
    <div className="bg-gray-800 p-4 rounded-lg shadow-xl mb-2">
      <div className="flex justify-between items-center">
        <span className="text-gray-400 lowercase">{"{"} Messages {"}"}</span>
        <span className="text-sm text-gray-400">
          {"{"} <SlotCounter value={currentCount} /> / <SlotCounter value={messageLimit} /> {"}"}
        </span>
      </div>
    </div>
  );
};

export default MessageCounter; 