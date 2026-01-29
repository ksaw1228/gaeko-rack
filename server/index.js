const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const sharp = require('sharp');
const { PrismaClient } = require('@prisma/client');
const { authMiddleware, JWT_SECRET } = require('./middleware/auth');

const prisma = new PrismaClient();
const app = express();

// uploads 폴더 생성
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Multer 설정 (메모리 저장 - 압축 후 저장)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB 제한 (압축 전)
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

// 이미지 압축 및 저장 함수
async function compressAndSaveImage(buffer, originalName) {
  const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
  const filename = uniqueSuffix + '.webp'; // WebP로 변환하여 용량 절감
  const filepath = path.join(uploadsDir, filename);

  await sharp(buffer)
    .resize(1200, 1200, { // 최대 1200x1200
      fit: 'inside',
      withoutEnlargement: true
    })
    .webp({ quality: 80 }) // WebP 형식, 품질 80%
    .toFile(filepath);

  return `/uploads/${filename}`;
}

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(uploadsDir));

// ============ AUTH ROUTES ============

// Register
app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password, name } = req.body;

    if (!email || !password || !name) {
      return res.status(400).json({ error: '모든 필드를 입력해주세요.' });
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ error: '이미 사용 중인 이메일입니다.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: { email, password: hashedPassword, name }
    });

    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });

    res.status(201).json({
      user: { id: user.id, email: user.email, name: user.name },
      token
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Login
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: '이메일과 비밀번호를 입력해주세요.' });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(401).json({ error: '이메일 또는 비밀번호가 올바르지 않습니다.' });
    }

    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ error: '이메일 또는 비밀번호가 올바르지 않습니다.' });
    }

    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });

    res.json({
      user: { id: user.id, email: user.email, name: user.name },
      token
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get current user
app.get('/api/auth/me', authMiddleware, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId }
    });

    if (!user) {
      return res.status(404).json({ error: '사용자를 찾을 수 없습니다.' });
    }

    res.json({ id: user.id, email: user.email, name: user.name });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============ RACK ROUTES ============

// Get all racks
app.get('/api/racks', authMiddleware, async (req, res) => {
  try {
    const racks = await prisma.rack.findMany({
      where: { userId: req.userId },
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
app.get('/api/racks/:id', authMiddleware, async (req, res) => {
  try {
    const rack = await prisma.rack.findFirst({
      where: { id: parseInt(req.params.id), userId: req.userId },
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
app.post('/api/racks', authMiddleware, async (req, res) => {
  try {
    const { name, rows, columns } = req.body;
    const rack = await prisma.rack.create({
      data: { name, rows, columns, userId: req.userId }
    });
    res.status(201).json(rack);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update rack
app.put('/api/racks/:id', authMiddleware, async (req, res) => {
  try {
    const { name, rows, columns } = req.body;
    const rack = await prisma.rack.updateMany({
      where: { id: parseInt(req.params.id), userId: req.userId },
      data: { name, rows, columns }
    });
    if (rack.count === 0) {
      return res.status(404).json({ error: 'Rack not found' });
    }
    const updatedRack = await prisma.rack.findUnique({
      where: { id: parseInt(req.params.id) }
    });
    res.json(updatedRack);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete rack
app.delete('/api/racks/:id', authMiddleware, async (req, res) => {
  try {
    const result = await prisma.rack.deleteMany({
      where: { id: parseInt(req.params.id), userId: req.userId }
    });
    if (result.count === 0) {
      return res.status(404).json({ error: 'Rack not found' });
    }
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============ GECKO ROUTES ============

// Get all geckos
app.get('/api/geckos', authMiddleware, async (req, res) => {
  try {
    const geckos = await prisma.gecko.findMany({
      where: { rack: { userId: req.userId } },
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
app.get('/api/geckos/:id', authMiddleware, async (req, res) => {
  try {
    const gecko = await prisma.gecko.findFirst({
      where: { id: parseInt(req.params.id), rack: { userId: req.userId } },
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
app.post('/api/geckos', authMiddleware, async (req, res) => {
  try {
    const { name, morph, birthDate, gender, weight, photoUrl, notes, rackId, row, column } = req.body;
    // Verify the rack belongs to the user
    const rack = await prisma.rack.findFirst({
      where: { id: rackId, userId: req.userId }
    });
    if (!rack) {
      return res.status(404).json({ error: 'Rack not found' });
    }
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
app.put('/api/geckos/:id', authMiddleware, async (req, res) => {
  try {
    const { name, morph, birthDate, gender, weight, photoUrl, notes, rackId, row, column } = req.body;
    // Verify gecko belongs to user
    const existingGecko = await prisma.gecko.findFirst({
      where: { id: parseInt(req.params.id), rack: { userId: req.userId } }
    });
    if (!existingGecko) {
      return res.status(404).json({ error: 'Gecko not found' });
    }
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
app.patch('/api/geckos/:id/move', authMiddleware, async (req, res) => {
  try {
    const { rackId, row, column } = req.body;
    // Verify gecko and target rack belong to user
    const existingGecko = await prisma.gecko.findFirst({
      where: { id: parseInt(req.params.id), rack: { userId: req.userId } }
    });
    if (!existingGecko) {
      return res.status(404).json({ error: 'Gecko not found' });
    }
    const targetRack = await prisma.rack.findFirst({
      where: { id: rackId, userId: req.userId }
    });
    if (!targetRack) {
      return res.status(404).json({ error: 'Target rack not found' });
    }
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
app.post('/api/geckos/swap', authMiddleware, async (req, res) => {
  try {
    const { geckoId1, geckoId2 } = req.body;

    const gecko1 = await prisma.gecko.findFirst({
      where: { id: geckoId1, rack: { userId: req.userId } }
    });
    const gecko2 = await prisma.gecko.findFirst({
      where: { id: geckoId2, rack: { userId: req.userId } }
    });

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
app.delete('/api/geckos/:id', authMiddleware, async (req, res) => {
  try {
    const gecko = await prisma.gecko.findFirst({
      where: { id: parseInt(req.params.id), rack: { userId: req.userId } }
    });
    if (!gecko) {
      return res.status(404).json({ error: 'Gecko not found' });
    }
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
app.post('/api/geckos/:id/photo', authMiddleware, upload.single('photo'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: '파일이 없습니다.' });
    }

    // 이미지 압축 및 저장
    const photoUrl = await compressAndSaveImage(req.file.buffer, req.file.originalname);

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

// Delete gecko photo (legacy - single photo)
app.delete('/api/geckos/:id/photo', authMiddleware, async (req, res) => {
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

// ============ GECKO PHOTOS (Multiple) ============

// Get all photos for a gecko
app.get('/api/geckos/:geckoId/photos', authMiddleware, async (req, res) => {
  try {
    const photos = await prisma.geckoPhoto.findMany({
      where: { geckoId: parseInt(req.params.geckoId) },
      orderBy: { takenAt: 'desc' }
    });
    res.json(photos);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Upload photo for gecko
app.post('/api/geckos/:geckoId/photos', authMiddleware, upload.single('photo'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: '파일이 없습니다.' });
    }

    const geckoId = parseInt(req.params.geckoId);
    // 이미지 압축 및 저장
    const photoUrl = await compressAndSaveImage(req.file.buffer, req.file.originalname);
    const takenAt = req.body.takenAt ? new Date(req.body.takenAt) : new Date();

    // 첫 번째 사진이면 자동으로 대표 이미지로 설정
    const existingPhotos = await prisma.geckoPhoto.count({
      where: { geckoId }
    });

    const photo = await prisma.geckoPhoto.create({
      data: {
        photoUrl,
        takenAt,
        isMain: existingPhotos === 0,
        geckoId
      }
    });

    // 첫 번째 사진이면 gecko의 photoUrl도 업데이트
    if (existingPhotos === 0) {
      await prisma.gecko.update({
        where: { id: geckoId },
        data: { photoUrl }
      });
    }

    res.status(201).json(photo);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Set photo as main
app.patch('/api/photos/:id/main', authMiddleware, async (req, res) => {
  try {
    const photo = await prisma.geckoPhoto.findUnique({
      where: { id: parseInt(req.params.id) }
    });

    if (!photo) {
      return res.status(404).json({ error: '사진을 찾을 수 없습니다.' });
    }

    // 기존 대표 이미지 해제
    await prisma.geckoPhoto.updateMany({
      where: { geckoId: photo.geckoId },
      data: { isMain: false }
    });

    // 새로운 대표 이미지 설정
    const updatedPhoto = await prisma.geckoPhoto.update({
      where: { id: parseInt(req.params.id) },
      data: { isMain: true }
    });

    // gecko의 photoUrl도 업데이트
    await prisma.gecko.update({
      where: { id: photo.geckoId },
      data: { photoUrl: photo.photoUrl }
    });

    res.json(updatedPhoto);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete photo
app.delete('/api/photos/:id', authMiddleware, async (req, res) => {
  try {
    const photo = await prisma.geckoPhoto.findUnique({
      where: { id: parseInt(req.params.id) }
    });

    if (!photo) {
      return res.status(404).json({ error: '사진을 찾을 수 없습니다.' });
    }

    // 파일 삭제
    const photoPath = path.join(__dirname, photo.photoUrl);
    if (fs.existsSync(photoPath)) {
      fs.unlinkSync(photoPath);
    }

    // DB에서 삭제
    await prisma.geckoPhoto.delete({
      where: { id: parseInt(req.params.id) }
    });

    // 대표 이미지였다면 다른 사진을 대표로 설정
    if (photo.isMain) {
      const nextPhoto = await prisma.geckoPhoto.findFirst({
        where: { geckoId: photo.geckoId },
        orderBy: { takenAt: 'desc' }
      });

      if (nextPhoto) {
        await prisma.geckoPhoto.update({
          where: { id: nextPhoto.id },
          data: { isMain: true }
        });
        await prisma.gecko.update({
          where: { id: photo.geckoId },
          data: { photoUrl: nextPhoto.photoUrl }
        });
      } else {
        await prisma.gecko.update({
          where: { id: photo.geckoId },
          data: { photoUrl: null }
        });
      }
    }

    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============ CARE LOG ROUTES ============

// Get care logs for a gecko
app.get('/api/geckos/:geckoId/logs', authMiddleware, async (req, res) => {
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
app.post('/api/geckos/:geckoId/logs', authMiddleware, async (req, res) => {
  try {
    const { type, note, value, createdAt } = req.body;
    const log = await prisma.careLog.create({
      data: {
        type,
        note,
        value,
        geckoId: parseInt(req.params.geckoId),
        createdAt: createdAt ? new Date(createdAt) : undefined
      }
    });
    res.status(201).json(log);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete care log
app.delete('/api/logs/:id', authMiddleware, async (req, res) => {
  try {
    // Verify the log belongs to user's gecko
    const log = await prisma.careLog.findFirst({
      where: { id: parseInt(req.params.id) },
      include: { gecko: { include: { rack: true } } }
    });
    if (!log || log.gecko.rack.userId !== req.userId) {
      return res.status(404).json({ error: 'Log not found' });
    }
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
app.get('/api/alerts', authMiddleware, async (req, res) => {
  try {
    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

    const geckos = await prisma.gecko.findMany({
      where: { rack: { userId: req.userId } },
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
