const fxy = require('fxy/package/index')
const Meta = require('@va11y/meta/package/index')
const Hyper = require('./hyper')

const ApiCounter = Base => class extends Hyper(Base){
	get count(){ return 'counter' in this ? this.counter.count || 0:0 }
	file(index){
		const from = index * this.count
		return `${this.name || this.constructor.name}.${from}-${from + this.count}.json`
	}
	get loops(){ return Math.ceil(this.total / this.count) }
	get total(){ return 'counter' in this ? this.counter.total || 0:0 }
}

class Api extends ApiCounter(Object){
	static get hyper(){ return Hyper }
	constructor(input){
		super()
		if(fxy.is.data(input)) Object.assign(this, input)
		else if(fxy.is.text(input)){
			if(fxy.exists(input)) this.meta = Meta(input)
			else if(fxy.is.protocoled(input)) this.meta = {endpoint:{url:input}}
			else this.meta = Meta(input)
		}
		this.current = this.counter ? this.counter.current || 0:0
	}
	preset(fieldset){
		let preset = 'meta' in this ? this.meta.preset:{}
		if(fxy.is.data(preset) === false) preset = {}
		if(fxy.is.data(fieldset)) preset = fxy.as.one({},preset,fieldset)
		else if(fxy.is.text(fieldset)) preset = get_location_meta.call(this)
		//exports
		return preset
		//shared actions
		function get_location_meta(){
			if(fieldset in this.locations === false) return preset
			else if(!this.meta.locations[fieldset]) return preset
			return fxy.as.one({}, preset, this.locations[fieldset])
		}
	}
	get locations(){ return this.meta.locations }
	async get(fieldset, input={}, ...x){
		const info = this.locations[fieldset]

		this.endpoint = fxy.source.url(this.meta.endpoint.url, info.url)

		return await this.locate(input, this.preset(fieldset), ...x)
	}
}

//exports
module.exports = (...x)=>new Api(...x)
module.exports.Api = Api
