import { Event } from '../extensions';
import client from '..';

export default new Event('messageCreate', async message => {
    if (message.author.bot) return;
    if (!message.guild) return;

    const prefix = client.config.prefix;
    if (!message.content.startsWith(prefix)) return;

    const args = message.content.slice(prefix.length).trim().split(/ +/g);
    const commandName = args.shift().toLowerCase();

    const command = client.messageCommands.get(commandName);
    if (!command) return;
    command.run({
        args,
        client,
        message,
    });
});
