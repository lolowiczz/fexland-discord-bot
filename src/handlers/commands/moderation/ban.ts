import { ApplicationCommandOptionType, ApplicationCommandType, EmbedBuilder, TextChannel } from 'discord.js';
import config from '../../../../config.json';
import { Command } from '../../handlers';

export default new Command({
    name: 'ban',
    type: ApplicationCommandType.ChatInput,
    description: 'Zbanuj użytkownika',
    options: [
        {
            name: 'osoba',
            description: 'Użytkownik do zbanowania',
            type: ApplicationCommandOptionType.User,
            required: true,
        },
        {
            name: 'powod',
            description: 'Powód bana',
            type: ApplicationCommandOptionType.String,
            required: false,
        },
    ],
    run: async ({ interaction, args }) => {
        const user = args.getUser('osoba');
        const reason = args.getString('powod') || 'Brak powodu';
        const logChannel = interaction.guild?.channels.cache.get(config.channels.logChannel) as TextChannel;

        if (interaction.user.id === user.id) {
            return interaction.reply({
                content: 'Nie możesz zbanować samego siebie!',
                flags: 64,
            });
        }
        if (
            interaction.guild?.members.me?.roles.highest.position! <=
            interaction.guild.members.cache.get(user.id)?.roles.highest.position!
        ) {
            return interaction.reply({
                content: 'Nie mogę zbanować tej osoby!',
                flags: 64,
            });
        }
        if (!interaction.guild?.members.me?.permissions.has('BanMembers')) {
            return interaction.reply({
                content: 'Nie mam uprawnień do zbanowania tej osoby!',
                flags: 64,
            });
        }

        if (!interaction.guild?.members.cache.get(user.id)?.permissions.has('BanMembers')) {
            if (interaction.guild?.members.cache.get(user.id)?.permissions.has('BanMembers')) {
                return interaction.reply({
                    content: 'Nie mogę zbanować tej osoby!',
                    flags: 64,
                });
            }
            if (interaction.member.roles.cache.has(config.permissions.ban)) {
                try {
                    const member = await interaction.guild.members.fetch(user.id);
                    const dmChannel = await member.createDM();
                    await dmChannel.send({
                        embeds: [
                            new EmbedBuilder()
                                .setColor('Red')
                                .setDescription(
                                    `
                                ## ℹ️ Zostałeś zbanowany na naszym serwerze
                                > - **Administrator**: ${interaction.user}
                                > - **Powód**: ${reason}
                                > - **Czas trwania kary**: Na zawsze
                                 
                                ** 📰 Możesz złożyć odwołanie do kary klikając w [FexLand](https://szkola.ovh/Fexland)**
                                `
                                )
                                .setFooter({
                                    text: `${interaction.user.username}`,
                                    iconURL: interaction.user.displayAvatarURL(),
                                })
                                .setTimestamp(),
                        ],
                    });
                } catch (error) {
                    return interaction.reply({
                        content:
                            'Nie mogę wysłać wiadomości prywatnej do tego użytkownika (ma wyłączone DM).',
                        flags: 64,
                    });
                }

                await interaction.guild.members
                    .ban(user.id, {
                        reason: reason,
                    })
                    .then(async () => {
                        return interaction
                            .reply({
                                embeds: [
                                    new EmbedBuilder()
                                        .setColor('Green')
                                        .setTitle('Zbanowano użytkownika')
                                        .setDescription(
                                            `Zbanowano użytkownika ${user} (${user.id})`
                                        )
                                        .addFields({
                                            name: 'Powód',
                                            value: reason,
                                        })
                                        .setTimestamp()
                                        .setFooter({
                                            text: `Zbanował ${interaction.user.tag}`,
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
                                                `## Zbanowano użytkownika\n> <@${user.id}> (${user.id})`
                                            )
                                            .setFooter({
                                                text: `Zbanował ${interaction.user.tag}`,
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
                            content: 'Nie mogę zbanować tej osoby!',
                            flags: 64,
                        });
                    });
            } else {
                return interaction.reply({
                    content: 'Nie masz uprawnień do zbanowania tej osoby!',
                    flags: 64,
                });
            }
        }
    },
});
