import {
  Client,
  TextChannel,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} from "discord.js";
import mysql from "mysql2";
import config from "../../config.json";

const connection = mysql.createConnection({
    host: process.env.MYSQL_HOST,
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE,
});

connection.connect();

export async function endGiveaway(client: Client, giveaway: any): Promise<boolean> {
  try {
    const channel = await client.channels.fetch(giveaway.channel_id).catch(() => null);
    if (!channel || !channel.isTextBased()) return false;

    const message = await (channel as TextChannel).messages.fetch(giveaway.message_id).catch(() => null);
    if (!message) return false;

    const entries: string[] = JSON.parse(giveaway.entries || "[]");
    const guild = (channel as TextChannel).guild;

    if (entries.length === 0) {
      const noParticipantsEmbed = new EmbedBuilder()
        .setDescription(`Brak uczestników, konkurs został anulowany.`)
        .setColor("#00ff43")
        .setFooter({ text: "Konkurs zakończony bez zwycięzców." });

      const disabledRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder()
          .setCustomId("giveaway_join_disabled")
          .setLabel(`Konkurs zakończony • Brak uczestników`)
          .setStyle(ButtonStyle.Danger)
          .setDisabled(true)
      );

      await message.edit({ embeds: [noParticipantsEmbed], components: [disabledRow] });
      connection.query("UPDATE giveaways SET ended = 1 WHERE id = ?", [giveaway.id]);
      return true;
    }

    const boosterRoleId = config.roles.giveaway.boosterRole;
    const wspierajacyRoleId = config.roles.giveaway.premiumRole;

    const weightedEntries: string[] = [];

    for (const userId of entries) {
      const member = await guild.members.fetch(userId).catch(() => null);
      if (!member) continue;

      let weight = 1;
      if (member.roles.cache.has(boosterRoleId)) weight = 10;
      else if (member.roles.cache.has(wspierajacyRoleId)) 5;

      console.log(`Uczestnik ${userId} ma szans: ${weight}`);

      for (let i = 0; i < weight; i++) {
        weightedEntries.push(userId);
      }
    }

    const winnersCount = giveaway.winners_count || 1;
    const shuffled = weightedEntries.sort(() => 0.5 - Math.random());
    const winners: string[] = [];
    const picked: Set<string> = new Set();

    for (const id of shuffled) {
      if (!picked.has(id)) {
        picked.add(id);
        winners.push(id);
      }
      if (winners.length >= winnersCount) break;
    }

    const winnerMentions = winners.map((id) => `<@${id}>`).join(", ");
    const participantsCount = entries.length;

    const endedEmbed = new EmbedBuilder()
      .setDescription(
        `
          ## <a:konkurs:1391781347692908655>  Konkurs zakończony! <a:konkurs:1391781347692908655> 
          > - Do wygrania było: **${giveaway.prize}**
          > - Zwycięzca(owie): ${winnerMentions}
          ## <a:konkurs:1391781347692908655>  Zwiększone szanse 
          **Przypominamy o zwiększonych szansach 👇**
          > - Ranga <@&${boosterRoleId}> ma **10 LOSÓW** w tym konkursie.
          > - Ranga <@&${wspierajacyRoleId}> ma **5 LOSÓW** w tym konkursie.

          Nie możesz już **wziąć udziału** w tym **konkursie**, wyczekuj na następny!
        `
      )
      .setColor("#d946ef");

    const disabledRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setCustomId("giveaway_join_disabled")
        .setLabel(`Konkurs został zakończony • ${participantsCount} uczestników`)
        .setStyle(ButtonStyle.Danger)
        .setDisabled(true)
    );

    await message.edit({ embeds: [endedEmbed], components: [disabledRow] });

    connection.query("UPDATE giveaways SET ended = 1 WHERE id = ?", [giveaway.id]);

    for (let i = 0; i < winners.length; i++) {
      await message.reply(`\`#${i + 1}\` - <@${winners[i]}>`);
    }

    return true;
  } catch (error) {
    console.error("Błąd przy kończeniu konkursu:", error);
    return false;
  }
}
