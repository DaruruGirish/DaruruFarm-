const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const uploadsDir = path.join(__dirname, 'uploads');
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

// Generate valid images
const imageSpecs = [
  { name: 'mango-field-july-01', c1: [16, 185, 129], c2: [6, 78, 59], c3: [5, 150, 105], badge: [52, 211, 153] },
  { name: 'mango-field-july-02', c1: [14, 165, 233], c2: [12, 74, 110], c3: [2, 132, 199], badge: [56, 189, 248] },
  { name: 'mango-field-july-03', c1: [245, 158, 11], c2: [113, 63, 18], c3: [217, 119, 6], badge: [251, 191, 36] },
  { name: 'mango-field-july-04', c1: [34, 197, 94], c2: [20, 83, 45], c3: [22, 163, 74], badge: [74, 222, 128] },
  { name: 'apple-field-july-05', c1: [244, 63, 94], c2: [136, 19, 55], c3: [225, 29, 72], badge: [251, 113, 133] },
  { name: 'apple-field-july-06', c1: [168, 85, 247], c2: [88, 28, 135], c3: [147, 51, 234], badge: [192, 132, 252] },
  { name: 'apple-field-july-07', c1: [59, 130, 246], c2: [30, 58, 138], c3: [37, 99, 235], badge: [96, 165, 250] },
  { name: 'apple-field-july-08', c1: [251, 113, 133], c2: [159, 18, 57], c3: [244, 63, 94], badge: [253, 164, 175] },
  { name: 'anthracnose-01', c1: [239, 68, 68], c2: [127, 29, 29], c3: [220, 38, 38], badge: [248, 113, 113] },
  { name: 'leaf-curl-01', c1: [245, 158, 11], c2: [120, 53, 15], c3: [217, 119, 6], badge: [251, 191, 36] },
  { name: 'fire-blight-01', c1: [220, 38, 38], c2: [127, 29, 29], c3: [185, 28, 28], badge: [239, 68, 68] },
  { name: 'powdery-mildew-01', c1: [156, 163, 175], c2: [55, 65, 81], c3: [107, 114, 128], badge: [209, 213, 219] },
  { name: 'fruit-spot-01', c1: [217, 119, 6], c2: [120, 53, 15], c3: [180, 83, 9], badge: [245, 158, 11] },
];

imageSpecs.forEach(img => {
  const pngBuffer = generateBinaryPng(640, 420, img.c1, img.c2, img.c3, img.badge);
  // Write as both .jpg and .png so requests to either extension load properly
  fs.writeFileSync(path.join(uploadsDir, `${img.name}.jpg`), pngBuffer);
  fs.writeFileSync(path.join(uploadsDir, `${img.name}.png`), pngBuffer);
});

console.log('Valid binary images successfully created in backend/uploads directory.');

async function seed() {
  const conn = await mysql.createConnection({
    host: '127.0.0.1',
    port: 3306,
    user: 'root',
    password: 'Bunny2026$',
    database: 'daruru_farm',
  });

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
    console.log(`Seeding full 20-day synthetic telemetry data for user ${userId} (${user.email})...`);

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

    // 3. COMPLETE 20 CONSECUTIVE DAYS OF WORK FOR FARM 1 (Green Valley Mango Estate)
    // From July 12, 2026 to July 31, 2026 — Every single day has realistic, specific operational work
    const farm1DailyLogs = [
      {
        date: '2026-07-12',
        activityType: 'Harvesting',
        notes: 'Morning harvest cycle completed in Sector 1; gathered 680kg of prime Alphonso mangoes for export sorting.',
        pesticideName: null,
        pesticideQuantity: null,
        pesticideTime: null,
      },
      {
        date: '2026-07-13',
        activityType: 'Irrigation',
        notes: 'Executed 3.5-hour scheduled automated drip irrigation with deep basin saturation across all 20 acres.',
        pesticideName: null,
        pesticideQuantity: null,
        pesticideTime: null,
      },
      {
        date: '2026-07-14',
        activityType: 'Pest Inspection',
        notes: 'Conducted tree-by-tree visual scout for mango hopper nymphs and thrips on fresh terminal shoots.',
        pesticideName: null,
        pesticideQuantity: null,
        pesticideTime: null,
      },
      {
        date: '2026-07-15',
        activityType: 'Pesticide Application',
        notes: 'Targeted preventive canopy spray across Block A against fungal anthracnose.',
        pesticideName: 'Mancozeb 75 WP',
        pesticideQuantity: '5.5 Liters',
        pesticideTime: '07:30 AM',
      },
      {
        date: '2026-07-16',
        activityType: 'Pruning',
        notes: 'Structural canopy aeration and removal of diseased crisscross branches on 140 mature trees.',
        pesticideName: null,
        pesticideQuantity: null,
        pesticideTime: null,
      },
      {
        date: '2026-07-17',
        activityType: 'Fertilization',
        notes: 'Venturi drip injection of potassium nitrate (13:0:45) and zinc sulfate micronutrient concentrate.',
        pesticideName: null,
        pesticideQuantity: null,
        pesticideTime: null,
      },
      {
        date: '2026-07-18',
        activityType: 'Maintenance',
        notes: 'Cleaned sand gravel media filters and serviced 5HP solar borehole pump motor.',
        pesticideName: null,
        pesticideQuantity: null,
        pesticideTime: null,
      },
      {
        date: '2026-07-19',
        activityType: 'Pesticide Application',
        notes: 'Applied protective preventive spray on developing fruit clusters in Block A.',
        pesticideName: 'Mancozeb',
        pesticideQuantity: '3.3 Liters',
        pesticideTime: '07:00 AM',
      },
      {
        date: '2026-07-20',
        activityType: 'Soil Testing',
        notes: 'Calibrated telemetry moisture sensors; logged root zone soil electrical conductivity at 1.1 dS/m.',
        pesticideName: null,
        pesticideQuantity: null,
        pesticideTime: null,
      },
      {
        date: '2026-07-21',
        activityType: 'Fertilization',
        notes: 'Basal application of 1.5 tons seasoned vermicompost fortified with Trichoderma bio-agent.',
        pesticideName: null,
        pesticideQuantity: null,
        pesticideTime: null,
      },
      {
        date: '2026-07-22',
        activityType: 'Maintenance',
        notes: 'Desilted drainage channels and reinforced soil bunds to prevent waterlogging during monsoon showers.',
        pesticideName: null,
        pesticideQuantity: null,
        pesticideTime: null,
      },
      {
        date: '2026-07-23',
        activityType: 'Irrigation',
        notes: 'Night cycle drip fertigation; flushed lateral dripper lines and checked emitter flow rate.',
        pesticideName: null,
        pesticideQuantity: null,
        pesticideTime: null,
      },
      {
        date: '2026-07-24',
        activityType: 'Soil Testing',
        notes: 'Collected soil core samples at 30cm and 60cm depths; verified balanced pH of 6.5 across North Block.',
        pesticideName: null,
        pesticideQuantity: null,
        pesticideTime: null,
      },
      {
        date: '2026-07-25',
        activityType: 'Harvesting',
        notes: 'Second major harvest batch; hand-picked 1,450kg export grade fruit and transferred to packhouse.',
        pesticideName: null,
        pesticideQuantity: null,
        pesticideTime: null,
      },
      {
        date: '2026-07-26',
        activityType: 'Fertilization',
        notes: 'Foliar drenching of calcium chloride and boron to strengthen fruit peel and post-harvest shelf life.',
        pesticideName: null,
        pesticideQuantity: null,
        pesticideTime: null,
      },
      {
        date: '2026-07-27',
        activityType: 'Pest Inspection',
        notes: 'Monitored fruit fly pheromone traps; recorded zero threshold exceedance across the estate.',
        pesticideName: null,
        pesticideQuantity: null,
        pesticideTime: null,
      },
      {
        date: '2026-07-28',
        activityType: 'Soil Testing',
        notes: 'Leaf tissue and petiole sample collection sent for comprehensive micronutrient laboratory assay.',
        pesticideName: null,
        pesticideQuantity: null,
        pesticideTime: null,
      },
      {
        date: '2026-07-29',
        activityType: 'Pesticide Application',
        notes: 'Copper Oxychloride bactericidal protective wash following heavy evening rainfall.',
        pesticideName: 'Copper Oxychloride 50 WP',
        pesticideQuantity: '4.4 Liters',
        pesticideTime: '08:00 AM',
      },
      {
        date: '2026-07-30',
        activityType: 'Soil Testing',
        notes: 'Subsurface soil moisture tension logged at optimal 25 centibars with automated IoT probes.',
        pesticideName: null,
        pesticideQuantity: null,
        pesticideTime: null,
      },
      {
        date: '2026-07-31',
        activityType: 'Harvesting',
        notes: 'Final seasonal harvest sweep across all 20 acres; post-harvest tree washing and estate telemetry audit.',
        pesticideName: null,
        pesticideQuantity: null,
        pesticideTime: null,
      },
    ];

    for (const log of farm1DailyLogs) {
      await conn.query(
        `INSERT INTO daily_activities (date, activityType, notes, farmId, userId, pesticideName, pesticideQuantity, pesticideTime)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [log.date, log.activityType, log.notes, farm1Id, userId, log.pesticideName, log.pesticideQuantity, log.pesticideTime]
      );
    }

    // 20 CONSECUTIVE DAYS OF WORK FOR FARM 2 (Himalayan Apple Orchard)
    const farm2DailyLogs = [
      { date: '2026-07-12', activityType: 'Irrigation', notes: 'Micro-sprinkler misting cycle activated to maintain humidity.' },
      { date: '2026-07-13', activityType: 'Pesticide Application', notes: 'Routine spray protection for orchard perimeter against apple scab.', pName: 'Mancozeb', pQty: '5.2 Liters', pTime: '07:30 AM' },
      { date: '2026-07-14', activityType: 'Pruning', notes: 'Summer spur pruning and water sprout removal on trellis rows 1-8.' },
      { date: '2026-07-15', activityType: 'Disease Assessment', notes: 'Inspection of Section A for Fire Blight blossom symptoms.' },
      { date: '2026-07-16', activityType: 'Harvesting', notes: 'Early picking of early-ripening Gala varieties for local markets.' },
      { date: '2026-07-17', activityType: 'Harvesting', notes: 'Completed harvest of Block B high-density trellis trees.' },
      { date: '2026-07-18', activityType: 'Maintenance', notes: 'Tensioned support trellis guide wires and replaced damaged end posts.' },
      { date: '2026-07-19', activityType: 'Fertilization', notes: 'Foliar calcium nitrate spray to prevent bitter pit disorder.' },
      { date: '2026-07-20', activityType: 'Pest Inspection', notes: 'San Jose scale and red spider mite population count in Section C.' },
      { date: '2026-07-21', activityType: 'Soil Testing', notes: 'Soil test for nitrogen absorption rate in high elevation blocks.' },
      { date: '2026-07-22', activityType: 'Harvesting', notes: 'Main batch Royal Delicious picking commenced across Section A.' },
      { date: '2026-07-23', activityType: 'Maintenance', notes: 'Serviced cold storage atmosphere monitors and temperature sensors.' },
      { date: '2026-07-24', activityType: 'Pesticide Application', notes: 'Routine preventive fungal spray against blight and powdery mildew.', pName: 'Mancozeb', pQty: '7.6 Liters', pTime: '07:30 AM' },
      { date: '2026-07-25', activityType: 'Irrigation', notes: 'Deep root zone saturation using gravity-fed mountain spring water.' },
      { date: '2026-07-26', activityType: 'Pesticide Application', notes: 'Targeted root zone borer control application in Block A.', pName: 'Chlorpyrifos', pQty: '7.4 Liters', pTime: '07:30 AM' },
      { date: '2026-07-27', activityType: 'Harvesting', notes: 'Graded and boxed 900kg of premium grade fruit into refrigerated dispatch.' },
      { date: '2026-07-28', activityType: 'Maintenance', notes: 'Anti-hail netting deployment inspection following weather advisory.' },
      { date: '2026-07-29', activityType: 'Soil Testing', notes: 'Micro-nutrient moisture test verified for apple root zones.' },
      { date: '2026-07-30', activityType: 'Fertilization', notes: 'Post-harvest potassium sulphate soil enrichment applied around drip circles.' },
      { date: '2026-07-31', activityType: 'Harvesting', notes: 'Final harvest batch completed; estate inventory logged into telemetry portal.' },
    ];

    for (const log of farm2DailyLogs) {
      await conn.query(
        `INSERT INTO daily_activities (date, activityType, notes, farmId, userId, pesticideName, pesticideQuantity, pesticideTime)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [log.date, log.activityType, log.notes, farm2Id, userId, log.pName || null, log.pQty || null, log.pTime || null]
      );
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

    // 5. Gallery Images
    const rawGallery = [
      { farm_id: 1, filename: 'mango-field-july-01.jpg', caption: 'High-resolution capture of canopy growth in North Block', uploadedAt: '2026-07-04 15:00:00' },
      { farm_id: 1, filename: 'mango-field-july-02.jpg', caption: 'Irrigation emitter inspection across South Block', uploadedAt: '2026-07-07 15:00:00' },
      { farm_id: 1, filename: 'mango-field-july-03.jpg', caption: 'Flowering and early fruit formation telemetry', uploadedAt: '2026-07-10 15:00:00' },
      { farm_id: 1, filename: 'mango-field-july-04.jpg', caption: 'Post-pruning canopy aeration status', uploadedAt: '2026-07-13 15:00:00' },
      { farm_id: 2, filename: 'apple-field-july-05.jpg', caption: 'High density apple orchard trellis inspection', uploadedAt: '2026-07-16 15:00:00' },
      { farm_id: 2, filename: 'apple-field-july-06.jpg', caption: 'Fruit thinning and sizing check', uploadedAt: '2026-07-19 15:00:00' },
      { farm_id: 2, filename: 'apple-field-july-07.jpg', caption: 'Soil moisture sensor array installation', uploadedAt: '2026-07-22 15:00:00' },
      { farm_id: 2, filename: 'apple-field-july-08.jpg', caption: 'Pre-harvest color development tracking', uploadedAt: '2026-07-25 15:00:00' },
    ];

    for (const g of rawGallery) {
      await conn.query(
        `INSERT INTO gallery_images (filename, caption, uploadedAt, farmId, userId)
         VALUES (?, ?, ?, ?, ?)`,
        [g.filename, g.caption, g.uploadedAt, farmIdMap[g.farm_id], userId]
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
