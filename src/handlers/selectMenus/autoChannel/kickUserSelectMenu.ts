import {
  VoiceChannel,
} from 'discord.js';
import { SelectMenu } from '../../handlers';

export default new SelectMenu({
  custom_id: 'kickUserSelectMenu',
  type: 'User',
  run: async ({ interaction, client }) => {
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
        const userToKick = await interaction.guild.members.fetch(selectedUserId);
        if (!userToKick.voice.channel || userToKick.voice.channel.id !== voiceChannel.id) {
            return interaction.reply({
                content: 'Wybrany użytkownik nie jest na tym samym kanale głosowym.',
                flags: 64,
            });
        }
        await userToKick.voice.disconnect('Wykopany przez właściciela kanału');
      await interaction.reply({
        content: `Użytkownik <@${selectedUserId}> został wykopany z kanału głosowego.`,
        flags: 64,
      });
    } catch (error) {
      console.error('Błąd przy wykopywaniu użytkownika:', error);
      return interaction.reply({
        content: 'Wystąpił błąd podczas wykopywania użytkownika.',
        flags: 64,
      });
    }
  },
});
