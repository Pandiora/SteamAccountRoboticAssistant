// Check all games under filters in inventory (while open)
var num = $J('.econ_tag_filter_category:eq(2) .econ_tag_filter_container input').length;
while(num--){
	console.log(num);
	$J('.econ_tag_filter_category:eq(2) .econ_tag_filter_container:eq('+num+') input').trigger('click');
}







// for filtering the same filters (games) again, just create an array of the checkbox-values of the before
// used filters first, then reload page and iterate over them
var len = $J('.econ_tag_filter_category:eq(2) .econ_tag_filter_container input').length, arr = [];
while(len--){
	arr.push($J('.econ_tag_filter_category:eq(2) .econ_tag_filter_container:eq('+len+') input').prop('checked'));
}
console.log("Array:"+arr);


var arr = [true,true,true,true,true,true,true,true,true,true,true,true,true,true,true,true,true,true,true,true,true,true,true,true,true,true,true,true,false,true,true,true,true,true,true,true,true,true,true,true,true,false,true,true,true,true,false,true,false,true,true,true,true,true,true,true,true,false,true,true,true,true,true,true,true,true,true,true,true,true,true,true,true,true,true,true,true,true,true,true,true,true,true,true,true,true,true,true,true,true,true,true,true,true,false,true,true,true,true,true,true,true,true,true,true,true,true,true,false,true,true,true,true,true,true,true,false,true,true,true,true,true,true,true,true,true,true,true,true,false,true,false,true,true,true,true,true,true,true,true,true,true,true,true,true,true,true,true,true,true,true,true,true,true,true,true,true,true,true,true,true,false,true,true,true,true,true,true,true,true,false,true,true,true,true,true,true,true,true,true,true,true,true,true,true,true,true,true,true,true,true,true,true,true,true,true,true,true,true,true,true,false,true,true,true,false,true,true,true,true,true,true,true,false,true,true,true,true,true,true,true,true,false,true,false,true,true,true,true,true,true,true,true,true,true,true,true,true,true,true,true,true,true,true,false,true,false,true,true,true,true,true,true,true,true,true,true,true,true,true,true,true,true,true,true,true,true,true,false,true,true,true,true,true,true,true,true,true,true,true,true,true,true,true,true,true,true,true,true,true,true,true,true,true,true,true,true,true,true,true,true,true], len = arr.length;

while(len--){
	if(arr[len])
	$J('.econ_tag_filter_category:eq(2) .econ_tag_filter_container:eq('+len+') input').trigger('click');	
}