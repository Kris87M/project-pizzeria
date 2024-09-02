import { templates } from "../settings.js";

class Home {
    constructor(element) {
        const thisHome = this;
        thisHome.render(element);
        // thisHome.initPlugin()
    }

    render(element) {
        const thisHome = this;
        const generatedHTML = templates.homePage();
        // console.log(generatedHTML)
        thisHome.dom = {};
        thisHome.dom.wrapper = element;
        thisHome.dom.wrapper.innerHTML = generatedHTML;
    }
}

export default Home;