module.exports = function renderTemplate4(data, sharedBlocks) {
  const { title, heroSubtitle, problems, techStack } = data;

  return `
    <div class="max-w-7xl mx-auto px-6 py-12 space-y-16">
      <!-- Terminal Header -->
      <section class="bg-[#02030a] border border-[#8b5cf6]/40 rounded-2xl overflow-hidden shadow-[0_0_50px_rgba(139,92,246,0.15)]">
        <div class="bg-white/5 px-4 py-3 border-b border-white/10 flex items-center justify-between font-mono-code text-xs text-white/40">
          <div class="flex gap-2">
            <span class="w-3 h-3 rounded-full bg-red-500/80"></span>
            <span class="w-3 h-3 rounded-full bg-yellow-500/80"></span>
            <span class="w-3 h-3 rounded-full bg-green-500/80"></span>
          </div>
          <span>bash --root@bos-agence:~</span>
        </div>
        <div class="p-8 font-mono-code space-y-4">
          <div class="text-[#8b5cf6] text-xs">// INITIALIZING SYSTEM SERVICE</div>
          <h1 class="font-syne text-3xl sm:text-5xl font-extrabold uppercase text-white">${title}</h1>
          <p class="text-xs text-white/60 leading-relaxed">$ ${heroSubtitle || 'Executing deployment pipeline...'}</p>
        </div>
      </section>

      <!-- Terminal Comparison Grid -->
      <section class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div class="bg-[#07091e] border border-red-500/20 p-6 rounded-2xl">
          <div class="font-mono-code text-xs text-red-400 mb-4">// WITHOUT BOS.AGENCE</div>
          <ul class="font-mono-code text-xs text-white/50 space-y-3">
            <li>- Медленная загрузка страниц (>4 сек)</li>
            <li>- Низкая конверсия в заявку</li>
            <li>- Шаблонный дизайн без айдентики</li>
          </ul>
        </div>
        <div class="bg-[#07091e] border border-green-500/30 p-6 rounded-2xl">
          <div class="font-mono-code text-xs text-green-400 mb-4">// WITH BOS.AGENCE SYSTEM</div>
          <ul class="font-mono-code text-xs text-white/90 space-y-3">
            <li>+ Скорость отклика &lt; 0.5 сек</li>
            <li>+ Индивидуальная интерактивная 3D/Canvas графика</li>
            <li>+ Автоматизация заявок и сквозная аналитика</li>
          </ul>
        </div>
      </section>

      ${sharedBlocks.portfolioSection}
      ${sharedBlocks.faqSection}
      ${sharedBlocks.relatedServices}
    </div>
  `;
};