function deviceList(text) {
  const json = JSON.parse(text);
  const aircons = []
  for (unit in json[0].units) {
  	const aircon = defaultAircon()
	parseDeviceInfoFromRoom(aircon, json[0].units[unit])
  	aircons.push(aircon)
  }
  return aircons
}

function deviceInfo(aircon, text) {
  const json = JSON.parse(text);
  parseDeviceInfoFromRoom(aircon, json)
}

function status(aircon, text) {
  const json = JSON.parse(text);
  parseCode(aircon, json)
}

function encode(aircon) {
	var commands = [];
	var power = "PW1"
	
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
	
	setfan: null,
    
    power: null,
    workMode: null,
	
	target: {
      heatingTemperature: 27,
      coolingTemperature: 23,
    }
  }
}

function parseDeviceInfoFromRoom(aircon, data) {
  	aircon.name = data.room
	aircon.serial = data.unitid
	  
  	if (data.power === "on") {
	  	aircon.power = true
  	} else {
	  	aircon.power = false
	}
	  
  	aircon.workMode = numberToWorkMode(parseInt(data.mode))
  	aircon.roomTemp = parseInt(data.temp)

	if (aircon.workMode === 'heat')
   		aircon.target.heatingTemperature = parseInt(data.settemp)
 	else
		aircon.target.coolingTemperature = parseInt(data.settemp)
}
function numberToWorkMode(number) {
	if (number === 1)
		return 'heat'
	//if (number === 2)
	//	return 'dry'
	if (number === 3)
		return 'cool'
	//if (number === 7)
	//	return 'fan'
	if (number === 8)
		return 'auto'
	return 'auto'
}
function parseCode(aircon, code) {
  for (item in code) {
		//add device info
		if (item == 'id' ) {
			aircon.serial = code[item]
		}
		if (item == 'setfan' ) {
			aircon.setfan = Number(code[item])
		}

      	if (item == 'setmode' ) {
			aircon.workMode = numberToWorkMode(code[item])
      	}
      	if (item == 'power' ) {
  			if (code[item] == 0) {
      			aircon.power = false
      		} else {
      			aircon.power = true
			  }
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
  	}
}

module.exports = {deviceList, deviceInfo, status, encode}
