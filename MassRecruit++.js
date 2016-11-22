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
 * MassRecruit++ v0.1 � 2016 MagicLegend
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
	debug: true,
	level: 1 // 1: everything, 2: most things, 3: really limited things
};


//Code stuff:
function log(lvl, logmsg) {
	if (config.debug) {
		if (config.level >= lvl) {
			console.log(logmsg);
		}
	}
};

if (location.href.match(/(nl|zz|en).*\.tribalwars\.(nl|net)\/game\.php(\?|.*\&)screen\=train(\?|.*\&)mode\=mass/)) {
	log(1, "Href match > mode=mass");

	$(function() {
		$(".btn[value='Verschil invoeren']").click( function() {
			log(3, "Difference button clicked");
			findVillageAmount();
			findVillages();
		});
	});
};

if (location.href.match(/(nl|zz|en).*\.tribalwars\.(nl|net)\/game\.php(\?|.*\&)screen\=train(\?|.*\&)mode\=train/)) {
	log(1, "Href match > mode=train");
	
	$(function() {
		log(1, "Screen = train");
	});
};

function findVillageAmount() {
	//Gets the amount of villages in this list from the table header.
	var villageAmountStr = $('#mass_train_table').find("th:eq(0)").text();
	villageAmount = /[0-9]{1,}/.exec(villageAmountStr);
	log(3, "Amount of villages: " + villageAmount);
};

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
	};
};

function createArrays() {
	//Creating the arrays needed
	var village = new Array(villageAmount);
	for (var i = 0; i < villageAmount; i++) {
		village[i] = new Array();
	}
	log(1, "Created arrays");
	//log(village);
	return village;
};

//Usefull function to decode an URL. More info here: http://stackoverflow.com/questions/40740474/javascript-find-out-if-url-tag-matches/40740931

window.decodeUrl = function decodeUrl(url) {  
	var a = document.createElement('A');
	function inner(url) {  
		a.href = url;
		return {
			protocol: a.protocol,
			hostname: a.hostname,
			pathname: a.pathname,
			search: a.search,
			params: a.search.replace(/(^\?)/,'').split("&").
				map(function(n){return n = n.split("="),
				this[n[0]] = n[1],this}.bind({}))[0]
		};
	};
	window.decodeUrl = inner;
	return inner(url);
};

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