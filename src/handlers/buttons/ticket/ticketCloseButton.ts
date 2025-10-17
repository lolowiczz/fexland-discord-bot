import {
    ButtonStyle,
    ActionRowBuilder,
    ButtonBuilder,
    EmbedBuilder,
    MessageActionRowComponentBuilder,
    TextChannel,
} from 'discord.js';
import config from '../../../../config.json';
import { Button } from '../../handlers';
import mysql from 'mysql2/promise';

const pool = mysql.createPool({
    host: process.env.MYSQL_HOST,
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE,
});

export default new Button({
    custom_id: 'ticketCloseButton',
    run: async ({ interaction }) => {
        if (!interaction.member.roles.cache.has(config.tickets.teamRoleId))
            return await interaction.reply({
                content: `Nie posiadasz uprawnień do zamykania ticketów!`,
                flags: 64,
            });

        const ticketChannel = interaction.channel as TextChannel;

        const [rows] = await pool.query(
            'SELECT discordId FROM ticket WHERE channelId = ?',
            [ticketChannel.id]
        );
        const tickets = rows as { discordId: string }[];

        if (!tickets.length) {
            return await interaction.reply({
                content: '❌ Nie znaleziono tego ticketu w bazie danych.',
                flags: 64,
            });
        }

        const ticketOwnerId = tickets[0].discordId;

        await ticketChannel.permissionOverwrites.edit(ticketOwnerId, {
            ViewChannel: false,
            SendMessages: false,
            ReadMessageHistory: false,
        });

        await ticketChannel.permissionOverwrites.edit(interaction.guild.roles.everyone, {
            SendMessages: false,
            ViewChannel: false,
        });

        const ticketDeleteButton =
            new ActionRowBuilder<MessageActionRowComponentBuilder>().addComponents(
                new ButtonBuilder()
                    .setCustomId('ticketDeleteButton')
                    .setLabel('Usuń Ticket')
                    .setStyle(ButtonStyle.Primary),
                new ButtonBuilder()
                .setCustomId('ticketTranscriptButton')
                .setStyle(ButtonStyle.Secondary)
                .setLabel('Pobierz Transkrypt')
                .setEmoji('📄'),
            );

        await interaction.reply({
            embeds: [
                new EmbedBuilder()
                    .setDescription(`
                        ## ❌ Zamknięty ticket
                        Użytkownik <@${ticketOwnerId}> utracił dostęp do kanału.
                        Administracja zdecyduje, co z nim dalej zrobić.
                    `)
                    .setColor('Red'),
            ],
            components: [ticketDeleteButton],
        });
    },
});
