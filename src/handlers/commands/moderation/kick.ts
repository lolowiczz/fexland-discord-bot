import {
    ApplicationCommandOptionType,
    ApplicationCommandType,
    EmbedBuilder,
    TextChannel,
} from 'discord.js';
import config from '../../../../config.json';
import { Command } from '../../handlers';

export default new Command({
    name: 'kick',
    type: ApplicationCommandType.ChatInput,
    description: 'Wyrzuć użytkownika',
    options: [
        {
            name: 'osoba',
            description: 'Użytkownik do wyrzucenia',
            type: ApplicationCommandOptionType.User,
            required: true,
        },
    ],
    run: async ({ interaction, args }) => {
        const user = args.getUser('osoba');
        const logChannel = interaction.guild?.channels.cache.get(
            config.channels.logChannel
        ) as TextChannel;

        if (interaction.user.id === user.id) {
            return interaction.reply({
                content: 'Nie możesz wyrzucić samego siebie!',
                flags: 64,
            });
        }
        if (
            interaction.guild?.members.me?.roles.highest.position! <=
            interaction.guild.members.cache.get(user.id)?.roles.highest.position!
        ) {
            return interaction.reply({
                content: 'Nie mogę wyrzucić tej osoby!',
                flags: 64,
            });
        }
        if (!interaction.guild?.members.me?.permissions.has('KickMembers')) {
            return interaction.reply({
                content: 'Nie mam uprawnień do wyrzucenia tej osoby!',
                flags: 64,
            });
        }
        if (!interaction.guild?.members.cache.get(user.id)) {
            return interaction.reply({
                content: 'Nie mogę wyrzucić tej osoby!',
                flags: 64,
            });
        }
        if (interaction.member.roles.cache.has(config.permissions.kick)) {
            await interaction.guild.members
                .kick(user.id)
                .then(() => {
                    return interaction
                        .reply({
                            embeds: [
                                new EmbedBuilder()
                                    .setColor('Green')
                                    .setTitle('Wyrzucono użytkownika')
                                    .setDescription(`Wyrzucono użytkownika ${user} (${user.id})`)
                                    .setTimestamp()
                                    .setFooter({
                                        text: `Wyrzucił ${interaction.user.tag}`,
                                        iconURL: interaction.user.displayAvatarURL(),
                                    }),
                            ],
                            flags: 64,
                        })
                        .then(() => {
                            logChannel.send({
                                embeds: [
                                    new EmbedBuilder()
                                        .setColor('Red')
                                        .setDescription(
                                            `## Wyrzucono użytkownika\n> <@${user.id}> (${user.id})`
                                        )
                                        .setFooter({
                                            text: `Wyrzucił ${interaction.user.tag}`,
                                            iconURL: interaction.user.displayAvatarURL(),
                                        })
                                        .setTimestamp(),
                                ],
                            });
                        });
                })
                .catch(err => {
                    console.log(err);
                    return interaction.reply({
                        content: 'Nie mogę wyrzucić tej osoby!',
                        flags: 64,
                    });
                });
        } else {
            return interaction.reply({
                content: 'Nie masz uprawnień do wyrzucania użytkowników!',
                flags: 64,
            });
        }
    },
});
