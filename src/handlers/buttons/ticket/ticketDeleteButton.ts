import { ButtonStyle, ActionRowBuilder, ButtonBuilder, EmbedBuilder, MessageActionRowComponentBuilder } from 'discord.js';
import config from '../../../../config.json';
import mysql from 'mysql2/promise';
import { Button } from '../../handlers';

const pool = mysql.createPool({
    host: process.env.MYSQL_HOST,
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE,
});

export default new Button({
    custom_id: 'ticketDeleteButton',
    run: async ({ interaction }) => {
        if (!interaction.member.roles.cache.has(config.tickets.teamRoleId))
            return await interaction.reply({
                content: `Nie posiadasz uprawnień do zamykania ticketów!`,
                flags: 64,
            });

        const ticketDeleteButton =
            new ActionRowBuilder<MessageActionRowComponentBuilder>().addComponents(
                new ButtonBuilder()
                    .setCustomId('ticketDeleteButton')
                    .setLabel('Usuń Ticket')
                    .setStyle(ButtonStyle.Primary)
                    .setDisabled(true)
            );

        await interaction.reply({
            embeds: [
                new EmbedBuilder()
                    .setDescription(
                        `
                        ## ❌ Usunięty ticket
                        Ticket został usunięty, aby zobaczyć transakcję, użyj komendy \`/logi-ticket\`
                        `
                    )
                    .setColor(`Red`),
            ],
            components: [ticketDeleteButton],
        });

        pool.query(`DELETE FROM ticket WHERE channelId = '${interaction.channel.id}'`);

        setTimeout(() => {
            interaction.channel.delete();
        }, 5000);
    },
});
