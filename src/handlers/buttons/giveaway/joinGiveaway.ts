import { Button } from '../../handlers';
import {
    TextChannel,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle
} from 'discord.js';
import mysql, { RowDataPacket } from 'mysql2';

const connection = mysql.createConnection({
    host: process.env.MYSQL_HOST,
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE,
});

connection.connect();

export default new Button({
    custom_id: 'join_giveaway',
    run: async ({ interaction }) => {
        try {
            if (!interaction.message) {
                return interaction.reply({ content: '❌ Nie można znaleźć wiadomości.', flags: 64 });
            }

            const messageId = interaction.message.id;
            const channelId = interaction.channelId;
            const userId = interaction.user.id;

            // Pobieramy giveaway
            connection.query("SELECT * FROM giveaways WHERE message_id = ? AND channel_id = ?", [messageId, channelId], async (err, results) => {
                if (err) {
                    console.error("❌ Błąd MySQL:", err);
                    return interaction.reply({ content: '❌ Wystąpił błąd serwera.', flags: 64 });
                }

                const rows = results as RowDataPacket[];
                if (!rows.length) {
                    return interaction.reply({ content: '❌ Ten konkurs nie istnieje lub został zakończony.', flags: 64 });
                }

                const giveaway = results[0];

                if (giveaway.ended) {
                    return interaction.reply({ content: '⛔ Ten konkurs już się zakończył.', flags: 64 });
                }

                let entries: string[] = [];

                try {
                    entries = JSON.parse(giveaway.entries || '[]');
                } catch {
                    entries = [];
                }

                if (entries.includes(userId)) {
                    return interaction.reply({ content: '✅ Już dołączyłeś/aś do tego konkursu!', flags: 64 });
                }

                entries.push(userId);

                connection.query("UPDATE giveaways SET entries = ? WHERE id = ?", [JSON.stringify(entries), giveaway.id], async (err) => {
                    if (err) {
                        console.error("❌ Błąd MySQL przy aktualizacji entries:", err);
                        return interaction.reply({ content: '❌ Wystąpił błąd podczas zapisywania twojego udziału.', flags: 64 });
                    }

                    await interaction.reply({ content: '🎉 Pomyślnie dołączyłeś/aś do konkursu!', flags: 64 });

                    // Pobieramy oryginalną wiadomość i aktualizujemy przycisk
                    const channel = interaction.client.channels.cache.get(channelId) as TextChannel;
                    if (!channel) return;

                    const message = await channel.messages.fetch(messageId);
                    if (!message) return;

                    const joinButton = new ButtonBuilder()
                        .setCustomId('join_giveaway')
                        .setLabel(`Bierze udział ${entries.length} uczestników`)
                        .setStyle(ButtonStyle.Primary);

                    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(joinButton);

                    await message.edit({ components: [row] });
                });
            });

        } catch (err) {
            console.error("❌ Błąd:", err);
            interaction.reply({ content: '❌ Coś poszło nie tak.', flags: 64 });
        }
    },
});
