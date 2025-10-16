import { Command } from '../../handlers';
import { ApplicationCommandType, AttachmentBuilder } from 'discord.js';
import mysql from 'mysql2';
import Canvas, { CanvasRenderingContext2D } from 'canvas';

const connection = mysql.createConnection({
    host: process.env.MYSQL_HOST,
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE,
});

connection.connect();

function getRequiredXP(level: number): number {
    return 5 * level * level + 50 * level + 100;
}

function roundRect(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    width: number,
    height: number,
    radius: number
) {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
}

export default new Command({
    name: 'xp',
    description: 'Sprawdź swój poziom i XP',
    type: ApplicationCommandType.ChatInput,
    run: async ({ interaction }) => {
        const userId = interaction.user.id;

        connection.query(
            'SELECT * FROM user_levels WHERE user_id = ?',
            [userId],
            async (err, results) => {
                if (err) {
                    console.error(err);
                    await interaction.reply({ content: 'Błąd bazy danych.', flags: 64 });
                    return;
                }

                const user = results[0];
                if (!user) {
                    await interaction.reply({
                        content: 'Nie znaleziono danych o Twoim poziomie.',
                        flags: 64,
                    });
                    return;
                }

                const { xp, level } = user;
                const requiredXP = getRequiredXP(level);

                const width = 600;
                const height = 100;
                const canvas = Canvas.createCanvas(width, height);
                const ctx = canvas.getContext('2d');

                ctx.fillStyle = '#23272A';
                ctx.fillRect(0, 0, width, height);

                const avatarSize = 80;
                const avatarX = 20;
                const avatarY = (height - avatarSize) / 2;

                ctx.fillStyle = '#6a4dbf';
                ctx.beginPath();
                ctx.arc(
                    avatarX + avatarSize / 2,
                    avatarY + avatarSize / 2,
                    avatarSize / 2 + 4,
                    0,
                    Math.PI * 2
                );
                ctx.fill();

                const avatarURL = interaction.user.displayAvatarURL({
                    extension: 'png',
                    size: 128,
                });
                const avatar = await Canvas.loadImage(avatarURL);

                ctx.save();
                ctx.beginPath();
                ctx.arc(
                    avatarX + avatarSize / 2,
                    avatarY + avatarSize / 2,
                    avatarSize / 2,
                    0,
                    Math.PI * 2
                );
                ctx.closePath();
                ctx.clip();
                ctx.drawImage(avatar, avatarX, avatarY, avatarSize, avatarSize);
                ctx.restore();

                const textBlockX = avatarX + avatarSize + 30;
                const textBlockWidth = width - textBlockX - 20;
                const totalTextHeight = 24 + 10 + 18 + 20 + 10;

                const textBlockY = (height - totalTextHeight) / 2;

                ctx.fillStyle = '#d9c8ff';
                ctx.font = 'bold 24px Arial';
                ctx.textBaseline = 'top';
                ctx.fillText(`Poziom: ${level}`, textBlockX, textBlockY);

                ctx.font = '18px Arial';
                ctx.fillText(`XP: ${xp} / ${requiredXP}`, textBlockX, textBlockY + 34); 

                const barWidth = textBlockWidth;
                const barHeight = 20;
                const barX = textBlockX;
                const barY = textBlockY + 34 + 25; 

                const radius = 10;

                ctx.fillStyle = '#4a3a7b';
                roundRect(ctx, barX, barY, barWidth, barHeight, radius);
                ctx.fill();

                const progress = Math.min(xp / requiredXP, 1);
                ctx.fillStyle = '#9b7de8';
                roundRect(ctx, barX, barY, barWidth * progress, barHeight, radius);
                ctx.fill();

                ctx.strokeStyle = '#b7a9ff';
                ctx.lineWidth = 2;
                roundRect(ctx, barX, barY, barWidth, barHeight, radius);
                ctx.stroke();

                const attachment = new AttachmentBuilder(canvas.toBuffer(), { name: 'level.png' });
                await interaction.reply({ files: [attachment] });
            }
        );
    },
});
