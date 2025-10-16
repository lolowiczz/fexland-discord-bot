import { AttachmentBuilder, TextChannel, VoiceChannel, EmbedBuilder } from 'discord.js';
import { createCanvas, loadImage, GlobalFonts } from '@napi-rs/canvas';
import client from '..';
import { Event } from '../extensions/event';
import config from '../../config.json';

// Rejestracja czcionki
GlobalFonts.registerFromPath('./assets/fonts/Poppins-Bold.ttf', 'Poppins');

export default new Event('guildMemberAdd', async member => {
    const channel = client.channels.cache.get(config.channels.welcomeChannel) as TextChannel;
    if (!channel) return;

    const logChannel = client.channels.cache.get(config.channels.logChannel) as TextChannel;

    // Tworzenie Canvas
    const canvas = createCanvas(650, 420);
    const ctx = canvas.getContext('2d');

    // === TŁO ===
    ctx.fillStyle = '#1E1E1E';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Niebieskie przeswity (lewy górny + prawy dolny)
    const gradientLeft = ctx.createRadialGradient(0, 0, 0, 0, 0, 300);
    gradientLeft.addColorStop(0, 'rgba(0, 200, 255, 0.4)');
    gradientLeft.addColorStop(1, 'transparent');
    ctx.fillStyle = gradientLeft;
    ctx.fillRect(0, 0, 350, 350);

    const gradientRight = ctx.createRadialGradient(
        canvas.width,
        canvas.height,
        0,
        canvas.width,
        canvas.height,
        300
    );
    gradientRight.addColorStop(0, 'rgba(0, 200, 255, 0.4)');
    gradientRight.addColorStop(1, 'transparent');
    ctx.fillStyle = gradientRight;
    ctx.fillRect(canvas.width - 350, canvas.height - 350, 350, 350);

    // === GŁÓWNY PROSTOKĄT ===
    const cardX = 60;
    const cardY = 40;
    const cardWidth = canvas.width - 120;
    const cardHeight = canvas.height - 40 - cardY;
    const radius = 20;

    ctx.beginPath();
    ctx.moveTo(cardX + radius, cardY);
    ctx.lineTo(cardX + cardWidth - radius, cardY);
    ctx.quadraticCurveTo(cardX + cardWidth, cardY, cardX + cardWidth, cardY + radius);
    ctx.lineTo(cardX + cardWidth, cardY + cardHeight - radius);
    ctx.quadraticCurveTo(
        cardX + cardWidth,
        cardY + cardHeight,
        cardX + cardWidth - radius,
        cardY + cardHeight
    );
    ctx.lineTo(cardX + radius, cardY + cardHeight);
    ctx.quadraticCurveTo(cardX, cardY + cardHeight, cardX, cardY + cardHeight - radius);
    ctx.lineTo(cardX, cardY + radius);
    ctx.quadraticCurveTo(cardX, cardY, cardX + radius, cardY);
    ctx.closePath();

    ctx.fillStyle = '#2B2B2B';
    ctx.fill();

    // === NAGŁÓWEK „Członek #” ===
    const headerText = `Członek #${member.guild?.memberCount}`;
    ctx.font = 'bold 18px Poppins';
    const headerWidth = ctx.measureText(headerText).width;
    const headerBoxPaddingX = 40;
    const headerBoxWidth = headerWidth + headerBoxPaddingX * 2;
    const headerBoxHeight = 40;
    const headerBoxX = canvas.width / 2 - headerBoxWidth / 2;
    const headerBoxY = cardY + 20;

    ctx.fillStyle = '#3A3A3A';
    ctx.beginPath();
    ctx.roundRect(headerBoxX, headerBoxY, headerBoxWidth, headerBoxHeight, 12);
    ctx.fill();

    ctx.fillStyle = '#CCCCCC';
    ctx.textAlign = 'center';
    ctx.fillText(headerText, canvas.width / 2, headerBoxY + 26);

    // === AVATAR ===
    const avatar = await loadImage(member.user.displayAvatarURL({ extension: 'png', size: 256 }));
    const avatarX = canvas.width / 2 - 55;
    const avatarY = headerBoxY + 70;

    ctx.save();
    ctx.beginPath();
    ctx.arc(canvas.width / 2, avatarY + 55, 55, 0, Math.PI * 2, true);
    ctx.closePath();
    ctx.clip();
    ctx.drawImage(avatar, avatarX, avatarY, 110, 110);
    ctx.restore();

    // === TEKST POWITALNY ===
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 26px Poppins';
    ctx.fillText(`Witaj ${member.user.username}!`, canvas.width / 2, avatarY + 160);

    ctx.font = '22px Poppins';
    ctx.fillStyle = '#CCCCCC';
    ctx.fillText('na serwerze', canvas.width / 2, avatarY + 190);

    ctx.font = 'bold 24px Poppins';
    ctx.fillStyle = '#00ff95ff';
    ctx.fillText('FexLand', canvas.width / 2, avatarY + 220);

    // === WYGENEROWANIE ZAŁĄCZNIKA ===
    const attachment = new AttachmentBuilder(await canvas.encode('png'), { name: 'welcome.png' });

    await channel.send({
        content: `[ <@${member.user.id}> ]`,
        files: [attachment],
    });

    const lastMemberChannel = client.channels.cache.get(
        config.stats.lastMember.channelId
    ) as VoiceChannel;
    if (lastMemberChannel) {
        lastMemberChannel
            .setName(
                config.stats.lastMember.channelName.replace('{USERNAME}', member.user.username)
            )
            .catch(console.error);
    }

    for (const roleId of config.welcomeRoles) {
        const role = member.guild.roles.cache.get(roleId);
        if (!role) continue;
        await member.roles.add(role).catch(console.error);
    }

    logChannel.send({
        embeds: [
            new EmbedBuilder()
                .setColor('Green')
                .setDescription(`## Nowy członek\n> <@${member.user.id}> (${member.user.tag})`)
                .setFooter({
                    text: `ID: ${member.user.id}`,
                    iconURL: member.user.displayAvatarURL(),
                })
                .setTimestamp(),
        ],
    });
});
