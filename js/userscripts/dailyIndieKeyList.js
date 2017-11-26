// Get visible keys from DailyIndieGame to list and split it into two arrays (2 bundles only cost some cents moar)
var keys = document.getElementById("TableKeys").getElementsByTagName("tr").length,
	 cnt = 6, arr1 = [], arr2 = [], arr3 = [], arr4 = [];

for(var i=1;i<keys; i++){
	var key = document.getElementById("TableKeys").getElementsByTagName("tr")[i].getElementsByTagName("td")[4].innerHTML.replace(/\s+/g,''),
		tit = document.getElementById("TableKeys").getElementsByTagName("tr")[i].getElementsByTagName("td")[2].innerHTML.replace(/\s+/g,'');

    if(i % 6 === 0) cnt+=6;
    if((i <= cnt) && ((cnt/6) %2 === 0)){
        arr1.push({"serial": key, "title": tit});
		arr3.push(key);
    } else {
        arr2.push({"serial": key, "title": tit});
		arr4.push(key);
    }
}
console.log("Bots: "+arr3.join(", ")); // Bots
console.log("Main: "+arr4.join(", ")); // Main

// Get visible keys from IG into list
var keys = $("input.keys").length, arr = [];
for(var i=0;i<keys;i++){ arr.push($("input.keys").eq(i).val()); }
console.log(arr.join(","));

// Get visible keys from Bundlestars to list
var len = $('.key-reveal-copy .input-group input').attr('ng-model', 'game.key').length, arr = [];
for(var i=0;i<len;i++){ arr.push($('.key-reveal-copy .input-group input').attr('ng-model', 'game.key').eq(i).val()); }
console.log(arr); // Plain
console.log("ASF: "+arr.join(",")); // Steam

var toRemove = ["BP40J-7AFHX-JH5G7","NEEDSTOBECHANEDTOPREVIOUSLYUSEDKEYS"], newArr = [];
newArr = arr.filter( function(el){return !toRemove.includes(el);});
console.log(newArr); // Plain
console.log("ASF: "+newArr.join(",")); // Steam

// Get visible keys from CubicBundle to list
var len = $('.table tr').length, arr = [];
for(var i=1;i<len;i++){ arr.push($('.table tr:eq('+i+') td:eq(4)').text()); }
console.log(arr.join(","));

// Get visible keys from HumbleBundle to list
var len = $('.js-sr-redeemed-bubble').length, arr = [];

for(var i=0; i<len; i++){
    arr.push($('.js-sr-redeemed-bubble').eq(i).text().replace(/\s+/g,''));
}
console.log(arr); // Plain
console.log("ASF: "+arr.join(",")); // Steam