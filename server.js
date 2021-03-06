const Discord = require('discord.js');
const Canvas = require('canvas');
const { prefix, botLogs } = require('./config.json');
const fs = require('fs');
const db = require('quick.db');

const client = new Discord.Client({
  disableEveryone: true
});

// HANDLER

client.commands = new Discord.Collection();

const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
	const command = require(`./commands/${file}`);
	client.commands.set(command.name, command);
};

// ACTIVITY

client.once('ready', () => {
	console.log('Ready!');
  client.user.setActivity('BOKEP', { type: `STREAMING` });
});

client.on("guildCreate", guild => {
  const gcembed = new Discord.MessageEmbed()
  .setColor('#00ff00')
  .setTitle(`New guild joined: ${guild.name} (id: ${guild.id}). This guild has ${guild.memberCount} members!`)
  .setTimestamp()
  client.channels.cache.get(botLogs).send(gcembed);
});

client.on("guildDelete", guild => {
  const gdembed = new Discord.MessageEmbed()
  .setColor('#ff0000')
  .setTitle(`I have been removed from: ${guild.name} (id: ${guild.id})`)
  .setTimestamp()
  client.channels.cache.get(botLogs).send(gdembed);
});


// CHECK


client.on('message', message => {
  
  if (!message.content.startsWith(prefix) || message.author.bot) return;
  if (!message.guild) return;
  
const args = message.content.slice(prefix.length).trim().split(/ +/g);
const command = args.shift().toLowerCase();
  
  if (!client.commands.has(command)) return;

	try {
		client.commands.get(command).run(client, message, args);
	} catch (error) {
		console.error(error);
		message.reply('there was an error trying to execute that command!');
	}
  
});

// START OF CANVAS

client.on("guildMemberAdd", async (member) => {
  let chx = db.get(`wchan_${member.guild.id}`);
  
  if(chx === null) {
    return;
  }

  const applyText = (canvas, text) => {
	const ctx = canvas.getContext('2d');
	let fontSize = 70;

	do {
		ctx.font = `${fontSize -= 10}px sans-serif`;
	} while (ctx.measureText(text).width > canvas.width - 300);

	return ctx.font;
  };
  
  const canvas = Canvas.createCanvas(700, 250);
	const ctx = canvas.getContext('2d');
  
  var imgx = db.get(`wimg_${member.guild.id}`);

	const background = await Canvas.loadImage(`${imgx}`);
	ctx.drawImage(background, 0, 0, canvas.width, canvas.height);

	ctx.strokeStyle = '#74037b';
	ctx.strokeRect(0, 0, canvas.width, canvas.height);

	ctx.font = '28px sans-serif';
	ctx.fillStyle = '#ffffff';
	ctx.fillText(`Welcome to ${member.guild.name}`, canvas.width / 2.5, canvas.height / 3.5);

	ctx.font = applyText(canvas, `${member.displayName}!`);
	ctx.fillStyle = '#ffffff';
	ctx.fillText(`${member.displayName}!`, canvas.width / 2.5, canvas.height / 1.8);

	ctx.beginPath();
	ctx.arc(125, 125, 100, 0, Math.PI * 2, true);
	ctx.closePath();
	ctx.clip();

	const avatar = await Canvas.loadImage(member.user.displayAvatarURL({ format: 'jpg' }));
	ctx.drawImage(avatar, 25, 25, 200, 200);
  
  var greet = db.get(`wgreet_${member.guild.id}`);

	const attachment = new Discord.MessageAttachment(canvas.toBuffer(), 'welcome-image.png');
  
  if (greet.indexOf("<USER>") != -1) greet = greet.replace("<USER>", `${member}`);
  if (greet.indexOf("<GUILD>") != -1) greet = greet.replace("<GUILD>", `${member.guild.name}`);
  
  client.channels.cache.get(chx).send(`${greet}`, attachment);

});

// END OF CANVAS
  
client.login(process.env.TOKEN);