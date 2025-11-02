import { Modal } from '../../handlers';
import mysql from 'mysql2';
import config from '../../../../config.json';
import {
    VoiceChannel,
} from 'discord.js';

const connection = mysql.createConnection({
    host: process.env.MYSQL_HOST,
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE,
});

connection.connect();
export default new Modal({
    custom_id: 'changeLimitModal',
    run: async ({ interaction, fields }) => {
        const newLimit = Number(fields.getTextInputValue('limit'));

        if (interaction.channel && interaction.channel.isVoiceBased()) {
            try {
                await (interaction.channel as VoiceChannel).setUserLimit(newLimit);
                await interaction.reply({
                    content: `\`✅\` Limit kanału został zmieniony na **${newLimit}**.`,
                    flags: 64,
                });
            } catch (error) {
                await interaction.reply({
                    content: 'Wystąpił błąd podczas zmiany limitu kanału.',
                    flags: 64,
                });
            }
        } else {
            await interaction.reply({
                content: 'Ta komenda może być używana tylko na kanale głosowym.',
                flags: 64,
            });
        }
    },
});
