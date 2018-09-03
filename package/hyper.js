const fxy = require('fxy/package/index')
const query = require('querystring')
const Url = require('url')
const {URL} = Url
const endpoint = Symbol('endpoint url')

const Hyper = Base => class extends Base{
	get endpoint(){ return endpoint in this ? this[endpoint]:this.meta.endpoint.url }
	set endpoint(value){ return this[endpoint] = value }
	locate(...x){ return locate(this, ...x) }
	locator(...x){ return get_api_locator(this,...x) }
}

//exports
module.exports = Hyper
module.exports.get = request_get
module.exports.locate = locate
module.exports.source_locator = get_source_locator

//shared actions
async function locate(api, ...x){
	const on_data = x.filter(i=>fxy.is.function(i))[0]
	const locator = get_api_locator(api, ...x)
	try{
		const response = await request_get(locator)
		return on_data ? on_data(response, {api, locator: `${locator}`}):response
	}
	catch(e){
		throw e
	}
}

function get_api_locator(api, ...x){
	const parameters = x.filter(i=>fxy.is.data(i))
	return get_source_locator(api, ...parameters)
}

function get_source_locator({endpoint}, input = {}, preset = {}){
	const locator = fxy.tag.data(endpoint, fxy.as.one({}, preset.url, input.url))
	const source = new URL(locator)
	const data = fxy.as.one({}, input.search, preset.search)
	for(const i in data) source.searchParams.set(i, data[i])
	return source
}

function request_get(url, ...x){
	const method = x.filter(i=>fxy.is.text(i))[0] || 'GET'
	return new Promise(function get_promise(success, error){
		const {headers} = get_options(...x)
		const options = Url.parse(`${url}`)
		options.method = method
		options.headers = headers
		if(url instanceof URL === false) return error(new Error(`Invalid url: ${url}`))
		return process.nextTick(()=>{
			return get_transport()[method.toLowerCase()](options, on_response).on('error', on_error)

			//shared actions
			function on_error(e){ return error(e) }

			function on_response(response){ return read_stream(response).then(success).catch(error) }
		})

		//shared actions
		function read_stream(response, encoding = 'utf8', data = ''){
			response.setEncoding(encoding)
			//shared actions
			return new Promise(function stream_promise(success, error){
				const stopped = status(response)
				if(stopped){
					response.resume()
					console.error(stopped)
				}
				return process.nextTick(function stream_tick(){
					response.on('data', on_data)
					response.on('end', on_end)
					response.on('error', on_error)

					//shared actions
					function on_data(fragment){ return data += fragment }

					function on_end(){ return success(send_data(data, response)) }

					function on_error(e){ return error(e) }
				})
			})
		}

		//shared actions
		function send_data(data, response){
			return {
				get base64(){ return new Buffer(data).toString('base64') },
				get data(){ return this.json.data || this.json },
				get buffer(){ return Buffer.from(data) },
				get json(){
					try{
						return JSON.parse(data)
					}
					catch(e){
						console.log(`••••••••••••••••${response.req.path}••••••••••••••••`)
						console.error(e)
						console.log(data)
						console.log(`••••••••••••••••${response.req.path}••••••••••••••••`)
					}
				},
				get module(){ return eval(data) },
				get stream(){ return response },
				get text(){ return data },
				get uri(){ return `data:${response.headers['content-type']};base64,${data}`}
			}
		}

		function status(response){
			let error = null
			const code = response.statusCode
			if(code !== 200) error = new Error(`Request Failed.\nStatus Code: ${code}`)
			return error
		}
	})

	//shared actions
	function get_options(body, ...headers){
		const options = {headers: fxy.as.one(...headers)}
		return {body: method === 'POST' ? JSON.stringify(body):undefined, options}
	}

	function get_transport(){ return url.protocol === 'https:' ? require('https'):require('http') }
}