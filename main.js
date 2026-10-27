const dataArea = document.getElementById("data-area");
const eventsArea = document.getElementById("events-area");
const peopleArea = document.getElementById("people-area");
const tableArea = document.getElementById("table-area");

const dayOptions = ["MON", "TUE", "WED", "THUR", "FRI", "SAT", "SUN"];

const data = JSON.parse(localStorage.getItem("data")) || {
	events: [
		{
			name: "Workshop 1",
			day: 1,
			start: 15,
			end: 18,
		},
		{
			name: "Workshop 2",
			day: 3,
			start: 11,
			end: 12,
		},
		{
			name: "Workshop 3",
			day: 4,
			start: 15,
			end: 18,
		},
	],

	people: [
		{
			name: "Joe Blogs",
			busy: [
				{ day: 1, start: 14, end: 16 },
				{ day: 1, start: 16, end: 18 },
			],
		},
		{
			name: "Jo Vlogs",
			busy: [
				{ day: 3, start: 10, end: 11 },
				{ day: 4, start: 16, end: 18 },
			],
		},
	],
};

function addCell(row, text, c) {
	const td = document.createElement("td");
	if (c) td.classList.add(c);

	if (text) {
		const span = document.createElement("span");
		span.innerText = text;
		td.appendChild(span);
	}

	row.appendChild(td);
}

function renderData() {
	const tbl = document.createElement("table");
	localStorage.setItem("data", JSON.stringify(data));

	// Header
	{
		const tr = document.createElement("tr");

		addCell(tr);
		for (const event of data.events) {
			addCell(tr, event.name, "event");
		}

		tbl.appendChild(tr);
	}

	// Body
	for (const person of data.people) {
		const tr = document.createElement("tr");
		tr.classList.add("person-row");

		addCell(tr, person.name, "person");
		for (const event of data.events) {
			let isBusy = false;
			for (const period of person.busy) {
				if (
					event.day == period.day &&
					!(period.end <= event.start || event.end <= period.start)
				) {
					isBusy = true;
					continue;
				}
			}
			addCell(
				tr,
				isBusy ? null : "✔",
				isBusy ? "unavailable" : "available"
			);
		}

		tbl.appendChild(tr);
	}

	tableArea.innerHTML = null;
	tableArea.appendChild(tbl);
}

// NOTE: Code based on: https://stackoverflow.com/questions/118241/calculate-text-width-with-javascript
const textWidthCanvas = document.createElement("canvas");
function updateInputWidth(input) {
	// NOTE: The input is set to have padding 1ch and box-sizing: border-box. 
	// Adding an extra 00 of widths accounts for the 1ch of padding on either side.
	const text = input.value.toString() + "00"; 

	const ctx = textWidthCanvas.getContext("2d");
	const fontWeight = input.name == "name" ? "bold" : "normal";
	const fontSize   = window.getComputedStyle(document.body, null).getPropertyValue("font-size")   || "16px";
	const fontFamily = window.getComputedStyle(document.body, null).getPropertyValue("font-family") || "Arial";
	ctx.font = `${fontWeight} ${fontSize} ${fontFamily}`;
	console.log(input, ctx.font);

	const textWidth = ctx.measureText(text).width;
	input.style.minWidth = textWidth + "px";
}

function formatTime(value) {
	const h = Math.floor(value);
	const m = (value - h) * 60;
	return h.toString().padStart(2, "0") + ":" + m.toString().padStart(2, "0");
}

function deformatTime(value) {
	const [h, m] = value.split(":");
	return parseInt(h) + parseInt(m) / 60;
}

function addInput(row, data, label, value, type) {
	if (type == "day") {
		const select = document.createElement("select");
		select.classList.add(label);
		select.name = label;

		for (let i = 0; i < 7; i++) {
			const option = document.createElement("option");
			option.value = i;
			option.innerHTML = dayOptions[i];
			select.appendChild(option);
		}

		select.value = value;

		select.addEventListener("input", () => {
			data[label] = select.value;
			renderData();
		});

		row.appendChild(select);
		return;
	}

	const input = document.createElement("input");
	input.classList.add(label);

	if (type == "time") {
		input.type = "time";
		input.name = label;
		input.step = 15 * 60;
		input.value = formatTime(value);

		input.addEventListener("input", () => {
			data[label] = deformatTime(input.value);
			renderData();
		});

		row.appendChild(input);
		return
	}
	
	input.type = "text";
	input.name = label;
	input.value = value;

	input.addEventListener("input", () => {
		data[label] = input.value;
		updateInputWidth(input);
		renderData();
	});

	updateInputWidth(input);
	row.appendChild(input);
}

function renderEventsInput(focusLatestEvent) {
	const panel = document.createElement("div");
	panel.classList.add("events-panel");

	for (let i = 0; i < data.events.length; i++) {
		const event = data.events[i];

		const row = document.createElement("div");
		row.classList.add("input-row");

		addInput(row, event, "name", event.name, "text");
		addInput(row, event, "day", event.day, "day");
		addInput(row, event, "start", event.start, "time");
		addInput(row, event, "end", event.end, "time");

		const remove = document.createElement("button");
		remove.classList.add("remove");
		row.appendChild(remove);

		remove.addEventListener("click", () => {
			data.events.splice(i, 1);
			renderData();
			renderEventsInput();
		});

		panel.appendChild(row);
	}

	{
		const create = document.createElement("button");
		create.classList.add("create");
		create.classList.add("input-row");

		create.addEventListener("click", () => {
			data.events.push({
				name: "Event " + (data.events.length + 1),
				day: 0,
				start: 9,
				end: 10,
			});
			renderData();
			renderEventsInput(true);
		});

		panel.appendChild(create);
	}

	eventsArea.innerText = "";
	eventsArea.appendChild(panel);

	if (focusLatestEvent) {
		const nameInputs = panel.querySelectorAll(".name");
		const last = nameInputs[nameInputs.length - 1];
		last.focus();
		last.select();
	}
}

function renderPeopleInput(focusLatestPerson, focusLatestPeriodForPerson) {
	peopleArea.innerText = "";

	for (let i = 0; i < data.people.length; i++) {
		const person = data.people[i];

		// Person row
		{
			const row = document.createElement("div");
			row.classList.add("input-row");
			row.classList.add("person-row");

			addInput(row, person, "name", person.name, "text");

			const remove = document.createElement("button");
			remove.classList.add("remove");
			row.appendChild(remove);

			remove.addEventListener("click", () => {
				data.people.splice(i, 1);
				renderData();
				renderPeopleInput();
			});

			peopleArea.appendChild(row);
		}

		// Busy period panel
		const panel = document.createElement("div");
		panel.dataset.person = person.name;
		panel.classList.add("person-panel");

		for (let b = 0; b < person.busy.length; b++) {
			const period = person.busy[b];

			const row = document.createElement("div");
			row.classList.add("input-row");

			addInput(row, period, "day", period.day, "day");
			addInput(row, period, "start", period.start, "time");
			addInput(row, period, "end", period.end, "time");

			const remove = document.createElement("button");
			remove.classList.add("remove");
			row.appendChild(remove);

			remove.addEventListener("click", () => {
				person.busy.splice(b, 1);
				renderData();
				renderPeopleInput();
			});

			panel.appendChild(row);
		}

		{
			const create = document.createElement("button");
			create.classList.add("create");
			create.classList.add("input-row");

			create.addEventListener("click", () => {
				person.busy.push({
					day: 0,
					start: 9,
					end: 10,
				});
				renderData();
				renderPeopleInput(false, person.name);
			});

			panel.appendChild(create);
		}

		peopleArea.appendChild(panel);
	}

	{
		const create = document.createElement("button");
		create.classList.add("create");
		create.classList.add("input-row");
		create.style.width = "100%";

		create.addEventListener("click", () => {
			data.people.push({
				name: "Person " + (data.people.length + 1),
				busy: [],
			});
			renderData();
			renderPeopleInput(true);
		});

		peopleArea.appendChild(create);
	}

	if (focusLatestPerson) {
		const nameInputs = peopleArea.querySelectorAll(".person-row .name");
		const last = nameInputs[nameInputs.length - 1];
		last.focus();
		last.select();
	}

	if (focusLatestPeriodForPerson) {
		const nameInputs = peopleArea.querySelectorAll(
			`[data-person="${focusLatestPeriodForPerson}"] select`
		);
		const last = nameInputs[nameInputs.length - 1];
		last.focus();
	}
}

renderData();
renderEventsInput();
renderPeopleInput();
