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

var village = [];

if (location.href.match(/^https:\/\/((nl|zz|en).*\.tribalwars\.(nl|net)\/(game.php).*)/)) {
	
};