import { EmbedBuilder, TextChannel } from 'discord.js';
import fs from 'fs';
import path from 'path';
import client from '../..';
import { Event } from '../../extensions/event';
import config from '../../../config.json';
import mysql, { RowDataPacket } from 'mysql2';

const connection = mysql.createConnection({
    host: process.env.MYSQL_HOST,
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE,
});

connection.connect();

const questionsPath = path.join(__dirname, '../../dailyQuestions.json');

export default new Event('messageCreate', async (message) => {
    if (message.author.bot) return;

    const channel = client.channels.cache.get(config.channels.dailyQuestionChannel) as TextChannel;
    if (!channel) return;

    const today = new Date().toISOString().split('T')[0];

    connection.query(
        'SELECT * FROM daily_questions_state WHERE posted_date = ? LIMIT 1',
        [today],
        async (err, results) => {
            if (err) {
                console.error('Błąd zapytania SQL:', err);
                return;
            }

            if ((results as RowDataPacket[]).length > 0) {
                return;
            }

            const questions = JSON.parse(fs.readFileSync(questionsPath, 'utf-8'));
            if (questions.length === 0) {
                await channel.send('❌ Brak pytań w bazie danych.');
                return;
            }

            connection.query(
                'SELECT question_number FROM daily_questions_state ORDER BY id DESC LIMIT 1',
                async (err2, lastResult) => {
                    if (err2) {
                        console.error('Błąd przy pobieraniu ostatniego pytania:', err2);
                        return;
                    }

                    let nextQuestionNumber = 1;
                    if ((lastResult as RowDataPacket[]).length > 0) {
                        nextQuestionNumber = (lastResult as RowDataPacket[])[0].question_number + 1;
                    }

                    const questionText = questions[nextQuestionNumber - 1];
                    if (!questionText) {
                        await channel.send('🛑 Wszystkie pytania zostały już zadane.');
                        return;
                    }

                    const embed = new EmbedBuilder()
                        .setAuthor({ name: `${client.user?.username} - Pytanie dnia`, iconURL: client.user?.displayAvatarURL() })
                        .setDescription(`> - **Pytanie dnia**: \`#${nextQuestionNumber}\`\n> - **Treść**: ${questionText}`)
                        .setFooter({ text: `${client.user.username} - Pytania dnia`, iconURL: client.user?.displayAvatarURL() })
                        .setTimestamp();

                    const sentMessage = await channel.send({ embeds: [embed] });

                    connection.query(
                        'INSERT INTO daily_questions_state (question_number, question_text, posted_date) VALUES (?, ?, ?)',
                        [nextQuestionNumber, questionText, today],
                        (err3) => {
                            if (err3) console.error('Błąd przy zapisie do bazy:', err3);
                        }
                    );

                    await sentMessage.startThread({
                        name: questionText,
                        autoArchiveDuration: 60,
                        reason: 'Dyskusja do pytania dnia'
                    });
                }
            );
        }
    );
});
