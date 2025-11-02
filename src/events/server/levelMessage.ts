import { Event } from '../../extensions/event';
import { Message, TextChannel, GuildMember } from 'discord.js';
import client from '../../';
import config from '../../../config.json';
import mysql from 'mysql2';

const connection = mysql.createConnection({
    host: process.env.MYSQL_HOST,
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE,
});

connection.connect();

function getRequiredXP(level: number): number {
    return 5 * level * level + 50 * level + 100;
}

function getCooldown(level: number): number {
    return 60 * 1000 + level * 60 * 1000;
}

async function assignRole(member: GuildMember, level: number) {
    const roleConfig = config.levels.roles;
    
    const roleMappings = Object.entries({
        1: roleConfig.firstLevel, 5: roleConfig.fifthLevel, 10: roleConfig.tenthLevel,
        15: roleConfig.fifteenthLevel, 20: roleConfig.twentiethLevel, 25: roleConfig.twentyFifthLevel,
        30: roleConfig.thirtiethLevel, 35: roleConfig.thirtyFifthLevel, 40: roleConfig.fortiethLevel,
        45: roleConfig.fortyFifthLevel, 50: roleConfig.fiftiethLevel, 55: roleConfig.fiftyFifthLevel,
        60: roleConfig.sixtiethLevel, 65: roleConfig.sixtyFifthLevel, 70: roleConfig.seventiethLevel,
        75: roleConfig.seventyFifthLevel, 80: roleConfig.eightiethLevel, 85: roleConfig.eightyFifthLevel,
        90: roleConfig.ninetiethLevel, 95: roleConfig.ninetyFifthLevel, 100: roleConfig.hundredthLevel,
    }).map(([lvl, roleId]) => ({ level: +lvl, roleId })).filter(({ roleId }) => roleId);

    const targetRole = roleMappings.reverse().find(({ level: lvl }) => level >= lvl);
    const allRoleIds = new Set(roleMappings.map(({ roleId }) => roleId));

    await Promise.allSettled([
        ...Array.from(allRoleIds)
            .filter(roleId => roleId !== targetRole?.roleId && member.roles.cache.has(roleId))
            .map(roleId => member.roles.remove(roleId).catch(err => 
                console.error(`Failed to remove role ${roleId}:`, err)
            )),
        targetRole?.roleId && !member.roles.cache.has(targetRole.roleId)
            ? member.roles.add(targetRole.roleId).catch(err => 
                console.error(`Failed to add role ${targetRole.roleId}:`, err)
              )
            : Promise.resolve(),
    ]);
}


export default new Event('messageCreate', async (message: Message) => {
    if (message.author.bot || !message.guild) return;

    const userId = message.author.id;
    const now = Date.now();

    connection.query(
        'SELECT * FROM user_levels WHERE user_id = ?',
        [userId],
        async (err, results: any[]) => {
            if (err) {
                console.error('MySQL query error:', err);
                return;
            }

            let userData = results[0];

            if (!userData) {
                connection.query(
                    'INSERT INTO user_levels (user_id, xp, level, last_message_timestamp) VALUES (?, ?, ?, ?)',
                    [userId, 0, 1, 0],
                    (insertErr) => {
                        if (insertErr) console.error('MySQL insert error:', insertErr);
                    }
                );
                return;
            }

            const cooldown = getCooldown(userData.level);
            if (now - userData.last_message_timestamp < cooldown) return;

            const gainedXP = Math.floor(Math.random() * 11) + 15;
            let newXP = userData.xp + gainedXP;
            let newLevel = userData.level;

            let requiredXP = getRequiredXP(newLevel);

            while (newXP >= requiredXP) {
                newXP -= requiredXP;
                newLevel++;
                requiredXP = getRequiredXP(newLevel);

                const channel = client.channels.cache.get(
                    config.channels.levelUpChannel
                ) as TextChannel;
                if (channel) {
                    channel.send(
                        `\`[ 🥇 ]\` Gratulacje <@${userId}>, Awansujesz na poziom **${newLevel}**! \`🥳\``
                    );
                }
            }

            connection.query(
                'UPDATE user_levels SET xp = ?, level = ?, last_message_timestamp = ? WHERE user_id = ?',
                [newXP, newLevel, now, userId],
                async (updateErr) => {
                    if (updateErr) {
                        console.error('MySQL update error:', updateErr);
                        return;
                    }

                    try {
                        const member = await message.guild!.members.fetch(userId);
                        await assignRole(member, newLevel);
                    } catch (err) {
                        console.error('Błąd przy nadawaniu roli:', err);
                    }
                }
            );
        }
    );
});
