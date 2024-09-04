import { classNames, select, settings, templates } from "../settings.js";
import utils from "../utils.js";
import AmountWidget from "./AmountWidget.js";
import DatePicker from "./DatePicker.js";
import HourPicker from "./HourPicker.js";

class Booking {
    constructor(element) {
        const thisBooking = this;
        thisBooking.render(element);
        thisBooking.initWidgets();
        thisBooking.getData();
        thisBooking.selectedTable = null;
    }
    getData() {
        const thisBooking = this;

        const startDateParam = `${settings.db.dateStartParamKey}=${utils.dateToStr(thisBooking.datePicker.minDate)}`;
        const endDateParam = `${settings.db.dateEndParamKey}=${utils.dateToStr(thisBooking.datePicker.maxDate)}`;

        const params = {
            booking: [
                startDateParam,
                endDateParam,
            ],
            eventsCurrent: [
                settings.db.notRepeatParam,
                startDateParam,
                endDateParam,
            ],
            eventsRepeat: [
                settings.db.repeatParam,
                endDateParam,
            ],
        };

        // console.log('getData params', params);

        const urls = {
            booking:       `${settings.db.url}/${settings.db.bookings}?${params.booking.join('&')}`,
            eventsCurrent: `${settings.db.url}/${settings.db.events}?${params.eventsCurrent.join('&')}`,
            eventsRepeat:  `${settings.db.url}/${settings.db.events}?${params.eventsRepeat.join('&')}`,
        };

        // console.log('getData urls', urls);

        Promise.all([
            fetch(urls.booking),
            fetch(urls.eventsCurrent),
            fetch(urls.eventsRepeat),
        ])
            .then(function (allResponses) {
                const bookingsResponse = allResponses[0];
                const eventsCurrentResponse = allResponses[1];
                const eventsRepeatResponse = allResponses[2];
                return Promise.all([
                    bookingsResponse.json(),
                    eventsCurrentResponse.json(),
                    eventsRepeatResponse.json(),
                ]);
        })
            .then(function ([bookings, eventsCurrent, eventsRepeat]) {
                // console.log(bookings);
                // console.log(eventsCurrent);
                // console.log(eventsRepeat);
                thisBooking.parseData(bookings, eventsCurrent, eventsRepeat);
        });
    }

    parseData(bookings, eventsCurrent, eventsRepeat) {
        const thisBooking = this;
        thisBooking.booked = {};
        for (let item of bookings) {
            thisBooking.makedBooked(item.date, item.hour, item.duration, item.table);
        }
        for (let item of eventsCurrent) {
            thisBooking.makedBooked(item.date, item.hour, item.duration, item.table);
        }

        const minDate = thisBooking.datePicker.minDate;
        const maxDate = thisBooking.datePicker.maxDate;

        for (let item of eventsRepeat) {
            if (item.repeat == 'daily') {
                for (let loopDate = minDate; loopDate <= maxDate; loopDate = utils.addDays(loopDate, 1)){
                    thisBooking.makedBooked(utils.dateToStr(loopDate), item.hour, item.duration, item.table);
                }
            }
        }
        // console.log('thisBooking.booked', thisBooking.booked);
        thisBooking.updateDOM();
    }

    makedBooked(date, hour, duration, table) {
        const thisBooking = this;
        if (typeof thisBooking.booked[date] == 'undefined') {
            thisBooking.booked[date] = {};
        }

        const startHour = utils.hourToNumber(hour);



        for (let hourBlock = startHour; hourBlock < startHour + duration; hourBlock += 0.5){
            // console.log('loop', hourBlock);
            if (typeof thisBooking.booked[date][hourBlock] == 'undefined') {
                thisBooking.booked[date][hourBlock] = [];
            }

            thisBooking.booked[date][hourBlock].push(table);
        }
    }

    updateDOM() {
        const thisBooking = this;
        thisBooking.date = thisBooking.datePicker.value;
        thisBooking.hour = utils.hourToNumber(thisBooking.hourPicker.value);

        let allAvailable = false;

        if (
            typeof thisBooking.booked[thisBooking.date] == 'undefined'
            ||
            typeof thisBooking.booked[thisBooking.date][thisBooking.hour] == 'undefined'
        ) {
            allAvailable = true;
        }

        for (let table of thisBooking.dom.tables) {
            let tableId = table.getAttribute(settings.booking.tableIdAttribute);
            if (!isNaN(tableId)) {
                tableId = parseInt(tableId);
            }
            if (
                !allAvailable
                &&
                thisBooking.booked[thisBooking.date][thisBooking.hour].includes(tableId)
            ) {
                table.classList.add(classNames.booking.tableBooked);
            } else {
                table.classList.remove(classNames.booking.tableBooked);
            }
        }
    }

    initTables(event) {
        const thisBooking = this;
        const selectedTarget = event.target;
        // console.log(event);
        if (selectedTarget.classList.contains('table')) {
            if (selectedTarget.classList.contains('booked')) {
                alert('Booked. Choose another table.');
            } else {
                if (selectedTarget.classList.contains('selected')) {
                    thisBooking.clearSelectedTable();
                } else {
                    selectedTarget.classList.add('selected');
                    thisBooking.selectedTable.push(selectedTarget.dataset.table);
                    // console.log(selectedTarget.dataset.table, thisBooking.selectedTable);
                }
            }
        }
    }

    clearSelectedTable() {
        const thisBooking = this;
        for (let table of thisBooking.dom.tables) {
            if (table.classList.contains('selected')) {
                table.classList.remove('selected');
            }
        }
        thisBooking.selectedTable = [];
    }

    sendBooking() {
        const thisBooking = this;
        const url = `${settings.db.url}/${settings.db.bookings}`;
        // console.log(url)
        const payload = {
            date: thisBooking.datePicker.value,
            hour: thisBooking.hourPicker.value,
            table: parseInt(thisBooking.selectedTable),
            duration: thisBooking.hoursAmount.value,
            ppl: thisBooking.peopleAmount.value,
            starters: [],
            phone: thisBooking.dom.phone.value,
            address: thisBooking.dom.address.value,
        }
        // console.log(payload);
        for (let starter of thisBooking.dom.starters) {
            if (starter.checked) { payload.starters.push(starter.value) }
        }
        const options = {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload),
        };
        fetch(url, options)
            .then(function (response) {
                return response.json();
            }).then(function (parsedResponse) {
                // console.log('parsedResponse', parsedResponse);
                thisBooking.makedBooked(payload.date, payload.hour, payload.duration, payload.table);
                // console.log(thisBooking.booked)
                thisBooking.updateDOM();
                thisBooking.clearSelectedTable();
                thisBooking.dom.phone.value = '';
                thisBooking.dom.address.value = '';
            });
    }

    render(element) {
        const thisBooking = this;
        const generatedHTML = templates.bookingWidget();
        thisBooking.dom = {};
        thisBooking.dom.wrapper = element;
        thisBooking.dom.wrapper.innerHTML = generatedHTML;

        thisBooking.dom.peopleAmount = document.querySelector(select.booking.peopleAmount);
        thisBooking.dom.hoursAmount = document.querySelector(select.booking.hoursAmount);

        thisBooking.dom.datePicker = document.querySelector(select.widgets.datePicker.wrapper);
        thisBooking.dom.hourPicker = document.querySelector(select.widgets.hourPicker.wrapper);

        thisBooking.dom.tables = thisBooking.dom.wrapper.querySelectorAll(select.booking.tables);
        thisBooking.dom.floor = thisBooking.dom.wrapper.querySelector(select.booking.floor);

        thisBooking.dom.form = thisBooking.dom.wrapper.querySelector(select.booking.form);
        thisBooking.dom.phone = thisBooking.dom.wrapper.querySelector(select.booking.phone);
        thisBooking.dom.address = thisBooking.dom.wrapper.querySelector(select.booking.address);
        thisBooking.dom.starters = thisBooking.dom.wrapper.querySelectorAll(select.booking.starters);
    }
    initWidgets() {
        const thisBooking = this;
        thisBooking.peopleAmount = new AmountWidget(thisBooking.dom.peopleAmount);
        thisBooking.hoursAmount = new AmountWidget(thisBooking.dom.hoursAmount);

        thisBooking.datePicker = new DatePicker(thisBooking.dom.datePicker);
        thisBooking.hourPicker = new HourPicker(thisBooking.dom.hourPicker);

        thisBooking.dom.wrapper.addEventListener('updated', function (event) {
            thisBooking.updateDOM();
            thisBooking.clearSelectedTable(event);
        });
        thisBooking.dom.floor.addEventListener('click', function (event) {
            thisBooking.initTables(event);
        });
        thisBooking.dom.form.addEventListener('submit', function (event) {
            event.preventDefault();
            thisBooking.sendBooking();
        })
    }
}

export default Booking;