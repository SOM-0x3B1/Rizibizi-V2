const { ActivityType } = require('discord.js');
const { dbPool, valueExists } = require('../../utility/db.js');

module.exports = {
    name: 'ready',
    once: true,
    async execute(client) {
        const conn = await dbPool.getConnection();
        client.guilds.cache.forEach(async (guild) => {
            if (!await valueExists(conn, 'guild', 'dcID', guild.id))
                conn.query("INSERT INTO guild(dcID,name) VALUES(?, ?)", [guild.id, guild.name]);
        });
        conn.end();

        client.user.setActivity({
            name: 'while you sleep 👁️',
            type: ActivityType.Watching
        });

        console.log(`Ready! ${client.user.tag} is logged in and online.`);
    }
}