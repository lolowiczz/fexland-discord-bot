import { Event } from '../../extensions/event';
import fs from 'fs';
import path from 'path';
import bannedIds from '../../../bannedId.json';
import config from '../../../config.json';
import { ColorResolvable, EmbedBuilder, TextChannel } from 'discord.js';
import bannedWords from "../../../bannedwords.json";

const cooldownsPath = path.join(__dirname, '../../../promoCooldowns.json');
const awaitingResponsePath = path.join(__dirname, '../../../awaitingResponse.json');

let promoCooldowns: Record<string, number> = {};
if (fs.existsSync(cooldownsPath)) {
    promoCooldowns = JSON.parse(fs.readFileSync(cooldownsPath, 'utf-8'));
}

let awaitingResponse: Record<string, boolean> = {};
if (fs.existsSync(awaitingResponsePath)) {
    awaitingResponse = JSON.parse(fs.readFileSync(awaitingResponsePath, 'utf-8'));
}

export default new Event('messageCreate', async message => {
    if (message.author.bot) return;
    if (message.guild) return;

    const userId = message.author.id;

    if (bannedIds.includes(userId)) return;

    const reply = message.content.trim();

    if (reply === 'nie') {
        bannedIds.push(userId);
        fs.writeFileSync(
            path.join(__dirname, '../../../bannedId.json'),
            JSON.stringify(bannedIds, null, 2),
            'utf-8'
        );
        await message.reply(config.autoBlockDMs.replyAdded);
        console.log(`(AutoBlock) Dodano do ban listy: ${userId}`);
        delete awaitingResponse[userId];
        fs.writeFileSync(awaitingResponsePath, JSON.stringify(awaitingResponse, null, 2), 'utf-8');
    } else if (reply === 'tak') {
        const now = Date.now();
        const lastUsed = promoCooldowns[userId] || 0;
        const twentyFourHours = 24 * 60 * 60 * 1000;

        if (now - lastUsed < twentyFourHours) {
            const remaining = Math.ceil((twentyFourHours - (now - lastUsed)) / (60 * 60 * 1000));
            return await message.channel.send(`❗ Możesz przesłać reklamę tylko raz na 24 godziny.\nSpróbuj ponownie za ${remaining} godzin.`);
        }

        await message.channel.send('# Podeślij swoją reklamę, a ja ją przekażę do administracji.');
        const { partnerEmbed } = config;
        await message.channel.send({
            embeds: [
                new EmbedBuilder()
                    .setTitle(partnerEmbed.title)
                    .setDescription(partnerEmbed.description)
                    .setColor(partnerEmbed.color as ColorResolvable)
                    .setFooter({ text: partnerEmbed.footer })
                    .setTimestamp()
            ]
        });

        const filter = (m: any) => m.author.id === userId;
        const promoMsg = await message.channel.awaitMessages({ filter, max: 1, time: 120000 });
        const promotion = promoMsg.first()?.content;

        if (promotion) {
            const filteredPromotion = promotion
                .replace(/@everyone/gi, '[everyone]')
                .replace(/@here/gi, '[here]');

            const guild = message.client.guilds.cache.get(config.guildId);
            const channel = guild?.channels.cache.get(config.channels.partnershipChannel) as TextChannel;

            if (channel && channel.isTextBased()) {
                if (!bannedWords.some(word => filteredPromotion.includes(word))) {
                    await channel.send(`📨 Nowa reklama od <@${userId}>:\n${filteredPromotion}`);
                    await message.channel.send('Twoja reklama została przesłana ✅');

                    promoCooldowns[userId] = now;
                    fs.writeFileSync(cooldownsPath, JSON.stringify(promoCooldowns, null, 2), 'utf-8');
                } else {
                    await message.channel.send('Twoja reklama zawiera zablokowane słowa.');
                }
            } else {
                await message.channel.send('Wystąpił błąd przy przesyłaniu reklamy.');
                console.error('Nie znaleziono kanału partnerskiego lub nie jest tekstowy.');
            }
        } else {
            await message.channel.send('Nie otrzymałem reklamy w wyznaczonym czasie ⏳');
        }
    }
});
