import { Button } from '../../handlers';
import {
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    ChannelType,
    EmbedBuilder,
} from 'discord.js';
import mysql, { RowDataPacket } from 'mysql2';

const connection = mysql.createConnection({
    host: process.env.MYSQL_HOST,
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE,
});

connection.connect();

export default new Button({
    custom_id: 'make_private',
    run: async ({ interaction }) => {
        const member = interaction.member;
        const channel = interaction.guild.channels.cache.get(interaction.channelId);

        // Znajdź voice kanał powiązany z tym tekstowym
        const guildMember = member && 'user' in member ? member : null;
        const username = guildMember?.user?.username ?? '';
        const voiceChannel = interaction.guild.channels.cache.find(
            (ch): ch is import('discord.js').VoiceChannel =>
                ch.type === ChannelType.GuildVoice &&
                ch.parentId === channel.parentId &&
                ch.name.includes(username)
        );

        if (!voiceChannel) {
            return await interaction.reply({
                content: 'Nie znaleziono powiązanego kanału głosowego.',
                flags: 64,
            });
        }

        connection.query(
            'SELECT owner_id FROM temp_channels WHERE channel_id = ?',
            [voiceChannel.id],
            async (err, results) => {
                if (err) {
                    console.error('Błąd podczas pobierania właściciela:', err);
                    return await interaction.reply({
                        content: 'Wystąpił błąd podczas sprawdzania uprawnień.',
                        flags: 64,
                    });
                }

                const rows = results as RowDataPacket[];
                if (!rows.length) {
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

                try {
                    await voiceChannel.permissionOverwrites.edit(interaction.guild.roles.everyone, {
                        Connect: false,
                    });

                    await voiceChannel.permissionOverwrites.edit(member.id, {
                        Connect: true,
                        ViewChannel: true,
                        ManageChannels: true,
                    });

                    connection.query(
                        'UPDATE temp_channels SET status = ? WHERE channel_id = ?',
                        ['private', voiceChannel.id],
                        err => {
                            if (err) console.error('Błąd aktualizacji bazy danych:', err);
                        }
                    );
                    type DashboardData = {
                        owner: string;
                        status: string;
                        members: string;
                        bans: string;
                    };

                    const getDashboardData = (): Promise<DashboardData> => {
                        return new Promise((resolve, reject) => {
                            connection.query(
                                'SELECT owner_id, status FROM temp_channels WHERE channel_id = ?',
                                [voiceChannel.id],
                                (err, results) => {
                                    if (err) return reject(err);
                                    const rows = results as RowDataPacket[];
                                    if (!rows.length) return reject('Brak danych o kanale');

                                    const { owner_id, status } = rows[0];

                                    connection.query(
                                        'SELECT user_id FROM channel_members WHERE channel_id = ?',
                                        [voiceChannel.id],
                                        (err2, memberResults) => {
                                            if (err2) return reject(err2);
                                            const memberRows = memberResults as RowDataPacket[];
                                            const members =
                                                memberRows.map(r => `<@${r.user_id}>`).join(', ') ||
                                                'Brak';

                                            connection.query(
                                                'SELECT user_id FROM channel_bans WHERE channel_id = ?',
                                                (err3, banResults) => {
                                                    if (err3) return reject(err3);
                                                    const banRows = banResults as RowDataPacket[];
                                                    const bans =
                                                        banRows.map(r => `<@${r.user_id}>`).join(', ') ||
                                                        'No bans';
                                                        'No bans';

                                                    resolve({
                                                        owner: `<@${owner_id}>`,
                                                        status:
                                                            status === 'private'
                                                                ? '🔒 Prywatny'
                                                                : '🎉 Publiczny',
                                                        members,
                                                        bans,
                                                    });
                                                }
                                            );
                                        }
                                    );
                                }
                            );
                        });
                    };

                    const dashboardData = await getDashboardData();

                    const embed = new EmbedBuilder()
                        .setTitle('Panel tymczasowego kanału głosowego')
                        .setDescription('Możesz zarządzać tutaj swoim kanałem głosowym.')
                        .addFields(
                            { name: 'Status kanału', value: dashboardData.status, inline: true },
                            { name: 'Właściciel', value: dashboardData.owner, inline: true },
                            { name: 'Członkowie', value: dashboardData.members, inline: true },
                            { name: 'Bany', value: dashboardData.bans, inline: true }
                        )
                        .setColor(0x00cc99);

                    const buttons = new ActionRowBuilder<ButtonBuilder>().addComponents(
                        new ButtonBuilder()
                            .setCustomId('make_public')
                            .setLabel('Ustaw kanał jako publiczny')
                            .setStyle(ButtonStyle.Secondary),
                        new ButtonBuilder()
                            .setCustomId('change_name')
                            .setLabel('Zmień nazwę')
                            .setStyle(ButtonStyle.Secondary),
                        new ButtonBuilder()
                            .setCustomId('change_owner')
                            .setLabel('Zmień właściciela')
                            .setStyle(ButtonStyle.Secondary),
                        new ButtonBuilder()
                            .setCustomId('change_limit')
                            .setLabel('Zmień limit')
                            .setStyle(ButtonStyle.Secondary)
                    );

                    const buttons2 = new ActionRowBuilder<ButtonBuilder>().addComponents(
                new ButtonBuilder()
                    .setCustomId('ban_user')
                    .setLabel('Zbanuj użytkownika')
                    .setStyle(ButtonStyle.Danger),
                new ButtonBuilder()
                    .setCustomId('kick_user')
                    .setLabel('Wyrzuć użytkownika')
                    .setStyle(ButtonStyle.Danger)
            );

                    await interaction.update({
                        embeds: [embed],
                        content: 'Kanał został ustawiony jako prywatny.',
                        components: [buttons, buttons2],
                    });
                } catch (error) {
                    console.error('Błąd przy ustawianiu prywatności:', error);
                    return await interaction.reply({
                        content: 'Wystąpił błąd podczas ustawiania kanału jako prywatnego.',
                        flags: 64,
                    });
                }
            }
        );
    },
});
