import { Button } from '../../handlers';
import {
    ActionRowBuilder,
    GuildMember,
    MessageActionRowComponentBuilder,
    UserSelectMenuBuilder,
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
    custom_id: 'ban_user',
    run: async ({ interaction }) => {
        const member = interaction.member as GuildMember;
        const voiceChannel = member.voice.channel as VoiceChannel | null;

        if (!voiceChannel) {
            return await interaction.reply({
                content: 'Nie jesteś na żadnym kanale głosowym.',
                ephemeral: true,
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

                // Użytkownik jest właścicielem – pokaż menu wyboru
                const selectMenu = new UserSelectMenuBuilder()
                    .setCustomId(`banUserSelectMenu`)
                    .setPlaceholder(`Wybierz użytkownika do zbanowania..`)
                    .setMinValues(1)
                    .setMaxValues(1);

                const selectMenuRow =
                    new ActionRowBuilder<MessageActionRowComponentBuilder>().addComponents([
                        selectMenu,
                    ]);

                return await interaction.reply({
                    components: [selectMenuRow],
                    flags: 64,
                });
            }
        );
    },
});
