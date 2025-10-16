import { Command } from '../../handlers';
import { ApplicationCommandType, ApplicationCommandOptionType, EmbedBuilder } from 'discord.js';
import util from 'node:util';

export default new Command({
    name: 'eval',
    description: "Wykonuje kod JavaScript (tylko dla właściciela)",
    type: ApplicationCommandType.ChatInput,
    options: [
        {
            name: 'code',
            description: 'Kod JavaScript/TypeScript do wykonania',
            type: ApplicationCommandOptionType.String,
            required: true,
        },
    ],
    run: async ({ interaction, args }) => {
        if (interaction.user.id !== "530805653468479500") {
            return interaction.reply({ content: '❌ Tylko właściciel bota może tego użyć.', flags: 64 });
        }

        const input = args.getString('code', true) as string;

        try {
            let evaled = await eval(input);

            if (typeof evaled !== 'string') {
                evaled = util.inspect(evaled, { depth: 1 });
            }

            if (evaled.length > 4000) evaled = evaled.slice(0, 3990) + '...';

            const embed = new EmbedBuilder()
                .setColor('Green')
                .setTitle('✅ Eval wykonany')
                .addFields(
                    { name: '📥 Wejście', value: `\`\`\`ts\n${input}\`\`\`` },
                    { name: '📤 Wynik', value: `\`\`\`js\n${evaled}\`\`\`` }
                )
                .setFooter({ text: `Wykonano przez ${interaction.user.tag}`, iconURL: interaction.user.displayAvatarURL() })
                .setTimestamp();

            return interaction.reply({ embeds: [embed], flags: 64 });
        } catch (error) {
            const errEmbed = new EmbedBuilder()
                .setColor('Red')
                .setTitle('❌ Błąd podczas eval')
                .addFields(
                    { name: '📥 Wejście', value: `\`\`\`ts\n${input}\`\`\`` },
                    { name: '🛑 Błąd', value: `\`\`\`js\n${(error as Error).toString()}\`\`\`` }
                )
                .setFooter({ text: `Wykonano przez ${interaction.user.tag}`, iconURL: interaction.user.displayAvatarURL() })
                .setTimestamp();

            return interaction.reply({ embeds: [errEmbed], flags: 64 });
        }
    },
});
