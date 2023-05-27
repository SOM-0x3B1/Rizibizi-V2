const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v9');
const fs = require('fs');

module.exports = (client) => {
    client.handleCommands = async () => {
        const commandsFolders = fs.readdirSync('./src/commands');
        const { commands, commandArray } = client;

        for (const folder of commandsFolders) {
            const commandFiles = fs
                .readdirSync(`./src/commands/${folder}`)
                .filter((file) => file.endsWith('.js'));

            for (const file of commandFiles) {
                const command = require(`../../commands/${folder}/${file}`);
                commands.set(command.data.name, command);
                commandArray.push(command.data.toJSON());
                console.log(`Command: ${folder} / ${command.data.name} handled`);
            }
        }

        const clientId = '1111391677651877969';
        const rest = new REST({ version: '9' }).setToken(process.env.token);
        try {
            console.log('Sarted refresing application (/) commands.');

            await rest.put(Routes.applicationCommands(clientId), {
                body: commandArray,
            });

            console.log('Successfully reloaded application (/) commands.');
        } catch (err) {
            console.error(err);
        }
    };
};