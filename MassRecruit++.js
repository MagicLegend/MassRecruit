// ==UserScript==
// @name			MassRecruit++
// @namespace		http://tampermonkey.net/
// @version			0.2
// @description		Improves the TW messagenames.
// @author			MagicLegend
// @grant			none
// @include			https://nl*.tribalwars.nl/game.php*
// ==/UserScript==

/** LICENCE:
 * MassRecruit++ v0.2 © 2016 MagicLegend
 * This work is under the Attribution-NonCommercial-ShareAlike 4.0 International (CC BY-NC-SA 4.0) Licence.
 * More info can be found here: https://creativecommons.org/licenses/by-nc-sa/4.0/deed.en (Human readable, not the actual licence) & https://creativecommons.org/licenses/by-nc-sa/4.0/legalcode (Actual licence)
 *
 * v0.1		Initial work, trying some stuff
 * v0.2		Now works for the offence category
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
 * - Save patterns to a cookie?
 * - Read which units are in recruitment, and subtract them from the To Do
 * - Add a little bit of documentation on the github page
 * - Add function calls for the non-premium buildings
 * - Write the fetching of the current units in a variable function
 * - Write the current units with their name in a 2D array
 * - Add functionallity for churches
 *
 ** KNOWN BUGS:
 * - When an unit is finished the added column is removed
 */

//Variable stuff:
var villageAmount;
var village = [];
var trainingBarrack = [];
var trainingStable = [];
var trainingGarage = [];
var currentUnits = [];

var offenceNames = ["off", "offence"];
var defenceNames = ["def", "defence"];

var barrackUnits = ["spear", "sword", "axe", "archer"];
var stableUnits = ["spy", "light", "marcher", "heavy"];
var garageUnits = ["ram", "cata"];
var offence = [0, 0, 8500, 0, 500, 2500, 0, 0, 150, 0];
var defence = [7500, 8500, 0, 1000, 0, 0, 0, 0, 5, 0];

//Setup:
//var offence = [spear, sword, axe, archer, spy, light, marcher, heavy, ram, cata]

var config = {
    debug: true,
    level: 1 // 1: everything, 2: most things, 3: really limited things
};


//Code stuff:

function log(lvl, logmsg) {
    if (config.debug) {
        if (config.level >= lvl) {
            console.log("Ge: " + logmsg);
        }
    }
};

function logBarrack(lvl, logmsg) {
    if (config.debug) {
        if (config.level >= lvl) {
            console.log("B: " + logmsg);
        }
    }
};

function logStable(lvl, logmsg) {
    if (config.debug) {
        if (config.level >= lvl) {
            console.log("S: " + logmsg);
        }
    }
};

function logGarage(lvl, logmsg) {
    if (config.debug) {
        if (config.level >= lvl) {
            console.log("G: " + logmsg);
        }
    }
};

if (location.href.match(/(nl|zz|en).*\.tribalwars\.(nl|net)\/game\.php(\?|.*\&)screen\=train(\?|.*\&)mode\=mass/)) {
    log(1, "Href match > mode=mass");

    $(function () {
        $(".btn[value='Verschil invoeren']").click(function () {
            log(3, "Difference button clicked");
            findVillageAmount();
            findVillages();
        });
    });
};

if (location.href.match(/(nl|zz|en).*\.tribalwars\.(nl|net)\/game\.php(\?|.*\&)screen\=train(\?|.*\&)mode\=train/)) {
    log(1, "Href match > mode=train");

    $(function () {
        log(1, "Screen = train");
        $("#train_form > .vis > tbody > tr:not(.row_a, .row_b)").first().append("<th style='width: 80px'>To Do:</th>");
        log(1, "Added heading");
        createRecruitArrays();
        getBarrackRecruiting();
        getStableRecruiting();
        getGarageRecruiting();
        var group = getGroups();
        var currentgroup;
        log(1, "group.length: " + group.length);

        for (var i = 0; i < group.length; i++) {
            log(1, "Looking for: " + group[i]);
            for (var j = 0; j < offenceNames.length; j++) {
                if (group[i] === offenceNames[j]) {
                    log(1, "Found match! Group: " + group[i] + " offencenames: " + offenceNames[j]);
                    currentgroup = offenceNames[j];
                    break;
                }
            }

            for (var k = 0; k < defenceNames.length; k++) {
                if (group[i] === defenceNames[k]) {
                    log(1, "Found match! Group: " + group[i] + " defencenames: " + defenceNames[k]);
                    currentgroup = defenceNames[k];
                    break;
                }
            }
        }

        var tableLength = $("#train_form > .vis > tbody > tr").length - 2; //-2 to account for the header and the 'recruit' button
        log(1, "Amount of entries: " + tableLength);

        for (i = 1; i < tableLength + 1; i++) {
            var temp = $("#train_form > .vis > tbody > tr td:nth-child(3)").eq(i - 1).text();
            var textAfterHash = temp.substring(temp.indexOf('/') + 1);
            //var unit = $("#train_form > .vis > tbody > tr > td > a").hasClass()
            //currentUnits[i, textAfterHash];
            //log(1, "Current units: " + currentUnits[i, textAfterHash]);

            var displayText = offence[i - 1] - textAfterHash;
            $("#train_form > .vis > tbody > tr").eq(i).append("<td>" + displayText + "</td>");
        }
    });
};

function getBarrackRecruiting() {
    logBarrack(1, "Entered barrack");
    try {
        var trainingLength = $("#replace_barracks > .trainqueue_wrap > .vis > #trainqueue_barracks > tr").length; //-1 to account for the cancel everything button at the bottom.
        //logBarrack(1, "barrackunits.length: " + barrackUnits.length);
        logBarrack(1, "trainingLength: " + trainingLength);


        //--[[Code for finding the current recruiting lit unit]]--
        for (var i = 0; i < barrackUnits.length; i++) {
            var hasClassLit = $("#replace_barracks > .trainqueue_wrap > .vis > tbody > .lit > .lit-item > .unit_sprite").hasClass(barrackUnits[i]);
            if (hasClassLit) {
                var amountTroopsLeftLit = $("#replace_barracks > .trainqueue_wrap > .vis > tbody > .lit > .lit-item").first().text().match(/\d+/);
                trainingBarrack[0, 0] = barrackUnits[i];
                trainingBarrack[0, 1] = amountTroopsLeftLit;
                logBarrack(1, "Lit unit: " + trainingBarrack[0, 0]);
                logBarrack(1, "And has " + trainingBarrack[0, 1] + " left");
                logBarrack(1, "----------");
                //break;
            }
        }


        //--[[Code for finding the list of recruiting units]]--
        for (var j = 1; j < trainingLength + 1; j++) { //Strange for loop is to reserve a space for the lit item in the first slot
            //log(1, "First for loop " + j);
            for (var i = 0; i < barrackUnits.length; i++) {
                //log(1, "Entered for loop " + i);
                var hasClassRest = $("#replace_barracks > .trainqueue_wrap > .vis > #trainqueue_barracks > #trainorder_" + j + " > td > .unit_sprite").hasClass(barrackUnits[i]);
                if (hasClassRest) {
                    var amountTroopsLeft = $("#replace_barracks > .trainqueue_wrap > .vis > #trainqueue_barracks > #trainorder_" + j + " > td").text().match(/\d+/);
                    trainingBarrack[j, 0] = barrackUnits[i];
                    trainingBarrack[j, 1] = amountTroopsLeft;
                    logBarrack(1, "Unit " + j + " has type: " + trainingBarrack[j, 0]);
                    logBarrack(1, "And has " + trainingBarrack[j, 1] + " units to do");
                    logBarrack(1, "----------");
                } else {
                    //log(1, "Nope. Found type: " + barrackUnits[i]);
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
                logStable(1, "Lit unit: " + stableUnits[i]);
                logStable(1, "And has " + amountTroopsLeftLit + " left");
                trainingStable[0, 0] = stableUnits[i];
                trainingStable[0, 1] = amountTroopsLeftLit;
                logStable(1, "----------");
                //break;
            }
        }


        //--[[Code for finding the list of recruiting units]]--
        for (var j = 1; j < trainingLength + 1; j++) { //Strange for loop is to reserve a space for the lit item in the first slot
            //log(1, "First for loop " + j);
            for (var i = 0; i < barrackUnits.length; i++) {
                //log(1, "Entered for loop " + i);
                var hasClassRest = $("#replace_stable > .trainqueue_wrap > .vis > #trainqueue_stable > #trainorder_" + j + " > td > .unit_sprite").hasClass(stableUnits[i]);
                if (hasClassRest) {
                    var amountTroopsLeft = $("#replace_stable > .trainqueue_wrap > .vis > #trainqueue_stable > #trainorder_" + j + " > td").text().match(/\d+/);
                    trainingStable[j, 0] = stableUnits[i];
                    trainingStable[j, 1] = amountTroopsLeft;
                    logStable(1, "Unit " + j + " has type: " + trainingStable[j, 0]);
                    logStable(1, "And has " + trainingStable[j, 1] + " units to do");
                    logStable(1, "----------");
                } else {
                    //logStable(1, "Nope. Found type: " + stableUnits[i]);
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
                logGarage(1, "Lit unit: " + garageUnits[i]);
                logGarage(1, "And has " + amountTroopsLeftLit + " left");
                trainingGarage[0, 0] = garageUnits[i];
                trainingGarage[0, 1] = amountTroopsLeftLit;
                logGarage(1, "----------");
                //break;
            }
        }


        //--[[Code for finding the list of recruiting units]]--
        for (var j = 1; j < trainingLength + 1; j++) { //Strange for loop is to reserve a space for the lit item in the first slot
            //log(1, "First for loop " + j);
            for (var i = 0; i < garageUnits.length; i++) {
                //log(1, "Entered for loop " + i);
                var hasClassRest = $("#replace_garage > .trainqueue_wrap > .vis > #trainqueue_garage > #trainorder_" + j + " > td > .unit_sprite").hasClass(garageUnits[i]);
                if (hasClassRest) {
                    var amountTroopsLeft = $("#replace_garage > .trainqueue_wrap > .vis > #trainqueue_garage > #trainorder_" + j + " > td").text().match(/\d+/);
                    trainingGarage[j, 0] = garageUnits[i];
                    trainingGarage[j, 1] = amountTroopsLeft;
                    logGarage(1, "Unit " + j + " has type: " + trainingGarage[j, 0]);
                    logGarage(1, "And has " + trainingGarage[j, 1] + " units to do");
                    logGarage(1, "----------");
                } else {
                    //logGarage(1, "Nope. Found type: " + GarageUnits[i]);
                }
            }
        }
    } catch (ex) {
        logGarage(1, ex);
    }
}

function createRecruitArrays() {
    var trainingLengthBarrack = $("#replace_barracks > .trainqueue_wrap > .vis > #trainqueue_barracks > tr").length; //-1 to account for the cancel everything button at the bottom.
    trainingBarrack = new Array(trainingLengthBarrack);
    for (var i = 0; i < 2; i++) {
        trainingBarrack[i] = new Array(); //Add the 2nd array list
    }

    var trainingLengthStable = $("#replace_stable > .trainqueue_wrap > .vis > #trainqueue_stable > tr").length; //-1 to account for the cancel everything button at the bottom.
    trainingStable = new Array(trainingLengthStable);
    for (var j = 0; j < 2; j++) {
        trainingStable[j] = new Array(); //Add the 2nd array list
    }

    var trainingLengthGarage = $("#replace_garage > .trainqueue_wrap > .vis > #trainqueue_garage > tr").length; //-1 to account for the cancel everything button at the bottom.
    trainingGarage = new Array(trainingLengthStable);
    for (var k = 0; k < 2; k++) {
        trainingGarage[k] = new Array(); //Add the 2nd array list
    }

    var tableLength = $("#train_form > .vis > tbody > tr").length - 2; //-2 to account for the header and the 'recruit' button
    currentUnits - new Array(tableLength);
    for (var l = 0; l < 2; l++) {
        currentUnits[l] = new Array(); //Add the 2nd array list
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


//--[[Functions for the mass-recruit function]]--

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