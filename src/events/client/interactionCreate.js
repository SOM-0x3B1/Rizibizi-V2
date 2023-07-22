const { dbPool, valueExists } = require('../../db.js');
var crypto = require('crypto');

module.exports = {
    name: 'interactionCreate',
    async execute(interaction, client) {
        if (interaction.isChatInputCommand()) {
            const { commands } = client;
            const { commandName } = interaction;
            const command = commands.get(commandName);

            if (!command)
                return;

            try {
                await command.execute(interaction, client);
            } catch (err) {
                console.error(err);
                try {
                    await interaction.reply({
                        content: ':warning: Something went horribly wrong while executing this command... :warning:',
                        ephemeral: true
                    });
                } catch (err2) {
                    console.log('=================');
                    console.error(err2);
                }
            }
        }
        else if (interaction.isModalSubmit()) {
            const playlistName = interaction.fields.getTextInputValue('playlistName');
            const playlistDesc = interaction.fields.getTextInputValue('playlistDesc');

            const conn = await dbPool.getConnection();
            if (!await valueExists(conn, 'name', playlistName)) {
                const id = crypto.randomBytes(6).toString('hex');
                const editKey = crypto.randomBytes(8).toString('hex');
                const values = [id, editKey, playlistName, playlistDesc, interaction.user.id, interaction.guildId, interaction.user.username];
                await conn.query("INSERT INTO playlist(id,editKey,name,description,editorID,guildID,editorName) VALUES(?, ?, ?, ?, ?, ?, ?)", values);
                await interaction.reply(`:page_with_curl: Playlist named **${playlistName}** created successfully. \n Global playlist ID: **${id}**`);                
            }
            else{
                await interaction.reply({
                    content: `:warning: A playlist named ${playlistName} already exists.`,
                    ephemeral: true
                });
            }            
        }
    }
}