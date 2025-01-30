import { Link } from 'react-router-dom';
import SlotCounter from 'react-slot-counter';

interface MyDebateCardProps {
  debate: {
    _id: string;
    title: string;
    totalPool: number;
    messages: any[];
    messageLimit: number;
  };
}

const MyDebateCard = ({ debate }: MyDebateCardProps) => {
  return (
    <div className="bg-gray-900/50 rounded-lg p-4 hover:bg-gray-900/80 transition-colors">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div className="flex-1 overflow-hidden">
          <h3 className="text-yellowgreen-100 truncate">{"{ "}{debate.title}{" }"}</h3>
        </div>
        <div className="flex items-center justify-between gap-3">
          <span className="bg-gray-700 text-yellowgreen-400 px-3 py-1 rounded-full text-sm font-medium">
            {Number(debate.totalPool) ? <SlotCounter value={Number(debate.totalPool) / 1000000000}/> : 0} SOL
          </span>
          <span className="text-sm text-gray-400">
            <SlotCounter value={debate.messages.length}/> / <SlotCounter value={debate.messageLimit}/>
          </span>
          <Link 
            target="_blank"
            to={`/debates/${debate._id}`}
            className="bg-yellowgreen-500 hover:bg-yellowgreen-100 text-gray-900 px-4 py-1 rounded-lg font-medium transition-colors lowercase text-sm"
          >
            View
          </Link>
        </div>
      </div>
    </div>
  );
};

export default MyDebateCard; 