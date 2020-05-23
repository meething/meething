window.addEventListener('resize', function(){
			// Trigger reformat on window resize
		  	document.getElementById('emptyroom').hidden = true;

			var docHeight = parseInt(window.innerHeight/100*95);
			var docWidth = parseInt(window.innerWidth/100*95);
			var gridCount = document.getElementById('grid').childElementCount;
			var container = document.getElementById('grid');

			if(gridCount > 24) {
				newWidth = "160px";
			} else if(gridCount > 12) {
				newWidth = "240px";
		    	} else if(gridCount > 7) {
				newWidth = "320px";
			} else if(gridCount > 4) {
				newWidth = "400px";
			} else if(gridCount == 4) {
				newWidth = docWidth/2+"px";
			} else if(gridCount > 1) {
				newWidth = "320px";
			} else if (gridCount == 1) {
				newWidth = docWidth+"px";
			} else if (gridCount == 0) {
				newWidth = "640px";
				document.getElementById('emptyroom').hidden = false;
			}
			// Apply Settings
			container.style["grid-template-columns"] = "repeat(auto-fit, minmax("+newWidth+", 1fr))"
			container.style["grid-gap"] = "0px";
			container.style["max-height"] = "95vh";
			// Calculate Video heights
			newWidth = parseInt(newWidth); // convert to integer
			var columns = parseInt(docWidth/newWidth);
			var rows = Math.ceil(gridCount / columns);
			var newVh = parseInt(docHeight / rows );
			Array.from(document.getElementsByClassName('remote-video')).forEach(function(video){ 
			   video.height = newVh; 
			   video.style.height = newVh+'px';
			   console.log(video);
			})
});

window.addEventListener('DOMContentLoaded',function () {
	console.log('DOM Ready');

	var targetNode = document.getElementById('grid');

	// Options for the observer (which mutations to observe)
	var config = { childList: true };

	// Callback function to execute when mutations are observed
	var callback = function(mutationsList, observer) {
	    for(var mutation of mutationsList) {
	        if (mutation.type == 'childList') {
	          	// console.log('watch grid has changed or child has been added/removed');
		  	document.getElementById('emptyroom').hidden = true;

			var docHeight = parseInt(window.innerHeight/100*95);
			var docWidth = parseInt(window.innerWidth/100*95);
			var gridCount = document.getElementById('grid').childElementCount;
			var container = document.getElementById('grid');

			if(gridCount > 24) {
				newWidth = "160px";
			} else if(gridCount > 12) {
				newWidth = "240px";
		    	} else if(gridCount > 7) {
				newWidth = "320px";
			} else if(gridCount > 4) {
				newWidth = "400px";
			} else if(gridCount == 4) {
				newWidth = docWidth/2+"px";
			} else if(gridCount > 1) {
				newWidth = "320px";
			} else if (gridCount == 1) {
				newWidth = docWidth+"px";
			} else if (gridCount == 0) {
				newWidth = "640px";
				document.getElementById('emptyroom').hidden = false;
			}
			// Apply Settings
			container.style["grid-template-columns"] = "repeat(auto-fit, minmax("+newWidth+", 1fr))"
			container.style["grid-gap"] = "0px";
			container.style["max-height"] = "95vh";
			// Calculate Video heights
			newWidth = parseInt(newWidth); // convert to integer
			var columns = parseInt(docWidth/newWidth);
			var rows = Math.ceil(gridCount / columns);
			var newVh = parseInt(docHeight / rows );
			Array.from(document.getElementsByClassName('remote-video')).forEach(function(video){ 
			   video.height = newVh; 
			   video.style.height = newVh+'px';
			   console.log(video);
			})
	        }
	    }
	};

	// Create an observer instance linked to the callback function
	var observer = new MutationObserver(callback);

	// Start observing the target node for configured mutations
	observer.observe(targetNode, config);

    });
