import {
  VoiceChannel,
  GuildMember,
} from 'discord.js';
import { SelectMenu } from '../../handlers';
import mysql, { RowDataPacket } from 'mysql2';

const connection = mysql.createConnection({
    host: process.env.MYSQL_HOST,
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE,
});

connection.connect();

export default new SelectMenu({
  custom_id: 'changeOwnerSelectMenu',
  type: 'User',
  run: async ({ interaction, client }) => {
    const member = interaction.member as GuildMember;
    const selectedUserId = interaction.values[0];

    const channel = interaction.guild.channels.cache.get(interaction.channelId);
    if (!channel) {
      return interaction.reply({ content: 'Nie znaleziono kanału.', flags: 64 });
    }
    try {
      
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

      const ownerCheck = await new Promise<{ owner_id: string }>((resolve, reject) => {
        connection.query(
          'SELECT owner_id FROM temp_channels WHERE channel_id = ?',
          [voiceChannel.id],
          (err, results) => {
            if (err) return reject(err);
            const rows = results as RowDataPacket[];
            if (rows.length === 0) return reject('Brak danych o kanale');
            resolve(rows[0] as { owner_id: string });
          }
        );
      });

      if (ownerCheck.owner_id !== member.id) {
        return interaction.reply({
          content: 'Tylko właściciel kanału może zmienić właściciela.',
          flags: 64,
        });
      }

      await new Promise<void>((resolve, reject) => {
        connection.query(
          'UPDATE temp_channels SET owner_id = ? WHERE channel_id = ?',
          [selectedUserId, voiceChannel.id],
          (err) => {
            if (err) return reject(err);
            resolve();
          }
        );
      });

      const oldName = voiceChannel.name;
      const newMember = await interaction.guild.members.fetch(selectedUserId);
      const newName = oldName.replace(member.user.username, newMember.user.username);

      await voiceChannel.setName(newName, 'Zmiana właściciela kanału');

      await voiceChannel.permissionOverwrites.edit(selectedUserId, {
        Connect: true,
        ViewChannel: true,
        ManageChannels: true,
      });

      await voiceChannel.permissionOverwrites.edit(member.id, {
        ManageChannels: false,
      });

      await interaction.reply({
        content: `Właściciel kanału został zmieniony na <@${selectedUserId}>.`,
        flags: 64,
      });

    } catch (error) {
      console.error('Błąd przy zmianie właściciela:', error);
      return interaction.reply({
        content: 'Wystąpił błąd podczas zmiany właściciela kanału.',
        flags: 64,
      });
    }
  },
});
