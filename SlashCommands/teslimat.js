const Discord = require('discord.js');
const fs = require('fs').promises;
const path = './db/database.json';
const config = require('../config.js');
const { startDelivery } = require('../join.js');

module.exports = {
    name: 'teslimat',
    description: '👥 Üye teslimat kodunu kullan',
    dm_permission: false,
    options: [
        {
            name: 'kod',
            description: '🎫 Kullanmak istediğiniz teslimat kodu',
            type: 3,
            required: true
        }
    ],
    run: async (bot, interaction) => {
        try {
            await interaction.deferReply({ 
            });

            const rawData = await fs.readFile(path, 'utf8').catch(() => { 
                throw new Error('Veritabanı okunamadı') 
            });
            const db = JSON.parse(rawData || '{}');
            db.deliveries = db.deliveries || {};

            const key = interaction.options.getString('kod').toUpperCase().trim();
            const deliveryData = db.deliveries[key];
            if (!deliveryData || typeof deliveryData !== 'object') {
                throw new Error('Geçersiz teslimat kodu');
            }

            const user = interaction.user;
            if (deliveryData.used) throw new Error('Bu boost kodu zaten kullanılmış');
            if (deliveryData.userId !== user.id) throw new Error('Bu boost kodu size ait değil');
            if (typeof deliveryData.boostCount !== 'number') throw new Error('Geçersiz boost sayısı');
            const createdAtDate = new Date(deliveryData.createdAt);
            if (isNaN(createdAtDate)) throw new Error('Geçersiz tarih formatı');

            db.deliveries[key] = { 
                ...deliveryData, 
                used: true, 
                usedAt: new Date().toISOString(),
                deliveredBy: bot.user.id
            };
            await fs.writeFile(path, JSON.stringify(db, null, 2));

            const embed = new Discord.EmbedBuilder()
                .setAuthor({
                    name: `${user.username} - Boost İşlemi Başarılı`,
                    iconURL: user.displayAvatarURL({ dynamic: true })
                })
                .setTitle('🚀 Boost Sistemi')
                .setDescription(`> 🎉 Tebrikler! Boost kodunuz başarıyla kullanıldı.`)
                .addFields(
                    {
                        name: '🎫 __Boost Detayları__',
                        value: [
                            `\`⌁\` **Kod:** \`${key}\``,
                            `\`⌁\` **Boost Sayısı:** \`${deliveryData.boostCount}x\` boost`,
                            `\`⌁\` **Oluşturulma:** <t:${Math.floor(createdAtDate / 1000)}:R>`
                        ].join('\n')
                    },
                    {
                        name: '📋 __İşlem Bilgileri__',
                        value: [
                            `\`⌁\` **Kullanıcı:** ${user.toString()} (${user.id})`,
                            `\`⌁\` **Durum:** ✅ Boost Başlatıldı`,
                            `\`⌁\` **Tarih:** <t:${Math.floor(Date.now() / 1000)}:F>`
                        ].join('\n')
                    }
                )
                .setThumbnail('https://i.imgur.com/YjBfT5a.png')
                .setColor('#2ecc71')
                .setFooter({ 
                    text: '🌟 Neptune Developments - Otomatik Boost Sistemi', 
                    iconURL: bot.user.displayAvatarURL() 
                })
                .setTimestamp();

            await interaction.editReply({ 
                content: `### ✨ [Neptune Developments] Boost İşlemi Başlatıldı!\n> Boost kodunuz onaylandı ve işlem başlatılıyor.`,
                embeds: [embed] 
            });

            console.log(`[Neptune Developments] Boost Başladı: ${deliveryData.boostCount}x boost yapılacak...`);
            
            const successfulAdds = await startDelivery(deliveryData);
            
            // Calculate how many tokens we need (each token boosts twice)
            const neededTokenCount = Math.ceil(deliveryData.boostCount / 2);
            
            // Get tokens for boosting
            const tokens = await fs.readFile('./tokens/tokenler.txt', 'utf8')
                .then(data => data.split(/\r?\n/)
                    .filter(t => t.length > 0)
                    .slice(0, neededTokenCount));

            let totalBoosts = 0;

            // Each token boosts twice
            for (const token of tokens) {
                const boostResult = await boostServer(token, deliveryData.guildId);
                totalBoosts += boostResult;
                console.log(`[Neptune Developments] Token Boost Progress: ${totalBoosts}/${deliveryData.boostCount}`);
                await new Promise(r => setTimeout(r, 1000));
            }

            const completionEmbed = new Discord.EmbedBuilder()
                .setTitle('✅ Boost Tamamlandı')
                .setDescription([
                    `> 🎉 ${successfulAdds}/${neededTokenCount} token başarıyla katıldı.`,
                    `> 🚀 ${totalBoosts}/${deliveryData.boostCount} boost başarıyla yapıldı.`
                ].join('\n'))
                .setColor('#34eb34')
                .setTimestamp();

            await interaction.followUp({ 
                content: 'Boost işlemi tamamlandı!',
                embeds: [completionEmbed],
            });

        } catch (error) {
            console.error('[HATA]', error);

            const errorEmbed = new Discord.EmbedBuilder()
                .setTitle('❌ İşlem Başarısız')
                .setDescription(`\`\`\`${error.message}\`\`\``)
                .setColor('#e74c3c');

            await interaction.editReply({ 
                embeds: [errorEmbed]
            });
        }
    }
};

async function boostServer(token, guildId) {
    try {
        const response = await fetch('https://discord.com/api/v9/users/@me/guilds/premium/subscription-slots', {
            headers: {
                'Authorization': token,
                'Content-Type': 'application/json'
            }
        });
        
        const slots = await response.json();
        if (!Array.isArray(slots) || slots.length < 2) {
            console.log(`[Boost] Not enough boost slots. Found: ${slots.length}, Need: 2`);
            return 0;
        }

        let successCount = 0;
        // Try to boost twice with this token
        for (let i = 0; i < 2; i++) {
            const result = await fetch(`https://discord.com/api/v9/guilds/${guildId}/premium/subscriptions`, {
                method: 'PUT',
                headers: {
                    'Authorization': token,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    user_premium_guild_subscription_slot_ids: [slots[i].id]
                })
            });

            if (result.status === 201) {
                console.log(`[Boost] Successfully boosted ${successCount + 1}/2 with token`);
                successCount++;
            } else {
                console.log(`[Boost] Error: ${result.status}`);
            }
            await new Promise(r => setTimeout(r, 300));
        }
        return successCount;
    } catch (error) {
        console.error('[Boost Error]:', error);
        return 0;
    }
}