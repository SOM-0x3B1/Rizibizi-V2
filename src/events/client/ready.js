const { ActivityType } = require('discord.js');

module.exports = {
    name: 'ready',
    once: true,
    async execute(client){
        client.user.setActivity({
            name: 'while you sleep 👁️',
            type: ActivityType.Watching
        });

        console.log(`Ready! ${client.user.tag} is logged in and online.`);
    }
}