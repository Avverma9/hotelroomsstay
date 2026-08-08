const express = require('express');
const axios = require('axios');
const sharp = require('sharp');
const router = express.Router();

// Simple thumbnail proxy: fetches remote image and returns a resized webp
router.get('/thumbnail', async (req, res) => {
  const { url, w = 400, q = 80 } = req.query;
  if (!url) return res.status(400).send('url query required');
  try {
    const response = await axios.get(url, { responseType: 'arraybuffer', timeout: 15000 });
    const buffer = Buffer.from(response.data, 'binary');
    const width = Math.min(Number(w) || 400, 2000);
    const quality = Math.min(Math.max(Number(q) || 80, 10), 100);

    const out = await sharp(buffer).resize({ width }).webp({ quality }).toBuffer();
    res.set('Content-Type', 'image/webp');
    res.set('Cache-Control', 'public, max-age=86400');
    return res.send(out);
  } catch (err) {
    console.error('thumbnail proxy error:', err.message || err);
    return res.status(502).send('thumbnail proxy error');
  }
});

module.exports = router;
