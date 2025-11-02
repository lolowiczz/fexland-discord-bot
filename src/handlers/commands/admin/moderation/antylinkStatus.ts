import { ApplicationCommandOptionType, ApplicationCommandType, EmbedBuilder } from 'discord.js';
import { Command } from '../../../handlers';
import mysql from 'mysql2';

const connection = mysql.createConnection({
    host: process.env.MYSQL_HOST,
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE,
});

connection.connect();

export default new Command({
    name: 'antylinkstatus',
    type: ApplicationCommandType.ChatInput,
    description: 'Sprawdź status antylinka',
    options: [
        {
            name: 'wartosc',
            description: 'Włącz lub wyłącz antylinka',
            type: ApplicationCommandOptionType.String,
            required: true,
            choices: [
                {
                    name: 'Włączony',
                    value: 'true',
                },
                {
                    name: 'Wyłączony',
                    value: 'false',
                },
            ],
        },
    ],
    run: async ({ interaction, args }) => {
        const wartosc = args.getString('wartosc') === 'true';

        connection.query(
            'UPDATE antylink SET is_active = ? LIMIT 1',
            [wartosc],
            (err, result) => {
                if (err) {
                    console.error('Błąd podczas aktualizacji antylinka:', err);
                    return interaction.reply({
                        content: '❌ Wystąpił błąd podczas aktualizacji statusu antylinka.',
                        ephemeral: true,
                    });
                }

                const embed = new EmbedBuilder()
                    .setTitle('✅ Status Antylinka Zmieniony')
                    .setDescription(`Antylink został teraz **${wartosc ? 'włączony' : 'wyłączony'}**.`)
                    .setColor(wartosc ? 0x00ff00 : 0xff0000)
                    .setTimestamp();

                interaction.reply({ embeds: [embed], flags: 64 });
            }
        );
    },
});
