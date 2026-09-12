const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.join(__dirname, '../..');
const PAGES_DIR = path.join(__dirname, '../data/pages');
const TEMPLATE_PATH = path.join(__dirname, 'template_base.html');
const INDEX_PATH = path.join(ROOT_DIR, 'index.html');
const SERVICES_DIR = path.join(ROOT_DIR, 'services');
const SITEMAP_PATH = path.join(ROOT_DIR, 'sitemap.xml');
const BASE_URL = 'https://agency-website-virid-rho.vercel.app';

if (!fs.existsSync(SERVICES_DIR)) {
  fs.mkdirSync(SERVICES_DIR, { recursive: true });
}

// 1. ИЗВЛЕЧЕНИЕ ПОРТФОЛИО ИЗ INDEX.HTML
let portfolioSectionHtml = '';
if (fs.existsSync(INDEX_PATH)) {
  const indexHtml = fs.readFileSync(INDEX_PATH, 'utf-8');
  const match = indexHtml.match(/<section[^>]*id=["'](?:cases|portfolio)["'][^>]*>([\s\S]*?)<\/section>/i);
  
  if (match) {
    portfolioSectionHtml = match[0]
      .replace(/src=["']\.\/assets\//g, 'src="../assets/')
      .replace(/src=["']assets\//g, 'src="../assets/')
      .replace(/href=["']\.\/assets\//g, 'href="../assets/')
      .replace(/href=["']assets\//g, 'href="../assets/')
      .replace(/data-case=/g, 'data-disabled-case=')
      .replace(/href=["']#["']/g, 'href="../index.html#cases"');
  }
}

if (!fs.existsSync(PAGES_DIR)) {
  console.error(`❌ Папка ${PAGES_DIR} не найдена!`);
  process.exit(1);
}

const pageFiles = fs.readdirSync(PAGES_DIR).filter(file => file.endsWith('.json'));
const templateHtml = fs.readFileSync(TEMPLATE_PATH, 'utf-8');

let sitemapUrls = [`  <url>\n    <loc>${BASE_URL}/</loc>\n    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>\n    <priority>1.0</priority>\n  </url>`];

console.log(`🚀 Сборка ${pageFiles.length} HTML-страниц...`);

pageFiles.forEach((file) => {
  const pageData = JSON.parse(fs.readFileSync(path.join(PAGES_DIR, file), 'utf-8'));
  
  // ИСПРАВЛЕНИЕ: Объявление pageSlug и pageUrl
  let rawSlug = pageData.slug || file.replace('.json', '');
  const pageSlug = rawSlug.endsWith('.html') ? rawSlug : `${rawSlug}.html`;
  const pageUrl = `${BASE_URL}/services/${pageSlug}`;

  // NORMALIZE KEYS (поддержка обеих схем JSON)
  const seo = pageData.seo || {};
  const hero = pageData.hero || {};
  
  const valueProps = pageData.value_props || pageData.features || [];
  const techStack = pageData.technical_stack || [];
  const businessProblems = pageData.business_problems || pageData.problem_solution || [];
  
  const rawFaq = pageData.faq || [];
  const faq = rawFaq.map(f => ({
    question: f.question || f.q || '',
    answer: f.answer || f.a || ''
  }));
  
  const templateId = String(pageData.template_id || 'template_1');

  // Хелперы элементов
  const renderTechStack = () => techStack.length ? `
    <div class="my-6">
      <div class="font-mono-code text-xs text-[#8b5cf6] tracking-widest uppercase mb-3">// СТЕК</div>
      <div class="flex flex-wrap gap-2">
        ${techStack.map(t => `<span class="px-3 py-1.5 bg-[#07091e] border border-white/10 rounded-lg text-xs font-mono-code text-white/80">${t}</span>`).join('')}
      </div>
    </div>` : '';

  const renderValueProps = () => valueProps.length ? `
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6 my-8">
      ${valueProps.map(v => `
        <div class="p-6 bg-[#07091e]/80 border border-white/10 rounded-xl">
          <h3 class="font-syne font-bold text-lg text-white mb-2">${v.title || ''}</h3>
          <p class="text-white/70 text-xs font-light leading-relaxed">${v.desc || v.description || ''}</p>
        </div>
      `).join('')}
    </div>` : '';

  const renderProblems = () => businessProblems.length ? `
    <div class="my-8">
      <h2 class="font-syne text-xl font-bold uppercase mb-6 text-white">// ЗАДАЧИ И РЕШЕНИЯ</h2>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        ${businessProblems.map(p => `
          <div class="p-5 bg-black/50 border border-white/10 rounded-xl">
            <div class="text-red-400 text-xs font-semibold mb-2">✕ ${p.problem}</div>
            <div class="text-emerald-400 text-xs font-semibold">✓ ${p.solution}</div>
          </div>
        `).join('')}
      </div>
    </div>` : '';

  // Секция FAQ
  const renderFAQ = () => faq.length ? `
    <section class="my-12">
      <h2 class="font-syne text-2xl font-bold uppercase mb-6 text-white">// ВОПРОСЫ И ОТВЕТЫ</h2>
      <div class="space-y-4">
        ${faq.map(f => `
          <details class="p-5 bg-[#07091e]/60 border border-white/10 rounded-xl group">
            <summary class="font-syne font-bold text-base text-white cursor-pointer flex justify-between items-center list-none">
              <span>${f.question}</span>
              <span class="text-[#8b5cf6] group-open:rotate-180 transition-transform">+</span>
            </summary>
            <p class="font-mono-code text-xs text-white/70 mt-4 leading-relaxed">${f.answer}</p>
          </details>
        `).join('')}
      </div>
    </section>` : '';

  // Другие услуги
  const relatedLinks = pageFiles
    .filter(f => f !== file)
    .slice(0, 4)
    .map(relFile => {
      const relData = JSON.parse(fs.readFileSync(path.join(PAGES_DIR, relFile), 'utf-8'));
      const relSlug = (relData.slug || relFile.replace('.json', '')).replace(/\.html$/, '') + '.html';
      return `
        <a href="/services/${relSlug}" class="p-4 border border-white/10 rounded-xl hover:border-[#8b5cf6] hover:bg-[#8b5cf6]/5 transition-all block group">
          <div class="font-mono-code text-[10px] text-[#8b5cf6] uppercase mb-1">// НАПРАВЛЕНИЕ</div>
          <div class="font-syne text-xs font-bold text-white group-hover:text-[#8b5cf6] transition-colors uppercase">${relData.seo?.h1 || relData.hero?.title || relData.slug} &rarr;</div>
        </a>`;
    }).join('');

  const renderRelated = () => `
    <section class="my-12">
      <h2 class="font-syne text-lg font-bold uppercase mb-4 text-white/80">// ДРУГИЕ УСЛУГИ</h2>
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">${relatedLinks}</div>
    </section>`;

  // 7 Вариантов Верстки Сетки
  let layoutContent = '';

  switch (templateId) {
    case 'template_2': // Clean SaaS / Split
      layoutContent = `
        <div class="max-w-6xl mx-auto px-6 py-12 space-y-12">
          <section class="text-center max-w-3xl mx-auto pt-6">
            <span class="font-mono-code text-xs text-[#8b5cf6] tracking-widest uppercase mb-4 block">// ${hero.badge || 'SAAS SYSTEM'}</span>
            <h1 class="font-syne text-4xl sm:text-6xl font-bold uppercase tracking-tight mb-6 text-white">${seo.h1 || hero.title}</h1>
            <p class="text-base text-white/70 font-light mb-8">${hero.subtitle || seo.description}</p>
            <button onclick="openContactModal()" class="bg-white text-black hover:bg-white/90 font-syne font-bold px-8 py-4 rounded-xl text-xs uppercase tracking-widest">Обсудить проект &rarr;</button>
          </section>
          ${renderProblems()} ${renderValueProps()} ${portfolioSectionHtml} ${renderFAQ()} ${renderRelated()}
        </div>`;
      break;

    case 'template_3': // Sticky Sidebar Layout
      layoutContent = `
        <div class="max-w-7xl mx-auto px-6 py-12">
          <div class="grid grid-cols-1 lg:grid-cols-12 gap-12">
            <aside class="lg:col-span-4 lg:sticky lg:top-32 h-fit space-y-6">
              <span class="font-mono-code text-xs text-[#8b5cf6] uppercase tracking-widest">// STUDIO LAYOUT</span>
              <h1 class="font-syne text-3xl sm:text-5xl font-extrabold uppercase text-white leading-tight">${seo.h1 || hero.title}</h1>
              <p class="font-mono-code text-xs text-white/60 leading-relaxed">${hero.subtitle || seo.description}</p>
              <button onclick="openContactModal()" class="w-full bg-[#8b5cf6] hover:bg-[#7c3aed] text-white font-syne py-4 rounded-xl text-xs font-bold uppercase tracking-widest">Связаться</button>
            </aside>
            <main class="lg:col-span-8 space-y-8">
              ${renderValueProps()} ${renderProblems()} ${renderTechStack()} ${portfolioSectionHtml} ${renderFAQ()} ${renderRelated()}
            </main>
          </div>
        </div>`;
      break;

    case 'template_4': // Cyber Terminal Style
      layoutContent = `
        <div class="max-w-7xl mx-auto px-6 py-12 space-y-12">
          <section class="bg-[#02030a] border border-[#8b5cf6]/40 rounded-2xl p-8 font-mono-code">
            <div class="text-[#8b5cf6] text-xs mb-2">// TERMINAL INITIALIZED</div>
            <h1 class="font-syne text-3xl sm:text-5xl font-extrabold uppercase text-white mb-4">${seo.h1 || hero.title}</h1>
            <p class="text-xs text-white/60">$ ${hero.subtitle || seo.description}</p>
          </section>
          ${renderProblems()} ${renderTechStack()} ${portfolioSectionHtml} ${renderFAQ()} ${renderRelated()}
        </div>`;
      break;

    case 'template_5': // Enterprise Metrics First
      layoutContent = `
        <div class="max-w-7xl mx-auto px-6 py-12 space-y-12">
          <section class="border-b border-white/10 pb-8">
            <span class="font-mono-code text-xs text-[#8b5cf6] tracking-widest uppercase mb-2 block">// ENTERPRISE</span>
            <h1 class="font-syne text-4xl sm:text-6xl font-extrabold uppercase text-white mb-4">${seo.h1 || hero.title}</h1>
            <p class="font-mono-code text-white/70 text-sm max-w-3xl mb-6">${hero.subtitle || seo.description}</p>
          </section>
          ${portfolioSectionHtml} ${renderValueProps()} ${renderProblems()} ${renderFAQ()} ${renderRelated()}
        </div>`;
      break;

    case 'template_6': // Centered Flow
      layoutContent = `
        <div class="max-w-6xl mx-auto px-6 py-12 space-y-12">
          <section class="text-center">
            <span class="font-mono-code text-xs text-[#8b5cf6] tracking-widest uppercase mb-2 block">// WORKFLOW</span>
            <h1 class="font-syne text-4xl sm:text-6xl font-extrabold uppercase text-white mb-4">${seo.h1 || hero.title}</h1>
            <p class="font-mono-code text-white/60 text-xs max-w-2xl mx-auto">${hero.subtitle || seo.description}</p>
          </section>
          ${renderValueProps()} ${renderProblems()} ${portfolioSectionHtml} ${renderFAQ()} ${renderRelated()}
        </div>`;
      break;

    case 'template_7': // High Conversion Box
      layoutContent = `
        <div class="max-w-7xl mx-auto px-6 py-12 space-y-12">
          <section class="bg-gradient-to-r from-[#130f2e] to-[#07091e] border border-[#8b5cf6]/40 p-8 sm:p-12 rounded-3xl text-center">
            <h1 class="font-syne text-4xl sm:text-6xl font-extrabold uppercase text-white mb-4">${seo.h1 || hero.title}</h1>
            <p class="font-mono-code text-white/80 text-sm max-w-2xl mx-auto mb-6">${hero.subtitle || seo.description}</p>
            <button onclick="openContactModal()" class="bg-[#8b5cf6] hover:bg-[#7c3aed] text-white font-syne font-bold px-8 py-4 rounded-xl text-xs uppercase tracking-widest">Заказать расчет</button>
          </section>
          ${renderProblems()} ${portfolioSectionHtml} ${renderFAQ()} ${renderRelated()}
        </div>`;
      break;

    case 'template_1':
    default: // Bento Grid Classic
      layoutContent = `
        <div class="max-w-7xl mx-auto px-6 py-12 space-y-12">
          <section class="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div class="lg:col-span-8 bg-gradient-to-br from-[#0b0f29] to-[#07091e] border border-white/10 p-8 rounded-3xl">
              <span class="font-mono-code text-xs text-[#8b5cf6] tracking-widest uppercase">// BENTO SYSTEM</span>
              <h1 class="font-syne text-4xl sm:text-6xl font-extrabold uppercase text-white mt-4 mb-4">${seo.h1 || hero.title}</h1>
              <p class="font-mono-code text-white/70 text-xs">${hero.subtitle || seo.description}</p>
            </div>
            <div class="lg:col-span-4 bg-[#8b5cf6]/10 border border-[#8b5cf6]/30 p-8 rounded-3xl flex flex-col justify-between">
              <div class="font-syne text-xl font-bold text-white mb-4">БЫСТРЫЙ СТАРТ</div>
              <button onclick="openContactModal()" class="w-full bg-[#8b5cf6] hover:bg-[#7c3aed] text-white font-syne py-4 rounded-xl text-xs font-bold uppercase tracking-widest">Заказать</button>
            </div>
          </section>
          ${renderValueProps()} ${renderProblems()} ${renderTechStack()} ${portfolioSectionHtml} ${renderFAQ()} ${renderRelated()}
        </div>`;
      break;
  }

  // SCHEMAS JSON-LD
  const serviceSchema = {
    "@context": "https://schema.org",
    "@type": "Service",
    "name": seo.h1 || hero.title,
    "description": seo.description,
    "provider": { "@type": "Organization", "name": "BOS.AGENCE", "url": BASE_URL }
  };

  const faqSchema = faq.length ? {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": faq.map(f => ({
      "@type": "Question",
      "name": f.question,
      "acceptedAnswer": { "@type": "Answer", "text": f.answer }
    }))
  } : null;

  const schemaScript = `
    <script type="application/ld+json">${JSON.stringify(serviceSchema)}</script>
    ${faqSchema ? `<script type="application/ld+json">${JSON.stringify(faqSchema)}</script>` : ''}
  `;

  // СБОРКА И СОХРАНЕНИЕ
  let pageContent = templateHtml
    .replace('{{META_TITLE}}', seo.title || seo.h1)
    .replace('{{META_DESCRIPTION}}', seo.description)
    .replace('{{CANONICAL_URL}}', pageUrl)
    .replace('{{SCHEMA_JSON}}', schemaScript)
    .replace('{{LAYOUT_CONTENT}}', layoutContent);

  const targetFilePath = path.join(SERVICES_DIR, pageSlug);
  fs.writeFileSync(targetFilePath, pageContent, 'utf-8');
  console.log(`[+] Сгенерирована страница: /services/${pageSlug} (${templateId})`);

  sitemapUrls.push(`  <url>\n    <loc>${pageUrl}</loc>\n    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>\n    <priority>0.8</priority>\n  </url>`);
});

// Авто-обновление блока услуг на главной странице (index.html)
if (fs.existsSync(INDEX_PATH)) {
  let indexContent = fs.readFileSync(INDEX_PATH, 'utf-8');

  // Берем только первые 6 услуг для главной страницы
  const topServices = pageFiles.slice(0, 6);

  const serviceCardsHtml = topServices.map(file => {
    const pageData = JSON.parse(fs.readFileSync(path.join(PAGES_DIR, file), 'utf-8'));
    const rawSlug = (pageData.slug || file.replace('.json', '')).replace(/\.html$/, '');
    
    // Форматируем заголовок с заглавной буквы
    let title = pageData.seo?.h1 || pageData.hero?.title || rawSlug;
    title = title.charAt(0).toUpperCase() + title.slice(1);

    const desc = pageData.seo?.description || 'Индивидуальная разработка и автоматизация бизнес-процессов.';

    return `
      <a href="/services/${rawSlug}" class="p-6 bg-[#07091e] border border-white/10 rounded-2xl hover:border-[#8b5cf6] hover:bg-[#8b5cf6]/5 transition-all group block">
        <div class="font-mono-code text-[10px] text-[#8b5cf6] uppercase tracking-widest mb-3">// НАПРАВЛЕНИЕ</div>
        <h3 class="font-syne text-lg font-bold uppercase text-white mb-2 group-hover:text-[#8b5cf6] transition-colors leading-snug">${title} &rarr;</h3>
        <p class="font-mono-code text-xs text-white/60 line-clamp-2 leading-relaxed">${desc}</p>
      </a>`;
  }).join('\n');

  const servicesContainerHtml = `<!-- DYNAMIC_SERVICES_START -->
<section id="seo-services" class="max-w-7xl mx-auto px-6 py-20 border-t border-white/10">
  <div class="flex flex-col md:flex-row justify-between items-start md:items-end mb-12 gap-4">
    <div>
      <div class="font-mono-code text-xs text-[#8b5cf6] tracking-widest uppercase mb-2">// НАПРАВЛЕНИЯ РАЗРАБОТКИ</div>
      <h2 class="font-syne text-3xl sm:text-5xl font-bold uppercase text-white tracking-tight">УСЛУГИ & AI-РЕШЕНИЯ</h2>
    </div>
    <p class="font-mono-code text-xs text-white/50 max-w-sm uppercase">Проектируем цифровые продукты под задачи вашего бизнеса с фокусировкой на SEO и конверсию.</p>
  </div>

  <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
    ${serviceCardsHtml}
  </div>

  <div class="text-center pt-4">
    <a href="/services/tsena-sayta" class="inline-flex items-center gap-3 bg-white/5 hover:bg-[#8b5cf6] border border-white/10 hover:border-[#8b5cf6] text-white font-mono-code text-xs font-semibold px-8 py-4 rounded-xl transition-all uppercase tracking-widest">
      <span>Смотреть все направления (${pageFiles.length})</span>
      <span>&rarr;</span>
    </a>
  </div>
</section>
<!-- DYNAMIC_SERVICES_END -->`;

  if (indexContent.includes('<!-- DYNAMIC_SERVICES_START -->')) {
    indexContent = indexContent.replace(
      /<!-- DYNAMIC_SERVICES_START -->[\s\S]*?<!-- DYNAMIC_SERVICES_END -->/,
      servicesContainerHtml
    );
  } else if (indexContent.includes('</main>')) {
    indexContent = indexContent.replace('</main>', `${servicesContainerHtml}\n</main>`);
  }

  fs.writeFileSync(INDEX_PATH, indexContent, 'utf-8');
  console.log('✅ Главная страница (index.html) успешно обновлена (топ-6 аккуратных карточек)!');
}

// Sitemap
const sitemapContent = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${sitemapUrls.join('\n')}\n</urlset>`;
fs.writeFileSync(SITEMAP_PATH, sitemapContent, 'utf-8');
console.log('✅ Sitemap.xml успешно обновлен!');