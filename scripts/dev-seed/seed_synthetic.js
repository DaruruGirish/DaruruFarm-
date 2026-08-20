const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');
const julyDailyLogs = require('./july_daily_logs');
const { assertDevSeedAllowed, dbConfig } = require('./env');

assertDevSeedAllowed();

const uploadsDir = path.join(__dirname, '..', '..', 'backend', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// CRC32 calculation for PNG chunks
function crc32(buf) {
  let crc = 0xFFFFFFFF;
  for (let i = 0; i < buf.length; i++) {
    crc ^= buf[i];
    for (let j = 0; j < 8; j++) {
      crc = (crc >>> 1) ^ ((crc & 1) ? 0xEDB88320 : 0);
    }
  }
  return (crc ^ 0xFFFFFFFF) >>> 0;
}

// Create a PNG chunk
function createChunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, 'ascii');
  const crcBuf = Buffer.alloc(4);
  const crcVal = crc32(Buffer.concat([typeBuf, data]));
  crcBuf.writeUInt32BE(crcVal, 0);
  return Buffer.concat([len, typeBuf, data, crcBuf]);
}

// Generate valid binary PNG file
function generateBinaryPng(width, height, c1, c2, c3, badgeColor) {
  const sig = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData[8] = 8;  // bit depth
  ihdrData[9] = 6;  // RGBA
  ihdrData[10] = 0;
  ihdrData[11] = 0;
  ihdrData[12] = 0;
  const ihdr = createChunk('IHDR', ihdrData);

  const raw = Buffer.alloc(height * (1 + width * 4));
  let offset = 0;
  const cx = width / 2;
  const cy = height / 2;
  const maxDist = Math.sqrt(cx * cx + cy * cy);

  for (let y = 0; y < height; y++) {
    raw[offset++] = 0; // Filter byte: None
    const ty = y / height;
    for (let x = 0; x < width; x++) {
      const tx = x / width;
      const t = (tx + ty) / 2;

      // Base gradient
      let r = Math.round(c1[0] * (1 - t) + c2[0] * t);
      let g = Math.round(c1[1] * (1 - t) + c2[1] * t);
      let b = Math.round(c1[2] * (1 - t) + c2[2] * t);

      // Subtle diagonal farm field lines pattern
      if ((x + y) % 32 < 2) {
        r = Math.min(255, r + 15);
        g = Math.min(255, g + 15);
        b = Math.min(255, b + 15);
      }

      // Central glowing circle / telemetry sensor badge
      const dx = x - cx;
      const dy = y - cy;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < 90) {
        const ring = Math.abs(dist - 80);
        if (ring < 4) {
          r = badgeColor[0];
          g = badgeColor[1];
          b = badgeColor[2];
        } else if (dist < 80) {
          const ct = dist / 80;
          r = Math.round(badgeColor[0] * 0.4 * (1 - ct) + r * ct);
          g = Math.round(badgeColor[1] * 0.4 * (1 - ct) + g * ct);
          b = Math.round(badgeColor[2] * 0.4 * (1 - ct) + b * ct);
        }
      }

      // Bottom banner overlay bar
      if (y > height - 50) {
        r = Math.round(r * 0.5);
        g = Math.round(g * 0.5);
        b = Math.round(b * 0.5);
      }

      // Top-left & bottom-right border frame
      if (x < 6 || x > width - 6 || y < 6 || y > height - 6) {
        r = badgeColor[0];
        g = badgeColor[1];
        b = badgeColor[2];
      }

      raw[offset++] = Math.min(255, Math.max(0, r));
      raw[offset++] = Math.min(255, Math.max(0, g));
      raw[offset++] = Math.min(255, Math.max(0, b));
      raw[offset++] = 255;
    }
  }

  const idat = createChunk('IDAT', zlib.deflateSync(raw));
  const iend = createChunk('IEND', Buffer.alloc(0));
  return Buffer.concat([sig, ihdr, idat, iend]);
}

const galleryPhotos = [
  {
    filename: 'pomegranate_healthy_1.png',
    caption: 'Healthy pomegranate plant - field canopy check',
    uploadedAt: '2026-07-04 15:00:00',
  },
  {
    filename: 'pomegranate_healthy_fruit.jpg',
    caption: 'Opened healthy fruit - quality and aril check',
    uploadedAt: '2026-07-10 15:00:00',
  },
  {
    filename: 'pomegranate_diseased_leaf.jpg',
    caption: 'Diseased leaf spotted during field scout',
    uploadedAt: '2026-07-16 15:00:00',
  },
  {
    filename: 'pomegranate_cercospora_fruit.jpg',
    caption: 'Cercospora fruit spot sample from orchard walk',
    uploadedAt: '2026-07-22 15:00:00',
  },
  {
    filename: 'pomegranate_infected_fruit.jpg',
    caption: 'Infected fruit - post-rain inspection',
    uploadedAt: '2026-07-27 15:00:00',
  },
];

const farmPhotosDir = path.join(__dirname, 'fixtures');
for (const photo of galleryPhotos) {
  const src = path.join(farmPhotosDir, photo.filename);
  if (!fs.existsSync(src)) {
    throw new Error(`Missing farm photo: ${src}`);
  }
  fs.copyFileSync(src, path.join(uploadsDir, photo.filename));
}

// Disease-event placeholders (gallery uses real Daruru Farm photos above)
const imageSpecs = [
  { name: 'anthracnose-01', c1: [239, 68, 68], c2: [127, 29, 29], c3: [220, 38, 38], badge: [248, 113, 113] },
  { name: 'leaf-curl-01', c1: [245, 158, 11], c2: [120, 53, 15], c3: [217, 119, 6], badge: [251, 191, 36] },
  { name: 'fire-blight-01', c1: [220, 38, 38], c2: [127, 29, 29], c3: [185, 28, 28], badge: [239, 68, 68] },
  { name: 'powdery-mildew-01', c1: [156, 163, 175], c2: [55, 65, 81], c3: [107, 114, 128], badge: [209, 213, 219] },
  { name: 'fruit-spot-01', c1: [217, 119, 6], c2: [120, 53, 15], c3: [180, 83, 9], badge: [245, 158, 11] },
];

imageSpecs.forEach(img => {
  const pngBuffer = generateBinaryPng(640, 420, img.c1, img.c2, img.c3, img.badge);
  fs.writeFileSync(path.join(uploadsDir, `${img.name}.jpg`), pngBuffer);
  fs.writeFileSync(path.join(uploadsDir, `${img.name}.png`), pngBuffer);
});

console.log('Copied Daruru Farm gallery photos and created disease placeholders in backend/uploads.');

async function seed() {
  const conn = await mysql.createConnection(dbConfig());

  console.log('Connected to MySQL daruru_farm database.');

  const [users] = await conn.query('SELECT id, email, name FROM users');
  console.log('Found users:', users.map(u => `${u.id}: ${u.email}`));

  if (users.length === 0) {
    console.error('No users found in database! Please register a user first.');
    await conn.end();
    return;
  }

  // Clear existing data
  await conn.query('DELETE FROM contact_inquiries');
  await conn.query('DELETE FROM gallery_images');
  await conn.query('DELETE FROM disease_events');
  await conn.query('DELETE FROM daily_activities');
  await conn.query('DELETE FROM expenses');
  await conn.query('DELETE FROM farms');

  // Reset auto-increment
  await conn.query('ALTER TABLE farms AUTO_INCREMENT = 1');
  await conn.query('ALTER TABLE expenses AUTO_INCREMENT = 1');
  await conn.query('ALTER TABLE daily_activities AUTO_INCREMENT = 1');
  await conn.query('ALTER TABLE disease_events AUTO_INCREMENT = 1');
  await conn.query('ALTER TABLE gallery_images AUTO_INCREMENT = 1');
  await conn.query('ALTER TABLE contact_inquiries AUTO_INCREMENT = 1');

  for (const user of users) {
    const userId = user.id;
    console.log(`Seeding July 1–30 daily logs and telemetry for user ${userId} (${user.email})...`);

    // 1. Farms
    const [farm1Result] = await conn.query(
      `INSERT INTO farms (name, address, totalAcres, numberOfTrees, cropVariety, cropSeasonStartTime, userId)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      ['Green Valley Mango Estate', 'Mysuru, Karnataka', 20.0, 2350, 'Alphonso Mango', '2026-07-01 09:00:00', userId]
    );
    const farm1Id = farm1Result.insertId;

    const [farm2Result] = await conn.query(
      `INSERT INTO farms (name, address, totalAcres, numberOfTrees, cropVariety, cropSeasonStartTime, userId)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      ['Himalayan Apple Orchard', 'Shimla, Himachal Pradesh', 15.0, 1420, 'Royal Delicious Apple', '2026-07-01 09:00:00', userId]
    );
    const farm2Id = farm2Result.insertId;

    const farmIdMap = { 1: farm1Id, 2: farm2Id };

    // 2. Expenses (July 2026)
    const rawExpenses = [
      { farm_id: 1, category: 'Fertilizer', amount: 24799, expense_date: '2026-07-21', description: 'Specialized NPK drip feed supply' },
      { farm_id: 1, category: 'Workers', amount: 5072, expense_date: '2026-07-09', description: 'Seasonal field labor wages' },
      { farm_id: 1, category: 'Equipment', amount: 3348, expense_date: '2026-07-24', description: 'Pruning shears & battery sprayer overhaul' },
      { farm_id: 2, category: 'Fertilizer', amount: 1476, expense_date: '2026-07-19', description: 'Foliar micronutrient spray mix' },
      { farm_id: 1, category: 'Workers', amount: 17059, expense_date: '2026-07-03', description: 'Canopy pruning & weeding team payment' },
      { farm_id: 1, category: 'Equipment', amount: 7015, expense_date: '2026-07-20', description: 'Tractor servicing & diesel filter replacement' },
      { farm_id: 2, category: 'Workers', amount: 15219, expense_date: '2026-07-23', description: 'Harvesting & fruit grading workers' },
      { farm_id: 2, category: 'Fertilizer', amount: 5731, expense_date: '2026-07-19', description: 'Organic compost & vermicompost batch' },
      { farm_id: 2, category: 'Water', amount: 9605, expense_date: '2026-07-23', description: 'Submersible borehole maintenance & power' },
      { farm_id: 1, category: 'Water', amount: 3849, expense_date: '2026-07-05', description: 'Canal irrigation water cess payment' },
      { farm_id: 2, category: 'Fertilizer', amount: 12263, expense_date: '2026-07-03', description: 'Calcium nitrate & boron fertilizer delivery' },
      { farm_id: 2, category: 'Equipment', amount: 9167, expense_date: '2026-07-28', description: 'Cold storage sensor calibration' },
      { farm_id: 1, category: 'Pesticides', amount: 18071, expense_date: '2026-07-26', description: 'Bio-fungicide & systemic fungicide batch' },
      { farm_id: 2, category: 'Fertilizer', amount: 18589, expense_date: '2026-07-04', description: 'Potash and phosphorus soil application' },
      { farm_id: 2, category: 'Equipment', amount: 6800, expense_date: '2026-07-10', description: 'High-density trellis wire tightening kit' },
      { farm_id: 1, category: 'Fertilizer', amount: 22168, expense_date: '2026-07-23', description: 'Water-soluble fertigation pack' },
      { farm_id: 2, category: 'Fertilizer', amount: 8128, expense_date: '2026-07-08', description: 'Zinc sulphate & magnesium sulphate foliar' },
      { farm_id: 1, category: 'Pesticides', amount: 9608, expense_date: '2026-07-28', description: 'Organic neem oil & surfactant supply' },
      { farm_id: 2, category: 'Workers', amount: 12630, expense_date: '2026-07-15', description: 'Fruit bagging and pest inspection crew' },
      { farm_id: 1, category: 'Water', amount: 23497, expense_date: '2026-07-12', description: 'Automated valve replacement and line flushing' },
    ];

    for (const exp of rawExpenses) {
      await conn.query(
        `INSERT INTO expenses (amount, category, notes, date, userId) VALUES (?, ?, ?, ?, ?)`,
        [exp.amount, exp.category, exp.description, exp.expense_date, userId]
      );
    }

    // 3. July 1-30 daily field logs (same operational diary on each holding)
    for (const farmId of [farm1Id, farm2Id]) {
      for (const log of julyDailyLogs) {
        await conn.query(
          `INSERT INTO daily_activities (date, activityType, notes, farmId, userId, pesticideName, pesticideQuantity, pesticideTime)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [log.date, log.activityType, log.notes, farmId, userId, log.pesticideName || null, log.pesticideQuantity || null, log.pesticideTime || null]
        );
      }
    }

    // 4. Disease Events
    const rawDiseases = [
      { farm_id: 1, diseaseName: 'Anthracnose', temp: 32.5, humidity: 85, rainfall: 74.0, filename: 'anthracnose-01.jpg', detectedAt: '2026-07-12 09:00:00' },
      { farm_id: 1, diseaseName: 'Leaf Curl', temp: 28.0, humidity: 75, rainfall: 44.0, filename: 'leaf-curl-01.jpg', detectedAt: '2026-07-20 09:00:00' },
      { farm_id: 2, diseaseName: 'Fire Blight', temp: 31.0, humidity: 88, rainfall: 57.0, filename: 'fire-blight-01.jpg', detectedAt: '2026-07-15 09:00:00' },
      { farm_id: 2, diseaseName: 'Powdery Mildew', temp: 24.5, humidity: 65, rainfall: 16.0, filename: 'powdery-mildew-01.jpg', detectedAt: '2026-07-08 09:00:00' },
      { farm_id: 1, diseaseName: 'Fruit Spot', temp: 29.5, humidity: 80, rainfall: 38.0, filename: 'fruit-spot-01.jpg', detectedAt: '2026-07-27 09:00:00' },
    ];

    for (const d of rawDiseases) {
      await conn.query(
        `INSERT INTO disease_events (diseaseName, temp, humidity, rainfall, filename, detectedAt, farmId, userId)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [d.diseaseName, d.temp, d.humidity, d.rainfall, d.filename, d.detectedAt, farmIdMap[d.farm_id], userId]
      );
    }

    // 5. Gallery Images — real Daruru Farm pomegranate photos
    for (let i = 0; i < galleryPhotos.length; i++) {
      const photo = galleryPhotos[i];
      const farmId = i < 3 ? farm1Id : farm2Id;
      await conn.query(
        `INSERT INTO gallery_images (filename, caption, uploadedAt, farmId, userId)
         VALUES (?, ?, ?, ?, ?)`,
        [photo.filename, photo.caption, photo.uploadedAt, farmId, userId]
      );
    }

    // 6. Contact Inquiries
    const rawInquiries = [
      { name: 'Ramesh Gowda', email: 'ramesh.gowda@mysurufarms.in', subject: 'Soil sensor calibration assistance', message: 'Requesting field engineer visit for recalibrating soil sensor cluster in North Block.', date: '2026-07-18 11:30:00' },
      { name: 'Amit Thakur', email: 'amit.thakur@himalayafruits.com', subject: 'Cold storage integration telemetry', message: 'Inquiring about connecting cold storage IoT humidity data directly to Daruru Farm cockpit.', date: '2026-07-23 16:45:00' },
    ];

    for (const inq of rawInquiries) {
      await conn.query(
        `INSERT INTO contact_inquiries (name, email, subject, message, submittedAt, userId)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [inq.name, inq.email, inq.subject, inq.message, inq.date, userId]
      );
    }
  }

  console.log('Seeding completed successfully!');
  await conn.end();
}

seed().catch(err => {
  console.error('Seeding error:', err);
  process.exit(1);
});
