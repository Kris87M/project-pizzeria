import { select, templates } from "../settings.js";
import AmountWidget from "./AmountWidget.js";

class Booking {
    constructor(element) {
        const thisBooking = this;
        thisBooking.render(element);
        thisBooking.initWidgets();
    }
    render(element) {
        const thisBooking = this;
        const generatedHTML = templates.bookingWidget();
        thisBooking.dom = {};
        thisBooking.dom.wrapper = element;
        thisBooking.dom.wrapper.innerHTML = generatedHTML;

        thisBooking.dom.peopleAmount = document.querySelector(select.booking.peopleAmount);
        thisBooking.dom.hoursAmount = document.querySelector(select.booking.hoursAmount);
    }
    initWidgets() {
        const thisBooking = this;
        thisBooking.peopleAmount = new AmountWidget(thisBooking.dom.peopleAmount);
        thisBooking.hoursAmount = new AmountWidget(thisBooking.dom.hoursAmount);
    }
}

export default Booking;