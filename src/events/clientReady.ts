import { ActivityType } from 'discord.js';

import client from '..';
import { Event } from '../extensions/event';
import activitiesJson from '../../config.json';

export default new Event('clientReady', () => {
    const activities = activitiesJson.activities;

    let currentIndex = -1;

    const setRandomActivity = () => {
        if (!client.user || activities.length === 0) return;

        let nextIndex: number;
        if (activities.length === 1) {
            nextIndex = 0;
        } else {
            do {
                nextIndex = Math.floor(Math.random() * activities.length);
            } while (nextIndex === currentIndex);
        }

        currentIndex = nextIndex;
        client.user.setActivity(activities[currentIndex], {
            type: ActivityType.Playing,
        });
    };

    setRandomActivity();
    const intervalId = setInterval(setRandomActivity, 10_000);

    const cleanup = () => clearInterval(intervalId);
    process.on('exit', cleanup);
    process.on('SIGINT', () => { cleanup(); process.exit(); });
    process.on('SIGTERM', cleanup);
});