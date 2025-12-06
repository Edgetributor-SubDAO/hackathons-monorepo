const Testimonials = () => {
  const testimonials = [
    {
      quote: "ChainRepute solved the fragmented identity problem I faced across Stellar and Polkadot. My reputation now follows me everywhere.",
      author: "Alex Rivera",
      role: "DeFi Trader",
      company: "Polkadot Ecosystem",
    },
    {
      quote: "As a governance participant, I can now prove my cross-chain contribution history to new DAOs. This is a game-changer.",
      author: "Sarah Kim",
      role: "DAO Contributor",
      company: "Stellar Network",
    },
    {
      quote: "Finally, a tool that unifies my Web3 identity. I got access to an exclusive community based on my verified reputation.",
      author: "Marcus Johnson",
      role: "Liquidity Provider",
      company: "Cross-Chain Investor",
    },
  ];

  return (
    <section className="py-24 bg-rose-50">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <p className="text-sm font-medium text-rose-600 mb-4 uppercase tracking-wider">Testimonials</p>
          <h2 className="text-3xl md:text-4xl font-bold mb-4 tracking-tight">
            <span className="bg-gradient-to-r from-rose-900 via-rose-800 to-rose-900 bg-clip-text text-transparent">
              Trusted by Web3 users
            </span>
          </h2>
          <p className="text-lg text-rose-700">
            See what our users say about cross-chain reputation.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {testimonials.map((testimonial, index) => (
            <div
              key={testimonial.author}
              className="group p-8 bg-white border border-rose-200/50 rounded-2xl animate-fade-in-up hover:border-rose-300 hover:shadow-xl hover:shadow-rose-200/30 hover:-translate-y-1 transition-all duration-300"
              style={{ animationDelay: `${index * 150}ms`, animationFillMode: 'both' }}
            >
              <div className="flex gap-1 mb-6">
                {[1, 2, 3, 4, 5].map((star) => (
                  <svg key={star} className="w-5 h-5 text-rose-400 group-hover:text-rose-500 transition-colors" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
              <blockquote className="text-rose-800 leading-relaxed mb-6 group-hover:text-rose-900 transition-colors">
                "{testimonial.quote}"
              </blockquote>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-rose-200 to-pink-200 rounded-full"></div>
                <div>
                  <p className="font-medium text-rose-900">{testimonial.author}</p>
                  <p className="text-sm text-rose-600">{testimonial.role}, {testimonial.company}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Testimonials;