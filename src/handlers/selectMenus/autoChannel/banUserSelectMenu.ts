import {
  VoiceChannel,
} from 'discord.js';
import { SelectMenu } from '../../handlers';
import mysql from 'mysql2';

const connection = mysql.createConnection({
    host: process.env.MYSQL_HOST,
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE,
});

connection.connect();

export default new SelectMenu({
  custom_id: 'banUserSelectMenu',
  type: 'User',
  run: async ({ interaction }) => {
    const member = interaction.member;
    const selectedUserId = interaction.values[0];

    const channel = interaction.guild.channels.cache.get(interaction.channelId);
    if (!channel) {
      return interaction.reply({ content: 'Nie znaleziono kanału.', flags: 64 });
    }

    const voiceChannel = interaction.guild.channels.cache.find(
      (ch): ch is VoiceChannel =>
        ch.type === 2 &&
        ch.parentId === channel.parentId &&
        ch.name.includes(member.user.username)
    );

    if (!voiceChannel) {
      return interaction.reply({
        content: 'Nie znaleziono powiązanego kanału głosowego.',
        flags: 64,
      });
    }

    try {
      await new Promise<void>((resolve, reject) => {
        connection.query(
          'INSERT IGNORE INTO channel_bans (channel_id, user_id) VALUES (?, ?)',
          [voiceChannel.id, selectedUserId],
          (err) => {
            if (err) return reject(err);
            resolve();
          }
        );
      });

      await voiceChannel.permissionOverwrites.edit(selectedUserId, {
        Connect: false,
      });

      await interaction.reply({
        content: `Użytkownik <@${selectedUserId}> został zbanowany i nie może dołączać do kanału głosowego.`,
        flags: 64,
      });
    } catch (error) {
      console.error('Błąd przy banowaniu użytkownika:', error);
      return interaction.reply({
        content: 'Wystąpił błąd podczas banowania użytkownika.',
        flags: 64,
      });
    }
  },
});
