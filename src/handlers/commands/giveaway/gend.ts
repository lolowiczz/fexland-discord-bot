import { Command } from '../../handlers';
import { ApplicationCommandType, ApplicationCommandOptionType } from 'discord.js';
import mysql from 'mysql2';

const connection = mysql.createConnection({
    host: process.env.MYSQL_HOST,
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE,
});

connection.connect();

import { endGiveaway } from '../../../services/giveaway';

export default new Command({
    name: 'gend',
    description: 'Zakończ giveaway',
    type: ApplicationCommandType.ChatInput,
    options: [
        {
            name: 'message_id',
            description: 'ID wiadomości giveaway, który chcesz zakończyć',
            type: ApplicationCommandOptionType.String,
            required: true,
        },
    ],
    run: async ({ interaction, args, client }) => {
        const messageId = args.getString('message_id', true);

        connection.query(
            'SELECT * FROM giveaways WHERE message_id = ? AND ended = 0',
            [messageId],
            async (err, results) => {
                if (err) {
                    console.error(err);
                    return interaction.reply({ content: '❌ Błąd bazy danych.', flags: 64 });
                }
                if (!Array.isArray(results) || results.length === 0) {
                    return interaction.reply({
                        content: '❌ Giveaway nie istnieje lub jest już zakończony.',
                        flags: 64,
                    });
                }

                const giveaway = results[0];
                const success = await endGiveaway(client, giveaway);

                if (success) {
                    return interaction.reply({
                        content: '✅ Giveaway został zakończony i zwycięzcy ogłoszeni.',
                        flags: 64,
                    });
                } else {
                    return interaction.reply({
                        content: '❌ Nie udało się zakończyć giveaway.',
                        flags: 64,
                    });
                }
            }
        );
    },
});
