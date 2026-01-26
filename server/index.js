const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const app = express();

// uploads 폴더 생성
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Multer 설정
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB 제한
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (extname && mimetype) {
      return cb(null, true);
    }
    cb(new Error('이미지 파일만 업로드 가능합니다.'));
  }
});

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(uploadsDir));

// ============ RACK ROUTES ============

// Get all racks
app.get('/api/racks', async (req, res) => {
  try {
    const racks = await prisma.rack.findMany({
      include: {
        geckos: {
          include: {
            careLogs: {
              orderBy: { createdAt: 'desc' },
              take: 10
            }
          }
        }
      }
    });
    res.json(racks);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get single rack
app.get('/api/racks/:id', async (req, res) => {
  try {
    const rack = await prisma.rack.findUnique({
      where: { id: parseInt(req.params.id) },
      include: {
        geckos: {
          include: {
            careLogs: {
              orderBy: { createdAt: 'desc' },
              take: 10
            }
          }
        }
      }
    });
    if (!rack) {
      return res.status(404).json({ error: 'Rack not found' });
    }
    res.json(rack);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create rack
app.post('/api/racks', async (req, res) => {
  try {
    const { name, rows, columns } = req.body;
    const rack = await prisma.rack.create({
      data: { name, rows, columns }
    });
    res.status(201).json(rack);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update rack
app.put('/api/racks/:id', async (req, res) => {
  try {
    const { name, rows, columns } = req.body;
    const rack = await prisma.rack.update({
      where: { id: parseInt(req.params.id) },
      data: { name, rows, columns }
    });
    res.json(rack);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete rack
app.delete('/api/racks/:id', async (req, res) => {
  try {
    await prisma.rack.delete({
      where: { id: parseInt(req.params.id) }
    });
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============ GECKO ROUTES ============

// Get all geckos
app.get('/api/geckos', async (req, res) => {
  try {
    const geckos = await prisma.gecko.findMany({
      include: {
        rack: true,
        careLogs: {
          orderBy: { createdAt: 'desc' },
          take: 10
        }
      }
    });
    res.json(geckos);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get single gecko
app.get('/api/geckos/:id', async (req, res) => {
  try {
    const gecko = await prisma.gecko.findUnique({
      where: { id: parseInt(req.params.id) },
      include: {
        rack: true,
        careLogs: {
          orderBy: { createdAt: 'desc' }
        }
      }
    });
    if (!gecko) {
      return res.status(404).json({ error: 'Gecko not found' });
    }
    res.json(gecko);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create gecko
app.post('/api/geckos', async (req, res) => {
  try {
    const { name, morph, birthDate, gender, weight, photoUrl, notes, rackId, row, column } = req.body;
    const gecko = await prisma.gecko.create({
      data: {
        name,
        morph,
        birthDate: birthDate ? new Date(birthDate) : null,
        gender,
        weight,
        photoUrl,
        notes,
        rackId,
        row,
        column
      },
      include: {
        careLogs: true
      }
    });
    res.status(201).json(gecko);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update gecko
app.put('/api/geckos/:id', async (req, res) => {
  try {
    const { name, morph, birthDate, gender, weight, photoUrl, notes, rackId, row, column } = req.body;
    const gecko = await prisma.gecko.update({
      where: { id: parseInt(req.params.id) },
      data: {
        name,
        morph,
        birthDate: birthDate ? new Date(birthDate) : null,
        gender,
        weight,
        photoUrl,
        notes,
        rackId,
        row,
        column
      },
      include: {
        careLogs: {
          orderBy: { createdAt: 'desc' },
          take: 10
        }
      }
    });
    res.json(gecko);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Move gecko (update position)
app.patch('/api/geckos/:id/move', async (req, res) => {
  try {
    const { rackId, row, column } = req.body;
    const gecko = await prisma.gecko.update({
      where: { id: parseInt(req.params.id) },
      data: { rackId, row, column }
    });
    res.json(gecko);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Swap two geckos positions
app.post('/api/geckos/swap', async (req, res) => {
  try {
    const { geckoId1, geckoId2 } = req.body;

    const gecko1 = await prisma.gecko.findUnique({ where: { id: geckoId1 } });
    const gecko2 = await prisma.gecko.findUnique({ where: { id: geckoId2 } });

    if (!gecko1 || !gecko2) {
      return res.status(404).json({ error: '개체를 찾을 수 없습니다.' });
    }

    // 트랜잭션으로 두 개체의 위치 교환
    await prisma.$transaction([
      // 임시로 gecko1을 -1 위치로 이동 (unique 제약 회피)
      prisma.gecko.update({
        where: { id: geckoId1 },
        data: { row: -1, column: -1 }
      }),
      // gecko2를 gecko1 위치로 이동
      prisma.gecko.update({
        where: { id: geckoId2 },
        data: { rackId: gecko1.rackId, row: gecko1.row, column: gecko1.column }
      }),
      // gecko1을 gecko2 위치로 이동
      prisma.gecko.update({
        where: { id: geckoId1 },
        data: { rackId: gecko2.rackId, row: gecko2.row, column: gecko2.column }
      })
    ]);

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete gecko
app.delete('/api/geckos/:id', async (req, res) => {
  try {
    await prisma.gecko.delete({
      where: { id: parseInt(req.params.id) }
    });
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============ IMAGE UPLOAD ============

// Upload gecko photo
app.post('/api/geckos/:id/photo', upload.single('photo'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: '파일이 없습니다.' });
    }

    const photoUrl = `/uploads/${req.file.filename}`;

    // 기존 사진이 있으면 삭제
    const gecko = await prisma.gecko.findUnique({
      where: { id: parseInt(req.params.id) }
    });

    if (gecko?.photoUrl) {
      const oldPath = path.join(__dirname, gecko.photoUrl);
      if (fs.existsSync(oldPath)) {
        fs.unlinkSync(oldPath);
      }
    }

    // DB 업데이트
    const updatedGecko = await prisma.gecko.update({
      where: { id: parseInt(req.params.id) },
      data: { photoUrl }
    });

    res.json({ photoUrl: updatedGecko.photoUrl });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete gecko photo
app.delete('/api/geckos/:id/photo', async (req, res) => {
  try {
    const gecko = await prisma.gecko.findUnique({
      where: { id: parseInt(req.params.id) }
    });

    if (gecko?.photoUrl) {
      const photoPath = path.join(__dirname, gecko.photoUrl);
      if (fs.existsSync(photoPath)) {
        fs.unlinkSync(photoPath);
      }
    }

    await prisma.gecko.update({
      where: { id: parseInt(req.params.id) },
      data: { photoUrl: null }
    });

    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============ CARE LOG ROUTES ============

// Get care logs for a gecko
app.get('/api/geckos/:geckoId/logs', async (req, res) => {
  try {
    const logs = await prisma.careLog.findMany({
      where: { geckoId: parseInt(req.params.geckoId) },
      orderBy: { createdAt: 'desc' }
    });
    res.json(logs);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create care log
app.post('/api/geckos/:geckoId/logs', async (req, res) => {
  try {
    const { type, note, value } = req.body;
    const log = await prisma.careLog.create({
      data: {
        type,
        note,
        value,
        geckoId: parseInt(req.params.geckoId)
      }
    });
    res.status(201).json(log);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete care log
app.delete('/api/logs/:id', async (req, res) => {
  try {
    await prisma.careLog.delete({
      where: { id: parseInt(req.params.id) }
    });
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============ STATS / ALERTS ============

// Get geckos needing attention
app.get('/api/alerts', async (req, res) => {
  try {
    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

    const geckos = await prisma.gecko.findMany({
      include: {
        careLogs: {
          orderBy: { createdAt: 'desc' }
        },
        rack: true
      }
    });

    const alerts = geckos.map(gecko => {
      const lastFeeding = gecko.careLogs.find(log => log.type === 'FEEDING');
      const lastCleaning = gecko.careLogs.find(log => log.type === 'CLEANING');
      const lastWater = gecko.careLogs.find(log => log.type === 'WATER');

      return {
        gecko,
        needsFeeding: !lastFeeding || new Date(lastFeeding.createdAt) < threeDaysAgo,
        needsCleaning: !lastCleaning || new Date(lastCleaning.createdAt) < threeDaysAgo,
        needsWater: !lastWater || new Date(lastWater.createdAt) < threeDaysAgo,
        lastFeeding: lastFeeding?.createdAt,
        lastCleaning: lastCleaning?.createdAt,
        lastWater: lastWater?.createdAt
      };
    });

    res.json(alerts.filter(a => a.needsFeeding || a.needsCleaning || a.needsWater));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
