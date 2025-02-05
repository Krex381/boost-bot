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
            await interaction.deferReply();

            const rawData = await fs.readFile(path, 'utf8');
            const db = JSON.parse(rawData || '{}');
            db.deliveries = db.deliveries || {};

            const key = interaction.options.getString('kod').toUpperCase().trim();
            const deliveryData = db.deliveries[key];
            if (!deliveryData || typeof deliveryData !== 'object') {
                throw new Error('Geçersiz teslimat kodu');
            }

            if (!deliveryData.guildId) throw new Error('Geçersiz sunucu ID');
            if (typeof deliveryData.boostCount !== 'number') throw new Error('Geçersiz boost sayısı');

            const user = interaction.user;
            if (deliveryData.used) throw new Error('Bu boost kodu zaten kullanılmış');
            if (deliveryData.userId !== user.id) throw new Error('Bu boost kodu size ait değil');

            db.deliveries[key] = { 
                ...deliveryData, 
                used: true, 
                usedAt: new Date().toISOString(),
                deliveredBy: bot.user.id
            };
            await fs.writeFile(path, JSON.stringify(db, null, 2));

            const tokenContent = await fs.readFile('./tokens/tokenler.txt', 'utf8');
            const allTokens = tokenContent.split(/\r?\n/).filter(t => t.trim().length > 0);
            const neededTokenCount = Math.ceil(deliveryData.boostCount / 2);
            const tokensToUse = allTokens.slice(0, neededTokenCount);

            const successfulAdds = await startDelivery(deliveryData, tokensToUse);

            let totalBoosts = 0;
            const successfulBoosts = [];

            for (const [index, token] of tokensToUse.entries()) {
                try {

                    const slotsResponse = await fetch(
                        'https://discord.com/api/v9/users/@me/guilds/premium/subscription-slots',
                        {
                            headers: { Authorization: token }
                        }
                    );

                    if (!slotsResponse.ok) {
                        console.log(`[${index + 1}/${tokensToUse.length}] Slot getirme başarısız oldu: ${slotsResponse.status}`);
                        continue;
                    }

                    const slots = await slotsResponse.json();
                    const availableSlots = slots.filter(slot => 
                        !slot.canceled && 
                        (!slot.cooldown_ends_at || new Date(slot.cooldown_ends_at) < new Date())
                    );

                    if (availableSlots.length < 2) {
                        console.log(`[${index + 1}/${tokensToUse.length}] Yetersiz yuva: ${availableSlots.length}`);
                        continue;
                    }

                    for (let i = 0; i < 2 && totalBoosts < deliveryData.boostCount; i++) {
                        const boostResponse = await fetch(
                            `https://discord.com/api/v9/guilds/${deliveryData.guildId}/premium/subscriptions`,
                            {
                                method: 'PUT',
                                headers: { 
                                    Authorization: token,
                                    'Content-Type': 'application/json'
                                },
                                body: JSON.stringify({
                                    user_premium_guild_subscription_slot_ids: [availableSlots[i].id]
                                })
                            }
                        );

                        if (boostResponse.status === 201) {
                            totalBoosts++;
                            successfulBoosts.push(token);
                            console.log(`[${index + 1}/${tokensToUse.length}] Boost ${totalBoosts}/${deliveryData.boostCount} basarili`);
                        } else {
                            console.log(`[${index + 1}/${tokensToUse.length}] Boost hata: ${boostResponse.status}`);
                        }

                        await new Promise(resolve => setTimeout(resolve, 1200));
                    }
                } catch (error) {
                    console.error(`[${index + 1}/${tokensToUse.length}] Hata:`, error.message);
                }
            }

            const completionEmbed = new Discord.EmbedBuilder()
                .setTitle('✅ Boost İşlemi Tamamlandı')
                .setDescription([
                    `🎉 Toplam **${totalBoosts}/${deliveryData.boostCount}** boost tamamlandı`,
                    `🚀 Başarılı tokenler: **${successfulBoosts.length}** adet`
                ].join('\n'))
                .setColor('#34eb34');

            await interaction.followUp({ embeds: [completionEmbed] });

        } catch (error) {
            console.error('[HATA]', error);
            const errorEmbed = new Discord.EmbedBuilder()
                .setTitle('❌ İşlem Başarısız')
                .setDescription(`\`\`\`${error.message}\`\`\``)
                .setColor('#e74c3c');
            await interaction.editReply({ embeds: [errorEmbed] });
        }
    }
};
