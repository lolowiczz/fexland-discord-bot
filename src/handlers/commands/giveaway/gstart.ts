import { Command } from '../../handlers';
import {
    ApplicationCommandType,
    ApplicationCommandOptionType,
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    ComponentType,
} from 'discord.js';
import config from '../../../../config.json';
import mysql from 'mysql2';

const connection = mysql.createConnection({
    host: process.env.MYSQL_HOST,
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE,
});

connection.connect();

function parseDuration(input: string): number | null {
    const regex = /(\d+)([dhms])/g;
    let totalMs = 0;
    let match;

    const multipliers: Record<string, number> = {
        d: 24 * 60 * 60 * 1000,
        h: 60 * 60 * 1000,
        m: 60 * 1000,
        s: 1000,
    };

    while ((match = regex.exec(input.toLowerCase())) !== null) {
        const value = parseInt(match[1]);
        const unit = match[2];
        if (isNaN(value) || !multipliers[unit]) {
            return null;
        }
        totalMs += value * multipliers[unit];
    }

    if (totalMs === 0) return null;
    return totalMs;
}

export default new Command({
    name: 'gstart',
    description: 'Starts a giveaway',
    type: ApplicationCommandType.ChatInput,
    options: [
        {
            name: 'nagroda',
            description: 'Nagroda giveaway’a',
            type: ApplicationCommandOptionType.String,
            required: true,
        },
        {
            name: 'wygrani',
            description: 'Ilość zwycięzców',
            type: ApplicationCommandOptionType.Integer,
            required: true,
        },
        {
            name: 'czas',
            description: 'Czas trwania giveaway’a (np. 1d, 3h30m, 45m, 10s)',
            type: ApplicationCommandOptionType.String,
            required: true,
        },
    ],
    run: async ({ interaction, args }) => {
        const prize = args.getString('nagroda')!;
        const winners = args.getInteger('wygrani')!;
        const durationInput = args.getString('czas')!;

        const duration = parseDuration(durationInput);
        if (duration === null) {
            return interaction.reply({
                content: '❌ Niepoprawny format czasu. Użyj np. 1d, 3h30m, 45m, 10s.',
                flags: 64,
            });
        }

        const boosterRoleId = config.roles.giveaway.boosterRole;
        const wspierajacyRoleId = config.roles.giveaway.premiumRole;

        const endsAt = Date.now() + duration;

        const embed = new EmbedBuilder()
            .setDescription(
                `
                ## <a:konkurs:1391781347692908655>  Konkurs! <a:konkurs:1391781347692908655> 
                > - Do wygrania: **${prize}**
                > - Zwycięzca(owie): **${winners}**
                > - Zakończenie: <t:${Math.floor(endsAt / 1000)}:R>
                > - Host: ${interaction.user}
                ## <a:konkurs:1391781347692908655>  Zwiększone szanse 
                **Przypominamy o zwiększonych szansach 👇**
                > - Ranga <@&${boosterRoleId}> ma **10 LOSÓW** w tym konkursie.
                > - Ranga <@&${wspierajacyRoleId}> ma **5 LOSÓW** w tym konkursie.

                Aby wziąć udział, kliknij przycisk poniżej!
                `
            )
            .setColor('#d946ef');

        const joinButton = new ButtonBuilder()
            .setCustomId('join_giveaway')
            .setLabel('Weź udział')
            .setStyle(ButtonStyle.Primary);

        const row = new ActionRowBuilder<ButtonBuilder>().addComponents(joinButton);

        const msg = await interaction.channel!.send({
            embeds: [embed],
            components: [row],
        });

        connection.query(
            'INSERT INTO giveaways (message_id, channel_id, guild_id, prize, winners_count, ends_at, host_id) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [
                msg.id,
                msg.channel.id,
                interaction.guildId,
                prize,
                winners,
                endsAt,
                interaction.user.id,
            ],
            err => {
                if (err) {
                    console.error(err);
                    return interaction.reply({
                        content: "❌ Błąd podczas zapisywania giveaway'a w bazie danych.",
                        flags: 64,
                    });
                }

                interaction.reply({ content: '✅ Giveaway został rozpoczęty!', flags: 64 });
            }
        );
    },
});
