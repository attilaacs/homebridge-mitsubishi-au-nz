const fs = require('fs')
const fetch = require('node-fetch')
const parse = require('./parse')

/*
 * Based on the excellent work by NovaGL on https://github.com/NovaGL/diy-melview
 */
const DOMAIN = 'https://api.melview.net/api/'

const AUTHENTICATE = 'login.aspx'
const ROOMS = 'rooms.aspx'
const COMMAND = 'unitcommand.aspx'
const UNITCAPABILITIES = 'unitcapabilities.aspx'

async function loadAll(secret) {
  if (!secret.cookie)
    await auth(secret)
  const res = await fetch(DOMAIN + ROOMS, {
    method: 'POST',
    headers: {
    	'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; WOW64; rv:54.0) Gecko/20100101 Firefox/54.0',
    	'Content-Type':'application/json',
    	'cookie': secret.cookie
    	}
  })
  parseCookie(secret, res)

  const aircons = parse.deviceList(await res.text())
  for (const aircon of aircons)
    await getStatus(secret, aircon)
  //secret.cookie = null  // session end
  return aircons
}

async function getStatus(secret, aircon) {
  if (!secret.cookie)
    await auth(secret)
  const res = await fetch(DOMAIN + COMMAND, {
    method: 'POST',
    headers: {
      'cookie': secret.cookie,
    },
    body: '{"unitid":'+aircon.serial+',"v":2}',
  })
  parse.status(aircon, await res.text())
}

async function setStatus(secret, aircon) {
  if (!secret.cookie)
    await auth(secret)
  const res = await fetch(DOMAIN + COMMAND, {
    method: 'POST',
    headers: {
      'cookie': secret.cookie,
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; WOW64; rv:54.0) Gecko/20100101 Firefox/54.0',
    	'Content-Type':'application/x-www-form-urlencoded'
    },
    body: '{"unitid":'+aircon.serial+',"v":2,"commands":"'+parse.encode(aircon)+'"}',
  })
  //console.log("setStatus response: " +JSON.stringify(res.text(),null,4));
  //parse.status(aircon, await res.text())
  aircon.lastUpdate = Date.now()
}

async function auth(secret) {
  const res = await fetch(DOMAIN + AUTHENTICATE, {
    method: 'POST',
    headers: {
    	'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; WOW64; rv:54.0) Gecko/20100101 Firefox/54.0',
    	'Content-Type':'application/x-www-form-urlencoded'
    	},
    body: '{"user": "'+secret.user+'","pass": "'+secret.pass+'","appversion": "4.3.1010"}'
  })
  parseCookie(secret, res)
}

function generateOperateKey() {
  const date = new Date
  return '_' + date.getFullYear()
             + (date.getMonth() + 1 + 100).toString().substr(1, 2)
             + (date.getDate() + 100).toString().substr(1, 2)
       + '_' + (date.getHours() + 100).toString().substr(1, 2)
             + (date.getMinutes() + 100).toString().substr(1, 2)
             + (date.getSeconds() + 100).toString().substr(1, 2)
}

function parseCookie(secret, res) {
  clearTimeout(secret.cookieTimeout)
  try {
    const raw = res.headers.raw()['set-cookie']
    secret.cookie = raw.map((entry) => entry.split(';')[0]).join(';')
  } catch {
    secret.cookie = null
  }
  // The API does not return updated information when session is not changed,
  // we have to re-login frequently to get updated data.
  secret.cookieTimeout = setTimeout(() => { secret.cookie = null }, 10 * 1000)
}

module.exports = {loadAll, getStatus, setStatus}
