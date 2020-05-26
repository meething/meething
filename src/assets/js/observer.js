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

		  var count = document.getElementById('grid').childElementCount;
		  var container = document.getElementById('grid');
		  // console.log('Resize Grid! New Element Count:',count);
		  if(count > 7) {
			  // we can fine adjust this
		  	container.style["grid-template-columns"] = "repeat(auto-fit, minmax(260px, 1fr))"
		  } else if(count > 3) {
		  	container.style["grid-template-columns"] = "repeat(auto-fit, minmax(260px, 1fr))"
		  } else if(count > 1) {
		  	container.style["grid-template-columns"] = "repeat(auto-fit, minmax(260px, 1fr))"
		  } else if (count == 1) {
		  	container.style["grid-template-columns"] = "repeat(auto-fit, minmax(260px, 1fr))"
		  } else if (count == 0) {
			 console.log('no participants');
			 document.getElementById('emptyroom').hidden = false;
		  }
	        }
	    }
	};

	// Create an observer instance linked to the callback function
	var observer = new MutationObserver(callback);

	// Start observing the target node for configured mutations
	observer.observe(targetNode, config);



    });
