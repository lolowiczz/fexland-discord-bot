import { Command } from '../../handlers';
import Discord, { ApplicationCommandType, EmbedBuilder, Role } from 'discord.js';

export default new Command({
    name: 'roleinfo',
    description: "Sprawdź informacje o roli",
    type: ApplicationCommandType.ChatInput,
    options: [
        {
            name: 'rola',
            description: 'Rola, której informacje chcesz sprawdzić',
            type: Discord.ApplicationCommandOptionType.Role,
            required: true,
        }
    ],
    run: async ({ interaction, args }) => {
        const role = args.getRole('rola') as Role;
        if (!role) {
            await interaction.reply({ content: 'Nie znaleziono roli.', flags: 64 });
            return;
        }

        const members = role.members.map(member => member.user.username).join(', ') || 'Brak członków';

        await interaction.reply({
            embeds: [
                new EmbedBuilder()
                    .setTitle(`Informacje o roli: ${role.name}`)
                    .addFields(
                        { name: 'ID', value: role.id, inline: true },
                        { name: 'Członkowie', value: members },
                        { name: 'Kolor', value: role.hexColor, inline: true },
                        { name: 'Utworzona', value: `<t:${Math.floor(role.createdTimestamp / 1000)}:F>`, inline: true },
                        { name: 'Poziom uprawnień', value: role.permissions.toArray().join(', ') || 'Brak uprawnień' },
                        { name: 'Wizualizacja', value: role.toString(), inline: true },
                        { name: 'Pozycja', value: role.position.toString(), inline: true },
                        { name: 'Czy jest to rola administracyjna?', value: role.hoist ? 'Tak' : 'Nie', inline: true },
                    )
            ],
        });
    },
});