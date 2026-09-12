module.exports = function renderTemplate5(data, sharedBlocks) {
  const { title, heroSubtitle } = data;

  return `
    <div class="max-w-7xl mx-auto px-6 py-12 space-y-20">
      <!-- Enterprise Hero -->
      <section class="border-b border-white/10 pb-12">
        <span class="font-mono-code text-xs text-[#8b5cf6] uppercase tracking-[0.2em]">// ENTERPRISE GRADE</span>
        <h1 class="font-syne text-4xl sm:text-7xl font-extrabold uppercase text-white mt-2 mb-6">${title}</h1>
        <p class="font-mono-code text-white/70 text-base max-w-3xl mb-8">${heroSubtitle || ''}</p>
        
        <!-- Metrics Bar -->
        <div class="grid grid-cols-2 md:grid-cols-4 gap-6 pt-6 border-t border-white/5 font-mono-code">
          <div><div class="text-3xl font-bold text-white font-syne">99.9%</div><div class="text-xs text-white/40">UPTIME GUARANTEE</div></div>
          <div><div class="text-3xl font-bold text-[#8b5cf6] font-syne">&lt;100ms</div><div class="text-xs text-white/40">SERVER RESPONSE</div></div>
          <div><div class="text-3xl font-bold text-white font-syne">100/100</div><div class="text-xs text-white/40">PAGESPEED SCORE</div></div>
          <div><div class="text-3xl font-bold text-[#8b5cf6] font-syne">24/7</div><div class="text-xs text-white/40">SUPPORT AVAILABILITY</div></div>
        </div>
      </section>

      <!-- Portfolio First Block -->
      ${sharedBlocks.portfolioSection}
      ${sharedBlocks.faqSection}
      ${sharedBlocks.relatedServices}
    </div>
  `;
};