// ==UserScript==
// @name			MassRecruit++
// @namespace		http://tampermonkey.net/
// @version			0.1
// @description		Improves the TW messagenames.
// @author			MagicLegend
// @grant			none
// @include			https://nl*.tribalwars.nl/game.php*
// ==/UserScript==

/** LICENCE:
 * MassRecruit++ v0.1 © 2016 MagicLegend
 * This work is under the Attribution-NonCommercial-ShareAlike 4.0 International (CC BY-NC-SA 4.0) Licence.
 * More info can be found here: https://creativecommons.org/licenses/by-nc-sa/4.0/deed.en (Human readable, not the actual licence) & https://creativecommons.org/licenses/by-nc-sa/4.0/legalcode (Actual licence)
 *
 * v0.1		Initial work, trying some stuff
 */

//var test = $('#axe_167672').val();

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
 */

//Variable stuff:
var villageAmount;
var village = [];

var config = {
	debug: true
};


//Code stuff:
function log(logmsg) {
	if (config.debug) {
		console.log(logmsg);
	}
};

if (location.href.match(/^https:\/\/((nl|zz|en).*\.tribalwars\.(nl|net)\/(game.php).*)/)) {
	$(function() {
		$(".btn[value='Verschil invoeren']").click( function() {
			log("Button clicked");
			findVillageAmount();
			findVillages();
		});
	});
};

function findVillageAmount() {
	//Gets the amount of villages in this list from the table header.
	var villageAmountStr = $('#mass_train_table').find("th:eq(0)").text();
	villageAmount = /[0-9]{1,}/.exec(villageAmountStr);
	log("Amount of villages: " + villageAmount);
};

function findVillages() {
	var village = createArrays();
	var villageCount = 0;
	var tempVillageAmount = villageAmount;
	for (i = 0; i < tempVillageAmount; i++) {
		var villagelink = $("#mass_train_table .row_marker a:eq(" + i + ")").attr("href");
		log(villagelink);
		
		if (villageCount < villageAmount) {
			log("villageCount < villageAmount");
			log(villageCount + " < " + villageAmount);
		}
		
		if (villagelink.indexOf("screen=overview")/*[0]*/ && villageCount < villageAmount) {
		village[i][0] = villagelink.match(/village=([0-9]+)/)[0]; ///village=([0-9]{1,}+)/.exec('#mass_train_table'); //.find(".row_marker:eq(i)").text(); .attr("href")
		log("Village " + i + " = " + village[i][0]);
		villageCount++;
		log("Currently " + villageCount + " villages found!");
		} else {
			log("No match: " + villagelink);
			tempVillageAmount++;
			log("Changed tempVillageAmount to: " + tempVillageAmount);
		}
	};
};

function createArrays() {
	//Creating the arrays needed
	var village = new Array(villageAmount);
	for (var i = 0; i < villageAmount; i++) {
		village[i] = new Array();
	}
	log("Created arrays");
	//log(village);
	return village;
};

//Need-to-remember stuff:
//var test = $('table.mass_train_table').find(".contexted:eq(0)").text();
// http://stackoverflow.com/questions/872217/jquery-how-to-extract-value-from-href-tag
// http://stackoverflow.com/questions/28192958/cannot-read-property-match-of-undefined
// http://www.w3schools.com/jsref/jsref_match.asp
// http://api.jquery.com/attr/