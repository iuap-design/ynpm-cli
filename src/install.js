'use strict';

const chalk = require('chalk');
const path = require('path');
const fs = require('fs');
const co = require('co');
const ora = require('ora');
const tcpp = require('tcp-ping');
const exec = require('child_process').exec;
const thunkify = require("thunkify");
const Exec = thunkify(exec);
const Ping = thunkify(tcpp.ping);
// const npminstall = require('npminstall');
const {HOST_REGISTRY,DEAFAULT_MIRROR,YON_MIRROR} = require('./utils');
const {addDownloadNum} = require('./reportInfo/index');


const IPCOMPANY = '172.20.27.204';

module.exports = (registry) => { 
    const argvs = process.argv;
    let _pack = [];
    //ynpm install 不用更新packagejson
    let isupdatepackdep = false;
    //默认 更新 dependence  
    let isupdatedevdepend = false; 
    console.log('argvs', argvs)
    console.log('argvs', argvs[3])
    if(argvs[3] == "--save" || argvs[3] == "--save-dev"){
        for(let i =4; i < argvs.length; i++){
            let pacgName = argvs[i].split("@");
            //防止包名中有@开头的(@yonyou/ac-button)
            if(pacgName[0] === '') {
                _pack.push({name: '@'+pacgName[1], version:'latest'})
            } else {
                if(pacgName.length == 2){
                    _pack.push({name: pacgName[0], version:pacgName[1]})
                }else{
                    _pack.push({ name: argvs[i], version:'latest' });
                }
            }
        }
        if(argvs[3] == "--save") {
            isupdatedevdepend = true
        }
        isupdatepackdep = true
    }else if(argvs[argvs.length-1] == "--save" || argvs[argvs.length-1] == "--save-dev"){
        for(let i =(argvs.length-2); i > 0; i--){
            if(argvs[i] == "install")break;
            let pacgName = argvs[i].split("@");
            //防止包名中有@开头的(@yonyou/ac-button)
            if(pacgName[0] === '') {
                _pack.push({name: '@'+pacgName[1], version:'latest'})
            } else {
                if(pacgName.length == 2){
                    _pack.push({name: pacgName[0], version:pacgName[1]})
                }else{
                    _pack.push({ name: argvs[i], version:'latest' });
                }
            }
        }
        if(argvs[argvs.length-1] == "--save") {
            isupdatedevdepend = true
        }
        isupdatepackdep = true
    } else if( argvs.length == 3 && argvs[2] == "install" ) { 
        //ynpm install 命令
        console.log('ynpm install ')
        try {
            let pkgJson = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'package.json'),'utf-8'))
            let dependencies = pkgJson.dependencies
            let dependencies_arr = Object.keys(dependencies)
            let devDependencies = pkgJson.devDependencies
            let devDependencies_arr = Object.keys(devDependencies)
            for(let i = 0; i< dependencies_arr.length; i++) {
                _pack.push({ name: dependencies_arr[i], version: dependencies[dependencies_arr[i]] })
            }
            for(let i = 0; i< devDependencies_arr.length; i++) {
                _pack.push({ name: devDependencies_arr[i], version: devDependencies[devDependencies_arr[i]] })
            }
        } catch(e) {
            console.log(`package.json 找不到或者格式不对`)
        }

    }
    // _pack.push({ name:'@yonyou/ac-button' , version:'latest'});
    // console.log("---",_pack);
    const spinner = ora().start();
    spinner.color = 'green';
    

    // console.log("_pack----__dirname",__dirname)
    console.log("_pack",_pack);
    // HOST_REGISTRY
    let allInner = install(spinner,process.cwd(),_pack,YON_MIRROR,isupdatepackdep,isupdatedevdepend);//内网缓存中下载

    // if(allInner)return;
    // let privateInner = install(spinner,process.cwd(),registry);//内网发包中下载
    // if(privateInner)return;
}


function install(spinner,root,pkgs,registry,isupdatepackdep,isupdatedevdepend){    
    co(function* (){
        const argvs = process.argv;

        // Ping内网
        const Ping_Response = yield Ping({
            address: IPCOMPANY,
            port: 8081,
            timeout: 50,
            attempts: 1
        })
        let registry = Ping_Response.avg ? YON_MIRROR : DEAFAULT_MIRROR;

        const spinner = ora().start();
        spinner.color = 'green';

        let arg_install = `npm --registry=${registry} `;
        
        if(Ping_Response.avg) {
            console.log(chalk.dim('Yonyou Mirror Downloading...\n'));
        } else {
            console.log(chalk.dim('CNPM Mirror Downloading...\n'));
        }

        const argv_part = argvs.slice(2).join(' ');
        arg_install += argv_part;
        console.log('arg_install',arg_install)
        // execSync(arg_install);
        
        
        let installPackMap = new Map(),sum=0;

        for(let pack = 0; pack < pkgs.length; pack++){
            spinner.text = `Installing ${pkgs[pack].name} package ⬇️...`;
            let status = yield npminstall(arg_install);
            console.log('status', status)
            if(status){
                //包下载量统计。
                // installPackMap.set("name", pkgs[pack].name)
                // installPackMap.set("version", pkgs[pack].version)
            }
        }
        // if(packs.length == sum){
        //     //包下载量统计。
        //     //
        // }
        // updateDependencies(root, pkgs);

        // console.log(chalk.bold('\n\nInstall Info:\n' + data[0]));
        // console.log(chalk.yellow('Warn Info:\n' + data[1]));
        console.log(chalk.green(`√ Finish, Happy enjoy coding!`));
        if(isupdatepackdep) {
            updateDependencies(root, pkgs,isupdatedevdepend)
        }
        console.log('installPackMap',installPackMap)
        //统计下载次数
        addDownloadNum({installPackMap:JSON.stringify(pkgs)})
        setTimeout(()=>{
            spinner.stop();
            process.exit(0);
        },50)
    }).catch(err => {
        console.error(chalk.red('\n' + err));
        spinner.stop();
        process.exit(0);
    });
}

function npminstall(arg_install){
    return co(function* (){
        try {
            yield Exec(arg_install);
            return true;
        } catch (err) {
            console.error(chalk.red('\n' + err));
            return false;
        }
    }).catch(err => {
        console.error(chalk.red('\n' + err));
        return false;
    });
}

function install_bak(spinner,root,pkgs,registry){
    co(function* (){
        console.log("pkgs---k",pkgs);
        yield npminstall({
            root:process.cwd(),
            pkgs,
            // :[ { name: 'bee-table', version: '1.2.7' } ],
         //  registry: 'https://registry.npm.taobao.org',
          registry,
        });
        
        spinner.stop();
        process.exit(0);
    }).catch(err => {
        console.error(chalk.red('\n' + err));
        spinner.stop();
        process.exit(0);
    });
}
function updateDependencies(root, pkgs, isupdatedevdepend) {
    // let root = process.cwd
    let node_modules
    let pkgJson = JSON.parse(fs.readFileSync(path.join(`${root}`, 'package.json')))
    !pkgJson.dependencies?pkgJson.dependencies={}:null
    console.log(pkgs)
    if(isupdatedevdepend) {
        for(let pkg of pkgs) {
            node_modules = JSON.parse(fs.readFileSync(path.join(`${root}/node_modules/${pkg.name}/`, 'package.json')))
            pkgJson.devDependencies[node_modules.name] = node_modules.version
        }
    } else {
        for(let pkg of pkgs) {
            node_modules = JSON.parse(fs.readFileSync(path.join(`${root}/node_modules/${pkg.name}/`, 'package.json')))
            pkgJson.dependencies[node_modules.name] = node_modules.version
        }
    }
    fs.writeFileSync(path.join(`${root}`, 'package.json'), JSON.stringify(pkgJson, null, '  '), 'utf-8')
}