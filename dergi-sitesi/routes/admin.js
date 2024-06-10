const express = require('express');
const router = express.Router();
const db = require('../utility/database');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const jwt = require('jsonwebtoken');
const Users = require('../models/Users');
const Yorumlar = require('../models/Yorumlar');
const Dergiler = require('../models/Dergiler');
const createLimiter= require('../utility/limiter');
const Kategoriler = require('../models/Kategoriler');
const verifyToken = require('../utility/verifyToken');
const Kategorilertab = require('../models/Kategorilertab');
const Duyurular = require('../models/Duyurular');
const logger = require('../utility/logger');
const Etkinlikler = require('../models/Etkinlikler');
const options = { timeZone: 'Europe/Istanbul' }; // Türkiye saat dilimi
const formattedDate = new Date();
const now = formattedDate.toLocaleString('tr-TR', options);

// const limiterDefaultRequests = createLimiter(15)
// const limiterTwoRequests = createLimiter(1)
router.get('/panel', verifyToken, (req, res) => {
    const userS = req.session.user;

    if (!(userS && userS.role === 'admin')) {
        return res.render('404', { userS });
    }

    // Kullanıcı admin rolüne sahipse, sayfayı render et
    res.render('admin/kontrolPanel', { userS });
});

// Admin sayfası (POST)
router.post('/etkinlikEkle', async (req, res) => {
    const userS = req.session.user;
    const { videoLink  } = req.body;
    if (userS && userS.role === 'admin') {
        try {
            const etklinlikTemizle = await Etkinlikler.destroy({
                truncate: true
            });

            const etkinlikOlustur = await Etkinlikler.create({
                etkinlikler_link: videoLink 
            });

            const ipAddress = req.socket.remoteAddress;
            logger.info(userS.username + ' ' + 'Etkinlik Oluşturdu: ' + ipAddress + '  //' + new Date());

            res.redirect('/admin/etkinlikOlustur?success=true');
        } catch (error) {
            console.error('Etkinlik oluşturulamadı:', error);
            res.status(500).send('Etkinlik oluşturulamadı');
        }
    } else {
        res.redirect('/');
    }
  });
  
  router.post('/etklinlikTemizle', verifyToken, async (req, res) => {
    const userS = req.session.user;

    if (!(userS && userS.role === 'admin')) {
        return res.redirect('/');
    }

    try {
        await Etkinlikler.destroy({
            truncate: true
        });

        const ipAddress = req.socket.remoteAddress;
        logger.info(userS.username + ' ' + 'Etkinlik Sildi: ' + ipAddress + '  //' + now);
        res.redirect('/admin/etkinlikOlustur');
    } catch (error) {
        console.error('Etkinlik silinirken bir hata oluştu: ' + error);
        // Hata durumunu uygun şekilde ele alabilirsiniz, örneğin 500 durum kodu ile hata sayfası render edebilirsiniz.
        return res.status(500).send('Internal Server Error');
    }
});

// Etkinlikler Olustur sayfası
router.get('/etkinlikOlustur', async (req, res) => {
    const userS = req.session.user;

    if (!(userS && userS.role === 'admin')) {
        return res.render('404', { userS });
    }
    const success = req.query.success === 'true';
    const etkinlik = await Etkinlikler.findOne(); // Son eklenen etkinliği çek

    // Kullanıcı admin rolüne sahipse, sayfayı render et
    res.render('admin/etkinlikOlustur', { userS, etkinlik,success });
});




router.get('/logizleme', verifyToken,(req, res)=>{
    const userS = req.session.user;
    if (userS && userS.role === 'admin') {
        const dosyaYolu = path.join(__dirname, '../app.log');
        const dosyaIcerigi = fs.readFileSync(dosyaYolu, 'utf-8');
    // Kullanıcı admin rolüne sahipse, sayfayı render et
        res.render('admin/logizleme', { userS, dosyaIcerigi });
    }else{
        res.render('404', { userS });
    }
});
router.post('/logtemizle', verifyToken, (req, res) => {
    const userS = req.session.user;

    if (!(userS && userS.role === 'admin')) {
        return res.render('404', { userS });
    }

    const dosyaYolu = path.join(__dirname, '../app.log');
    const temizIcerik = '';
    fs.writeFileSync(dosyaYolu, temizIcerik, 'utf-8');

    // Kullanıcı admin rolüne sahipse, sayfayı redirect et
    res.redirect('/admin/logizleme');
});

router.get('/duyuruolustur', async (req, res) => {
    const userS = req.session.user;

    if (!(userS && userS.role === 'admin')) {
        return res.render('404', { userS });
    }

    const duyurular = await Duyurular.findAll();

    // Kullanıcı admin rolüne sahipse, sayfayı render et
    res.render('admin/duyuruOlustur', { userS, duyurular });
});


const uploadFolder = path.join(__dirname, '..', 'public', 'uploads');
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadFolder); // Dosyaların yükleneceği klasör
    },
    filename: (req, file, cb) => {
        cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname)); // Dosya adını belirleme
    }
});

const upload = multer({ storage: storage });

router.get('/dergiyonetim', verifyToken, async (req, res) => {
    const userS = req.session.user;

    if (!(userS && userS.role === 'admin')) {
        return res.render('404', { userS });
    }

    try {
        const dergiler = await Dergiler.findAll();
        res.render('admin/dergiYonetim', { dergiler, userS });
    } catch (error) {
        console.error('Dergi verilerini çekerken bir hata oluştu: ' + error);
        return res.status(500).send('Internal Server Error');
    }
});



router.get('/dergiolustur', verifyToken, async (req, res) => {
    const userS = req.session.user;

    if (!(userS && userS.role === 'admin')) {
        return res.render('404', { userS });
    }

    try {
        const kategoriler = await Kategoriler.findAll();
        res.render('admin/dergiOlustur', { userS, kategoriler });
    } catch (error) {
        console.error('Kategorileri çekerken bir hata oluştu: ' + error);
        // Hata durumunu uygun şekilde ele alabilirsiniz, örneğin 500 durum kodu ile hata sayfası render edebilirsiniz.
        return res.status(500).send('Internal Server Error');
    }
});


router.post('/duyuruolustur', verifyToken,async(req,res) => {
    const userS = req.session.user;
    const {duyuru_baslik, duyuru_metin, duyuru_renk} = req.body;
    
    if (userS && userS.role === 'admin') {
        const duyurutemizle = await Duyurular.destroy({
            truncate:true
        });
        const duyuruOlustur = await Duyurular.create({
            duyuru_baslik: duyuru_baslik,
            duyuru_metin: duyuru_metin,
            duyuru_renk: duyuru_renk,
        });
        const ipAddress = req.socket.remoteAddress;
        logger.info(userS.username+' '+'Duyuru Oluşturdu: '+ipAddress +'  //'+now);
        res.redirect('/admin/duyuruolustur');
    } else {
        res.redirect('/');
    }
});
router.post('/duyurusil', verifyToken, async (req, res) => {
    const userS = req.session.user;

    if (!(userS && userS.role === 'admin')) {
        return res.redirect('/');
    }

    try {
        await Duyurular.destroy({
            truncate: true
        });

        const ipAddress = req.socket.remoteAddress;
        logger.info(userS.username + ' ' + 'Duyuru Sildi: ' + ipAddress + '  //' + now);
        res.redirect('/admin/duyuruolustur');
    } catch (error) {
        console.error('Duyuru silinirken bir hata oluştu: ' + error);
        // Hata durumunu uygun şekilde ele alabilirsiniz, örneğin 500 durum kodu ile hata sayfası render edebilirsiniz.
        return res.status(500).send('Internal Server Error');
    }
});


router.post('/dergiolustur', verifyToken, upload.fields([
    { name: 'pdfDosya', maxCount: 1 },
    { name: 'resim', maxCount: 1 }
]), async (req, res) => {
    const userS = req.session.user;

    if (!(userS && userS.role === 'admin')) {
        return res.redirect('/');
    }

    const userID = req.session.user.id;

    const { baslik, yazar, konu, aciklama, kategorisi, resim, indirmeLinki, turu } = req.body;

    if (!req.files || !req.files['pdfDosya'] || !req.files['resim']) {
        console.error('Dosya yüklemesi başarısız oldu.');
        return res.status(400).send('Bad Request');
    }

    const pdfDosya = req.files['pdfDosya'][0];
    const resimDosya = req.files['resim'][0];

    try {
        const result = await Dergiler.create({
            konu,
            aciklama,
            resim: resimDosya.filename,
            indirme_linki: indirmeLinki,
            olusturan_user_id: userID,
            dergi_basligi: baslik,
            pdf_dosya: pdfDosya.filename,
            yazar,
            kategorisi,
            dergi_turu: turu,
        });

        const ipAddress = req.socket.remoteAddress;
        logger.info(userS.username + ' ' + 'Dergi Oluşturdu: ' + ipAddress + '  //' + now);
      
        res.redirect('/admin/panel');
    } catch (error) {
        console.error('Dergi oluşturulurken bir hata oluştu: ' + error);
        // Hata durumunu uygun şekilde ele alabilirsiniz, örneğin 500 durum kodu ile hata sayfası render edebilirsiniz.
        return res.status(500).send('Internal Server Error');
    }
});


router.post('/:dergiId/duzenle', verifyToken, async (req, res) => {
    const userS = req.session.user;

    if (!(userS && userS.role === 'admin')) {
        return res.redirect('/');
    }

    const dergiId = req.params.dergiId;
    const { konu, aciklama, resim, baslik, kategorisi, turu } = req.body;

    try {
        const dergi = await Dergiler.findByPk(dergiId);

        if (!dergi) {
            return res.status(404).send('Dergi bulunamadı');
        }

        // Sequelize'nin update metodunu kullanarak dergiyi güncelle
        await dergi.update({
            dergi_basligi: baslik,
            konu: konu,
            aciklama: aciklama,
            resim: resim,
            kategorisi: kategorisi,
            dergi_turu: turu,
        });

        const ipAddress = req.socket.remoteAddress;
        logger.info(userS.username + ' ' + 'Dergi Düzenledi: ' + ipAddress + '  //' + now);
   
        res.redirect('/admin/dergiyonetim');
    } catch (error) {
        console.error('Dergi güncellenirken bir hata oluştu: ' + error);
        // Hata durumunu uygun şekilde ele alabilirsiniz, örneğin 500 durum kodu ile hata sayfası render edebilirsiniz.
        return res.status(500).send('Internal Server Error');
    }
});


router.get('/:dergiId/duzenle', async (req, res) => {
    const dergiId = req.params.dergiId;
    const userS = req.session.user;

    if (userS && userS.role === 'admin') {
        try {
            // Kategorileri çek
            const kategoriler = await Kategoriler.findAll();

            // Dergiyi çek
            const dergi = await Dergiler.findByPk(dergiId);

            if (!dergi) {
                return res.status(404).send('Dergi bulunamadı');
            }



            // DergiDuzenle view'ine dergi ve kategorileri gönder
            res.render('admin/dergiDuzenle', { dergi, userS, kategoriler });

        } catch (error) {
            console.error('Dergi bilgisi alınırken bir hata oluştu: ' + error);
            return res.status(500).send('Internal Server Error');
        }
    } else {
        res.render('404', { userS });
    }
});


router.post('/:dergiId/sil', verifyToken, async (req, res) => {
    const userS = req.session.user;
    
    if (userS && userS.role === 'admin') {
        const dergiId = req.params.dergiId;
        
        try {
            // Sequelize ile dergiyi bul ve sil
            const dergi = await Dergiler.findByPk(dergiId);
            
            if (!dergi) {
                return res.status(404).send('Dergi bulunamadı');
            }
            
            // Sequelize ile dergiyi sil
            await dergi.destroy();
            
            // Sequelize ile ilgili dergiye ait yorumları sil
            await Yorumlar.destroy({
                where: {
                    dergi_id: dergiId
                }
            });
            
            const ipAddress = req.socket.remoteAddress;
            logger.info(userS.username+' '+'Dergi Sildi: '+ipAddress +'  //'+now);

            res.redirect('/admin/dergiyonetim');
        } catch (error) {
            console.error('Dergi silinirken bir hata oluştu: ' + error);
            return res.status(500).send('Internal Server Error');
        }
    } else {
        res.redirect('/');
    }
});





router.get('/kullaniciyonetim', verifyToken, async (req, res) => {
    const userS = req.session.user;

    if (!(userS && userS.role === 'admin')) {
        return res.render('404', { userS });
    }

    try {
        const users = await Users.findAll();

        res.render('admin/kullaniciYonetim', { userS, users });
    } catch (error) {
        console.error('Veri tabanından kullanıcıları çekerken hata oluştu: ' + error.message);
        // Hata durumunu uygun şekilde ele alabilirsiniz, örneğin 500 durum kodu ile hata sayfası render edebilirsiniz.
        res.status(500).json({ error: 'Veri tabanından kullanıcıları çekerken hata oluştu' });
    }
});


router.get('/kullanici/:userId', verifyToken, async (req, res) => {
    const userId = req.params.userId;
    const userS = req.session.user;

    if (userS && userS.role === 'admin') {
        try {
            const user = await Users.findByPk(userId); // Sequelize ile kullanıcıyı çekiyoruz
            if (user) {

                res.render('admin/kullaniciDetay', { userS, user });
            } else {
                res.status(404).json({ error: 'Kullanıcı bulunamadı' });
            }
        } catch (error) {
            console.log('Kullanıcı detayları alınırken hata oluştu: ' + error.message);
        }
    } else {
        res.render('404', { userS });
    }
});


router.post('/kullanici/:userId/update', verifyToken, async (req, res) => {
    const userId = req.params.userId;
    const userS = req.session.user;
    const { newUsername, newEmail, newFirstName, newLastName, newRole } = req.body;

    if (userS && userS.role === 'admin') {
        try {
            const userToUpdate = await Users.findByPk(userId);
            
            if (userToUpdate) {
                userToUpdate.username = newUsername;
                userToUpdate.email = newEmail;
                userToUpdate.first_name = newFirstName;
                userToUpdate.last_name = newLastName;
                userToUpdate.role = newRole;

                await userToUpdate.save();
                const ipAddress = req.socket.remoteAddress;
                logger.info(userS.username+' '+'Kullanıcı Güncelledi: '+ipAddress +'  //'+now);

                res.redirect('/admin/kullanici/' + userId);
            } else {
                res.status(404).json({ error: 'Kullanıcı bulunamadı' });
            }
        } catch (error) {
            console.error('Kullanıcı güncellenirken hata oluştu: ' + error.message);
            res.status(500).json({ error: 'Kullanıcı güncellenirken hata oluştu' });
        }
    } else {
        res.render('404', { userS });
    }
});

router.get('/kategoriyonetim', verifyToken, async (req, res) => {
    const userS = req.session.user;

    try {
        if (!(userS && userS.role === 'admin')) {
            return res.render('404', { userS });
        }

        const kategoriler = await Kategoriler.findAll({
            include: { model: Kategorilertab, as: 'kategoriler_tab' },
        });
        const kategoriTabs = await Kategorilertab.findAll();
        res.render('admin/kategoriOlustur', { userS, kategoriler, kategoriTabs });
    } catch (error) {
        console.error('Kategoriler alınırken bir hata oluştu: ' + error.message);
        // Hata durumunu uygun şekilde ele alabilirsiniz, örneğin 500 durum kodu ile hata sayfası render edebilirsiniz.
        res.status(500).send('Internal Server Error');
    }
});


router.post('/kategoriekle', verifyToken, async (req, res) => {
    const userS = req.session.user;

    if (!(userS && userS.role === 'admin')) {
        return res.redirect('/');
    }

    const { kategori_ad, kategori_low, kategori_tab_id } = req.body;

    try {
        const yeniKategori = await Kategoriler.create({
            kategori_ad,
            kategori_low,
            kategori_tab_id,
        });
        const ipAddress = req.socket.remoteAddress;
        logger.info(userS.username + ' ' + 'Kategori Ekledi: ' + ipAddress + '  //' + now);

        res.redirect('/admin/kategoriyonetim');
    } catch (error) {
        console.error('Kategori oluşturulurken bir hata oluştu: ' + error.message);
        // Hata durumunu uygun şekilde ele alabilirsiniz, örneğin 500 durum kodu ile hata sayfası render edebilirsiniz.
        res.status(500).send('Internal Server Error');
    }
});


router.post('/kategoritabekle', verifyToken, async (req, res) => {
    const userS = req.session.user;

    if (!(userS && userS.role === 'admin')) {
        return res.redirect('/');
    }

    const { kategori_tab_ad } = req.body;

    try {
        const yeniKategoriTab = await Kategorilertab.create({
            kategori_tab_ad,
        });
        const ipAddress = req.socket.remoteAddress;
        logger.info(userS.username + ' ' + 'Kategori Tab Ekledi: ' + ipAddress + '  //' + now);

        res.redirect('/admin/kategoriyonetim');
    } catch (error) {
        console.error('KategoriTab oluşturulurken bir hata oluştu: ' + error.message);
        // Hata durumunu uygun şekilde ele alabilirsiniz, örneğin 500 durum kodu ile hata sayfası render edebilirsiniz.
        res.status(500).send('Internal Server Error');
    }
});

router.post('/:kategoriId/kategorisil', verifyToken, async (req, res) => {
    const userS = req.session.user;
    const kategoriId = req.params.kategoriId;

    if (!(userS && userS.role === 'admin')) {
        return res.redirect('/');
    }

    try {
        // Kategori silme işlemi
        await Kategoriler.destroy({
            where: {
                kategori_id: kategoriId,
            },
        });
        const ipAddress = req.socket.remoteAddress;
        logger.info(userS.username + ' ' + 'Kategori Sildi: ' + ipAddress + '  //' + now);

        res.redirect('/admin/kategoriyonetim');
    } catch (error) {
        console.error('Kategori silinirken bir hata oluştu: ' + error.message);
        // Hata durumunu uygun şekilde ele alabilirsiniz, örneğin 500 durum kodu ile hata sayfası render edebilirsiniz.
        res.status(500).send('Internal Server Error');
    }
});
router.post('/:kategoritabId/kategoritabsil', verifyToken, async (req, res) => {
    const userS = req.session.user;
    const kategoritabId = req.params.kategoritabId;

    if (!(userS && userS.role === 'admin')) {
        return res.redirect('/');
    }

    try {
        // Kategori silme işlemi
        await Kategoriler.destroy({
            where: {
                kategori_tab_id: kategoritabId,
            },
        });
        await Kategorilertab.destroy({
            where: {
                kategori_tab_id: kategoritabId,
            },
        });
        const ipAddress = req.socket.remoteAddress;
        logger.info(userS.username + ' ' + 'Kategori Tab Sildi: ' + ipAddress + '  //' + now);

        res.redirect('/admin/kategoriyonetim');
    } catch (error) {
        console.error('Kategori Tab silinirken bir hata oluştu: ' + error.message);
        // Hata durumunu uygun şekilde ele alabilirsiniz, örneğin 500 durum kodu ile hata sayfası render edebilirsiniz.
        res.status(500).send('Internal Server Error');
    }
});


module.exports=router;
