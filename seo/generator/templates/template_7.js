module.exports = function renderTemplate7(data, sharedBlocks) {
  const { title, heroSubtitle, problems } = data;

  return `
    <div class="max-w-7xl mx-auto px-6 py-12 space-y-16">
      <!-- High Impact Hero -->
      <section class="bg-gradient-to-r from-[#130f2e] via-[#07091e] to-[#0d111a] border border-[#8b5cf6]/40 p-8 sm:p-14 rounded-3xl text-center relative overflow-hidden">
        <span class="font-mono-code text-xs text-[#8b5cf6] uppercase tracking-widest">// HIGH CONVERSION LANDING</span>
        <h1 class="font-syne text-4xl sm:text-6xl font-extrabold uppercase text-white mt-4 mb-6 leading-tight">${title}</h1>
        <p class="font-mono-code text-white/80 text-sm max-w-2xl mx-auto mb-8">${heroSubtitle || ''}</p>
        
        <div class="flex flex-col sm:flex-row gap-4 justify-center">
          <button onclick="openContactModal()" class="bg-[#8b5cf6] hover:bg-[#7c3aed] text-white font-syne font-bold px-8 py-4 rounded-xl text-xs uppercase tracking-widest transition-all">
            Рассчитать стоимость &rarr;
          </button>
          <a href="#portfolio" class="bg-white/5 hover:bg-white/10 border border-white/10 text-white font-syne font-bold px-8 py-4 rounded-xl text-xs uppercase tracking-widest transition-all">
            Смотреть кейсы
          </a>
        </div>
      </section>

      <!-- Card Grid -->
      <section class="grid grid-cols-1 md:grid-cols-3 gap-6">
        ${(problems || []).map((p, i) => `
          <div class="bg-[#07091e] border border-white/10 p-6 rounded-2xl flex flex-col justify-between">
            <div>
              <div class="font-mono-code text-xs text-[#8b5cf6] mb-2">FEATURE 0${i+1}</div>
              <h3 class="font-syne text-lg font-bold text-white mb-2">${p.title || p}</h3>
              <p class="font-mono-code text-xs text-white/60">${p.desc || 'Разработка решений с упором на конверсию.'}</p>
            </div>
          </div>
        `).join('')}
      </section>

      ${sharedBlocks.portfolioSection}
      ${sharedBlocks.faqSection}
      ${sharedBlocks.relatedServices}
    </div>
  `;
};