import { Link } from 'react-router-dom';
import SlotCounter from 'react-slot-counter';
import AvatarComponent from './Avatar';
interface DebateCardProps {
  debate: {
    _id: string;
    title: string;
    description: string;
    agents: Array<{
      _id: string;
      name: string;
      stance: string;
    }>;
    status: string;
    messages: Array<any>;
    messageLimit: number;
    totalPool: number;
    solanaAddress: string;
  };
}

const DebateCard = ({ debate }: DebateCardProps) => {
  return (
    <div className="bg-gray-800 rounded-lg overflow-hidden shadow-lg hover:shadow-yellowgreen-500/10 transition-shadow h-full border border-gray-700">
      <div className="p-6 flex flex-col h-full">
        <div className="mb-auto">
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-lg font-semibold text-yellowgreen-100 max-w-100 whitespace-nowrap truncate">{"{ "}{debate.title}{" }"}</h3>
            
          </div>
          <p className="text-gray-300 mb-4 text-md">{debate.description}</p>
        </div>
        
        <div className="mt-4">
          <div className="space-y-3 mb-2">
            {debate.agents.map((agent, index) => (
              <div key={index} className="flex items-center justify-between bg-gray-700 p-3 rounded">
                <div className="flex items-center justify-between gap-2 w-full">
                  <div className="flex items-center gap-2">
                    <AvatarComponent seed={agent._id} size={32} />
                    <div className="flex flex-col">
                      <span className="text-gray-200 font-medium text-sm">{agent.name}</span>
                      <span className="text-xs text-yellowgreen-400 lowercase text-left sm:hidden">{agent.stance}</span>
                    </div>
                  </div>
                  <span className="text-xs text-yellowgreen-400 lowercase text-right hidden sm:block ml-auto">{agent.stance}</span>
                </div>
              </div>
            ))}
          </div>
          {/* <a href={`https://solscan.io/address/${debate.solanaAddress}`} target="_blank" className="text-xs text-gray-400 hover:text-yellowgreen-400 break-all">{debate.solanaAddress}</a> */}
          <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mt-4">
            <div className="flex items-center justify-between gap-3">
            {/* <span className={`lowercase px-3 py-1 rounded-full text-sm uppercase tracking-wider ${
                debate.status === 'active' 
                  ? 'bg-yellowgreen-500/20 text-yellowgreen-400'
                  : debate.status === 'paused'
                  ? 'bg-yellow-500/20 text-yellow-400'
                  : debate.status === 'completed'
                  ? 'bg-gray-500/20 text-gray-400' 
                  : 'bg-gray-600 text-gray-300'
              }`}>
                {debate.status}
              </span> */}
              <span className="bg-gray-700 text-yellowgreen-100 px-3 py-1 rounded-full text-xs font-medium">
              {Number(debate.totalPool) ? <SlotCounter value={(Number(debate.totalPool) / 1000000000).toFixed(2)}/> : 0} SOL
              </span>
              <span className="text-xs text-gray-400 slotWrapper">
              {"{"} {debate.messages.length} / {debate.messageLimit} {"}"}
              </span>
            </div>
            <Link 
              to={`/debates/${debate._id}`}
              className="w-full md:w-auto bg-yellowgreen-100 hover:bg-superyellowgreen-100 text-gray-900 px-4 py-2 rounded-lg font-medium transition-colors lowercase text-center"
            >
              Join Debate
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DebateCard; 