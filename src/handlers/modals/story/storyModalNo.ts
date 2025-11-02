import { Modal } from '../../handlers';
import mysql from 'mysql2';
import config from '../../../../config.json';
import {
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    TextChannel,
} from 'discord.js';
import bannedWords from '../../../../bannedwords.json';

const connection = mysql.createConnection({
    host: process.env.MYSQL_HOST,
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE,
});

connection.connect();

export default new Modal({
    custom_id: 'storyModalNo',
    run: async ({ interaction, fields }) => {
        const msgInput = fields.getTextInputValue('msgInput');
        const finalMessage = `**NIE** - ${msgInput}`;

        const targetChannel = interaction.client.channels.cache.get(config.channels.storyChannel) as TextChannel;
        if (!targetChannel) {
            return await interaction.reply({
                content: 'Nie udało się znaleźć kanału docelowego.',
                flags: 64,
            });
        }

        const webhooks = await targetChannel.fetchWebhooks();
        let webhook = webhooks.find(wh => wh.name === 'storyWebhook');

        if (!webhook) {
            webhook = await targetChannel.createWebhook({
                name: 'storyWebhook',
                avatar: interaction.client.user?.displayAvatarURL(),
                reason: 'Webhook do wysyłania wiadomości jako użytkownik',
            });
        }

        if (interaction.message && interaction.message.edit) {
            try {
                await interaction.message.edit({ components: [] });
            } catch (err) {
            }
        }

        const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
            new ButtonBuilder()
                .setCustomId('story_yes')
                .setLabel('Tak')
                .setStyle(ButtonStyle.Success),
            new ButtonBuilder()
                .setCustomId('story_no')
                .setLabel('Nie')
                .setStyle(ButtonStyle.Danger)
        );

        if (
            msgInput.includes("https://") ||
            msgInput.includes("@everyone") ||
            msgInput.includes("@here") ||
            msgInput.includes("discord.gg") ||
            (bannedWords as string[]).some((word: string) => msgInput.includes(word))
        ) {
            return await interaction.reply({
            content: 'Twoja wiadomość zawiera niedozwolone słowa.',
            flags: 64,
            });
        }

        await webhook.send({
            content: finalMessage,
            username: interaction.user.username,
            avatarURL: interaction.user.displayAvatarURL(),
            components: [row],
        });

        await interaction.reply({
            content: 'Twoja wiadomość została wysłana przez webhook!',
            flags: 64,
        });
    },
});
