import { Button } from '../../handlers';
import {
    ActionRowBuilder,
    ModalBuilder,
    TextInputBuilder,
    TextInputStyle,
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
    custom_id: 'change_name',
    run: async ({ interaction, client }) => {
        const member = await interaction.guild?.members.fetch(interaction.user.id);
        const voiceChannel = member?.voice.channel;

        if (!voiceChannel) {
            return await interaction.reply({
                content: 'Musisz być połączony z kanałem głosowym, aby użyć tej funkcji.',
                flags: 64,
            });
        }

        connection.query(
            'SELECT owner_id FROM temp_channels WHERE channel_id = ?',
            [voiceChannel.id],
            async (err, results: mysql.RowDataPacket[]) => {
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
                if (interaction.member?.user.id !== ownerId) {
                    return await interaction.reply({
                        content: 'Tylko właściciel kanału może użyć tej funkcji.',
                        flags: 64,
                    });
                }
                const modal = new ModalBuilder()
                    .setCustomId('changeNameModal')
                    .setTitle('Zmień nazwę kanału');

                const nameInput = new TextInputBuilder()
                    .setCustomId('name')
                    .setLabel('Nowa nazwa kanału')
                    .setRequired(true)
                    .setStyle(TextInputStyle.Short);

                const row1 = new ActionRowBuilder<TextInputBuilder>().addComponents(nameInput);

                modal.addComponents(row1);

                await interaction.showModal(modal);
            }
        );
    },
});
