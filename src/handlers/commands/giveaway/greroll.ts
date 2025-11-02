// commands/greroll.ts
import { Client, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, TextChannel, ApplicationCommandOptionType, ApplicationCommandType } from 'discord.js';
import mysql, { RowDataPacket } from 'mysql2';
import { Command } from '../../handlers';

const connection = mysql.createConnection({
    host: process.env.MYSQL_HOST,
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE,
});

connection.connect();

export default new Command({
  name: 'greroll',
  description: 'Losuje nowych zwycięzców dla zakończonego giveaway na podstawie message_id',
  options: [
    {
      name: 'message_id',
      type: ApplicationCommandOptionType.String,
      description: 'ID wiadomości giveaway',
      required: true,
    },
  ],
    type: ApplicationCommandType.ChatInput,
  run: async ({ interaction, client, args }) => {
    const messageId = args.getString('message_id', true);

    connection.query(
      "SELECT * FROM giveaways WHERE message_id = ? AND ended = 1",
      [messageId],
      async (err, results: RowDataPacket[]) => {
        if (err) {
          console.error("❌ Błąd MySQL przy pobieraniu giveaway:", err);
          await interaction.reply({ content: 'Wystąpił błąd przy pobieraniu giveaway.', flags: 64 });
          return;
        }

        if (!results.length) {
          await interaction.reply({ content: 'Nie znaleziono zakończonego giveaway o podanym message_id.', flags: 64 });
          return;
        }

        const giveaway = results[0];
        try {
          const channel = await client.channels.fetch(giveaway.channel_id).catch(() => null);
          if (!channel || !channel.isTextBased()) {
            await interaction.reply({ content: 'Nie mogę znaleźć kanału giveaway lub nie jest to kanał tekstowy.', flags: 64 });
            return;
          }

          const message = await (channel as TextChannel).messages.fetch(giveaway.message_id).catch(() => null);
          if (!message) {
            await interaction.reply({ content: 'Nie mogę znaleźć wiadomości giveaway.', flags: 64 });
            return;
          }

          const entries: string[] = JSON.parse(giveaway.entries || "[]");
          const participantsCount = entries.length;

          if (participantsCount === 0) {
            await interaction.reply({ content: 'Brak uczestników w giveaway, nie można przeprowadzić rerolla.', flags: 64 });
            return;
          }

          const winnersCount = giveaway.winners_count || 1;
          const shuffled = entries.sort(() => 0.5 - Math.random());
          const winners = shuffled.slice(0, winnersCount);
          const winnerMentions = winners.map(id => `<@${id}>`).join(", ");

          // Embed z nowymi zwycięzcami
          const rerollEmbed = new EmbedBuilder()
            .setDescription(
              `
              ## 🔄 Nowi zwycięzcy giveaway!
              > - Do wygrania było: **${giveaway.prize}**
              > - Nowy zwycięzca(owie): ${winnerMentions}
              ## <a:konkurs:1391781347692908655>  Zwiększone szanse 
              **Przypominamy o zwiększonych szansach 👇**
              > - Ranga \`Wspierający\` ma **5 LOSÓW** w tym konkursie.
              > - Ranga \`Booster\` ma **10 LOSÓW** w tym konkursie.
              `
            )
            .setColor("#d946ef");

          const disabledRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
            new ButtonBuilder()
              .setCustomId("giveaway_join_disabled")
              .setLabel(`Konkurs zakończony • ${participantsCount} uczestników`)
              .setStyle(ButtonStyle.Danger)
              .setDisabled(true)
          );

          await message.edit({ embeds: [rerollEmbed], components: [disabledRow] });
            const winnersList = winners.map((id, idx) => `**#${idx + 1} »** <@${id}>`).join('\n');
            await message.reply(`### 🔄 Nowi zwycięzcy konkursu: \n${winnersList}`);
            await interaction.reply({ content: `✅ Reroll giveaway zakończony! Nowi zwycięzcy: ${winnerMentions}`, flags: 64 });
        } catch (error) {
          console.error("❌ Błąd podczas rerolla giveaway:", error);
          await interaction.reply({ content: 'Wystąpił błąd podczas rerolla giveaway.', flags: 64 });
        }
      }
    );
  },
});
