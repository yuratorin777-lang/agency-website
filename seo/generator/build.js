const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.join(__dirname, '../..');
const PAGES_DIR = path.join(__dirname, '../data/pages');
const MODULES_DIR = path.join(__dirname, 'modules');
const INDEX_PATH = path.join(ROOT_DIR, 'index.html');
const SITEMAP_PATH = path.join(ROOT_DIR, 'sitemap.xml');
const BASE_URL = 'https://agency-website-virid-rho.vercel.app';

// 1. ПОДГОТОВКА ЦЕЛЕВЫХ ДИРЕКТОРИЙ
const DIRS = {
  service: path.join(ROOT_DIR, 'services'),
  blog: path.join(ROOT_DIR, 'blog'),
  case: path.join(ROOT_DIR, 'cases'),
  tool: path.join(ROOT_DIR, 'tools')
};

Object.values(DIRS).forEach(dir => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

// 2. ЗАГРУЗКА БАЗОВЫХ ШАБЛОНОВ И МОДУЛЕЙ
const baseTemplate = fs.existsSync(path.join(__dirname, 'template_base.html')) 
  ? fs.readFileSync(path.join(__dirname, 'template_base.html'), 'utf-8') : '';
const headModule = fs.existsSync(path.join(MODULES_DIR, 'head.html')) 
  ? fs.readFileSync(path.join(MODULES_DIR, 'head.html'), 'utf-8') : '';

const headerMatch = baseTemplate.match(/<header[\s\S]*?<\/header>/i);
const footerMatch = baseTemplate.match(/<footer[\s\S]*?<\/footer>/i);
const modalMatch = baseTemplate.match(/<div id="contact-modal"[\s\S]*?<\/form>\s*<\/div>\s*<\/div>\s*<\/div>/i);

const headerModule = headerMatch ? headerMatch[0] : '';
const footerModule = footerMatch ? footerMatch[0] : '';
const modalModule = modalMatch ? modalMatch[0] : '';

function getTemplateHtml(type) {
  const customPath = path.join(__dirname, `template_${type}.html`);
  if (type && type !== 'service' && fs.existsSync(customPath)) {
    return fs.readFileSync(customPath, 'utf-8');
  }
  return baseTemplate;
}

// 3. ИЗВЛЕЧЕНИЕ ПОРТФОЛИО ИЗ INDEX.HTML
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
let sitemapUrls = [`  <url>\n    <loc>${BASE_URL}/</loc>\n    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>\n    <priority>1.0</priority>\n  </url>`];

console.log(`🚀 Сборка ${pageFiles.length} HTML-страниц...`);

pageFiles.forEach((file) => {
  const pageData = JSON.parse(fs.readFileSync(path.join(PAGES_DIR, file), 'utf-8'));
  const templateType = pageData.template_type || pageData.type || 'service';
  let currentTemplateHtml = getTemplateHtml(templateType);

  let rawSlug = pageData.slug || file.replace('.json', '');
  const pageSlug = rawSlug.endsWith('.html') ? rawSlug : `${rawSlug}.html`;
  
  const targetDir = DIRS[templateType] || DIRS.service;
  const folderName = templateType === 'service' ? 'services' : templateType === 'case' ? 'cases' : templateType === 'blog' ? 'blog' : 'tools';
  const pageUrl = `${BASE_URL}/${folderName}/${pageSlug}`;

  const seo = pageData.seo || {};
  const hero = pageData.hero || {};
  let schemaScript = '';

  // ПОДСТАНОВКА ДАННЫХ ПО ТИПАМ ШАБЛОНОВ
  if (templateType === 'blog') {
    const tocLinks = (pageData.toc || []).map(item => 
      `<a href="#${item.id}" class="block hover:text-neutral-900 transition-colors py-1">${item.title}</a>`
    ).join('');

    const relatedPosts = pageFiles
      .filter(f => f !== file)
      .slice(0, 3)
      .map(relFile => {
        const relData = JSON.parse(fs.readFileSync(path.join(PAGES_DIR, relFile), 'utf-8'));
        const relSlug = (relData.slug || relFile.replace('.json', '')).replace(/\.html$/, '') + '.html';
        return `
          <a href="../blog/${relSlug}" class="p-6 bg-neutral-50 border border-neutral-200 rounded-2xl hover:border-neutral-400 transition-all block group">
            <div class="font-mono text-xs text-neutral-400 uppercase mb-2">// ${relData.category || 'СТАТЬЯ'}</div>
            <div class="text-sm font-semibold text-neutral-900 group-hover:text-neutral-600 transition-colors">${relData.seo?.title || relData.slug} &rarr;</div>
          </a>`;
      }).join('');

    currentTemplateHtml = currentTemplateHtml
      .replace('{{ARTICLE_CATEGORY}}', pageData.category || 'БЛОГ')
      .replace('{{ARTICLE_TITLE}}', seo.title || hero.title || '')
      .replace('{{AUTHOR_AVATAR}}', pageData.author?.avatar || '../assets/images/author-default.png')
      .replace('{{AUTHOR_NAME}}', pageData.author?.name || 'BOS.AGENCE')
      .replace('{{AUTHOR_ROLE}}', pageData.author?.role || 'Digital & AI Team')
      .replace('{{PUBLISH_DATE}}', pageData.publish_date || '')
      .replace('{{READ_TIME}}', pageData.read_time || '5')
      .replace('{{TOC_LINKS}}', tocLinks)
      .replace('{{ARTICLE_BODY}}', pageData.body || '')
      .replace('{{RELATED_POSTS}}', relatedPosts);

  } else if (templateType === 'case') {
    const stackTags = (pageData.stack || []).map(tag => 
      `<span class="px-3 py-1 bg-neutral-100 border border-neutral-200 rounded-lg text-xs font-mono text-neutral-800">${tag}</span>`
    ).join('');

    const metricsBlocks = (pageData.metrics || []).map(m => `
      <div class="text-center">
        <div class="text-2xl sm:text-4xl font-light text-neutral-900 mb-1">${m.value}</div>
        <div class="font-mono text-xs text-neutral-400 uppercase">${m.label}</div>
      </div>
    `).join('');

    currentTemplateHtml = currentTemplateHtml
      .replace('{{CLIENT_NAME}}', pageData.client_name || 'CLIENT')
      .replace('{{CASE_TITLE}}', seo.title || hero.title || '')
      .replace('{{CASE_METRICS}}', metricsBlocks)
      .replace('{{CASE_PROBLEM}}', pageData.problem || '')
      .replace('{{CASE_SOLUTION}}', pageData.solution || '')
      .replace('{{CASE_STACK}}', stackTags);

  } else if (templateType === 'tool') {
    const checklistItems = (pageData.checklist || []).map((item, idx) => `
      <div class="p-6 bg-neutral-50 border border-neutral-200 rounded-2xl flex items-start gap-4">
        <span class="font-mono text-neutral-400 font-semibold text-sm">0${idx + 1}.</span>
        <div>
          <h3 class="text-base font-semibold text-neutral-900 mb-1">${item.title}</h3>
          <p class="font-mono text-xs text-neutral-600 leading-relaxed">${item.desc}</p>
        </div>
      </div>
    `).join('');

    currentTemplateHtml = currentTemplateHtml
      .replace(/{{TOOL_TITLE}}/g, seo.title || hero.title || '')
      .replace('{{TOOL_DESCRIPTION}}', pageData.description || seo.description || '')
      .replace('{{RESOURCE_DOWNLOAD_LINK}}', pageData.download_link || '#')
      .replace('{{CHECKLIST_ITEMS}}', checklistItems);

  } else {
    // ЛОГИКА ДЛЯ УСЛУГ (SERVICE)
    const valueProps = pageData.value_props || pageData.features || [];
    const techStack = pageData.technical_stack || [];
    const businessProblems = pageData.business_problems || pageData.problem_solution || [];
    const rawFaq = pageData.faq || [];
    const faq = rawFaq.map(f => ({ question: f.question || f.q || '', answer: f.answer || f.a || '' }));
    const templateId = String(pageData.template_id || 'template_1');

    const renderTechStack = () => techStack.length ? `
      <div class="my-6"><div class="font-mono-code text-xs text-[#8b5cf6] tracking-widest uppercase mb-3">// СТЕК</div>
      <div class="flex flex-wrap gap-2">${techStack.map(t => `<span class="px-3 py-1.5 bg-[#07091e] border border-white/10 rounded-lg text-xs font-mono-code text-white/80">${t}</span>`).join('')}</div></div>` : '';

    const renderValueProps = () => valueProps.length ? `
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6 my-8">${valueProps.map(v => `
        <div class="p-6 bg-[#07091e]/80 border border-white/10 rounded-xl">
          <h3 class="font-syne font-bold text-lg text-white mb-2">${v.title || ''}</h3>
          <p class="text-white/70 text-xs font-light leading-relaxed">${v.desc || v.description || ''}</p>
        </div>`).join('')}</div>` : '';

    const renderProblems = () => businessProblems.length ? `
      <div class="my-8"><h2 class="font-syne text-xl font-bold uppercase mb-6 text-white">// ЗАДАЧИ И РЕШЕНИЯ</h2>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">${businessProblems.map(p => `
        <div class="p-5 bg-black/50 border border-white/10 rounded-xl">
          <div class="text-red-400 text-xs font-semibold mb-2">✕ ${p.problem}</div>
          <div class="text-emerald-400 text-xs font-semibold">✓ ${p.solution}</div>
        </div>`).join('')}</div></div>` : '';

    const renderFAQ = () => faq.length ? `
      <section class="my-12"><h2 class="font-syne text-2xl font-bold uppercase mb-6 text-white">// ВОПРОСЫ И ОТВЕТЫ</h2>
      <div class="space-y-4">${faq.map(f => `
        <details class="p-5 bg-[#07091e]/60 border border-white/10 rounded-xl group">
          <summary class="font-syne font-bold text-base text-white cursor-pointer flex justify-between items-center list-none">
            <span>${f.question}</span><span class="text-[#8b5cf6] group-open:rotate-180 transition-transform">+</span>
          </summary><p class="font-mono-code text-xs text-white/70 mt-4 leading-relaxed">${f.answer}</p>
        </details>`).join('')}</div></section>` : '';

    const relatedLinks = pageFiles.filter(f => f !== file).slice(0, 4).map(relFile => {
      const relData = JSON.parse(fs.readFileSync(path.join(PAGES_DIR, relFile), 'utf-8'));
      const relSlug = (relData.slug || relFile.replace('.json', '')).replace(/\.html$/, '') + '.html';
      return `<a href="/services/${relSlug}" class="p-4 border border-white/10 rounded-xl hover:border-[#8b5cf6] hover:bg-[#8b5cf6]/5 transition-all block group">
        <div class="font-mono-code text-[10px] text-[#8b5cf6] uppercase mb-1">// НАПРАВЛЕНИЕ</div>
        <div class="font-syne text-xs font-bold text-white group-hover:text-[#8b5cf6] transition-colors uppercase">${relData.seo?.h1 || relData.hero?.title || relData.slug} &rarr;</div>
      </a>`;
    }).join('');

    const renderRelated = () => `<section class="my-12"><h2 class="font-syne text-lg font-bold uppercase mb-4 text-white/80">// ДРУГИЕ УСЛУГИ</h2><div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">${relatedLinks}</div></section>`;

    // Генерация секции длинного SEO-текста из text_content (если он есть в JSON)
    let textContentHtml = '';
    if (pageData.text_content) {
      if (pageData.text_content.intro) {
        textContentHtml += `<p class="text-lg text-white/80 font-light leading-relaxed mb-8">${pageData.text_content.intro}</p>`;
      }
      if (Array.isArray(pageData.text_content.sections)) {
        textContentHtml += pageData.text_content.sections.map(sec => `
          <div class="mb-8">
            <h2 class="font-syne text-2xl font-bold uppercase text-white mb-4">${sec.h2}</h2>
            <p class="text-white/70 font-light leading-relaxed">${sec.body}</p>
          </div>
        `).join('');
      }
    }

    let layoutContent = '';

    switch (templateId) {
      case 'template_2':
        layoutContent = `
          <div class="max-w-6xl mx-auto px-6 py-12 space-y-12">
            <section class="text-center max-w-3xl mx-auto pt-6">
              <span class="font-mono-code text-xs text-[#8b5cf6] tracking-widest uppercase mb-4 block">// ${hero.badge || 'SAAS SYSTEM'}</span>
              <h1 class="font-syne text-4xl sm:text-6xl font-bold uppercase tracking-tight mb-6 text-white">${seo.h1 || hero.title}</h1>
              <p class="text-base text-white/70 font-light mb-8">${hero.subtitle || seo.description}</p>
              <button onclick="openContactModal()" class="bg-white text-black hover:bg-white/90 font-syne font-bold px-8 py-4 rounded-xl text-xs uppercase tracking-widest">Обсудить проект &rarr;</button>
            </section>
            ${textContentHtml} ${renderProblems()} ${renderValueProps()} ${portfolioSectionHtml} ${renderFAQ()} ${renderRelated()}
          </div>`;
        break;

      case 'template_1':
      default:
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
            ${textContentHtml} ${renderValueProps()} ${renderProblems()} ${renderTechStack()} ${portfolioSectionHtml} ${renderFAQ()} ${renderRelated()}
          </div>`;
        break;
    }

    currentTemplateHtml = currentTemplateHtml.replace('{{LAYOUT_CONTENT}}', layoutContent);

    // Schema JSON-LD для услуг
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

    schemaScript = `
      <script type="application/ld+json">${JSON.stringify(serviceSchema)}</script>
      ${faqSchema ? `<script type="application/ld+json">${JSON.stringify(faqSchema)}</script>` : ''}
    `;
  }

  // ОБЩИЕ МЕТА-ТЕГИ И МОДУЛИ
  let pageContent = currentTemplateHtml
    .replace('{{HEAD_MODULE}}', headModule)
    .replace('{{HEADER_MODULE}}', headerModule)
    .replace('{{FOOTER_MODULE}}', footerModule)
    .replace('{{MODAL_MODULE}}', modalModule)
    .replace(/{{META_TITLE}}/g, seo.title || hero.title || '')
    .replace(/{{META_DESCRIPTION}}/g, seo.description || '')
    .replace(/{{CANONICAL_URL}}/g, pageUrl)
    .replace('{{SCHEMA_JSON}}', schemaScript);

  const targetFilePath = path.join(targetDir, pageSlug);
  fs.writeFileSync(targetFilePath, pageContent, 'utf-8');
  console.log(`[+] Сгенерирована страница: /${folderName}/${pageSlug} (Type: ${templateType})`);

  sitemapUrls.push(`  <url>\n    <loc>${pageUrl}</loc>\n    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>\n    <priority>0.8</priority>\n  </url>`);
});

// 4. ДИНАМИЧЕСКОЕ ОБНОВЛЕНИЕ БЛОКА УСЛУГ НА ГЛАВНОЙ (INDEX.HTML)
if (fs.existsSync(INDEX_PATH)) {
  let indexContent = fs.readFileSync(INDEX_PATH, 'utf-8');
  const serviceFiles = pageFiles.filter(file => {
    const data = JSON.parse(fs.readFileSync(path.join(PAGES_DIR, file), 'utf-8'));
    return (data.template_type || data.type || 'service') === 'service';
  });

  const topServices = serviceFiles.slice(0, 6);
  const serviceCardsHtml = topServices.map(file => {
    const pageData = JSON.parse(fs.readFileSync(path.join(PAGES_DIR, file), 'utf-8'));
    const rawSlug = (pageData.slug || file.replace('.json', '')).replace(/\.html$/, '');
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
  <div class="flex flex-col md:flex-row justify-between items-start md:items-end mb-12">
    <div>
      <span class="font-mono-code text-xs text-[#8b5cf6] tracking-widest uppercase mb-2 block">// КАТАЛОГ УСЛУГ</span>
      <h2 class="font-syne text-3xl sm:text-5xl font-extrabold uppercase text-white">Решения и Экспертиза</h2>
    </div>
  </div>
  <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
    ${serviceCardsHtml}
  </div>
</section>
<!-- DYNAMIC_SERVICES_END -->`;

  if (indexContent.includes('<!-- DYNAMIC_SERVICES_START -->')) {
    indexContent = indexContent.replace(/<!-- DYNAMIC_SERVICES_START -->[\s\S]*?<!-- DYNAMIC_SERVICES_END -->/, servicesContainerHtml);
  } else {
    indexContent = indexContent.replace('</main>', `${servicesContainerHtml}\n</main>`);
  }
  fs.writeFileSync(INDEX_PATH, indexContent, 'utf-8');
  console.log('  Обновлен блок услуг на главной странице (index.html)');
}

// 5. ГЕНЕРАЦИЯ SITEMAP.XML
const sitemapContent = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${sitemapUrls.join('\n')}\n</urlset>`;
fs.writeFileSync(SITEMAP_PATH, sitemapContent, 'utf-8');
console.log(`[+] Сгенерирован sitemap.xml (${sitemapUrls.length} ссылок)`);