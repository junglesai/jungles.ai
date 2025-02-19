import { useEffect, useState, useRef } from 'react';
import Header from './components/Header';
import Footer from './components/Footer';
import DebateCard from './components/DebateCard';
import judgeRight from "./assets/images/judgeRight.png";
import judgeLogo from "./assets/images/judge.png";
import judgeRight2 from "./assets/images/judgeRight1.png";
import judgeLogo2 from "./assets/images/judge1.png";

import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import DebatePage from './pages/DebatePage';
import LaunchModal from './components/LaunchModal';
import axios from 'axios';
import { useWallet } from '@solana/wallet-adapter-react';
interface Debate {
  _id: string;
  title: string;
  description: string;
  agents: Array<{
    _id: string;
    name: string;
    stance: string;
  }>;
  status: string;
  messageLimit: number;
  totalPool: number;
  messages: Array<{
    agentId: string;
    content: string;
    status: string;
  }>;
  solanaAddress: string;
}

// Sparkle icon component
const SparkleIcon = () => (
  <svg 
    className="w-5 h-5" 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round"
  >
    <path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z" />
  </svg>
);

function App() {
  const { publicKey } = useWallet();
  const [debates, setDebates] = useState<Debate[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    hasNextPage: false,
    nextLastId: null,
    limit: 300
  });
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newDebateIds, setNewDebateIds] = useState<Set<string>>(new Set());
  const [ownedDebates, setOwnedDebates] = useState<Debate[]>([]);
  const POLL_INTERVAL = 5000; // 5 seconds
  const currentDebatesLength = useRef(0);

  const fetchDebates = async (noLoading: boolean = false, lastId?: string, polling: boolean = false, _searchTerm_?: string, _sortBy_?: string, ) => {
    if (!noLoading) {
      setLoading(true);
    }
    try {
      const limit = currentDebatesLength.current > pagination.limit ? currentDebatesLength.current : pagination.limit;

      const params = new URLSearchParams({
        limit: limit.toString()
      });

      if (lastId) {
        params.append('lastId', lastId);
      }
      
      if (_searchTerm_ || searchTerm) {
        params.append('search', _searchTerm_ || searchTerm);
      }
      
      if (_sortBy_ || sortBy) {
        params.append('sort', _sortBy_ || sortBy);
      }

      if (publicKey || localStorage.getItem('address')) {
        params.append('deployer', publicKey?.toBase58() || localStorage.getItem('address') || '');
      }

      const response = await axios.get(`/api/debates?${params}`);
      const { items: newDebates, pagination: newPagination, myDebates } = response.data;
      
      setDebates(prevDebates => {
        if (polling) {
          // For polling, only update first page while preserving pagination
          const firstPageDebates = newDebates;
          const remainingDebates = prevDebates.slice(limit);
          
          // Check for new debates
          const prevIds = new Set(prevDebates.slice(0, limit).map(d => d._id));
          const newIds = new Set<string>();
          
          firstPageDebates.forEach((debate: Debate) => {
            if (!prevIds.has(debate._id)) {
              newIds.add(debate._id);
            }
          });
          
          setNewDebateIds(newIds);
          setTimeout(() => setNewDebateIds(new Set()), 1000);
          
          return [...firstPageDebates, ...remainingDebates];
        } else {
          // Regular fetch or pagination
          const prevIds = new Set(prevDebates.map(d => d._id));
          const newIds = new Set<string>();
          
          newDebates.forEach((debate: Debate) => {
            if (!prevIds.has(debate._id)) {
              newIds.add(debate._id);
            }
          });
          
          setNewDebateIds(newIds);
          setTimeout(() => setNewDebateIds(new Set()), 1000);
          
          return lastId ? [...prevDebates, ...newDebates] : newDebates;
        }
      });

      if (myDebates) {
        setOwnedDebates(myDebates);
      }

      if (!polling) {
        setPagination(newPagination);
      }
    } catch (error) {
      console.error('Error fetching debates:', error);
    } finally {
      if (!noLoading) {
        setLoading(false);
      }
      setIsLoadingMore(false);
    }
  };

  const loadMore = () => {
    if (pagination.hasNextPage && pagination.nextLastId && !isLoadingMore) {
      setIsLoadingMore(true);
      fetchDebates(true, pagination.nextLastId, false, searchTerm, sortBy);
    }
  };

  // Intersection Observer for infinite scroll
  const observerTarget = useRef<HTMLDivElement>(null);

  useEffect(() => {
    currentDebatesLength.current = debates.length;
  }, [debates]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting) {
          loadMore();
        }
      },
      { threshold: 1.0 }
    );

    if (observerTarget.current) {
      observer.observe(observerTarget.current);
    }

    return () => observer.disconnect();
  }, [pagination.nextLastId]);

  useEffect(() => {
    if (window.location.pathname === '/') {
      fetchDebates();
      const interval = setInterval(() => {
        fetchDebates(true, undefined, true, searchTerm, sortBy);
      }, POLL_INTERVAL);
  
      return () => clearInterval(interval);
    } else {
      fetchDebates();
    }
  }, [sortBy, searchTerm]); 



  const ca = import.meta.env.VITE_CA;
  return (
    <Router>
      <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 flex flex-col">
        <Header ownedDebates={ownedDebates} />
        
        <Routes>
          <Route path="/debates/:id" element={<DebatePage />} />
          <Route path="/" element={
            <main className="flex-grow container mx-auto px-4 sm:px-4 lg:px-0 py-12">
              <div className="max-w-7xl mx-auto">
                <div className="flex justify-center items-center">
                  <img src={judgeRight} alt="AI Debates Logo" className="w-20 mb-2 mr-4" /> 
                  <h1 className="md:text-5xl font-bold text-yellowgreen-100 text-center uppercase courier">
                    <span className='text-2xl md:text-5xl' style={{lineHeight: '1'}}>AI-Powered</span> <span className='text-4xl md:text-5xl' style={{lineHeight: '1'}}>Debates</span>
                  </h1>
                  <img src={judgeLogo} alt="AI Debates Logo" className="w-20 mb-2 ml-4" /> 
                </div>
                <p className={`text-gray-400 text-center ${ca ? 'mb-4' : 'mb-8'} max-w-3xl mx-auto lowercase`}>
                  Watch AI agents engage in thoughtful discussions about contemporary issues
                </p>
                {ca && <a href={`https://solscan.io/address/${ca}`} target="_blank" className="text-gray-300 hover:text-yellowgreen-400 cursor-pointer mb-4 block text-center hidden md:block">
                 {"{ ca: " + ca + " }"}
                </a> } 
                {/* Search, Launch, and Filter Bar */}
                <div className="max-w-7xl mx-auto mb-4">
                  {/* Mobile Stacked Layout */}
                  <div className="flex flex-col gap-2 sm:hidden">
                    {/* Launch Button */}
                    <button
                      onClick={() => setIsModalOpen(true)}
                      className="w-full px-6 py-2.5 bg-yellowgreen-100 hover:bg-superyellowgreen-100 text-gray-900 font-medium rounded-lg flex items-center justify-center gap-2 transition-colors border border-yellowgreen-400 lowercase"
                    >
                      <SparkleIcon />
                      Launch New Debate
                    </button>

                    {/* Search */}
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="Search debates..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-gray-200 focus:outline-none focus:border-yellowgreen-400 transition-colors lowercase"
                      />
                      <svg
                        className="absolute right-3 top-3 h-5 w-5 text-gray-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                        />
                      </svg>
                    </div>

                    {/* Sort and Filter */}
                    <div className="flex gap-2">
                      <select 
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value)}
                        className="flex-1 px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-gray-200 focus:outline-none focus:border-yellowgreen-400 transition-colors lowercase"
                      >
                        <option value="" disabled>{"{"} Sort by {"}"}</option>
                        <option value="recent">{"{"} Most Recent {"}"}</option>
                        <option value="pool">{"{"} Largest Pool {"}"}</option>
                        <option value="messages">{"{"} Almost Closed {"}"}</option>
                      </select>
                    </div>
                  </div>

                  {/* Desktop Three Column Layout */}
                  <div className="hidden sm:grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Search Column */}
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="{ Search debates... }"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-gray-200 focus:outline-none focus:border-yellowgreen-400 transition-colors lowercase"
                      />
                      <svg
                        className="absolute right-3 top-3 h-5 w-5 text-gray-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                        />
                      </svg>
                    </div>

                    {/* Launch Button Column */}
                    <button
                      onClick={() => setIsModalOpen(true)}
                      className="px-6 py-2.5 bg-yellowgreen-100 hover:bg-superyellowgreen-100 text-gray-900 font-medium rounded-lg flex items-center justify-center gap-2 transition-colors border border-yellowgreen-400 lowercase"
                    >
                      <SparkleIcon />
                      Launch New Debate
                    </button>

                    {/* Sort and Filter Column */}
                    <div className="flex gap-2">
                      <select 
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value)}
                        className="flex-1 px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-gray-200 focus:outline-none focus:border-yellowgreen-400 transition-colors lowercase"
                      >
                        <option value="" disabled>{"{"} Sort by {"}"}</option>
                        <option value="recent">{"{"} Most Recent {"}"}</option>
                        <option value="pool">{"{"} Largest Pool {"}"}</option>
                        <option value="messages">{"{"} Almost Closed {"}"}</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Debate Cards Grid */}
                {loading ? (
                  <div className="flex justify-center items-center h-72">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-yellowgreen-400"></div>
                  </div>
                ) : debates.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-64 text-gray-400">
                    <svg 
                      className="w-16 h-16 mb-4" 
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path 
                        strokeLinecap="round" 
                        strokeLinejoin="round" 
                        strokeWidth={1.5} 
                        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" 
                      />
                    </svg>
                    <p className="text-xl mb-2">no debates found</p>
                    <p className="text-sm lowercase">
                      {searchTerm 
                        ? `No results found for "${searchTerm}"`
                        : "Try adjusting your search or filters"
                      }
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {debates.map((debate) => (
                      <div 
                        key={debate._id} 
                        className={`transform transition-all duration-300 overflow-hidden rounded-lg ${
                          newDebateIds.has(debate._id)
                            ? 'animate-slideIn shadow-glow' 
                            : 'hover:-translate-y-1'
                        }`}
                      >
                        <DebateCard debate={debate} />
                      </div>
                    ))}
                  </div>
                )}

                {/* Infinite Scroll Observer */}
                {pagination.hasNextPage && (
                  <div 
                    ref={observerTarget} 
                    className="flex justify-center items-center p-4 mt-4"
                  >
                    {isLoadingMore && (
                      <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-yellowgreen-400"></div>
                    )}
                  </div>
                )}
              </div>
            </main>
          } />
        </Routes>

        <Footer />

        <LaunchModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSuccess={() => fetchDebates(true)}
        />
      </div>
    </Router>
  );
}

export default App;

