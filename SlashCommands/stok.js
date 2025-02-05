const Discord = require('discord.js');
const fs = require('fs').promises;
const path = require('path');
const config = require('../config.js');

module.exports = {
    name: 'stok',
    description: '🚀 Boost token stok durumunu gösterir',
    dm_permission: false,
    run: async (bot, interaction) => {
        try {

            await interaction.deferReply();

            if (!config.ownerIDs.includes(interaction.user.id)) {
                return await interaction.editReply({ 
                    content: '⛔ Bu komutu sadece bot sahipleri kullanabilir!'
                });
            }

            const onlineTokens = await fs.readFile('./tokens/online.txt', 'utf8')
                .then(data => data.split(/\r?\n/).filter(token => token.length > 0))
                .catch(() => []);

            const offlineTokens = await fs.readFile('./tokens/offline.txt', 'utf8')
                .then(data => data.split(/\r?\n/).filter(token => token.length > 0))
                .catch(() => []);

            const totalOnline = onlineTokens.length;
            const totalOffline = offlineTokens.length;
            const totalTokens = totalOnline + totalOffline;

            const embed = new Discord.EmbedBuilder()
                .setTitle('📊 Boost Token Stok Durumu')
                .setDescription([
                    `### 📈 Genel Durum:`,
                    `> Toplam Token: \`${totalTokens.toLocaleString()}\` adet`,
                    '',
                    '### 📝 Detaylı Boost Stok:',
                    `\`🟢\` Online Boostlar: \`${totalOnline.toLocaleString()}\` adet`,
                    `\`⚫\` Offline Boostlar: \`${totalOffline.toLocaleString()}\` adet`,
                    '',
                    '### 📊 Dağılım:',
                    `\`⌁\` Online Oranı: \`%${((totalOnline / totalTokens) * 100 || 0).toFixed(1)}\``,
                    `\`⌁\` Offline Oranı: \`%${((totalOffline / totalTokens) * 100 || 0).toFixed(1)}\``,
                    '',
                    `> 🔄 Son Güncelleme: <t:${Math.floor(Date.now()/1000)}:R>`
                ].join('\n'))
                .setColor('#2F3136')
                .setTimestamp()
                .setFooter({ 
                    text: `Boost Stok Sistemi | ${interaction.user.tag}`, 
                    iconURL: bot.user.displayAvatarURL() 
                });

            const row = new Discord.ActionRowBuilder().addComponents(
                new Discord.ButtonBuilder()
                    .setCustomId('refresh_stock')
                    .setLabel('Stok Yenile')
                    .setEmoji('🔄')
                    .setStyle(Discord.ButtonStyle.Primary)
            );

            await interaction.editReply({ 
                embeds: [embed],
                components: [row],
            });

            const filter = i => i.customId === 'refresh_stock' && i.user.id === interaction.user.id;
            const collector = interaction.channel.createMessageComponentCollector({ filter, time: 60000 });

            collector.on('collect', async i => {
                await i.deferUpdate();

                const newOnlineCount = await fs.readFile('./tokens/online.txt', 'utf8')
                    .then(data => data.split(/\r?\n/).filter(token => token.length > 0).length)
                    .catch(() => 0);
                const newOfflineCount = await fs.readFile('./tokens/offline.txt', 'utf8')
                    .then(data => data.split(/\r?\n/).filter(token => token.length > 0).length)
                    .catch(() => 0);
                const newTotal = newOnlineCount + newOfflineCount;

                const updatedEmbed = embed
                    .setDescription([
                        `### 📈 Genel Durum:`,
                        `> Toplam Token: \`${newTotal.toLocaleString()}\` adet`,
                        '',
                        '### 📝 Detaylı Boost Stok:',
                        `\`🟢\` Online Boostlar: \`${newOnlineCount.toLocaleString()}\` adet`,
                        `\`⚫\` Offline Boostlar: \`${newOfflineCount.toLocaleString()}\` adet`,
                        '',
                        '### 📊 Dağılım:',
                        `\`⌁\` Online Oranı: \`%${((newOnlineCount / newTotal) * 100 || 0).toFixed(1)}\``,
                        `\`⌁\` Offline Oranı: \`%${((newOfflineCount / newTotal) * 100 || 0).toFixed(1)}\``,
                        '',
                        `> 🔄 Son Güncelleme: <t:${Math.floor(Date.now()/1000)}:R>`
                    ].join('\n'))
                    .setTimestamp();

                await i.editReply({ embeds: [updatedEmbed], components: [row] });
            });

        } catch (error) {
            console.error('[Stok Hatası]:', error);
            await interaction.editReply({ 
                content: '❌ Token bilgisi alınamadı!\n> Lütfen token dosyalarını kontrol edin.',
                components: []
            });
        }
    }
};