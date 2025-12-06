const CTA = () => {
  return (
    <section className="py-24 bg-gradient-to-b from-white to-rose-50/30">
      <div className="max-w-4xl mx-auto px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-6 tracking-tight">
            <span className="bg-gradient-to-r from-rose-900 via-rose-800 to-pink-900 bg-clip-text text-transparent">
              Ready to unify your Web3 identity?
            </span>
          </h2>
          <p className="text-xl text-rose-700 max-w-2xl mx-auto mb-10 leading-relaxed">
            Connect your Stellar and Polkadot wallets to check your cross-chain reputation today.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-6">
            <button className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-rose-900 to-pink-900 text-white rounded-full text-base font-medium transition-all duration-300 ease-out hover:from-rose-800 hover:to-pink-800 hover:shadow-xl hover:shadow-rose-900/30 hover:-translate-y-1">
              Connect Wallets
            </button>
            <button className="w-full sm:w-auto px-8 py-4 bg-white text-rose-900 border-2 border-rose-200 rounded-full text-base font-medium transition-all duration-300 ease-out hover:border-rose-300 hover:bg-rose-50 hover:shadow-lg hover:-translate-y-1">
              Learn More
            </button>
          </div>
          
          <p className="text-sm text-rose-600">
            Free reputation check · No registration required
          </p>
        </div>
      </div>
    </section>
  );
};

export default CTA;