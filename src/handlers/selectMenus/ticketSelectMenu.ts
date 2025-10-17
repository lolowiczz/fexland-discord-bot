import {
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    ChannelType,
    EmbedBuilder,
    MessageActionRowComponentBuilder,
    TextChannel,
} from 'discord.js';
import config from '../../../config.json';
import mysql from 'mysql2/promise'; // ✅ Use promise-based API
import { SelectMenu } from '../handlers';

const pool = mysql.createPool({
    host: process.env.MYSQL_HOST,
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE,
});

export default new SelectMenu({
    custom_id: 'ticketSelectMenu',
    type: 'String',
    run: async ({ interaction, client }) => {
        const selectedOption = interaction.values[0];
        const TicketType: { [key: string]: string } = {
            'ticket-pytanie': 'Pytanie',
            'ticket-zgloszenie': 'Zgłoszenie',
            'ticket-partnerstwo': 'Współpraca',
        };

        // ✅ Use promise syntax (no callback)
        const [rows] = await pool.query('SELECT * FROM ticket WHERE discordId = ?', [
            interaction.user.id,
        ]);

        // ✅ Type assertion to tell TS rows is an array
        const tickets = rows as any[];

        if (tickets.length > 0) {
            await interaction.reply({
                embeds: [
                    new EmbedBuilder()
                        .setDescription(
                            `
                            ## ❌ Wystąpił błąd
                            > Posiadasz już zarejestrowany ticket w naszej bazie danych
                        `
                        )
                        .setColor('Red'),
                ],
                flags: 64,
            });
            return;
        }

        // ✅ Create ticket
        const embed = new EmbedBuilder()
            .setColor('Blue')
            .setDescription(
                `
                ## ${TicketType[selectedOption] ?? selectedOption} od ${interaction.user.username}
                > Witaj na zgłoszeniu, wybrałeś kategorię: **${TicketType[selectedOption]}**, więc aby ukrócić czas oczekiwania naszego zespołu, opisz dokładnie swój problem bądź pytanie. Jeden a naszych administratorów wkrótce się z Tobą skontaktuje!
            `
            )
            .setThumbnail(interaction.user.displayAvatarURL())
            .setFooter({
                text: `${new Date().toLocaleString()}`,
                iconURL: client.user.displayAvatarURL(),
            });

        const row = new ActionRowBuilder<MessageActionRowComponentBuilder>().addComponents([
            new ButtonBuilder()
                .setCustomId('ticketCloseButton')
                .setStyle(ButtonStyle.Secondary)
                .setLabel('Zamknij ticket')
                .setEmoji('🔒')
        ]);

        const createdChannel = (await interaction.guild.channels.create({
            name: `${selectedOption.slice(7)}-${interaction.user.username}`,
            parent: config.tickets.categoryId,
            type: ChannelType.GuildText,
            permissionOverwrites: [
                {
                    id: interaction.guild.roles.everyone,
                    deny: ['ViewChannel', 'SendMessages', 'ReadMessageHistory'],
                },
                {
                    id: interaction.user.id,
                    allow: ['ViewChannel', 'SendMessages', 'ReadMessageHistory'],
                },
                {
                    id: config.tickets.teamRoleId,
                    allow: ['ViewChannel', 'SendMessages', 'ReadMessageHistory'],
                },
            ],
        })) as TextChannel;

        await interaction.reply({
            embeds: [
                new EmbedBuilder()
                    .setDescription(
                        `
                        ## Tworzenie ticketu zakończone sukcesem
                        > Twój kanał to: <#${createdChannel.id}>
                    `
                    )
                    .setColor('Green'),
            ],
            flags: 64,
        });

        // ✅ Use parameterized insert
        await pool.query(
            'INSERT INTO ticket (discordId, channelId, selectedOption) VALUES (?, ?, ?)',
            [interaction.user.id, createdChannel.id, TicketType[selectedOption]]
        );

        await createdChannel.send({
            content: `<@${interaction.user.id}>, <@&${config.tickets.teamRoleId}>`,
            embeds: [embed],
            components: [row],
        });
    },
});
