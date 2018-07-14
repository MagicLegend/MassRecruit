// ==UserScript==
// @name			MassRecruit++
// @namespace		http://tampermonkey.net/
// @version			0.4
// @description		Improves the recruit function with some automatic calculations
// @author			MagicLegend
// @grant			none
// @include			https://nl*.tribalwars.nl/game.php*
// ==/UserScript==

/** LICENCE:
 * MassRecruit++ v0.3 � 2016 MagicLegend
 * This work is under the Attribution-NonCommercial-ShareAlike 4.0 International (CC BY-NC-SA 4.0) License.
 * More info can be found here: https://creativecommons.org/licenses/by-nc-sa/4.0/deed.en (Human readable, not the actual license) & https://creativecommons.org/licenses/by-nc-sa/4.0/legalcode (Actual licence)
 *
 * v0.1		Initial work, trying some stuff
 * v0.2		Now works for the offence category
 * v0.3     The script now works for most cases
 * v0.4     Fixed non-PA usage
 */

/** IDEA:
 * Fetch the amount of villages from the thead
 * Write the villagenumbers from the URL in an array
 * Loop trough all the boxes to get their contents (2D array?) and read the current amount of troops
 *	* village[i, 0] = villagenumber
 *	* village[i, 1] = current amount of troops
 *	* village[i, 2] = entered amount of troops
 *	* village[i, 3] = calculated amount of troops
 *
 * Round off the numbers when they don't make an even number unless the entered amount is less than 500
 *
 ** STUFF TO DO:
 * 
 * - Add message if the URL is wrong (no "&mode=train&" on the URL)
 * - Add option to add new groupnames that will recognize patterns
 * - Add button to add new patterns
 * - Add a little bit of documentation on the github page
 * - Write the fetching of the current units in a variable function
 * - Add functionallity for churches
 * - Calculate every time a number/key is pressed for live stats
 *
 ** KNOWN BUGS:
 * - None!
 */

//Variable stuff:
var villageAmount;
var tableLength;
var village = [];
var trainingBarrack = [];
var trainingStable = [];
var trainingGarage = [];
var names = [];
var units = [];
var currentUnits = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
var displayUnits = [null, null, null, null, null, null, null, null, null, null];
var researchedUnits = [false, false, false, false, false, false, false, false, false, false];

var barrackUnits = ["spear", "sword", "axe", "archer"];
var stableUnits = ["spy", "light", "marcher", "heavy"];
var garageUnits = ["ram", "catapult"];
var allUnits = ["spear", "sword", "axe", "archer", "spy", "light", "marcher", "heavy", "ram", "catapult"];

//Name of the recruiting page; used to check if the right page is loaded.
//If the script doesn't work; it might be that this word is different (loalisation),
//and the url didn't link to ***&screen=train&mode=train. Change it to your local equavalent.
var pageHeadName = "Rekruteren";

/**
 * Keywords that the script should look for. Note that you can add custom names and units by adding a new line to the objects.
 * When adding new names make sure your formatting is correct, otherwise it will throw errors at you like crazy!
 */

var names = {
	offence: ["off", "offence"],
	defence: ["def", "defence", "deff"],
	church1: ["kerk-1"],
	church2: ["kerk-2"],
	church3: ["kerk-3"],
	custom1: ["custom1"]
};

//Target units. Should match the previous keywords.
var units = {
	offence: [0, 0, 8500, 0, 500, 2500, 0, 0, 150, 0],
	defence: [7500, 8500, 0, 1000, 0, 0, 0, 550, 5, 0],
	church1: [0, 0, 0, 0, 0, 0, 1000, 0, 0, 0],
	church2: [0, 0, 0, 0, 0, 0, 2000, 0, 0, 0],
	church3: [0, 0, 0, 0, 0, 0, 3000, 0, 0, 0],
	custom1: [0, 0, 0, 0, 0, 0, 4000, 0, 0, 0]
};

var config = {
	debug: true,
	level: 1, // 0: nothing, 1: everything, 2: most things, 3: really limited things
};

//Code stuff:

function log(lvl, logmsg) {
	if (config.debug) {
		if (config.level >= lvl) {
			console.log("Ge: " + logmsg);
		}
	}
}

function logBarrack(lvl, logmsg) {
	if (config.debug) {
		if (config.level >= lvl) {
			console.log("B: " + logmsg);
		}
	}
}

function logStable(lvl, logmsg) {
	if (config.debug) {
		if (config.level >= lvl) {
			console.log("S: " + logmsg);
		}
	}
}

function logGarage(lvl, logmsg) {
	if (config.debug) {
		if (config.level >= lvl) {
			console.log("G: " + logmsg);
		}
	}
}

if (location.href.match(/(nl|zz|en).*\.tribalwars\.(nl|net)\/game\.php(\?|.*\&)screen\=train(\?|.*\&)mode\=mass/)) {
	log(1, "Href match > mode=mass");

	$(function () {
		$(".btn[value='Verschil invoeren']").click(function () {
			log(3, "Difference button clicked");
			findVillageAmount();
			testUnits();
			//findVillages();
		});
	});
}



//(location.href.match(/(nl|zz|en).*\.tribalwars\.(nl|net)\/game\.php(\?|.*\&)screen\=train(\?|.*\&)mode\=train/))
//$('#content_value h2:contains("Rekruteren")').length > 0
if (game_data.screen == "train" && game_data.mode === "train") {
	log(1, "Href match > mode=train");

	//Quick and dirty way to forcefully rebuild the column every second
	//window.setInterval( () => reset() , 1000);

	init();
} else if (game_data.screen == "train" && $("#content_value h2:contains(" + pageHeadName + ")")) {
	log(1, "Header match > " + pageHeadName);
	init();
}

function init() {
//Initial start function
	$(function () {
		log(1, "Screen = train");
		findExistingUnits();
		createRow();
		main();
				//Function that runs when a unit is completed/page is rebuild via AJAX
		$(document).on("partial_reload_end", function () {
			currentUnits = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
			createRow();
			main();
		});
	});
	
	//Recruit button forces a rebuild of the column
	$(".btn-recruit").click(function () {
		log(1, "Clicked button");
		if (!$(".todo").length) {
			createRow();
		} else {
			log(1, ".todo exists");
		}
		currentUnits = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
		setTimeout(main, 500);
	});
}


function reset() {
	if (!$(".todo").length) {
		log(1, "Resetting...");
		currentUnits = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
		createRow();
		main();
	} else {
		log(1, "Header exists...");
	}
}

function main() {
	getBarrackRecruiting();
	getStableRecruiting();
	getGarageRecruiting();
	var group = getGroups();
	var currentgroup;
	log(1, "group.length: " + group.length);

	for (var i = 0; i < group.length; i++) {
		log(1, "Looking for: " + group[i]);

		$.each(names, function (index, value) {

			for (var j = 0; j < value.length; j++) {
				if (group[i] === value[j]) {
					log(1, "Found match! Group: " + group[i] + " name: " + value[j]);
					currentgroup = value[j];
					tableLength = $("#train_form > .vis > tbody > tr").length - 2; //-2 to account for the header and the 'recruit' button
					log(1, "Amount of entries: " + tableLength);

					log(1, trainingBarrack);
					log(1, currentUnits);

					calcTroops();

					log(1, currentUnits);

					var count = 0;
					$.each(displayUnits, function (ind, v) {
						//Check if the element about to be inserted has been developed
						if (researchedUnits[ind]) {
							log(1, "Loop location: " + ind);
							log(1, "Inserting at " + count);
							var temp = $("#train_form > .vis > tbody > tr td:nth-child(3)").eq(ind).text();
							var textAfterHash = temp.substring(temp.indexOf('/') + 1);
							var displayText = units[value[j]][ind] - textAfterHash - currentUnits[ind];

							log(1,
								"Inserting units: " +
								units[value[j]][ind] +
								"; textAfterHash: " +
								textAfterHash +
								"; currentUnits: " +
								currentUnits[ind] +
								"; Resulting in: " +
								displayText);

							displayUnits[ind] = displayText;
						}
					});

					//Filling of the created column
					/**
					 * Add conversion of the displayUnits array (which is based on all 8 units) to the actual reserachedUnits array (which holds the actual location)
					 */
					
					var count = 0;
					for (var l = 0; l < researchedUnits.length; l++) {
						if (researchedUnits[l]) {
							$("#train_form > .vis > tbody > tr .massrecruitplusplus").eq(count).text(displayUnits[l]);
							count++;
						}
					}
					
					// for (var k = 0; k < tableLength; k++) {
					// 	$("#train_form > .vis > tbody > tr .massrecruitplusplus").eq(k).text(displayUnits[k]);
					// }

					break;
				}
			}
		});
	}
}

function getBarrackRecruiting() {
	logBarrack(1, "Entered barrack");
	try {
		var trainingLength = $("#replace_barracks > .trainqueue_wrap > .vis > #trainqueue_barracks > tr").length; //-1 to account for the cancel everything button at the bottom.
		logBarrack(1, "trainingLength: " + trainingLength);


		//--[[Code for finding the current recruiting lit unit]]--
		for (var i = 0; i < barrackUnits.length; i++) {
			var hasClassLit = $("#replace_barracks > .trainqueue_wrap > .vis > tbody > .lit > .lit-item > .unit_sprite").hasClass(barrackUnits[i]);
			if (hasClassLit) {
				var amountTroopsLeftLit = $("#replace_barracks > .trainqueue_wrap > .vis > tbody > .lit > .lit-item").first().text().match(/\d+/);
				var parsed = barrackUnits[i] + "," + amountTroopsLeftLit;
				trainingBarrack[0] = parsed;
				logBarrack(1, "Lit unit: " + barrackUnits[i]);
				logBarrack(1, "And has " + amountTroopsLeftLit + " left");
				logBarrack(1, "----------");
				//break;
			}
		}


		//--[[Code for finding the list of recruiting units]]--
		for (var j = 0; j < trainingLength; j++) { //Strange for loop is to reserve a space for the lit item in the first slot
			//log(1, "First for loop " + j);
			for (var i = 0; i < barrackUnits.length; i++) {
				//log(1, "Entered for loop " + i);
				var hasClassRest = $("#replace_barracks > .trainqueue_wrap > .vis > #trainqueue_barracks > #trainorder_" + j + " > td > .unit_sprite").hasClass(barrackUnits[i]);
				if (hasClassRest) {
					var amountTroopsLeft = $("#replace_barracks > .trainqueue_wrap > .vis > #trainqueue_barracks > #trainorder_" + j + " > td").text().match(/\d+/);
					var parsed = barrackUnits[i] + "," + amountTroopsLeft;
					trainingBarrack[j + 1] = parsed;
					logBarrack(1, "Unit " + j + " has type: " + barrackUnits[i]);
					logBarrack(1, "And has " + amountTroopsLeft + " units to do");
					logBarrack(1, "----------");
				} else {
					//logBarrack(1, "Nope. Looked for type: " + barrackUnits[i]);
				}
			}
		}
	} catch (ex) {
		logBarrack(1, "thrown error " + ex.message);
	}
}

function getStableRecruiting() {
	logStable(1, "Entered stable");
	try {
		var trainingLength = $("#replace_stable > .trainqueue_wrap > .vis > #trainqueue_stable > tr").length; //-1 to account for the cancel everything button at the bottom.
		logStable(1, "trainingLength: " + trainingLength);

		//--[[Code for finding the current recruiting lit unit]]--
		for (var i = 0; i < stableUnits.length; i++) {
			var hasClassLit = $("#replace_stable > .trainqueue_wrap > .vis > tbody > .lit > .lit-item > .unit_sprite").hasClass(stableUnits[i]);
			if (hasClassLit) {
				var amountTroopsLeftLit = $("#replace_stable > .trainqueue_wrap > .vis > tbody > .lit > .lit-item").first().text().match(/\d+/);
				var parsed = stableUnits[i] + "," + amountTroopsLeftLit;
				trainingStable[0] = parsed;
				logStable(1, "Lit unit: " + stableUnits[i]);
				logStable(1, "And has " + amountTroopsLeftLit + " left");
				logStable(1, "----------");
				//break;
			}
		}


		//--[[Code for finding the list of recruiting units]]--
		for (var j = 0; j < trainingLength; j++) { //Strange for loop is to reserve a space for the lit item in the first slot
			//log(1, "First for loop " + j);
			for (var i = 0; i < stableUnits.length; i++) {
				//log(1, "Entered for loop " + i);
				var hasClassRest = $("#replace_stable > .trainqueue_wrap > .vis > #trainqueue_stable > #trainorder_" + j + " > td > .unit_sprite").hasClass(stableUnits[i]);
				if (hasClassRest) {
					var amountTroopsLeft = $("#replace_stable > .trainqueue_wrap > .vis > #trainqueue_stable > #trainorder_" + j + " > td").text().match(/\d+/);
					var parsed = stableUnits[i] + "," + amountTroopsLeft;
					trainingStable[j + 1] = parsed;
					logStable(1, "Unit " + j + " has type: " + stableUnits[i]);
					logStable(1, "And has " + amountTroopsLeft + " units to do");
					logStable(1, "----------");
				} else {
					//logStable(1, "Nope. Looking for type: " + stableUnits[i]);
				}
			}
		}
	} catch (ex) {
		logStable(1, ex);
	}
}

function getGarageRecruiting() {
	log(1, "Entered garage");
	try {
		var trainingLength = $("#replace_garage > .trainqueue_wrap > .vis > #trainqueue_garage > tr").length; //-1 to account for the cancel everything button at the bottom.
		logGarage(1, "trainingLength: " + trainingLength);


		//--[[Code for finding the current recruiting lit unit]]--
		for (var i = 0; i < garageUnits.length; i++) {
			var hasClassLit = $("#replace_garage > .trainqueue_wrap > .vis > tbody > .lit > .lit-item > .unit_sprite").hasClass(garageUnits[i]);
			if (hasClassLit) {
				var amountTroopsLeftLit = $("#replace_garage > .trainqueue_wrap > .vis > tbody > .lit > .lit-item").first().text().match(/\d+/);
				var parsed = garageUnits[i] + "," + amountTroopsLeftLit;
				trainingGarage[0] = parsed;
				logGarage(1, "Lit unit: " + garageUnits[i]);
				logGarage(1, "And has " + amountTroopsLeftLit + " left");
				logGarage(1, "Parsed: " + trainingGarage[0]);
				logGarage(1, "----------");
				//break;
			}
		}


		//--[[Code for finding the list of recruiting units]]--
		for (var j = 0; j < trainingLength; j++) { //Strange for loop is to reserve a space for the lit item in the first slot
			//log(1, "First for loop " + j);
			for (var i = 0; i < garageUnits.length; i++) {
				//log(1, "Entered for loop " + i);
				var hasClassRest = $("#replace_garage > .trainqueue_wrap > .vis > #trainqueue_garage > #trainorder_" + j + " > td > .unit_sprite").hasClass(garageUnits[i]);
				if (hasClassRest) {
					var amountTroopsLeft = $("#replace_garage > .trainqueue_wrap > .vis > #trainqueue_garage > #trainorder_" + j + " > td").text().match(/\d+/);
					var parsed = garageUnits[i] + "," + amountTroopsLeft;
					trainingGarage[j + 1] = parsed;
					logGarage(1, "Unit " + j + " has type: " + garageUnits[i]);
					logGarage(1, "And has " + amountTroopsLeft + " units to do");
					logGarage(1, "Parsed: " + trainingGarage[j + 1]);
					logGarage(1, "----------");
				} else {
					logGarage(1, "Nope. Looking for type: " + garageUnits[i]);
				}
			}
		}
	} catch (ex) {
		logGarage(1, ex);
	}
}

function getGroups() {
	try {
		var tempgroup = jQuery("#content_value strong")[0] // get the dom object
			.nextSibling // get the text node next to it
			.textContent // get text content
			.toLowerCase();
		var group = tempgroup.replace(/\s+/g, '').split(",");
		log(1, group[1]);
		return group;
	} catch (ex) {
		log(1, ex);
	}
}

function calcTroops() {
	for (var l = 0; l < trainingBarrack.length; l++) {
		//Barrackloop
		for (var k = 0; k < barrackUnits.length; k++) {
			var tempBarrack = trainingBarrack[l].split(","); //0 = name; 1 = amount;
			if (tempBarrack[0] == barrackUnits[k]) {
				//Match
				switch (tempBarrack[0]) {
					case barrackUnits[0]:
						logBarrack(1, "Found: spear");
						break;
					case barrackUnits[1]:
						logBarrack(1, "Found: sword");
						break;
					case barrackUnits[2]:
						logBarrack(1, "Found: axe");
						break;
					case barrackUnits[3]:
						logBarrack(1, "Found: archer");
						break;
					default: logBarrack(1, "Default case");
						break;
				}
				currentUnits[k] = currentUnits[k] + parseInt(tempBarrack[1], 10);
				logBarrack(1, currentUnits[k]);
			}
		}
	}

	for (var l = 0; l < trainingStable.length; l++) {
		//Stableloop
		for (var k = 0; k < stableUnits.length; k++) {
			var tempStable = trainingStable[l].split(","); //0 = name; 1 = amount;
			if (tempStable[0] == stableUnits[k]) {
				//Match
				switch (tempStable[0]) {
					case stableUnits[0]:
						logStable(1, "Found: spy");
						break;
					case stableUnits[1]:
						logStable(1, "Found: light");
						break;
					case stableUnits[2]:
						logStable(1, "Found: marcher");
						break;
					case stableUnits[3]:
						logStable(1, "Found: heavy");
						break;
					default:
						logStable(1, "Default case");
						break;
				}
				currentUnits[k + 4] = currentUnits[k + 4] + parseInt(tempStable[1], 10);
				logStable(1, currentUnits[k + 4]);
			}
		}
	}

	for (var l = 0; l < trainingGarage.length; l++) {
		//Garageloop
		for (var k = 0; k < garageUnits.length; k++) {
			var tempGarage = trainingGarage[l].split(","); //0 = name; 1 = amount;
			if (tempGarage[0] == garageUnits[k]) {
				//Match
				switch (tempGarage[0]) {
					case garageUnits[0]:
						logGarage(1, "Found: ram");
						break;
					case garageUnits[1]:
						logGarage(1, "Found: catapult");
						break;
					default: logGarage(1, "Default case");
						break;
				}
				currentUnits[k + 8] = currentUnits[k + 8] + parseInt(tempGarage[1], 10);
				logGarage(1, currentUnits[k + 8]);
			}
		}
	}
}

function createRow() {
	if (!$(".todo").length) {
		$("#train_form > .vis > tbody > tr:not(.row_a, .row_b)").first().append("<th class='todo' style='width: 80px'>To Do:</th>");
		log(1, "Added heading");
	} else {
		log(1, "Heading exists");
	}

	tableLength = $("#train_form > .vis > tbody > tr").length - 2; //-2 to account for the header and the 'recruit' button

	for (k = 1; k < tableLength + 1; k++) { //+1 to account for the header
		$("#train_form > .vis > tbody > tr").eq(k).append("<td class = massrecruitplusplus>Filler!</td>");
	}
}

function findExistingUnits() {
//    for (var i = 0; i < Object.keys(unit_managers.units).length; i++) {
//        log(1, unit_managers.units[i].requirements_met);
//    }

	log(1, Object.keys(unit_managers.units));
	var keyArray = Object.keys(unit_managers.units);
	log(1, keyArray[1]);

	$.each(unit_managers.units, function (i, currUnit) {
		$.each(currUnit, function (key, val) {
			if (key == "requirements_met") {
				log(1, "Key: " + i + " Value: " + val);
				var unitPos = allUnits.indexOf(i);
				log(1, "Pos: " + unitPos);
				researchedUnits[unitPos] = val;
			}
		});
	});


	//for (var property in unit_managers.units) {
	//    for (var p in property) {
	//        if (p.hasOwnProperty("iron")) {
	//            log(1, p.iron + " has met it's requirements!");
	//        }
	//    }
	//}
}

//--[[Functions for the mass-recruit function]]--

function findVillageAmount() {
	//Gets the amount of villages in this list from the table header.
	var villageAmountStr = $('#mass_train_table').find("th:eq(0)").text();
	villageAmount = /[0-9]{1,}/.exec(villageAmountStr);
	log(3, "Amount of villages: " + villageAmount);
}

function findVillages() {
	var village = createArrays();
	var villageCount = 0;
	var tempVillageAmount = villageAmount;
	for (i = 0; i < tempVillageAmount; i++) {
		var villagelink = $("#mass_train_table .row_marker a:eq(" + i + ")").attr("href");
		log(3, villagelink);

		if (villageCount < villageAmount) {
			log(2, "villageCount < villageAmount");
			log(2, villageCount + " < " + villageAmount);
		}

		log(2, "villagelink.indexOf('screen=overview') = " + villagelink.indexOf("screen=overview"));

		if (villagelink.indexOf("screen=overview")/*[0]*/ != -1 && villageCount < villageAmount) {
			village[villageCount][0] = villagelink.match(/village=([0-9]+)/)/*[0]*/; ///village=([0-9]{1,}+)/.exec('#mass_train_table'); //.find(".row_marker:eq(i)").text(); .attr("href")
			log(2, "Village " + villageCount + " = " + village[villageCount][0]);
			villageCount++;
			log(1, "Currently " + villageCount + " villages found!");
			log(1, "Most recent village: " + village[villageCount - 1][0]);
		} else {
			log(2, "No match: " + villagelink);
			tempVillageAmount++;
			log(3, "Changed tempVillageAmount to: " + tempVillageAmount);
		}
		log(2, "-----------------------------------");
	}
}

function testUnits() {
	for (var u in unit_managers) {
		if ("units" != u) {
			log(1, u); //Logs all villageids
		}
	}
}

function createArrays() {
	//Creating the arrays needed
	var village = new Array(villageAmount);
	for (var i = 0; i < villageAmount; i++) {
		village[i] = new Array();
	}
	log(1, "Created arrays");
	//log(village);
	return village;
}

//Useful function to decode an URL. More info here: http://stackoverflow.com/questions/40740474/javascript-find-out-if-url-tag-matches/40740931

window.decodeUrl = function decodeUrl(url) {
	var a = document.createElement('A');
	function inner(url) {
		a.href = url;
		return {
			protocol: a.protocol,
			hostname: a.hostname,
			pathname: a.pathname,
			search: a.search,
			params: a.search.replace(/(^\?)/, '').split("&").
				map(function (n) {
					return n = n.split("="),
						this[n[0]] = n[1], this
				}.bind({}))[0]
		}
	}
	window.decodeUrl = inner;
	return inner(url);
}

/*
USAGE:
var url = 'https://nlp2.tribalwars.nl/game.php?village=171817&screen=train';
var durl = decodeUrl(url);
console.log(durl);
console.log(
	'Are we game & train : ' + 
	((durl.pathname === '/game.php') &&
	(durl.params.screen === 'train'))
);*/

//Need-to-remember stuff:
//var test = $('table.mass_train_table').find(".contexted:eq(0)").text();
// http://stackoverflow.com/questions/872217/jquery-how-to-extract-value-from-href-tag
// http://stackoverflow.com/questions/28192958/cannot-read-property-match-of-undefined
// http://www.w3schools.com/jsref/jsref_match.asp
// http://api.jquery.com/attr/