const HTMLparser = require('node-html-parser') // https://www.npmjs.com/package/node-html-parser
const http = require('http')
const https = require('https')
const SERVER_PORT = 3001

const FETCH_URL = 'https://www.flickr.com/photos/poffihunt/albums'


const main = async () => {
  try {

    const server = http.createServer(async (req, res) => {
      res.statusCode = 200
      res.setHeader('Content-Type', 'application/json')

      await fetch(FETCH_URL, res)
      
    })

    server.listen(SERVER_PORT, () => {
      console.log(`Server running at port:${SERVER_PORT}/`)
    })
    
  } catch(err) {
    console.log(err)
  }
}

main()

const fetch = async (url, result_cb) => {
  https.get(url, (res) => {
    const { statusCode } = res
    const contentType = res.headers['content-type']
  
    let error
    if (statusCode !== 200) {
      error = new Error('Request Failed.\n' +
                        `Status Code: ${statusCode}`)
    } else if (contentType !== 'text/html; charset=utf-8') {
      error = new Error('Invalid content-type.\n' +
                        `Expected "text/html; charset=utf-8" but received "${contentType}"`)
    }
    if (error) {
      console.error({'message': error.message, error})
      // Consume response data to free up memory
      res.resume()
      return
    }
  
    res.setEncoding('utf8')
    let rawData = ''
    res.on('data', (chunk) => { 
      rawData += chunk 
      // console.log(chunk)
    })
    res.on('end', () => {
      // console.log(rawData)
      const options = {
        lowerCaseTagName: false,  // convert tag name to lower case (hurt performance heavily)
        comment: false,            // retrieve comments (hurt performance slightly)
        blockTextElements: {
          script: false,	// keep text content when parsing
          noscript: false,	// keep text content when parsing
          style: true,		// keep text content when parsing
          pre: true			// keep text content when parsing
        }
      }
      // https://www.npmjs.com/package/node-html-parser
      const root = HTMLparser.parse(rawData, options)
      // console.log(root)
      const album_list = []
      const photo_list = root.querySelector('.photo-list-view')
      while(child = photo_list.firstChild) {
        album_list.push({
          pic: keyvalues(child.getAttribute('style'), 'background-image')
          .replace(/^.*\(\/\/(.*)\)$/gm, '$1'),
          url: `flickr.com/${child.firstChild.getAttribute('href')}`,
          title: child.firstChild.getAttribute('title')
        })
        child.remove()
      }
      result_cb.end(JSON.stringify(album_list, null, 4))
    })
  }).on('error', (e) => {
    console.error(`Got error: ${e.message}`)
  })
}
function keyvalues(text, search_key) {
  let return_a = text.split(';').map(
    t => t.trim().split(':').map(
      t => t.trim()
    )
  ).map(a => {
    let o = {}
    o[a[0]] = a[1]
    return Object.entries(o)
  })

  let return_o = {}
  return_a.flat(1).forEach(e => {
    return_o[e[0]] = e[1]
  })
  return return_o[search_key]
}
