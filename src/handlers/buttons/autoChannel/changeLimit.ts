import { Button } from '../../handlers';
import {
    ActionRowBuilder,
    GuildMember,
    ModalBuilder,
    TextInputBuilder,
    TextInputStyle,
    VoiceChannel,
} from 'discord.js';
import mysql from 'mysql2';

const connection = mysql.createConnection({
    host: process.env.MYSQL_HOST,
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE,
});

connection.connect();

export default new Button({
    custom_id: 'change_limit',
    run: async ({ interaction }) => {
        // Get the member and voice channel from the interaction
        const member = interaction.member as GuildMember;
        const voiceChannel = member.voice.channel as VoiceChannel | null;

        if (!voiceChannel) {
            return await interaction.reply({
                content: 'Nie jesteś na żadnym kanale głosowym.',
                flags: 64,
            });
        }

        connection.query(
            'SELECT owner_id FROM temp_channels WHERE channel_id = ?',
            [voiceChannel.id],
            async (err: | null, results: any[]) => {
                if (err) {
                    console.error('Błąd podczas pobierania właściciela:', err);
                    return await interaction.reply({
                        content: 'Wystąpił błąd podczas sprawdzania uprawnień.',
                        flags: 64,
                    });
                }

                if (!results.length) {
                    return await interaction.reply({
                        content: 'Brak danych o właścicielu kanału.',
                        flags: 64,
                    });
                }

                const ownerId = results[0].owner_id;
                if (member.id !== ownerId) {
                    return await interaction.reply({
                        content: 'Tylko właściciel kanału może użyć tej funkcji.',
                        flags: 64,
                    });
                }

                const modal = new ModalBuilder()
                    .setCustomId('changeLimitModal')
                    .setTitle('Zmień limit kanału');

                const limitInput = new TextInputBuilder()
                    .setCustomId('limit')
                    .setLabel('Nowy limit uczestników')
                    .setRequired(true)
                    .setStyle(TextInputStyle.Short);

                const row1 = new ActionRowBuilder<TextInputBuilder>().addComponents(limitInput);

                modal.addComponents(row1);

                await interaction.showModal(modal);
            }
        );
    },
});
