import { MessageTracker } from '../../services/sendMessage';
import { MessageCommand } from '../handlers';
import config from '../../../config.json';

export default new MessageCommand({
    name: 'send',
    run: async ({ message }) => {
        if (
            message.member &&
            message.member.roles &&
            message.member.roles.cache.has(config.roles.sendCommand)
        ) {
            const tracker = new MessageTracker(message.client);
            const sentCount = await tracker.sendMessageToAllMembers(
                message.guild!,
                config.partnerMessage.replaceAll("\n", '\n')
            );

            await message.reply({
                content: `Wysłano wiadomość do ${sentCount} członków serwera.`,
            });
        }
    },
});
