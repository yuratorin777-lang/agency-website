const GAS_URL = process.env.OUTREACH_GAS_URL;
const GAS_SECRET = process.env.OUTREACH_GAS_SECRET;

module.exports = async function handler(req, res) {

  const id = String(
    (req.query && req.query.id) || ''
  ).trim();

  // Всегда возвращаем картинку,
  // даже если фиксация события не удалась.
  try {

    if (id && GAS_URL && GAS_SECRET) {

      await fetch(GAS_URL, {
        method: 'POST',

        headers: {
          'Content-Type': 'application/json'
        },

        body: JSON.stringify({
          action: 'open',
          id: id,
          secret: GAS_SECRET
        })
      });

    }

  } catch (error) {

    // Ошибка трекинга не должна ломать письмо.
    console.error('OPEN TRACKING ERROR:', error);

  }

  // Прозрачный 1×1 GIF
  const pixel = Buffer.from(
    'R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==',
    'base64'
  );

  res.statusCode = 200;

  res.setHeader(
    'Content-Type',
    'image/gif'
  );

  res.setHeader(
    'Content-Length',
    pixel.length
  );

  res.setHeader(
    'Cache-Control',
    'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0'
  );

  res.setHeader(
    'Pragma',
    'no-cache'
  );

  res.end(pixel);
};