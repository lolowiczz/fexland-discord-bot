import { Modal } from '../../handlers';
import mysql from 'mysql2';
import config from '../../../../config.json';
import {
    TextChannel,
} from 'discord.js';

const connection = mysql.createConnection({
    host: process.env.MYSQL_HOST,
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE,
});

connection.connect();

export default new Modal({
    custom_id: 'changeNameModal',
    run: async ({ interaction, fields }) => {
        const newName = fields.getTextInputValue('name');

        if (interaction.channel && interaction.channel.isTextBased()) {
            try {
                await (interaction.channel as TextChannel).setName(newName);
                await interaction.reply({
                    content: `\`✅\` Nazwa kanału została zmieniona na **${newName}**.`,
                    flags: 64,
                });
            } catch (error) {
                await interaction.reply({
                    content: 'Wystąpił błąd podczas zmiany nazwy kanału.',
                    flags: 64,
                });
            }
        } else {
            await interaction.reply({
                content: 'Ta komenda może być używana tylko na kanale tekstowym.',
                flags: 64,
            });
        }
    },
});
