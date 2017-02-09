# MassRecruit
A script for Tribal Wars to improve the mass recruit option.

# Usage
Just paste the script in a tool like Tampermonkey, and make sure you have a Premium Account. The script will add an extra column with how many troops still need to be recruited:

![Preview](http://i.imgur.com/ih3fF5T.png)

You can add your own custom groupnames and patterns to this script. How? Continue reading!

#### Custom patterns
You can add your own groupnames and trooppatterns to the script. When you open the script you'll find to lists looking like this by default:
```
var names = {
    offence: ["off", "offence"],
    defence: ["def", "defence", "deff"],
    church1: ["kerk-1"],
    church2: ["kerk-2"],
    church3: ["kerk-3"],
    custom1: ["custom1"]
};

var units = {
    offence: [0, 0, 8500, 0, 500, 2500, 0, 0, 150, 0],
    defence: [7500, 8500, 0, 1000, 0, 0, 0, 550, 5, 0],
    church1: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    church2: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    church3: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    custom1: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
};
```
These two objects can be edited to let the script now that you want it to react to other groups. You can do this by adding a comma to the previous line, and make a new line and give it a name.
```
var names = {
    offence: ["off", "offence"],
    defence: ["def", "defence", "deff"],
    church1: ["kerk-1"],
    church2: ["kerk-2"],
    church3: ["kerk-3"],
    custom1: ["custom1"],
    custom2: ["custom2group"]
};
```
Note that we added a comma after the `custom1` array, and made a new array called `custom2`. This tells the script that it should look for a new groupname, in this case `custom2group`. As you might have seen by the default offence and defence arrays, you can add multiple groupnames! **Note that the groupnames are not case-sensitive, and that they also work on partial hits** *Example: the script will react to a group called `off-1`, because it looks for `off`.

We have to do the same for the units, so let's go!

```
var units = {
    offence: [0, 0, 8500, 0, 500, 2500, 0, 0, 150, 0],
    defence: [7500, 8500, 0, 1000, 0, 0, 0, 550, 5, 0],
    church1: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    church2: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    church3: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    custom1: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    custom2: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
};
```
Note that the array looks like a bunch of numbers, but there is logic to this. It's just an array from the first unit to the last. An easy way to construct this array is first have all the troops written down how you want them, and just put them in the right order. **Important: the name of the unitsarray has to be the one you want the names from the namesarray to trigger on. The script will look for the same arrayname for the units it should calculate with.** *Example: the custom1 array in the names object will use the custom1 array in units.*

As always, if you have an issue please create a new issue here on Github. If possible please provide the content of the console. ([How To](http://webmasters.stackexchange.com/questions/8525/how-to-open-the-javascript-console-in-different-browsers))
