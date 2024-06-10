const { DataTypes } = require('sequelize');
const sequelize = require('../utility/database');
const Etkinlikler = sequelize.define('Etkinlikler', {
    etkinlik_id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    etkinlikler_link: {
        type: DataTypes.STRING,
        allowNull: false,
    }
}, {
    // Modelin ayarlarını belirle
    tableName: 'etkinlikler', // Veritabanında kullanılacak tablo adı
    timestamps: true, // Oluşturma ve güncelleme tarih alanları ekler
});

module.exports = Etkinlikler;