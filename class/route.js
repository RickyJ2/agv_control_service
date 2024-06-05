class Route{
    constructor(){
        this.route = {};
    }
    on(address, callback){
        this.route[address] = callback;
    }
    onUndefined(callback){
        this.route.undefined = callback;
    }
    call(address, params){
        if(this.route[address]){
            this.route[address](params);
        }else{
            if(this.route.undefined){
                this.route.undefined(params);
            }else{
                console.log('Route not found');
            }
        }
    }
}   

export default Route;