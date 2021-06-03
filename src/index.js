'use strict';
const chalk = require('chalk');
const co = require('co');
const {getRc, setRc, getPing, getByAtrrBool, consoleLog} = require('./utils');
const { getLastVersion} = require('./reportInfo/index');
const help = require('./help');
const install = require('./install');
const reinstall = require('./reinstall');
const publish = require('./publish');
const npm = require('./npm');
const del = require('./delete');
const sync = require('./sync');
const deploy = require('./deploy');
const fix = require('./fix');
const download = require('./download');
const updateInfo = require('./updateInfo');
const update = require('./update');

function getHelp() {
	console.log(chalk.green(" Usage : "));
	console.log(chalk.green(" ac sample init sample"));
	process.exit(0);
}

function getVersion() {
	console.log(chalk.green(require("../package.json").version));
	process.exit(0);
}
function consoleNoVersion(mastVesion) {
	console.log(chalk.yellow(`YNPM-[WARNING]:Current version is ${mastVesion}`));
	console.log(chalk.yellow(`YNPM-[WARNING]:No latest version information obtained`));
	console.log(chalk.yellow(`YNPM-[WARNING]:You can continue with the current version, but at risk`));
}
function checkVersion(check) {
	if(!check) {
		return new Promise((reslove)=>{reslove()});
	}
	const cVesion = require("../package.json").version;
	if(process.version.split('.')[0].replace('v', '') < 6) {
		console.log(chalk.yellow(`node version is ${process.version}`))
	}
	const mastVesion = cVesion.split('-')[0];
	return getLastVersion().then(res => {
		if(res) {
			if(!~cVesion.indexOf(res)) {
				console.log('\n');
				console.log(chalk.yellow(`YNPM-[WARNING]:Current version is ${mastVesion}, but the latest version is ${res}\n`));
				console.log(chalk.yellow(`YNPM-[WARNING]:Please use the following command to update\n`));
				console.log(chalk.green(`--------------------------------------\n`));
				console.log(chalk.green(`          npm i ynpm-tool -g\n`));
				console.log(chalk.green(`--------------------------------------\n`));
			}
		} else {
			consoleNoVersion(mastVesion)
		}
	}).catch(err => {
		consoleNoVersion(mastVesion)
	});
}

module.exports = {
	plugin: function (options, global) {
		let commands = options.cmd;
		const argvs = process.argv;
		let check = true
		if(argvs.indexOf('-no-check') > -1) {
			argvs.splice(argvs.indexOf('-no-check'), 1)
			check = false
		}
		const fun = function(){
			switch (commands) {
				case "-h":
				case "-help":
					help.help();
					break;
				case "-v":
				case "-version":
					help.version();
					break;
				case "i":
					process.argv[2] = 'install';
					co(function* () {
						// Ping内网;
						install(yield getPing('install'), '');
					}).catch(err => {
						console.error(chalk.red('\n' + err));
					});
					break;
				case "updateInfo":
					co(function* () {
						// Ping内网;
						updateInfo(yield getPing(), '');
					}).catch(err => {
						console.error(chalk.red('\n' + err));
					});
					break;
				case "update":
					co(function* () {
						// Ping内网;
						update(yield getPing(), '');
					}).catch(err => {
						console.error(chalk.red('\n' + err));
					});
					break;
				case "del":
					co(function* () {
						// Ping内网;
						del(yield getPing(), '');
					}).catch(err => {
						console.error(chalk.red('\n' + err));
					});
					break;
				case "download":
					co(function* () {
						// Ping内网;
						download(yield getPing(), '');
					}).catch(err => {
						console.error(chalk.red('\n' + err));
					});
					break;
				case "reinstall":
				case "rei":
					co(function* () {
						// Ping内网;
						reinstall(yield getPing(), '');
					}).catch(err => {
						console.error(chalk.red('\n' + err));
					});
					break;
				case "install":
					co(function* () {
						// Ping内网;
						install(yield getPing(), '');
					}).catch(err => {
						console.error(chalk.red('\n' + err));
					});
					break;
				case "sync":
					co(function* () {
						// Ping内网;
						sync(yield getPing(), '');
					}).catch(err => {
						console.error(chalk.red('\n' + err));
					});
					break;
				case "deploy": //远程部署静态文件
					co(function* () {
						// Ping内网;
						deploy(yield getPing(), '');
					}).catch(err => {
						console.error(chalk.red('\n' + err));
					});
					break;
				case "fix":
					co(function* () {
						// Ping内网;
						fix(yield getPing(), '');
					}).catch(err => {
						console.error(chalk.red('\n' + err));
					});
					break;
				case "installdev":
					//替换 installdev 成 install
					process.argv[2] = 'install'
					co(function* () {
						// Ping内网;
						install(yield getPing(), 'dev');
					}).catch(err => {
						console.error(chalk.red('\n' + err));
					});
					break;
				case "publish":
					co(function* () {
						// Ping内网;
						publish(yield getPing());
					}).catch(err => {
						console.error(chalk.red('\n' + err));
					});
					break;
				case "set":
					let config = setRc("ynpm");
					break;
				case "sshk":
					let ynpmrcCon = getRc("ynpm");
					if(!ynpmrcCon.user) {
						console.log('need user!');
					} else if(!ynpmrcCon.ynpmUser) {
						console.log('need ynpmUser!')
					} else if(!ynpmrcCon.ynpmPassword) {
						console.log('need ynpmPassword!')
					} else {
						help.showSSHKMsg(ynpmrcCon.sshk);
					}
					break;
				default:
					co(function* () {
						// Ping内网;
						npm(yield getPing());
					}).catch(err => {
						console.error(chalk.red('\n' + err));
					});
			}
		};
		checkVersion(check).then(() => {
			fun();
		}).catch(err => {
			fun();
		})
	}
}
