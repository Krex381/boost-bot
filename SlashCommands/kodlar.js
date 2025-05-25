const Discord = require('discord.js');
const fs = require('fs');
const path = './db/database.json';

module.exports = {
    name: 'kodlar',
    description: '📜 Kullanıcının boost kodlarını gösterir',
    dm_permission: false,    options: [
        {
            name: 'kullanici',
            description: '👤 Kodlarını görüntülemek istediğiniz kullanıcı',
            type: 6,
            required: false
        }
    ],    run: async (bot, interaction, args, config) => {
        await interaction.deferReply({ 
        });
        
        const generateEmbed = async (targetUser) => {
            let db = { deliveries: {} };
            try {
                db = JSON.parse(fs.readFileSync(path, 'utf8'));
            } catch (err) {
                return { content: '❌ Veritabanı bulunamadı!', embeds: [] };
            }

            const userCodes = Object.entries(db.deliveries || {})
                .filter(([_, data]) => data.userId === targetUser.id)
                .map(([key, data]) => ({
                    key,
                    boostCount: `🚀 ${data.boostCount || data.memberCount}x boost`,  // Support both new and old format
                    date: `<t:${Math.floor(new Date(data.createdAt)/1000)}:D>`,
                    status: data.used ? '🔴 Kullanıldı' : '🟢 Aktif'
                }));

            const embed = new Discord.EmbedBuilder()
                .setAuthor({ 
                    name: `📂 ${targetUser.username} - Boost Kod Geçmişi`, 
                    iconURL: targetUser.displayAvatarURL({ dynamic: true }) 
                })
                .setColor('#2F3136')
                .setThumbnail('https://i.imgur.com/rVzH2Id.png');

            if (userCodes.length > 0) {
                const totalBoosts = userCodes.reduce((acc, code) => 
                    acc + Number(code.boostCount.match(/\d+/)[0]), 0);

                const codeList = userCodes.slice(0, 5).map((code, index) => 
                    `**${index+1}.** \`\`\`fix\n${code.key}\`\`\`\n» ${code.boostCount} • ${code.date} • ${code.status}`
                ).join('\n\n');

                embed.addFields(
                    {
                        name: '📊 İstatistikler',                        value: [
                            `• Toplam Kod: \`${userCodes.length}\``,
                            `• Toplam Boost: \`${totalBoosts.toLocaleString('tr-TR')} boost\``
                        ].join('\n'),
                        inline: true
                    },
                    {
                        name: '📜 Son Kodlar',
                        value: codeList || '❌ Kod bulunamadı!',
                        inline: false
                    }
                );
            } else {
                embed.setDescription('❌ Kayıtlı teslimat kodu bulunamadı!');
            }

            return embed;
        };        const targetUser = interaction.options.getUser('kullanici') || interaction.user;
        const embed = await generateEmbed(targetUser);

        const row = new Discord.ActionRowBuilder().addComponents(
            new Discord.ButtonBuilder()
                .setCustomId('refresh_codes')
                .setLabel('Yenile')
                .setEmoji('🔄')
                .setStyle(Discord.ButtonStyle.Primary)
        );

        const message = await interaction.editReply({ 
            embeds: [embed], 
            components: [row],
            ephemeral: true 
        });

        const filter = i => i.customId === 'refresh_codes' && i.user.id === interaction.user.id;
        const collector = message.createMessageComponentCollector({ filter, time: 300000 });

        collector.on('collect', async i => {
            await i.deferUpdate();
            const newEmbed = await generateEmbed(targetUser);
            await i.editReply({ embeds: [newEmbed] });
        });

        collector.on('end', () => {
            message.edit({ components: [] }).catch(() => {});
        });
    }
}