function deviceList(text) {
  const json = JSON.parse(text);
  const aircons = []
  for (unit in json[0].units) {
  	const aircon = defaultAircon()
  	parseDeviceInfo(aircon, json[0].units[unit])
  	aircons.push(aircon)
  }
  return aircons
}

function deviceInfo(aircon, text) {
  const json = JSON.parse(text);
  parseDeviceInfo(aircon, json)
}

function status(aircon, text) {
  const json = JSON.parse(text);
  parseCode(aircon, json)
}

function encode(aircon) {
	var commands = [];
	var power = "PW1"
	//console.log("to encode: "+JSON.stringify(aircon,null,4));
	if (aircon.setfan || aircon.setfan === 0) {
    	commands.push("FS"+aircon.setfan);
    }
	if (aircon.workMode === 'heat') {
    	commands.push("MD1")
    	commands.push("TS"+aircon.target.heatingTemperature)
    } else if (aircon.workMode === 'cool') {
    	commands.push("MD3")
    	commands.push("TS"+aircon.target.coolingTemperature)
    } else if (aircon.workMode === 'auto') {
    	commands.push("MD8")
    	commands.push("TS"+aircon.target.coolingTemperature)
    }
    if (!aircon.power) {
		power = "PW0"
    }

    commands.push(power)
    console.log("sending commands: "+commands.join())
	return commands.join()
}

function defaultAircon() {
  return {
    name: 'Mitsubishi Aircon',
    serial: null,
    lastUpdate: null,

    roomTemp: null,
    outsideTemp: null,
	
	setfan: null,
    
    power: null,
    workMode: null,
	
	target: {
      heatingTemperature: 27,
      coolingTemperature: 23,
    }
  }
}

function parseDeviceInfo(aircon, data) {
  aircon.name = data.room
  aircon.serial = data.unitid
  //aircon.targetTemp = Number(data.settemp)
  aircon.roomTemp = Number(data.roomtemp)
  if (data.outdoortemp) {
  	aircon.outsideTemp = Number(data.outdoortemp)
  }
  aircon.setfan = Number(data.setfan)
}

function parseCode(aircon, code) {

  for (item in code) {

      	if (item == 'setmode' ) {
  			if (code[item] == 1) {
      			aircon.workMode = 'heat'
      		} else if (code[item] == 3) {
      			aircon.workMode = 'cool'
      		} else if (code[item] == 8) {
      			aircon.workMode = 'auto'
      		}
      	}
      	if (item == 'power' ) {
  			if (code[item] == 0) {
      			aircon.power = false
      		} else {
      			aircon.power = true
      		}
      	}
      	if (item == 'setfan' ) {
      		aircon.setfan = code[item]
      	}
      	if (item == 'roomtemp' ) {
  			aircon.roomTemp = parseInt(code[item])
      	}
      	if (item == 'settemp' ) {
      		if (aircon.workMode === 'heat')
    			aircon.target.heatingTemperature = parseInt(code[item])
 	 		else
    			aircon.target.coolingTemperature = parseInt(code[item])
      	}
      	if (item == 'outdoortemp') {
  			aircon.outsideTemp = parseInt(code[item])
      	}
      	
  	}
}

function getTargetTemperature(aircon) {
  if (aircon.workMode === 'heat')
    return aircon.target.heatingTemperature
  else
    return aircon.target.coolingTemperature
}

module.exports = {deviceList, deviceInfo, status, encode}
