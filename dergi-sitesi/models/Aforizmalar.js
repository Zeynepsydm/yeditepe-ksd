const { DataTypes } = require('sequelize');
const sequelize = require('../utility/database');
const Users = require('./Users');
const Aforizmalar = sequelize.define('index', {
    aforizmalar_id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    metin: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    user_id: {
        type: DataTypes.INTEGER,  // Veya uygun veri tipini seçebilirsiniz
        allowNull: false,
    },
}, {
    // Modelin ayarlarını belirle
    tableName: 'Aforizmalar', // Veritabanında kullanılacak tablo adı
    timestamps: true, // Oluşturma ve güncelleme tarih alanları ekler
});
Aforizmalar.belongsTo(Users, { foreignKey: 'user_id' });
module.exports = Aforizmalar;