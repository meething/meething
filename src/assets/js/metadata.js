const DB_RECORD_META = "gunmeeting_metadata";

var metaData = (function() {
  "use strict";

  Gun()
    .get(DB_RECORD_META)
    .map()
    .on(function(data, id) {
      if (!data) {
        return;
      }

      /* EVENT HANDLER */
      if (data.text) {
      }
    });

  // Create the methods object
  var methods = {};

  //
  // Methods
  //
  methods.sentControlData = function(data, streamId) {
    const USER_METADATA = "metadata_" + streamId;
    data.streamId = streamId;
    const metaData = Gun().get(USER_METADATA).put(data);
    Gun().get(DB_RECORD_META).set(metaData);
  };

  // Expose the public methods
  return methods;
})();
