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
 * MassRecruit++ v0.2 � 2016 MagicLegend
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
 * - Calculate every time a number/key is pressed for live stats
 *
 ** KNOWN BUGS:
 * - When an unit is finished the added column is removed
 */

//Variable stuff:
var villageAmount;
var tableLength;
var village = [];
var trainingBarrack = [];
var trainingStable = [];
var trainingGarage = [];
var currentUnits = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
var obj = {};

var offenceNames = ["off", "offence"];
var defenceNames = ["def", "defence"];

var barrackUnits = ["spear", "sword", "axe", "archer"];
var stableUnits = ["spy", "light", "marcher", "heavy"];
var garageUnits = ["ram", "cata"];
var allUnits = ["spear", "sword", "axe", "archer", "spy", "light", "marcher", "heavy", "ram", "cata"];
var offence = [0, 0, 8500, 0, 500, 2500, 0, 0, 150, 0];
var defence = [7500, 8500, 0, 1000, 0, 0, 0, 550, 5, 0];

var config = {
    debug: true,
    level: 1, // 1: everything, 2: most things, 3: really limited things
    defaultArrays: true
};

//http://stackoverflow.com/questions/7729382/how-to-make-a-non-blocking-sleep-in-javascript-jquery

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
        createRow();
        main();
    });

    $(".btn-recruit").click(function () {
        log(1, "Clicked button");
        if (!$(".todo").length) {
            createRow();
        }
        currentUnits = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
        setTimeout(main, 500);
    })

};

function main() {
    getBarrackRecruiting();
    getStableRecruiting();
    getGarageRecruiting();
    var group = getGroups();
    var currentgroup;
    log(1, "group.length: " + group.length);

    if (config.defaultArrays) {
        for (var i = 0; i < group.length; i++) {
            log(1, "Looking for: " + group[i]);
            for (var j = 0; j < offenceNames.length; j++) {
                if (group[i] === offenceNames[j]) {
                    log(1, "Found match! Group: " + group[i] + " offencenames: " + offenceNames[j]);
                    currentgroup = offenceNames[j];
                    tableLength = $("#train_form > .vis > tbody > tr").length - 2; //-2 to account for the header and the 'recruit' button
                    log(1, "Amount of entries: " + tableLength);

                    log(1, trainingBarrack);

                    calcTroops();

                    log(1, currentUnits);

                    for (k = 0; k < tableLength; k++) {
                        var temp = $("#train_form > .vis > tbody > tr td:nth-child(3)").eq(k).text()
                        var textAfterHash = temp.substring(temp.indexOf('/') + 1);

                        var displayText = offence[k] - textAfterHash - currentUnits[k];

                        $("#train_form > .vis > tbody > tr .massrecruitplusplus").eq(k).text(displayText);
                    }
                    break;
                }
            }

            for (var k = 0; k < defenceNames.length; k++) {
                if (group[i] === defenceNames[k]) {
                    log(1, "Found match! Group: " + group[i] + " defencenames: " + defenceNames[k]);
                    currentgroup = defenceNames[k];

                    var tableLength = $("#train_form > .vis > tbody > tr").length - 2; //-2 to account for the header and the 'recruit' button
                    log(1, "Amount of entries: " + tableLength);

                    log(1, trainingBarrack);

                    calcTroops();

                    log(1, currentUnits);

                    for (k = 0; k < tableLength; k++) {
                        var temp = $("#train_form > .vis > tbody > tr td:nth-child(3)").eq(k).text()
                        var textAfterHash = temp.substring(temp.indexOf('/') + 1);

                        var displayText = defence[k] - textAfterHash - currentUnits[k];

                        $("#train_form > .vis > tbody > tr .massrecruitplusplus").eq(k).text(displayText);
                    }

                    break;
                }
            }
        }
    } else {
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
                var parsed = garageUnits[i] + "," + amountTroopsLeft;
                trainingGarage[0] = parsed;
                logGarage(1, "Lit unit: " + garageUnits[i]);
                logGarage(1, "And has " + amountTroopsLeftLit + " left");
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
                    logGarage(1, "----------");
                } else {
                    //logGarage(1, "Nope. Looking for type: " + GarageUnits[i]);
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
                    case "spear":
                        logBarrack(1, "Found: spear");
                        break;
                    case "sword":
                        logBarrack(1, "Found: sword");
                        break;
                    case "axe":
                        logBarrack(1, "Found: axe");
                        break;
                    case "archer":
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
                    case "spy":
                        logStable(1, "Found: spy");
                        break;
                    case "light":
                        logStable(1, "Found: light");
                        break;
                    case "marcher":
                        logStable(1, "Found: marcher");
                        break;
                    case "heavy":
                        logStable(1, "Found: heavy");
                        break;
                    default: logStable(1, "Default case");
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
                    case "ram":
                        logGarage(1, "Found: ram");
                        break;
                    case "cata":
                        logGarage(1, "Found: cata");
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
        $("#train_form > .vis > tbody > tr").eq(k).append("<td class = massrecruitplusplus " + allUnits[k] + ">Filler!</td>");
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