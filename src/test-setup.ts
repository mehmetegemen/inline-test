import { main } from "./main";

const setup = async () => {
    console.info("Test starts");
    await main(".");
};

setup();