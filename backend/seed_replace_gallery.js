const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

const uploadsDir = path.join(__dirname, 'uploads');
const farmPhotosDir = path.join(__dirname, '..', 'DaruruFarms_Pomegranate_5_Images');

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

async function run() {
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  for (const photo of galleryPhotos) {
    const src = path.join(farmPhotosDir, photo.filename);
    if (!fs.existsSync(src)) {
      throw new Error(`Missing farm photo: ${src}`);
    }
    fs.copyFileSync(src, path.join(uploadsDir, photo.filename));
  }

  const conn = await mysql.createConnection({
    host: '127.0.0.1',
    port: 3306,
    user: 'root',
    password: 'Bunny2026$',
    database: 'daruru_farm',
  });

  await conn.query('DELETE FROM gallery_images');
  await conn.query('ALTER TABLE gallery_images AUTO_INCREMENT = 1');

  const [users] = await conn.query('SELECT id FROM users');
  for (const user of users) {
    const [farms] = await conn.query(
      'SELECT id FROM farms WHERE userId = ? ORDER BY id ASC',
      [user.id]
    );
    if (farms.length === 0) continue;

    const farm1Id = farms[0].id;
    const farm2Id = farms[1] ? farms[1].id : farms[0].id;

    for (let i = 0; i < galleryPhotos.length; i++) {
      const photo = galleryPhotos[i];
      const farmId = i < 3 ? farm1Id : farm2Id;
      await conn.query(
        `INSERT INTO gallery_images (filename, caption, uploadedAt, farmId, userId)
         VALUES (?, ?, ?, ?, ?)`,
        [photo.filename, photo.caption, photo.uploadedAt, farmId, user.id]
      );
    }
  }

  const [[{ count }]] = await conn.query('SELECT COUNT(*) AS count FROM gallery_images');
  console.log(`Replaced gallery with Daruru Farm photos. Rows now: ${count}`);
  await conn.end();
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
