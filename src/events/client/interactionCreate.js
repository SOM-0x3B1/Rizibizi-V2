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
    }
}