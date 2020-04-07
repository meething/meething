const DB_RECORD_META = 'gunmeeting_metadata'
const CUE_SHOW_TIME = 4;
let USER_METADATA = 'metadata_' + STREAM_ID;

var metaData = (function() {
  "use strict";
  

    gunDB.get(DB_RECORD_META).map().on(function (data, id) {
        if (!data) {
            return
        }

        var tab = document.getElementsByTagName("video")[0].id

        /* EVENT HANDLER */
        if (data.text) {
            SETCLUE(data.text, tab, 1);
        }

        if (data.like && data.streamId == STREAM_ID) {
            sentLove();
        }
    });
}

  // Create the methods object
  var methods = {};

  //
  // Methods
  //
  methods.sentMessage = function(message) {
    this.sentControlData({ text: message });
  };

  methods.sentControlData = function(data) {
    data.streamId = STREAM_ID;
    let metaData = gunDB.get(USER_METADATA).put(data);
    gunDB.get(DB_RECORD_META).set(metaData);
  };

  // Expose the public methods
  return methods;
})();
