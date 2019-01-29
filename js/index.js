// --- Constant values ----------------------------------------

const JSON_URL = "https://gist.githubusercontent.com/minecraft-timeline/c088c35d0b9f2b362106cc21841dd17e/raw/ec9d9007e2600fdf8178f39408ca4d65600cda50/version_data_development.json";
const YEAR_HEIGHT_PX = 365 * 4;
const DAY_MS = 24 * 60 * 60 * 1000;
const YEAR_MS = 365 * DAY_MS;
const LEAP_YEAR_MS = YEAR_MS + DAY_MS;

// --- Helper functions ---------------------------------------

function ajaxGET(requestStr,done) {
	let xhr = new XMLHttpRequest();
	xhr.open('GET', requestStr);
	xhr.onload = function() {
		done(xhr.responseText, xhr.status);
	};
	xhr.send();
}

function id(id) {
	return document.getElementById(id);
}

function hide(element) {
	element.classList.add("hidden");
}

function show(element) {
	element.classList.remove("hidden");
}

function msOfYear(realDateMs) {
	let realDate = new Date(realDateMs);
	let start = new Date(realDate.getFullYear(), 0, 1);
	return realDate.getTime() - start.getTime();
}

function isLeapYear(year) {
	return ((year % 4 === 0) && (year % 100 !== 0)) || (year % 400 === 0);
}

// --- Worker functions ---------------------------------------

function loadEditions(editions) {

	let tabsDOM = id("editions_tab");
	let rootDOM = id("editions_root");

	for (let i = 0; i<editions.length; i++) {

		console.log("+++++++++++++++++++++++++\nWORKING ON " + editions[i].title + "\n+++++++++++++++++++++++++");

		let tabDOM = document.createElement("span");
		tabDOM.appendChild(document.createTextNode(editions[i].title));
		tabDOM.id = "edition_panel_" + i;
		tabsDOM.appendChild(tabDOM);
		let panelDOM = document.createElement("div");
		if (i !== 0)
			hide(panelDOM);
		rootDOM.appendChild(panelDOM);
		loadVersions(editions[i].versions, panelDOM);
	}
}

function parseUTC(str) {

	if (str.length === 10) {
		return Date.parse(str + "T00:00");
	}
	else if (str.length === 16 || str.length === 19) {
		return Date.parse(str);
	}
	else {
		return Date.parse(undefined);
	}

}

function loadVersions(versions, panelDOM) {

	// Adds today as a special "version"

	versions.push({
		date: new Date().toISOString().substr(0,10),
		today: true
	});

	// Sorts versions by date

	versions.sort(function (v1, v2) {
		return Date.parse(v1.date) - Date.parse(v2.date);
	});

	// Generate timeline, years and versions

	if (versions.length > 0) {

		let firstTimeMs = parseUTC(versions[0].date);
		let lastTimeMs = parseUTC(versions[versions.length-1].date);
		let totalTimeMs = lastTimeMs - firstTimeMs;

		let firstDate = new Date(firstTimeMs);

		let lastDate = new Date(lastTimeMs);
		console.log(lastDate);

		let yearAmount = lastDate.getFullYear() - firstDate.getFullYear();

		let timelineHeight = (totalTimeMs/YEAR_MS) * YEAR_HEIGHT_PX;

		let timelineDOM = document.createElement("div");
		timelineDOM.classList.add("timeline");
		timelineDOM.style.height = timelineHeight + "px";

		let yearDOMs = [];

		for (let i = 0; i <= yearAmount; i++) {

			let yearDOM = document.createElement("div");
			yearDOM.classList.add("year");

			let multi = 1;

			if (i === 0) {
				multi = (YEAR_MS - msOfYear(firstTimeMs)) / YEAR_MS;
			}

			else if (i === yearAmount) {
				multi = (msOfYear(lastTimeMs)) / YEAR_MS;
			}

			else if (isLeapYear(firstDate.getFullYear() + i)) {
				multi = LEAP_YEAR_MS/YEAR_MS;
			}

			yearDOM.style.height = (multi * YEAR_HEIGHT_PX) + "px";
			yearDOMs[firstDate.getFullYear() + i] = yearDOM;

			timelineDOM.appendChild(yearDOM);

		}



		for (let i = 0; i < versions.length; i++) {

			let date = new Date(parseUTC(versions[i].date));

			let yearLength = (isLeapYear(date.getFullYear()) ? LEAP_YEAR_MS : YEAR_MS);
			let timeOfYear = msOfYear(date.getTime());

			let versionDOM = document.createElement("div");
			versionDOM.classList.add("version");

			let debug = "";

			debug += "\n\n\n";
			debug += "toyN        = " + timeOfYear + "\n";
			debug += "date        = " + date.toISOString() + "\n";
			debug += "day         = " + date.getDate() + "\n";
			debug += "year        = " + date.getFullYear() + "\n";
			debug += "is leap     = " + isLeapYear(date.getFullYear()) + "\n";
			debug += "time        = " + date.getTime() + "\n";

			if (date.getFullYear() === firstDate.getFullYear() || date.getFullYear() === lastDate.getFullYear()) {
				if (date.getFullYear() === firstDate.getFullYear()) {

					let firstTimeOfYear = msOfYear(firstTimeMs);

					let multi = ((timeOfYear/yearLength)-(firstTimeOfYear/yearLength))/(1-(firstTimeOfYear/yearLength));

					debug += "toyN/year   = " + (timeOfYear/yearLength) + "\n";
					debug += "toy0/year   = " + (firstTimeOfYear/yearLength) + "\n";
					debug += "1-toy0/year = " + (1-(firstTimeOfYear/yearLength)) + "\n";
					debug += "multi       = " + multi + "\n";

					versionDOM.style.top = (multi * 100) + "%";

				}
				else {

					let lastTimeOfYear = msOfYear(lastTimeMs);

					let multi = timeOfYear / lastTimeOfYear;

					debug += "toyN/toyL   = " + (timeOfYear/lastTimeOfYear) + "\n";
					debug += "multi       = " + multi + "\n";

					versionDOM.style.top = (multi * 100) + "%";

				}
				// versionDOM.style.bottom = ((1 - multi) * 100) + "%";
			} else {
				let multi = timeOfYear/yearLength;
				versionDOM.style.top = (multi * 100) + "%";

				debug += "multi       = " + multi + "\n";

			}
			debug += "\n\n\n";

			yearDOMs[date.getFullYear()].appendChild(versionDOM);

			versionDOM.addEventListener("click", function () {
				console.log(debug);
			});

		}

		panelDOM.appendChild(timelineDOM);
	}

}

// --- Main ---------------------------------------------------

ajaxGET(JSON_URL, function (data, status) {
	if (status === 200) {
		hide(id("gizmo_loading"));

		let json;
		try {
			json = JSON.parse(data);
		}
		catch (e) {
			show(id("gizmo_old"));
		}
		finally {
			loadEditions(json.editions);
		}

	}
	else {
		alert('Fatal error: could not load version data. Error code: ' + xhr.status);
	}
});