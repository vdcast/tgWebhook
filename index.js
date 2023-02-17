const TelegramApi = require('node-telegram-bot-api')

const {gameOptions, againOptions} = require('./options')

const sequelize = require('./db');
const UserModel = require('./models');
//const User = require('./models');

//   Sequelize in this file
//const Sequelize = require("sequelize");
//const sequelize = new Sequelize(
// 'jsTest',
// 'doadmin',
// 'AVNS_vEgY7mWLXd6lEG8rTA1',
//  {
//    host: 'jstest-bot-do-user-13571195-0.b.db.ondigitalocean.com',
//	port: '25061',
//    dialect: 'postgres',
//	dialectOptions: {
//		ssl: {
//		  require: true,
//		  rejectUnauthorized: false
//		}
//	}
//  }
//);


//import { Sequelize, Model, DataTypes } from 'sequelize'

//const sequelize = new Sequelize('mydb', 'mydbuser', 'pass', {
//  host: 'localhost',
//  port: '5432',
//  dialect: 'postgres',
//  logging: false
//})

const token = '5579772730:AAGqlcg5oy9bfCQC5cSQt4PztKtHljSonoU'

//const bot = new TelegramApi(token, {polling: true})

const TOKEN = process.env.TELEGRAM_TOKEN || token;
const TelegramBot = require('../..');
const options = {
    webhook: { // Optional. Use webhook instead of polling.
        url: 'https://vds40410.xxvps.net', // HTTPS url to send updates to.
        host: '91.228.218.230', // Webhook server host.
        port: 80, // Server port.
        maxConnections: 40 // Optional. Maximum allowed number of simultaneous HTTPS connections to the webhook for update delivery
    }
};
// Heroku routes from port :443 to $PORT
// Add URL of your app to env variable or enable Dyno Metadata
// to get this automatically
// See: https://devcenter.heroku.com/articles/dyno-metadata
const url = process.env.APP_URL || 'https://<app-name>.herokuapp.com:443';
const bot = new TelegramBot(TOKEN, options);


// This informs the Telegram servers of the new webhook.
// Note: we do not need to pass in the cert, as it already provided
bot.setWebHook(`${url}/bot${TOKEN}`);

const chats = {}


const startGame = async (chatId) => {
	await bot.sendMessage (chatId, 'Now I will think of digit (0-9) and you need to guess it. Good luck! :)');
	const randomNumber = Math.floor(Math.random() * 10)
	chats[chatId] = randomNumber;
		
	await bot.sendMessage(chatId, 'Guess the number...', gameOptions);
}



const start = async () => {

	try {
        await sequelize.authenticate();
        await sequelize.sync();
		console.log('CONNecting SUCCESS.')
    } catch (e) {
        console.log('CONNecting to database disconnected failed.', e)
    }



	bot.setMyCommands([
		{command: '/start', description: "Welcome message"},
		{command: '/info', description: "Get more info"},
		{command: '/game', description: "Game Guess The Number"}
	])


//	const kyc = await Kyc.findOne({
//		where: {
//		  userID: req.user.id,
//		}
//	  });


	bot.on('message', async msg => {
		const chatId = msg.chat.id;
		const text = msg.text;
		const textStart = 'Welcome to vdcast telegram bot. Nice to meet you! :) Please, pick from the following options and use my powerful skills! ^_^'
		

		try {
			if (text === '/start') {
				const user = await UserModel.findOne({chatId})
				if (chatId.toString !== user.chatId) {
					await UserModel.create({chatId})
				}
				await bot.sendSticker(chatId, 'https://cdn.tlgrm.app/stickers/ccd/a8d/ccda8d5d-d492-4393-8bb7-e33f77c24907/192/1.webp')
				return bot.sendMessage(chatId, textStart);
			}
			if (text === '/info') {
				const user = await UserModel.findOne({chatId})
				await bot.sendMessage(chatId, 'Your name is ' + msg.from.first_name)
				await bot.sendMessage(chatId, 'Your username is @' + msg.from.username)
				await bot.sendMessage(chatId, 'Correct answers: ' + user.right)
				return bot.sendMessage(chatId, 'Wrong answers: ' + user.wrong)
			}
			if (text === '/game') {
				return startGame(chatId);
			}
		} catch (e) {
			return bot.sendMessage(chatId, 'Some error, please check, I dont know' + e)
		}


		console.log(msg)

		const keks2 = await UserModel.findOne({chatId})

		await bot.sendMessage(chatId, keks2.chatId)
		await bot.sendMessage(chatId, text)
		return bot.sendMessage(chatId, 'I do not understand you, try again!')
		
	})


	bot.on('callback_query', async msg => {
		const data = msg.data;
		const chatId = msg.message.chat.id;

		if (data == '/again') {
			return startGame(chatId)
		}

		const user = await UserModel.findOne({chatId})

		if (data == chats[chatId]) {
			user.right += 1;
			await bot.sendMessage(chatId, 'Bot made a number: ' + chats[chatId])
			await bot.sendMessage(chatId, "Congratulations! You are lucky today :)", againOptions)
		} else {
			user.wrong += 1;
			await bot.sendMessage(chatId, 'You have chosen: ' + data)
			await bot.sendMessage(chatId, 'Bot made a number: ' + chats[chatId])
			await bot.sendMessage(chatId, "You missed. Try again! :)", againOptions)
		}

		await user.save();

	})


}

start ()