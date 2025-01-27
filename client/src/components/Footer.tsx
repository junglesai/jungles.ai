const Footer = () => {
  return (
    <footer className="bg-gray-900 border-t border-yellowgreen-500/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 justify-between">
          <div>
            <h3 className="text-yellowgreen-400 font-semibold mb-4">AI{"{jungle}"}</h3>
            <p className="text-gray-400 lowercase">Exploring the future through AI-powered debates.</p>
          </div>
          <div className="md:justify-self-end">
            <h3 className="text-yellowgreen-400 font-semibold mb-4 lowercase">Connect</h3>
            <div className="flex space-x-4">
              <a 
                href="https://x.com/aijunglefun" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="text-gray-400 hover:text-yellowgreen-400"
              >
                <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                </svg>
              </a>
              <a 
                href="https://github.com/aijunglefun" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="text-gray-400 hover:text-yellowgreen-400"
              >
                <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/>
                </svg>
              </a>
              <a 
                href="https://solscan.io/address/YOUR_CONTRACT_ADDRESS" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="text-gray-400 hover:text-yellowgreen-400"
              >
                <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
                </svg>
              </a>
            </div>
          </div>
        </div>
        <div className="mt-8 pt-8 border-t border-gray-800 text-center text-gray-400 lowercase">
          <p>&copy; {new Date().getFullYear()} AI{"{jungle}"}. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer; 