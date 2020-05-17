'use strict';

// Meter class that generates a number correlated to audio volume.
// The meter class itself displays nothing, but it makes the
// instantaneous and time-decaying volumes available for inspection.
// It also reports on the fraction of samples that were at or near
// the top of the measurement range.
function SoundMeter(callback) {
	var AudioContext = window.AudioContext || window.webkitAudioContext;
	this.context = new AudioContext();
	this.instant = 0.0;
	this.audioMeter = document.getElementById('audiometer') || false;
	this.start = null;
	this.script = this.context.createScriptProcessor(2048, 1, 1);
	this.stopped = true;
	var self = this;

	this.update = function (timestamp) {
		if (!self.start) self.start = timestamp;
		var progress = timestamp - self.start;
		if (progress > 1000) {
			if (self.audioMeter) self.audioMeter.value = self.instant.toFixed(2) * 5;
			self.start = null;
		}
		window.requestAnimationFrame(self.update);
	}

	this.script.onaudioprocess = function (event) {
		var input = event.inputBuffer.getChannelData(0);
		var i;
		var sum = 0.0;

		for (i = 0; i < input.length; ++i) {
			sum += input[i] * input[i] * 10000;
		}
		self.instant = Math.sqrt(sum) / input.length;

		if (self.instant.toFixed(2) > 0.5) {
			callback();
		}
	};
}

SoundMeter.prototype.connectToSource = function (stream) {
	var self = this;
	if (this.stopped)
		//Stop
		this.stop();

	window.requestAnimationFrame(this.update);

	return new Promise(function (resolve, reject) {
		try {
			self.mic = self.context.createMediaStreamSource(stream);
			self.mic.connect(self.script);
			// necessary to make sample run, but should not be.
			self.script.connect(self.context.destination);
			//Done
			resolve();
		} catch (e) {
			reject(e);
		}
	});
};

SoundMeter.prototype.stop = function () {
	if (this.stopped)
		return;
	this.stopped = true;
	try {
		if (this.script) {
			this.script.onaudioprocess = null;
			this.script.disconnect(this.context.destination);
		}
		this.mic && this.mic.disconnect();

	} catch (e) {
	}
};
