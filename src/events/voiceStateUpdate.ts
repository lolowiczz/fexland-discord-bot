import { Event } from '../extensions/event';
import {
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    ChannelType,
    EmbedBuilder,
    PermissionsBitField,
    TextChannel,
} from 'discord.js';
import config from '../../config.json';
import client from '..';
import mysql from 'mysql2';

const connection = mysql.createConnection({
    host: process.env.MYSQL_HOST,
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE,
});

connection.connect();

const AUTOKANAL_ID = config.channels.autoChannel;
const LOG_CHANNEL_ID = config.channels.logChannel;

export default new Event('voiceStateUpdate', async (oldState, newState) => {
    const guild = newState.guild;
    const member = newState.member || oldState.member;
    if (!member) return;

    const user = member.user;
    const oldChannel = oldState.channel;
    const newChannel = newState.channel;
    const logChannel = client.channels.cache.get(LOG_CHANNEL_ID) as TextChannel;

    // =========================
    // 🔊 LOGI GŁOSOWE
    // =========================

    if (logChannel) {
        if (!oldChannel && newChannel) {
            await logChannel.send({
                embeds: [
                    new EmbedBuilder()
                        .setAuthor({
                            name: user.username,
                            iconURL: user.displayAvatarURL(),
                        })
                        .setDescription(`${member} dołączył do <#${newChannel.id}>`)
                        .setColor('Green')
                        .setTimestamp(),
                ],
            });
        } else if (oldChannel && !newChannel) {
            await logChannel.send({
                embeds: [
                    new EmbedBuilder()
                        .setAuthor({
                            name: user.username,
                            iconURL: user.displayAvatarURL(),
                        })
                        .setDescription(`${member} opuścił <#${oldChannel.id}>`)
                        .setColor('Red')
                        .setTimestamp(),
                ],
            });
        } else if (oldChannel && newChannel && oldChannel.id !== newChannel.id) {
            await logChannel.send({
                embeds: [
                    new EmbedBuilder()
                        .setAuthor({
                            name: user.username,
                            iconURL: user.displayAvatarURL(),
                        })
                        .setDescription(
                            `${member} przeszedł z <#${oldChannel.id}> do <#${newChannel.id}>`
                        )
                        .setColor('Orange')
                        .setTimestamp(),
                ],
            });
        }
    }

    // =========================
    // 🔄 AUTOKANAŁ: Tworzenie nowego kanału
    // =========================

    if (newState.channelId === AUTOKANAL_ID && oldState.channelId !== AUTOKANAL_ID) {
        const autokanal = guild.channels.cache.get(AUTOKANAL_ID);

        try {
            const autokanelCategory = autokanal?.parent;
            
            const newVoiceChannel = await guild.channels.create({
                name: `〔 🔊 〕${user.username}`,
                type: ChannelType.GuildVoice,
                parent: autokanelCategory?.id,
                permissionOverwrites: [
                    {
                        id: guild.id,
                        allow: [
                            PermissionsBitField.Flags.Connect,
                            PermissionsBitField.Flags.ViewChannel,
                        ],
                    },
                    {
                        id: member.id,
                        allow: [
                            PermissionsBitField.Flags.Connect,
                            PermissionsBitField.Flags.ManageChannels,
                            PermissionsBitField.Flags.ViewChannel,
                        ],
                    },
                ],
            });

            await newState.setChannel(newVoiceChannel);

            connection.query(
                'INSERT INTO temp_channels (channel_id, owner_id, status) VALUES (?, ?, ?)',
                [newVoiceChannel.id, member.id, 'public'],
                err => {
                    if (err) console.error('Błąd przy zapisie temp_channels:', err);
                }
            );

            connection.query(
                'INSERT INTO channel_members (channel_id, user_id) VALUES (?, ?)',
                [newVoiceChannel.id, member.id],
                err => {
                    if (err) console.error('Błąd przy zapisie channel_members:', err);
                }
            );

            type ChannelDashboardData = {
                owner: string;
                status: string;
                members: string;
                bans: string;
            };

            const getChannelDashboardData = async (
                channelId: string
            ): Promise<ChannelDashboardData> => {
                return new Promise((resolve, reject) => {
                    connection.query(
                        'SELECT owner_id, status FROM temp_channels WHERE channel_id = ?',
                        [channelId],
                        (err, results: any) => {
                            if (err) return reject(err);
                            if (!results.length) return reject('Brak danych o kanale');

                            const { owner_id, status } = results[0];

                            // 2. Pobierz członków
                            connection.query(
                                'SELECT user_id FROM channel_members WHERE channel_id = ?',
                                [channelId],
                                (err2, memberResults: any) => {
                                    if (err2) return reject(err2);

                                    const members =
                                        (memberResults as any[])
                                            .map((row: any) => `<@${row.user_id}>`)
                                            .join(', ') || 'Brak';

                                    // 3. Pobierz bany
                                    connection.query(
                                        'SELECT user_id FROM channel_bans WHERE channel_id = ?',
                                        [channelId],
                                        (err3, banResults: any) => {
                                            if (err3) return reject(err3);

                                            const bans =
                                                (banResults as any[])
                                                    .map((row: any) => `<@${row.user_id}>`)
                                                    .join(', ') || 'Brak banów';

                                            return resolve({
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

            const dashboardData = await getChannelDashboardData(newVoiceChannel.id);

            // Embed z GUI
            const dashboardEmbed = new EmbedBuilder()
                .setTitle('Panel tymczasowego kanału głosowego')
                .setDescription('Możesz zarządzać tutaj swoim kanałem głosowym.')
                .addFields(
                    { name: 'Status kanału', value: dashboardData.status, inline: true },
                    { name: 'Właściciel', value: dashboardData.owner, inline: true },
                    { name: 'Członkowie', value: dashboardData.members, inline: true },
                    { name: 'Bany', value: dashboardData.bans, inline: true }
                )
                .setColor(0x00ffcc);

            const buttons = new ActionRowBuilder<ButtonBuilder>().addComponents(
                new ButtonBuilder()
                    .setCustomId('make_private')
                    .setLabel('Ustaw kanał jako prywatny')
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

            if (newVoiceChannel) {
                await newVoiceChannel.send({
                    content: `<@${member.id}>`,
                    embeds: [dashboardEmbed],
                    components: [buttons, buttons2],
                });
            }
        } catch (error) {
            console.error('Błąd przy tworzeniu/przenoszeniu kanału:', error);
        }
    }

    // =========================
    // 🗑️ AUTOKANAŁ: Usuwanie pustych kanałów
    // =========================

if (
    oldChannel &&
    oldChannel.parent?.id === guild.channels.cache.get(AUTOKANAL_ID)?.parent?.id &&
    oldChannel.id !== AUTOKANAL_ID &&
    oldChannel.members.size === 0
) {
    connection.query(
        'SELECT * FROM temp_channels WHERE channel_id = ?',
        [oldChannel.id],
        async (err, results: any) => {
            if (err) {
                console.error('Błąd przy sprawdzaniu kanału w bazie:', err);
                return;
            }

            if (results.length === 0) return;

            try {
                await oldChannel.delete();
            } catch (err2) {
                console.error('Błąd przy usuwaniu kanału:', err2);
                return;
            }

            // Usuwanie danych z bazy w poprawnej kolejności
            connection.query(
                'DELETE FROM channel_members WHERE channel_id = ?',
                [oldChannel.id],
                err3 => {
                    if (err3) {
                        console.error('Błąd przy usuwaniu wpisu channel_members:', err3);
                        return;
                    }

                    connection.query(
                        'DELETE FROM channel_bans WHERE channel_id = ?',
                        [oldChannel.id],
                        err4 => {
                            if (err4) {
                                console.error('Błąd przy usuwaniu wpisu channel_bans:', err4);
                                return;
                            }

                            connection.query(
                                'DELETE FROM temp_channels WHERE channel_id = ?',
                                [oldChannel.id],
                                err5 => {
                                    if (err5) {
                                        console.error('Błąd przy usuwaniu wpisu temp_channels:', err5);
                                    }
                                }
                            );
                        }
                    );
                }
            );
        }
    );
}


});
