'use strict';

const chalk = require('chalk');
const path = require('path');
const fs = require('fs');
const fetch = require('node-fetch');
const co = require('co');

const  URLSearchParams =require('url').URLSearchParams;

const {getRc,setRc,getHttpConfig} = require('../utils');

// const httpConfig = {
//   host: YNPM_SERVER, 
//   port:3001,
//   path:"/user/getTokenValidate",
//   // method:"get",
//   // path:"/package/get",
//   // headers:{
//   //   'Content-Type':'application/x-www-form-urlencoded',
//   //   // 'Content-Length':contents.length
//   // }
// }

function get(options,params) {
  let url = options.host?options.host:"127.0.0.1";
  url += options.port?":"+options.port:"";
  // url += options.method?options.port:"";
  url += options.path?options.path:"";
  // let met = options.method.toUpperCase();
  // if(met != "GET")return;
  console.log('params',params)
  let par = "?",i = 0 ,len = Object.keys(params).length;
  for(let attr in params){
    i++;
    let _att = attr + "="+ params[attr];
    len == i?"": _att += "&";
    par += _att;
  };
  url += par;
  console.log("url: "+url);
  return fetch(url)
  .then(res => res.text())
  .then(body =>{
    let data = null;
    try{
      let res = JSON.parse(body);
      if(!isEmptyObject(res.data)){
        data = res.data;
      }
    }catch(err){};
    return data;
  }); 
}


function post(options,params) {
  let url = options.host?options.host:"127.0.0.1";
  url += options.port?":"+options.port:"";
  // url += options.method?options.port:"";
  url += options.path?options.path:"";
  console.log("url: "+url);
  console.log(params)
  const form = new URLSearchParams();
  for(let [key,value] in params) {
    console.log(key,value)
    form.append(key, value);
  }
  console.log('form',form)


  return fetch(url,{ method: 'POST', body: form })
  .then(res => res.text())
  .then(body =>{
    let data = null;
    try{
      let res = JSON.parse(body);
      if(!isEmptyObject(res.data)){
        data = res.data;
      }
    }catch(err){};
    return data;
  }); 
}

function isEmptyObject(obj){
  for(var key in obj){
      return false
  };
  return true
};

function userInfo(){
  let parame = JSON.parse(getRc("ynpm"));
  let config = getHttpConfig({
    path:"/user/getUserValidate",
  });
  return get(config,parame);
}

function addDownloadNum(params){
  let config = getHttpConfig({
    path:"/package/addDownloadNum",
  });

  return get(config,params);
}

function setPackage(params){
  let config = getHttpConfig({
    path:"/package/set",
  });
  return get(config,params);
}

module.exports = {
   userInfo,
   setPackage,
   addDownloadNum
}

