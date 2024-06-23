class logging {
    constructor() {}

    print(msg, type){
        //print message to console with template DD:MM:YYYY HH:MM:SS:MS
        const date = new Date();
        const dateString = date.toLocaleDateString();
        const timeString = date.toLocaleTimeString();
        let color = "";
        switch(type){
            case "INFO":
                color = "\x1b[0m";
                break;
            case "ERROR":
                color = "\x1b[31m";
                break;
            case "DEBUG":
                color = "\x1b[34m";
                break;
        }
        console.log(`${color} [${type}] ${dateString} ${timeString}:${date.getMilliseconds()} `, ...msg);
    }

    info(msg){
        this.print(msg, "INFO");
    }

    error(msg){
        this.print(msg, "ERROR");
    }

    debug(msg){
        this.print(msg, "DEBUG");
    }
}

export default logging;