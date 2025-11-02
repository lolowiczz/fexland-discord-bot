import { Event } from '../extensions';
import client from '..';
import config from '../../config.json';
import mysql, { RowDataPacket } from 'mysql2';
import { ActionRowBuilder, ButtonBuilder, ButtonStyle, TextChannel } from 'discord.js';

const connection = mysql.createConnection({
    host: process.env.MYSQL_HOST,
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE,
});

connection.connect();

let lastChar = '';

const loadLastCharFromDB = () => {
    return new Promise<string>((resolve, reject) => {
        connection.query<RowDataPacket[]>(
            'SELECT last_char FROM word_game WHERE channel_id = ? LIMIT 1',
            [config.channels.wordGameChannel],
            (error, results) => {
                if (error) return reject(error);
                if (results.length > 0) {
                    resolve(results[0].last_char);
                } else {
                    connection.query(
                        'INSERT INTO word_game (channel_id, last_char) VALUES (?, ?)',
                        [config.channels.wordGameChannel, ''],
                        err => {
                            if (err) return reject(err);
                            resolve('');
                        }
                    );
                }
            }
        );
    });
};

const updateLastCharInDB = (newChar: string) => {
    connection.query('UPDATE word_game SET last_char = ? WHERE channel_id = ?', [
        newChar,
        config.channels.wordGameChannel,
    ]);
};

export default new Event('messageCreate', async message => {
    if (message.author.bot) return;
    if (!message.guild) return;

    const ignoredChannels: string[] = config.channels.antylinkChannels;

    if (!ignoredChannels.includes(message.channel.id)) {
        connection.query('SELECT is_active, banned_words FROM antylink', (err, results) => {
            if (err) {
                console.error('Błąd podczas pobierania danych z bazy:', err);
                return;
            }

            const rows = results as RowDataPacket[];
            if (!rows || rows.length === 0) return;

            const row = rows[0] as any;
            if (!row.is_active) return;

            let bannedWords: string[] = [];
            try {
                bannedWords = JSON.parse(row.banned_words);
                if (!Array.isArray(bannedWords)) {
                    console.error('banned_words nie jest tablicą!');
                    return;
                }
            } catch (e) {
                console.error('Nieprawidłowy JSON w banned_words:', e);
                return;
            }

            const messageContent = message.content.toLowerCase();
            if (bannedWords.some(word => messageContent.includes(word.toLowerCase()))) {
                message.delete().catch(console.error);
                message.channel
                    .send(`${message.author}, twoja wiadomość zawiera zabronione słowa!`)
                    .then((msg: any) => {
                        setTimeout(() => msg.delete().catch(console.error), 5000);
                    });
                return;
            }
        });
    }

    // STORY
    if (message.channel.id === config.channels.storyChannel) {
        const sentMessage = await message.channel.send({ content: message.content });

        const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
            new ButtonBuilder()
                .setCustomId(`story_yes-${sentMessage.id}`)
                .setLabel('Tak')
                .setStyle(ButtonStyle.Success),
            new ButtonBuilder()
                .setCustomId(`story_no-${sentMessage.id}`)
                .setLabel('Nie')
                .setStyle(ButtonStyle.Danger)
        );

        await sentMessage.edit({ components: [row] });
    }

    // LAST LETTER
    if (message.channel.id === config.channels.wordGameChannel) {
        const channel = client.channels.cache.get(config.channels.wordGameChannel) as TextChannel;

        const userWord = message.content.trim().toLowerCase();

        if (lastChar === '') {
            try {
                lastChar = await loadLastCharFromDB();
            } catch (err) {
                console.error('Błąd przy wczytywaniu znaku z bazy:', err);
                return;
            }
        }

        if (lastChar !== '') {
            if (userWord.charAt(0) !== lastChar) {
                await message.delete();
                return;
            }
        }

        const cleanWord = userWord.replace(/[^\p{L}\d]$/gu, '');
        const newLastChar = cleanWord.charAt(cleanWord.length - 1);

        lastChar = newLastChar;
        updateLastCharInDB(lastChar);

        const webhooks = await channel.fetchWebhooks();
        let webhook = webhooks.find(wh => wh.name === 'WordGameWebhook');
        if (!webhook) {
            webhook = await channel.createWebhook({
                name: message.member?.displayName ?? message.author.username,
                avatar: client.user?.displayAvatarURL(),
                reason: 'Do wysyłania wiadomości jako użytkownik',
            });
        }

        await message.delete();

        await webhook.send({
            content: message.content,
            username: message.member?.displayName ?? message.author.username,
            avatarURL: message.author.displayAvatarURL(),
        });
    }
    

    const prefix = client.config.prefix;
    if (!message.content.startsWith(prefix)) return;

    const args = message.content.slice(prefix.length).trim().split(/ +/g);
    const commandName = args.shift().toLowerCase();

    const command = client.messageCommands.get(commandName);
    if (!command) return;
    command.run({
        args,
        client,
        message,
    });
});
